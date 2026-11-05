# Corrected SARIF lifecycle validation

This isolated branch tests the locally corrected fingerprint producer, based on `2ecbbf6174d93811ef89b7b4b877ff3787f287b8`. It does not merge the old validation branch or resume its unpushed third commit.

The fixture is scanned as text, never executed. The explicit `--no-fail` is only for this deliberately risky acceptance fixture. Source URI remains `validation/sarif-lifecycle/SKILL.md`; branch and category are new: `validation/sarif-lifecycle-v2-20261105` / `skillci-lifecycle-v2-20261105`.

Push these phases one at a time after explicit user approval, waiting for both processing and evidence review at each phase:

1. **baseline**: one SKILLCI001 at line 4, line hash `24b245e0e432c108:1` independently observed from the original uploader.
2. **shifted**: same finding/hash at line 6; matching branch/category alert identity must be unchanged.
3. **fixed**: valid complete report with zero results; matching alert instance on this branch/category must become fixed without manual dismissal.

Inspect upload logs and annotations for `inconsistent fingerprint` at EACH phase, not just green status or empty analysis warning fields. A mismatch, failed run, source-ref discrepancy or unexpected alert identity stops the sequence. Save run URLs, analysis IDs, rule/result counts and alert instance ref/category/commit/state. Expected runner/action platform-deprecation notices are separate maintenance observations, not evidence of fingerprint compatibility.

Do not push `main`, modify the old validation branch, force-update refs, merge, tag, create a Release, or publish npm as part of this sequence. Real fork PR acceptance remains separate.
