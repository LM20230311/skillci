import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateBehaviorCase } from "./behavior.js";

test("validates the published behavior case contract", () => {
  const result = validateBehaviorCase("examples/behavior/docs-update.behavior.yml");
  assert.equal(result.valid, true);
  assert.equal(result.behavior?.tools.deny.includes("network"), true);
  assert.equal(result.behavior?.expect.files.unchanged.includes(".env"), true);
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
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
