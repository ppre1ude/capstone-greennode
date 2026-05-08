# FoodLink Superpowers Workflow

> Purpose: document how FoodLink refers to the Superpowers methodology and how
> agents should map it onto this repo's existing skills and source-of-truth
> documents.

## Upstream Reference

- Repository: https://github.com/obra/superpowers
- Reviewed on: 2026-05-08
- Current upstream plugin metadata reviewed: `.codex-plugin/plugin.json`
  version `5.1.0`
- Relevant upstream concepts: `brainstorming`, `writing-plans`,
  `test-driven-development`, `systematic-debugging`,
  `verification-before-completion`, `requesting-code-review`,
  `executing-plans`, `subagent-driven-development`,
  `using-git-worktrees`, and `finishing-a-development-branch`.

Superpowers is a broad agent workflow system. This repo does not vendor the
upstream plugin or replace FoodLink's existing `.agents/skills` with it. When a
user says "use Superpowers" in this project, treat it as shorthand for the
workflow routing below, then adapt it to FoodLink's source-of-truth documents.

## Installation Note

The upstream repository advertises a Codex App plugin, but the current Codex
tool search in this workspace did not expose a Superpowers installer. If the
user wants the actual plugin behavior, install it through the Codex App plugin
marketplace, then restart the session so the plugin-provided skills are loaded.

Until then, FoodLink uses this document as a project overlay and maps
Superpowers concepts onto installed local skills.

## FoodLink Meaning

`Superpowers` means:

1. Step back before implementation when scope or design is unclear.
2. Write or confirm a small plan before broad code changes.
3. Prefer red-green-refactor for risky logic.
4. Debug from a reproducible feedback loop and root cause, not guesses.
5. Verify with fresh evidence before claiming completion.
6. Use parallel agents only when the user explicitly authorizes subagents and
   the tasks are independent.
7. Finish by updating FoodLink status/validation docs when behavior changes.

## Routing

| Superpowers phrase | FoodLink workflow | Output |
| --- | --- | --- |
| "brainstorming" or unclear idea | `grill-me`, `office-hours` if available, product docs | Framed problem, narrowed MVP slice, open decisions |
| "writing plans" | `plan-eng-review`, `request-refactor-plan`, `to-issues` | Accepted plan, small slices, verification matrix |
| "test-driven-development" | `tdd` | One behavior at a time, red-green-refactor evidence |
| "systematic-debugging" | `diagnose` or `triage-issue` | Repro loop, hypotheses, root cause, regression check |
| "verification-before-completion" | Operating contract verify step | Fresh command/API/device evidence before completion claim |
| "requesting-code-review" | Review stance or `review` skill if available | Findings first, file/line references, residual risk |
| "executing-plans" | Targeted implementation | Checklist progress, tests, docs updated |
| "subagent-driven-development" | Codex subagents only if user explicitly asks | Independent delegated tasks with disjoint write scopes |
| "using-git-worktrees" | Optional branch/worktree workflow | Only after user asks for branch/worktree isolation |
| "finishing-a-development-branch" | Status update, tests, commit/PR if requested | Verification summary, commit message or PR notes |

## FoodLink Overrides

- User instructions and [AGENT_OPERATING_CONTRACT.md](./AGENT_OPERATING_CONTRACT.md)
  win over generic Superpowers rules.
- FoodLink MVP scope stays in
  [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) and
  [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md).
- Runtime evidence in [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)
  wins over summaries and upstream workflow expectations.
- Do not force TDD for tiny documentation edits or mechanical changes.
- Do not spawn subagents unless the user explicitly asks for subagents,
  delegation, or parallel agent work.
- Do not create git worktrees, branches, commits, pushes, or PRs unless the user
  asks for that level of git workflow.

## Usage Examples

- "Use Superpowers to plan this feature" means run a planning workflow before
  code, usually `plan-eng-review` after reading the relevant FoodLink docs.
- "Superpowers this bug" means use `diagnose`: build a feedback loop, reproduce,
  rank hypotheses, instrument, fix, and regression-test.
- "Use Superpowers TDD" means invoke `tdd` and work one behavior at a time.
- "Use Superpowers to finish this" means run fresh verification, update status
  docs if behavior changed, and provide a concise closeout. It does not imply
  commit/push unless requested.

## Updating This Overlay

Update this document when:

- the upstream Superpowers plugin is actually installed in Codex App;
- FoodLink adds or removes local skills that change the routing table;
- the user establishes a new shorthand phrase for Superpowers workflows;
- Superpowers upstream changes a concept FoodLink wants to adopt.
