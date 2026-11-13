# andre-factory: Progress

> **How to resume (any agent):** read `factory-plan.md` first, then this file.
> Work one step at a time, and only on what the user asks for.
> At the end of every work session, update this file: move finished items to **Done**, refresh **Next steps**, and add a line to the **Log**.
> Keep `README.md` (the plain-language summary) up to date too, especially its **Status today** table, whenever a stage or phase is finished.

## Current phase
**Phase 1 (stage prompts) and Phase 2 (orchestrator) in parallel.** Stage 00 is written and tested by hand; the `factory` command (v1) is built and runs one stage at a time.

## Done
- [x] Turned the folder into a git repo and pushed it to GitHub (private): https://github.com/andregoncalvesINV/andre-factory
- [x] Agreed the blueprint (`factory-plan.md`)
- [x] Scaffolded the repo: `stages/*/` (prompt.md + contract.yaml, header line only), empty `orchestrator/` and `adapters/`, `config.yaml` with `adapter: TBD` per stage, `.gitignore`.
- [x] Installed the `claude` CLI in the terminal (needed by the Phase 2 adapter)
- [x] Wrote shared rules v1 (`stages/_shared/rules.md`): paths, read-first, allowed outputs, ask vs assume, binding decisions, cite evidence, security, traceability header, status.json
- [x] Wrote stage 00 Plug (`stages/00-plug/`): connects a project to the factory once, so stages can be started with "Run factory stage <N>"

- [x] Tested stage 00 by hand on mobile-factory-app-1 (with Claude Code): all outputs correct, question asked before touching AGENTS.md
- [x] Built the orchestrator v1 (`orchestrator/`): `factory run` (whole line from 00, stops at the first unwritten or failed stage), `factory stage <N>`, `--dry-run` option; adapters `adapters/codex/run.ts` and `adapters/claude-code/run.ts`; terminal Q&A loop; type-checks; linked with `npm link`

## Next steps
1. **First real run of `factory run`** (Codex; it will do stage 00, then stop at 01) on a fresh copy of a project, to check the orchestrator end to end, including the question round. Only dry runs have been done so far.
2. Write `stages/01-context/prompt.md` (+ `contract.yaml`): detects project settings into `project.yaml` and asks the user to confirm them.
3. Test stage 01 with `factory stage 1 --project …`.
4. Continue with the next stage prompts, one at a time. `factory run` (whole pipeline) once they exist.

