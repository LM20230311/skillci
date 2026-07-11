import type { AuditResult, Finding } from "./types.js";

export function renderMarkdown(result: AuditResult): string {
  const heading = `# SkillCI audit report\n\n`;
  const summary = [
    `- **Target:** \`${result.target}\``,
    `- **Files scanned:** ${result.scannedFiles}`,
    `- **Findings:** ${result.findings.length}`,
    `- **Suppressed findings:** ${result.suppressedFindings.length}`,
    `- **Risk score:** ${badge(result.score)}`
  ].join("\n");
  const policy = result.policy ? `\n- **Policy:** \`${result.policy.path}\`` : "";

  if (result.findings.length === 0) {
    return `${heading}${summary}${policy}\n\n✅ No active findings detected by the current rule set.\n${renderSuppressions(result.suppressedFindings)}`;
  }

  const rows = result.findings
    .map((finding) => `| ${badge(finding.severity)} | \`${finding.ruleId}\` | ${finding.title} | \`${finding.file}:${finding.line}\` |`)
    .join("\n");
  const details = result.findings.map(renderDetail).join("\n\n");

  return `${heading}${summary}${policy}\n\n## Findings\n\n| Severity | Rule | Finding | Location |\n| --- | --- | --- | --- |\n${rows}\n\n## How to fix\n\n${details}\n${renderSuppressions(result.suppressedFindings)}`;
}

export function renderGitHubAnnotations(result: AuditResult): string {
  const annotations = result.findings.map((finding) => {
    const level = finding.severity === "critical" || finding.severity === "high" ? "error" : "warning";
    return `::${level} file=${escapeGitHub(finding.file)},line=${finding.line},title=${finding.ruleId} ${escapeGitHub(finding.title)}::${escapeGitHub(finding.detail)}`;
  });
  const suppressions = result.suppressedFindings.map((finding) => `::notice file=${escapeGitHub(finding.file)},line=${finding.line},title=${finding.ruleId} suppressed::${escapeGitHub(finding.reason)}`);
  const summary = `::notice title=SkillCI audit::${result.findings.length} active finding(s), ${result.suppressedFindings.length} suppressed; risk score: ${result.score}.`;
  return [...annotations, ...suppressions, summary].join("\n");
}

function renderSuppressions(suppressedFindings: AuditResult["suppressedFindings"]): string {
  if (suppressedFindings.length === 0) return "";
  const rows = suppressedFindings.map((finding) => `| \`${finding.ruleId}\` | ${finding.title} | \`${finding.file}:${finding.line}\` | ${finding.reason} |`).join("\n");
  return `\n## Suppressed findings\n\n| Rule | Finding | Location | Reviewed reason |\n| --- | --- | --- | --- |\n${rows}\n`;
}

function renderDetail(finding: Finding): string {
  return [
    `### ${finding.ruleId}: ${finding.title}`,
    "",
    `**Location:** \`${finding.file}:${finding.line}\``,
    "",
    `> ${finding.excerpt || "(empty line)"}`,
    "",
    `${finding.detail} ${finding.remediation}`
  ].join("\n");
}

function badge(value: string): string {
  return value === "none" ? "✅ none" : `**${value.toUpperCase()}**`;
}

function escapeGitHub(value: string): string {
  return value.replace(/[\r\n]/g, " ").replace(/%/g, "%25").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
