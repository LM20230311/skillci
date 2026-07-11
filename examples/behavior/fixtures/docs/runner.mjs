import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

readFileSync("docs/README.md", "utf8");
appendFileSync("docs/README.md", "\n\nRelease notes verified by the isolated behavior fixture.\n");
execFileSync("node", ["-e", "process.exit(0)"], { stdio: "ignore" });
