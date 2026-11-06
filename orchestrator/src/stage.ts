import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { FACTORY_ROOT } from './config.ts';

export type Contract = {
  stage?: string;
  ticket?: string;
  inputs?: { factory?: string[] };
};

export type Stage = {
  dir: string;           // e.g. "06b-review-gameplan"
  key: string;           // config.yaml key, e.g. "review_gameplan"
  prompt: string;
  contractText: string;
  contract: Contract;
  needsTicket: boolean;
};

const STAGES_DIR = path.join(FACTORY_ROOT, 'stages');

export class StageNotWrittenError extends Error {}

// The main line, in order: "00", "01", … "08". Branch stages like 06b only run inside loops.
export function mainLine(): string[] {
  return readdirSync(STAGES_DIR)
    .filter((d) => /^\d+-/.test(d))
    .sort()
    .map((d) => d.slice(0, d.indexOf('-')));
}

// "1" → "01", "6b" → "06b", "00" → "00"
function normalise(n: string): string {
  const match = /^(\d+)([a-z]?)$/i.exec(n.trim());
  if (!match) throw new Error(`"${n}" is not a stage number (examples: 00, 1, 6b).`);
  return match[1].padStart(2, '0') + match[2].toLowerCase();
}

export function resolveStage(n: string): Stage {
  const id = normalise(n);
  const dir = readdirSync(STAGES_DIR).find((d) => d.startsWith(`${id}-`));
  if (!dir) throw new Error(`No stage ${id} in ${STAGES_DIR}.`);

  const prompt = readFileSync(path.join(STAGES_DIR, dir, 'prompt.md'), 'utf8');
  if (prompt.trim().split('\n').length <= 1) {
    throw new StageNotWrittenError(`Stage ${dir} isn't written yet (its prompt.md is only a title).`);
  }
  const contractText = readFileSync(path.join(STAGES_DIR, dir, 'contract.yaml'), 'utf8');
  const contract = (parse(contractText) ?? {}) as Contract;

  return {
    dir,
    key: dir.replace(/^\d+[a-z]?-/, '').replaceAll('-', '_'),
    prompt,
    contractText,
    contract,
    needsTicket: contract.ticket !== 'none',
  };
}

export function readRules(): string {
  return readFileSync(path.join(STAGES_DIR, '_shared', 'rules.md'), 'utf8');
}

export type Ticket = { id: string; folder: string };

// Ticket file "ticket-123.txt" (or "123.md") → .factory/tickets/ticket-123/, with a copy as 00-ticket.md.
export function prepareTicket(project: string, ticketFile: string): Ticket {
  const source = path.resolve(ticketFile);
  if (!existsSync(source)) throw new Error(`Ticket file not found: ${source}`);
  const id = path.basename(source, path.extname(source)).replace(/^ticket-/, '');
  const folder = path.join(project, '.factory', 'tickets', `ticket-${id}`);
  mkdirSync(folder, { recursive: true });
  const copy = path.join(folder, '00-ticket.md');
  if (!existsSync(copy)) copyFileSync(source, copy);
  return { id, folder };
}
