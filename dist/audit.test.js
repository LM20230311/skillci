import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { audit } from "./audit.js";
import { runCases } from "./cases.js";
test("reports destructive and sensitive commands", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-test-"));
    try {
        writeFileSync(join(root, "SKILL.md"), "Run rm -rf build\nRead ~/.ssh/id_rsa\n", "utf8");
        const result = audit(root);
        assert.equal(result.score, "critical");
        assert.deepEqual(result.findings.map((finding) => finding.ruleId), ["SKILLCI001", "SKILLCI003"]);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
test("returns no findings for a scoped skill", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-test-"));
    try {
        writeFileSync(join(root, "SKILL.md"), "Run npm test and only update docs/README.md.\n", "utf8");
        const result = audit(root);
        assert.equal(result.score, "none");
        assert.equal(result.findings.length, 0);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
test("enforces denied paths and network from a policy", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-test-"));
    try {
        writeFileSync(join(root, "SKILL.md"), "Read .env then fetch(https://example.com).\n", "utf8");
        writeFileSync(join(root, "policy.yml"), "deny:\n  paths:\n    - .env\n  network: true\n", "utf8");
        const result = audit(root, { policyPath: join(root, "policy.yml") });
        assert.deepEqual(result.findings.map((finding) => finding.ruleId), ["SKILLCI003", "SKILLCI101", "SKILLCI102", "SKILLCI004"]);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
test("does not audit policy declarations as skill instructions", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-test-"));
    try {
        writeFileSync(join(root, "SKILL.md"), "Only update docs/README.md.\n", "utf8");
        writeFileSync(join(root, "policy.yml"), "deny:\n  paths:\n    - .env\n  commands:\n    - git push --force\n", "utf8");
        const result = audit(root, { policyPath: join(root, "policy.yml") });
        assert.equal(result.findings.length, 0);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
test("matches denied commands even when a command has extra arguments", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-test-"));
    try {
        writeFileSync(join(root, "SKILL.md"), "Run git push origin main --force.\n", "utf8");
        writeFileSync(join(root, "policy.yml"), "deny:\n  commands:\n    - git push --force\n", "utf8");
        const result = audit(root, { policyPath: join(root, "policy.yml") });
        assert.equal(result.findings.some((finding) => finding.ruleId === "SKILLCI103"), true);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
test("runs fixture cases with policy and risk assertions", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-test-"));
    try {
        mkdirSync(join(root, "cases"));
        mkdirSync(join(root, "skill"));
        writeFileSync(join(root, "skill", "SKILL.md"), "Only update docs/README.md.\n", "utf8");
        writeFileSync(join(root, "policy.yml"), "deny:\n  network: true\n", "utf8");
        writeFileSync(join(root, "cases", "safe.yml"), "name: safe skill\ntarget: ../skill\npolicy: ../policy.yml\nexpect:\n  maxRisk: low\n  forbiddenRules:\n    - SKILLCI001\n", "utf8");
        const result = runCases(join(root, "cases"));
        assert.equal(result.results.length, 1);
        assert.equal(result.results[0].passed, true);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
//# sourceMappingURL=audit.test.js.map