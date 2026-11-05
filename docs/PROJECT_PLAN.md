# SkillCI 项目计划与迭代记录

> 这份文件是 SkillCI 的单一迭代记录。每次开发开始前确认当前阶段；每次合并或发布后更新状态、验收结果、版本和下一步。

**当前阶段：** Phase 4 已发布，体验验收待办；下一里程碑 `v0.6.0` — SARIF
**当前版本：** `v0.5.0`
**最后更新：** 2026-11-05

**当前迭代：** `v0.6.0` SARIF 远端 main 源码预览仍为 `98fa7ed`。原始生命周期验收发现指纹兼容警告后已停止；当前本地已改用 GitHub 行指纹算法，九组固定上游向量与线上上传器计算值均匹配，Node 22 下 57 项测试通过。详见 [验证与本地修复记录](SARIF_VALIDATION.md)。修复实现尚需重新线上验证无该警告、跨提交匹配和修复关闭；真实 fork PR 也未验收。正式版本仍为 `v0.5.0`，独立新用户体验仍为待办。

**上一轮线上验收：** 用户确认后已顺序推送原始风险 `e4646eb` 和前置两行 `7783f34`；两次 CI 各 44 项测试通过并完成上传。告警 #6 身份保持，但日志暴露指纹不一致警告，因此停止第三次推送；旧验证分支远端停在 `7783f34`，旧修复提交 `7f4e210` 仍仅本地。远端 main、tag、npm 版本未变化；不把绿色 CI 或空 API warning 字段当作无兼容问题。仓库当前无 fork，真实 fork PR 验收仍需独立账号配合。

**兼容修复迭代：** 使用原生 BigInt 实现 GitHub 规范化滚动行指纹，按源文件缓存，不新增运行时依赖；源文件行越界报错。同步修正双语文档的算法、隐私与预览迁移边界，保留第三方 MIT 许可。下一步在新的独立分支/category 上准备三阶段无指纹警告的线上验收，推送前另行确认；不沿用旧第三个提交。

本轮本地验证：Node 20 与 Node 22 下各 57 项测试通过；代表性 Action bundle 报告、官方 schema 回归、`npm pack --dry-run`（61 个文件且包含第三方许可）、Markdown/相对链接及 `git diff --check` 通过，`npm audit` 为 0 项漏洞。版本未提升，不将本地修复写成线上已验收。

## 产品北极星

让 Agent Skill 像应用代码一样，拥有可评审的权限策略、可重复运行的安全回归测试，以及能阻止风险变更进入主分支的 CI 检查。

成功不以 Star 数单独衡量。优先验证：

1. 真实仓库在 CI 中使用 SkillCI；
2. 用户能读懂并处理一条风险报告；
3. 外部贡献者提交真实的风险样本、规则或策略；
4. SkillCI 阻止过一次有证据的风险变更。

## 阶段总览

| 阶段 | 目标 | 完成标准 | 状态 |
| --- | --- | --- | --- |
| Phase 0 | 验证问题与项目定位 | 明确 Agent Skill 的安全、策略与回归测试切口 | ✅ 完成 |
| Phase 1 | 发布可安装、可演示的 MVP | 公开仓库、CI、首个 Release、完整 README | ✅ 完成 |
| Phase 2 | 让策略可靠地表达边界 | 路径/命令/网络规则更准确，减少误报 | ✅ 完成 |
| Phase 3 | 验证 Skill 的实际行为 | 隔离 fixture、行为断言、可复现执行记录 | ✅ 完成 |
| Phase 4 | 接入主流 Agent 生态 | Codex、Claude Code、Cursor、Copilot 适配器 | 🟡 已发布，独立体验验收待办 |
| Phase 5 | 建立社区与可信基准 | 规则包、样本库、贡献流程、使用案例 | ⏳ 待开始 |

---

## Phase 0 — 问题验证与定位

**目标：** 不做又一个通用 Agent 平台，而是聚焦“Skill 是否可以安全、稳定地进入工程工作流”。

### 已完成

- [x] 调研 AI Agent、MCP、Skills 的生态变化与开发者可靠性痛点。
- [x] 确定产品定位：**Agent Skills 的 CI**。
- [x] 明确首版不做 Skill 市场、多 Agent 编排、云端控制台或模型网关。
- [x] 确定首批核心风险：危险命令、远程脚本、密钥、网络、强推、目录越界。

