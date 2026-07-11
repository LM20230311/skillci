# SkillCI Agent Guide

This file governs all AI-assisted work in this repository. Keep changes small, evidence-based, and aligned with the current phase in `docs/PROJECT_PLAN.md`.

## Product contract

SkillCI is a safety and regression tool for AI Agent Skills. It helps users review risky instructions, enforce policies, and run repeatable checks. Do not represent static analysis as a complete security boundary or a sandbox.

The current implementation is a dependency-light TypeScript CLI and composite GitHub Action. The Action executes the checked-in self-contained bundle at `dist/action/index.js`, so source and generated output must always remain synchronized.

## Required reading and planning

1. Read `docs/PROJECT_PLAN.md` before starting any non-trivial work.
2. Select work from the current phase unless the user explicitly changes priorities.
3. Update the plan's status, acceptance evidence, version, and next step after every completed iteration.
4. Add user-visible release changes under `[Unreleased]` in `CHANGELOG.md`; move them to a versioned section only when creating a release.

## Documentation and localization

- `README.md` is the English GitHub homepage.
- `README.zh-CN.md` is the Simplified Chinese counterpart.
- The two README files must remain feature-equivalent: positioning, supported commands, examples, integration snippets, current scope, roadmap, security boundaries, and links must be updated in the same change.
- Keep product names, CLI commands, rule IDs, file paths, code blocks, and GitHub Action references exact across languages. Translate explanatory prose naturally; do not translate commands or identifiers.
- If a README change cannot sensibly be translated in the same pull request, stop and explain why instead of silently letting the translations diverge.
- Add new user-facing documentation to both language navigation paths when relevant.

## Implementation rules

- Prefer TypeScript with Node standard-library APIs. Add a runtime dependency only when it materially improves correctness or safety.
- Keep rule IDs stable once released. New rules need a test, a clear remediation message, and README coverage when user-visible.
- Policy matching must be deterministic and explainable. Avoid silently weakening a policy on parse errors.
- Use `skillci:ignore-next-line` only for a reviewed, narrow exception. It must name the exact existing rule and include a concise quoted `--reason`; never remove or weaken a detection rule merely to hide a finding.
- Suppressions must remain visible in reports. Do not add a mechanism that silently excludes a file, directory, or rule from audit output.
- Do not execute an untrusted Skill while developing a static rule. Behavior tests must use an explicitly isolated fixture strategy.
- Preserve the CLI's documented exit-code behavior: high/critical audit findings and failed cases should fail by default; `--no-fail` must remain an explicit opt-out.

## Verification checklist

For code, policy, rule, or CLI changes:

1. Add or update focused tests in `src/*.test.ts`.
2. Run `npm test`.
3. Run a representative CLI command for the changed behavior.
4. Run `npm pack --dry-run` when package contents or build output changes.
5. Run `git diff --check` before committing.
6. Run `npm run build` and commit the resulting `dist/` changes whenever `src/`, `package.json`, or `tsconfig.json` changes.

For documentation-only changes, verify links, Markdown fences, language navigation, and `git diff --check`.

## Release process

1. Finish the release checklist in `docs/PROJECT_PLAN.md`.
2. Synchronize both README files and finalize `CHANGELOG.md`.
3. Run the full verification checklist and ensure GitHub Actions CI passes on `main`.
4. Create an annotated release tag and GitHub Release.
5. Update README Action examples to an exact immutable release tag such as `LM20230311/skillci@v0.1.0`.
6. Record the release in the project plan and move the next phase forward.
