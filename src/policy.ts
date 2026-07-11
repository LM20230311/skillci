import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type Policy = {
  path: string;
  deniedNetwork: boolean;
  deniedPaths: string[];
  deniedCommands: string[];
};

/** Parses the deliberately small SkillCI policy format without a runtime dependency. */
export function loadPolicy(policyPath: string): Policy {
  const absolutePath = resolve(policyPath);
  if (!existsSync(absolutePath)) throw new Error(`Policy does not exist: ${policyPath}`);

  const policy: Policy = { path: absolutePath, deniedNetwork: false, deniedPaths: [], deniedCommands: [] };
  let inDeny = false;
  let list: "paths" | "commands" | undefined;

  for (const rawLine of readFileSync(absolutePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (/^\s*deny\s*:\s*$/.test(line)) {
      inDeny = true;
      list = undefined;
      continue;
    }
    if (/^\s*[A-Za-z][\w-]*\s*:\s*$/.test(line) && !/^\s*(paths|commands)\s*:\s*$/.test(line)) {
      inDeny = false;
      list = undefined;
      continue;
    }
    if (!inDeny) continue;

    const network = line.match(/^\s*network\s*:\s*(true|false)\s*$/i);
    if (network) {
      policy.deniedNetwork = network[1].toLowerCase() === "true";
      list = undefined;
      continue;
    }
    const listName = line.match(/^\s*(paths|commands)\s*:\s*$/);
    if (listName) {
      list = listName[1] as "paths" | "commands";
      continue;
    }
    const value = line.match(/^\s*-\s*(.+?)\s*$/);
    if (value && list) {
      const normalized = unquote(value[1]);
      if (list === "paths") policy.deniedPaths.push(normalized);
      else policy.deniedCommands.push(normalized);
    }
  }

  return policy;
}

function unquote(value: string): string {
  return value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
}
