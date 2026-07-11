import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";

const TOOLS = new Set(["filesystem", "shell", "network"]);

export type BehaviorCase = {
  name: string;
  fixture: string;
  input: { prompt: string };
  runner: { image: string; command: string; timeoutSeconds: number };
  tools: { allow: string[]; deny: string[] };
  expect: {
    exitCode: number;
    files: { created: string[]; modified: string[]; unchanged: string[] };
    commands: string[];
    reads: string[];
    writes: string[];
    network: { requests: number };
  };
};

export type BehaviorDiagnostic = { path: string; message: string };

export type BehaviorValidation = {
  path: string;
  behavior?: BehaviorCase;
  diagnostics: BehaviorDiagnostic[];
  valid: boolean;
};

export type BehaviorAssertion = { kind: string; path: string; passed: boolean; detail: string };
export type BehaviorEvent = { kind: "ready" | "read" | "write" | "command" | "network"; value?: string };

export type BehaviorExecution = {
  image: string;
  command: string;
  exitCode: number;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  created: string[];
  modified: string[];
  deleted: string[];
  commands: string[];
  reads: string[];
  writes: string[];
  networkRequests: number;
  tracingReady: boolean;
  assertions: BehaviorAssertion[];
  passed: boolean;
};

export type BehaviorRun = { validation: BehaviorValidation; execution?: BehaviorExecution };

/**
 * Validates a behavior-test contract without executing its runner.
 */
