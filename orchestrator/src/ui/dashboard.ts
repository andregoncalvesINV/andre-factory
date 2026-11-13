import { Box, render, Text, useInput, useWindowSize } from 'ink';
import { createElement as h, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Question } from '../questions.ts';
import { formatDuration, formatUsage, printSummary, type StageStats } from '../stats.ts';
import type { Reporter } from './reporter.ts';

// Full-screen-ish terminal dashboard (Ink = React for terminals).
// Written with createElement (h) instead of JSX, so Node runs it with no build step.

type Status = 'pending' | 'running' | 'asking' | 'done' | 'failed' | 'skipped';
type Row = { dir: string; agent?: string; model?: string; status: Status; startedAt?: number; round?: number; stats?: StageStats };
type Asking = { q: Question; index: number; total: number; resolve: (answer: string) => void };
type State = {
  rows: Row[];
  activity: string[];
  logFile?: string;
  asking?: Asking;
  message?: { ok: boolean; text: string; detail?: string[] };
  notes: string[];
};

const ACTIVITY_LINES = 8;
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const OTHER = 'Other (type your own answer)';

class Store {
  state: State = { rows: [], activity: [], notes: [] };
  private listeners = new Set<() => void>();
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };
  get = () => this.state;
  set(change: (s: State) => Partial<State>) {
    this.state = { ...this.state, ...change(this.state) };
    this.listeners.forEach((fn) => fn());
  }
  updateRow(dir: string, change: Partial<Row>) {
    this.set((s) => {
      const exists = s.rows.some((r) => r.dir === dir);
      const rows = exists
        ? s.rows.map((r) => (r.dir === dir ? { ...r, ...change } : r))
        : [...s.rows, { dir, status: 'pending' as Status, ...change }];
      return { rows };
    });
  }
}

// ---------- components ----------

function useTick(ms: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return tick;
}

function StageLine({ row, tick }: { row: Row; tick: number }): ReactNode {
  const icon: Record<Status, [string, string]> = {
    pending: ['○', 'gray'],
    running: [SPINNER[tick % SPINNER.length], 'cyan'],
    asking: ['?', 'yellow'],
    done: ['✓', 'green'],
    failed: ['✗', 'red'],
    skipped: ['▷', 'gray'],
  };
  const [symbol, color] = icon[row.status];
  const live = row.status === 'running' || row.status === 'asking';
  const time = row.stats ? formatDuration(row.stats.durationMs) : live && row.startedAt ? formatDuration(Date.now() - row.startedAt) : '';
  const info = row.stats
    ? formatUsage(row.stats.usage) + (row.stats.rounds > 1 ? ` · ${row.stats.rounds} rounds` : '')
    : row.status === 'asking' ? 'waiting for your answer'
    : row.status === 'running' && (row.round ?? 1) > 1 ? `round ${row.round}`
    : row.status === 'skipped' ? 'skipped'
    : '';
  // Fixed-width columns that never shrink; only the info column is cut to fit the terminal.
  const col = (width: number, child: ReactNode) => h(Box, { width, flexShrink: 0 }, child);
  return h(
    Box,
    {},
    col(2, h(Text, { color }, symbol)),
    col(21, h(Text, { bold: live, dimColor: row.status === 'pending' || row.status === 'skipped', wrap: 'truncate-end' }, row.dir)),
    col(13, h(Text, { color: 'blue', wrap: 'truncate-end' }, row.agent ?? '')),
    col(8, h(Text, {}, time)),
    h(Box, { flexGrow: 1, flexShrink: 1, minWidth: 0 }, h(Text, { dimColor: true, wrap: 'truncate-end' }, info)),
  );
}