### 验收

- [x] 能用一句话说明价值：*Your AI agent has CI. Do your skills?*
- [x] 能用一个 PR/CLI 报告演示用户价值。

---

## Phase 1 — v0.1.0：可发布 MVP

**目标：** 让开发者克隆仓库后能在几分钟内跑出审计报告，并能作为 GitHub Action 集成。

### 范围

- [x] TypeScript CLI：`init`、`audit`、`report`、`test`。
- [x] 静态规则 `SKILLCI001`–`SKILLCI006`。
- [x] 版本控制的 `deny.network`、`deny.paths`、`deny.commands` 策略。
- [x] 策略违规规则 `SKILLCI101`–`SKILLCI103`。
- [x] YAML 静态回归案例：最大风险等级与禁止规则。
- [x] Markdown、JSON、GitHub Actions annotation 报告。
- [x] Composite GitHub Action。
- [x] 单元测试与 GitHub Actions CI。
- [x] 示例危险 Skill、MIT License、发布级 README。
- [x] `v0.1.0` GitHub Release。

### 非目标

- [ ] 不执行真实 Agent。
- [ ] 不承诺静态扫描能证明 Skill 绝对安全。
- [ ] 不发布 npm 包；先以 GitHub Action / 源码使用验证需求。

### 验收标准

- [x] `npm test` 全部通过。
- [x] `npm pack --dry-run` 通过。
- [x] GitHub Actions CI 通过。
- [x] README 有定位、Demo、三分钟上手、Action 集成、安全边界和路线图。
- [x] 创建 Release 与不可变 tag：`v0.1.0`。

### 发布记录

