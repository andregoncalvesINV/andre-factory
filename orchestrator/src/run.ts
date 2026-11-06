import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, loadConfig, usedAdapters } from './config.ts';
import { buildPrompt } from './prompt.ts';
import { askQuestions, type Question } from './questions.ts';
import { mainLine, prepareTicket, resolveStage, StageNotWrittenError } from './stage.ts';
import type { Adapter, AgentCommand } from './types.ts';

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

function start(cmd: AgentCommand): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd.command, cmd.args, { cwd: cmd.cwd, stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (err: NodeJS.ErrnoException) =>
      reject(err.code === 'ENOENT' ? new Error(`"${cmd.command}" isn't installed or isn't on PATH.`) : err),
    );
    child.on('close', (code) => resolve(code ?? 1));
  });
}

function readJson<T>(file: string): T | undefined {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : undefined;
}

// Runs one stage with the agent set in config.yaml. Returns the process exit code.
export async function runStage(opts: RunOptions): Promise<number> {
  const project = path.resolve(opts.project);
  if (!existsSync(project)) throw new Error(`Project folder not found: ${project}`);

  const config = loadConfig();
  const stage = resolveStage(opts.stage);
  const stageConfig = config.stages[stage.key];
  if (!stageConfig || stageConfig.adapter === 'none') {
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
  const statusFile = path.join(workingFolder, 'status.json');
  const questionsFile = path.join(workingFolder, 'questions.json');

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const prompt = buildPrompt({
      stage,
      project,
      ticketId,
      workingFolder,
      agent: stageConfig.adapter,
      model: stageConfig.model,
      agentsInUse: usedAdapters(config),
    });
    const cmd = adapter.command({ prompt, project, factory: FACTORY_ROOT, model: stageConfig.model });

    if (opts.dryRun) {
      console.log(`[dry run] would start: ${cmd.command} ${cmd.args.slice(0, -1).join(' ')} <prompt>  (in ${cmd.cwd})\n`);
      console.log(prompt);
      return 0;
    }

    console.log(`\n▶ Stage ${stage.dir} with ${stageConfig.adapter}${round > 1 ? ` (round ${round})` : ''}\n`);
    mkdirSync(workingFolder, { recursive: true });
    rmSync(statusFile, { force: true });
    rmSync(questionsFile, { force: true });

    const exitCode = await start(cmd);
    const status = readJson<{ status: string; summary?: string }>(statusFile);

    if (!status) {
      console.error(`\n✗ ${stageConfig.adapter} finished (exit code ${exitCode}) without writing status.json.`);
      return 1;
    }
    if (status.status === 'done') {
      console.log(`\n✓ Stage ${stage.dir} done: ${status.summary ?? ''}`);
      return 0;
    }
    if (status.status === 'failed') {
      console.error(`\n✗ Stage ${stage.dir} failed: ${status.summary ?? ''}`);
      return 1;
    }
    if (status.status === 'needs_input') {
      const questions = readJson<{ questions?: Question[] }>(questionsFile)?.questions ?? [];
      if (!questions.length) {
        console.error('\n✗ The agent asked for input but wrote no questions.json.');
        return 1;
      }
      console.log(`\nThe agent needs ${questions.length} decision(s):`);
      await askQuestions(questions, path.join(workingFolder, 'decisions.md'), stage.dir);
      continue;
    }
    console.error(`\n✗ Unknown status "${status.status}" in status.json.`);
    return 1;
  }

  console.error(`\n✗ Stopped after ${MAX_ROUNDS} question rounds.`);
  return 1;
}

// Runs the whole line from stage 00, stopping at the first stage that fails or isn't written yet.
export async function runAll(opts: Omit<RunOptions, 'stage'>): Promise<number> {
  const plugged = existsSync(path.join(path.resolve(opts.project), '.factory', 'factory.yaml'));

  for (const stage of mainLine()) {
    if (stage === '00' && plugged) {
      console.log('▷ Stage 00 skipped: the project is already plugged in.');
      continue;
    }
    try {
      const code = await runStage({ ...opts, stage });
      if (code !== 0) return code;
    } catch (err) {
      if (!(err instanceof StageNotWrittenError)) throw err;
      console.log(`\n■ Stopped: ${err.message}`);
      return 0;
    }
  }
  console.log('\n✓ All stages done.');
  return 0;
}
