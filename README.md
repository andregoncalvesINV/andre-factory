# andre-factory

**A software factory run by AI agents.** You give it a task (a "ticket"). It works through it step by step, like a small team: understand, plan, build, test, review. Then it hands the work back for a person to approve.

Each step is done by an AI agent (Codex, Claude Code…), and any agent can be swapped for another in one line of [config.yaml](config.yaml). When a real decision is needed, it asks you.

> **Early work in progress:** stage 00 is ready; stage 01 is written and awaits a real project run. See [Status](#status).

---

## The stages

| # | Stage | What it does | Done by |
|---|---|---|---|
| 00 | **Plug** | Connects a project to the factory (once per project) | Codex |
| 01 | **Context** | Reads the project and writes down what it is and how it's built | Codex |
| 02 | **Requirements** | Works out what the ticket needs | Claude Code |
| 03 | **Gameplan** | Decides how to build it | Codex |
| 04 | **Development** | Writes the code | Claude Code |
| 05 | **Testing** | Writes tests; all must pass | Claude Code |
| 06 | **Code review** | Another AI scores the work; below 8/10 goes back for fixes | Codex |
| 07 | **Docs update** | Updates the project docs with what changed | Codex |
| 08 | **Commit** | Opens a pull request for a person to approve | no AI |

---

## How it works

The factory has four parts:

- **Orchestrator** (`orchestrator/`): a Node.js command-line program, installed globally as `factory`. It runs the stages and starts the right agent for each one.
- **Stages** (`stages/`): one folder per step, with its instructions (`prompt.md`) and inputs/outputs (`contract.yaml`).
- **Adapters** (`adapters/`): one folder per AI agent, saying how to start it. The only vendor-specific code.
- **Skills** (`skills/`): our know-how files (e.g. clean code), added to a stage's instructions. Agents' own built-in skills are listed separately in `config.yaml` (`nativeSkills`).

Which agent, model and skills each stage uses is set in [config.yaml](config.yaml). A stage can list several options; the one with `isActive: true` runs, so switching agents is a one-word change.

Agents never talk to each other: they exchange work through files in your project's `.factory/` folder.

---

## What you need

- **Node.js 24 or newer**: [nodejs.org](https://nodejs.org)
- **Git**
- **Codex CLI** and **Claude Code CLI**, installed and logged in

---

## Install (once per computer)

```bash
git clone https://github.com/andregoncalvesINV/andre-factory.git
cd andre-factory/orchestrator
npm install
npm link
```

Now the `factory` command works in any terminal.

> Don't move the `andre-factory` folder afterwards. If you change Node versions, run `npm link` again.

---

## Use it

**1. Open a terminal in your project** (it must be a Git project):
```bash
cd /path/to/your-project
```

**2. Connect it to the factory** (first time only):
```bash
factory stage 0
```

**3. Run a stage, or everything:**
```bash
factory stage 1                            # one stage (01 needs no ticket)
factory stage 2 --ticket my-ticket.txt     # from stage 02 on, give your task file
factory run --ticket my-ticket.txt         # all stages in order
```

- **Dashboard:** while it runs you see the stages, what the agent is doing right now, and the time and tokens of each stage. The agent's full output goes to `.factory/logs/`. Add `--plain` for plain text instead.
- **Questions:** pick an answer with ↑/↓ and Enter (the recommended one is preselected), or choose "Other" to type your own.
- **Results:** everything the factory writes is in your project's `.factory/` folder.
- **Stats:** `factory run` ends with totals per agent (time, tokens, and cost if the agent reports it). The full history is in `.factory/logs/stages.jsonl`.

---

## Status

| | |
|---|---|
| Stage 00 (connect a project) | ✅ Ready |
| `factory` command | ✅ Ready |
| Stage 01 (project context) | 📝 Prompt and contract written; dry-run checked, real project run pending |
| Stages 02–08 | ⏳ Being written, one by one |

---

## Learn more

- [factory-plan.md](factory-plan.md): how it's designed
- [factory-progress.md](factory-progress.md): what's done and what's next
