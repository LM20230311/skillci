#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { audit } from "./audit.js";
import { renderTestRun, runCases } from "./cases.js";
import { initialize } from "./init.js";
import { renderGitHubAnnotations, renderMarkdown } from "./report.js";
const HELP = `SkillCI — CI checks for AI agent skills

Usage:
  skillci init [directory]
  skillci audit <path> [--policy <file>] [--format markdown|json|github] [--output <file>] [--no-fail]
  skillci report <path> [--policy <file>] [--output <file>] [--no-fail]
  skillci test <cases-path> [--format markdown|json] [--no-fail]

Examples:
  skillci init
  skillci audit .github/skills/release
  skillci audit .github/skills/release --policy skillci/policy.yml
  skillci audit . --format github
  skillci test skillci/cases
  skillci report .github/skills/release --output skillci-report.md
`;
async function main(argv) {
    const [command, ...args] = argv;
    if (!command || command === "--help" || command === "-h") {
        console.log(HELP);
        return;
    }
    if (command === "init") {
        const created = initialize(args[0] ?? ".");
        if (created.length === 0)
            console.log("SkillCI config already exists; nothing created.");
        else
            console.log(`Created:\n${created.map((file) => `  - ${file}`).join("\n")}`);
        return;
    }
    if (command === "test") {
        const casesPath = args.find((argument) => !argument.startsWith("-"));
        if (!casesPath)
            throw new Error("test requires a case file or directory.");
        const testRun = runCases(casesPath);
        const format = option(args, "--format") ?? "markdown";
        if (format !== "markdown" && format !== "json")
            throw new Error(`Unsupported test format: ${format}`);
        console.log(format === "json" ? JSON.stringify(testRun, null, 2) : renderTestRun(testRun));
        if (testRun.results.some((result) => !result.passed) && !args.includes("--no-fail"))
            process.exitCode = 1;
        return;
    }
    if (command !== "audit" && command !== "report") {
        throw new Error(`Unknown command: ${command}`);
    }
    const target = args.find((argument) => !argument.startsWith("-"));
    if (!target)
        throw new Error(`${command} requires a path.`);
    const format = command === "report" ? "markdown" : option(args, "--format") ?? "markdown";
    if (!isFormat(format))
        throw new Error(`Unsupported format: ${format}`);
    const result = audit(target, { policyPath: option(args, "--policy") });
    const output = format === "json" ? `${JSON.stringify(result, null, 2)}\n` : format === "github" ? renderGitHubAnnotations(result) : renderMarkdown(result);
    const outputPath = option(args, "--output");
    if (outputPath) {
        writeFileSync(outputPath, output, "utf8");
        console.log(`Wrote report to ${outputPath}`);
    }
    else {
        console.log(output);
    }
    if (result.score === "critical" || result.score === "high") {
        if (!args.includes("--no-fail"))
            process.exitCode = 1;
    }
}
function option(args, name) {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
}
function isFormat(value) {
    return value === "markdown" || value === "json" || value === "github";
}
main(process.argv.slice(2)).catch((error) => {
    console.error(`SkillCI error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
});
//# sourceMappingURL=index.js.map