import { existsSync, readFileSync } from "node:fs";
import { minimatch } from "minimatch";
import { resolve } from "node:path";

export type Policy = {
  path: string;
  deniedNetwork: boolean;
  allowedHosts: string[];
  deniedPaths: string[];
  deniedCommands: string[];
  deniedCommandPatterns: string[];
  deniedWorkingDirectories: string[];
};

export type PolicyDiagnostic = {
  line: number;
  severity: "error" | "warning";
  message: string;
};

export type PolicyValidation = {
  path: string;
  policy?: Policy;
  diagnostics: PolicyDiagnostic[];
  valid: boolean;
};

type Section = "allow" | "deny";
type ListKey = "read" | "write" | "commands" | "network" | "paths" | "commandPatterns" | "workingDirectories";

/**
 * Validate SkillCI's intentionally small YAML subset. Unknown fields fail
 * closed instead of being silently ignored, which keeps policies reviewable.
 */
export function validatePolicy(policyPath: string): PolicyValidation {
  const path = resolve(policyPath);
  const diagnostics: PolicyDiagnostic[] = [];
  if (!existsSync(path)) {
    return { path, diagnostics: [{ line: 0, severity: "error", message: `Policy does not exist: ${policyPath}` }], valid: false };
  }

  const policy: Policy = { path, deniedNetwork: false, allowedHosts: [], deniedPaths: [], deniedCommands: [], deniedCommandPatterns: [], deniedWorkingDirectories: [] };
  let section: Section | undefined;
  let list: ListKey | undefined;

  for (const [offset, rawLine] of readFileSync(path, "utf8").split(/\r?\n/).entries()) {
    if (/^\s*#/.test(rawLine)) continue;
    const lineNumber = offset + 1;
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;

    const topLevel = line.match(/^([A-Za-z][\w-]*)\s*:\s*$/);
    if (topLevel) {
      if (topLevel[1] !== "allow" && topLevel[1] !== "deny") {
        diagnostics.push(error(lineNumber, `Unknown top-level key: ${topLevel[1]}. Expected allow or deny.`));
        section = undefined;
        list = undefined;
      } else {
        section = topLevel[1];
        list = undefined;
      }
      continue;
    }

    const scalar = line.match(/^\s{2}([A-Za-z][\w-]*)\s*:\s*(.*?)\s*$/);
    if (scalar) {
      if (!section) {
        diagnostics.push(error(lineNumber, "A policy key must be nested under allow or deny."));
        continue;
      }
      const [, key, value] = scalar;
      if (section === "deny" && key === "network") {
        if (value !== "true" && value !== "false") diagnostics.push(error(lineNumber, "deny.network must be true or false."));
        else policy.deniedNetwork = value === "true";
        list = undefined;
        continue;
      }
      if (!isListKey(section, key)) {
        diagnostics.push(error(lineNumber, `Unsupported ${section}.${key} policy key.`));
        list = undefined;
        continue;
      }
      if (value) diagnostics.push(error(lineNumber, `${section}.${key} must be a YAML list.`));
      list = key;
      continue;
    }

    const item = line.match(/^\s{4}-\s*(.+?)\s*$/);
    if (item) {
      if (!section || !list) {
        diagnostics.push(error(lineNumber, "A list value must follow a supported policy list."));
        continue;
      }
      const value = unquote(item[1]);
      if (!value) {
        diagnostics.push(error(lineNumber, "Policy list values cannot be empty."));
        continue;
      }
      addPolicyValue(policy, section, list, value, lineNumber, diagnostics);
      continue;
    }

    diagnostics.push(error(lineNumber, "Unsupported policy syntax. Use two-space keys and four-space list items."));
  }

  if (policy.deniedNetwork && policy.allowedHosts.length > 0) {
    diagnostics.push(error(0, "deny.network: true cannot be combined with allow.network. Remove one of them."));
  }
  for (const host of policy.allowedHosts) {
    if (!isHostPattern(host)) diagnostics.push(error(0, `Invalid allow.network host: ${host}. Use a hostname such as api.github.com or *.github.com.`));
  }
  return { path, policy, diagnostics, valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error") };
}

export function loadPolicy(policyPath: string): Policy {
  const result = validatePolicy(policyPath);
  if (!result.valid || !result.policy) {
    const details = result.diagnostics.map((diagnostic) => `${diagnostic.line ? `line ${diagnostic.line}: ` : ""}${diagnostic.message}`).join("; ");
    throw new Error(`Invalid policy: ${details}`);
  }
  return result.policy;
}

export function renderPolicyValidation(result: PolicyValidation): string {
  const lines = ["# SkillCI policy check", "", `- **Policy:** \`${result.path}\``, `- **Status:** ${result.valid ? "✅ valid" : "❌ invalid"}`];
  if (result.diagnostics.length === 0) return `${lines.join("\n")}\n\nNo policy issues found.\n`;

  lines.push("", "## Diagnostics", "");
  for (const diagnostic of result.diagnostics) {
    lines.push(`- **${diagnostic.severity.toUpperCase()}**${diagnostic.line ? ` (line ${diagnostic.line})` : ""}: ${diagnostic.message}`);
  }
  return `${lines.join("\n")}\n`;
}

export function matchesDeniedPath(line: string, pattern: string): boolean {
  return extractPathCandidates(line).some((candidate) => matchesPathPattern(candidate, pattern));
}

export function matchesPathPattern(candidate: string, pattern: string): boolean {
  return minimatch(candidate, pattern, { dot: true, matchBase: !pattern.includes("/") });
}

export function matchesCommandPattern(line: string, pattern: string): boolean {
  return extractCommandCandidates(line).some((command) => minimatch(command, pattern, { dot: true, nocase: true, nocomment: true, nonegate: true }));
}

export function extractWorkingDirectories(line: string): string[] {
  const directories = new Set<string>();
  for (const match of line.matchAll(/\bcd\s+([^\s;&|`]+)/gi)) directories.add(normalizePath(match[1]));
  for (const match of line.matchAll(/(?:--cwd|--working-directory)\s+([^\s;&|`]+)/gi)) directories.add(normalizePath(match[1]));
  for (const match of line.matchAll(/\b(?:workdir|workingDirectory)\s*[:=]\s*([^\s,;]+)/gi)) directories.add(normalizePath(match[1]));
  return [...directories].filter(Boolean);
}

export function extractNetworkHosts(line: string): string[] {
  const hosts = new Set<string>();
  for (const match of line.matchAll(/https?:\/\/([^\s/:?#"'`]+)/gi)) hosts.add(match[1].toLowerCase());
  return [...hosts];
}

export function hostIsAllowed(host: string, allowedHosts: string[]): boolean {
  return allowedHosts.some((pattern) => minimatch(host, pattern.toLowerCase(), { nocase: true }));
}

function isListKey(section: Section, key: string): key is ListKey {
  if (section === "allow") return key === "read" || key === "write" || key === "commands" || key === "network";
  return key === "paths" || key === "commands" || key === "commandPatterns" || key === "workingDirectories";
}

function addPolicyValue(policy: Policy, section: Section, list: ListKey, value: string, line: number, diagnostics: PolicyDiagnostic[]): void {
  const destination = section === "deny" && list === "paths"
    ? policy.deniedPaths
    : section === "deny" && list === "commands"
      ? policy.deniedCommands
      : section === "deny" && list === "commandPatterns"
        ? policy.deniedCommandPatterns
        : section === "deny" && list === "workingDirectories"
          ? policy.deniedWorkingDirectories
      : section === "allow" && list === "network"
        ? policy.allowedHosts
        : undefined;

  if (!destination) return;
  if (destination.includes(value)) {
    diagnostics.push({ line, severity: "warning", message: `Duplicate ${section}.${list} value: ${value}.` });
    return;
  }
  destination.push(value);
}

function isHostPattern(host: string): boolean {
  return /^(?:\*\.)?(?:[a-z0-9-]+\.)+[a-z0-9-]+$/i.test(host);
}

function extractPathCandidates(line: string): string[] {
  return line
    .split(/\s+/)
    .map((token) => token.replace(/^[`'"([{<]+|[`'"\])}>.,;:!?]+$/g, "").replace(/^\.\//, "").replace(/\\/g, "/"))
    .filter((token) => token.includes("/") || token.startsWith(".") || token.includes("."));
}

function extractCommandCandidates(line: string): string[] {
  const codeSpans = [...line.matchAll(/`([^`]+)`/g)].map((match) => normalizeCommand(match[1]));
  if (codeSpans.length > 0) return codeSpans.filter(Boolean);
  return [normalizeCommand(line.replace(/^\s*(?:run|execute)\s+/i, ""))].filter(Boolean);
}

function normalizeCommand(value: string): string {
  return value.trim().replace(/[.;]+$/, "").replace(/\s+/g, " ");
}

function normalizePath(value: string): string {
  return value.replace(/^[`'"([{<]+|[`'"\])}>.,;:!?]+$/g, "").replace(/^\.\//, "").replace(/\\/g, "/");
}

function error(line: number, message: string): PolicyDiagnostic {
  return { line, severity: "error", message };
}

function unquote(value: string): string {
  return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
}
