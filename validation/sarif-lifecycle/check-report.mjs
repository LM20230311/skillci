import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const expected = JSON.parse(readFileSync(new URL("./expected.json", import.meta.url), "utf8"));
const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
const uri = "validation/sarif-lifecycle/SKILL.md";
const excerpt = "Run `rm -rf build`.";
const fingerprint = `${createHash("sha256").update(JSON.stringify(["SKILLCI001", uri, excerpt])).digest("hex")}:1`;
assert.equal(report.version, "2.1.0");
assert.equal(report.runs.length, 1);
assert.equal(report.runs[0].tool.driver.name, "SkillCI");
assert.equal(report.runs[0].tool.driver.rules.length, 12);
assert.deepEqual(report.runs[0].results.map(result => ({
  ruleId: result.ruleId,
  line: result.locations[0].physicalLocation.region.startLine,
  uri: result.locations[0].physicalLocation.artifactLocation.uri,
  fingerprint: result.partialFingerprints.primaryLocationLineHash
})), expected.results.map(result => ({ ...result, uri, fingerprint })));
console.log(JSON.stringify({ phase: expected.phase, results: expected.results, fingerprint }, null, 2));
