# Stage 03: Gameplan

Turn the agreed requirements into a technical plan that development can implement and testing and review can check. This stage decides how to build the change within the agreed scope.

Follow the shared rules and this stage's contract. `<project>` is the project root; the working folder is the ticket folder `<project>/.factory/tickets/ticket-<id>/`.

## 1. Establish the starting point

Read the ticket (`00-ticket.md`), requirements (`01-requirements.md`), the three context documents, project settings, and both `decisions.md` files when present. If a required input is missing, stop with status `failed`, name the file and say which preceding stage must run (00, 01 or 02). If the requirements are empty or lack actionable acceptance criteria, stop with `failed` and say stage 02 must complete them first.

Inspect the relevant source, interfaces, dependencies and tests to confirm the current implementation and conventions. Use source paths as evidence for claims about existing behavior. Distinguish existing files from proposed new files. Preserve requirement IDs (`UC#`, `AC#`, `TR#`) and the requirements' explicit scope boundaries.

If requirements conflict with the code, context or recorded decisions, surface the conflict through the shared question protocol. Do not silently change the requirements or choose which conflicting decision to ignore.

## 2. Resolve technical decisions

Identify the approach, affected modules, interfaces and dependencies. Prefer reuse of existing components and conventions where they meet the requirements. Explain meaningful alternatives and their tradeoffs when a decision needs one; routine choices need only a brief rationale.

Ask through the shared question protocol for unresolved architecture choices, new dependencies, data model or schema changes, security decisions, compatibility changes or changes to scope. Give concrete options and a recommendation with reasons. Decisions already settled in `decisions.md` remain binding; do not ask again. Assume only small, easy-to-undo details that follow existing conventions, and list them under `## Assumptions`.

For a proposed new dependency, establish why existing tools are insufficient and check the relevant API, version compatibility, maintenance and licensing using authoritative documentation when available. State any unverified facts and resolve checks that could invalidate the approach before treating the decision as settled. Do not install dependencies to investigate them.

When user input is needed, write `questions.json` and `status.json` with `needs_input`, then stop without writing `02-gameplan.md`. On resumption, apply the recorded answers before completing the plan.

## 3. Write the gameplan

Once blocking decisions are resolved, write `02-gameplan.md`. Use the shared Markdown front matter, with this stage as `03-gameplan` and the ticket's id. Use these sections, in this order, writing `None` for an empty one:

- **`## Summary`:** the technical approach, intended outcome and scope boundaries. Refer to the agreed requirements rather than rewriting them.
- **`## Current implementation`:** the relevant modules, behavior, interfaces and reusable components, with source paths. Note discrepancies between context and implementation.
- **`## Design and decisions`:** the planned responsibilities, data and control flow, interface changes, validation, errors, permissions and state ownership where relevant. Explain significant choices and tradeoffs, citing recorded user decisions where applicable.
- **`## Dependencies and configuration`:** dependencies to reuse, add or change, their purpose and compatibility; configuration or environment variable names, without secret values. Record the evidence for new dependencies and which decision settled their use.
- **`## Implementation steps`:** ordered steps with stable IDs (`S1`, `S2`, …). Each gives the outcome, affected files or modules (label new ones), changes to make, requirement IDs covered and any prerequisite steps. Include data migrations, compatibility measures and deployment ordering when needed. Keep unrelated refactors out of scope.
- **`## Verification plan`:** map every `AC#` and `TR#` to implementation step IDs and an observable check. Cover relevant use cases, failure paths, edge cases and regressions. Specify appropriate test levels, fixtures or manual checks and the project commands to use. Derive commands from project settings and repository scripts; label proposed commands or missing infrastructure. Do not claim checks have passed when they are only planned.
- **`## Risks and recovery`:** material technical risks and mitigations; recovery or rollback for changes that are hard to reverse, including limits such as irreversible data loss. Include operational steps only when the ticket needs them.
- **`## Assumptions`** and **`## Unknowns`:** small reversible choices, and non-blocking gaps with their impact and how they will be resolved. A gap that could change the design, scope or ability to meet a requirement must be resolved before completion.

Keep detail proportional to the change. The plan must be specific enough to implement without inventing major decisions, while leaving routine coding choices to development.

## 4. Check and finish

Check that every acceptance criterion and technical requirement has implementation and verification coverage, all referenced step IDs exist, and prerequisite steps form a workable sequence. Confirm that existing paths cited as evidence exist, new paths are clearly marked, scope and conventions are respected, and the plan follows recorded decisions. Do not mark a plan complete with unresolved blocking choices.

Re-running this stage rewrites `02-gameplan.md` from the current inputs and decisions. Write `status.json` with `done` only when the gameplan is complete, summarizing the approach, number of steps and remaining non-blocking unknowns. Use `failed` for missing or unusable required inputs, with the reason; pending user decisions use `needs_input`.

This stage writes only its contracted outputs. Do not modify application code, tests, context documents, requirements, project settings or dependencies; run builds, tests, migrations or application services; or commit, push or change branches.
