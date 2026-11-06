#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { runAll, runStage } from './run.ts';

const HELP = `andre-factory

Usage:
  factory run   --project <path> [--ticket <file>]      run the whole line, from stage 00
  factory stage <N> --project <path> [--ticket <file>]  run one stage (e.g. 0, 1, 6b)

Options:
  --project <path>   the project to work on (default: current folder)
  --ticket <file>    ticket text file, for stages that need one (02 and later)
  --dry-run          print the prompt and agent command without running anything
  -h, --help         show this help
`;

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      project: { type: 'string', default: process.cwd() },
      ticket: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  const [command, stageArg] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 1;
  }

  const common = { project: values.project, ticket: values.ticket, dryRun: values['dry-run'] };
  if (command === 'run') return runAll(common);
  if (command === 'stage') {
    if (!stageArg) throw new Error('Which stage? Example: factory stage 01 --project <path>');
    return runStage({ ...common, stage: stageArg });
  }
  throw new Error(`Unknown command "${command}". Run "factory --help".`);
}

main().then(
  (code) => process.exit(code),
  (err: Error) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  },
);
