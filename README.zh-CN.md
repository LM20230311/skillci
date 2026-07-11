# SkillCI

<p align="center">
  <strong>为你的 AI Agent Skills 加上一道 CI 防线。</strong><br />
  在有风险的指令变成有风险的操作之前发现它们。
</p>

<p align="center">
  <a href="https://github.com/LM20230311/skillci/actions/workflows/ci.yml"><img src="https://github.com/LM20230311/skillci/actions/workflows/ci.yml/badge.svg" alt="CI 状态" /></a>
  <a href="https://www.npmjs.com/package/skillci"><img src="https://img.shields.io/npm/v/skillci.svg" alt="npm 版本" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT 许可证" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js" alt="Node.js 20 或更高版本" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

> **你的 AI Agent 有 CI；你的 Skills 有吗？**

Agent Skill 可以读取文件、执行命令、调用 API 和修改仓库。SkillCI 是一个开源 CLI 与 GitHub Action：它识别高风险指令、执行版本控制的策略，并让安全回归检查与 Skill 本身放在一起。

它适用于 Codex、Claude Code、Cursor、GitHub Copilot、Gemini CLI，以及其他由指令驱动的 Agent Skills。

**项目计划与迭代记录：** 请查看 [PROJECT_PLAN.md](docs/PROJECT_PLAN.md)。

## 谁适合使用 SkillCI？

| 用户 | SkillCI 保护什么 |
| --- | --- |
| **Skill 开发者** | 在发布或更新 Skill 前发现不安全的指令。 |
| **安装 Skill 的开发者** | 在第三方 Skill 接触凭据、仓库或外部服务前先检查它。 |
| **工程与安全团队** | 将团队对 Agent 权限的约束变成 PR 检查，而不是一条没人执行的口头规则。 |

如果你只使用聊天助手，从不安装、发布或维护 Agent Skills，SkillCI 可能并不适合你。它服务的是那些准备让 AI Agent 接触代码库或真实工作流的人。

## 为什么 Skill 也需要 CI？

Skill 不是被动的说明文档。它可以指示 Agent 读取 `.env`、执行 `curl | bash`、删除目录、改写 Git 历史，或调用外部服务。当 Agent 拥有仓库访问权限和凭据时，一条看似很小的指令变更就可能变成真实操作。

```text
没有 SkillCI："这个 Skill 看起来有用，要合并吗？"
有了 SkillCI："这个 PR 新增网络访问、读取 .env、并强推 main。阻止它。"
```

SkillCI 在合并或安装前给团队一个可审查的答案：**这个 Skill 被允许做什么、这次改变了什么、CI 是否应该阻止它？**

## 当前可发现的风险

| 风险 | 示例 | 规则 |
| --- | --- | --- |
| 破坏性删除 | `rm -rf dist` | `SKILLCI001` |
| 执行远程脚本 | `curl ... \| bash` | `SKILLCI002` |
| 访问密钥与 SSH 文件 | `.env`、`~/.ssh`、`id_rsa` | `SKILLCI003` |
| 未审查的网络访问 | `fetch()`、`curl`、`https://` | `SKILLCI004` |
| 改写 Git 历史 | `git push --force`、`git reset --hard` | `SKILLCI005` |
| 越出工作区 | `../`、`/Users/`、`/home/` | `SKILLCI006` |
| 违反项目策略 | 禁止的网络、路径或命令 | `SKILLCI101–103` |
| 未获批准的网络主机 | 不在 `allow.network` 中的主机 | `SKILLCI104` |
| 被禁止的工作目录 | 策略禁止的 `cd` 或 `--cwd` 路径 | `SKILLCI105` |
| 无效的抑制指令 | 缺少理由、规则不存在或指令格式错误 | `SKILLCI106` |

SkillCI 有意采取保守策略：它会标记值得审查的模式，但**不会**声称仅靠静态分析就能证明一个 Skill 绝对安全。

## 看看它如何工作

仓库中包含一个刻意写得不安全的 Skill：

```bash
git clone https://github.com/LM20230311/skillci.git
cd skillci
npm install
npm run build

node dist/index.js audit examples/risky-skill --no-fail
```

```text
SkillCI report

✓ Files scanned: 1
✗ SKILLCI002  Remote script execution      SKILL.md:10
✗ SKILLCI001  Destructive recursive delete SKILL.md:12
✗ SKILLCI003  Sensitive file access        SKILL.md:8
✗ SKILLCI005  Force push                   SKILL.md:14
Risk score: CRITICAL
```

高风险与严重风险默认以退出码 `1` 结束，因此可直接让 CI 失败。仅想生成报告而不阻断当前命令时，加入 `--no-fail`。

## 从 npm 安装

在拥有 Skills 的仓库中，将 SkillCI 安装为开发依赖：

```bash
npm install --save-dev skillci
npx skillci audit .github/skills
```

如果只是临时检查，无需安装：

```bash
npx skillci@0.4.1 audit .github/skills
```

在 GitHub Actions 工作流中继续使用 `LM20230311/skillci@v0.4.1`。

## 三分钟上手

### 1. 新建策略与回归案例

```bash
node dist/index.js init
```

