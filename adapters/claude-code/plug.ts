import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { PlugRequest, PlugResult } from '../../orchestrator/src/types.ts';

// Claude Code setup for a plugged project. The only place in the factory that touches Claude Code files.
export function plug({ project, factory }: PlugRequest): PlugResult {
  const result: PlugResult = { changed: [], notes: [] };

  // 1. Read access to the factory folder.
  const settingsFile = path.join(project, '.claude', 'settings.local.json');
  const settings = existsSync(settingsFile) ? JSON.parse(readFileSync(settingsFile, 'utf8')) : {};
  settings.permissions ??= {};
  settings.permissions.additionalDirectories ??= [];
  if (!settings.permissions.additionalDirectories.includes(factory)) {
    settings.permissions.additionalDirectories.push(factory);
    mkdirSync(path.dirname(settingsFile), { recursive: true });
    writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
    result.changed.push('.claude/settings.local.json');
  }
  try {
    execFileSync('git', ['check-ignore', '-q', '.claude/settings.local.json'], { cwd: project });
  } catch {
    result.notes.push('.claude/settings.local.json is not ignored by git; consider adding it to .gitignore.');
  }

  // 2. Claude Code reads CLAUDE.md, not AGENTS.md: import it, if AGENTS.md has the Factory section.
  const agentsFile = path.join(project, 'AGENTS.md');
  if (existsSync(agentsFile) && readFileSync(agentsFile, 'utf8').includes('## Factory')) {
    const claudeFile = path.join(project, 'CLAUDE.md');
    const claude = existsSync(claudeFile) ? readFileSync(claudeFile, 'utf8') : '';
    if (!claude.split('\n').some((line) => line.trim() === '@AGENTS.md')) {
      writeFileSync(claudeFile, claude ? `${claude.trimEnd()}\n\n@AGENTS.md\n` : '@AGENTS.md\n');
      result.changed.push('CLAUDE.md');
    }
  }

  return result;
}
