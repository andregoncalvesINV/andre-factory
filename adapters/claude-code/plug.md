# Claude Code: plug extras

Run by stage 00 when `claude-code` is used in `config.yaml`. This is the only place in the factory that touches Claude Code files.
Delete this folder to drop Claude Code. Nothing else depends on it.

1. **Read access to the factory folder.** In `<project>/.claude/settings.local.json`, add `<factory>` to `permissions.additionalDirectories`.
   - If the file exists, merge: keep every existing key and entry, and don't add the path twice.
   - If it doesn't exist, create it:
     ```json
     { "permissions": { "additionalDirectories": ["<factory>"] } }
     ```
   - Make sure the file is ignored by git (it usually is). If it isn't, say so in the summary and don't edit the project's `.gitignore`.

2. **Make Claude Code read `AGENTS.md`.** Claude Code reads `CLAUDE.md`, not `AGENTS.md`. Only do this if `AGENTS.md` has the `## Factory` section (stage 00, step 4):
   - If `CLAUDE.md` exists and doesn't contain the line `@AGENTS.md`, add it.
   - If `CLAUDE.md` doesn't exist, create it containing only `@AGENTS.md`.

Files this may create or change: `.claude/settings.local.json`, `CLAUDE.md`.
