# Skill: repository analysis

Use when investigating an existing project to explain its purpose, architecture, conventions, or development workflow. Applies across languages and frameworks.

Provide investigation methods; the calling stage defines the required outputs and scope. Describe the existing system without introducing redesigns or refactors.

## Map the project

- Start with repository instructions, top-level structure, manifests, workspace definitions, existing documentation, configuration, and CI workflows.
- Identify applications, packages, services, shared libraries, and platform-specific areas before choosing what to inspect in detail. Treat distinct subsystems separately where their conventions differ.
- Exclude dependencies, generated files, build outputs, caches, and vendored code from broad searches unless needed to explain a specific integration. Use targeted searches rather than reading the whole repository indiscriminately.

## Trace behavior and boundaries

- Find entry points and follow representative user actions, requests, jobs, or commands through the relevant components to their storage or external integrations.
- Derive domain concepts and relationships from implemented behavior, models, schemas, and tests. Distinguish documented intent from capabilities actually implemented.
- Explain module responsibilities, dependency direction, state ownership, and data flow. A directory tree alone does not establish architecture.
- Inspect boundary configuration and adapters to identify external services, persistence, and environment requirements. Record configuration names, never secret values.

## Establish conventions and commands

- Compare examples across relevant subsystems and tests before describing a pattern as a project convention. Distinguish formatter, linter, and type-checker rules from observed practices and isolated exceptions.
- Inspect how the project organizes code, names symbols, handles errors, manages configuration, and structures tests. Describe variations instead of imposing a preferred style.
- Derive install, build, test, lint, and start commands from scripts, task definitions, lockfiles, and CI. Identify the working directory and prerequisites when commands differ by package or platform.
- Distinguish commands found in configuration from commands successfully executed. Inspection alone does not establish that a build or test suite passes; do not install dependencies or run application workflows merely to document them.

## Reconcile evidence

- Check existing documentation against implementation and CI. When they disagree, record the discrepancy and evidence rather than silently treating either as authoritative for every claim.
- Attach source paths to material findings. Label inferences and state when evidence is missing or coverage is partial; one example is not proof of a repository-wide pattern.
- Stop expanding the investigation when the requested outputs are supported. Summarize responsibilities, relationships, and representative flows rather than producing a file inventory.
- Surface unresolved questions through the calling stage's question protocol. Do not infer product intent or operational choices that the repository cannot establish.