它会在 Skill 旁创建一份小而可审查的契约：

```text
skillci/
├── policy.yml
├── cases/
│   └── smoke.yml
└── fixtures/
    └── docs-skill/SKILL.md
```

### 2. 用代码定义边界

```yaml
# skillci/policy.yml
deny:
  paths:
    - .env
    - ~/.ssh/**
  commands:
    - git push --force
  network: true
```

### 3. 审计 Skill

```bash
node dist/index.js audit .github/skills/release --policy skillci/policy.yml
```

SkillCI 会同时报告通用风险和策略违规。例如，当策略禁止网络访问时，网络调用会额外触发 `SKILLCI101`。

### 使用 glob 与经过审查的网络主机

`deny.paths` 中的路径条目使用 glob 匹配：`**/*.pem` 会匹配任意层级的证书文件，而 `secrets/*.pem` 不会匹配 `secrets/` 下更深层的文件。

当 Skill 确实需要联网时，应使用经过审查的主机 allowlist，而不是取消边界：

```yaml
allow:
  network:
    - api.github.com
    - registry.npmjs.org
```

`deny.network: true` 不能与 `allow.network` 同时使用。allowlist 外的主机会报告为 `SKILLCI104`。

对于高风险的命令变体和受保护目录，可使用命令模式与工作目录 glob：

```yaml
deny:
  commandPatterns:
    - terraform apply *-auto-approve
  workingDirectories:
    - infra/prod/**
```

`commandPatterns` 会匹配包含参数的命令指令；`workingDirectories` 会检查 `cd`、`--cwd` 和 `--working-directory` 引用。被禁止的目录会报告为 `SKILLCI105`。

在策略进入 CI 前先验证它：

```bash
skillci policy check skillci/policy.yml
```

可复制的文档、发布和基础设施策略示例位于 [`examples/policies`](examples/policies)。

### 在合并前审阅策略扩权

比较已检出的基线策略与待合并策略：

```bash
skillci policy diff policy/main.yml skillci/policy.yml
```

SkillCI 会将新增限制与**权限扩大**分开显示。新增 `allow.network` 主机、移除一条 `deny.paths`，或把 `deny.network` 从 `true` 改为 `false`，都会出现在醒目的警告标题下，供审阅者判断新增访问是否合理。

当工作流检出基线策略后，GitHub Action 也可以为这些扩权添加注释：

```yaml
- uses: actions/checkout@v4
  with:
    ref: main
    path: policy-main

- uses: LM20230311/skillci@v0.4.1
  with:
    path: .github/skills
    policy: skillci/policy.yml
    base-policy: policy-main/skillci/policy.yml
```

### 添加经过审查的例外，而不隐藏它

有些发现是有意为之。只抑制紧随其后的那一行上的精确规则，并向审阅者说明理由：

```md
<!-- skillci:ignore-next-line SKILLCI004 --reason "This release check calls the documented GitHub API endpoint." -->
fetch("https://api.github.com/repos/LM20230311/skillci/releases/latest");
```

同一指令也可以写在 shell 风格注释中：

```bash
# skillci:ignore-next-line SKILLCI004 --reason "This release check calls the documented GitHub API endpoint."
curl https://api.github.com/repos/LM20230311/skillci/releases/latest
```

SkillCI 仍会在 Markdown 与 GitHub Actions 输出中报告这条抑制、所在位置和审查理由。它不会抑制同一行上的其他规则。缺少理由、未知规则 ID 或格式错误的指令会产生一条活动的 `SKILLCI106` 发现。可运行示例见 [`examples/suppressions`](examples/suppressions)。

## 接入 CI

在拥有 Skill 的仓库中，加入以下 GitHub Actions 工作流：

```yaml
name: Audit agent skills

on:
  pull_request:
    paths:
      - ".github/skills/**"
      - "skillci/**"

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: LM20230311/skillci@v0.4.1
        with:
          path: .github/skills
          policy: skillci/policy.yml
          fail-on-risk: true
```

Action 会输出原生 GitHub workflow annotations，因此审阅者可以在准确的文件和行号看到风险。

## 将安全要求变成回归测试

`skillci test` 让安全预期变成可执行的案例。它会遍历目录中的 YAML 案例；当 Skill 超出最大风险等级，或触发禁止规则时，命令失败。

```yaml
# skillci/cases/docs-skill.yml
name: documentation-skill-stays-safe
target: ../fixtures/docs-skill
policy: ../policy.yml
expect:
  maxRisk: low
  forbiddenRules:
    - SKILLCI001
    - SKILLCI002
```

```bash
node dist/index.js test skillci/cases
```

```text
# SkillCI test run

- Cases: 1
- Passed: 1
- Failed: 0
```

## 在受限工作区中运行 Agent 行为测试

Phase 3 使用严格的行为测试契约。它记录 fixture、任务输入、声明的 runner、允许和禁止的工具、预期退出码、文件变更、允许的命令列表、预期的 Node 文件读取与写入，以及网络 API 尝试次数。 `skillci behavior check` 只校验契约；`skillci behavior run` 会在 Docker 中运行它。

