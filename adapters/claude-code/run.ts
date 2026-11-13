import type { AgentCommand, AgentRequest } from '../../orchestrator/src/types.ts';

// Runs Claude Code non-interactively (-p) inside the project.
// acceptEdits lets it write files without prompts; shell access is limited to read-only git commands for now.
export function command({ prompt, project, factory, model, effort }: AgentRequest): AgentCommand {
  const args = ['-p', prompt, '--permission-mode', 'acceptEdits', '--add-dir', factory];
  if (model) args.push('--model', model);
  if (effort) args.push('--effort', effort);
  args.push('--allowedTools', 'Bash(git status:*)', 'Bash(git rev-parse:*)', 'Bash(git check-ignore:*)');
  return { command: 'claude', args, cwd: project };
}
