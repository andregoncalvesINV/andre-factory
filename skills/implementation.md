# Skill: implementation

Use when implementing an agreed technical gameplan in an existing project, including fix loops after a code review. Applies across languages and frameworks.

This skill gives implementation methods only. The calling stage defines the outputs, format and question protocol. Build what the plan describes; do not rewrite requirements or redesign the plan.

## Start from the plan

- Read the gameplan, requirements, context documents, project settings and recorded decisions before changing code. Recorded decisions are binding.
- Implement the plan's steps in order, respecting prerequisites. Keep step IDs and requirement IDs traceable from each change back to the plan.
- Confirm the plan's claims about the current code before relying on them. Small gaps, such as a renamed file or a missing helper, can be bridged by following the plan's intent; record each one as a deviation.
- If the plan is wrong or incomplete in a way that would change the design, scope, dependencies, data model or security, stop and use the calling stage's question protocol. Do not improvise a new design.

## Write the code

- Follow the project's existing patterns, structure and conventions. Reuse existing components and utilities before adding new ones.
- Make the smallest coherent change that completes each step. Leave unrelated code alone: no drive-by refactors, renames or formatting changes.
- Add no dependency, configuration or schema change the plan does not include.
- Handle the failure paths, validation and edge cases the plan and acceptance criteria name. Never swallow errors silently.
- Keep secrets out of code and output; refer to configuration by name.

## Check as you go

- After each meaningful step, run the project's configured build, type-check, lint and existing test commands when they are available. Fix what your change broke before moving on.
- Do not weaken, skip or delete existing tests to make them pass. If an existing test conflicts with the agreed requirements, surface it rather than silently changing it.
- Report exactly which checks ran and their results, and which could not run and why. Never claim a check passed when it did not run.

## Fix loops

- Read every review finding and judge it on its merits against the code, requirements and recorded decisions. Do not accept a finding just because a reviewer raised it, and do not reject one to avoid work.
- Fix the findings you agree with, in the same style as the original change.
- For a finding you disagree with, leave the code as is and explain why at that exact spot, in the form the calling stage defines. Give a concrete technical reason, not an opinion.
- Never ignore a finding: each one is either fixed or disputed. Follow any tie-break decision the user has recorded.

## Hand off

- Summarize what changed per step: files touched, behavior added or changed, and the requirement IDs covered.
- In a fix loop, list each finding as accepted (with the fix) or disputed (with the reason).
- List assumptions, deviations from the plan and anything left unfinished, so testing and review know what to check.
