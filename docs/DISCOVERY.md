# Discovery contract (schemaVersion 1)

[English](DISCOVERY.md) · [简体中文](DISCOVERY.zh-CN.md)

`discover` inventories project files that match named conventions. It checks candidate readability without including file content. It does not parse Skill frontmatter, resolve instruction imports, inspect host settings, or determine what a running agent loads. The paths include nested projects and sample files.

Available in v0.5.0: run `npx skillci@0.5.0 discover . --format json` in your project. To run the source fixtures, build this checkout with `npm ci && npm run build`, then run:

```bash
node dist/index.js discover examples/discovery/project
node dist/index.js discover examples/discovery/project --format json
node examples/discovery/audit-discovered.mjs examples/discovery/project
```

The last example runs existing static audit rules on every discovered file using path arguments rather than shell interpolation. It does not execute Skills. It exits 1 for high/critical findings and 2 for an incomplete inventory; an empty result explicitly says that no audit occurred. To audit supporting scripts too, review and pass the Skill directory to `audit` separately. Discovery inventories entry points, not every executable dependency.

## Supported conventions

Checked against official documentation on 2026-11-04. Nested project directories are inventoried as candidates, not as active context. Host settings, version, working directory, precedence, and surface can change loading behavior.

| Files relative to each project directory | Kind | Host labels |
| --- | --- | --- |
| `AGENTS.md` | instruction | codex, claude, cursor, copilot |
| `AGENTS.override.md` | instruction | codex |
| `CLAUDE.md` | instruction | claude; cursor/copilot only at scan root |
| `CLAUDE.local.md`, `.claude/CLAUDE.md`, `.claude/rules/**/*.md`, `.claude/commands/**/*.md` | instruction | claude |
| `.agents/skills/**/SKILL.md` | skill | codex, cursor, copilot |
| `.claude/skills/**/SKILL.md` | skill | claude, cursor, copilot |
| `.cursor/skills/**/SKILL.md` | skill | cursor |
| `.codex/skills/**/SKILL.md` | skill | cursor (compatibility directory) |
| `.github/skills/**/SKILL.md` | skill | copilot |
| `.cursor/rules/**/*.mdc`, `.cursorrules` | instruction | cursor |
| `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md` | instruction | copilot |
| `GEMINI.md` at scan root | instruction | copilot |
| Any other `SKILL.md` | skill | unassigned portable candidate |

Matching is case-sensitive. Shared files have one record with sorted host labels and matching patterns in `evidence`. Nested skill directories are candidates even when a specific host version may not recursively load them. `.codex/skills` is not labeled as current Codex support. Claude's AGENTS support is conditional; Cursor compatibility and Copilot surfaces also vary. No settings are read to resolve these conditions.

Official references: [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude skills](https://code.claude.com/docs/en/skills), [Claude instructions](https://code.claude.com/docs/en/memory), [Cursor skills](https://cursor.com/docs/skills), [Cursor rules](https://cursor.com/docs/rules), [Copilot skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills), [Copilot instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions).

## Output and scope

| Field | Meaning |
| --- | --- |
| `schemaVersion` | `1`; incompatible changes require a new schema version |
| `toolVersion` | Package version; an uncommitted source checkout is not a published release |
| `root` | Always `.`; all paths are relative to the directory supplied to discover |
| `complete` | No inspection errors within the declared scan scope; never a safety verdict |
| `ignoredDirectories` | `.git`, `.skillci-workspaces`, `coverage`, `dist`, `node_modules`, at any depth |
| `symlinks` | `skip`; every encountered symbolic link is reported without following its target |
| `items` | Unique path records, sorted by Unicode code-unit order |
| `items[].kind` | `skill` or `instruction` |
| `items[].hosts` | Sorted convention labels; may be empty for a portable candidate |
| `items[].evidence` | Sorted matching filename patterns, or `portable SKILL.md filename` |
| `items[].policyCoverage` | Always `unknown`; presence of a policy file is not a coverage claim |
| `diagnostics` | Sorted relative path, stable code, severity and human-readable message |

The scan starts at the explicit directory (default current directory), never walks upward, and does not automatically search global home directories. It uses a fixed ignore list, not `.gitignore`. All symbolic links are skipped, including internal links and cycles; a symlink root is rejected. Maximum nesting is 64; a deeper directory reports an error. The intended input is a local project directory, not a filesystem root or network share.

`invalid-root`, `unreadable`, and `depth-limit` are errors and set `complete: false` and CLI exit 2. `symlink-skipped` is informational: `complete` remains true within this declared exclusion. Empty inventories exit 0 with an explicit message. Malformed CLI arguments exit 2. A JSON invocation with an invalid/inaccessible root still returns structured diagnostics. Paths and content are not embedded in error messages; item paths are still project metadata and may be sensitive if you share the result.

For automation, resolve item paths against the same explicit root, check `complete` and diagnostics first, and require the item count your workflow expects. Markdown and JSON show the same inventory. A source fixture and versioned expected result are checked by the test suite. There are no coverage percentages, automatic policy selection, generated user files, or telemetry.
