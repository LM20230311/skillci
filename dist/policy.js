import { existsSync, readFileSync } from "node:fs";
import { minimatch } from "minimatch";
import { resolve } from "node:path";
/**
 * Validate SkillCI's intentionally small YAML subset. Unknown fields fail
 * closed instead of being silently ignored, which keeps policies reviewable.
 */
export function validatePolicy(policyPath) {
    const path = resolve(policyPath);
    const diagnostics = [];
    if (!existsSync(path)) {
        return { path, diagnostics: [{ line: 0, severity: "error", message: `Policy does not exist: ${policyPath}` }], valid: false };
    }
    const policy = { path, deniedNetwork: false, allowedHosts: [], deniedPaths: [], deniedCommands: [] };
    let section;
    let list;
    for (const [offset, rawLine] of readFileSync(path, "utf8").split(/\r?\n/).entries()) {
        if (/^\s*#/.test(rawLine))
            continue;
        const lineNumber = offset + 1;
        const line = rawLine.replace(/\s+#.*$/, "");
        if (!line.trim())
            continue;
        const topLevel = line.match(/^([A-Za-z][\w-]*)\s*:\s*$/);
        if (topLevel) {
            if (topLevel[1] !== "allow" && topLevel[1] !== "deny") {
                diagnostics.push(error(lineNumber, `Unknown top-level key: ${topLevel[1]}. Expected allow or deny.`));
                section = undefined;
                list = undefined;
            }
            else {
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
                if (value !== "true" && value !== "false")
                    diagnostics.push(error(lineNumber, "deny.network must be true or false."));
                else
                    policy.deniedNetwork = value === "true";
                list = undefined;
                continue;
            }
            if (!isListKey(section, key)) {
                diagnostics.push(error(lineNumber, `Unsupported ${section}.${key} policy key.`));
                list = undefined;
                continue;
            }
            if (value)
                diagnostics.push(error(lineNumber, `${section}.${key} must be a YAML list.`));
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
        if (!isHostPattern(host))
            diagnostics.push(error(0, `Invalid allow.network host: ${host}. Use a hostname such as api.github.com or *.github.com.`));
    }
    return { path, policy, diagnostics, valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error") };
}
export function loadPolicy(policyPath) {
    const result = validatePolicy(policyPath);
    if (!result.valid || !result.policy) {
        const details = result.diagnostics.map((diagnostic) => `${diagnostic.line ? `line ${diagnostic.line}: ` : ""}${diagnostic.message}`).join("; ");
        throw new Error(`Invalid policy: ${details}`);
    }
    return result.policy;
}
export function renderPolicyValidation(result) {
    const lines = ["# SkillCI policy check", "", `- **Policy:** \`${result.path}\``, `- **Status:** ${result.valid ? "✅ valid" : "❌ invalid"}`];
    if (result.diagnostics.length === 0)
        return `${lines.join("\n")}\n\nNo policy issues found.\n`;
    lines.push("", "## Diagnostics", "");
    for (const diagnostic of result.diagnostics) {
        lines.push(`- **${diagnostic.severity.toUpperCase()}**${diagnostic.line ? ` (line ${diagnostic.line})` : ""}: ${diagnostic.message}`);
    }
    return `${lines.join("\n")}\n`;
}
export function matchesDeniedPath(line, pattern) {
    return extractPathCandidates(line).some((candidate) => minimatch(candidate, pattern, { dot: true, matchBase: !pattern.includes("/") }));
}
export function extractNetworkHosts(line) {
    const hosts = new Set();
    for (const match of line.matchAll(/https?:\/\/([^\s/:?#"'`]+)/gi))
        hosts.add(match[1].toLowerCase());
    return [...hosts];
}
export function hostIsAllowed(host, allowedHosts) {
    return allowedHosts.some((pattern) => minimatch(host, pattern.toLowerCase(), { nocase: true }));
}
function isListKey(section, key) {
    if (section === "allow")
        return key === "read" || key === "write" || key === "commands" || key === "network";
    return key === "paths" || key === "commands";
}
function addPolicyValue(policy, section, list, value, line, diagnostics) {
    const destination = section === "deny" && list === "paths"
        ? policy.deniedPaths
        : section === "deny" && list === "commands"
            ? policy.deniedCommands
            : section === "allow" && list === "network"
                ? policy.allowedHosts
                : undefined;
    if (!destination)
        return;
    if (destination.includes(value)) {
        diagnostics.push({ line, severity: "warning", message: `Duplicate ${section}.${list} value: ${value}.` });
        return;
    }
    destination.push(value);
}
function isHostPattern(host) {
    return /^(?:\*\.)?(?:[a-z0-9-]+\.)+[a-z0-9-]+$/i.test(host);
}
function extractPathCandidates(line) {
    return line
        .split(/\s+/)
        .map((token) => token.replace(/^[`'"([{<]+|[`'"\])}>.,;:!?]+$/g, "").replace(/^\.\//, "").replace(/\\/g, "/"))
        .filter((token) => token.includes("/") || token.startsWith(".") || token.includes("."));
}
function error(line, message) {
    return { line, severity: "error", message };
}
function unquote(value) {
    return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
}
//# sourceMappingURL=policy.js.map