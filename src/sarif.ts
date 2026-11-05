import { createHash } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { auditRuleMetadata } from "./audit.js";
import type { AuditResult, Severity } from "./types.js";
import { TOOL_VERSION } from "./version.js";

/** SARIF intentionally excludes source excerpts and user-authored messages. */
export function renderSarif(audit: AuditResult, options: { sourceRoot?: string } = {}) {
  const root = realpathSync(resolve(options.sourceRoot ?? "."));
  if (!statSync(root).isDirectory()) throw new Error("SARIF --source-root must be a directory.");
  const target = realpathSync(audit.target);
  assertContained(root, target);
  const base = statSync(target).isDirectory() ? target : dirname(target);
  const metadata = auditRuleMetadata();
  const rules = metadata.map(rule => ({
    id: rule.ruleId,
    shortDescription: { text: rule.title },
    fullDescription: { text: rule.detail },
    help: { text: rule.remediation },
    defaultConfiguration: { level: level(rule.severity) },
    properties: { tags: ["security", "agent-skills"], skillciSeverity: rule.severity }
  }));
  const entries = [
    ...audit.findings.map(finding => ({ finding, suppressed: false })),
    ...audit.suppressedFindings.map(finding => ({ finding, suppressed: true }))
  ].sort((a, b) => compare(a.finding.file, b.finding.file) || a.finding.line - b.finding.line || compare(a.finding.ruleId, b.finding.ruleId));
  const occurrences = new Map<string, number>();
  const results = entries.map(({ finding, suppressed }) => {
    const ruleIndex = metadata.findIndex(rule => rule.ruleId === finding.ruleId);
    if (ruleIndex < 0) throw new Error("SARIF cannot represent an unknown rule.");
    const rule = metadata[ruleIndex];
    const path = realpathSync(resolve(base, finding.file));
    const local = assertContained(root, path);
    if (!Number.isInteger(finding.line) || finding.line < 1) throw new Error("SARIF requires a positive source line.");
    const uri = local.split(sep).map(encodeURIComponent).join("/");
    const key = JSON.stringify([rule.ruleId, uri, finding.excerpt.trim()]);
    const occurrence = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, occurrence);
    return {
      ruleId: rule.ruleId, ruleIndex, level: level(rule.severity),
      message: { text: `${rule.detail} ${rule.remediation}` },
      locations: [{ physicalLocation: { artifactLocation: { uri }, region: { startLine: finding.line } } }],
      partialFingerprints: { primaryLocationLineHash: `${createHash("sha256").update(key).digest("hex")}:${occurrence}` },
      ...(suppressed ? { suppressions: [{ kind: "inSource", status: "accepted", justification: "Reviewed inline suppression; inspect the source directive for context." }] } : {})
    };
  });
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json", version: "2.1.0",
    runs: [{ tool: { driver: { name: "SkillCI", semanticVersion: TOOL_VERSION, informationUri: "https://github.com/LM20230311/skillci", rules } }, results }]
  };
}

function assertContained(root: string, path: string): string {
  const local = relative(root, path);
  if (local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) throw new Error("SARIF target and source files must be inside --source-root.");
  return local;
}
function level(severity: Severity): "error" | "warning" | "note" {
  return severity === "high" || severity === "critical" ? "error" : severity === "medium" ? "warning" : "note";
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
