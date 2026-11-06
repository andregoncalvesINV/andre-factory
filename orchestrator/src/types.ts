// The contract between the orchestrator and an agent adapter.
// Each adapters/<agent>/run.ts exports `command(request)` and nothing vendor-specific leaks out of it.

export type AgentRequest = {
  prompt: string;   // the full stage prompt, as text
  project: string;  // absolute path; the agent runs inside it
  factory: string;  // absolute path of the factory root
  model?: string;   // from config.yaml, if set
};

export type AgentCommand = {
  command: string;  // executable to start
  args: string[];
  cwd: string;
};

export type Adapter = {
  command(request: AgentRequest): AgentCommand;
};
