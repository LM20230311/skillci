# SkillCI 再定位与执行方案（2026-11）

> 状态：**提案，尚未批准执行**
>
> 2026-11-04 修订说明：本文件保留为原始提案；后续范围与验收请阅读 [收敛后的再启动执行方案](RELAUNCH_PLAN_REVISED.zh-CN.md)。下文市场判断、能力表述与排期中的调整以修订版为准。
>
> 目标：在不推翻现有引擎的前提下，把 SkillCI 从低采用的通用扫描器，重定位为可被主流 Agent Skill 仓库采用的供应链 CI 门禁。
> 重要约束：不新建 `dsh-plugin-health` 仓库，不复制已经被占用的 DSH 插件健康赛道。

## 1. 结论摘要

建议继续做 `SkillCI`，不新开 `dsh-plugin-health`。

具体决策：

1. **保留仓库、npm 包和品牌 `skillci`**，避免重置历史、发布链路和已有能力。
2. **保留安全策略、回归测试、隔离行为 runner、GitHub Action 四项核心能力。**
3. **重新定位为跨 Agent 的 Skill 供应链 CI**，而不是单一 DSH 插件体检器。
4. **用一个窄的 DSH adapter 进入热点生态**，负责识别和扫描 DSH 插件中的 Skill、指令与安装边界，不和成熟项目抢“插件是否能启动”。
5. **先做采用证据，再做大而全的索引。** 首要目标不是 Star，而是外部仓库真实接入、规则贡献和可复现报告。
6. **4 周内完成一次有明确产品的 relaunch；6 周内用采用数据决定继续、收缩还是停止。**

## 2. 为什么不做 `dsh-plugin-health`

### 2.1 名称和 npm 包已经被占用

- GitHub：`EasonMWS/dsh-plugin-health`
- npm：`dsh-plugin-health@2.2.1`
- 截至 2026-11-04 仍在更新
- 已实现隔离 DSH home、真实启动、可撤销版本豁免和损坏插件修复

同名项目不是空壳，直接进入会撞名字、撞定位、撞用户预期。

### 2.2 DSH 插件健康赛道已有强竞争者

| 项目 | 现有信号 | 已覆盖能力 |
| --- | --- | --- |
| `AdamPlatin123/dsh-plugin-radar` | 约 1,493 stars | 持续发现、K8s 运行时验证、兼容快照 |
| `EasonMWS/dsh-plugin-health` | 活跃发布 | 隔离安装、启动验证、可撤销修复 |
| `whyihaveyou/dsh-suite` | 约 64 stars | 小时级目录刷新、每日兼容测试 |
| `dsh-plugin-audit` / `compat` / `inspector` | 多个项目 | 静态权限、兼容、插件检查 |

DSH 插件“安装/启动/兼容/修复”已经是红海。

### 2.3 新仓库没有战略收益

新开仓库意味着：

- 从 0 stars、0 用户、0 信任开始；
- 重建 npm、Action、Release、测试和发布流程；
- 与已有强项目正面竞争；
- 把现有 SkillCI 的可复用引擎浪费掉；
- 再次陷入“功能很多但没人用”的问题。

除非能明确提供竞争者没有的能力，否则不建议新做 DSH Plugin Health。

## 3. 为什么保留 SkillCI

### 3.1 已有基础不是玩具

SkillCI 当前具备：

- 风险规则 `SKILLCI001`–`SKILLCI006`；
- 版本化策略和策略校验；
- 策略扩权对比；
- 可见、带理由的抑制机制；
- 静态回归案例；
- Docker 隔离行为 runner；
- 命令、文件读写和网络追踪；
- Markdown、JSON、GitHub annotation 报告；
- npm CLI 与 GitHub Marketplace Action；
- CI、Release、Trusted Publishing 和 provenance。

这些能力与“做一个 Agent Skill 的真 CI”高度吻合。

### 3.2 当前问题是定位和分发，不是代码量不足

现状：

- 约 1 star；
- 近一个月 npm 下载约 19；
- 最后一次发布为 `v0.4.1`；
- 已有 Codex/Claude 等宽泛描述，但没有明确的生态入口；
- 没有外部署名案例、基准报告或 badge 传播；
- 没有持续发布规则和样本。

真正需要补的是：

- 一句话可理解的产品定位；
- 首批真实接入案例；
- 规则和误报反馈闭环；
- 公开可引用的数据和报告；
- 与 Skill 仓库、目录、Agent 宿主的集成；
- 持续发布和传播。

### 3.3 跨生态比单一 DSH 更有防御性

SkillCI 的长期价值不应依赖一个宿主或一个市场。跨 Codex、Claude Code、Cursor、Copilot、Gemini CLI 等 Agent 的共同问题是：