## Decisions made
_Record each one here: date, decision, reason._
- 2026-11-06: Stage 07 updates all three context docs (CONTEXT, ARCHITECTURE, CONVENTIONS), not just ARCHITECTURE. Its changelog file is `06-domain-arch-conv-diff.md`. Reason: a new domain entity or a change in conventions has to be tracked too.
- 2026-11-06: Agent per stage: **Codex plans and checks, Claude Code builds.** Codex does context, requirements, gameplan, testing, code review, review gameplan and context update. Claude Code does development only. Commit needs no AI. Reason: the code is always tested and reviewed by a different vendor than the one that wrote it. Set in `config.yaml`. *(Superseded below.)*
- 2026-11-06: Agent per stage changed (user's choice): **Codex does context, gameplan, code review and context update; Claude Code does requirements, development, testing and review gameplan.** Code review stays on a different vendor from development, so the independent check is kept. Tests are now written by the same vendor as the code.
- 2026-11-06: Orchestrator language: **TypeScript / Node**. Reason: Claude Code and Codex are both installed through npm, so Node is already on any machine that runs them.
- 2026-11-06: Git output: **branch `ticket-xxx` + PR** by default, overridable per project. Reason: the safest choice for team repos; a human merges.
- 2026-11-06: Per-project settings: **stage 01 auto-detects them into `<project>/.factory/project.yaml`**, and the user confirms. Reason: plug and play with no manual setup, but still predictable.
- 2026-11-06: **`.factory/` is committed to the target repo** (in the ticket PR); only temporary files are gitignored. Reason: the context and changelog history is shared across the team, agents and machines.
- 2026-11-06: Review loop: **zero failing tests (hard gate), score ≥ 8/10, max 3 loops.** The development agent can disagree with a finding by leaving a `FACTORY-DISPUTE(<id>)` comment on the code and listing it in the dev summary. The next review must weigh the dispute. A finding still disputed after the second review goes to the user to decide. Reason (user): avoid the agents fighting each other; the tie-break was added so the loop always ends.

## Notes
- Agent CLIs on this machine: `claude` at `~/.local/bin/claude` (v2.1.319, native installer, independent of the nvm Node version) and `codex` at `~/.local/bin/codex`.
- **How to run a stage by hand** (details in `factory-plan.md` §1b), from the project's VS Code window:
  - Once per project: "Read and follow `/Users/andregoncalves/Documents/POC_Factory/andre-factory/stages/00-plug/prompt.md`."
  - Then: "Run factory stage 01" (or "Run factory stage 02 for ticket 123").
- **`factory` command:** installed via `npm link` into the nvm Node v26.13.0 global bin; re-run `npm link` in `orchestrator/` after switching Node versions. Node ≥ 23.6 runs the `.ts` files directly (no build step); `npm run typecheck` checks types.
- Claude Code adapter allows file edits plus read-only git commands only (`git status`, `rev-parse`, `check-ignore`). Stages that run tests will need more shell access, added in `adapters/claude-code/run.ts`.
- Not yet: `project.yaml` overrides of `config.yaml`, `state.json`, the review loop, and `factory run`.
- Testing uses the user's own projects, on `main`; no dedicated test project or branch.

## Log
- 2026-11-06: Repo created. Blueprint agreed: different vendors per stage from the start, so no separate "vendor independence" phase. Plan and progress files created.
- 2026-11-06: Repo scaffolded with empty stage folders and placeholder files. Chose to scaffold before settling the open decisions, since nothing in the scaffold depends on them.
- 2026-11-06: The factory stays project-agnostic, so "sample project" was dropped as a decision. Added three new open decisions for plug and play: per-project settings, committing `.factory/` or not, review loop defaults.
- 2026-11-06: All open decisions settled (language, git output, project settings, `.factory/` committed, review loop with right to disagree). Plan and config updated. Next: stage 01 prompt.
- 2026-11-06: Claude CLI installed. Shared rules v1 written; the user picked all four extras (ask vs assume, traceability header, cite evidence, security basics). Next: stage 01 prompt.
- 2026-11-06: Documented how the factory runs on a project in another folder (plan §1b): the agent runs inside the project, the factory folder is read-only. Testing will use the user's own projects.
- 2026-11-06: Added stage 00 Plug (user's idea): connects a project to the factory once (`.factory/`, `factory.yaml`, Claude read access, "Factory" section in AGENTS.md). Shared rule 4 now covers interactive runs: ask in chat and record answers in `decisions.md`. Testing happens on `main`.
- 2026-11-06: Made stage 00 vendor-neutral (user: "what if Claude stops existing?"). Core writes only `.factory/` and `AGENTS.md`; agent-specific steps moved to `adapters/<agent>/plug.md` (claude-code, codex). New vendor rule in the plan: vendor-specific things live only in `adapters/`.
- 2026-11-06: Wrote README.md as a plain-language summary for non-technical readers (what it is, stages, how to start one stage at a time, all-in-one marked as Phase 2, honest status).
- 2026-11-06: Moved requirements, testing, review gameplan and context update to Claude Code (config, plan, README updated).
- 2026-11-06: Context update moved back to Codex.
- 2026-11-06: Built orchestrator v1 (user chose this over writing stage 01 first): `factory plug` / `factory stage <N>` / `--dry-run`, per-agent `adapters/<agent>/run.ts`, terminal Q&A loop. `plug` now uses codex in config.yaml. Verified with type-check and dry runs; no real agent run yet.
- 2026-11-06: Cut the orchestrator to 2 commands (user): `factory run` (whole line from 00) and `factory stage <N>`; `factory plug` removed, `--dry-run` kept as an option.
- 2026-11-06: README simplified for beginners: what it is, stages, what you need, install (clone + npm install + npm link), use (stage 0, stage N, run), status. The by-hand chat method stays in factory-plan.md §1b.
- 2026-11-13: Added models + skills per stage (user): `config.yaml` stages take optional `model` and `skills`; skills are vendor-neutral files in `skills/` (example: clean-code, on development and code review) that the orchestrator adds to the prompt; projects can add skills in `.factory/project.yaml`. Verified with type-check and dry runs.
- 2026-11-13: config.yaml stages are now lists of options (adapter, model, skills, isActive); exactly one active per stage (user idea, for comparing providers). Stage 00 plugs every listed agent. Verified with type-check, dry run and error tests.
- 2026-11-13: Stage prompts say only *what* to do (user): the orchestrator composes rules + stage prompt + skills for the active agent/model. Stage 00 no longer reads config.yaml or agent files; per-agent setup moved from `adapters/<agent>/plug.md` to `adapters/<agent>/plug.ts`, run by the orchestrator after stage 00 (claude-code only; codex needs none). Tested plug.ts twice on a scratch repo (second run changes nothing).
- 2026-11-13: Skills split in two (user): `skills` = ours (skills/ files, pasted into the prompt, any agent); `nativeSkills` = built into that option's agent, only named in the prompt, must be installed. Noted: the skills/ folder was my own design choice in the models+skills change, not explicitly requested.
- 2026-11-13: Added optional `effort` per option in config.yaml (user asked for "tokenEffort"; named `effort` to match both CLIs). claude-code → `--effort`, codex → `-c model_reasoning_effort=...`.
- 2026-11-13: All agent options set to `effort: medium`; claude-code options pinned to `model: claude-opus-5-5` (codex uses its default).
