import { createInterface } from 'node:readline/promises';
import type { Question } from '../questions.ts';
import { formatStats, printSummary } from '../stats.ts';
import type { Reporter } from './reporter.ts';

// Plain text, line by line. Used with --plain, --dry-run, or when not in a real terminal (pipes, CI).
export function plainReporter(): Reporter {
  return {
    lineup() {},

    stageStart({ dir, agent, round, logFile }) {
      console.log(`\n▶ Stage ${dir} with ${agent}${round > 1 ? ` (round ${round})` : ''}  (full output: ${logFile})\n`);
    },

    activity(text) {
      console.log(text);
    },

    async ask(questions: Question[]) {
      console.log(`\nThe agent needs ${questions.length} decision(s):`);
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answers: string[] = [];
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
          console.log(`  → ${answer}`);
          answers.push(answer);
        }
      } finally {
        rl.close();
      }
      return answers;
    },

    stageEnd({ ok, message, stats, detail }) {
      const out = ok ? console.log : console.error;
      out(`\n${message}\n  ${formatStats(stats)}`);
      detail?.forEach((line) => out(`  │ ${line}`));
    },

    skip(dir, reason) {
      console.log(`▷ Stage ${dir} skipped: ${reason}`);
    },

    note(text) {
      console.log(text);
    },

    async close(all, showSummary) {
      if (showSummary) printSummary(all);
    },
  };
}
