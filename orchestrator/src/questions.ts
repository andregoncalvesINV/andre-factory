import { appendFileSync, existsSync, writeFileSync } from 'node:fs';

export type Question = {
  id: string;
  question: string;
  options?: string[];
  recommendation?: string;
  why?: string;
};

// Appends one answer to decisions.md (shared rule 6: answers are binding).
// How the question is asked is up to the reporter (ui/plain.ts, ui/dashboard.ts).
export function recordAnswer(decisionsFile: string, q: Question, answer: string, stageDir: string): void {
  if (!existsSync(decisionsFile)) writeFileSync(decisionsFile, '# Decisions\n');
  const today = new Date().toISOString().slice(0, 10);
  appendFileSync(
    decisionsFile,
    `\n## ${q.id}: ${q.question}\n- **Answer:** ${answer}\n- **Date:** ${today}\n- **Asked by:** stage ${stageDir} (orchestrator)\n`,
  );
}
