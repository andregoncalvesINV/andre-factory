# andre-factory

**A software factory run by AI agents.** You give it a task (a "ticket"), and it works through it step by step, much like a human team would: it understands the project, works out what's needed, plans, writes the code, tests it, reviews it and hands it back ready for a person to approve.

> **Status: early work in progress.** The design is done, but only the first step (stage 00) is ready to use. See [Status today](#status-today).

---

## What it is, in one picture

Think of an **assembly line**. A ticket goes in at one end, and a finished, reviewed change comes out at the other. Each station on the line is a **stage**, and each stage is done by an **AI agent** (an AI assistant that can read and write code, such as Codex or Claude Code).

```
 ticket ─► understand ─► requirements ─► plan ─► build ─► test ─► review ─► update docs ─► pull request
                                                   ▲                  │
                                                   └── fix & retry ◄──┘   (if the review isn't good enough)
```

Three ideas make it different:

- **No single AI company is required.** Every station can use a different agent, and any agent can be swapped for another by changing one line of settings. If one AI disappears tomorrow, the factory keeps working with another.
- **It asks instead of guessing.** When a real decision is needed (for example, "which database should we use?"), the agent stops and asks you, with options and a recommendation.
- **Everything is written down.** Each step leaves a readable file behind, so you can always see what was decided, by which agent, and why.

---

## The stations (stages)

| # | Stage | What it does, in plain words | Done by | Leaves behind |
|---|---|---|---|---|
| 00 | **Plug** | Connects a project to the factory. Done once per project. | any agent | a `.factory/` folder in the project |
| 01 | **Context** | Reads the whole project and writes down what it is, how it's built and its coding style. | Codex | context documents + project settings |
| 02 | **Requirements** | Reads the ticket and works out what exactly needs to be done. | Claude Code | a requirements file |
| 03 | **Gameplan** | Decides *how* to build it: approach, tools, steps. | Codex | a technical plan |
| 04 | **Development** | Writes the code. | Claude Code | the code + a summary of what was done |
| 05 | **Testing** | Writes tests, including tests that try to break the code. All tests must pass. | Claude Code | tests + a test report |
| 06 | **Code review** | A different AI checks the work and gives it a score. Below 8/10 goes back for fixes (at most 3 times). | Codex | a review with a score |
| 07 | **Docs update** | Updates the project's context documents with what changed. | Codex | a changelog entry |
| 08 | **Commit** | Saves the work on its own branch and opens a pull request for a person to approve. | no AI needed | a pull request |

*A **pull request** is a proposed change that a person reviews and approves before it becomes part of the project. The factory never approves its own work.*

*If the developer AI disagrees with the reviewer AI, it can say why in a comment. If they still disagree after a second round, **you** decide.*

---

## What you need

- **VS Code**, the code editor.
- **Git**, which tracks changes in projects. Your project must be a Git project (if it's on GitHub, it already is).
- The AI agents the factory uses, as VS Code extensions or in the terminal:
  - **Codex** (OpenAI)
  - **Claude Code** (Anthropic)
- This factory folder on your computer.

---

## Start here: one stage at a time

There are two ways to run a stage. Both do the same thing.

### Option A: the `factory` command (recommended)

You type one command in a terminal. The factory picks the right AI agent for the stage, runs it in the background, and asks you any questions right there in the terminal.

**One-time setup** (in a terminal, inside this factory folder):
```bash
cd orchestrator
npm install
npm link
```
After this, `factory` works in any terminal. (If you switch Node versions, run `npm link` again.)

**Use it:**
```bash
factory run   --project /path/to/your-project     # run everything, starting from stage 00
factory stage 1 --project /path/to/your-project   # run just one stage (here: 01)
```
Add `--dry-run` to see what would be sent to the agent without running anything.

### Option B: by hand, in the agent's chat

You start each stage yourself by typing one sentence to an AI agent.

**Step 1: open your project.** Open the project you want to work on in VS Code (in its own window, not this factory folder).

**Step 2: plug the project in (only the first time).** Open the Codex or Claude Code chat panel and paste this sentence (change the path if your factory folder is elsewhere):

> Read and follow `/Users/andregoncalves/Documents/POC_Factory/andre-factory/stages/00-plug/prompt.md`.

The agent will set up a `.factory/` folder in your project. It will ask before changing anything the team shares. It doesn't save (commit) anything for you.

**Step 3: run a stage.** From now on, in that project, just type:

> Run factory stage 01

Later stages need a ticket, for example:

> Run factory stage 02 for ticket 123

**Step 4: answer questions.** If the agent needs a decision, it asks you in the chat with options and a recommendation. Your answer is saved, so it's never asked again.

**Step 5: check the result.** Everything the factory writes goes into the `.factory/` folder of your project (plus the code itself), so you can read what each stage did.

---

## All in one go (coming later)

> **Not available yet. Planned for Phase 2.**

The plan is a single command that runs the whole line by itself, calling the right agent for each stage and stopping only to ask you questions:

```bash
factory run --project /path/to/your-project --ticket my-ticket.txt
```

---

## Status today

| Part | Status |
|---|---|
| Design and decisions | ✅ Done |
| Shared rules that all agents follow | ✅ Done |
| Stage 00: Plug | ✅ Ready to try |
| Stages 01–08 | ⏳ Empty placeholders, being written one by one |
| `factory` command: one stage at a time | ✅ Built (stage 00 ready to try with it) |
| `factory run`: whole line in one go | ⏳ Not started (needs stages 01–08 first) |
| Tickets from Jira / GitHub, dashboard | ⏳ Later (Phase 4) |

---

## Learn more

- [factory-plan.md](factory-plan.md): the full design (for technical readers).
- [factory-progress.md](factory-progress.md): what's done and what's next.
- [config.yaml](config.yaml): which AI agent runs which stage.
