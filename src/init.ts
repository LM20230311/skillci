import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const POLICY = `# SkillCI policy: keep this file with the skill it governs.\n# Only fields that SkillCI currently enforces are included here.\ndeny:\n  paths:\n    - .env\n    - ~/.ssh/**\n  commands:\n    - git push --force\n  network: true\n`;

const CASE = `# A regression test: run with \`skillci test skillci/cases\`.\nname: sample-documentation-skill-stays-safe\ntarget: ../fixtures/docs-skill\npolicy: ../policy.yml\nexpect:\n  maxRisk: low\n  forbiddenRules:\n    - SKILLCI001\n    - SKILLCI002\n`;

const SAMPLE_SKILL = `---\nname: docs-skill\ndescription: A safe starter skill used by the generated SkillCI regression case.\n---\n\n# Documentation update\n\nUpdate documentation files inside the current workspace, then run \`npm test\`. Do not access secrets, make network requests, or modify files outside the workspace.\n`;

export function initialize(targetPath = "."): string[] {
  const root = resolve(targetPath, "skillci");
  const cases = resolve(root, "cases");
  const fixtures = resolve(root, "fixtures", "docs-skill");
  mkdirSync(cases, { recursive: true });
  mkdirSync(fixtures, { recursive: true });

  const created: string[] = [];
  for (const [path, content] of [[resolve(root, "policy.yml"), POLICY], [resolve(cases, "smoke.yml"), CASE], [resolve(fixtures, "SKILL.md"), SAMPLE_SKILL]] as const) {
    if (existsSync(path)) continue;
    writeFileSync(path, content, "utf8");
    created.push(path);
  }
  return created;
}
