# Skill: implementation planning

Use when turning agreed requirements into a technical gameplan for an existing project. Applies across languages and frameworks.

This skill gives planning methods only. The calling stage defines the outputs, format and question protocol. Plan how to implement the agreed scope; do not rewrite requirements or implement the change.

## Ground the approach

- Read the requirements, context documents, project settings and recorded decisions. Keep requirement IDs so development, testing and review can trace the plan back to the agreed behavior.
- Inspect the relevant source, interfaces, dependencies and tests to confirm the current implementation. Cite existing paths for claims; label proposed files as new rather than implying they exist.
- Identify reusable components and established patterns before proposing new abstractions or dependencies. Prefer the smallest coherent change that satisfies the requirements and follows project conventions.
- Surface conflicting requirements, stale context or missing behavior through the calling stage's question protocol. Do not silently turn a requirements gap into a technical decision.

## Choose the design

- Explain the affected modules, their responsibilities, the data and control flow, and the interfaces that change. Make validation, error handling, permissions and state ownership explicit where relevant.
- Compare alternatives only for decisions with meaningful tradeoffs. Explain the recommendation in terms of project fit, complexity, compatibility and operational cost; do not manufacture alternatives for routine choices.
- Reuse installed dependencies when suitable. When a new dependency is warranted, verify the relevant API and version compatibility from authoritative documentation, and consider maintenance, licensing and deployment constraints. Distinguish verified facts from unresolved checks.
- Follow recorded decisions. Use the calling stage's question protocol for unresolved architecture, dependency, schema, security or scope choices; a recommendation alone does not settle a decision that belongs to the user.
- Include migrations, existing-data handling, client compatibility, configuration and deployment ordering when the change requires them. Describe recovery or rollback for changes that are hard to reverse, including any limits to reversal.

## Make the work executable

- Break the work into ordered steps with clear outcomes and dependencies. For each step, name the modules or files to change, the intended behavior and the requirement IDs it satisfies. Give enough detail for implementation without prescribing every line of code.
- Map every acceptance criterion and technical requirement to implementation work and a way to verify it. Include failure paths and affected existing behavior, not just the main flow.
- Recommend appropriate unit, integration, end-to-end or manual checks using the project's test conventions. Identify fixtures, boundary cases and regression coverage where needed. Use configured commands; label proposed commands or missing infrastructure explicitly.
- Identify material risks and unknowns, their impact and how to resolve them. Distinguish blocking decisions from small, reversible assumptions; list assumptions under `## Assumptions`.
- Keep unrelated refactors and speculative future features outside the plan. If a requirement cannot be met within the agreed scope, surface the conflict instead of dropping it or expanding scope.

## Check the handoff

- Check that the steps form a workable sequence, every requirement has coverage, and the design follows the evidence and recorded decisions.
- Leave no unresolved blocking choice disguised as an assumption. Stop at a plan that development can implement and testing and review can assess; do not modify application code, tests or dependencies as part of planning.
