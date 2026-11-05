# Corrected SARIF lifecycle plan — 2026-11-05

Status: **all three approved pushes executed; controlled live lifecycle passed**. Upload logs had no inconsistent-fingerprint warnings; alert 7 was reused at lines 4 and 6, then its matching branch/category instance became fixed automatically. See [full live evidence](SARIF_VALIDATION.md#corrected-live-lifecycle-results). This supersedes execution of the [stopped original sequence](SARIF_LIFECYCLE_PLAN.md); it does not erase its evidence or resume its third commit. Commands below are the historical approved plan, not instructions to rerun it.

## Implementation and local evidence

Product fix: `2ecbbf6174d93811ef89b7b4b877ff3787f287b8` (`fix: align SARIF line fingerprints with GitHub`). It includes source, generated output, fixed upstream vectors, attribution, bilingual documentation and prior live receipts. It is committed locally on `main`; remote `main` remains `98fa7ed`.

Node 20 and Node 22 each passed 57 tests. The nine fixed upstream vectors and independently observed uploader value agree. All three candidate reports pass the official SARIF schema and phase assertions: one SKILLCI001 at line 4, the same hash at line 6, then zero results. The known line hash is `24b245e0e432c108:1`; it is not recomputed by the fixture checker. Packaging includes third-party notices; no runtime dependency was added. Clean live uploads and controlled lifecycle behavior are now established by the runs in the linked receipt.

## Isolated branch and prepared commits

Local worktree: `/tmp/skillci-sarif-lifecycle-v2-20261105`.

New branch: `validation/sarif-lifecycle-v2-20261105`.

New upload category: `skillci-lifecycle-v2-20261105`.

Stable source URI: `validation/sarif-lifecycle/SKILL.md`.

| Phase | Source commit | Expected result |
| --- | --- | --- |
| Baseline | `2a2ea20759d62cc24e7b5a6f4c289695346b77ea` | One finding at line 4, no inconsistent-fingerprint warning |
| Shifted | `39113129c751e0a2ec17b4af5ff12ec455df4a6e` | Same branch/category alert identity at line 6, same hash, no mismatch warning |
| Fixed | `fefeb4241c90a099edca32956761144db0b4c8d4` | Zero results; original matching alert INSTANCE becomes fixed automatically |

The three commits descend linearly from the fix commit, not the old validation branch. Only the source fixture and its expected phase change between them; the corrected producer and workflow remain constant. Fixture text is never executed. The explicit `--no-fail` is a report-only choice for this deliberately unsafe test, not a product-default change.

## Exact approved pushes — executed

Remote `origin`: `https://github.com/LM20230311/skillci.git`.

All operations target only `refs/heads/validation/sarif-lifecycle-v2-20261105`. First create that branch, then fast-forward it twice. No force update, history rewrite, integration, deletion, tag, Release or npm publication is included. Neither remote `main` nor the old validation branch is changed.

```bash
git push origin 2a2ea20759d62cc24e7b5a6f4c289695346b77ea:refs/heads/validation/sarif-lifecycle-v2-20261105
# Wait for processing; inspect upload logs/annotations and save baseline identity.
git push origin 39113129c751e0a2ec17b4af5ff12ec455df4a6e:refs/heads/validation/sarif-lifecycle-v2-20261105
# Wait; inspect logs and verify the SAME matching alert identity at line 6.
git push origin fefeb4241c90a099edca32956761144db0b4c8d4:refs/heads/validation/sarif-lifecycle-v2-20261105
# Wait; inspect logs and verify the matching branch/category instance is fixed.
```

Preflight: the remote branch must not exist before the first push. Before each later push it must still equal the previous approved source commit. If it differs, stop; never force-push. Capture the run URL, successful test/artifact/upload steps, analysis ID, 12-rule count, result count, alert number and matching instance ref/category/commit/location/state at each phase.

Read upload logs and annotations after EACH run. A successful conclusion or empty analysis API warnings does not prove absence of an `inconsistent fingerprint` warning. Stop for that warning, failed processing, unexpected identity or another product-related anomaly. Existing runner/Action platform-deprecation notices are separate maintenance observations; record them without treating them as producer compatibility failures.

## Risks and remaining scope

The approved sequence would create a visible remote branch, run three GitHub Actions jobs, upload repository reports, and intentionally create a test alert before fixing it. Alert/history records can remain visible. The first push also makes the corrected producer commit reachable on that validation branch, but does not advance remote `main`. No untrusted fixture instruction is executed. A later push of `main` needs its own explicit confirmation; switching producer algorithms can change identities of old unreleased-preview alerts.

Real fork PR acceptance is not covered: it requires a separately controlled fork/account and authorization for the concrete external operation. The formal published version remains v0.5.0. No v0.6.0 release is authorized by this plan.
