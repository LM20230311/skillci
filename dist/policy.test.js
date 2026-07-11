import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { initialize } from "./init.js";
import { extractNetworkHosts, hostIsAllowed, matchesDeniedPath, validatePolicy } from "./policy.js";
test("validates an allowlisted network policy", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-policy-test-"));
    try {
        const policyPath = join(root, "policy.yml");
        writeFileSync(policyPath, "allow:\n  network:\n    - api.github.com\n    - '*.githubusercontent.com'\ndeny:\n  paths:\n    - '**/*.pem'\n", "utf8");
        const result = validatePolicy(policyPath);
        assert.equal(result.valid, true);
        assert.deepEqual(result.policy?.allowedHosts, ["api.github.com", "*.githubusercontent.com"]);
    }
    finally {
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
    }
    finally {
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
test("keeps every published policy example valid", () => {
    for (const example of ["documentation", "release", "infrastructure"]) {
        const result = validatePolicy(`examples/policies/${example}/policy.yml`);
        assert.equal(result.valid, true, `${example} policy should be valid`);
    }
});
test("generates a starter policy that validates without unused permissions", () => {
    const root = mkdtempSync(join(tmpdir(), "skillci-policy-test-"));
    try {
        initialize(root);
        const result = validatePolicy(join(root, "skillci", "policy.yml"));
        assert.equal(result.valid, true);
        assert.deepEqual(result.policy?.allowedHosts, []);
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
//# sourceMappingURL=policy.test.js.map