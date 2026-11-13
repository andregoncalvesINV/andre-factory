# Stage 01: Context

Establish a reliable picture of the existing project so later stages can work from evidence rather than rediscovering its foundations. This stage applies to any language, framework, or repository layout. It needs no ticket.

Follow the shared rules and this stage's contract. `<project>` is the project root; the working folder is `<project>/.factory/`.

## 1. Establish the current state

Read the required inputs, repository instructions, existing context documents, project settings, and `.factory/decisions.md` when present. If the project has not been connected to the factory, stop with status `failed` and explain that stage 00 must run first.

Investigate the project as it exists, including distinct applications or packages in a monorepo. Existing context is a starting point to verify against current sources. Preserve user-provided domain knowledge and binding decisions; surface conflicts that require a user decision.

Identify the project's purpose, implemented capabilities, domain concepts, structure, main flows, dependencies, integrations, conventions, and development workflow. Support material claims with project-relative source paths. Distinguish implemented behavior, documented intent, and inference. For an empty or scaffold-only project, describe what exists and record what cannot yet be established.

## 2. Detect and confirm project settings

Prepare the settings for `.factory/project.yaml` using this shape:

```yaml
language: <primary language, or a list for a multilingual project>
main_branch: <repository's main integration branch>
commands:
  install: <command, or null if unavailable>
  test: <command, or null if unavailable>
  lint: <command, or null if unavailable>
```

Derive settings from the repository's manifests, lockfiles, scripts, task definitions, CI, and Git metadata. Do not assume the current branch is the main branch. Express commands relative to the project root, including a directory change or workspace selector when needed. For multiple packages, prefer an existing aggregate command; if none exists, ask which workflow later stages should use. Do not invent commands or install a tool to fill a gap.

When settings already exist, preserve unrelated keys and explicit user overrides. Propose evidence-backed changes rather than replacing the file wholesale. Explain unavailable commands and unresolved settings in the confirmation question; use `null` for a confirmed unavailable value.

Before writing settings or context documents, obtain confirmation through the shared question protocol. Include the complete proposed settings and concise evidence in the question, offering **Use these settings** (recommended when supported) and **Correct these settings**. The user can supply corrections in their answer. If they choose correction without providing details, ask targeted follow-up questions. Resolve material uncertainties before final confirmation.

Write `.factory/questions.json` and `.factory/status.json` with `needs_input`, then stop without writing the other deliverables. On resumption, read `.factory/decisions.md`; apply corrections and do not ask again about settings already confirmed there. If new evidence would change a confirmed value, explain the discrepancy and ask about that specific change. In an interactive run, follow the shared rules for recording answers and continuing.

## 3. Write the context documents

After required questions are resolved, write these documents for someone implementing an unfamiliar ticket:

- **`.factory/context/CONTEXT.md`:** project purpose, intended users when established, main implemented capabilities, domain terms, entities and relationships, and relevant external systems. Identify incomplete or planned capabilities explicitly.
- **`.factory/context/ARCHITECTURE.md`:** languages and frameworks, application/package boundaries, entry points, module responsibilities, representative control and data flows, persistence, external integrations, and build/deployment structure where present. Explain relationships rather than listing every file.
- **`.factory/context/CONVENTIONS.md`:** existing organization, naming, coding and typing practices, error handling, configuration, test organization, and development commands with prerequisites. Distinguish enforced rules from observed patterns and note meaningful differences between subsystems. Report missing tooling without prescribing new tooling.

Keep each document focused on its subject and link to the others where useful. Cite source paths for findings and include `## Assumptions` and `## Unknowns` sections in each document, using `None` when empty. Record non-blocking gaps and coverage limits there; ask when an unresolved fact is necessary to produce usable settings or context. Do not fabricate product intent for undocumented code.

Write the confirmed `.factory/project.yaml`, preserving unrelated settings. Use the shared traceability fields as YAML comments at the top so the settings remain top-level keys; use the shared Markdown front matter for context documents. Identify this stage as `01-context` and the ticket as `none`.

## 4. Check and finish

Check that all four deliverables agree, source paths exist, settings parse as YAML, and commands match their cited definitions. Document whether commands were only inspected; do not claim successful execution without evidence. Re-running this stage refreshes its documents and reconciles its settings without discarding unrelated configuration or repeating answered questions.

Write `.factory/status.json` with `done` only after the settings are confirmed and all deliverables are complete. Summarize the outputs and any remaining non-blocking unknowns. If a required input is missing or the investigation cannot proceed, use `failed` with the reason; pending user decisions use `needs_input`.

This stage writes only its contracted outputs. Do not modify application code, repository instructions, dependencies, or existing tooling; install packages; run builds, tests, or application services; or commit, push, or change branches.
