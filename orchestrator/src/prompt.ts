import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, skillFile } from './config.ts';
import { readRules, type Stage } from './stage.ts';

export type PromptValues = {
  stage: Stage;
  project: string;
  ticketId: string;       // "none" for stages without a ticket
  workingFolder: string;
  agent: string;
  model?: string;
  agentsInUse: string[];  // expands <agent> in contract.inputs.factory
  skills: string[];       // names of skills/<name>.md to include
  nativeSkills: string[]; // skills built into the agent; only named in the prompt
};

// Factory files the contract asks for (e.g. config.yaml, adapters/<agent>/plug.md), so the agent
// gets them as text and never needs access to the factory folder.
function factoryFiles(stage: Stage, agentsInUse: string[]): string[] {
  const wanted = stage.contract.inputs?.factory ?? [];
  const paths = wanted.flatMap((p) =>
    p.includes('<agent>') ? agentsInUse.map((a) => p.replaceAll('<agent>', a)) : [p],
  );
  return paths.filter((p) => existsSync(path.join(FACTORY_ROOT, p)));
}

function block(title: string, body: string): string {
  return `===== BEGIN ${title} =====\n${body.trimEnd()}\n===== END ${title} =====`;
}

export function buildPrompt(v: PromptValues): string {
  const today = new Date().toISOString().slice(0, 10);
  const files = factoryFiles(v.stage, v.agentsInUse).map((p) =>
    block(`<factory>/${p}`, readFileSync(path.join(FACTORY_ROOT, p), 'utf8')),
  );
  const skills = v.skills.map((name) => block(`<factory>/skills/${name}.md`, readFileSync(skillFile(name), 'utf8')));

  return [
    `# andre-factory: stage ${v.stage.dir}`,
    'You are running one stage of andre-factory, started by its orchestrator.',
    '',
    '## Values',
    `- <project>: ${v.project} (your current folder)`,
    `- <factory>: ${FACTORY_ROOT}`,
    `- Stage: ${v.stage.dir}`,
    `- Ticket: ${v.ticketId}`,
    `- Working folder: ${v.workingFolder}`,
    `- Date: ${today}`,
    `- Agent: ${v.agent}${v.model ? ` (model: ${v.model})` : ''}`,
    '',
    '## How this run works',
    '- Every factory file you need is included below as text. Use those copies; you don\'t need to read the factory folder.',
    '- This run is **not interactive**: no user is chatting with you. When you need a decision, follow shared rule 4:',
    '  write questions.json and status.json with "needs_input", then stop. The orchestrator asks the user and runs this',
    '  stage again; the answers will then be in decisions.md in the working folder.',
    '',
    block('<factory>/stages/_shared/rules.md', readRules()),
    '',
    block(`<factory>/stages/${v.stage.dir}/contract.yaml`, v.stage.contractText),
    '',
    block(`<factory>/stages/${v.stage.dir}/prompt.md`, v.stage.prompt),
    ...(skills.length ? ['', '## Skills for this stage (apply them while doing the stage)', ...skills] : []),
    ...(v.nativeSkills.length
      ? ['', `Also use these skills you have available, where they apply: ${v.nativeSkills.join(', ')}.`]
      : []),
    ...(files.length ? ['', '## Factory files referenced above', ...files] : []),
    '',
  ].join('\n');
}
