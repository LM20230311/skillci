import fs from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { minimatch } from "minimatch";
import { TOOL_VERSION } from "./version.js";

export type DiscoveryHost = "codex" | "claude" | "cursor" | "copilot";
export type DiscoveryItem = {
  path: string;
  kind: "skill" | "instruction";
  hosts: DiscoveryHost[];
  evidence: string[];
  policyCoverage: "unknown";
};
export type DiscoveryDiagnostic = {
  path: string;
  code: "invalid-root" | "unreadable" | "symlink-skipped" | "depth-limit";
  severity: "info" | "error";
  message: string;
};
export type DiscoveryResult = {
  schemaVersion: 1;
  toolVersion: string;
  root: ".";
  complete: boolean;
  ignoredDirectories: string[];
  symlinks: "skip";
  items: DiscoveryItem[];
  diagnostics: DiscoveryDiagnostic[];
};

const IGNORED_DIRECTORIES = [".git", ".skillci-workspaces", "coverage", "dist", "node_modules"];
const MAX_DEPTH = 64;
type Convention = { pattern: string; hosts: DiscoveryHost[] };
const CONVENTIONS: Convention[] = [
  { pattern: "**/AGENTS.md", hosts: ["codex", "claude", "cursor", "copilot"] },
  { pattern: "**/AGENTS.override.md", hosts: ["codex"] },
  { pattern: "**/CLAUDE.md", hosts: ["claude"] },
  { pattern: "CLAUDE.md", hosts: ["cursor", "copilot"] },
  { pattern: "**/CLAUDE.local.md", hosts: ["claude"] },
  { pattern: "GEMINI.md", hosts: ["copilot"] },
  { pattern: "**/.claude/rules/**/*.md", hosts: ["claude"] },
  { pattern: "**/.claude/commands/**/*.md", hosts: ["claude"] },
  { pattern: "**/.cursor/rules/**/*.mdc", hosts: ["cursor"] },
  { pattern: "**/.cursorrules", hosts: ["cursor"] },
  { pattern: "**/.github/copilot-instructions.md", hosts: ["copilot"] },
  { pattern: "**/.github/instructions/**/*.instructions.md", hosts: ["copilot"] },
  { pattern: "**/.agents/skills/**/SKILL.md", hosts: ["codex", "cursor", "copilot"] },
  { pattern: "**/.claude/skills/**/SKILL.md", hosts: ["claude", "cursor", "copilot"] },
  { pattern: "**/.cursor/skills/**/SKILL.md", hosts: ["cursor"] },
  { pattern: "**/.codex/skills/**/SKILL.md", hosts: ["cursor"] },
  { pattern: "**/.github/skills/**/SKILL.md", hosts: ["copilot"] }
];

/** Inventory of project files, not an emulation of any host's active context. */
export function discover(rootPath = "."): DiscoveryResult {
  const root = resolve(rootPath);
  const result: DiscoveryResult = {
    schemaVersion: 1, toolVersion: TOOL_VERSION, root: ".", complete: true,
    ignoredDirectories: [...IGNORED_DIRECTORIES], symlinks: "skip", items: [], diagnostics: []
  };
  const report = (path: string, code: DiscoveryDiagnostic["code"], severity: DiscoveryDiagnostic["severity"], message: string) => {
    result.diagnostics.push({ path, code, severity, message });
    if (severity === "error") result.complete = false;
  };
  try {
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      report(".", "invalid-root", "error", "Discovery requires a directory that is not a symbolic link.");
      return result;
    }
  } catch {
    report(".", "invalid-root", "error", "Discovery root does not exist or cannot be accessed.");
    return result;
  }

  function visit(directory: string, depth: number): void {
    const directoryPath = posix(relative(root, directory)) || ".";
    if (depth > MAX_DEPTH) {
      report(directoryPath, "depth-limit", "error", "Directory depth exceeds the discovery limit of 64.");
      return;
    }
    let names: string[];
    try { names = fs.readdirSync(directory).sort(compare); }
    catch {
      report(directoryPath, "unreadable", "error", "Cannot read directory; inventory is incomplete.");
      return;
    }
    for (const name of names) {
      const absolutePath = join(directory, name);
      const path = posix(relative(root, absolutePath));
      try {
        const stat = fs.lstatSync(absolutePath);
        if (stat.isSymbolicLink()) {
          report(path, "symlink-skipped", "info", "Symbolic link was skipped without reading its target.");
        } else if (stat.isDirectory()) {
          if (!IGNORED_DIRECTORIES.includes(name)) visit(absolutePath, depth + 1);
        } else if (stat.isFile()) {
          const item = identify(path);
          if (item) {
            // Check readability without loading file content into the inventory.
            const descriptor = fs.openSync(absolutePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
            fs.closeSync(descriptor);
            result.items.push(item);
          }
        }
      } catch {
        report(path, "unreadable", "error", "Cannot inspect entry; inventory is incomplete.");
      }
    }
  }
  visit(root, 0);
  result.items.sort((a, b) => compare(a.path, b.path));
  result.diagnostics.sort((a, b) => compare(a.path, b.path) || compare(a.code, b.code));
  return result;
}

function identify(path: string): DiscoveryItem | undefined {
  const conventions = CONVENTIONS.filter(({ pattern }) => minimatch(path, pattern, { dot: true }));
  const skill = basename(path) === "SKILL.md";
  if (!skill && conventions.length === 0) return undefined;
  return {
    path, kind: skill ? "skill" : "instruction",
    hosts: [...new Set(conventions.flatMap(({ hosts }) => hosts))].sort(compare),
    evidence: conventions.length ? conventions.map(({ pattern }) => pattern).sort(compare) : ["portable SKILL.md filename"],
    policyCoverage: "unknown"
  };
}

export function renderDiscovery(result: DiscoveryResult): string {
  const lines = ["# SkillCI discovery", "", `- Status: ${result.complete ? "complete within declared scope" : "incomplete"}`,
    `- Files found: ${result.items.length}`, `- Ignored directories: ${result.ignoredDirectories.join(", ")}`,
    "- Symbolic links: skipped; policy coverage: unknown", ""];
  if (!result.items.length) lines.push("No supported Skill or instruction files found. This is not a safety assessment.");
  else {
    lines.push("| Path | Kind | Host conventions | Evidence |", "| --- | --- | --- | --- |");
    for (const item of result.items) lines.push(`| ${cell(item.path)} | ${item.kind} | ${item.hosts.join(", ") || "unassigned"} | ${cell(item.evidence.join(", "))} |`);
    lines.push("", "Paths are relative to the directory passed to discover; use that directory as cwd when auditing.");
  }
  if (result.diagnostics.length) lines.push("", "## Diagnostics", "", ...result.diagnostics.map(d => `- ${d.severity}: ${cell(d.path)} (${d.code}): ${d.message}`));
  lines.push("", "This is a file inventory. Host loading, frontmatter validity, and policy enforcement are not inferred.");
  return `${lines.join("\n")}\n`;
}

function posix(path: string): string { return path.split(sep).join("/"); }
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function cell(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replace(/[\\|`*_{}\[\]()!#]/g, character => `&#${character.charCodeAt(0)};`).replace(/[\r\n]/g, " ");
}
