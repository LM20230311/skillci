# Discovery validation — 2026-11-04

This is an engineering check of the unreleased discovery implementation, not a public security benchmark or an external adoption claim. No sample Skill, install script, or repository test was executed. Only a filename inventory and Git metadata were inspected.

| Repository | Fixed commit | Skill files | Instruction files | Diagnostics |
| --- | --- | --- | --- | --- |
| [openai/skills](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431) | `49f948faa9258a0c61caceaf225e179651397431` | 44 | 0 | 0 |
| [anthropics/skills](https://github.com/anthropics/skills/tree/ca45fc496a3436251f191354091d557da31c15b5) | `ca45fc496a3436251f191354091d557da31c15b5` | 20 | 0 | 0 |
| [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/7e408815ddcb64889a3683799a85399331cfd4ef) | `7e408815ddcb64889a3683799a85399331cfd4ef` | 475 | 10 | 0 |

For each repository, the exact set of discovered Skill paths matched an independent `git ls-files` inventory filtered by the `SKILL.md` basename: zero missing paths and zero extra paths for that naming criterion. This does not measure detection of malicious content, valid frontmatter, or host runtime compatibility.

The ten instruction candidates in Awesome Copilot were reviewed as paths: root `AGENTS.md`, `.github/copilot-instructions.md`, five AGENTS files under `skills/foundry-agentic-loop/evals/fixtures/`, `skills/repo-standardizer/templates/AGENTS.md`, its sibling `CLAUDE.md`, and `skills/setup-my-iq/assets/templates/AGENTS.md`. Several are fixture/template files. Discovery deliberately includes those candidates; they are not claimed to be active project configuration. The two other snapshots had no matching instruction filenames.

Skills outside a recognized installed host directory are reported as portable candidates with empty host labels, including OpenAI and Anthropic's `skills/` catalogs. The repository owner does not determine the host label; the path convention does.

The [manifest](../examples/discovery/public-samples.json) records URLs, commits, counts, and license pointers. No external source files are copied into this repository. Each source's own license terms apply if you download or reuse it.

To reproduce, obtain clean local checkouts at the fixed commits under a common directory named `openai-skills`, `anthropic-skills`, and `awesome-copilot`, build SkillCI, and run:

```bash
node examples/discovery/verify-public-samples.mjs /path/to/local-clones
```

The script performs read-only Git metadata and discovery operations, checks exact commits and clean worktrees, compares every Skill path, and verifies the recorded instruction count. It does not fetch repositories or execute their code. Review instruction-path lists separately if changing the samples or conventions.

Release acceptance remains open: a person who did not implement discovery must try the documented first-use flow and record whether it takes less than five minutes, with any friction. Remote CI and publication are also pending; no new release is implied by these local checks.