export function validateBehaviorCase(casePath: string): BehaviorValidation {
  const path = resolve(casePath);
  const diagnostics: BehaviorDiagnostic[] = [];
  if (!existsSync(path)) return invalid(path, "Case file does not exist.");

  let raw: unknown;
  try {
    raw = parse(readFileSync(path, "utf8"));
  } catch (error) {
    return invalid(path, `Invalid YAML: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isObject(raw)) return invalid(path, "A behavior case must be a YAML object.");

  checkKeys(raw, ["name", "fixture", "input", "runner", "tools", "expect"], "case", diagnostics);
  const name = stringValue(raw.name, "name", diagnostics);
  const fixture = stringValue(raw.fixture, "fixture", diagnostics);
  if (fixture && !isSafeRelativePath(fixture)) diagnostics.push({ path: "fixture", message: "Fixture must be a relative path inside the case directory." });
  if (fixture && isSafeRelativePath(fixture) && !existsSync(resolve(dirname(path), fixture))) diagnostics.push({ path: "fixture", message: `Fixture does not exist: ${fixture}` });

  const input = objectValue(raw.input, "input", diagnostics);
  if (input) checkKeys(input, ["prompt"], "input", diagnostics);
  const prompt = input ? stringValue(input.prompt, "input.prompt", diagnostics) : undefined;

  const runner = objectValue(raw.runner, "runner", diagnostics);
  if (runner) checkKeys(runner, ["image", "command", "timeoutSeconds"], "runner", diagnostics);
  const image = runner ? stringValue(runner.image, "runner.image", diagnostics) : undefined;
  const command = runner ? stringValue(runner.command, "runner.command", diagnostics) : undefined;
  const timeoutSeconds = runner ? numberValue(runner.timeoutSeconds, "runner.timeoutSeconds", diagnostics) : undefined;
  if (timeoutSeconds !== undefined && (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 600)) diagnostics.push({ path: "runner.timeoutSeconds", message: "Timeout must be an integer between 1 and 600 seconds." });

  const tools = objectValue(raw.tools, "tools", diagnostics);
  if (tools) checkKeys(tools, ["allow", "deny"], "tools", diagnostics);
  const allowedTools = tools ? stringArray(tools.allow, "tools.allow", diagnostics) : undefined;
  const deniedTools = tools ? stringArray(tools.deny, "tools.deny", diagnostics) : undefined;
  for (const tool of [...(allowedTools ?? []), ...(deniedTools ?? [])]) {
    if (!TOOLS.has(tool)) diagnostics.push({ path: "tools", message: `Unknown tool: ${tool}. Allowed values are filesystem, shell, network.` });
  }
  for (const tool of allowedTools ?? []) {
    if (deniedTools?.includes(tool)) diagnostics.push({ path: "tools", message: `${tool} cannot be both allowed and denied.` });
  }

  const expect = objectValue(raw.expect, "expect", diagnostics);
  if (expect) checkKeys(expect, ["exitCode", "files", "commands", "reads", "writes", "network"], "expect", diagnostics);
  const exitCode = expect ? numberValue(expect.exitCode, "expect.exitCode", diagnostics) : undefined;
  if (exitCode !== undefined && (!Number.isInteger(exitCode) || exitCode < 0 || exitCode > 255)) diagnostics.push({ path: "expect.exitCode", message: "Exit code must be an integer between 0 and 255." });
  const files = expect ? objectValue(expect.files, "expect.files", diagnostics) : undefined;
  if (files) checkKeys(files, ["created", "modified", "unchanged"], "expect.files", diagnostics);
  const created = files ? stringArray(files.created, "expect.files.created", diagnostics) : undefined;
  const modified = files ? stringArray(files.modified, "expect.files.modified", diagnostics) : undefined;
  const unchanged = files ? stringArray(files.unchanged, "expect.files.unchanged", diagnostics) : undefined;
  for (const [field, values] of [["expect.files.created", created], ["expect.files.modified", modified], ["expect.files.unchanged", unchanged]] as const) {
    for (const value of values ?? []) if (!isSafeRelativePath(value)) diagnostics.push({ path: field, message: `Expected file path must be relative and stay inside the fixture: ${value}` });
  }
  if (created && modified && unchanged && created.length + modified.length + unchanged.length === 0) diagnostics.push({ path: "expect.files", message: "Specify at least one expected file assertion." });

  const commands = expect ? stringArray(expect.commands, "expect.commands", diagnostics) : undefined;
  if (commands && commands.length === 0) diagnostics.push({ path: "expect.commands", message: "Specify the declared runner command as an allowed command." });
  const reads = expect ? stringArray(expect.reads, "expect.reads", diagnostics) : undefined;
  const writes = expect ? stringArray(expect.writes, "expect.writes", diagnostics) : undefined;
  for (const [field, values] of [["expect.reads", reads], ["expect.writes", writes]] as const) {
    for (const value of values ?? []) if (!isSafeRelativePath(value)) diagnostics.push({ path: field, message: `Observed file path must be relative and stay inside the fixture: ${value}` });
  }
  const network = expect ? objectValue(expect.network, "expect.network", diagnostics) : undefined;
  if (network) checkKeys(network, ["requests"], "expect.network", diagnostics);
  const networkRequests = network ? numberValue(network.requests, "expect.network.requests", diagnostics) : undefined;
  if (networkRequests !== undefined && (!Number.isInteger(networkRequests) || networkRequests < 0 || networkRequests > 1000)) diagnostics.push({ path: "expect.network.requests", message: "Network requests must be an integer between 0 and 1000." });

  const behavior = name && fixture && prompt && image && command && timeoutSeconds !== undefined && allowedTools && deniedTools && exitCode !== undefined && created && modified && unchanged && commands && reads && writes && networkRequests !== undefined
    ? { name, fixture, input: { prompt }, runner: { image, command, timeoutSeconds }, tools: { allow: allowedTools, deny: deniedTools }, expect: { exitCode, files: { created, modified, unchanged }, commands, reads, writes, network: { requests: networkRequests } } }
    : undefined;
  return { path, behavior, diagnostics, valid: diagnostics.length === 0 && behavior !== undefined };
}

export function renderBehaviorValidation(result: BehaviorValidation): string {
  const lines = ["# SkillCI behavior case check", "", `- **Case:** \`${result.path}\``, `- **Status:** ${result.valid ? "✅ valid" : "❌ invalid"}`];
  if (result.valid && result.behavior) {
    lines.push(`- **Fixture:** \`${result.behavior.fixture}\``, `- **Image:** \`${result.behavior.runner.image}\``, `- **Runner:** \`${result.behavior.runner.command}\``, `- **Timeout:** ${result.behavior.runner.timeoutSeconds}s`);
  }
  if (result.diagnostics.length === 0) return `${lines.join("\n")}\n\nThis command validates a contract; it does not execute the runner.\n`;
  lines.push("", "## Diagnostics", "", ...result.diagnostics.map((diagnostic) => `- **${diagnostic.path}:** ${diagnostic.message}`));
  return `${lines.join("\n")}\n`;
}

/** Runs a validated behavior case in an isolated, network-disabled Docker container. */
export function runBehaviorCase(casePath: string): BehaviorRun {
  const validation = validateBehaviorCase(casePath);
  if (!validation.valid || !validation.behavior) return { validation };
  const behavior = validation.behavior;
  if (!behavior.tools.deny.includes("network")) throw new Error("Behavior runner requires tools.deny to include network. Network-enabled runs are not supported yet.");

  const sourceFixture = resolve(dirname(validation.path), behavior.fixture);
  // Keep the temporary mount below the fixture's parent. Docker Desktop on
  // macOS commonly shares project directories under /Users but not /var/folders.
  const temporaryParent = join(dirname(sourceFixture), ".skillci-workspaces");
  mkdirSync(temporaryParent, { recursive: true });
  const temporaryRoot = mkdtempSync(join(temporaryParent, "run-"));
  const workspace = join(temporaryRoot, "workspace");
  try {
    cpSync(sourceFixture, workspace, { recursive: true });
    makeWorkspaceWritable(workspace);
    prepareNodeTrace(workspace);
    const before = snapshotWorkspace(workspace);
    const process = spawnSync("docker", buildDockerArgs(workspace, behavior), {
      encoding: "utf8",
      timeout: (behavior.runner.timeoutSeconds + 10) * 1000,
      maxBuffer: 1024 * 1024
    });
    const processError = process.error as NodeJS.ErrnoException | undefined;
    if (processError && processError.code !== "ETIMEDOUT") throw new Error(`Unable to run Docker: ${processError.message}`);

    const after = snapshotWorkspace(workspace);
    const created = [...after.keys()].filter((path) => !before.has(path)).sort();
    const deleted = [...before.keys()].filter((path) => !after.has(path)).sort();
    const modified = [...after.keys()].filter((path) => before.has(path) && before.get(path) !== after.get(path)).sort();
    const exitCode = process.status ?? 124;
    const timedOut = processError?.code === "ETIMEDOUT" || process.signal === "SIGTERM";
    const trace = readNodeTrace(workspace, behavior.runner.command);
    const assertions = evaluateAssertions(behavior, before, after, exitCode, trace);
    return {
      validation,
      execution: {
        image: behavior.runner.image,
        command: behavior.runner.command,
        exitCode,
        timedOut,
        stdout: String(process.stdout ?? "").slice(-8000),
        stderr: String(process.stderr ?? "").slice(-8000),
        created,
        modified,
        deleted,
        commands: trace.commands,
        reads: trace.reads,
        writes: trace.writes,
        networkRequests: trace.networkRequests,
        tracingReady: trace.ready,
        assertions,
        passed: assertions.every((assertion) => assertion.passed) && !timedOut
      }
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
    try {
      rmdirSync(temporaryParent);
    } catch {
      // Leave a non-empty parent in place only if another concurrent run owns it.
    }
  }
}

export function buildDockerArgs(workspace: string, behavior: BehaviorCase): string[] {
  return [
    "run", "--rm", "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "256", "--memory", "512m", "--cpus", "1",
    "-e", "NODE_OPTIONS=--require /workspace/.skillci-trace/instrument.cjs", "-e", "SKILLCI_TRACE_FILE=/workspace/.skillci-trace/events.jsonl",
    "-v", `${workspace}:/workspace:rw`, "-w", "/workspace", behavior.runner.image, "sh", "-c", behavior.runner.command
  ];
}

export function renderBehaviorRun(result: BehaviorRun): string {
  if (!result.execution) return renderBehaviorValidation(result.validation);
  const execution = result.execution;
  const lines = [
    "# SkillCI behavior run",
    "",
    `- **Case:** \`${result.validation.path}\``,
    `- **Status:** ${execution.passed ? "✅ passed" : "❌ failed"}`,
    `- **Isolation:** Docker, network disabled, temporary fixture workspace`,
    `- **Exit code:** ${execution.exitCode}${execution.timedOut ? " (timed out)" : ""}`,
    `- **Files:** ${execution.created.length} created, ${execution.modified.length} modified, ${execution.deleted.length} deleted`,
    `- **Observed:** ${execution.commands.length} commands, ${execution.reads.length} reads, ${execution.writes.length} writes, ${execution.networkRequests} network API attempts`,
    "",
    "## Assertions",
    "",
    "| Status | Assertion | Path | Detail |",
    "| --- | --- | --- | --- |",
    ...execution.assertions.map((assertion) => `| ${assertion.passed ? "✅" : "❌"} | ${assertion.kind} | \`${assertion.path}\` | ${assertion.detail} |`)
  ];
  if (execution.stderr) lines.push("", "## Runner stderr", "", "```text", execution.stderr, "```");
  return `${lines.join("\n")}\n`;
}

function invalid(path: string, message: string): BehaviorValidation {
  return { path, diagnostics: [{ path: "case", message }], valid: false };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectValue(value: unknown, path: string, diagnostics: BehaviorDiagnostic[]): Record<string, unknown> | undefined {
  if (!isObject(value)) {
    diagnostics.push({ path, message: "Expected an object." });
    return undefined;
  }
  return value;
}

function stringValue(value: unknown, path: string, diagnostics: BehaviorDiagnostic[]): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    diagnostics.push({ path, message: "Expected a non-empty string." });
    return undefined;
  }
  return value;
}

function numberValue(value: unknown, path: string, diagnostics: BehaviorDiagnostic[]): number | undefined {
  if (typeof value !== "number") {
    diagnostics.push({ path, message: "Expected a number." });
    return undefined;
  }
  return value;
}

function stringArray(value: unknown, path: string, diagnostics: BehaviorDiagnostic[]): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    diagnostics.push({ path, message: "Expected a list of non-empty strings." });
    return undefined;
  }
  if (new Set(value).size !== value.length) diagnostics.push({ path, message: "List values must be unique." });
  return value;
}

