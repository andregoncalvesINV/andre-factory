# andre-factory: Plan

> Read this first, then `factory-progress.md`, to see what we're building and where we are.
> This file is the agreed blueprint. Change it only when a design decision changes.

## Context
We want a software factory that takes a ticket through context, requirements, gameplan, development, tests, review, context update and commit, **without depending on one AI vendor or tool**. If a model or company disappears, or something better comes along, we swap it out and the factory keeps working. In every stage the agent may ask questions or present choices (for example, which external library to use) for the user to decide.

Different stages are meant to run on different agents from the start. For example, requirements might run on one model, development on Claude Code and code review on Codex.

---

## 1. The core idea: files are the contract, agents are replaceable workers

Three layers, kept strictly apart:

| Layer | What it is | Vendor-specific? |
|---|---|---|
| **Orchestrator** | Our own small CLI program. It runs the stages in order, keeps track of state, handles loops and pauses for user answers. Contains no AI logic. | No |
| **Stage definitions** | One folder per stage: a prompt template (markdown), the list of files it reads, the files it must write. | No |
| **Agent adapters** | Thin wrappers that say "run this prompt in this folder with this agent" (Claude Code `claude -p`, Codex `codex exec`, Gemini CLI, Aider, or a raw API call). | Yes, but tiny and swappable |

**Models, effort and skills per stage:** `model` and `effort` (how hard the model reasons; levels are per agent) are passed to the agent as-is. Two kinds of skills: `skills` are ours, files in `skills/` whose text the orchestrator adds to the prompt, so they work with any agent (a project can add more in `.factory/project.yaml`). `nativeSkills` are built into that option's agent (e.g. a Claude Code plugin); the orchestrator only names them in the prompt, and they must already be installed for that agent.

**Stage prompts say only *what* to do.** The final prompt is composed by the orchestrator: shared rules + stage prompt + skills, sent to the active agent and model from `config.yaml`. A stage prompt never names an agent, a model, a skill or `config.yaml`.

**Run stats.** After every stage the orchestrator prints the time, rounds and tokens used (input, of which cached, and output), plus cost when the agent reports it. It appends one JSON line per stage to `<project>/.factory/logs/stages.jsonl` (git-ignored); `factory run` ends with totals per agent. Reading an agent's usage is vendor-specific, so each adapter has an optional `parseLine()` for its CLI's JSON output (claude-code: `stream-json`; codex: `--json`, no cost reported). An adapter without one gets time-only stats.

**Operator view.** `run.ts` never prints; it emits events (stage start, activity, questions, stage end) to a `Reporter`. Two exist: `ui/dashboard.ts`, a terminal dashboard (Ink) with the stage list, live activity, and questions as arrow-key menus; and `ui/plain.ts`, plain text, used with `--plain`, `--dry-run`, or when not in a real terminal. The agent's full output always goes to `<project>/.factory/logs/<stage>-<time>.log`. A web UI later would be a third reporter.

**Vendor rule:** anything specific to one agent lives only in `adapters/<agent>/`. Stages, shared rules and the project's `.factory/` never mention a vendor. Dropping an agent = removing it from `config.yaml` and deleting its adapter folder.

Agents talk to each other **only through markdown/JSON files on disk**. So any agent that can read and write files can do any stage, and swapping vendors only means changing one line of config.

A `config.yaml` maps each stage to a **list of options**; exactly one has `isActive: true`. Flip it to switch or compare agents:
```yaml
stages:
  context:
    - { adapter: codex, isActive: true }
    - { adapter: claude-code, model: opus, isActive: false }   # alternative, for comparing
  development:
    - { adapter: claude-code, skills: [clean-code], isActive: true }
  commit:
    - { adapter: none, isActive: true }                        # deterministic, no AI

review: { threshold: 8, max_loops: 3 }  # defaults, a project can override them in project.yaml
git:    { mode: branch-pr }             # branch ticket-xxx + pull request
```
Zero or two active options in a stage is an error. Stage 00 sets up every agent listed, active or not, so switching never needs a re-plug.

