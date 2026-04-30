# AI Skills

This project includes agent skills from
[mattpocock/skills](https://github.com/mattpocock/skills), installed under
`.agents/skills`.

## Installed Source

The current upstream repository stores skills under the `skills/` directory.
Use this form when updating or reinstalling:

```bash
npx skills@latest add mattpocock/skills/skills --yes
```

Installing `mattpocock/skills/tdd` directly fails because the current upstream
path is `skills/tdd`.

## What Was Added

All 22 upstream skills were installed so local agents can use the same workflow
library across planning, TDD, QA, triage, architecture review, writing, and
tooling tasks.

The lockfile `skills-lock.json` records the source path and hash for each
installed skill.

## Recommended Greennode Usage

- Use `tdd` for feature work and bug fixes that need tests first.
- Use `triage-issue` or `diagnose` when investigating reported app behavior.
- Use `qa` before shipping mobile flows.
- Use `grill-me`, `to-prd`, `to-issues`, and `request-refactor-plan` before
  starting larger product changes.
- Use `domain-model` and `ubiquitous-language` to keep GreenNode concepts
  consistent across docs and code.
- Use `improve-codebase-architecture` for refactor discovery after reading
  `docs/` and current app structure.

## Safety Notes

Skills are instructions for coding agents and can lead an agent to run tools
with its normal permissions. Review a skill before using it for the first time.

The installer reported `migrate-to-shoehorn` as high risk. Treat it as
opt-in-only; it is for migrating tests to `@total-typescript/shoehorn` and is
not part of normal GreenNode mobile app work.
