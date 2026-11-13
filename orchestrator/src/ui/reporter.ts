import type { Question } from '../questions.ts';
import type { StageStats } from '../stats.ts';

// How a run is shown to the operator. run.ts only emits these events and never prints itself,
// so a new way of showing runs (e.g. a web page) is just another Reporter.
// Today there are two: ui/plain.ts (plain text) and ui/dashboard.ts (full terminal dashboard).

export type StageRow = { dir: string; agent?: string };

export type StageStart = {
  dir: string;
  agent: string;
  model?: string;
  effort?: string;
  round: number;
  logFile: string;  // the agent's full output
};

export type StageEnd = {
  ok: boolean;
  message: string;   // e.g. "✓ Stage 01-context done: …"
  stats: StageStats;
  detail?: string[]; // on failure: the agent's last error lines
};

export type Reporter = {
  lineup(stages: StageRow[]): void;           // `factory run`: the stages that will run, in order
  stageStart(info: StageStart): void;
  activity(text: string): void;               // what the agent says or does, as it happens
  ask(questions: Question[], stageDir: string): Promise<string[]>;  // one answer per question
  stageEnd(info: StageEnd): void;
  skip(dir: string, reason: string): void;
  note(text: string): void;
  close(all: StageStats[], showSummary: boolean): Promise<void>;  // run over: leave the screen readable
};
