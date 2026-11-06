# Factory shared rules (v1)

These rules apply to every stage, whichever agent runs it. Read them before the stage prompt.
If they clash with the stage prompt, the stage prompt decides *what* to do and these rules decide *how*.

## 1. Where things are
- **Project root:** given to you as `<project>`. Factory files live in `<project>/.factory/`.
- **Context:** `.factory/context/CONTEXT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`
- **Settings:** `.factory/project.yaml` (language, main branch, install/test/lint commands, overrides)
- **Ticket:** `.factory/tickets/ticket-<id>/`, which holds all inputs and outputs for that ticket
- **Working folder:** the ticket folder, or `.factory/` for stages that don't belong to a ticket (stage 01). `questions.json` and `status.json` go here.

## 2. Before you start
- Read the three context docs, `project.yaml` and the ticket's `decisions.md`, if they exist.
- Read every input listed in this stage's `contract.yaml`. If a required input is missing, stop with status `failed` and name the missing file.

## 3. What you may write
- Only the outputs listed in this stage's `contract.yaml`, plus code if your stage is development or testing.
- Markdown for people, JSON for anything the orchestrator reads.
- Never commit, push or change git branches. Stage 08 does that.
- Never touch files outside `<project>`.
- If the stage is run again, overwrite your own outputs. Never edit another stage's outputs.

## 4. Don't guess, ask
Ask when the decision belongs to the user, or when you can't work out the answer from the code, the context docs or `decisions.md`.
Write `questions.json`, write `status.json` with `needs_input`, and stop **without writing your other outputs**:
```json
{ "status": "needs_input",
  "questions": [
    { "id": "q1",
      "question": "Which local DB should store the credentials?",
      "options": ["SQLite", "LevelDB", "JSON file"],
      "recommendation": "SQLite",
      "why": "Zero setup, single file, mature Node drivers" } ] }
```
- Always give options and a recommendation with a reason. Never ask an open question with no options.
- **At most 5 questions per round.** Ask the most important ones first.

## 5. When to ask vs assume
- **Ask** (rule 4) for anything hard to reverse: new dependencies, architecture choices, data model or schema changes, security, anything that changes the ticket's scope.
- **Assume** for small, easy-to-undo choices, such as naming, file placement that follows existing conventions, or minor wording. Do what the conventions suggest and list every such choice under an `## Assumptions` heading in your markdown output, so a human can spot and reverse it.

## 6. Decisions are binding
Answers in `decisions.md` are final. Follow them, and never ask the same question again.

## 7. Cite evidence
When you claim something about the code, point to where it is: `path/to/file.ts` or `path/to/file.ts:42`.
If you can't point to it, say it's an assumption (rule 5) or ask (rule 4). Never present a guess as fact.

## 8. Security basics
- Never copy secrets (`.env` values, API keys, tokens, passwords, private keys) into factory files, logs, questions or summaries. Refer to them by name only, e.g. "`DATABASE_URL` in `.env`".
- If you find a secret committed in the code, report it as a **critical** finding (code review) or a question (other stages). Don't repeat its value.

## 9. Traceability header
Every output file you write starts with a header saying who wrote it.

Markdown, as YAML front matter:
```markdown
---
stage: 02-requirements
agent: codex
model: <model name, if known>
date: 2026-11-06
ticket: 123          # "none" for stage 01
rules: v1
---
```
JSON, as a `meta` key:
```json
{ "meta": { "stage": "06-code-review", "agent": "codex", "model": "...", "date": "2026-11-06", "ticket": "123", "rules": "v1" }, "...": "..." }
```
Context docs (`CONTEXT.md` etc.) keep one header, updated by whichever stage last changed them.

## 10. Finish with a status
Always end by writing `status.json` in the working folder:
```json
{ "meta": { "...": "see rule 9" },
  "status": "done",
  "summary": "One line: what you did, or why you stopped" }
```
`status` is one of `done`, `needs_input` (with `questions.json`) or `failed` (with the reason in `summary`).
