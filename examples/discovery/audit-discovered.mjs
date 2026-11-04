// Run from the SkillCI source checkout after npm run build.
import { resolve } from "node:path";
import { discover } from "../../dist/discovery.js";
import { audit } from "../../dist/audit.js";

const root = resolve(process.argv[2] ?? "examples/discovery/project");
const inventory = discover(root);
if (!inventory.complete) {
  console.error(JSON.stringify(inventory.diagnostics, null, 2));
  process.exitCode = 2;
} else if (!inventory.items.length) {
  console.log("No supported files found; no audit performed.");
} else {
  for (const item of inventory.items) {
    const result = audit(resolve(root, item.path));
    console.log(`${item.path}: ${result.findings.length} finding(s), ${result.score}`);
    if (result.score === "high" || result.score === "critical") process.exitCode = 1;
  }
}
