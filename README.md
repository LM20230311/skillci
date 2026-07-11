# SkillCI

<p align="center">
  <strong>Give your AI agent skills a CI gate.</strong><br />
  Catch risky instructions before they become risky actions.
</p>

<p align="center">
  <a href="https://github.com/LM20230311/skillci/actions/workflows/ci.yml"><img src="https://github.com/LM20230311/skillci/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js" alt="Node.js 20 or later" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

> **Your AI agent has CI. Do your skills?**

Agent Skills can read files, run commands, call APIs, and change repositories. SkillCI is an open-source CLI and GitHub Action that finds risky instructions, enforces version-controlled policies, and keeps regression checks close to the Skill itself.

It is designed for Skills used with Codex, Claude Code, Cursor, GitHub Copilot, Gemini CLI, and other instruction-driven agents.

**Planning and iteration:** see [the project plan](docs/PROJECT_PLAN.md).

## Who is SkillCI for?

| User | What SkillCI protects |
| --- | --- |
| **Skill authors** | Catch unsafe instructions before publishing or updating a Skill. |
| **Developers who install Skills** | Inspect a third-party Skill before it can reach credentials, repositories, or external services. |
| **Engineering and security teams** | Turn the team's Agent permissions into a pull-request check instead of an unwritten convention. |

If you only use a chat assistant and never install, publish, or maintain Agent Skills, SkillCI is probably not for you. It is for people giving an AI agent access to a codebase or a workflow.

## Why does a Skill need CI?

A Skill is not passive documentation. It can tell an agent to read `.env`, run `curl | bash`, delete a directory, change Git history, or call an external service. When an agent has repository access and credentials, one seemingly small instruction change can become a real action.

```text
Before SkillCI:    "This Skill looks useful. Ship it?"
With SkillCI:     "This PR adds network access, reads .env, and force-pushes main. Block it."
```

SkillCI gives the team a reviewable answer before merge or installation: **what is this Skill allowed to do, what changed, and should CI stop it?**

## What it catches today

| Risk | Example | Result |
| --- | --- | --- |
| Destructive deletion | `rm -rf dist` | `SKILLCI001` |
| Remote script execution | `curl ... \| bash` | `SKILLCI002` |
| Secret and SSH access | `.env`, `~/.ssh`, `id_rsa` | `SKILLCI003` |
| Unreviewed network use | `fetch()`, `curl`, `https://` | `SKILLCI004` |
| History rewriting | `git push --force`, `git reset --hard` | `SKILLCI005` |
| Workspace escape | `../`, `/Users/`, `/home/` | `SKILLCI006` |
| Policy violations | denied network, path, or command | `SKILLCI101–103` |
| Unapproved network host | a host outside `allow.network` | `SKILLCI104` |
| Denied working directory | a `cd` or `--cwd` path that policy forbids | `SKILLCI105` |

SkillCI is intentionally conservative. It flags patterns that deserve review; it does **not** claim that static analysis alone proves a Skill safe.

## Watch it work

The repository includes an intentionally unsafe Skill:

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

High and critical findings exit with code `1`, so they fail a CI check by default. Add `--no-fail` when you want a report without blocking the current command.

## Get started in three minutes

### 1. Add a policy and a regression case

```bash
node dist/index.js init
```

This creates a small, reviewable contract beside your Skill:

```text
skillci/
├── policy.yml
├── cases/
│   └── smoke.yml
└── fixtures/
    └── docs-skill/SKILL.md
```

### 2. Put the boundary in code

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

### 3. Audit the Skill

```bash
node dist/index.js audit .github/skills/release --policy skillci/policy.yml
```

SkillCI reports both generic risks and policy-specific violations. For example, network use prohibited by policy becomes `SKILLCI101`.

### Use globs and reviewed network hosts

Path entries in `deny.paths` use glob matching, so `**/*.pem` matches certificates at any depth while `secrets/*.pem` does not match a file nested below `secrets/`.

When a Skill needs network access, use a reviewed hostname allowlist instead of removing the boundary:

```yaml
allow:
  network:
    - api.github.com
    - registry.npmjs.org
```

`deny.network: true` and `allow.network` cannot be combined. A host outside the allowlist is reported as `SKILLCI104`.

For high-risk command variants and protected directories, use command patterns and working-directory globs:

```yaml
deny:
  commandPatterns:
    - terraform apply *-auto-approve
  workingDirectories:
    - infra/prod/**
```

`commandPatterns` match a command instruction including its arguments. `workingDirectories` inspect `cd`, `--cwd`, and `--working-directory` references. A denied directory is reported as `SKILLCI105`.

Validate a policy before it reaches CI:

```bash
skillci policy check skillci/policy.yml
```

Copyable documentation, release, and infrastructure examples are available in [`examples/policies`](examples/policies).

## Make it part of CI

Once you publish a release, add this to a workflow in the repository that owns the Skills:

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
      - uses: LM20230311/skillci@v0.1.0
        with:
          path: .github/skills
          policy: skillci/policy.yml
          fail-on-risk: true
```

The Action emits native GitHub workflow annotations, so reviewers see the risk at the exact file and line.

## Turn safety into a regression test

`skillci test` makes a safety expectation executable. It walks every YAML case in a directory and fails if the Skill exceeds an expected risk level or introduces a forbidden rule.

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

## CLI reference

```bash
# Generate a policy, sample Skill, and regression case.
skillci init [directory]

# Audit a file or directory.
skillci audit <path> [--policy <file>] [--format markdown|json|github] [--output <file>] [--no-fail]

# Produce a Markdown report.
skillci report <path> [--policy <file>] [--output <file>] [--no-fail]

# Run a YAML case or a directory of cases.
skillci test <cases-path> [--format markdown|json] [--no-fail]

# Validate a policy before using it in CI.
skillci policy check <file> [--format markdown|json]
```

## Why this project exists

The agent ecosystem is moving from prompts to portable, installable capabilities: Skills, MCP servers, plugins, and instruction files. That is powerful—but it means a small Markdown file can affect a developer's filesystem, credentials, repositories, and external services.

We need the familiar engineering controls around those capabilities:

- **Policies** define what a Skill may do.
- **Audits** expose risky changes in a PR.
- **Regression cases** prevent an updated Skill from quietly getting worse.
- **CI** keeps the check automatic and reviewable.

SkillCI aims to be the lightweight, open foundation for those controls.

## Current scope and roadmap

### Available now

- [x] Lightweight TypeScript CLI with a self-contained GitHub Action bundle
- [x] Static audit rules and Markdown, JSON, and GitHub annotation reports
- [x] Version-controlled path globs, network host allowlists, command patterns, and working-directory boundaries
- [x] `skillci policy check` fails closed on invalid or contradictory policy syntax
- [x] YAML regression cases for maximum risk and forbidden rules
- [x] Composite GitHub Action

### Next

- [ ] Reviewed suppressions and exceptions with a required reason
- [ ] Clear policy diffs that highlight newly requested permissions
- [ ] Fixture-based behavior tests in an isolated sandbox
- [ ] Adapters for Codex, Claude Code, Cursor, and GitHub Copilot conventions
- [ ] A public corpus of unsafe and broken Skills
- [ ] SARIF upload and richer PR summaries

## Contributing

The most valuable contributions right now are real-world unsafe patterns, false-positive reports, policy examples, and Skill fixtures. Please open an issue with a minimal reproducible example before adding a broad rule.

```bash
npm install
npm test
```

## Security note

Do not treat SkillCI as a sandbox or a complete security boundary. Run untrusted Skills with least privilege, scoped credentials, explicit approvals, and isolated environments.

## License

[MIT](LICENSE)
