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

Agents talk to each other **only through markdown/JSON files on disk**. So any agent that can read and write files can do any stage, and swapping vendors only means changing one line of config.

A `config.yaml` maps stage → adapter + model, for example:
```yaml
stages:
  requirements: { adapter: gemini-cli }
  development:  { adapter: claude-code, model: opus }
  code_review:  { adapter: codex }   # a different vendor from dev = fewer shared blind spots
```

---

## 2. Folder layout

**The factory repo (this one):**
```
andre-factory/
  orchestrator/          # the CLI (state machine, runner, question handling)
  adapters/              # claude-code, codex, gemini, aider, raw-api ...
  stages/
    01-context/          prompt.md + contract.yaml (inputs/outputs)
    02-requirements/
    03-gameplan/
    04-development/
    05-testing/
    06-code-review/
    06b-review-gameplan/
    07-context-update/
    08-commit/
  config.yaml
```

**Inside the target project the factory works on:**
```
<project>/.factory/
  context/
    CONTEXT.md           # what the project is, its domain and purpose, its entities
    ARCHITECTURE.md      # modules, data flow, dependencies
    CONVENTIONS.md       # code style, test style, patterns to follow
  tickets/
    ticket-123/
      00-ticket.md                  # copy of the input text file
      01-requirements.md            # use cases and technical requirements
      02-gameplan.md                # technical plan, libraries, steps
      03-dev-summary.md             # commit-style summary of what was done
      04-tests.md                   # what was tested, including edge cases that try to break the code
      05-review.json + .md          # findings and score (one per iteration)
      05b-review-gameplan.md        # only if the review failed
      06-domain-arch-conv-diff.md   # changelog entry: what changed in CONTEXT/ARCHITECTURE/CONVENTIONS
      decisions.md                  # every question asked and the answer given
      state.json                    # current stage, iteration count, status
```

---

## 3. The pipeline

```
[01 context] (first run, or when it's stale)
      ↓
[02 requirements] → [03 gameplan] → [04 dev] → [05 tests] → [06 review]
                         ↑                                       │
                         │                        score >= threshold? ──yes──→ [07 context update] → [08 commit/push]
                         │                                       │no
                         └── [06b review-gameplan] ←─────────────┘   (max N loops, then hand over to the user)
```

| Stage | Reads | Writes | Notes |
|---|---|---|---|
| 01 Context | the whole project | `context/*.md` | Runs once, then gets updated by stage 07 |
| 02 Requirements | ticket + context docs | `01-requirements.md` | Use cases, acceptance criteria, technical requirements |
| 03 Gameplan | requirements + context | `02-gameplan.md` | Library and approach choices are where most questions come up |
| 04 Development | gameplan + conventions | code + `03-dev-summary.md` | Works on branch `ticket-123` |
| 05 Testing | gameplan + code diff | test files + `04-tests.md` | **The orchestrator runs the tests itself** and saves the real results, rather than trusting what the agent reports |
| 06 Code review | requirements + gameplan + diff + test results | `05-review.json` | Structured score; ideally a different vendor from dev |
| 06b Review gameplan | review + original gameplan | `05b-review-gameplan.md` | Goes back to 04 with a fix plan |
| 07 Context update | diff + context docs | updated `CONTEXT.md` / `ARCHITECTURE.md` / `CONVENTIONS.md` (whichever changed) + `06-domain-arch-conv-diff.md` | This is the trackable changelog. A new domain entity changes CONTEXT, a new module changes ARCHITECTURE, a new pattern changes CONVENTIONS |
| 08 Commit | dev summary | git commit + push | Plain deterministic code, no AI needed |

**Review threshold (decided by code, not by the AI's opinion):** fail if tests fail, OR any finding has severity "critical", OR the score is below the threshold set in config (e.g. 8/10). The loop is capped at e.g. 3 iterations, after which it pauses for the user.

---

## 4. Questions and decisions (human in the loop)

Every stage prompt ends with the same rule: *"If you are unsure, or a decision belongs to the user, do not guess. Write `questions.json` and stop."*

```json
{ "status": "needs_input",
  "questions": [
    { "id": "q1", "question": "Which local DB for credentials?",
      "options": ["SQLite (recommended: zero setup)", "LevelDB", "JSON file"],
      "recommendation": "SQLite" } ] }
```
The orchestrator sees `needs_input` and asks you in the terminal (later this could be Slack, a web page, or Jira comments). It writes your answers to `decisions.md` and re-runs the stage. Optional **approval gates** (set in config) stop and ask "OK to continue?" after requirements and after the gameplan.

This protocol works the same with every vendor, because it's just a file.

---

## 5. Build roadmap (one step at a time)

Mixing vendors is the default from day one: each stage runs on whichever agent suits it best.

1. **Phase 1: write the prompts and run them by hand, already multi-vendor.** Write `stages/*/prompt.md` and run each one manually in the agent planned for it (e.g. dev in Claude Code, review in Codex) on a sample project and ticket. This tests that the prompts and file contracts work in more than one tool before any orchestration code exists.
2. **Phase 2: minimal orchestrator with several adapters.** A CLI command (`factory run ticket-123`) that runs the stages in order, keeps `state.json`, and comes with at least the Claude Code and Codex adapters (plus any others the stage mapping needs), selected per stage through `config.yaml`.
3. **Phase 3: questions, review loop and gates.** Add the `needs_input` protocol, the review threshold and loop, and the approval gates.
4. **Phase 4: more sources and outputs.** Jira/GitHub ticket input, PR creation instead of a direct push, a dashboard.

---

## Open decisions (to settle when we get to them)
- Language for the orchestrator (TypeScript or Python; both work fine).
- Which agent runs each stage (the initial `config.yaml` mapping).
- Which sample project and ticket to use for Phase 1.
- Push straight to main, or branch + PR.

## Verification
- Phase 1 is done when one sample ticket goes through all stages by hand, using at least two different agents, and produces every file in `.factory/tickets/ticket-xxx/`.
- Phase 2 is done when `factory run` reproduces that same result automatically, with each stage calling the agent assigned to it in `config.yaml`.
