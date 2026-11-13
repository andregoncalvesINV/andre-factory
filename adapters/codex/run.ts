import type { AgentCommand, AgentRequest, ParsedLine } from '../../orchestrator/src/types.ts';

// Runs Codex non-interactively inside the project. Its sandbox only allows writes inside the project.
// --json makes it print one JSON event per line, so parseLine can show its messages and read its usage.
export function command({ prompt, project, model, effort }: AgentRequest): AgentCommand {
  const args = ['exec', '--cd', project, '--sandbox', 'workspace-write', '--json'];
  if (model) args.push('--model', model);
  if (effort) args.push('-c', `model_reasoning_effort="${effort}"`);
  args.push('--', prompt);
  return { command: 'codex', args, cwd: project };
}

type Item = { type?: string; text?: string; command?: string; changes?: { path?: string }[] };

export function parseLine(line: string): ParsedLine {
  let event: any;
  try {
    event = JSON.parse(line);
  } catch {
    return { text: line };
  }

  if (event.type === 'item.completed') {
    const item: Item = event.item ?? {};
    if (item.type === 'agent_message' && item.text) return { text: item.text };
    if (item.type === 'command_execution' && item.command) return { text: `  · $ ${item.command}` };
    if (item.type === 'file_change') {
      const paths = (item.changes ?? []).map((c) => c.path).filter(Boolean);
      return paths.length ? { text: `  · edited ${paths.join(', ')}` } : {};
    }
    return {};
  }

  // One per turn; input_tokens already includes the cached ones. Codex doesn't report cost.
  if (event.type === 'turn.completed') {
    const u = event.usage ?? {};
    return {
      usage: {
        inputTokens: u.input_tokens ?? 0,
        cachedInputTokens: u.cached_input_tokens ?? 0,
        outputTokens: u.output_tokens ?? 0,
        turns: 1,
      },
    };
  }

  return {};
}
