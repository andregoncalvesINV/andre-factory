# Skill: clean code

Use when writing or reviewing code.

- Follow the project's existing style and patterns first (`CONVENTIONS.md`); these points only fill gaps.
- Small functions with one job; names that say what something is or does.
- No dead code, commented-out code or leftover debug output.
- Handle errors where they can be handled; never swallow them silently.
- Don't duplicate logic that already exists in the project; reuse it.
- Keep changes focused on the ticket: no unrelated refactors.
