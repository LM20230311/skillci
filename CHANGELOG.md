# Changelog

All notable changes to SkillCI are recorded in this file.

## [Unreleased]

### Added

- `skillci behavior check` for validating non-executing behavior-test contracts and the first documentation-update fixture example.

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
