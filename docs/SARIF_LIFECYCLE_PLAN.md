# SARIF lifecycle validation plan — 2026-11-05

Status: **original sequence stopped after two pushes**. Baseline and shifted runs succeeded and reused alert 6, but both exposed an inconsistent-fingerprint warning. The old fixed commit remains unpushed. Compatibility was subsequently fixed and the separately approved [corrected sequence](SARIF_LIFECYCLE_V2_PLAN.md) passed all three live phases. See [live evidence and diagnosis](SARIF_VALIDATION.md) and [the project plan](PROJECT_PLAN.md). Do not resume this historical sequence's third push. No v0.6.0 release was created.

## Scope and isolation

The product code is unchanged from `98fa7ede193d63a21d8f62ee2783f12785f62a04`. A separate local worktree at `/tmp/skillci-sarif-lifecycle-20261105` holds branch `validation/sarif-lifecycle-20261105`. It contains a push-only validation workflow and a text-only fixture, never executed. It uses the existing scanner and 12 rule descriptors, category `skillci-lifecycle-20261105`, and source URI `validation/sarif-lifecycle/SKILL.md`.

The category differs from `main`'s `skillci-example`. Do not merge this branch, change `main`, create tags/Releases, or publish npm as part of this test. The workflow requires `contents: read` and `security-events: write` only. It deliberately uses `--no-fail` for the risky fixture; this is not a changed product default.

## Prepared commits and local evidence

| Phase | Commit | Expected report |
| --- | --- | --- |
| Baseline | `e4646ebc9bdbdf0d7db8f420c6dd4c86e2f95743` | One SKILLCI001 finding at line 4 |
| Shifted | `7783f34ab68ab8fd0a0147d69c65c951a532805a` | Same finding/fingerprint, now at line 6 |
| Fixed | `7f4e2105deb408a0f1c7fec142ef0e670fdfd3a5` | Zero results; still a valid complete SARIF analysis |

The fingerprint in the first two reports is `37c0f1f18625ee398932ec1ff776c1c00939b9e9de73123d9a8a38b40d5bf08c:1`. Each revision's `check-report.mjs` asserts its result count, rule ID, path, line and fingerprint. The workflow uploads only after these checks pass.

All three reports passed local expectation checks and the vendored SARIF 2.1.0 schema. The existing 44 tests passed. The workflow YAML, branch restriction and permissions were checked. None of this proves GitHub's cross-commit matching or closure until the live steps below complete.

## Originally approved remote operations — execution stopped

Remote `origin`: `https://github.com/LM20230311/skillci.git`.

All three operations target **only** `refs/heads/validation/sarif-lifecycle-20261105`; the first creates the branch and the others fast-forward it. No history rewrite, force push, integration or deletion is proposed.

Execution: the first and second commands below were performed after explicit user confirmation. The remote branch now points to `7783f34ab68ab8fd0a0147d69c65c951a532805a`. The third command is retained as the historical plan, **not an instruction to execute it**. Both completed runs reused alert 6 at lines 4 and 6 respectively; upload logs exposed a producer fingerprint mismatch. Main remained at `98fa7ed`.

Execute from the validation worktree, one at a time:

```bash
git push origin e4646ebc9bdbdf0d7db8f420c6dd4c86e2f95743:refs/heads/validation/sarif-lifecycle-20261105
# Wait for successful workflow + processed analysis; save baseline alert identity.
git push origin 7783f34ab68ab8fd0a0147d69c65c951a532805a:refs/heads/validation/sarif-lifecycle-20261105
# Wait; verify the SAME branch/category alert identity and updated line 6.
git push origin 7f4e2105deb408a0f1c7fec142ef0e670fdfd3a5:refs/heads/validation/sarif-lifecycle-20261105
# Wait; verify the original alert INSTANCE on this branch/category becomes fixed.
```

Before the first push, ensure the remote branch does not already exist. Before subsequent pushes, ensure the remote branch still points to the previous approved commit. If the branch differs, workflow fails, upload is rejected, or alert identities do not match, stop and investigate; do not push the next phase or use force updates to hide the failure.

Risks: this creates a visible remote branch, uses three Actions runs, and intentionally creates a Code Scanning alert in a distinct branch/category before fixing it. Alerts and history can remain visible after resolution. It does not publish a package or execute the fixture instructions. Local `main` documentation changes are not included in these three pushes; committing/pushing them later is a separate operation.

## Live evidence to capture

For every phase, retain the commit, workflow run URL, successful upload status, analysis ID, category, result count and alert number. For the shifted/fixed phases, inspect the alert's instances matching `refs/heads/validation/sarif-lifecycle-20261105` and this category; default-branch state alone is insufficient. Reuse of the alert identity after line movement and the matching instance becoming fixed are the acceptance criteria. Do not manually dismiss alerts as a substitute for automatic closure.

Also inspect upload-step annotations and logs for fingerprint mismatches. Empty analysis API warning fields and a successful workflow do not prove the upload had no compatibility warnings. A new validation sequence must check the intended producer algorithm against an independent upstream oracle, not only against a copy of its own expected output.

## Separate fork PR acceptance

The GitHub API reported zero forks on 2026-11-05. A real fork PR therefore remains pending and needs a separately controlled account/fork and permission for the concrete PR operation. Do not invent an adopter, create another repository, use `pull_request_target`, or treat a same-repository PR/local expression check as a real fork test. Check that the actual fork run retains an artifact and skips Code Scanning upload without access errors. No external PR or account operation is authorized by this plan.
