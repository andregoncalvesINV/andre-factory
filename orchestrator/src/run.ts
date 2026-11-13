import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { activeOption, FACTORY_ROOT, loadConfig, stageSkills, usedAdapters } from './config.ts';
import { buildPrompt } from './prompt.ts';
import { askQuestions, type Question } from './questions.ts';
import { mainLine, prepareTicket, resolveStage, StageNotWrittenError } from './stage.ts';
import { addUsage, emptyUsage, formatStats, logStats, printSummary, type StageStats } from './stats.ts';
import type { Adapter, AgentCommand, Plug, Usage } from './types.ts';

const MAX_ROUNDS = 5; // question rounds before giving up

export type RunOptions = {
  stage: string;
  project: string;
  ticket?: string;
  dryRun?: boolean;
};

async function loadAdapter(name: string): Promise<Adapter> {
  const file = path.join(FACTORY_ROOT, 'adapters', name, 'run.ts');
  if (!existsSync(file)) throw new Error(`No adapter "${name}": expected ${file}.`);
  return (await import(file)) as Adapter;
}

// Starts the agent. With parseLine, its output is read line by line: text is shown, usage is added up.
function start(cmd: AgentCommand, parseLine?: Adapter['parseLine']): Promise<{ code: number; usage?: Usage }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd.command, cmd.args, {
      cwd: cmd.cwd,
      stdio: ['ignore', parseLine ? 'pipe' : 'inherit', 'inherit'],
    });
    let usage: Usage | undefined;
    let lines: Promise<void> = Promise.resolve();
    if (parseLine && child.stdout) {
      const reader = createInterface({ input: child.stdout });
      reader.on('line', (line) => {
        if (!line.trim()) return;
        const parsed = parseLine(line);
        if (parsed.text) console.log(parsed.text);
        if (parsed.usage) usage = addUsage(usage ?? emptyUsage(), parsed.usage);
      });
      lines = new Promise((done) => reader.on('close', () => done()));
    }
    child.on('error', (err: NodeJS.ErrnoException) =>
      reject(err.code === 'ENOENT' ? new Error(`"${cmd.command}" isn't installed or isn't on PATH.`) : err),
    );
    child.on('close', (code) => lines.then(() => resolve({ code: code ?? 1, usage })));
  });
}

// After stage 00: each listed agent's own setup (adapters/<agent>/plug.ts), if it has any.
async function plugAgents(agents: string[], project: string): Promise<void> {
  for (const name of agents) {
    const file = path.join(FACTORY_ROOT, 'adapters', name, 'plug.ts');
    if (!existsSync(file)) continue;
    const { changed, notes } = ((await import(file)) as Plug).plug({ project, factory: FACTORY_ROOT });
    console.log(`  ${name} setup: ${changed.length ? changed.join(', ') : 'nothing to change'}`);
    notes.forEach((note) => console.log(`  ! ${note}`));
  }
}

function readJson<T>(file: string): T | undefined {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : undefined;
}

// Runs one stage with the agent set in config.yaml. Returns the process exit code.
export async function runStage(opts: RunOptions): Promise<number> {
  return (await runStageWithStats(opts)).code;
}

type StageResult = { code: number; stats?: StageStats };

async function runStageWithStats(opts: RunOptions): Promise<StageResult> {
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
  let agentMs = 0;
  let rounds = 0;
  let usage: Usage | undefined;
  // Every way out after the agent ran: print the stats line, log it, return.
  const finish = (code: number, status: string, message: string): StageResult => {
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
    (code === 0 ? console.log : console.error)(`\n${message}\n  ${formatStats(stats)}`);
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

    console.log(`\n▶ Stage ${stage.dir} with ${stageConfig.adapter}${round > 1 ? ` (round ${round})` : ''}\n`);
    mkdirSync(workingFolder, { recursive: true });
    rmSync(statusFile, { force: true });
    rmSync(questionsFile, { force: true });

    const agentStart = Date.now();
    const run = await start(cmd, adapter.parseLine);
    agentMs += Date.now() - agentStart;
    rounds = round;
    if (run.usage) usage = addUsage(usage ?? emptyUsage(), run.usage);
    const status = readJson<{ status: string; summary?: string }>(statusFile);

    if (!status) {
      return finish(1, 'error', `✗ ${stageConfig.adapter} finished (exit code ${run.code}) without writing status.json.`);
    }
    if (status.status === 'done') {
      const result = finish(0, 'done', `✓ Stage ${stage.dir} done: ${status.summary ?? ''}`);
      if (stage.key === 'plug') await plugAgents(usedAdapters(config), project);
      return result;
    }
    if (status.status === 'failed') {
      return finish(1, 'failed', `✗ Stage ${stage.dir} failed: ${status.summary ?? ''}`);
    }
    if (status.status === 'needs_input') {
      const questions = readJson<{ questions?: Question[] }>(questionsFile)?.questions ?? [];
      if (!questions.length) {
        return finish(1, 'error', '✗ The agent asked for input but wrote no questions.json.');
      }
      console.log(`\nThe agent needs ${questions.length} decision(s):`);
      await askQuestions(questions, path.join(workingFolder, 'decisions.md'), stage.dir);
      continue;
    }
    return finish(1, 'error', `✗ Unknown status "${status.status}" in status.json.`);
  }

  return finish(1, 'needs_input', `✗ Stopped after ${MAX_ROUNDS} question rounds.`);
}

// Runs the whole line from stage 00, stopping at the first stage that fails or isn't written yet.
export async function runAll(opts: Omit<RunOptions, 'stage'>): Promise<number> {
  const plugged = existsSync(path.join(path.resolve(opts.project), '.factory', 'factory.yaml'));
  const all: StageStats[] = [];

  for (const stage of mainLine()) {
    if (stage === '00' && plugged) {
      console.log('▷ Stage 00 skipped: the project is already plugged in.');
      continue;
    }
    try {
      const { code, stats } = await runStageWithStats({ ...opts, stage });
      if (stats) all.push(stats);
      if (code !== 0) {
        printSummary(all);
        return code;
      }
    } catch (err) {
      if (!(err instanceof StageNotWrittenError)) throw err;
      console.log(`\n■ Stopped: ${err.message}`);
      printSummary(all);
      return 0;
    }
  }
  console.log('\n✓ All stages done.');
  printSummary(all);
  return 0;
}
