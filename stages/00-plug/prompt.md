# Stage 00: Plug

You are connecting this project to **andre-factory**, a multi-agent software factory.
After this stage, the user can open the project and simply say "Run factory stage 01" to any agent.

- `<project>` is the current folder.
- `<factory>` is the factory root: the folder that contains `stages/`, i.e. two levels above this prompt file (`<factory>/stages/00-plug/prompt.md`). Use its absolute path.

First read `<factory>/stages/_shared/rules.md` and follow it. This stage's inputs and outputs are in `<factory>/stages/00-plug/contract.yaml`.

## Steps

1. **Check git.** `<project>` must be a git repository. If it isn't, stop with status `failed` and say so. Don't run `git init` yourself, and don't change branches or commit.

2. **Create the factory folder** (skip anything that already exists, never delete):
   ```
   .factory/
     context/.gitkeep
     tickets/.gitkeep
     .gitignore
   ```
   `.factory/.gitignore` ignores temporary files only:
   ```
   state.json
   status.json
   questions.json
   logs/
   ```

3. **Write `.factory/factory.yaml`**, so every agent knows where the factory is:
   ```yaml
   factory_path: <absolute path of <factory>>
   rules: v1
   plugged_on: <today, YYYY-MM-DD>
   ```
   Don't detect project settings (test command etc.) here. Stage 01 does that.

4. **Add the factory instructions for agents.** This changes a project file the team shares, so **ask first** (rule 4), offering:
   - add the section to `AGENTS.md` (create the file if missing),
   - don't add it (the user will paste the full prompt each time).

   If the user agrees, add this section at the end of `AGENTS.md`, or replace it if a `## Factory` section is already there:
   ```markdown
   ## Factory
   This project is connected to andre-factory (see `.factory/factory.yaml` for its path).
   When asked to "run factory stage <N>":
   1. Read `.factory/factory.yaml` to find `<factory_path>`.
   2. Read and follow `<factory_path>/stages/_shared/rules.md`.
   3. Read and follow `<factory_path>/stages/<N>-*/prompt.md` and its `contract.yaml`.
   The project is this folder. If no ticket is given, ask for it (stages 02 and later need one).
   ```
   `AGENTS.md` is an open convention read by many agents. Don't write to any vendor-specific file: any per-agent setup is done outside this stage.

5. **Finish.** Write `.factory/status.json` (rule 10). In the summary, list every file you created or changed.

## Don't
- Don't analyse the code. That's stage 01.
- Don't commit, push or change branches.
- Don't touch anything outside `<project>` except reading `<factory>`.