> 这些 Skill 可以读文件、运行命令、联网和改仓库，但大多数仓库没有 CI 门禁，也没有可审查的权限契约。

SkillCI 可以把这些共性问题做成稳定产品；DSH adapter 只是进入当前热点生态的分发渠道。

## 4. 市场判断

### 4.1 需求真实存在

公开证据：

- DSH 目录中已有 8,700+ 插件条目，质量、兼容性和权限信息跟不上数量；
- `awesome-dsh-plugin#2582`：22 个高星插件中 12 个在升级后安装或启动失败；
- `dsh-market#1008`：21 个插件实测后明确要求权限、体积、兼容矩阵和最近冒烟结果；
- Agent Skills 生态正在把“提示词文件”变成可执行工作流，权限边界成为共同问题。

### 4.2 但“需求”不等于“收入”

免费开源采用有较大可能；个人作者不太可能为 badge 付费。
商业价值更可能在：

- 团队策略分发；
- 私有 Skill/插件仓库；
- 审计历史与合规报告；
- CI 结果保留和签名；
- 企业 allowlist、版本锁定和回滚。

因此路线应是：

> 先做开源采用和可信数据，再验证团队/企业付费。

### 4.3 竞争格局

静态规则扫描已有多个零散项目，但还没有一个跨 Agent、可持续更新、可被真实 CI 引用的标准。
SkillCI 不应竞争“规则数量最多”，而应竞争：

- 误报可解释；
- 策略可版本化；
- 行为可复现；
- 报告可被 GitHub 直接消费；
- 结果可被其他目录和市场引用；
- 规则和样本有社区反馈闭环。

## 5. 产品定位

### 5.1 新的一句话

中文：

> **给 AI Agent Skills 加上供应链 CI：审查权限、阻断危险变更、复现真实行为。**

English:

> **Supply-chain CI for AI Agent Skills: review permissions, block risky changes, and reproduce real behavior.**

### 5.2 不再使用的主定位

以下说法过于宽泛，应弱化：

- “AI Agent 安全扫描器”；
- “通用 Prompt 安全工具”；
- “另一个 Agent Skill 市场”；
- “DSH 插件体检器”；
- “静态分析保证安全”。

### 5.3 产品层级

SkillCI 是三层组合：

1. **Static contract**：Skill 文本和包结构声明了什么风险；
2. **Policy gate**：当前仓库允许哪些路径、命令、网络和工具；
3. **Behavior proof**：在隔离环境中实际发生了什么，是否越权。

三层缺一不可，但对外先讲用户结果，不先讲规则和引擎。

## 6. 目标用户与 Jobs To Be Done

### 用户 A：Skill 作者

任务：

- 发布前知道自己新增了什么能力；
- 在 PR 中阻止意外扩权；
- 给用户一个可验证的可信信号。

购买/采用阻力：

- 配置越简单越好；
- 不能产生大量误报；
- 不能要求作者改变 Skill 目录结构。

### 用户 B：安装第三方 Skill 的开发者

任务：

- 在授权 Agent 读写文件和执行命令前，知道会发生什么；
- 比较相似 Skill 的权限和风险；
- 在升级时发现能力扩大。

### 用户 C：工程/安全团队

任务：

- 把团队的 Agent 权限规则写进 CI；
- 统一策略、例外、审计记录；
- 出现问题时能追溯某次变更。

这是未来最可能的付费用户。

### 用户 D：Skill 目录与 Agent 宿主

任务：

- 在目录/市场中显示可信状态；
- 减少“安装后才发现不可用/高风险”的支持成本；
- 读取机器可读结果，不重复实现扫描器。

## 7. 产品原则

1. **证据优先于分数。** 每个 finding 必须包含规则、位置、原因和修复建议。
2. **不伪装成安全证明。** 静态与行为检查都有边界，必须明确写出。
3. **默认 fail closed，但允许显式例外。** 例外必须可见、带理由、可审计。
4. **策略确定性。** 解析失败不得静默放宽；权限扩张必须被单独标注。
5. **一条命令接入。** 用户能从 `npx skillci init` 到 CI 运行少于 5 分钟。
6. **结果可被机器消费。** JSON、SARIF、badge 和稳定 schema 优先于漂亮网页。
7. **先补采用闭环，再做平台化。** 不先做账号、云控制台、市场或复杂 Agent 编排。
8. **不执行不可信 Skill，除非明确进入隔离 behavior runner。**

## 8. 产品范围

### 8.1 P0：现在必须做

