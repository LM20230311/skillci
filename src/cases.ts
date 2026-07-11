import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { audit } from "./audit.js";
import type { AuditResult, TestCaseResult, TestRunResult } from "./types.js";

const RISK_WEIGHT: Record<AuditResult["score"], number> = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

type CaseDefinition = {
  name: string;
  target: string;
  policy?: string;
  maxRisk: AuditResult["score"];
  forbiddenRules: string[];
};

export function runCases(casesPath: string): TestRunResult {
  const absoluteCasesPath = resolve(casesPath);
  const results = collectCaseFiles(absoluteCasesPath).map((caseFile) => runCase(caseFile));
  return { casesPath: absoluteCasesPath, results };
}

export function renderTestRun(result: TestRunResult): string {
  const passed = result.results.filter((item) => item.passed).length;
  const lines = [
    "# SkillCI test run",
    "",
    `- **Cases:** ${result.results.length}`,
    `- **Passed:** ${passed}`,
    `- **Failed:** ${result.results.length - passed}`,
    "",
    "| Status | Case | Expected max risk | Actual risk | Details |",
    "| --- | --- | --- | --- | --- |"
  ];
  for (const item of result.results) {
    const detail = item.error ?? (item.unexpectedRules.length ? `Unexpected rules: ${item.unexpectedRules.join(", ")}` : "");
    lines.push(`| ${item.passed ? "✅" : "❌"} | ${item.name} | ${item.expectedMaxRisk} | ${item.actualRisk} | ${detail} |`);
  }
  return `${lines.join("\n")}\n`;
}

function runCase(caseFile: string): TestCaseResult {
  let definition: CaseDefinition | undefined;
  try {
    definition = parseCase(readFileSync(caseFile, "utf8"));
    const base = dirname(caseFile);
    const result = audit(resolve(base, definition.target), { policyPath: definition.policy ? resolve(base, definition.policy) : undefined });
    const unexpectedRules = result.findings.filter((finding) => definition!.forbiddenRules.includes(finding.ruleId)).map((finding) => finding.ruleId);
    return {
      name: definition.name,
      caseFile,
      passed: RISK_WEIGHT[result.score] <= RISK_WEIGHT[definition.maxRisk] && unexpectedRules.length === 0,
      expectedMaxRisk: definition.maxRisk,
      actualRisk: result.score,
      unexpectedRules: [...new Set(unexpectedRules)]
    };
  } catch (error) {
    return {
      name: definition?.name ?? relative(process.cwd(), caseFile),
      caseFile,
      passed: false,
      expectedMaxRisk: definition?.maxRisk ?? "none",
      actualRisk: "none",
      unexpectedRules: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function parseCase(content: string): CaseDefinition {
  const values: Partial<CaseDefinition> = { forbiddenRules: [] };
  let inForbiddenRules = false;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    const keyValue = line.match(/^\s*(name|target|policy|maxRisk)\s*:\s*(.+?)\s*$/);
    if (keyValue) {
      const [, key, value] = keyValue;
      if (key === "name") values.name = value;
      if (key === "target") values.target = value;
      if (key === "policy") values.policy = value;
      if (key === "maxRisk") values.maxRisk = toRisk(value);
      inForbiddenRules = false;
      continue;
    }
    if (/^\s*forbiddenRules\s*:\s*$/.test(line)) {
      inForbiddenRules = true;
      continue;
    }
    const listItem = line.match(/^\s*-\s*(\S+)\s*$/);
    if (inForbiddenRules && listItem) values.forbiddenRules!.push(listItem[1]);
  }
  if (!values.name || !values.target || !values.maxRisk) throw new Error("A case requires name, target, and expect.maxRisk.");
  return values as CaseDefinition;
}

function toRisk(value: string): AuditResult["score"] {
  if (["none", "low", "medium", "high", "critical"].includes(value)) return value as AuditResult["score"];
  throw new Error(`Unknown maxRisk: ${value}`);
}

function collectCaseFiles(path: string): string[] {
  const stats = statSync(path);
  if (stats.isFile()) return isCaseFile(path) ? [path] : [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) return collectCaseFiles(child);
    return entry.isFile() && isCaseFile(entry.name) ? [child] : [];
  });
}

function isCaseFile(path: string): boolean {
  return path.endsWith(".yml") || path.endsWith(".yaml");
}
