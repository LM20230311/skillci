# Changelog

All notable changes to SkillCI are recorded in this file.

## [Unreleased]

### Added

- SARIF 2.1.0 output with stable rule metadata, source-root-relative locations, partial fingerprints and visible in-source suppressions; source excerpts and dynamic user messages are omitted.
- Optional Action `sarif-output` / `sarif-file`, and a Code Scanning example workflow that retains artifacts on fork PRs.

### Fixed

- Parse audit options before the target correctly and pass composite Action inputs as quoted environment data instead of interpolating shell source.
- Generate GitHub-compatible `primaryLocationLineHash` fingerprints instead of placing a custom SHA-256 in that field; validate against fixed upstream vectors and the uploader's observed value. The fix is locally verified, with clean live lifecycle acceptance still pending.
- Reject SARIF findings whose source line does not exist. Preserve upstream fingerprint attribution in source, bundle and npm notices without adding runtime dependencies.

### Documentation

- Record live SARIF upload, same-commit and limited cross-commit alert reuse; document the newly observed fingerprint compatibility warning, stopped lifecycle sequence and pending resolution/fork PR verification.

## [0.5.0] - 2026-11-05

### Added

- Read-only `skillci discover [path] --format markdown|json` with relative paths, stable schema v1 output, host-convention evidence, and structured diagnostics.
- Discovery fixtures and source-checkout audit examples for Codex, Claude Code, Cursor, and GitHub Copilot.
- Fixed-commit discovery inventory checks for three public Skill repositories.

### Fixed

- Audit Cursor `.mdc` and legacy `.cursorrules` files so discovered instructions can be checked with existing audit rules.

### Security

- Upgrade minimatch to 11.0.4 and its brace-expansion dependency to a patched version, addressing reported glob/brace expansion denial-of-service vulnerabilities.

### Documentation

- Added a narrowed relaunch plan with discovery, SARIF, and adoption milestones, explicit behavior-observation limits, and verifiable adoption metrics.

## [0.4.1] - 2026-07-11

### Added

- Strict Node behavior-trace assertions for commands, file reads, file writes, and network API attempts.
- A checked-in behavior fixture that proves the tracing preload works in the constrained Docker runner.

## [0.3.2] - 2026-07-11

### Added

- First public npm distribution of the `skillci` CLI, including `npx skillci` usage.
- npm installation and one-off execution guidance in both README languages.

## [0.3.1] - 2026-07-11

### Fixed

- Renamed the GitHub Action metadata to `SkillCI Audit` so the Marketplace listing has a unique Action name.

## [0.3.0] - 2026-07-11

### Added

- `skillci behavior check` for validating behavior-test contracts and the first documentation-update fixture example.
- `skillci behavior run`, which runs a copied fixture in a constrained Docker container with network disabled and verifies exit-code and file-change assertions.
- CI coverage that executes the published behavior fixture with Docker.

## [0.2.0] - 2026-07-11

### Added

- Simplified Chinese README and a repository-level agent contribution guide.
- `skillci policy check`, glob-aware path denies, `allow.network` host allowlists, and three policy examples.
- `deny.commandPatterns` and `deny.workingDirectories`, including `SKILLCI105` findings for prohibited working directories.
- Reviewable inline suppressions with mandatory reasons, visible audit output, and `SKILLCI106` validation findings.
- `skillci policy diff` and the Action `base-policy` input, which flag policy permission expansions for review.

### Changed

- Clarified the target users, risk model, and pre-merge decision value in both README languages.

## [0.1.0] - 2026-07-11

### Added

- Static audit rules for destructive commands, remote scripts, sensitive files, network access, Git history rewriting, and workspace escapes.
- Policy checks for denied network access, paths, and commands.
- YAML static-regression cases.
- Markdown, JSON, and GitHub Actions annotation reports.
- Composite GitHub Action, example risky Skill, tests, and project documentation.
