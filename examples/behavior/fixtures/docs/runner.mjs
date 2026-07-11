import { appendFileSync } from "node:fs";

appendFileSync("docs/README.md", "\n\nRelease notes verified by the isolated behavior fixture.\n");
