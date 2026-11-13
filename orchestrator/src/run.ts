import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { activeOption, FACTORY_ROOT, loadConfig, stageSkills, usedAdapters } from './config.ts';
import { buildPrompt } from './prompt.ts';
import { recordAnswer, type Question } from './questions.ts';
import { mainLine, mainLineDirs, prepareTicket, resolveStage, StageNotWrittenError } from './stage.ts';
import { addUsage, emptyUsage, logStats, type StageStats } from './stats.ts';
import type { Adapter, AgentCommand, Plug, Usage } from './types.ts';
import type { Reporter } from './ui/reporter.ts';

const MAX_ROUNDS = 5;   // question rounds before giving up
const ERROR_TAIL = 10;  // agent error lines shown when a stage fails

export type RunOptions = {
  stage: string;
  project: string;
  ticket?: string;
  dryRun?: boolean;
  reporter: Reporter;
};

export type RunResult = { code: number; all: StageStats[] };

async function loadAdapter(name: string): Promise<Adapter> {
  const file = path.join(FACTORY_ROOT, 'adapters', name, 'run.ts');
  if (!existsSync(file)) throw new Error(`No adapter "${name}": expected ${file}.`);
  return (await import(file)) as Adapter;
}

type AgentRun = { code: number; usage?: Usage; errors: string[] };

// Starts the agent. Everything it prints goes to logFile. Its output is read line by line
// (through the adapter's parseLine, if it has one): text goes to the reporter, usage is added up.
function start(cmd: AgentCommand, logFile: string, reporter: Reporter, parseLine?: Adapter['parseLine']): Promise<AgentRun> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd.command, cmd.args, { cwd: cmd.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    const stopChild = () => child.kill();
    process.once('exit', stopChild);

    let usage: Usage | undefined;
    const errors: string[] = [];
    const out = createInterface({ input: child.stdout });
    const err = createInterface({ input: child.stderr });
    out.on('line', (line) => {
      appendFileSync(logFile, line + '\n');
      if (!line.trim()) return;
      const parsed = parseLine ? parseLine(line) : { text: line };
      if (parsed.text) reporter.activity(parsed.text);
      if (parsed.usage) usage = addUsage(usage ?? emptyUsage(), parsed.usage);
    });
    err.on('line', (line) => {
      appendFileSync(logFile, `[stderr] ${line}\n`);
      if (line.trim()) errors.push(line);
      if (errors.length > ERROR_TAIL) errors.shift();
    });
    const closed = Promise.all([new Promise((r) => out.on('close', r)), new Promise((r) => err.on('close', r))]);

    child.on('error', (e: NodeJS.ErrnoException) =>
      reject(e.code === 'ENOENT' ? new Error(`"${cmd.command}" isn't installed or isn't on PATH.`) : e),
    );
    child.on('close', (code) =>
      closed.then(() => {
        process.removeListener('exit', stopChild);
        resolve({ code: code ?? 1, usage, errors });
      }),
    );
  });
}

// After stage 00: each listed agent's own setup (adapters/<agent>/plug.ts), if it has any.
async function plugAgents(agents: string[], project: string, reporter: Reporter): Promise<void> {
  for (const name of agents) {
    const file = path.join(FACTORY_ROOT, 'adapters', name, 'plug.ts');
    if (!existsSync(file)) continue;
    const { changed, notes } = ((await import(file)) as Plug).plug({ project, factory: FACTORY_ROOT });
    reporter.note(`${name} setup: ${changed.length ? changed.join(', ') : 'nothing to change'}`);
    notes.forEach((note) => reporter.note(`! ${note}`));
  }
}

function readJson<T>(file: string): T | undefined {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : undefined;
}

function timestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Runs one stage with the agent set in config.yaml.
export async function runStage(opts: RunOptions): Promise<RunResult> {
  const { code, stats } = await runOne(opts);
  return { code, all: stats ? [stats] : [] };
}

