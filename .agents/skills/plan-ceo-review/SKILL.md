---
name: plan-ceo-review
description: FoodLink CEO/founder-mode plan review. Use when asked to review scope, ambition, MVP boundaries, feature priority, or whether the team should expand, hold, or reduce scope. Inspired by gstack's plan-ceo-review, adapted to FoodLink source-of-truth docs.
---

# Plan CEO Review

Run a founder-level plan review. Do not implement code during this skill unless
the user separately asks for a documentation update that records the review.

## Inputs

Read the relevant current context first:

- `docs/AGENT_OPERATING_CONTRACT.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/VALIDATION_AND_BACKLOG.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/API_INTEGRATION_CONTRACT.md` when API behavior is involved
- `docs/DOMAIN_MODEL.md` when terminology or state names are involved

## System Audit

Before making the review call, gather:

- Recent commits: `git log --oneline -30`
- Working tree: `git status --short --branch` and `git diff --stat`
- Stash state: `git stash list`
- Recently touched files: `git log --since='30 days ago' --name-only --format=''`
- Open TODO/FIXME/HACK/XXX markers, excluding `.git`, `node_modules`, Android
  build output, iOS build output, and generated caches

## Scope Mode

Choose and name one mode:

- `SCOPE_EXPANSION`: the current idea is under-ambitious and the user explicitly
  wants bigger options.
- `SELECTIVE_EXPANSION`: hold the baseline, then list optional expansions as
  separate decisions.
- `HOLD_SCOPE`: default for FoodLink while MVP evidence is incomplete.
- `SCOPE_REDUCTION`: strip work down to the smallest reliable demoable flow.

FoodLink default: use `HOLD_SCOPE` unless the user explicitly asks to expand.

## Review Sections

Produce these sections:

1. Verdict: answer the user's strategic question directly.
2. System Audit: branch, diff, stash, recent work pattern, source of truth.
3. Step 0 - Scope Call: mode and why.
4. Critical Gaps: priority, user impact, required evidence.
5. Scope To Hold: what must not be polished now.
6. What Already Exists: assets, code paths, tests, docs to reuse.
7. Failure Modes Registry: codepath/flow, failure, rescued, tested, user sees.
8. Opinionated Recommendations: concrete calls, not generic advice.
9. Next Vertical Slices: independently grabbable next work.
10. Review Status: whether eng/design/QA review is needed next.

## FoodLink Rules

- Actual runtime evidence recorded in `VALIDATION_AND_BACKLOG.md` beats summary
  claims in other docs.
- MVP means `available -> requested`, not pickup completion or reservation
  confirmation.
- Do not recommend chat, admin, QR/token pickup, metrics, social login, or full
  fridge inventory until the MVP flow is verified.
- Every recommendation must name the user-facing consequence.
- If the review changes scope or priority, update or propose an update to the
  relevant docs.
