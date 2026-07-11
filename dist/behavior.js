import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { parse } from "yaml";
const TOOLS = new Set(["filesystem", "shell", "network"]);
/**
 * Validates a behavior-test contract without executing its runner. Executing
 * an Agent belongs to a later, explicitly isolated runner implementation.
 */
export function validateBehaviorCase(casePath) {
    const path = resolve(casePath);
    const diagnostics = [];
    if (!existsSync(path))
        return invalid(path, "Case file does not exist.");
    let raw;
    try {
        raw = parse(readFileSync(path, "utf8"));
    }
    catch (error) {
        return invalid(path, `Invalid YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!isObject(raw))
        return invalid(path, "A behavior case must be a YAML object.");
    checkKeys(raw, ["name", "fixture", "input", "runner", "tools", "expect"], "case", diagnostics);
    const name = stringValue(raw.name, "name", diagnostics);
    const fixture = stringValue(raw.fixture, "fixture", diagnostics);
    if (fixture && !isSafeRelativePath(fixture))
        diagnostics.push({ path: "fixture", message: "Fixture must be a relative path inside the case directory." });
    if (fixture && isSafeRelativePath(fixture) && !existsSync(resolve(dirname(path), fixture)))
        diagnostics.push({ path: "fixture", message: `Fixture does not exist: ${fixture}` });
    const input = objectValue(raw.input, "input", diagnostics);
    if (input)
        checkKeys(input, ["prompt"], "input", diagnostics);
    const prompt = input ? stringValue(input.prompt, "input.prompt", diagnostics) : undefined;
    const runner = objectValue(raw.runner, "runner", diagnostics);
    if (runner)
        checkKeys(runner, ["command", "timeoutSeconds"], "runner", diagnostics);
    const command = runner ? stringValue(runner.command, "runner.command", diagnostics) : undefined;
    const timeoutSeconds = runner ? numberValue(runner.timeoutSeconds, "runner.timeoutSeconds", diagnostics) : undefined;
    if (timeoutSeconds !== undefined && (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 600))
        diagnostics.push({ path: "runner.timeoutSeconds", message: "Timeout must be an integer between 1 and 600 seconds." });
    const tools = objectValue(raw.tools, "tools", diagnostics);
    if (tools)
        checkKeys(tools, ["allow", "deny"], "tools", diagnostics);
    const allowedTools = tools ? stringArray(tools.allow, "tools.allow", diagnostics) : undefined;
    const deniedTools = tools ? stringArray(tools.deny, "tools.deny", diagnostics) : undefined;
    for (const tool of [...(allowedTools ?? []), ...(deniedTools ?? [])]) {
        if (!TOOLS.has(tool))
            diagnostics.push({ path: "tools", message: `Unknown tool: ${tool}. Allowed values are filesystem, shell, network.` });
    }
    for (const tool of allowedTools ?? []) {
        if (deniedTools?.includes(tool))
            diagnostics.push({ path: "tools", message: `${tool} cannot be both allowed and denied.` });
    }
    const expect = objectValue(raw.expect, "expect", diagnostics);
    if (expect)
        checkKeys(expect, ["exitCode", "files"], "expect", diagnostics);
    const exitCode = expect ? numberValue(expect.exitCode, "expect.exitCode", diagnostics) : undefined;
    if (exitCode !== undefined && (!Number.isInteger(exitCode) || exitCode < 0 || exitCode > 255))
        diagnostics.push({ path: "expect.exitCode", message: "Exit code must be an integer between 0 and 255." });
    const files = expect ? objectValue(expect.files, "expect.files", diagnostics) : undefined;
    if (files)
        checkKeys(files, ["created", "modified", "unchanged"], "expect.files", diagnostics);
    const created = files ? stringArray(files.created, "expect.files.created", diagnostics) : undefined;
    const modified = files ? stringArray(files.modified, "expect.files.modified", diagnostics) : undefined;
    const unchanged = files ? stringArray(files.unchanged, "expect.files.unchanged", diagnostics) : undefined;
    for (const [field, values] of [["expect.files.created", created], ["expect.files.modified", modified], ["expect.files.unchanged", unchanged]]) {
        for (const value of values ?? [])
            if (!isSafeRelativePath(value))
                diagnostics.push({ path: field, message: `Expected file path must be relative and stay inside the fixture: ${value}` });
    }
    if (created && modified && unchanged && created.length + modified.length + unchanged.length === 0)
        diagnostics.push({ path: "expect.files", message: "Specify at least one expected file assertion." });
    const behavior = name && fixture && prompt && command && timeoutSeconds !== undefined && allowedTools && deniedTools && exitCode !== undefined && created && modified && unchanged
        ? { name, fixture, input: { prompt }, runner: { command, timeoutSeconds }, tools: { allow: allowedTools, deny: deniedTools }, expect: { exitCode, files: { created, modified, unchanged } } }
        : undefined;
    return { path, behavior, diagnostics, valid: diagnostics.length === 0 && behavior !== undefined };
}
export function renderBehaviorValidation(result) {
    const lines = ["# SkillCI behavior case check", "", `- **Case:** \`${result.path}\``, `- **Status:** ${result.valid ? "✅ valid" : "❌ invalid"}`];
    if (result.valid && result.behavior) {
        lines.push(`- **Fixture:** \`${result.behavior.fixture}\``, `- **Runner:** \`${result.behavior.runner.command}\``, `- **Timeout:** ${result.behavior.runner.timeoutSeconds}s`);
    }
    if (result.diagnostics.length === 0)
        return `${lines.join("\n")}\n\nThis command validates a contract; it does not execute the runner.\n`;
    lines.push("", "## Diagnostics", "", ...result.diagnostics.map((diagnostic) => `- **${diagnostic.path}:** ${diagnostic.message}`));
    return `${lines.join("\n")}\n`;
}
function invalid(path, message) {
    return { path, diagnostics: [{ path: "case", message }], valid: false };
}
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function objectValue(value, path, diagnostics) {
    if (!isObject(value)) {
        diagnostics.push({ path, message: "Expected an object." });
        return undefined;
    }
    return value;
}
function stringValue(value, path, diagnostics) {
    if (typeof value !== "string" || !value.trim()) {
        diagnostics.push({ path, message: "Expected a non-empty string." });
        return undefined;
    }
    return value;
}
function numberValue(value, path, diagnostics) {
    if (typeof value !== "number") {
        diagnostics.push({ path, message: "Expected a number." });
        return undefined;
    }
    return value;
}
function stringArray(value, path, diagnostics) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
        diagnostics.push({ path, message: "Expected a list of non-empty strings." });
        return undefined;
    }
    if (new Set(value).size !== value.length)
        diagnostics.push({ path, message: "List values must be unique." });
    return value;
}
function checkKeys(value, allowedKeys, path, diagnostics) {
    for (const key of Object.keys(value))
        if (!allowedKeys.includes(key))
            diagnostics.push({ path, message: `Unknown field: ${key}.` });
}
function isSafeRelativePath(value) {
    return !isAbsolute(value) && !value.split(/[\\/]+/).includes("..");
}
//# sourceMappingURL=behavior.js.map