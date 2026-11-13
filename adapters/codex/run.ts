import type { AgentCommand, AgentRequest } from '../../orchestrator/src/types.ts';

// Runs Codex non-interactively inside the project. Its sandbox only allows writes inside the project.
export function command({ prompt, project, model, effort }: AgentRequest): AgentCommand {
  const args = ['exec', '--cd', project, '--sandbox', 'workspace-write'];
  if (model) args.push('--model', model);
  if (effort) args.push('-c', `model_reasoning_effort="${effort}"`);
  args.push('--', prompt);
  return { command: 'codex', args, cwd: project };
}
