# FoodLink GStack Workflow

> Purpose: document the gstack-inspired planning and review workflow used for
> FoodLink agent work.

## Upstream Reference

- Repository: https://github.com/garrytan/gstack
- Reviewed on: 2026-05-07
- Relevant upstream concepts: `office-hours`, `plan-ceo-review`,
  `plan-eng-review`, `qa`, `review`, `ship`, and the sprint order
  Think -> Plan -> Build -> Review -> Test -> Ship -> Reflect.

This repo does not vendor the upstream gstack implementation. FoodLink keeps a
small project-specific overlay under `.agents/skills` so review output follows
our source-of-truth documents and MVP validation rules.

## FoodLink Routing

| User intent | FoodLink workflow | Output |
| --- | --- | --- |
| New product idea or unclear user pain | `office-hours` | Product framing and narrow wedge |
| Scope, ambition, or MVP boundary question | `plan-ceo-review` | CEO review plan, scope call, critical gaps |
| Architecture, data flow, API, tests, or failure modes | `plan-eng-review` | Engineering review, diagrams, test matrix |
| Reported bug or unclear failure | `diagnose` or `triage-issue` | Repro, root cause, fix plan or issue |
| Mobile runtime behavior | `qa` plus Android QA workflow | Steps, evidence, screenshots/log summaries |
| Implementation with policy risk | `tdd` | Red-green-refactor with regression coverage |

## Default MVP Policy

FoodLink is currently in `HOLD_SCOPE` unless the user explicitly asks for a
scope expansion. The current job is to make the MVP flow reliable with real API,
device, permission, camera, AI, and notification evidence.

MVP flow:

```text
Supplier: capture/select ingredient -> AI analysis -> shareable result
  -> choose fridge -> create share item -> nearby users notified

Requester: discover nearby available item -> open detail -> request share
  -> available becomes requested -> supplier receives request notification
```

`requested` means request received, not reservation confirmed. Supplier approval,
pickup confirmation, cancellation, expiration, admin approval, inventory
management, chat, QR/token pickup checks, and real impact metrics are not MVP
until the verified flow above is clean.

## Review Rules

- Actual runtime evidence wins over product or implementation summaries.
- A feature is not "done" unless the relevant evidence is recorded in
  `docs/VALIDATION_AND_BACKLOG.md` or a specialist QA document.
- New feature polish is allowed only when it removes confusion or failure in the
  MVP flow. Otherwise, record it as deferred scope.
- Every review must name the user-visible failure, the source-of-truth conflict,
  the required evidence, and the next independently grabbable slice.
- `plan-ceo-review` may recommend scope reduction. It should not silently add
  features to the current sprint.

## Current Review Chain

1. Run `plan-ceo-review` when the question is whether the team is building the
   right thing or should hold/expand/reduce scope.
2. Run `plan-eng-review` before broad implementation after CEO review changes a
   data flow, API contract, state machine, or QA gate.
3. Implement only the accepted vertical slice.
4. Run targeted tests and the required runtime QA.
5. Update `VALIDATION_AND_BACKLOG.md` and `IMPLEMENTATION_STATUS.md` when the
   verified state changes.