function checkKeys(value: Record<string, unknown>, allowedKeys: string[], path: string, diagnostics: BehaviorDiagnostic[]): void {
  for (const key of Object.keys(value)) if (!allowedKeys.includes(key)) diagnostics.push({ path, message: `Unknown field: ${key}.` });
}

function isSafeRelativePath(value: string): boolean {
  return !isAbsolute(value) && !value.split(/[\\/]+/).includes("..");
}

function snapshotWorkspace(root: string): Map<string, string> {
  const files = new Map<string, string>();
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === ".skillci-trace") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      for (const [childPath, hash] of snapshotWorkspace(path)) files.set(join(entry.name, childPath), hash);
    } else if (entry.isFile()) {
      files.set(entry.name, createHash("sha256").update(readFileSync(path)).digest("hex"));
    } else if (lstatSync(path).isSymbolicLink()) {
      files.set(entry.name, "symlink");
    }
  }
  return files;
}

function makeWorkspaceWritable(root: string): void {
  chmodSync(root, 0o777);
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) makeWorkspaceWritable(path);
    else if (entry.isFile()) chmodSync(path, 0o666);
  }
}

function evaluateAssertions(behavior: BehaviorCase, before: Map<string, string>, after: Map<string, string>, exitCode: number, trace: NodeTrace): BehaviorAssertion[] {
  const assertions: BehaviorAssertion[] = [{ kind: "exit code", path: "process", passed: exitCode === behavior.expect.exitCode, detail: `Expected ${behavior.expect.exitCode}, received ${exitCode}.` }];
  for (const path of behavior.expect.files.created) assertions.push({ kind: "created", path, passed: !before.has(path) && after.has(path), detail: "Expected file to be newly created." });
  for (const path of behavior.expect.files.modified) assertions.push({ kind: "modified", path, passed: before.has(path) && after.has(path) && before.get(path) !== after.get(path), detail: "Expected file contents to change." });
  for (const path of behavior.expect.files.unchanged) assertions.push({ kind: "unchanged", path, passed: before.has(path) && after.has(path) && before.get(path) === after.get(path), detail: "Expected file contents to remain unchanged." });
  assertions.push({ kind: "instrumentation", path: "Node runner", passed: trace.ready, detail: trace.ready ? "Node tracing preload reported ready." : "Node tracing preload did not report ready." });
  assertions.push(...eventAssertions("command", behavior.expect.commands.map(redactTraceValue), trace.commands));
  assertions.push(...eventAssertions("read", behavior.expect.reads, trace.reads));
  assertions.push(...eventAssertions("write", behavior.expect.writes, trace.writes));
  assertions.push({ kind: "network requests", path: "network", passed: trace.networkRequests === behavior.expect.network.requests, detail: `Expected ${behavior.expect.network.requests}, observed ${trace.networkRequests} network API attempts.` });
  return assertions;
}

