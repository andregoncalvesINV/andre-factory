import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

// orchestrator/src/ → factory root
export const FACTORY_ROOT = path.resolve(import.meta.dirname, '../..');

export type StageConfig = { adapter: string; model?: string };

export type FactoryConfig = {
  stages: Record<string, StageConfig>;
  review?: { threshold?: number; max_loops?: number };
  git?: { mode?: string };
};

export function loadConfig(): FactoryConfig {
  const file = path.join(FACTORY_ROOT, 'config.yaml');
  return parse(readFileSync(file, 'utf8')) as FactoryConfig;
}

// Every distinct agent used by any stage, without "none".
export function usedAdapters(config: FactoryConfig): string[] {
  const names = Object.values(config.stages).map((s) => s.adapter);
  return [...new Set(names)].filter((name) => name && name !== 'none');
}
