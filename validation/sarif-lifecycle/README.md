# Isolated SARIF lifecycle validation

This fixture exists only on `validation/sarif-lifecycle-20261105`; it is not a product example or a release. Its instructions are scanned as text, never executed. The workflow explicitly uses `--no-fail` to upload a deliberately risky fixture.

Push and inspect each revision before pushing the next one:

1. **baseline**: one `SKILLCI001` finding at line 4.
2. **shifted**: insert two unrelated lines; one finding at line 6 with the same fingerprint. GitHub must reuse the original alert number on this branch/category.
3. **fixed**: replace the risky instruction; upload a valid report with zero results. The original alert's instance on this branch/category must become fixed.

Every upload uses category `skillci-lifecycle-20261105`, distinct from `main`'s `skillci-example`. Query analyses and alert instances using the full branch ref. Do not infer branch-specific resolution only from the default branch's alert list. Save the run URL, analysis ID, alert number and matching instance state for every revision.

Do not merge this validation branch into `main`, tag it, release it, or publish it to npm. These three pushes require the user's explicit approval of the exact commit/ref operations. This sequence does not verify fork PR permissions; that requires an independently controlled fork.
