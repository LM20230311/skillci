import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { initialize } from "./init.js";
import { audit } from "./audit.js";
import { extractNetworkHosts, extractWorkingDirectories, hostIsAllowed, matchesCommandPattern, matchesDeniedPath, validatePolicy } from "./policy.js";

test("validates an allowlisted network policy", () => {
  const root = mkdtempSync(join(tmpdir(), "skillci-policy-test-"));
  try {
    const policyPath = join(root, "policy.yml");
    writeFileSync(policyPath, "allow:\n  network:\n    - api.github.com\n    - '*.githubusercontent.com'\ndeny:\n  paths:\n    - '**/*.pem'\n", "utf8");
    const result = validatePolicy(policyPath);
    assert.equal(result.valid, true);
    assert.deepEqual(result.policy?.allowedHosts, ["api.github.com", "*.githubusercontent.com"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects contradictory and unknown policy fields", () => {
  const root = mkdtempSync(join(tmpdir(), "skillci-policy-test-"));
  try {
    const policyPath = join(root, "policy.yml");
    writeFileSync(policyPath, "allow:\n  network:\n    - api.github.com\ndeny:\n  network: true\n  hosts:\n    - invalid\n", "utf8");
    const result = validatePolicy(policyPath);
    assert.equal(result.valid, false);
    assert.equal(result.diagnostics.some((diagnostic) => diagnostic.message.includes("cannot be combined")), true);
    assert.equal(result.diagnostics.some((diagnostic) => diagnostic.message.includes("Unsupported deny.hosts")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("matches file paths using glob semantics", () => {
  assert.equal(matchesDeniedPath("Read secrets/production.pem", "secrets/*.pem"), true);
  assert.equal(matchesDeniedPath("Read secrets/archive/production.pem", "secrets/*.pem"), false);
  assert.equal(matchesDeniedPath("Read config/.env", "**/.env"), true);
});

test("extracts and matches allowlisted network hosts", () => {
  assert.deepEqual(extractNetworkHosts('fetch("https://api.github.com/repos/example")'), ["api.github.com"]);
  assert.equal(hostIsAllowed("api.github.com", ["api.github.com"]), true);
  assert.equal(hostIsAllowed("uploads.github.com", ["*.github.com"]), true);
  assert.equal(hostIsAllowed("example.com", ["*.github.com"]), false);
});

test("matches command patterns and extracts working directories", () => {
  assert.equal(matchesCommandPattern("Run `terraform apply -auto-approve`.", "terraform apply *-auto-approve"), true);
  assert.equal(matchesCommandPattern("Run `terraform plan`.", "terraform apply *-auto-approve"), false);
  assert.deepEqual(extractWorkingDirectories("Run `cd infra/prod/network && terraform apply`."), ["infra/prod/network"]);
  assert.deepEqual(extractWorkingDirectories("Run npm --cwd docs build."), ["docs"]);
});

test("keeps every published policy example valid", () => {
  for (const example of ["documentation", "release", "infrastructure"]) {
    const result = validatePolicy(`examples/policies/${example}/policy.yml`);
    assert.equal(result.valid, true, `${example} policy should be valid`);
  }
});

test("reports command and directory boundaries in the infrastructure example", () => {
  const result = audit("examples/policies/infrastructure/unsafe-instruction.md", { policyPath: "examples/policies/infrastructure/policy.yml" });
  assert.deepEqual(result.findings.filter((finding) => finding.severity === "high").map((finding) => finding.ruleId), ["SKILLCI103", "SKILLCI105"]);
});

test("generates a starter policy that validates without unused permissions", () => {
  const root = mkdtempSync(join(tmpdir(), "skillci-policy-test-"));
  try {
    initialize(root);
    const result = validatePolicy(join(root, "skillci", "policy.yml"));
    assert.equal(result.valid, true);
    assert.deepEqual(result.policy?.allowedHosts, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