```yaml
name: documentation-update-stays-within-fixture
fixture: fixtures/docs
input:
  prompt: Update the documentation landing page for the current release.
runner:
  image: node:22-alpine
  command: node runner.mjs
  timeoutSeconds: 60
tools:
  allow:
    - filesystem
    - shell
  deny:
    - network
expect:
  exitCode: 0
  commands:
    - node runner.mjs
    - node -e process.exit(0)
  reads:
    - docs/README.md
    - runner.mjs
  writes:
    - docs/README.md
  network:
    requests: 0
  files:
    created: []
    modified:
      - docs/README.md
    unchanged:
      - .env
```

使用以下命令验证：

```bash
skillci behavior check examples/behavior/docs-update.behavior.yml
```

随后运行 fixture：

```bash
skillci behavior run examples/behavior/docs-update.behavior.yml
```

当前 runner 要求 `tools.deny` 必须包含 `network`。SkillCI 会先把 fixture 复制到临时工作区，再以 Docker 启动：`--network none`、只读容器文件系统、仅挂载该复制工作区的可写目录、移除 Linux capabilities、启用 `no-new-privileges`，并限制 CPU/内存/进程数。之后它会核对退出码以及新增、修改或未变化的文件。需要先安装 Docker，并确保命令可用。

对于 Node runner，SkillCI 还会在复制后的工作区中预加载一个轻量追踪器。每个实际执行的命令、读取和写入都必须分别出现在 `expect.commands`、`expect.reads`、`expect.writes` 中；出现未声明的子进程或文件操作会使案例失败。`expect.network.requests` 会精确核对观察到的 Node 网络 API 尝试次数，而 Docker 仍负责强制断网。该追踪器覆盖 Node 的文件系统、子进程和常见网络 API；它不是内核级系统调用审计，也不意味着 Docker runner 是完整的安全边界。

这是刻意保持狭窄的执行边界，并不声称是完整沙箱；运行不可信工作负载时，仍应使用最小权限凭据和专用 CI runner。

## CLI 参考

```bash
# 生成策略、安全示例 Skill 和回归案例。
skillci init [directory]

# 审计文件或目录。
skillci audit <path> [--policy <file>] [--format markdown|json|github] [--output <file>] [--no-fail]

# 输出 Markdown 报告。
skillci report <path> [--policy <file>] [--output <file>] [--no-fail]

# 运行一个 YAML 案例或一个案例目录。
skillci test <cases-path> [--format markdown|json] [--no-fail]

# 在策略进入 CI 前验证它。
skillci policy check <file> [--format markdown|json]

# 比较基线策略与待合并策略。
skillci policy diff <before-file> <after-file> [--format markdown|json|github]

# 验证行为测试契约，不执行其 runner。
skillci behavior check <case-file> [--format markdown|json]

# 在受限 Docker runner 中运行行为案例。
skillci behavior run <case-file> [--format markdown|json]
```

## 为什么要做这个项目

Agent 生态正在从单纯的 Prompt 转向可移植、可安装的能力：Skills、MCP Servers、Plugins 和指令文件。它很强大，但也意味着一个小小的 Markdown 文件可能影响开发者的文件系统、凭据、代码仓库和外部服务。

这些能力同样需要熟悉的工程控制手段：

- **策略（Policies）** 定义一个 Skill 可以做什么；
- **审计（Audits）** 在 PR 中暴露风险变更；
- **回归案例（Regression cases）** 防止更新后的 Skill 悄悄变差；
- **CI** 让这些检查自动运行、可被审阅。

SkillCI 希望成为这套控制机制轻量、开放的基础。

## 当前范围与路线图

### 已提供

- [x] 轻量 TypeScript CLI，以及可独立运行的 GitHub Action bundle
- [x] 静态审计规则，以及 Markdown、JSON、GitHub annotation 报告
- [x] 版本控制的路径 glob、网络主机 allowlist、命令模式与工作目录边界
- [x] `skillci policy check` 会拒绝无效或互相矛盾的策略语法
- [x] 必须填写理由、且仍会在报告中展示的内联抑制机制
- [x] 区分权限扩大与新增限制的策略 diff
- [x] 对 fixture、输入、工具、退出码和文件预期进行行为测试契约校验
- [x] Docker 行为 runner：复制 fixture 工作区、拒绝网络、严格的 Node 命令/读/写/网络断言与 CI 覆盖
- [x] 用于最大风险等级和禁止规则的 YAML 静态回归案例
- [x] Composite GitHub Action

### 下一步

- [ ] 适配 Codex、Claude Code、Cursor 与 GitHub Copilot 的约定
- [ ] 建立公开的危险与失效 Skill 样本库
- [ ] SARIF 上传与更丰富的 PR 摘要

## 贡献

当前最有价值的贡献是真实风险模式、误报反馈、策略范例和 Skill fixtures。请在提交宽泛规则之前，先通过 Issue 提供最小可复现示例。

```bash
npm install
npm test
```

## 安全提示

不要把 SkillCI 当成沙箱或完整安全边界。运行不可信 Skill 时，请使用最小权限、受限凭据、显式审批和隔离环境。

## 许可证

[MIT](LICENSE)
