# Stage 02: Requirements

Turn one ticket into clear, testable requirements, so the gameplan, development, testing and review stages all work against the same agreed definition of done. This stage decides *what* the change must do, not *how* to build it.

Follow the shared rules and this stage's contract. `<project>` is the project root; the working folder is the ticket folder `<project>/.factory/tickets/ticket-<id>/`.

## 1. Establish the current state

Read the ticket (`00-ticket.md`), the three context documents, project settings, and both `decisions.md` files when present. If the project has not been connected, or the context documents are missing, stop with status `failed` and say which stage must run first (00 or 01). If the ticket is empty or does not describe a change, stop with `failed` and say so.

Find the parts of the project the ticket touches. Use the context documents first, then check the relevant source and tests to confirm how that behavior works today, since the documents may be out of date. Use the project's own names for domain terms, entities and modules. Note where the ticket conflicts with existing behavior, the context documents or a recorded decision.

## 2. Resolve open points

Ask through the shared question protocol when an answer would change behavior users see, the data model, security or permissions, compatibility with existing data or clients, or the ticket's scope. Also ask when the ticket conflicts with existing behavior or a recorded decision. Offer concrete options with a recommendation; when the ticket proposes a solution, ask whether it is required or only a suggestion if that matters.

Assume only small, easy-to-undo details and list them under `## Assumptions`. On resumption, apply the answers in `decisions.md` and do not ask again about anything already answered there. Write `questions.json` and `status.json` with `needs_input`, then stop without writing `01-requirements.md`.

## 3. Write the requirements

After the required questions are resolved, write `01-requirements.md` for the people and stages that will plan, build, test and review the change. Use the shared Markdown front matter, with this stage as `02-requirements` and the ticket's id. Use these sections, in this order, writing `None` for an empty one:

- **`## Summary`:** the problem in one or two sentences, the goal, and how success is recognized.
- **`## Actors`:** who or what triggers or is affected by the change (user roles, other systems, scheduled jobs).
- **`## Use cases`:** `UC1`, `UC2`, … Each has an actor, a trigger, a main flow, and alternative and error flows.
- **`## Acceptance criteria`:** `AC1`, `AC2`, … Each states one observable behavior that a test can prove (Given / When / Then where useful) and names the use case it belongs to. Cover edge cases, invalid input, empty states, permissions and failure paths, not only the main flow.
- **`## Technical requirements`:** `TR1`, `TR2`, … Data and validation rules, security and permissions, performance, compatibility, migration of existing data, logging. Include only what the ticket, context or code supports.
- **`## Impact on existing behavior`:** the existing features, flows and modules this change affects or could break, with source paths.
- **`## Out of scope`:** what this ticket does not cover, including related ideas left for later.
- **`## Assumptions`** and **`## Unknowns`:** small assumed details, and non-blocking gaps for later stages to keep in mind.

Do not choose libraries, designs, file layouts or implementation steps; the gameplan stage does that. A requirement may name an existing module or interface only when the change must work with it.

## 4. Check and finish

Check that every acceptance criterion is testable and linked to a use case, every use case has at least one acceptance criterion, IDs are unique, cited source paths exist, and nothing in the document contradicts `decisions.md`. Re-running this stage rewrites `01-requirements.md` from the current ticket, context and decisions.

Write `status.json` with `done` only when `01-requirements.md` is complete, summarizing the number of use cases and acceptance criteria and any remaining unknowns. Use `failed` with the reason when a required input is missing; pending user decisions use `needs_input`.

This stage writes only its contracted outputs. Do not modify application code, tests, context documents, project settings or dependencies; run builds, tests or application services; or commit, push or change branches.
