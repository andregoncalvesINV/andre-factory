# Stage 04: Development

Implement the agreed gameplan in the project's code, so that testing and review can check it. In a fix loop, act on the review findings. This stage builds what was planned; it does not change the requirements or the design.

Follow the shared rules and this stage's contract. `<project>` is the project root; the working folder is the ticket folder `<project>/.factory/tickets/ticket-<id>/`.

## 1. Establish the starting point

Read the ticket (`00-ticket.md`), requirements (`01-requirements.md`), gameplan (`02-gameplan.md`), the three context documents, project settings, and both `decisions.md` files when present. If a required input is missing, stop with status `failed`, name the file and say which preceding stage must run (00, 01, 02 or 03). If the gameplan has no implementation steps, or still lists unresolved blocking decisions, stop with `failed` and say stage 03 must complete it first.

**Fix loop:** if `05b-review-gameplan.md` exists, this run is a fix loop. Also read the latest review (`05-review.json` and `05-review.md`), the previous `04-tests.md` and the previous `03-dev-summary.md`. The fix plan and findings are your work list; the gameplan and requirements still define the intended behavior.

Check the working tree (`git status`, `git diff`) to see changes already made by an earlier run of this stage, and continue from there rather than redoing or reverting them. Do not discard changes you did not make; if unrelated uncommitted changes would conflict with the plan, ask.

Before changing code, confirm the gameplan's claims about the current code (paths, interfaces, behavior). Resolve anything that blocks the work now, so that questions come before edits wherever possible.

## 2. Ask instead of redesigning

Small gaps the plan didn't foresee (a renamed file, a missing helper, an obvious detail) can be bridged by following the plan's intent and existing conventions; record each one under `## Deviations from the plan` or `## Assumptions`.

Ask through the shared question protocol when the work would need a change the plan does not cover: a different design, a new or different dependency, a data model or schema change, a security decision, a compatibility change, or a change of scope. Also ask when the plan and the code, requirements or recorded decisions conflict. Give concrete options and a recommendation with reasons. Decisions already settled in `decisions.md` are binding; do not ask again.

When user input is needed, write `questions.json` and `status.json` with `needs_input`, then stop. Do not write `03-dev-summary.md`. Code already changed stays in place; the next run continues from it and applies the recorded answers.

## 3. Implement

Work through the gameplan's steps (`S1`, `S2`, …) in order, respecting their prerequisites. For each step:

- Make the changes the step describes, in the files it names. Follow `CONVENTIONS.md` and the patterns around the code you change; reuse existing components before adding new ones.
- Keep changes to what the step needs. No unrelated refactors, renames or formatting changes.
- Handle the validation, error paths and edge cases the plan and acceptance criteria name. Never swallow errors silently.
- Add, remove or upgrade only the dependencies the gameplan or a recorded decision settles, with the project's own package manager and lock file. Add configuration and environment variables by name only; never write secret values.

New test suites are stage 05's job. Update existing tests only where the agreed behavior intentionally changes what they check, and list each one in the summary. Never weaken, skip or delete a test to make it pass.

**Fix loop:** judge every finding in the review on its merits against the code, requirements and recorded decisions.

- If you agree, fix it, following the fix plan where it gives one.
- If you disagree, leave the code as is and add a comment at that exact spot, in the file's comment syntax: `FACTORY-DISPUTE(<finding id>): <concrete technical reason>`. Where the finding has no single spot in the code, give the reason in the summary only.
- Earlier disputes the reviewer kept with a counter-argument must be judged again: fix the code or keep the dispute with an answer to the counter-argument. Remove a `FACTORY-DISPUTE` comment once its finding is fixed or dropped.
- A finding the user has settled in `decisions.md` follows that decision, with no further dispute.
- Every finding is either fixed or disputed; none is ignored.

## 4. Check your work

After the changes, run the project's commands from `project.yaml` (or the repository's scripts when settings are missing) that check the code without changing the environment: build or type-check, lint, and the existing tests. Fix failures your change caused. If a failure existed before your change or is unrelated, leave it and report it.

If a command is missing, not allowed or can't run here, don't work around it; report it. Never claim a check passed when it did not run. Do not start long-running services, run migrations against real data, or deploy.

## 5. Write the dev summary

Write `03-dev-summary.md`, using the shared Markdown front matter with this stage as `04-development` and the ticket's id. Use these sections, in this order, writing `None` for an empty one:

- **`## Summary`:** a commit-style subject line (imperative, at most 72 characters), then a short body: what changed and why. Stage 08 uses it for the commit and pull request.
- **`## Changes by step`:** for each step ID, what was done, the files touched (label new ones) and the requirement IDs covered. Mark any step not completed, with the reason.
- **`## Review findings`:** fix loops only; otherwise `None`. For each finding ID: `accepted` with the fix and files, or `disputed` with the reason and the location of its `FACTORY-DISPUTE` comment.
- **`## Checks run`:** each command, its result, and anything that could not be run and why.
- **`## Tests changed`:** existing tests updated, and why.
- **`## Deviations from the plan`:** where and why the code differs from the gameplan.
- **`## Assumptions`** and **`## Unknowns`:** small reversible choices made, and open points testing and review should look at.

## 6. Check and finish

Check that every gameplan step is implemented or explained, every requirement ID the steps cover is traceable to changes, in a fix loop every finding is accepted or disputed, and no secrets, debug output or leftover temporary code remain.

Re-running this stage continues from the current working tree and rewrites `03-dev-summary.md` from it. Write `status.json` with `done` only when every step is implemented (and, in a fix loop, every finding handled), summarizing the steps done, files changed and check results. Failing checks caused by unrelated, pre-existing problems do not block `done`; report them. Use `failed` for missing or unusable required inputs, or work that cannot be completed, with the reason; pending user decisions use `needs_input`.

This stage writes only project code and its contracted outputs. Do not edit requirements, the gameplan, context documents, review files or project settings; do not commit, push or change branches.
