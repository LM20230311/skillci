# SARIF 与 GitHub Code Scanning（尚未发布）

[English](SARIF.md) · [简体中文](SARIF.zh-CN.md)

该功能已在源码仓库实现，属于下一里程碑 v0.6.0；已发布的 v0.5.0 npm 包和 Action 尚不包含它。

## 生成报告

构建源码仓库后执行：

```bash
npm ci
npm run build
node dist/index.js audit examples/risky-skill --format sarif --source-root . --output skillci.sarif
```

报告会先写入文件，再因 high/critical 风险退出 1。输入或源目录错误退出 2。只有明确需要仅报告时才使用 `--no-fail`。输出文件的父目录必须已经存在。SARIF 路径相对于 `--source-root`，默认当前工作目录。接入 GitHub 时应指定 checkout 根目录，即使只扫描单个文件或 Skill 子目录。目标及解析后的源文件必须位于根目录内。位置会解析符号链接；该路径检查不是执行沙箱。

SARIF 2.1.0 包含全部 12 个稳定规则描述、固定风险说明和修复建议、error/warning/note 等级、行号位置、partial fingerprints，以及 `inSource`/`accepted` 抑制记录。风险模式是审查信号，不代表已证明的可利用漏洞；不生成未经评估的 CVSS 分数。primaryLocationLineHash 使用 GitHub 的规范化 100 字符滚动窗口算法及文件内重复序号，基于源文件行而非规则 ID、文件名或抑制状态；GitHub 同时依赖稳定的规则 ID 与路径匹配告警。迁移 checkout 或在告警前插入无关行通常保持指纹不变；后续窗口内编辑、前面新增相同窗口或路径变化可能影响匹配。此修复替代初始未发布预览中不兼容的 SHA-256 字段，已有预览告警可能改变身份。修复后的实现仍需无指纹警告的线上生命周期验收。

## 隐私与解释

SARIF 省略原始代码片段、动态策略值、完整提示词、自由填写的豁免理由、宿主绝对路径和命令行参数。消息与建议来自固定规则元数据。具体证据和审查理由需在本地查看对应行。行指纹是非加密算法，会包含后续源码上下文，既不等于加密，也不保证秘密内容无法被推测。应将报告视为仓库数据，向项目外分享前先审阅。相对文件名仍是项目元数据，不做匿名化。原有 Markdown、JSON、annotation 输出继续保留其上下文信息；本次 SARIF 契约不改变它们。

[官方 schema 快照](../examples/sarif/sarif-schema-2.1.0.json) 下载自 [SchemaStore](https://json.schemastore.org/sarif-2.1.0.json)，其 `$id` 指向 OASIS schema。测试使用开发依赖 Ajv 和 ajv-formats 验证活动、空、被抑制和路径编码报告；它们不是 CLI 或 Action 的运行时依赖。

指纹兼容测试使用[固定上游 commit 的九组测试向量](../examples/sarif/fingerprints.v4.json)，以及原线上上传器独立计算的值。原生 BigInt 实现不新增依赖；[第三方声明](../THIRD_PARTY_NOTICES.md)和生成产物保留上游许可。详见[本地修复记录](SARIF_VALIDATION.md#local-compatibility-fix-awaiting-live-revalidation)。

## Action 接入

源码 Action 新增可选 `sarif-output` 输入及 `sarif-file` 输出，原有 `path`、`policy`、`base-policy`、annotation 和 `fail-on-risk` 行为保留。SARIF 根目录为 `GITHUB_WORKSPACE`。输入通过环境变量和带引号的参数数组传递。Action 不自动上传文件；每次仍接受一个目标路径，多目标使用独立步骤或作业，并指定不同文件名和上传 category。

在此 SkillCI 源码仓库完成 `npm ci` 和 `npm run build` 后，可使用：

```yaml
permissions:
  contents: read
  security-events: write

steps:
  # Checkout and build this SkillCI source checkout first.
  - id: audit
    uses: ./
    with:
      path: examples/risky-skill
      sarif-output: skillci.sarif
  - uses: actions/upload-artifact@v4
    if: ${{ always() && hashFiles('skillci.sarif') != '' }}
    with:
      name: skillci-report
      path: skillci.sarif
  - uses: github/codeql-action/upload-sarif@v4
    if: ${{ always() && github.event_name == 'push' && hashFiles('skillci.sarif') != '' }}
    with:
      sarif_file: skillci.sarif
      category: skillci
```

`always()` 保证风险门禁失败后仍执行上传，不需要用 `continue-on-error` 消除门禁失败。扫描或配置错误可能不产生报告，文件存在检查避免上传缺失文件。应使用干净工作区和新的报告路径，避免上传旧文件。[接入工作流](../.github/workflows/sarif.yml) 针对刻意危险的 fixture 使用 `fail-on-risk: false` 和 category `skillci-example`；这些告警用于演示检测器，不代表 SkillCI 本身存在漏洞。

该示例在 fork PR 中保存 artifact，不尝试上传 Code Scanning。不要用 `pull_request_target` 携带写权限凭据执行不可信 PR 代码。保留 `contents: read`，将 `security-events: write` 限制在上传作业。公共仓库可使用 Code Scanning；私有或内部组织仓库需要适用套餐并启用 Code Security。无法上传时保留 SARIF artifact，并继续使用原有 Markdown/JSON 本地报告。同一 commit 的多个分析需要稳定且不同的 category。

2026-11-05 核对的官方来源：[SARIF 支持范围](https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/sarif-support)、[上传工作流与访问条件](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/upload-sarif-file)。[线上验证](SARIF_VALIDATION.md) 已确认上传与部分去重，同时发现初始实现的指纹不一致警告。当前本地实现已修复并通过独立回归对照；仍需用修复后的实现重新验证无该警告的上传、跨提交匹配及自动关闭。真实 fork PR 验收也未完成。绿色工作流与空的 analysis API warning 字段不能单独证明完整验收通过。
