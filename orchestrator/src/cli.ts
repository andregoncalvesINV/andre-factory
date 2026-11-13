#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';
import { runAll, runStage, type RunResult } from './run.ts';
import { plainReporter } from './ui/plain.ts';
import type { Reporter } from './ui/reporter.ts';

const HELP = `andre-factory

Usage:
  factory run   --project <path> [--ticket <file>]      run the whole line, from stage 00
  factory stage <N> --project <path> [--ticket <file>]  run one stage (e.g. 0, 1, 6b)

Options:
  --project <path>   the project to work on (default: current folder)
  --ticket <file>    ticket text file, for stages that need one (02 and later)
  --plain            plain text output instead of the dashboard
  --dry-run          print the prompt and agent command without running anything
  -h, --help         show this help
`;

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      project: { type: 'string', default: process.cwd() },
      ticket: { type: 'string' },
      plain: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  const [command, stageArg] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 1;
  }
  if (command !== 'run' && command !== 'stage') throw new Error(`Unknown command "${command}". Run "factory --help".`);
  if (command === 'stage' && !stageArg) throw new Error('Which stage? Example: factory stage 01 --project <path>');

  // The dashboard needs a real terminal (it reads arrow keys); otherwise, plain text.
  const plain = values.plain || values['dry-run'] || !process.stdout.isTTY || !process.stdin.isTTY;
  const header = [path.basename(path.resolve(values.project)), values.ticket ? `ticket ${path.basename(values.ticket)}` : '']
    .filter(Boolean)
    .join(' · ');
  const reporter: Reporter = plain ? plainReporter() : (await import('./ui/dashboard.ts')).dashboardReporter(header);

  const common = { project: values.project, ticket: values.ticket, dryRun: values['dry-run'], reporter };
  let result: RunResult = { code: 1, all: [] };
  try {
    result = command === 'run' ? await runAll(common) : await runStage({ ...common, stage: stageArg });
  } finally {
    await reporter.close(result.all, command === 'run');
  }
  return result.code;
}

main().then(
  (code) => process.exit(code),
  (err: Error) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  },
);
