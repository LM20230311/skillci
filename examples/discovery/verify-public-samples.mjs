// Read-only check against local clones of the exact commits in public-samples.json.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { discover } from "../../dist/discovery.js";

if (!process.argv[2]) throw new Error("Pass the parent directory containing the three local clones.");
const manifest = JSON.parse(readFileSync(new URL("public-samples.json", import.meta.url), "utf8"));
for (const sample of manifest.samples) {
  const root = resolve(process.argv[2], sample.directory);
  const git = (...args) => {
    const child = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
    if (child.status !== 0) throw new Error(`Unable to inspect ${sample.directory}`);
    return child.stdout.trim();
  };
  assert.equal(git("rev-parse", "HEAD"), sample.commit, "Sample must be pinned to its recorded commit.");
  assert.equal(git("status", "--porcelain"), "", "Sample must be a clean checkout.");
  const inventory = discover(root);
  assert.equal(inventory.complete, true);
  assert.deepEqual(inventory.diagnostics, []);
  const expectedSkills = git("ls-files").split("\n").filter(path => /(^|\/)SKILL\.md$/.test(path)).sort();
  const actualSkills = inventory.items.filter(item => item.kind === "skill").map(item => item.path);
  assert.deepEqual(actualSkills, expectedSkills);
  assert.equal(actualSkills.length, sample.skills);
  assert.equal(inventory.items.length - actualSkills.length, sample.instructions);
  console.log(`${sample.directory}@${sample.commit}: ${sample.skills} Skills, ${sample.instructions} instructions; inventory verified`);
}
