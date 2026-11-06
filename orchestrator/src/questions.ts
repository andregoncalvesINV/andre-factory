import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

export type Question = {
  id: string;
  question: string;
  options?: string[];
  recommendation?: string;
  why?: string;
};

// Asks each question in the terminal and appends the answers to decisions.md (shared rule 6: answers are binding).
export async function askQuestions(questions: Question[], decisionsFile: string, stageDir: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const today = new Date().toISOString().slice(0, 10);
  if (!existsSync(decisionsFile)) writeFileSync(decisionsFile, '# Decisions\n');

  try {
    for (const q of questions) {
      const options = q.options ?? [];
      console.log(`\n? ${q.question}`);
      options.forEach((o, i) => console.log(`  ${i + 1}) ${o}${o === q.recommendation ? '  (recommended)' : ''}`));
      if (q.why) console.log(`  Why: ${q.why}`);

      const hint = q.recommendation ? ', Enter = recommended' : '';
      const raw = (await rl.question(`  Your choice (number or your own answer${hint}): `)).trim();
      const picked = Number(raw);
      const answer =
        raw === '' ? q.recommendation ?? ''
        : Number.isInteger(picked) && picked >= 1 && picked <= options.length ? options[picked - 1]
        : raw;

      appendFileSync(
        decisionsFile,
        `\n## ${q.id}: ${q.question}\n- **Answer:** ${answer}\n- **Date:** ${today}\n- **Asked by:** stage ${stageDir} (orchestrator)\n`,
      );
      console.log(`  → ${answer}`);
    }
  } finally {
    rl.close();
  }
}