- 重写中英文首页定位和示例；
- `skillci discover`：发现仓库中的 Skill、instruction 和 DSH bundle；
- 输出 SARIF，接入 GitHub Code Scanning；
- 生成可嵌入的静态 badge；
- 改进 GitHub Action：路径发现、baseline policy、SARIF 上传说明；
- 规则可解释性和误报反馈模板；
- 真实仓库接入示例；
- 首批公开基准报告。

### 8.2 P1：4–6 周内做

- Codex / Claude Code / Cursor / Copilot 的目录适配；
- DSH adapter：识别 `package.json` 中的 `dsh.bundle`、`cordis.patch.yml` 和 `SKILL.md`；
- 规则包版本化；
- policy preset：release、documentation、infrastructure；
- `skillci explain <finding>` 或等价命令；
- 统计匿名化使用信号，默认不上传代码或路径。

### 8.3 P2：验证需求后做

- 团队策略分发；
- 私有 registry / allowlist；
- 审计历史和签名报告；
- 云端 dashboard；
- 公开 Skill 健康目录；
- 与目录和市场的数据对接。

### 8.4 明确不做

- 不做 Skill 市场；
- 不做 Agent 运行时；
- 不做模型网关；
- 不做 MCP 全量代理；
- 不宣称静态分析等于沙箱；
- 不为了数量批量收录不可验证的规则；
- 不做需要用户注册才能使用的核心 CLI。

## 9. 核心用户旅程

### 9.1 Skill 作者首次接入

```bash
npx skillci init
npx skillci discover .
npx skillci audit .
npx skillci report . --output skillci-report.md
```

目标结果：

- 发现 Skill；
- 生成最小策略；
- 找出 3–5 条高置信问题；
- 给出明确 next action；
- 不要求修改 Skill 内容。

### 9.2 PR 审核

```text
PR 修改 SKILL.md
  -> SkillCI 找出新增网络 host 和 .env 读取
  -> baseline policy diff 标记“权限扩大”
  -> GitHub annotation / SARIF 定位到行
  -> 维护者决定允许、例外或拒绝
```

### 9.3 行为回归

```bash
skillci behavior run skillci/cases/release.yml
```

目标：

- 在无网络、最小权限、隔离 workspace 中运行；
- 核对文件、命令、网络和退出码；
- 生成可复现证据；
- 失败信息可读，不泄露宿主路径和秘密。

### 9.4 DSH 适配

```text
DSH plugin repository
  -> 识别 dsh.bundle / cordis.patch.yml / SKILL.md
  -> 扫描 Skill 指令和生命周期脚本
  -> 标记 shell / 文件 / 网络 / 提示词改写能力
  -> 输出可被目录或市场引用的 JSON
```

边界：不负责插件安装成功和运行时崩溃；这些留给现有 DSH health/radar 项目。

## 10. 技术方案

### 10.1 现有模块保留

- `src/audit.ts`：静态规则与 finding；
- `src/policy.ts`：策略、扩权 diff；
- `src/behavior.ts`：隔离 behavior runner；
- `src/report.ts`：Markdown/JSON/GitHub annotation；
- `src/index.ts`：CLI；
- `action.yml` / `dist/action/index.cjs`：GitHub Action。

### 10.2 新增模块

```text
src/discovery/
  index.ts          # 发现入口
  codex.ts          # Codex Skill 约定
  claude.ts         # Claude Code Skill 约定
  cursor.ts         # Cursor instruction 约定
  copilot.ts        # Copilot instruction 约定
  dsh.ts            # DSH bundle / Skill 适配
src/sarif.ts        # SARIF 输出
src/badge.ts        # badge 数据和 SVG/JSON 生成
src/rules/
  registry.ts       # 规则元数据、版本、修复建议
  defaults.ts       # 默认规则包
src/benchmark/
  manifest.ts       # 公开样本清单
  runner.ts         # 本地/CI 批量运行
```

### 10.3 CLI 目标接口

```text
skillci discover [path] [--json]
skillci audit <path> [--policy <file>] [--format markdown|json|github|sarif]
skillci test <cases-path>
skillci behavior check <case-file>
skillci behavior run <case-file>
skillci policy check <file>
skillci policy diff <before> <after>
skillci badge [path] [--json]
```

设计原则：

- 保持已有命令兼容；
- 新命令默认只读；
- `discover` 不修改文件；
- 所有报告包含 `schemaVersion`、规则版本、输入路径摘要和时间戳；
- 默认不输出绝对路径，不输出文件内容，不把 secret 写进报告。

### 10.4 稳定数据模型

Finding 最小字段：

