import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { loadPolicy, type Policy } from "./policy.js";
import type { AuditResult, Finding, Severity } from "./types.js";

type Rule = Omit<Finding, "file" | "line" | "excerpt"> & { pattern: RegExp };

const RULES: Rule[] = [
  {
    ruleId: "SKILLCI001",
    severity: "critical",
    title: "Destructive recursive deletion",
    detail: "The skill contains a recursive forced deletion command.",
    remediation: "Replace it with a narrowly scoped, reviewed deletion or require explicit approval.",
    pattern: /\brm\s+(?:-[a-z]*r[a-z]*f[a-z]*|-rf|-fr)\b/i
  },
  {
    ruleId: "SKILLCI002",
    severity: "critical",
    title: "Remote script execution",
    detail: "The skill pipes downloaded content directly into a shell.",
    remediation: "Download, verify, and review the script before executing it.",
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash|zsh)\b/i
  },
  {
    ruleId: "SKILLCI003",
    severity: "high",
    title: "Sensitive file access",
    detail: "The skill references credentials, environment files, or SSH material.",
    remediation: "Use scoped secrets supplied by the runtime; do not instruct agents to read local credentials.",
    pattern: /(?:^|[^\w])(?:\.env(?:\.[\w-]+)?|~\/\.ssh|id_rsa|credentials(?:\.json)?)(?:$|[^\w])/i
  },
  {
    ruleId: "SKILLCI004",
    severity: "medium",
    title: "Unbounded network access",
    detail: "The skill initiates a network request without documenting an allowlist.",
    remediation: "Document approved hosts and require a policy allowlist for network calls.",
    pattern: /\b(?:curl|wget|fetch\s*\(|axios\.|https?:\/\/)/i
  },
  {
    ruleId: "SKILLCI005",
    severity: "high",
    title: "Force push or destructive Git reset",
    detail: "The skill can rewrite shared history or discard uncommitted work.",
    remediation: "Require explicit confirmation and use a protected branch workflow.",
    pattern: /\bgit\s+(?:push\s+[^\n]*--force|reset\s+--hard)\b/i
  },
  {
    ruleId: "SKILLCI006",
    severity: "medium",
    title: "Workspace escape attempt",
    detail: "The skill references a parent directory or an absolute home path.",
    remediation: "Constrain reads and writes to an explicit workspace allowlist.",
    pattern: /(?:\.\.\/|\/~\/|\/Users\/|\/home\/)/
  }
];

const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage"]);
const TEXT_EXTENSIONS = new Set([".md", ".txt", ".sh", ".bash", ".zsh", ".js", ".mjs", ".cjs", ".ts", ".json", ".yml", ".yaml"]);
const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function audit(targetPath: string, options: { policyPath?: string } = {}): AuditResult {
  const absoluteTarget = resolve(targetPath);
  if (!existsSync(absoluteTarget)) {
    throw new Error(`Target does not exist: ${targetPath}`);
  }

  const policy = options.policyPath ? loadPolicy(options.policyPath) : undefined;
  const files = collectFiles(absoluteTarget).filter((file) => file !== policy?.path);
  const findings: Finding[] = [];

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of RULES) {
        rule.pattern.lastIndex = 0;
        if (!rule.pattern.test(line)) continue;
        findings.push({
          ...withoutPattern(rule),
          file: relative(absoluteTarget, file) || file,
          line: index + 1,
          excerpt: line.trim().slice(0, 180)
        });
      }
      if (policy) findings.push(...policyFindings(policy, line, relative(absoluteTarget, file) || file, index + 1));
    });
  }

  findings.sort((left, right) => SEVERITY_WEIGHT[right.severity] - SEVERITY_WEIGHT[left.severity] || left.file.localeCompare(right.file) || left.line - right.line);
  return {
    target: absoluteTarget,
    scannedFiles: files.length,
    findings,
    score: score(findings),
    policy: policy && {
      path: policy.path,
      deniedNetwork: policy.deniedNetwork,
      deniedPaths: policy.deniedPaths,
      deniedCommands: policy.deniedCommands
    }
  };
}

function policyFindings(policy: Policy, line: string, file: string, lineNumber: number): Finding[] {
  const findings: Finding[] = [];
  const excerpt = line.trim().slice(0, 180);
  if (policy.deniedNetwork && RULES.find((rule) => rule.ruleId === "SKILLCI004")!.pattern.test(line)) {
    findings.push({
      ruleId: "SKILLCI101",
      severity: "high",
      title: "Policy denies network access",
      detail: "This instruction initiates network access, but the selected policy sets deny.network to true.",
      remediation: "Remove the request or change the reviewed policy to allow a narrowly scoped host.",
      file,
      line: lineNumber,
      excerpt
    });
  }
  for (const deniedPath of policy.deniedPaths) {
    const needle = deniedPath.replace(/\*+$/, "").replace(/\/$/, "");
    if (needle && line.includes(needle)) {
      findings.push({
        ruleId: "SKILLCI102",
        severity: "high",
        title: "Policy denies path access",
        detail: `This instruction references ${deniedPath}, which is denied by the selected policy.`,
        remediation: "Remove the access or change the reviewed policy with a narrower exception.",
        file,
        line: lineNumber,
        excerpt
      });
    }
  }
  for (const deniedCommand of policy.deniedCommands) {
    if (matchesCommand(line, deniedCommand)) {
      findings.push({
        ruleId: "SKILLCI103",
        severity: "high",
        title: "Policy denies command",
        detail: `This instruction includes ${deniedCommand}, which is denied by the selected policy.`,
        remediation: "Remove the command or approve a specific, narrowly scoped exception.",
        file,
        line: lineNumber,
        excerpt
      });
    }
  }
  return findings;
}

function matchesCommand(line: string, deniedCommand: string): boolean {
  const words = deniedCommand.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const escapedWords = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(escapedWords.join("(?:\\s+\\S+)*?\\s+")).test(line);
}

function withoutPattern(rule: Rule): Omit<Finding, "file" | "line" | "excerpt"> {
  const { pattern: _pattern, ...finding } = rule;
  return finding;
}

function collectFiles(target: string): string[] {
  const targetStats = statSync(target);
  if (targetStats.isFile()) return isTextFile(target) ? [target] : [];

  const files: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) files.push(...collectFiles(resolve(target, entry.name)));
    } else if (entry.isFile() && isTextFile(entry.name)) {
      files.push(resolve(target, entry.name));
    }
  }
  return files;
}

function isTextFile(file: string): boolean {
  const extension = file.includes(".") ? `.${file.split(".").pop()}` : "";
  return TEXT_EXTENSIONS.has(extension.toLowerCase()) || file === "SKILL.md" || file === "AGENTS.md";
}

function score(findings: Finding[]): AuditResult["score"] {
  if (findings.length === 0) return "none";
  const mostSevere = Math.max(...findings.map((finding) => SEVERITY_WEIGHT[finding.severity]));
  return (["none", "low", "medium", "high", "critical"] as const)[mostSevere];
}
