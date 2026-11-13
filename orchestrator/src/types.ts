// The contract between the orchestrator and an agent adapter.
// Each adapters/<agent>/run.ts exports `command(request)` and nothing vendor-specific leaks out of it.

export type AgentRequest = {
  prompt: string;   // the full stage prompt, as text
  project: string;  // absolute path; the agent runs inside it
  factory: string;  // absolute path of the factory root
  model?: string;   // from config.yaml, if set
  effort?: string;  // reasoning effort, from config.yaml, if set (levels are per agent)
};

export type AgentCommand = {
  command: string;  // executable to start
  args: string[];
  cwd: string;
};

// What an agent spent, as far as it reports it. inputTokens includes cachedInputTokens.
export type Usage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  costUsd?: number;   // only if the agent reports it
  turns?: number;
  models?: string[];  // models the agent actually used
};

// One line of the agent's output, read by the adapter: text to show, and/or usage to add up.
export type ParsedLine = { text?: string; usage?: Usage };

export type Adapter = {
  command(request: AgentRequest): AgentCommand;
  // Optional. With it, the orchestrator reads the agent's output line by line (for usage stats).
  // Without it, the output goes straight to the terminal and only the time is measured.
  parseLine?(line: string): ParsedLine;
};

// Optional adapters/<agent>/plug.ts: one-time project setup for that agent, run after stage 00.
export type PlugRequest = { project: string; factory: string };
export type PlugResult = { changed: string[]; notes: string[] };
export type Plug = { plug(request: PlugRequest): PlugResult };