type NodeTrace = { ready: boolean; commands: string[]; reads: string[]; writes: string[]; networkRequests: number };

function eventAssertions(kind: "command" | "read" | "write", expected: string[], observed: string[]): BehaviorAssertion[] {
  const assertions: BehaviorAssertion[] = [];
  for (const value of expected) assertions.push({ kind, path: value, passed: observed.includes(value), detail: observed.includes(value) ? "Observed as expected." : "Expected observation was not recorded." });
  for (const value of observed.filter((item) => !expected.includes(item))) assertions.push({ kind, path: value, passed: false, detail: "Observed value is not allowed by this behavior case." });
  return assertions;
}

function prepareNodeTrace(workspace: string): void {
  const traceDirectory = join(workspace, ".skillci-trace");
  mkdirSync(traceDirectory, { recursive: true });
  const preloadPath = join(traceDirectory, "instrument.cjs");
  const eventsPath = join(traceDirectory, "events.jsonl");
  writeFileSync(preloadPath, NODE_TRACE_PRELOAD, "utf8");
  writeFileSync(eventsPath, "", "utf8");
  // The official Node images may execute as an unprivileged `node` user while
  // the copied workspace is owned by the host user. The trace is contained in
  // that disposable workspace, so make only this internal directory writable.
  chmodSync(traceDirectory, 0o777);
  chmodSync(preloadPath, 0o644);
  chmodSync(eventsPath, 0o666);
}