| 日期 | 版本 | 结果 |
| --- | --- | --- |
| 2026-07-11 | `v0.1.0` | 首次公开发布：静态审计、策略、回归案例与 GitHub Action。 |
| 2026-07-11 | `v0.2.0` | Phase 2 发布：glob、网络主机 allowlist、命令与工作目录策略、可审查抑制和策略 diff。 |
| 2026-07-11 | `v0.3.0` | Phase 3 发布：受限 Docker 行为 runner、文件断言与 CI 真实执行示例。 |
| 2026-07-11 | `v0.3.1` | Marketplace 元数据修复并正式上架：Action 展示名为唯一的 `SkillCI Audit`。 |
| 2026-07-11 | `v0.3.2` | 首个 npm CLI 分发：`skillci@0.3.2` 已作为 `latest` 公开发布并完成独立安装验证。 |
| 2026-07-11 | `v0.4.1` | Phase 3 完成：严格断言 Node runner 的命令、读写与网络 API 尝试；[GitHub Release](https://github.com/LM20230311/skillci/releases/tag/v0.4.1) 与 [npm 包](https://www.npmjs.com/package/skillci/v/0.4.1) 均已公开验证。 |
| 2026-11-05 | `v0.5.0` | [GitHub Release](https://github.com/LM20230311/skillci/releases/tag/v0.5.0)、Marketplace tag 与 [npm latest](https://www.npmjs.com/package/skillci/v/0.5.0) 已核验；新增四宿主只读发现与 JSON v1，修复匹配依赖漏洞。 |

---

## Phase 2 — 策略准确性与可用性

**目标：** 将当前的简单字符串匹配升级为团队可实际采用、误报可控的策略系统。

### 要做什么

- [x] 对路径规则使用 glob 语义，而不是字符串包含。
- [x] 支持网络主机 allowlist，例如只允许 `api.github.com`。
- [x] 支持命令参数与工作目录约束。
- [x] 为规则增加稳定的抑制/豁免机制，并要求说明原因。
- [x] 增加策略校验命令：`skillci policy check`。
- [x] 输出清晰的 policy diff，突出“本次 PR 新增了什么权限”。

### 做到什么程度才算完成

- 至少提供 3 个真实策略范例：文档 Skill、发布 Skill、基础设施 Skill。
- 每种策略具有正反例测试。
- 对公开样本的误报可解释、可抑制，且不隐藏原始风险。

### 本次迭代记录

- [x] 使用 `minimatch` 提供确定性的路径 glob 与主机通配符匹配。
- [x] 新增 `allow.network`，并在未识别或未允许的主机上报告 `SKILLCI104`。
- [x] 新增 fail-closed 的 `skillci policy check`，拒绝未知字段、无效列表和互相矛盾的网络策略。
- [x] 新增文档、发布、基础设施三套可复制策略示例与正反例测试。
- [x] 新增 `deny.commandPatterns` 与 `deny.workingDirectories`，覆盖带风险参数的命令与生产目录边界。
- [x] 新增 `skillci:ignore-next-line`：只作用于指定规则的下一行，要求引用既有规则 ID 和带引号的理由，并在报告中保留抑制记录。
- [x] 新增 `skillci policy diff` 与 Action 的 `base-policy` 输入，区分权限扩大与限制收紧，并为扩权输出 GitHub warning annotation。

---

## Phase 3 — 隔离行为测试

**目标：** 从“文本里是否存在危险表达”升级到“Skill 在受限环境中实际做了什么”。

### 要做什么

- [x] 定义行为测试用例格式：fixture、输入、允许工具、期望文件变更、禁止副作用。
- [x] 在临时复制 workspace 的 Docker 容器中运行受控任务。
- [x] 记录退出码与文件 created/modified/deleted 的结构化结果。
- [x] 支持文件 diff 断言，并以容器网络隔离实现网络拒绝。
- [x] 将运行结果作为 Markdown/JSON 输出，并在 CI 中执行示例。
- [x] 细粒度记录读取、写入、命令和网络请求；支持命令断言。

### 做到什么程度才算完成

- 对一个示例 Skill 能在干净环境中重复执行，并稳定得到相同判断。
- 测试不会访问宿主机私钥、家目录或未声明网络。
- 失败报告能告诉用户“期望什么、实际发生什么、如何修复”。

### 本次迭代记录

- [x] 新增 `skillci behavior check`，严格校验 YAML 行为案例，但不执行 runner。
- [x] 定义 fixture、prompt、runner、工具权限、退出码及文件期望的最小契约，并提供文档更新的可复制示例。
- [x] 新增 `skillci behavior run`：复制 fixture 后在 Docker 中运行，强制禁用网络、只读根文件系统、移除能力、禁止提权并限制资源。
- [x] 对退出码、created/modified/unchanged 文件断言生成可审阅报告；CI 会真实运行文档更新示例。
- [x] 发布 `v0.3.0`：首个可复现的隔离行为 runner；远程 CI 已真实执行通过。
- [x] 新增 Node 追踪预加载器：严格核对实际命令、文件读取、文件写入和网络 API 尝试；未声明的命令或文件操作会失败，Docker 继续强制断网。

## GitHub Marketplace 上架计划

**目标版本：** `v0.3.1`，修复 Marketplace Action 名称唯一性校验后发布。

上架前检查：

- [x] Action 的真实隔离执行用例已通过 CI（[run 29148660933](https://github.com/LM20230311/skillci/actions/runs/29148660933)）。
- [x] 已核对 `action.yml` 的 Marketplace 名称、描述和品牌信息；名称改为唯一的 `SkillCI Audit`。
- [x] 账户已接受 GitHub Marketplace Developer Agreement（GitHub 页面确认）。
- [x] 创建 `v0.3.1` Release，并发布至 GitHub Marketplace：[SkillCI Audit](https://github.com/marketplace/actions/skillci-audit)。

## npm 发布计划

**目标版本：** `v0.3.2`，为本地 CLI 与非 GitHub CI 用户提供正式分发。

- [x] 验证 `skillci` 包名在 npm registry 中可用。
- [x] 补充双语 README 的 npm 安装、`npx` 单次运行与 npm badge。
- [x] `v0.3.2` GitHub Actions CI 已通过（[run 29149090315](https://github.com/LM20230311/skillci/actions/runs/29149090315)）。
- [x] 创建 [v0.3.2 GitHub Release](https://github.com/LM20230311/skillci/releases/tag/v0.3.2)。
- [x] 发布 `skillci@0.3.2` 到 npm 的 `latest` tag，并通过 `npm exec --yes --package=skillci@0.3.2 -- skillci --help` 完成独立安装验证。
- [x] 已配置 npm Trusted Publishing：npm 已核验绑定 `LM20230311/skillci` 的 `publish-npm.yml`，权限仅限 `npm publish`；下一个新版本将验证 GitHub Release 自动发布与 provenance。
- [x] `v0.4.1` 已验证双渠道自动发布：GitHub Release 触发 OIDC npm publish，[workflow 29151177175](https://github.com/LM20230311/skillci/actions/runs/29151177175) 成功；`skillci@0.4.1` 已作为 `latest` 公开安装验证。

---

## Phase 4 — Agent 宿主适配

**目标：** 让用户不用改变现有开发习惯即可接入 SkillCI。

**2026-11-04 规划修订：** 已完成再启动方案的范围收敛，并在本地实现 `v0.5.0` 的发现及审计接入；策略覆盖统一显示 `unknown`。`v0.6.0` 规划 SARIF 与 GitHub 接入；`v0.7.0` 规划固定版本样本和采用验证。DSH adapter、badge 与团队功能按修订方案的进入条件推进。

### 要做什么

- [x] Codex：识别常用 Skills 与项目指令目录（本地实现）。
- [x] Claude Code：识别 Skills、命令和项目说明目录（本地实现）。
- [x] Cursor / GitHub Copilot：识别其 instruction / skill 约定（本地实现）。
- [x] 提供 `skillci discover`：只读清单、相对路径、识别依据、JSON v1 与结构化诊断；策略覆盖显示 `unknown`。
- [x] 为每个宿主提供最小可运行示例，并用已有 audit 扫描发现的入口文件。
- [x] 在三个固定 commit 的公开仓库核对发现清单：[验证记录](DISCOVERY_VALIDATION.md)。这不是安全基准或外部采用。
- [ ] 独立新用户按 README 在 5 分钟内完成发现与审计，记录卡点。
- [x] 自动发现实现已推送，远程 CI 通过：[run 41956203345](https://github.com/LM20230311/skillci/actions/runs/41956203345)。
- [x] 发布版本提交通过远程 CI，并按双渠道流程发布 `v0.5.0`；npm latest 为 0.5.0，仓库外帮助命令与 discover 示例均正常，provenance 元数据已确认。

### 本次实现与验证范围

宿主约定于 2026-11-04 核验官方来源，详见 [发现契约](DISCOVERY.zh-CN.md)。测试覆盖共享文件去重、嵌套目录、空结果、忽略目录、符号链接、权限错误、深度限制、CLI 参数和 JSON 样例。发现器不执行文件，不自动读取全局目录。同步补充 `.mdc`、`.cursorrules` 的现有静态审计支持。

本地验证：36 项测试通过，Action bundle 发现命令、发现后审计示例、三个固定 commit 的公开仓库清单验证和 `npm pack --dry-run` 通过；双语 Markdown、相对链接及 `git diff --check` 检查通过。`v0.5.0` 双渠道发布结果已核验。

2026-11-05 发布候选复核：Node 20 和 Node 22 下各 36 项测试通过；干净安装发现的依赖漏洞已通过升级 `minimatch@11.0.4`、`brace-expansion@5.0.12` 修复，`npm audit` 当前报告 0 项漏洞；升级后公开样本清单和发现后审计示例仍通过。

### 做到什么程度才算完成

- 至少 3 个宿主能被自动发现。
- README 中每个宿主都有复制即用的集成示例。
- 适配器不会修改用户文件，除非明确执行 `init` 或 `apply`。

---

## Phase 5 — 社区、基准与采用

### v0.6.0 — SARIF 接入迭代（2026-11-05）

- [x] 实现 `audit --format sarif --source-root <directory>`；默认以当前目录为源码根，输出相对 URI。
- [x] 固定 12 条规则的说明、建议和等级；保留规则 ID 与 in-source suppression，不把原始片段或自由理由写入 SARIF。
- [x] 本地指纹采用 GitHub 规范化滚动窗口与文件内重复序号，checkout 迁移及前置无关行测试通过；后续窗口编辑或相同窗口序号变化可能改变身份。
- [x] 单文件、子目录、Unicode/特殊字符路径、越界和豁免场景测试；官方 SARIF 2.1.0 schema 校验。
- [x] Action 可选 `sarif-output`、`sarif-file` 输出；先写报告再执行原有风险门禁，输入作为环境变量数据传递。
- [x] 双语文档说明权限、私有仓库限制、fork PR artifact 回退、多目标独立 category 和源码预览状态。
- [x] 新增独立 SARIF CI：只在 main push 时上传刻意危险示例的 Code Scanning 结果，PR 保留 artifact。
- [x] 推送并验证真实上传，核对告警 URI 与源文件行：[SARIF run 41975695117](https://github.com/LM20230311/skillci/actions/runs/41975695117)。
- [x] 相同提交真实重跑：两次分析均为 5 个结果，沿用告警 1–5，无重复告警。
- [x] 本地准备隔离分支的三个生命周期验收提交；报告断言和 schema 检查通过。
- [x] 隔离分支两次线上分析复用告警 #6，位置从第 4 行移至第 6 行；上传日志同时发现指纹兼容警告，尚非完整验收。
- [x] 本地修复 primaryLocationLineHash 算法，九组固定上游向量、线上计算值及边界回归通过；保留许可并同步隐私说明。
- [ ] 将修复实现用于新线上验收，核验上传日志无指纹不一致警告。
- [ ] 在修复后的实现上重做生命周期验证，确认 GitHub 自动关闭已修复告警；原第三次推送已停止。
- [ ] 验证真实 fork PR 回退。
- [ ] 完成发布验收后，再发布 v0.6.0 双渠道版本。

Node 20 和 Node 22 下本地测试各 44 项通过，Action Shell 接线测试、代表性 bundle 命令、打包、YAML/Markdown 与相对链接检查通过；npm audit 当前报告 0 项漏洞。Ajv/ajv-formats 仅作为开发依赖，官方 schema 快照、来源与上游许可说明存入仓库。当前不把 schema 通过等同于 GitHub 接入验收通过。

**目标：** 让规则与样本库成为项目的长期护城河。

### 要做什么

- [ ] 建立匿名化的危险/失效 Skill 样本库。
- [ ] 发布可复现的“Skill 安全体检”报告。
- [ ] 定义规则贡献、误报反馈和安全披露流程。
- [ ] 发布首批官方规则包。
- [ ] 收集真实仓库集成案例与用户反馈。

### 做到什么程度才算完成

- 有外部贡献者提交样本、规则或策略模板。
- 有至少一个外部仓库启用 GitHub Action。
- 有公开、可复现的基准与版本化结果。

---

## 每次迭代的固定流程

1. 在本文件选择一个阶段中尚未完成的条目，写明本次范围。
2. 先实现最小可验证版本，避免扩大为通用 Agent 平台。
3. 添加或更新测试，运行 `npm test` 与相关 CLI 示例。
4. 更新 README、CHANGELOG 和本文件中的状态与验收结果。
5. 提交、推送；发布版本时创建 tag、GitHub Release，并记录发布内容。

## 文档与协作规范

- [x] `README.md` 作为英文 GitHub 首页。
- [x] `README.zh-CN.md` 作为简体中文完整对照文档，并在两份 README 顶部提供双向语言导航。
- [x] 通过仓库根目录 `AGENTS.md` 约束后续 AI 与贡献者：功能变更必须同步更新所有 README 语言版本、计划和发布记录。
- [x] 每次 README 更新都必须检查双语命令、规则 ID、链接、支持范围、路线图与安全说明的一致性。
- [x] 两份 README 首屏均明确目标用户、风险严重性，以及 SkillCI 在合并或安装前提供的决策价值。
- [x] `AGENTS.md` 规定 GitHub Marketplace/GitHub Release 与 npm 的双渠道同版本发布、公开验证、首次配置边界与后续 2FA 处理方式。

## 决策原则

- **先可信，再聪明：** 优先可解释、可复现、可审查的功能。
- **先真实集成，再扩展功能：** 真实仓库使用比抽象功能数量更重要。
- **默认最小权限：** 新增网络、命令、路径权限必须在报告中显眼。
- **不伪造安全：** 明确说明静态分析与沙箱的边界。
- **保持可移植：** 不绑定单一模型或 Agent 宿主。
