# Skills

A skill is a short, vendor-neutral markdown file with know-how for a kind of work (a framework, a practice, a domain).

- **Use one:** list its name (file name without `.md`) under a stage's `skills` in `config.yaml`, or for every stage of one project in `<project>/.factory/project.yaml` (`skills: [expo]`).
- **What happens:** the orchestrator adds the file's text to that stage's prompt, so it works with any agent.
- **Add one:** create `skills/<name>.md`. Keep it short and practical: rules and tips, not tutorials.

**Agents' own skills** (e.g. Claude Code plugins, Codex skills) don't live here. List them under `nativeSkills` of that agent's option in `config.yaml`; the agent loads them itself, so they must be installed for that agent.