function QuestionBox({ asking }: { asking: Asking }): ReactNode {
  const { q } = asking;
  const options = [...(q.options ?? []), OTHER];
  const recommended = Math.max(0, options.indexOf(q.recommendation ?? ''));
  const [cursor, setCursor] = useState(recommended);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');

  useInput((input, key) => {
    if (typing) {
      if (key.return && text.trim()) asking.resolve(text.trim());
      else if (key.escape) setTyping(false);
      else if (key.backspace || key.delete) setText((t) => t.slice(0, -1));
      else if (input && !key.ctrl && !key.meta) setText((t) => t + input);
      return;
    }
    if (key.upArrow) setCursor((c) => (c - 1 + options.length) % options.length);
    if (key.downArrow) setCursor((c) => (c + 1) % options.length);
    if (key.return) {
      if (options[cursor] === OTHER) setTyping(true);
      else asking.resolve(options[cursor]);
    }
  });

  return h(
    Box,
    { flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', paddingX: 1, marginTop: 1 },
    h(Text, { color: 'yellow', bold: true }, `Question ${asking.index + 1}/${asking.total}`),
    h(Text, { bold: true }, q.question),
    q.why ? h(Text, { dimColor: true }, `Why: ${q.why}`) : null,
    h(Box, { flexDirection: 'column', marginTop: 1 },
      ...options.map((o, i) =>
        h(Text, { key: i, color: i === cursor ? 'cyan' : undefined },
          `${i === cursor ? '❯' : ' '} ${o}${o === q.recommendation ? '  (recommended)' : ''}`),
      ),
    ),
    typing ? h(Text, { color: 'cyan' }, `> ${text}█`) : null,
    h(Text, { dimColor: true }, typing ? 'Enter to send · Esc to go back' : '↑/↓ to choose · Enter to confirm'),
  );
}

function App({ store, header, onInterrupt }: { store: Store; header: string; onInterrupt: () => void }): ReactNode {
  const state = useSyncExternalStore(store.subscribe, store.get);
  const tick = useTick(120);
  const { columns } = useWindowSize();
  useInput((input, key) => {
    if (key.ctrl && input === 'c') onInterrupt();
  });

  const width = Math.max(40, (columns || 100) - 1);
  return h(
    Box,
    { flexDirection: 'column', width },
    h(Box, { flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 1 },
      h(Text, { bold: true }, 'andre-factory', h(Text, { dimColor: true }, `  ${header}`)),
      h(Box, { flexDirection: 'column', marginTop: 1 },
        ...state.rows.map((row) => h(StageLine, { key: row.dir, row, tick })),
      ),
      h(Box, { marginTop: 1 }, h(Text, { dimColor: true }, '─ activity ' + '─'.repeat(Math.max(0, width - 16)))),
      ...Array.from({ length: ACTIVITY_LINES }, (_, i) => {
        const line = state.activity[state.activity.length - ACTIVITY_LINES + i];
        return h(Text, { key: i, wrap: 'truncate-end', dimColor: i < ACTIVITY_LINES - 3 }, line ?? ' ');
      }),
      ...state.notes.map((n, i) => h(Text, { key: `n${i}`, color: 'gray' }, n)),
      state.message
        ? h(Box, { flexDirection: 'column', marginTop: 1 },
            h(Text, { color: state.message.ok ? 'green' : 'red', bold: true }, state.message.text),
            ...(state.message.detail ?? []).map((d, i) => h(Text, { key: i, color: 'red', dimColor: true, wrap: 'truncate-end' }, `│ ${d}`)),
          )
        : null,
      state.logFile ? h(Text, { dimColor: true, wrap: 'truncate-middle' }, `full output: ${state.logFile}`) : null,
    ),
    state.asking ? h(QuestionBox, { key: `${state.asking.q.id}-${state.asking.index}`, asking: state.asking }) : null,
  );
}

// ---------- reporter ----------

export function dashboardReporter(header: string): Reporter {
  const store = new Store();
  const app = render(
    h(App, {
      store,
      header,
      onInterrupt: () => {
        app.unmount();
        console.error('\n✗ Stopped by you (Ctrl+C).');
        process.exit(130);
      },
    }),
    { exitOnCtrlC: false, patchConsole: true },
  );

  return {
    lineup(stages) {
      store.set(() => ({ rows: stages.map((s) => ({ ...s, status: 'pending' as Status })) }));
    },

    stageStart({ dir, agent, model, round, logFile }) {
      const startedAt = store.get().rows.find((r) => r.dir === dir)?.startedAt;
      store.updateRow(dir, { agent, model, status: 'running', round, startedAt: round > 1 && startedAt ? startedAt : Date.now() });
      store.set((s) => ({ logFile, message: undefined, activity: round > 1 ? s.activity : [] }));
    },

    activity(text) {
      const lines = text.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
      if (lines.length) store.set((s) => ({ activity: [...s.activity, ...lines].slice(-200) }));
    },

    async ask(questions, stageDir) {
      const answers: string[] = [];
      const dir = store.get().rows.find((r) => r.status === 'running')?.dir ?? stageDir;
      store.updateRow(dir, { status: 'asking' });
      for (const [index, q] of questions.entries()) {
        const answer = await new Promise<string>((resolve) =>
          store.set(() => ({ asking: { q, index, total: questions.length, resolve } })),
        );
        store.set((s) => ({ asking: undefined, activity: [...s.activity, `→ ${q.id}: ${answer}`] }));
        answers.push(answer);
      }
      store.updateRow(dir, { status: 'running' });
      return answers;
    },

    stageEnd({ ok, message, stats, detail }) {
      store.updateRow(stats.stage, { status: ok ? 'done' : 'failed', stats });
      store.set(() => ({ message: { ok, text: message, detail } }));
    },

    skip(dir, reason) {
      store.updateRow(dir, { status: 'skipped' });
      store.set((s) => ({ notes: [...s.notes, `▷ ${dir}: ${reason}`] }));
    },

    note(text) {
      store.set((s) => ({ notes: [...s.notes, text] }));
    },

    async close(all, showSummary) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // let the last frame render
      app.unmount();
      await app.waitUntilExit();
      if (showSummary) printSummary(all);
    },
  };
}
