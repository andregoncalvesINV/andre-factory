# andre-factory: Progress

> **How to resume (any agent):** read `factory-plan.md` first, then this file.
> Work one step at a time, and only on what the user asks for.
> At the end of every work session, update this file: move finished items to **Done**, refresh **Next steps**, and add a line to the **Log**.

## Current phase
**Phase 1: write the stage prompts and run them by hand.** Not started.

## Done
- [x] Turned the folder into a git repo and pushed it to GitHub (private): https://github.com/andregoncalvesINV/andre-factory
- [x] Agreed the blueprint (`factory-plan.md`)
- [x] Scaffolded the repo: `stages/*/` (prompt.md + contract.yaml, header line only), empty `orchestrator/` and `adapters/`, `config.yaml` with `adapter: TBD` per stage, `.gitignore`. Not committed yet.

## Next steps
1. **Write `stages/01-context/prompt.md` (+ `contract.yaml`).** It must also detect project settings into `project.yaml` and ask the user to confirm them.
2. Run stage 01 by hand (in Codex) on any small throwaway project to test it (the factory itself stays project-agnostic)
3. Continue with the next stage prompts, one at a time

## Decisions made
_Record each one here: date, decision, reason._
- 2026-11-06: Stage 07 updates all three context docs (CONTEXT, ARCHITECTURE, CONVENTIONS), not just ARCHITECTURE. Its changelog file is `06-domain-arch-conv-diff.md`. Reason: a new domain entity or a change in conventions has to be tracked too.
- 2026-11-06: Agent per stage: **Codex plans and checks, Claude Code builds.** Codex does context, requirements, gameplan, testing, code review, review gameplan and context update. Claude Code does development only. Commit needs no AI. Reason: the code is always tested and reviewed by a different vendor than the one that wrote it. Set in `config.yaml`.
- 2026-11-06: Orchestrator language: **TypeScript / Node**. Reason: Claude Code and Codex are both installed through npm, so Node is already on any machine that runs them.
- 2026-11-06: Git output: **branch `ticket-xxx` + PR** by default, overridable per project. Reason: the safest choice for team repos; a human merges.
- 2026-11-06: Per-project settings: **stage 01 auto-detects them into `<project>/.factory/project.yaml`**, and the user confirms. Reason: plug and play with no manual setup, but still predictable.
- 2026-11-06: **`.factory/` is committed to the target repo** (in the ticket PR); only temporary files are gitignored. Reason: the context and changelog history is shared across the team, agents and machines.
- 2026-11-06: Review loop: **zero failing tests (hard gate), score ≥ 8/10, max 3 loops.** The development agent can disagree with a finding by leaving a `FACTORY-DISPUTE(<id>)` comment on the code and listing it in the dev summary. The next review must weigh the dispute. A finding still disputed after the second review goes to the user to decide. Reason (user): avoid the agents fighting each other; the tie-break was added so the loop always ends.

## Notes
- The `claude` CLI isn't on the terminal PATH (only the VS Code extension's bundled copy exists). That's fine for Phase 1, where stages are run by hand, but the Phase 2 Claude Code adapter needs `claude` installed on the terminal. The `codex` CLI is installed at `~/.local/bin/codex`.

## Log
- 2026-11-06: Repo created. Blueprint agreed: different vendors per stage from the start, so no separate "vendor independence" phase. Plan and progress files created.
- 2026-11-06: Repo scaffolded with empty stage folders and placeholder files. Chose to scaffold before settling the open decisions, since nothing in the scaffold depends on them.
- 2026-11-06: The factory stays project-agnostic, so "sample project" was dropped as a decision. Added three new open decisions for plug and play: per-project settings, committing `.factory/` or not, review loop defaults.
- 2026-11-06: All open decisions settled (language, git output, project settings, `.factory/` committed, review loop with right to disagree). Plan and config updated. Next: stage 01 prompt.
