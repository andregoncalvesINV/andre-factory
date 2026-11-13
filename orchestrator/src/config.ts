import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

// orchestrator/src/ → factory root
export const FACTORY_ROOT = path.resolve(import.meta.dirname, '../..');

// One way to run a stage. A stage lists one or more; exactly one is active.
// skills: ours (skills/<name>.md, pasted into the prompt). nativeSkills: built into this option's agent.
export type StageConfig = {
  adapter: string;
  model?: string;
  skills?: string[];
  nativeSkills?: string[];
  isActive?: boolean;
};

export type FactoryConfig = {
  stages: Record<string, StageConfig[]>;
  review?: { threshold?: number; max_loops?: number };
  git?: { mode?: string };
};

export function loadConfig(): FactoryConfig {
  const file = path.join(FACTORY_ROOT, 'config.yaml');
  return parse(readFileSync(file, 'utf8')) as FactoryConfig;
}

// The option with isActive: true. Throws unless there is exactly one.
export function activeOption(config: FactoryConfig, key: string): StageConfig {
  const options = config.stages[key];
  if (!Array.isArray(options)) {
    throw new Error(`config.yaml → stages.${key} must be a list of options (adapter, model, skills, isActive).`);
  }
  const active = options.filter((o) => o.isActive === true);
  if (active.length !== 1) {
    throw new Error(`config.yaml → stages.${key} needs exactly one option with isActive: true (found ${active.length}).`);
  }
  return active[0];
}

// Skills for one stage: the stage's own (config.yaml) plus the project's (.factory/project.yaml).
// Throws if a listed skill has no file in skills/.
export function stageSkills(stage: StageConfig, project: string): string[] {
  const projectFile = path.join(project, '.factory', 'project.yaml');
  const projectSkills = existsSync(projectFile)
    ? ((parse(readFileSync(projectFile, 'utf8')) as { skills?: string[] } | null)?.skills ?? [])
    : [];
  const names = [...new Set([...(stage.skills ?? []), ...projectSkills])];
  for (const name of names) {
    if (!existsSync(skillFile(name))) throw new Error(`Unknown skill "${name}": expected ${skillFile(name)}.`);
  }
  return names;
}

export function skillFile(name: string): string {
  return path.join(FACTORY_ROOT, 'skills', `${name}.md`);
}

// Every distinct agent listed in any stage, active or not, without "none".
// Stage 00 sets all of them up, so flipping isActive never needs a re-plug.
export function usedAdapters(config: FactoryConfig): string[] {
  const names = Object.values(config.stages).flat().map((s) => s.adapter);
  return [...new Set(names)].filter((name) => name && name !== 'none');
}
