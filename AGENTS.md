# SkillCI Agent Guide

This file governs all AI-assisted work in this repository. Keep changes small, evidence-based, and aligned with the current phase in `docs/PROJECT_PLAN.md`.

## Product contract

SkillCI is a safety and regression tool for AI Agent Skills. It helps users review risky instructions, enforce policies, and run repeatable checks. Do not represent static analysis as a complete security boundary or a sandbox.

The current implementation is a dependency-light TypeScript CLI and composite GitHub Action. The Action executes the checked-in self-contained CommonJS bundle at `dist/action/index.cjs`, so source and generated output must always remain synchronized.

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
- Treat every policy permission expansion as a review signal. When adding a policy field, update `skillci policy diff` so it can classify additions and removals accurately.
- Do not execute an untrusted Skill while developing a static rule. Behavior tests must use an explicitly isolated fixture strategy.
- `skillci behavior check` validates a behavior contract only. `skillci behavior run` may execute only through its explicit, tested Docker isolation boundary: a copied fixture workspace, no network, no host mounts beyond that workspace, least container privileges, and resource limits. Never describe either command as a complete security boundary.
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
4. Create an annotated release tag and GitHub Release. The published Release triggers `.github/workflows/publish-npm.yml`, which publishes the matching npm version through npm Trusted Publishing (OIDC).
5. Wait for the npm publish workflow, then verify the public package with `npm view skillci@<version>` and `npm exec --yes --package=skillci@<version> -- skillci --help` from outside the repository.
6. Update README Action examples to the exact immutable release tag, such as `LM20230311/skillci@v0.1.0`, and update `npx skillci@<version>` examples to the same semantic version.
7. Record both distribution results in the project plan and move the next phase forward.

## Dual distribution: GitHub Marketplace and npm

Every stable SkillCI release is a **dual release**. Do not publish only one channel unless the user explicitly asks for an exception:

- **GitHub:** an annotated `vX.Y.Z` tag and a GitHub Release. The already-listed [SkillCI Audit Marketplace Action](https://github.com/marketplace/actions/skillci-audit) remains usable at every immutable GitHub tag.
- **npm:** the matching unscoped package version `skillci@X.Y.Z`, published with the `latest` dist-tag unless the user explicitly requests a prerelease tag.

Required order for a normal release:

1. Bump `package.json` and `package-lock.json` to the next semantic version.
2. Synchronize English and Chinese README commands, exact Action tag, npm/npx examples, and badges; finalize `CHANGELOG.md` and `docs/PROJECT_PLAN.md`.
3. Run `npm test`, a representative CLI command, `npm pack --dry-run`, and `git diff --check`; build and commit `dist/` when required above.
4. Commit, push, and wait for CI on `main`.
5. Create and push the annotated tag, then create the matching GitHub Release.
6. Let `.github/workflows/publish-npm.yml` publish the matching npm version through OIDC; never republish or retag an existing version.
7. Validate the live npm package independently, then record the final GitHub Release, Marketplace, and npm links in the plan.

First-time setup was completed on 2026-07-11: GitHub Marketplace Developer Agreement, Marketplace category/metadata, npm package name, npm account 2FA, and the first npm publication. Future releases do **not** require accepting the Marketplace agreement, choosing its category, or resolving the Marketplace name again. npm may still request the account owner's passkey, security key, or authenticator code for each write action; never request that secret in chat or store it in files. Ask the user to complete the browser/device prompt, then resume verification.

Npm Trusted Publishing is configured for the exact `LM20230311/skillci` repository and `publish-npm.yml` workflow. It uses short-lived OIDC credentials, so do not add `NPM_TOKEN`, an npm password, an OTP, or a long-lived bypass-2FA token to GitHub secrets, shell commands, or files. If trusted publishing fails, stop and inspect the exact workflow filename, tag/package-version match, GitHub-hosted runner, and `id-token: write` permission before considering a manual publish fallback.
