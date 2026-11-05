# SARIF and GitHub Code Scanning (unreleased)

[English](SARIF.md) · [简体中文](SARIF.zh-CN.md)

This feature is implemented in the source checkout for the next milestone, v0.6.0. The published v0.5.0 package and Action do not include it yet.

## Produce a report

Build the source checkout and run:

```bash
npm ci
npm run build
node dist/index.js audit examples/risky-skill --format sarif --source-root . --output skillci.sarif
```

The file is written before the risk gate exits 1 for high/critical findings. Invalid input or an invalid source root exits 2. Use `--no-fail` only for a deliberate report-only run. The output parent directory must already exist. SARIF paths are relative to `--source-root`, which defaults to the current working directory. For GitHub, use the checkout root, even when scanning a single file or a Skill subdirectory. Targets and resolved source files outside that root are rejected. Symlinks are resolved for locations; this path check is not an execution sandbox.

SARIF 2.1.0 includes all 12 stable rule descriptors, fixed risk explanations and remediation, error/warning/note levels, locations with line numbers, stable partial fingerprints, and `inSource`/`accepted` suppressions. A security pattern is a review signal, not a proven exploitable vulnerability; the tool does not invent CVSS scores. Fingerprints use the rule, relative URI, trimmed excerpt hash and duplicate ordinal, so unrelated lines inserted above a finding and a checkout at a different absolute directory preserve its identity. Editing the matched excerpt, renaming the file, or reordering identical occurrences can change identity. GitHub duplicate/closure behavior still needs live verification.

## Privacy and interpretation

SARIF omits original excerpts, dynamic policy values, full prompts, raw suppression reasons, absolute host paths, and command-line arguments. Messages and help come from fixed rule metadata. Inspect the indicated line locally for specific evidence and the reviewed reason. Content contributes only through a SHA-256 fingerprint; hashing is not encryption. Relative filenames remain project metadata and are not anonymized. Legacy Markdown, JSON, and annotation formats retain their existing context-rich behavior; this SARIF contract does not change them.

The official [schema snapshot](../examples/sarif/sarif-schema-2.1.0.json) is sourced from [SchemaStore](https://json.schemastore.org/sarif-2.1.0.json), identifying the OASIS schema in its `$id`. Tests validate active, empty, suppressed, and encoded-path reports using Ajv and ajv-formats as development dependencies. They are not runtime dependencies of the CLI or Action.

## Action integration

The source Action adds optional `sarif-output` and a `sarif-file` output. Existing `path`, `policy`, `base-policy`, annotations and `fail-on-risk` behavior remain. The SARIF root is `GITHUB_WORKSPACE`. Inputs are passed through environment variables and quoted argument arrays. The Action does not upload files automatically and still accepts one target path per invocation; use separate steps/jobs with distinct filenames and upload categories for multiple targets.

For a workflow running in this SkillCI source checkout after `npm ci` and `npm run build`:

```yaml
permissions:
  contents: read
  security-events: write

steps:
  # Checkout and build this SkillCI source checkout first.
  - id: audit
    uses: ./
    with:
      path: examples/risky-skill
      sarif-output: skillci.sarif
  - uses: actions/upload-artifact@v4
    if: ${{ always() && hashFiles('skillci.sarif') != '' }}
    with:
      name: skillci-report
      path: skillci.sarif
  - uses: github/codeql-action/upload-sarif@v4
    if: ${{ always() && github.event_name == 'push' && hashFiles('skillci.sarif') != '' }}
    with:
      sarif_file: skillci.sarif
      category: skillci
```

`always()` preserves upload after a risk-gate failure; no `continue-on-error` is needed to preserve the failed gate. A scan/configuration error may leave no report; the existence check prevents uploading an absent file. Use fresh report paths and a clean workspace to avoid uploading a stale file. [The integration workflow](../.github/workflows/sarif.yml) uses the intentionally risky fixture with `fail-on-risk: false` and category `skillci-example`; its alerts demonstrate the scanner, not a vulnerability in SkillCI itself.

Fork PRs in this example keep an artifact and do not attempt Code Scanning upload. Do not use `pull_request_target` to execute untrusted PR code with write credentials. Keep `contents: read` and scope `security-events: write` to the upload job. Public repositories can use Code Scanning; private/internal organizational repositories need the applicable GitHub plan and Code Security enabled. If upload is unavailable, retain a SARIF artifact and use the existing Markdown/JSON reports locally. Multiple analyses of the same commit need stable, distinct categories.

Official references, checked 2026-11-05: [SARIF support](https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/sarif-support), [upload workflow and access requirements](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/upload-sarif-file). Real upload, clickable locations, alert deduplication and resolution, and a fork PR must be recorded before marking the full v0.6.0 milestone accepted.
