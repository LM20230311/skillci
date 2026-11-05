# SARIF schema test fixture

`sarif-schema-2.1.0.json` is an unmodified schema downloaded on 2026-11-05 from <https://json.schemastore.org/sarif-2.1.0.json>. Its `$id` identifies the OASIS SARIF schema. It is used for offline development tests, not bundled into the runtime Action.

Upstream: <https://github.com/oasis-tcs/sarif-spec>. The upstream repository's license terms are preserved in `OASIS-LICENSE.md`; the schema is not relicensed under SkillCI's MIT license.

## Fingerprint compatibility vectors

`fingerprints.v4.json` contains the nine fixed input/output vectors from [GitHub CodeQL Action's fingerprint tests](https://github.com/github/codeql-action/blob/33d7b85da1a04171e211befe2c739303b9a4c066/src/fingerprints.test.ts), checked 2026-11-05. Expected outputs are copied from that immutable upstream commit, not produced by SkillCI's implementation. They cover EOF, final newline, CR/LF/CRLF, whitespace, repeated hashes and following-line context. Attribution and the upstream MIT notice are preserved in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).

Another regression test uses `24b245e0e432c108:1`, the value independently calculated by the real upload Action in both lifecycle runs recorded in [SARIF_VALIDATION.md](../../docs/SARIF_VALIDATION.md). Local vector agreement does not replace a clean live upload and lifecycle acceptance.
