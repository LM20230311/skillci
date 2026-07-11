# Changelog

All notable changes to SkillCI are recorded in this file.

## [0.4.0] - 2026-07-11

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
