# 自动发现契约（schemaVersion 1）

[English](DISCOVERY.md) · [简体中文](DISCOVERY.zh-CN.md)

`discover` 盘点符合命名与目录约定的项目文件，检查候选文件是否可读，不把文件内容放入结果。它不解析 Skill frontmatter、不解析指令导入、不读取宿主设置，也不判断正在运行的 Agent 实际加载了什么。结果包含嵌套项目和示例文件。

该命令尚未发布。先在此源码仓库执行 `npm ci && npm run build`，然后运行：

```bash
node dist/index.js discover examples/discovery/project
node dist/index.js discover examples/discovery/project --format json
node examples/discovery/audit-discovered.mjs examples/discovery/project
```

最后一个示例使用路径参数逐个执行现有静态审计，不将路径拼进 Shell，也不执行 Skill。出现 high/critical 风险时退出 1，发现不完整时退出 2；空结果会明确说明没有执行审计。如果还需要审计配套脚本，请审阅后另外将 Skill 目录传给 `audit`。发现器列出入口文件，不枚举所有可执行依赖。

## 支持的约定

于 2026-11-04 对照官方资料核验。嵌套项目被列为候选文件，不代表当前生效上下文。宿主设置、版本、工作目录、优先级和产品形态都会影响实际加载。

| 相对于各项目目录的文件 | 类型 | 宿主标记 |
| --- | --- | --- |
| `AGENTS.md` | instruction | codex, claude, cursor, copilot |
| `AGENTS.override.md` | instruction | codex |
| `CLAUDE.md` | instruction | claude；仅扫描根目录标记 cursor/copilot |
| `CLAUDE.local.md`, `.claude/CLAUDE.md`, `.claude/rules/**/*.md`, `.claude/commands/**/*.md` | instruction | claude |
| `.agents/skills/**/SKILL.md` | skill | codex, cursor, copilot |
| `.claude/skills/**/SKILL.md` | skill | claude, cursor, copilot |
| `.cursor/skills/**/SKILL.md` | skill | cursor |
| `.codex/skills/**/SKILL.md` | skill | cursor（兼容目录） |
| `.github/skills/**/SKILL.md` | skill | copilot |
| `.cursor/rules/**/*.mdc`, `.cursorrules` | instruction | cursor |
| `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md` | instruction | copilot |
| 扫描根目录的 `GEMINI.md` | instruction | copilot |
| 其他任意 `SKILL.md` | skill | 未分配宿主的可移植候选 |

匹配区分大小写。共享文件只有一条记录，宿主标记与 `evidence` 中的匹配模式稳定排序。嵌套 Skill 目录也会作为候选，特定宿主版本未必递归加载。`.codex/skills` 不标记为当前 Codex 支持。Claude 对 AGENTS 的支持存在条件；Cursor 兼容行为和 Copilot 产品形态也有差异。发现器不读取设置来求解这些条件。

官方来源：[Codex Skills](https://learn.chatgpt.com/docs/build-skills)、[Codex 项目指令](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Claude Skills](https://code.claude.com/docs/en/skills)、[Claude 项目指令](https://code.claude.com/docs/en/memory)、[Cursor Skills](https://cursor.com/docs/skills)、[Cursor 规则](https://cursor.com/docs/rules)、[Copilot Skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)、[Copilot 项目指令](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)。

## 输出与范围

| 字段 | 含义 |
| --- | --- |
| `schemaVersion` | `1`；不兼容变更必须升级 schema 版本 |
| `toolVersion` | package 版本；本地开发源码不等于已发布版本 |
| `root` | 固定为 `.`；所有路径相对于传入 discover 的目录 |
| `complete` | 声明的扫描范围内未发生检查错误，不代表安全 |
| `ignoredDirectories` | 任意深度的 `.git`, `.skillci-workspaces`, `coverage`, `dist`, `node_modules` |
| `symlinks` | `skip`；遇到符号链接会报告，且不跟随目标 |
| `items` | 按 Unicode code-unit 顺序排列的唯一文件路径记录 |
| `items[].kind` | `skill` 或 `instruction` |
| `items[].hosts` | 排序后的宿主约定标记；可移植候选可能为空 |
| `items[].evidence` | 排序后的文件名匹配模式，或 `portable SKILL.md filename` |
| `items[].policyCoverage` | 固定为 `unknown`；存在策略文件不等于已覆盖 |
| `diagnostics` | 排序后的相对路径、稳定 code、severity 与可读消息 |

扫描从明确指定的目录开始，默认当前目录；不向上搜索，不自动搜索用户全局目录。使用固定忽略目录列表，不读取 `.gitignore`。所有符号链接都会跳过，包括内部链接与循环链接；根目录为符号链接时拒绝扫描。最大嵌套深度 64，更深目录报告错误。预期输入为本地项目目录，而非文件系统根目录或网络共享。

`invalid-root`、`unreadable` 和 `depth-limit` 是错误，设置 `complete: false` 并使 CLI 退出 2。`symlink-skipped` 为提示，`complete` 在声明的排除范围内仍为 true。空结果退出 0 并明确提示。CLI 参数错误退出 2。指定 JSON 后遇到无效或不可访问的根目录，仍返回结构化诊断。错误消息不包含原始绝对路径或文件内容；结果中的相对路径仍是项目元数据，分享时可能涉及敏感信息。

自动化时将路径解析到同一个明确根目录，先检查 `complete` 与诊断，再检查工作流预期的文件数量。Markdown 和 JSON 表达同一份清单。测试会核对源码 fixture 与版本化预期结果。不输出覆盖率、不自动选择策略、不生成用户文件，也不收集遥测。
