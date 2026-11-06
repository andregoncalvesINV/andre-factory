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
1. Settle the open decisions, one at a time (see `factory-plan.md` → Open decisions):
   - Which agent runs each stage → fill `config.yaml`
   - Which sample project and ticket to test on
   - Orchestrator language (needed by Phase 2)
   - Push straight to main, or branch + PR
2. Write `stages/01-context/prompt.md` (+ `contract.yaml`)
3. Run stage 01 by hand on the sample project and review what it produces

## Decisions made
_Record each one here: date, decision, reason._
- 2026-11-06: Stage 07 updates all three context docs (CONTEXT, ARCHITECTURE, CONVENTIONS), not just ARCHITECTURE. Its changelog file is `06-domain-arch-conv-diff.md`. Reason: a new domain entity or a change in conventions has to be tracked too.

## Log
- 2026-11-06: Repo created. Blueprint agreed: different vendors per stage from the start, so no separate "vendor independence" phase. Plan and progress files created.
- 2026-11-06: Repo scaffolded with empty stage folders and placeholder files. Chose to scaffold before settling the open decisions, since nothing in the scaffold depends on them.
