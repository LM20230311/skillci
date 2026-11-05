# SARIF live validation — 2026-11-05

Commit: `98fa7ede193d63a21d8f62ee2783f12785f62a04` on `main`.

- [CI](https://github.com/LM20230311/skillci/actions/runs/41975695060): passed.
- [SARIF workflow, attempt 1](https://github.com/LM20230311/skillci/actions/runs/41975695117/attempts/1): passed, artifact retained and Code Scanning upload processed.
- [SARIF workflow, attempt 2](https://github.com/LM20230311/skillci/actions/runs/41975695117/attempts/2): passed on the same commit.
- GitHub analyses `2100941832` and `2100949284` each reported 12 rules and 5 results, category `skillci-example`, with empty error/warning fields.

GitHub's Code Scanning API reported these source locations, checked against the committed fixture:

| Alert | Rule | File | Line |
| --- | --- | --- | --- |
| [1](https://github.com/LM20230311/skillci/security/code-scanning/1) | SKILLCI003 | examples/risky-skill/SKILL.md | 8 |
| [2](https://github.com/LM20230311/skillci/security/code-scanning/2) | SKILLCI002 | examples/risky-skill/SKILL.md | 10 |
| [3](https://github.com/LM20230311/skillci/security/code-scanning/3) | SKILLCI004 | examples/risky-skill/SKILL.md | 10 |
| [4](https://github.com/LM20230311/skillci/security/code-scanning/4) | SKILLCI001 | examples/risky-skill/SKILL.md | 12 |
| [5](https://github.com/LM20230311/skillci/security/code-scanning/5) | SKILLCI005 | examples/risky-skill/SKILL.md | 14 |

After attempt 2, the open alert set remained exactly numbers 1–5 with the same rule/path/line mappings. This establishes same-commit repeat-upload deduplication for this fixture. The fixture is intentionally unsafe: these are example alerts, not newly discovered vulnerabilities in SkillCI.

Local tests also establish stable fingerprints under checkout relocation and inserted unrelated lines. The live sequence below now confirms reuse of an alert identity across one changed-commit fixture, but exposes an upload compatibility warning. Automatic alert resolution after a real source fix and a real fork PR's artifact-only fallback remain pending. No v0.6.0 tag, Release, or npm publication was created; the package/tool version remains 0.5.0 during source development.

## Cross-commit lifecycle sequence — stopped after phase 2

The user approved the [three-commit lifecycle plan](SARIF_LIFECYCLE_PLAN.md). The first two commits were pushed sequentially to `refs/heads/validation/sarif-lifecycle-20261105`, category `skillci-lifecycle-20261105`, without modifying `main`.

| Phase | Commit | Run | Analysis | Observed result |
| --- | --- | --- | --- | --- |
| Baseline | `e4646ebc9bdbdf0d7db8f420c6dd4c86e2f95743` | [42005068072](https://github.com/LM20230311/skillci/actions/runs/42005068072) | `2102189779` | 12 rules, 1 result; alert 6 open at line 4 |
| Shifted | `7783f34ab68ab8fd0a0147d69c65c951a532805a` | [42005306835](https://github.com/LM20230311/skillci/actions/runs/42005306835) | `2102201133` | 12 rules, 1 result; SAME alert 6 open at line 6 |
| Fixed | `7f4e2105deb408a0f1c7fec142ef0e670fdfd3a5` | Not run | None | Local empty-report checks passed only; NOT pushed |

Both completed workflows passed all 44 tests, uploaded the SARIF artifact, and successfully processed their analysis. The alert 6 instances endpoint confirmed the expected branch/category, latest commit and updated source line. The branch alert list contained only alert 6, so this fixture did not produce a duplicate alert. The existing five open `main` alerts remained numbers 1–5.

However, **both upload steps logged an inconsistent-fingerprint warning**. GitHub calculated `24b245e0e432c108:1`; SkillCI supplied `37c0f1f18625ee398932ec1ff776c1c00939b9e9de73123d9a8a38b40d5bf08c:1`. The analysis API's `error` and `warning` fields were empty despite this Action annotation. Consequently, analysis fields and green run conclusions alone are insufficient acceptance evidence.

The cause is confirmed against [GitHub's upload implementation](https://github.com/github/codeql-action/blob/v4/src/fingerprints.ts): it computes `primaryLocationLineHash` using a normalized, 100-character rolling window and compares it with any existing value. SkillCI currently puts its custom SHA-256 of rule/path/excerpt plus occurrence into that same field. The upload Action warns and retains the supplied value rather than replacing it. [GitHub's SARIF documentation](https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/sarif-support#data-for-preventing-duplicated-alerts) describes how the field is used for cross-run matching.

The limited matching result is real, but does not remove the producer compatibility defect. The third push was intentionally stopped; no alert was manually dismissed, no history was rewritten, and no release was created. Next: resolve the field/algorithm compatibility, add an independently checked regression case, then re-plan clean live lifecycle validation. The old third commit must not be pushed automatically after changing the implementation. Real fork PR verification remains separate; the repository currently has no forks.

## Local compatibility fix (awaiting live revalidation)

The source implementation now computes GitHub's normalized 100-character rolling line hash using native BigInt with 64-bit wrapping, EOF padding, UTF-16 code units, whitespace/newline handling and per-file duplicate-hash ordinals. It reads each affected source file once per SARIF render, after containment checks. Different rules on the same line share the same line hash, including suppressed findings; source lines outside the file are rejected. No runtime dependency was added.

The independent oracle is [nine input/output vectors](../examples/sarif/fingerprints.v4.json) copied from upstream commit `33d7b85da1a04171e211befe2c739303b9a4c066`, plus the real uploader's `24b245e0e432c108:1` at baseline line 4 and shifted line 6. Further tests cover Unicode/BOM normalization, following-window sensitivity, multi-rule/suppressed same-line identity, and invalid source lines. All 57 tests passed separately on Node 20 and Node 22; the representative Action bundle report and packaging checks passed, and npm audit reported zero vulnerabilities. Upstream attribution is retained in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md), source and generated output; the npm dry-run includes the notice file (61 files total).

This is a local fix, not a claim of clean online acceptance. The original runs and warning records above remain historical evidence. The fingerprint algorithm is non-cryptographic and includes following context; documentation no longer promises SHA-256 privacy or arbitrary edit-stable identity. Existing unreleased-preview alerts may change identity after migration. A fresh isolated branch/category will establish a clean baseline, then test line movement and automatic closure. It must use newly reviewed commits, not the old unpushed fixed commit. Formal package/tool version remains 0.5.0; real fork PR verification is still pending.
