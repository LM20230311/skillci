import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildDockerArgs, validateBehaviorCase } from "./behavior.js";
test("validates the published behavior case contract", () => {
    const result = validateBehaviorCase("examples/behavior/docs-update.behavior.yml");
    assert.equal(result.valid, true);
    assert.equal(result.behavior?.tools.deny.includes("network"), true);
    assert.equal(result.behavior?.expect.files.unchanged.includes(".env"), true);
    assert.deepEqual(result.behavior?.expect.commands, ["node runner.mjs", "node -e process.exit(0)"]);
    assert.deepEqual(result.behavior?.expect.reads, ["docs/README.md", "runner.mjs"]);
    assert.deepEqual(result.behavior?.expect.writes, ["docs/README.md"]);
});
test("rejects unsafe paths and contradictory tool permissions", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-behavior-test-"));
    try {
        mkdirSync(join(root, "fixture"));
        const casePath = join(root, "invalid.behavior.yml");
        writeFileSync(casePath, "name: invalid\nfixture: ../outside\ninput:\n  prompt: Test\nrunner:\n  command: runner\n  timeoutSeconds: 0\ntools:\n  allow:\n    - network\n  deny:\n    - network\nexpect:\n  exitCode: 0\n  files:\n    created: []\n    modified: []\n    unchanged: []\n", "utf8");
        const result = validateBehaviorCase(casePath);
        assert.equal(result.valid, false);
        assert.equal(result.diagnostics.some((diagnostic) => diagnostic.path === "fixture"), true);
        assert.equal(result.diagnostics.some((diagnostic) => diagnostic.message.includes("both allowed and denied")), true);
        assert.equal(result.diagnostics.some((diagnostic) => diagnostic.message.includes("at least one expected file")), true);
        assert.equal(result.diagnostics.some((diagnostic) => diagnostic.path === "expect.commands"), true);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
test("builds a Docker runner with network and privilege restrictions", () => {
    const validation = validateBehaviorCase("examples/behavior/docs-update.behavior.yml");
    assert.equal(validation.valid, true);
    const args = buildDockerArgs("/tmp/skillci-fixture", validation.behavior);
    assert.deepEqual(args.slice(0, 8), ["run", "--rm", "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m", "--cap-drop"]);
    assert.equal(args.includes("no-new-privileges"), true);
    assert.equal(args.includes("node:22-alpine"), true);
    assert.equal(args.includes("NODE_OPTIONS=--require /workspace/.skillci-trace/instrument.cjs"), true);
});
//# sourceMappingURL=behavior.test.js.map