import type { AgentCommand, AgentRequest, ParsedLine } from '../../orchestrator/src/types.ts';

// Runs Claude Code non-interactively (-p) inside the project.
// acceptEdits lets it write files without prompts; shell access is limited to read-only git commands for now.
// stream-json makes it print one JSON event per line, so parseLine can show its text and read its usage.
export function command({ prompt, project, factory, model, effort }: AgentRequest): AgentCommand {
  const args = ['-p', prompt, '--permission-mode', 'acceptEdits', '--add-dir', factory];
  if (model) args.push('--model', model);
  if (effort) args.push('--effort', effort);
  args.push('--output-format', 'stream-json', '--verbose');
  args.push('--allowedTools', 'Bash(git status:*)', 'Bash(git rev-parse:*)', 'Bash(git check-ignore:*)');
  return { command: 'claude', args, cwd: project };
}

type ContentBlock = { type: string; text?: string; name?: string };
type ModelUsage = { inputTokens?: number; outputTokens?: number; cacheReadInputTokens?: number; cacheCreationInputTokens?: number };

export function parseLine(line: string): ParsedLine {
  let event: any;
  try {
    event = JSON.parse(line);
  } catch {
    return { text: line };
  }

  if (event.type === 'assistant') {
    const blocks: ContentBlock[] = event.message?.content ?? [];
    const text = blocks
      .map((b) => (b.type === 'text' ? b.text : b.type === 'tool_use' ? `  · ${b.name}` : undefined))
      .filter(Boolean)
      .join('\n');
    return text ? { text } : {};
  }

  // The last event: totals for the whole run, per model (includes any helper models it used).
  if (event.type === 'result') {
    const perModel: Record<string, ModelUsage> = event.modelUsage ?? {};
    const usage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
    for (const m of Object.values(perModel)) {
      const cached = m.cacheReadInputTokens ?? 0;
      usage.inputTokens += (m.inputTokens ?? 0) + cached + (m.cacheCreationInputTokens ?? 0);
      usage.cachedInputTokens += cached;
      usage.outputTokens += m.outputTokens ?? 0;
    }
    return {
      usage: { ...usage, costUsd: event.total_cost_usd, turns: event.num_turns, models: Object.keys(perModel) },
    };
  }

  return {};
}
