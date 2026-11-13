# Skill: requirements analysis

Use when turning a ticket into requirements for an existing project. Applies across languages, frameworks and domains.

This skill gives methods only. The calling stage decides the outputs and their format. Describe *what* the system must do, not *how* to build it: libraries, designs and implementation steps belong to a later stage.

## Understand the intent

- Read the ticket for its goal, who is affected, what triggers the behavior and what outcome counts as success. Restate the problem in one or two sentences before writing requirements.
- Separate the problem from any solution the ticket proposes. Keep a proposed solution as a constraint only when the ticket clearly requires it.
- Note anything the ticket leaves unclear about behavior, users or data. Missing information is not permission to invent it.

## Ground it in the project

- Map the ticket to the existing domain terms, entities, flows and modules in the context documents. Use the project's own names.
- Find existing behavior that the ticket extends, changes or might break. Treat an unintended change to existing behavior as a risk and state it.
- Flag conflicts between the ticket and the documented context or recorded decisions. Do not resolve them silently.

## Write the requirements

- **Use cases:** for each actor goal, give the trigger, the main flow, alternative flows and error flows.
- **Acceptance criteria:** each one tests one observable behavior and is written so a test can prove it (Given / When / Then where useful). Cover edge cases, invalid input, empty states, permissions and failure paths, not just the happy path.
- **Technical requirements:** data and validation rules, permissions and security, performance, compatibility, migration of existing data, logging or analytics. Include them only when the ticket or context supports them.
- **Scope:** list what is in scope and what is explicitly out of scope, so later stages don't grow the ticket.
- Give every requirement and criterion a stable ID (for example `UC1`, `AC1`, `TR1`) so later stages can trace their work and tests back to it.
- Prefer precise words over vague ones ("within 2 seconds", not "fast"; "admins", not "some users"). Do not repeat a requirement in different words.

## Ask or assume

- Ask through the calling stage's question protocol when an answer changes behavior the user will see, the data model, security, or the scope. Offer concrete options and a recommendation.
- Assume only small, easy-to-undo details, and list each one under `## Assumptions`.
- Stop when every acceptance criterion is testable and every open point is either answered, assumed, or listed as out of scope.