function readNodeTrace(workspace: string, runnerCommand: string): NodeTrace {
  const tracePath = join(workspace, ".skillci-trace", "events.jsonl");
  const events: BehaviorEvent[] = existsSync(tracePath)
    ? readFileSync(tracePath, "utf8").split("\n").flatMap((line) => {
      if (!line.trim()) return [];
      try {
        const event = JSON.parse(line) as BehaviorEvent;
        return [event];
      } catch {
        return [];
      }
    })
    : [];
  const values = (kind: BehaviorEvent["kind"]) => [...new Set(events.filter((event) => event.kind === kind).map((event) => event.value).filter((value): value is string => typeof value === "string").map(normalizeTraceValue).filter((value): value is string => value !== undefined))];
  return {
    ready: events.some((event) => event.kind === "ready"),
    commands: [...new Set([runnerCommand, ...values("command")].map(redactTraceValue))],
    reads: values("read"),
    writes: values("write"),
    networkRequests: events.filter((event) => event.kind === "network").length
  };
}

function normalizeTraceValue(value: string): string | undefined {
  const normalized = value.replaceAll("\\\\", "/");
  if (normalized === "/workspace") return ".";
  if (normalized.startsWith("/workspace/")) return normalized.slice("/workspace/".length);
  return isSafeRelativePath(normalized) ? normalized : undefined;
}

function redactTraceValue(value: string): string {
  return value.replace(/((?:api[_-]?key|authorization|password|secret|token)\\s*(?:=|:))\\s*[^\\s]+/gi, "$1 [REDACTED]");
}

const NODE_TRACE_PRELOAD = String.raw`"use strict";
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const child = require("node:child_process");
const output = process.env.SKILLCI_TRACE_FILE;
const open = fs.openSync.bind(fs);
const write = fs.writeSync.bind(fs);
const close = fs.closeSync.bind(fs);
function valueOf(value) {
  if (value && typeof value === "object" && "pathname" in value) return value.pathname;
  return typeof value === "string" ? value : Buffer.isBuffer(value) ? value.toString() : String(value);
}
function emit(kind, value) {
  try {
    const descriptor = open(output, "a");
    try { write(descriptor, JSON.stringify({ kind, value }) + "\n", undefined, "utf8"); }
    finally { close(descriptor); }
  } catch { }
}
function wrap(object, name, kind) {
  const original = object[name];
  if (typeof original !== "function") return;
  object[name] = function (...args) { emit(kind, valueOf(args[0])); return original.apply(this, args); };
}
for (const name of ["readFile", "readFileSync", "createReadStream", "readdir", "readdirSync", "stat", "statSync", "lstat", "lstatSync", "access", "accessSync", "realpath", "realpathSync"]) { wrap(fs, name, "read"); wrap(fsp, name, "read"); }
for (const name of ["writeFile", "writeFileSync", "appendFile", "appendFileSync", "createWriteStream", "mkdir", "mkdirSync", "rm", "rmSync", "unlink", "unlinkSync", "rename", "renameSync", "truncate", "truncateSync", "chmod", "chmodSync", "copyFile", "copyFileSync"]) { wrap(fs, name, "write"); wrap(fsp, name, "write"); }
function commandOf(command, args) { return [valueOf(command), ...(Array.isArray(args) ? args.map(valueOf) : [])].join(" "); }
for (const name of ["exec", "execSync", "spawn", "spawnSync", "execFile", "execFileSync", "fork"]) {
  const original = child[name];
  if (typeof original !== "function") continue;
  child[name] = function (...args) { emit("command", name === "fork" ? "node " + valueOf(args[0]) : commandOf(args[0], args[1])); return original.apply(this, args); };
}
function wrapNetwork(object, name) {
  const original = object && object[name];
  if (typeof original !== "function") return;
  object[name] = function (...args) { emit("network", name); return original.apply(this, args); };
}
for (const moduleName of ["node:http", "node:https", "node:net", "node:tls", "node:dgram"]) {
  const module = require(moduleName);
  for (const name of ["request", "get", "connect", "createConnection", "createSocket"]) wrapNetwork(module, name);
}
if (typeof globalThis.fetch === "function") {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function (...args) { emit("network", "fetch"); return originalFetch.apply(this, args); };
}
emit("ready");
`;
