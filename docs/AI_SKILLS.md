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

## Prompt Patterns That Work Well

Name the skill explicitly when the task has a clear workflow. This keeps the
agent from treating every request as a generic coding task.

```text
tdd skill로 authorId/userId 계약 불일치 버그를 테스트 먼저 잡고 고쳐줘.
```

```text
diagnose skill로 에뮬레이터 카메라 셔터 실패를 재현부터 최소화해서 원인을 찾아줘.
```

```text
qa skill로 Android 에뮬레이터 기준 MVP 핵심 플로우 QA 세션을 진행해줘.
```

```text
to-issues skill로 docs/MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md의 P0/P1 백로그를 GitHub issue 단위로 쪼개줘.
```

```text
domain-model skill로 FoodLink 문서의 용어(default_location, freshness, 냉장고, 게시글 상태)를 정리해줘.
```

Good usage pattern:

1. First ask for validation or diagnosis.
2. Convert findings into a small backlog or issue list.
3. Pick one P0/P1 item.
4. Use `tdd` for the implementation.
5. Run Android QA only for flows that need device/runtime evidence.

## Safety Notes

Skills are instructions for coding agents and can lead an agent to run tools
with its normal permissions. Review a skill before using it for the first time.

The installer reported `migrate-to-shoehorn` as high risk. Treat it as
opt-in-only; it is for migrating tests to `@total-typescript/shoehorn` and is
not part of normal GreenNode mobile app work.