```json
{
  "schemaVersion": 1,
  "ruleId": "SKILLCI003",
  "severity": "high",
  "title": "Sensitive file access",
  "path": "SKILL.md",
  "line": 8,
  "evidence": "redacted evidence",
  "remediation": "Use a reviewed secret injection mechanism.",
  "suppression": null
}
```

Report 最小字段：

```json
{
  "schemaVersion": 1,
  "toolVersion": "0.5.0",
  "rulesetVersion": "2026.11",
  "generatedAt": "ISO-8601",
  "source": { "kind": "skill", "host": "codex" },
  "summary": { "critical": 1, "high": 2, "medium": 0, "low": 0 },
  "findings": []
}
```

### 10.5 SARIF

要求：

- `skillci audit . --format sarif` 生成合法 SARIF 2.1.0；
- rule metadata 映射到 GitHub Code Scanning；
- `path`, `startLine`, `endLine` 可点击；
- 同一规则稳定 ID；
- 不含原始 secret、完整 prompt 或宿主绝对路径。

### 10.6 Badge

第一版不做在线服务，直接生成静态 Markdown：

```markdown
[![SkillCI: 2 high risks](badge-url)](report-url)
```

更稳的方式先支持仓库内 SVG 或 GitHub Actions artifact。后续再用独立服务提供动态 badge。

## 11. 路线图

### Phase A：重新定位与可信基础（第 1 周）

交付：

- 新 README 中英文定位；
- `discover` MVP；
- `--format sarif`；
- 规则元数据和 fix guidance；
- 3 个真实示例；
- 首次公开扫描报告。

验收：

- 新用户 5 分钟内能跑通；
- 至少 3 个不同仓库示例；
- SARIF 可在 GitHub Code Scanning 上传；
- 现有 `npm test`、Action、release 流程不退化。

### Phase B：宿主与 DSH 适配（第 2 周）

交付：

- Codex adapter；
- Claude Code adapter；
- Cursor/Copilot 至少各一个 adapter；
- DSH adapter；
- `discover --json` 稳定输出；
- 适配器不修改用户文件。

验收：

- 至少 3 个宿主可发现；
- 每个宿主有最小可运行示例；
- DSH adapter 能识别 bundle、patch 和 SKILL.md；
- 适配器测试覆盖“无文件、混合目录、嵌套目录、符号链接”。

### Phase C：公开采用与基准（第 3–4 周）

交付：

- 扫描 50–100 个热门 Skill/DSH 插件；
- 发布报告和 reproducible manifest；
- 给 10–20 个热门仓库提交 badge/CI PR；
- GitHub Marketplace 首页文案更新；
- 规则误报反馈模板；
- 首次 external adopter 名单。

验收：

- 至少 10 个外部仓库真实运行；
- 至少 3 个外部仓库把 Action 放进 CI；
- 至少 1 个外部贡献者提交规则、样本或误报分析；
- 公开报告中所有结论都有可复现输入。

### Phase D：团队版验证（第 5–6 周）

交付：

- policy preset；
- 报告保留/artifact 方案；
- 企业需求访谈；
- 付费假设验证；
- 是否进入团队版的 go/no-go 决策。

验收：

- 访谈 5 个团队用户；
- 至少 2 个团队愿意试用；
- 明确一个付费场景；
- 不以 Star 数代替采用证据。

## 12. 分发与增长方案

### 第一次 relaunch

主题：

> **Your Agent has CI. Your Skills probably don't.**

发布内容：

1. 300–500 字说明 Skill 为什么是主动执行指令；
2. 一个真实危险 Skill 的检测演示；
3. 一个真实 PR 的权限扩张 diff；
4. 一个隔离 behavior run 截图；
5. 一条 3 分钟接入命令；
6. 明确边界：不是沙箱，不是安全证明。

### 目标渠道

- GitHub Marketplace；
- npm；
- Agent Skills 相关 awesome lists；
- Codex / Claude Code / Cursor / Copilot 的示例仓库；
- DSH 插件作者社区；
- 中文开发者社区；
- 安全工程社区。

### 分发原则

- 先找真实仓库作者，不群发；
- 每个 PR 只加最小 CI 文件，不修改业务代码；
- badge 必须能链接到可验证报告；
- 不制造“已审计安全”的误导；
- 不使用夸大安全能力的营销文案。

## 13. 成功指标与停止条件

### 30 天指标

- 20 个外部仓库运行过 SkillCI；
- 5 个仓库在 CI 中启用；
- 100 次/周 npm 下载；
- 10 个真实风险 finding 被作者确认；
- 3 个外部 issue/PR；
- 误报率低于 20%，且每个误报有规则改进记录。

### 90 天指标