async function runOne(opts: RunOptions): Promise<{ code: number; stats?: StageStats }> {
  const { reporter } = opts;
  const project = path.resolve(opts.project);
  if (!existsSync(project)) throw new Error(`Project folder not found: ${project}`);

  const config = loadConfig();
  const stage = resolveStage(opts.stage);
  if (!config.stages[stage.key]) throw new Error(`No entry for stage ${stage.dir} in config.yaml (stages.${stage.key}).`);
  const stageConfig = activeOption(config, stage.key);
  if (stageConfig.adapter === 'none') {
    throw new Error(`No agent set for stage ${stage.dir} (config.yaml → stages.${stage.key}).`);
  }

  let ticketId = 'none';
  let workingFolder = path.join(project, '.factory');
  if (stage.needsTicket) {
    if (!opts.ticket) throw new Error(`Stage ${stage.dir} needs a ticket: add --ticket <file>.`);
    if (!opts.dryRun) {
      const ticket = prepareTicket(project, opts.ticket);
      ticketId = ticket.id;
      workingFolder = ticket.folder;
    } else {
      ticketId = path.basename(opts.ticket, path.extname(opts.ticket)).replace(/^ticket-/, '');
      workingFolder = path.join(project, '.factory', 'tickets', `ticket-${ticketId}`);
    }
  }

  const adapter = await loadAdapter(stageConfig.adapter);
  const skills = stageSkills(stageConfig, project);
  const statusFile = path.join(workingFolder, 'status.json');
  const questionsFile = path.join(workingFolder, 'questions.json');

  const startedAt = new Date();
  const logDir = path.join(project, '.factory', 'logs');
  const logFile = path.join(logDir, `${stage.dir}-${timestamp(startedAt)}.log`);
  let agentMs = 0;
  let rounds = 0;
  let usage: Usage | undefined;
  // Every way out after the agent ran: report, log the stats, return.
  const finish = (code: number, status: string, message: string, detail?: string[]) => {
    const stats: StageStats = {
      stage: stage.dir,
      ticket: ticketId,
      agent: stageConfig.adapter,
      model: stageConfig.model,
      effort: stageConfig.effort,
      status,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      agentMs,
      rounds,
      usage,
    };
    reporter.stageEnd({ ok: code === 0, message, stats, detail: detail?.length ? detail : undefined });
    logStats(project, stats);
    return { code, stats };
  };

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const prompt = buildPrompt({
      stage,
      project,
      ticketId,
      workingFolder,
      agent: stageConfig.adapter,
      model: stageConfig.model,
      agentsInUse: usedAdapters(config),
      skills,
      nativeSkills: stageConfig.nativeSkills ?? [],
    });
    const cmd = adapter.command({
      prompt,
      project,
      factory: FACTORY_ROOT,
      model: stageConfig.model,
      effort: stageConfig.effort,
    });

    if (opts.dryRun) {
      console.log(`[dry run] would start: ${cmd.command} ${cmd.args.slice(0, -1).join(' ')} <prompt>  (in ${cmd.cwd})\n`);
      console.log(prompt);
      return { code: 0 };
    }

    mkdirSync(workingFolder, { recursive: true });
    mkdirSync(logDir, { recursive: true });
    rmSync(statusFile, { force: true });
    rmSync(questionsFile, { force: true });
    appendFileSync(logFile, `=== round ${round} · ${new Date().toISOString()} · ${cmd.command} ===\n`);
    reporter.stageStart({
      dir: stage.dir,
      agent: stageConfig.adapter,
      model: stageConfig.model,
      effort: stageConfig.effort,
      round,
      logFile: path.relative(project, logFile),
    });

    const agentStart = Date.now();
    const run = await start(cmd, logFile, reporter, adapter.parseLine);
    agentMs += Date.now() - agentStart;
    rounds = round;
    if (run.usage) usage = addUsage(usage ?? emptyUsage(), run.usage);
    const status = readJson<{ status: string; summary?: string }>(statusFile);

    if (!status) {
      return finish(1, 'error', `✗ ${stageConfig.adapter} finished (exit code ${run.code}) without writing status.json.`, run.errors);
    }
    if (status.status === 'done') {
      const result = finish(0, 'done', `✓ Stage ${stage.dir} done: ${status.summary ?? ''}`);
      if (stage.key === 'plug') await plugAgents(usedAdapters(config), project, reporter);
      return result;
    }
    if (status.status === 'failed') {
      return finish(1, 'failed', `✗ Stage ${stage.dir} failed: ${status.summary ?? ''}`, run.errors);
    }
    if (status.status === 'needs_input') {
      const questions = readJson<{ questions?: Question[] }>(questionsFile)?.questions ?? [];
      if (!questions.length) {
        return finish(1, 'error', '✗ The agent asked for input but wrote no questions.json.');
      }
      const answers = await reporter.ask(questions, stage.dir);
      const decisions = path.join(workingFolder, 'decisions.md');
      questions.forEach((q, i) => recordAnswer(decisions, q, answers[i] ?? '', stage.dir));
      continue;
    }
    return finish(1, 'error', `✗ Unknown status "${status.status}" in status.json.`);
  }

  return finish(1, 'needs_input', `✗ Stopped after ${MAX_ROUNDS} question rounds.`);
}

// Runs the whole line from stage 00, stopping at the first stage that fails or isn't written yet.
export async function runAll(opts: Omit<RunOptions, 'stage'>): Promise<RunResult> {
  const { reporter } = opts;
  const plugged = existsSync(path.join(path.resolve(opts.project), '.factory', 'factory.yaml'));
  const all: StageStats[] = [];

  const config = loadConfig();
  reporter.lineup(
    mainLineDirs().map(({ dir, key }) => {
      try {
        const option = activeOption(config, key);
        return { dir, agent: option.adapter === 'none' ? 'no agent' : option.adapter };
      } catch {
        return { dir };
      }
    }),
  );

  for (const stage of mainLine()) {
    if (stage === '00' && plugged) {
      reporter.skip(mainLineDirs()[0].dir, 'the project is already plugged in');
      continue;
    }
    try {
      const { code, stats } = await runOne({ ...opts, stage });
      if (stats) all.push(stats);
      if (code !== 0) return { code, all };
    } catch (err) {
      if (!(err instanceof StageNotWrittenError)) throw err;
      reporter.note(`■ Stopped: ${err.message}`);
      return { code: 0, all };
    }
  }
  reporter.note('✓ All stages done.');
  return { code: 0, all };
}