The orchestrator is written in **TypeScript / Node**: Claude Code and Codex are both installed through npm, so Node is already on every machine that runs these agents.

---

## 1b. How the factory runs on a project

**Principle:** the agent always runs **inside the target project** (its working directory is the project). The factory folder is only a read-only source of instructions. So everything the agent writes lands in `<project>/.factory/` or in the project's code, and the agent's own sandbox stops it from writing anywhere else (shared rule 3).

**Phase 1: by hand, from the project's VS Code window (Codex or Claude Code panel)**
1. **Once per project, plug it in (stage 00):**
   > Read and follow `/Users/andregoncalves/Documents/POC_Factory/andre-factory/stages/00-plug/prompt.md`.

   This creates `.factory/`, records the factory path in `.factory/factory.yaml`, and (after asking) adds a "Factory" section to the project's `AGENTS.md`, an open convention many agents read. Afterwards the orchestrator runs each listed agent's own setup code, `adapters/<agent>/plug.ts` (e.g. Claude Code's read access and `CLAUDE.md` import).
2. **From then on, any stage:**
   > Run factory stage 01.  *(or: Run factory stage 02 for ticket 123)*

   The agent finds the factory through `AGENTS.md` and `.factory/factory.yaml`.

If the project wasn't plugged in, the long form still works: "Read and follow `<factory>/stages/_shared/rules.md`, then `<factory>/stages/<stage>/prompt.md` and its `contract.yaml`. The project is the current folder. Ticket: `<id>` or none."

**Orchestrator: the `factory` command (v1 built)**
```bash
factory run   --project <path> [--ticket <file>]      # whole line from stage 00 (skips 00 if already plugged in)
factory stage <N> --project <path> [--ticket <file>]   # one stage
# add --dry-run to either: show prompt + agent command, run nothing
```
1. The orchestrator reads `config.yaml` to find the agent for the stage.
2. It builds the **whole prompt as text**: values (project, ticket, date, agent) + shared rules + contract + stage prompt + any factory files the contract lists under `inputs.factory`.
3. It starts the agent inside the project through `adapters/<agent>/run.ts` (`codex exec --cd <project> --sandbox workspace-write -- <prompt>`, or `claude -p <prompt> --permission-mode acceptEdits` in `<project>`).
4. It reads `status.json`. On `needs_input` it asks the questions in the terminal, appends the answers to `decisions.md` and runs the stage again (max 5 rounds).

`factory run` does this for 00 → 08 in order and stops at the first stage that fails or isn't written yet (06b is skipped until the review loop exists).

The agent never needs access to the factory folder, which keeps every adapter simple, vendor-neutral and free of permission prompts. An adapter is one small file that only turns a request into a command line; a new agent = a new `adapters/<agent>/run.ts` (+ an optional `plug.ts` for one-time project setup).

**Requirements for a project:** it's a git repo (stage 08 commits there).

---

## 2. Folder layout

**The factory repo (this one):**
```
andre-factory/
  orchestrator/          # the `factory` CLI (TypeScript, run directly by Node ≥ 23.6): src/cli.ts, run.ts, prompt.ts, questions.ts, stage.ts, config.ts
  adapters/              # one folder per agent: claude-code/, codex/ ... (run.ts: how to start it; optional plug.ts: one-time project setup)
  stages/
    _shared/rules.md     # rules every stage follows (read first): paths, asking, status, security, traceability
    00-plug/             # connects a project to the factory (once per project)
    01-context/          prompt.md + contract.yaml (inputs/outputs)
    02-requirements/
    03-gameplan/
    04-development/
    05-testing/
    06-code-review/
    06b-review-gameplan/
    07-context-update/
    08-commit/
  skills/                # vendor-neutral know-how files (e.g. clean-code.md), added to a stage's prompt when listed
  config.yaml
```

**Inside the target project the factory works on** (any project, passed in as a path). This folder is **committed to the project repo** as part of each ticket's PR, so the team and any agent or machine share the same context and changelog history:
```
<project>/.factory/
  project.yaml           # project settings: language, main branch, install/test/lint commands, overrides
  .gitignore             # ignores temporary files only (state.json, raw logs)
  context/
    CONTEXT.md           # what the project is, its domain and purpose, its entities
    ARCHITECTURE.md      # modules, data flow, dependencies
    CONVENTIONS.md       # code style, test style, patterns to follow
  tickets/
    ticket-123/
      00-ticket.md                  # copy of the input text file
      01-requirements.md            # use cases and technical requirements
      02-gameplan.md                # technical plan, libraries, steps
      03-dev-summary.md             # commit-style summary of what was done (+ accepted/disputed review findings in fix loops)
      04-tests.md                   # what was tested, including edge cases that try to break the code
      05-review.json + .md          # findings and score (one per iteration)
      05b-review-gameplan.md        # only if the review failed
      06-domain-arch-conv-diff.md   # changelog entry: what changed in CONTEXT/ARCHITECTURE/CONVENTIONS
      decisions.md                  # every question asked and the answer given
      state.json                    # current stage, iteration count, status (gitignored)
```

**`project.yaml`** is what makes the factory plug and play. Stage 01 detects the settings (from package.json, pyproject, Makefile…), writes the file and asks the user to confirm. The user can edit it at any time. Example:
```yaml
language: typescript
main_branch: main
commands:
  install: npm ci
  test: npm test
  lint: npm run lint
# optional overrides of the factory's config.yaml
review: { threshold: 8, max_loops: 3 }
git:    { mode: branch-pr }
```

---

## 3. The pipeline

```
[00 plug] (once per project)
      ↓
[01 context] (first run, or when it's stale)
      ↓
[02 requirements] → [03 gameplan] → [04 dev] → [05 tests] → [06 review]
                         ↑                                       │
                         │                             review passes? ──yes──→ [07 context update] → [08 commit + PR]
                         │                                       │no
                         └── [06b review-gameplan] ←─────────────┘   (max 3 loops, then hand over to the user)
```
In a fix loop, 06b sends the work back to **04 development** (not to 03), with the review and the fix plan as extra input.

| Stage | Reads | Writes | Notes |
|---|---|---|---|
| 00 Plug | the project's git status, `AGENTS.md` | `.factory/` skeleton, `factory.yaml`, "Factory" section in `AGENTS.md`. Then the orchestrator runs each agent's `plug.ts` | Once per project. Asks before touching `AGENTS.md`. Commits nothing |
| 01 Context | the whole project | `context/*.md` + `project.yaml` | Runs once, then gets updated by stage 07. Detects project settings and asks the user to confirm them |
| 02 Requirements | ticket + context docs | `01-requirements.md` | Use cases, acceptance criteria, technical requirements |
| 03 Gameplan | requirements + context | `02-gameplan.md` | Library and approach choices are where most questions come up |
| 04 Development | gameplan + conventions (+ review + fix plan in a fix loop) | code + `03-dev-summary.md` | Works on branch `ticket-123`. In a fix loop it judges each finding itself (see "Right to disagree" below) |
| 05 Testing | gameplan + code diff | test files + `04-tests.md` | **The orchestrator runs the tests itself** and saves the real results, rather than trusting what the agent reports |
| 06 Code review | requirements + gameplan + diff + test results (+ dev's disputes from the previous loop) | `05-review.json` | Structured score; a different vendor from dev |
| 06b Review gameplan | review + original gameplan | `05b-review-gameplan.md` | Goes back to 04 with a fix plan |
| 07 Context update | diff + context docs | updated `CONTEXT.md` / `ARCHITECTURE.md` / `CONVENTIONS.md` (whichever changed) + `06-domain-arch-conv-diff.md` | This is the trackable changelog. A new domain entity changes CONTEXT, a new module changes ARCHITECTURE, a new pattern changes CONVENTIONS |
| 08 Commit | dev summary | commit on branch `ticket-xxx`, push, open PR | Plain deterministic code, no AI needed. Mode set by `git.mode` (default `branch-pr`) |

**When the review passes (decided by code, not by the AI's opinion):**
- **Zero failing tests.** This is a hard gate with no exceptions.
- No finding with severity "critical".
- Score **≥ 8/10** (`review.threshold`).
- Capped at **3 loops** (`review.max_loops`), after which the factory pauses and hands over to the user.

**Right to disagree (so the agents don't fight forever):**
1. In a fix loop, the development agent reads every review finding and judges it itself.
2. If it agrees, it fixes the code. If it disagrees, it leaves the code as is and adds a comment on that exact spot explaining why, e.g. `// FACTORY-DISPUTE(R3): <reason>`. It lists accepted and disputed findings in `03-dev-summary.md`.
3. The next review must read the disputes. For each one, the reviewer either accepts the reasoning (the finding is dropped) or keeps it with a counter-argument.
4. **Tie-break:** if the same finding is still disputed after the second review, the orchestrator stops and asks the user to decide. The answer goes into `decisions.md`, and both agents must follow it.

---

## 4. Questions and decisions (human in the loop)

Every stage follows `stages/_shared/rules.md`, which defines this protocol once for all vendors: *"If you are unsure, or a decision belongs to the user, do not guess. Write `questions.json` and stop."* Small, easy-to-undo choices are assumed instead and listed under `## Assumptions`. At most 5 questions per round.

```json
{ "status": "needs_input",
  "questions": [
    { "id": "q1", "question": "Which local DB for credentials?",
      "options": ["SQLite", "LevelDB", "JSON file"],
      "recommendation": "SQLite",
      "why": "Zero setup, single file, mature Node drivers" } ] }
```
Every stage also ends by writing `status.json` (`done` / `needs_input` / `failed`), which is what the orchestrator reads.
The orchestrator sees `needs_input` and asks you in the terminal (later this could be Slack, a web page, or Jira comments). It writes your answers to `decisions.md` and re-runs the stage. Optional **approval gates** (set in config) stop and ask "OK to continue?" after requirements and after the gameplan.

This protocol works the same with every vendor, because it's just a file.

---

## 5. Build roadmap (one step at a time)

Mixing vendors is the default from day one: each stage runs on whichever agent suits it best.

1. **Phase 1: write the prompts and run them by hand, already multi-vendor.** Write `stages/*/prompt.md` and run each one manually in the agent planned for it (e.g. dev in Claude Code, review in Codex) on a sample project and ticket. This tests that the prompts and file contracts work in more than one tool before any orchestration code exists.
2. **Phase 2: minimal orchestrator with several adapters (TypeScript).** A CLI command (`factory run --project <path> --ticket <file>`) that runs the stages in order, keeps `state.json`, reads `project.yaml`, and comes with the Claude Code and Codex adapters, selected per stage through `config.yaml`. Stage 08 creates the branch and the PR.
3. **Phase 3: questions, review loop and gates.** Add the `needs_input` protocol, the review gate and loop, the dispute flow and tie-break, and the approval gates.
4. **Phase 4: more sources and outputs.** Jira/GitHub ticket input, a dashboard.

---

## Decisions
The factory is **project-agnostic**: it works on any project passed in as a path (`factory run --project <path> --ticket <file>`). No project is ever hardcoded. When we first test a stage, any small project will do as a throwaway test bed. Choosing it is not a design decision.

**Settled (2026-11-06)**
- [x] Agent per stage: Codex does context, gameplan, code review and context update; Claude Code does the rest (section 1). Updated 2026-11-06.
- [x] Orchestrator language: TypeScript / Node (section 1).
- [x] Git output: branch `ticket-xxx` + PR by default; a project can override it (section 3, stage 08).
- [x] Per-project settings: auto-detected by stage 01 into `project.yaml`, confirmed by the user (section 2).
- [x] `.factory/` is committed to the target repo; only temporary files are gitignored (section 2).
- [x] Review loop: zero failing tests, score ≥ 8/10, max 3 loops, with the right to disagree and a tie-break by the user (section 3).

**Open**
_None right now._

## Verification
- Phase 1 is done when one sample ticket goes through all stages by hand, using at least two different agents, and produces every file in `.factory/tickets/ticket-xxx/`.
- Phase 2 is done when `factory run` reproduces that same result automatically, with each stage calling the agent assigned to it in `config.yaml`.