- 100 个仓库在 CI 中启用；
- 500–1,000 次/周 npm 下载；
- 3 个宿主/目录集成；
- 5 个外部贡献者；
- 至少 1 个团队试运行；
- 形成稳定的规则版本发布节奏。

### 停止或转向条件

满足任意两条则停止扩张，重新收缩：

- 6 周内没有 10 个外部仓库真实使用；
- 误报率长期高于 30%；
- 90% 的用户只在本地跑一次，不进入 CI；
- 没有目录或 Agent 宿主愿意消费 JSON/SARIF；
- 维护规则的成本超过团队承载；
- 竞争者已提供更好且更开放的同类能力。

## 14. 商业模型假设

短期不收费，先验证采用。

可能的产品层级：

### Free

- CLI；
- GitHub Action；
- 本地静态扫描；
- 基础规则；
- Markdown/JSON/SARIF；
- 社区规则包。

### Team

- 共享 policy；
- 例外与审批记录；
- 报告历史和保留；
- 私有 Skill 仓库扫描；
- 组织级规则分发。

### Enterprise

- SSO/SCIM；
- 审计导出；
- 私有 registry/allowlist；
- 签名报告；
- SLA 与支持；
- 合规集成。

先验证 Team，不要一开始做完整 SaaS。

## 15. 主要风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 规则误报 | 用户关闭工具 | 高置信默认规则、可解释证据、误报反馈闭环 |
| 静态扫描被误认为安全证明 | 信任受损 | 明确边界、behavior runner 独立标识 |
| 跨宿主差异大 | 维护爆炸 | adapter 小接口、宿主能力矩阵、只做发现不做修改 |
| DSH 赛道拥挤 | 无差异化 | 不做插件启动健康，只做 Skill/指令安全与策略 |
| 运行不可信代码 | 宿主被攻击 | 只在固定 Docker 隔离 runner 执行，限制网络和挂载 |
| 开源采用不等于收入 | 商业失败 | 30/90 天采用门槛，团队版单独验证 |
| 规则数量膨胀 | 噪声 | 规则版本化、默认集小而准、外部贡献需样本 |
| 依赖单一平台 | 生命周期风险 | 跨 Agent 核心、DSH 仅作为 adapter |

## 16. 立即执行的 7 天计划

### Day 1

- 确认保留 `skillci` 品牌；
- 更新中英文 README，不改 CLI 行为；
- 定义新定位和边界；
- 建立竞品/相邻项目链接页。

### Day 2

- 实现 `discover` 的目录扫描接口；
- 先支持 Codex 与 Claude Code；
- 添加 fixture 和单元测试。

### Day 3

- 实现 SARIF 输出；
- 验证 GitHub Code Scanning 能读取；
- 添加无 secret/无绝对路径测试。

### Day 4

- 实现 DSH adapter 的最小只读发现；
- 支持 `dsh.bundle`、`cordis.patch.yml`、`SKILL.md`；
- 不实现安装和修复。

### Day 5

- 扫描 20 个真实 Skill / DSH 插件；
- 修正高置信误报；
- 生成第一版基准报告。

### Day 6

- 更新 Marketplace/Action 文案；
- 准备 3 分钟 Quick Start；
- 写入第一个 external adopter 目标名单。

### Day 7

- 对内 review；
- 决定是否进入公开 relaunch；
- 发布第一版报告，不发布夸大安全结论。

## 17. 需要确认的产品决策

以下决策应按顺序确认：

1. 保留 `skillci` 名称，不新建第二品牌；
2. 核心定位是“Agent Skill 供应链 CI”，DSH 只做 adapter；
3. 首要集成渠道是 GitHub Action + SARIF，而不是先做网站；
4. 首要验证对象是 20–30 个真实 Skill 仓库；
5. 6 周内没有采用证据就收缩，不继续堆功能。

## 18. 完成定义

这次 relaunch 只有在以下条件同时满足时才算完成：

- 新用户能在 5 分钟内从 `npx` 到第一份报告；
- 至少 3 个 Agent/Skill 目录可被发现；
- 至少 3 个外部仓库在 CI 中启用；
- SARIF 能被 GitHub 正确展示；
- DSH adapter 能识别 bundle 和 Skill，但不和 health 项目抢安装健康；
- 公开报告可复现、有证据、无误导性安全声明；
- README、PROJECT_PLAN、CHANGELOG、npm、GitHub Action 版本一致；
- 有明确的下一步采用指标，而不是只发布一个功能。

## 19. 一句话决策

> **不新做 `dsh-plugin-health`。保留 `SkillCI`，把它重定位并真正运营成跨 Agent 的 Skill 供应链 CI；DSH 是分发入口，不是产品上限。**
