export function renderMarkdown(result) {
    const heading = `# SkillCI audit report\n\n`;
    const summary = [
        `- **Target:** \`${result.target}\``,
        `- **Files scanned:** ${result.scannedFiles}`,
        `- **Findings:** ${result.findings.length}`,
        `- **Risk score:** ${badge(result.score)}`
    ].join("\n");
    const policy = result.policy ? `\n- **Policy:** \`${result.policy.path}\`` : "";
    if (result.findings.length === 0) {
        return `${heading}${summary}${policy}\n\n✅ No findings detected by the current rule set.\n`;
    }
    const rows = result.findings
        .map((finding) => `| ${badge(finding.severity)} | \`${finding.ruleId}\` | ${finding.title} | \`${finding.file}:${finding.line}\` |`)
        .join("\n");
    const details = result.findings.map(renderDetail).join("\n\n");
    return `${heading}${summary}${policy}\n\n## Findings\n\n| Severity | Rule | Finding | Location |\n| --- | --- | --- | --- |\n${rows}\n\n## How to fix\n\n${details}\n`;
}
export function renderGitHubAnnotations(result) {
    const annotations = result.findings.map((finding) => {
        const level = finding.severity === "critical" || finding.severity === "high" ? "error" : "warning";
        return `::${level} file=${escapeGitHub(finding.file)},line=${finding.line},title=${finding.ruleId} ${escapeGitHub(finding.title)}::${escapeGitHub(finding.detail)}`;
    });
    const summary = `::notice title=SkillCI audit::${result.findings.length} finding(s); risk score: ${result.score}.`;
    return [...annotations, summary].join("\n");
}
function renderDetail(finding) {
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
function badge(value) {
    return value === "none" ? "✅ none" : `**${value.toUpperCase()}**`;
}
function escapeGitHub(value) {
    return value.replace(/[\r\n]/g, " ").replace(/%/g, "%25").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
//# sourceMappingURL=report.js.map