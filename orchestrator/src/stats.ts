import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Usage } from './types.ts';

// What one stage cost, over all its question rounds.
export type StageStats = {
  stage: string;
  ticket: string;
  agent: string;
  model?: string;    // from config.yaml
  effort?: string;
  status: string;    // done | failed | needs_input | error
  startedAt: string;
  durationMs: number;  // wall clock, including time spent answering questions
  agentMs: number;     // time the agent itself ran
  rounds: number;
  usage?: Usage;       // undefined if the agent reports none
};

export function emptyUsage(): Usage {
  return { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
}

export function addUsage(total: Usage, more: Usage): Usage {
  return {
    inputTokens: total.inputTokens + more.inputTokens,
    cachedInputTokens: total.cachedInputTokens + more.cachedInputTokens,
    outputTokens: total.outputTokens + more.outputTokens,
    costUsd: total.costUsd !== undefined || more.costUsd !== undefined ? (total.costUsd ?? 0) + (more.costUsd ?? 0) : undefined,
    turns: total.turns !== undefined || more.turns !== undefined ? (total.turns ?? 0) + (more.turns ?? 0) : undefined,
    models: [...new Set([...(total.models ?? []), ...(more.models ?? [])])],
  };
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function k(n: number): string {
  return n < 1000 ? String(n) : `${(n / 1000).toFixed(1)}k`;
}

export function formatUsage(u: Usage | undefined): string {
  if (!u) return 'no token data';
  const parts = [`${k(u.inputTokens)} in (${k(u.cachedInputTokens)} cached) / ${k(u.outputTokens)} out`];
  if (u.costUsd !== undefined) parts.push(`$${u.costUsd.toFixed(u.costUsd < 0.01 ? 4 : 2)}`);
  return parts.join(' · ');
}

// e.g. "3m 12s · codex · 48.2k in (31.0k cached) / 6.1k out · 2 rounds"
export function formatStats(s: StageStats): string {
  const parts = [formatDuration(s.durationMs), s.agent + (s.model ? ` (${s.model})` : ''), formatUsage(s.usage)];
  if (s.rounds > 1) parts.push(`${s.rounds} rounds`);
  return parts.join(' · ');
}

// One JSON line per stage run, in <project>/.factory/logs/stages.jsonl (git-ignored).
export function logStats(project: string, s: StageStats): void {
  const dir = path.join(project, '.factory', 'logs');
  mkdirSync(dir, { recursive: true });
  appendFileSync(path.join(dir, 'stages.jsonl'), JSON.stringify(s) + '\n');
}

// End of `factory run`: one row per stage, then totals per agent.
export function printSummary(all: StageStats[]): void {
  if (!all.length) return;
  console.log('\nSummary');
  for (const s of all) console.log(`  ${s.stage.padEnd(22)} ${s.status.padEnd(11)} ${formatStats(s)}`);

  const byAgent = new Map<string, { ms: number; usage?: Usage }>();
  for (const s of all) {
    const t = byAgent.get(s.agent) ?? { ms: 0 };
    t.ms += s.agentMs;
    if (s.usage) t.usage = addUsage(t.usage ?? emptyUsage(), s.usage);
    byAgent.set(s.agent, t);
  }
  console.log('  Per agent:');
  for (const [agent, t] of byAgent) console.log(`    ${agent.padEnd(20)} ${formatDuration(t.ms).padEnd(8)} ${formatUsage(t.usage)}`);
  const totalMs = all.reduce((sum, s) => sum + s.durationMs, 0);
  console.log(`  Total time: ${formatDuration(totalMs)}`);
}
