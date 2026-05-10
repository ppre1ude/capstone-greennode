---
name: plan-eng-review
description: FoodLink engineering-manager plan review. Use after a CEO review or before implementation that changes architecture, API/data flow, state machines, tests, permissions, camera, FCM, or deployment risk. Inspired by gstack's plan-eng-review, adapted to FoodLink.
---

# Plan Eng Review

Run an engineering plan review before implementation. The goal is to turn a
product decision into a small, verifiable, low-risk vertical slice.

## Inputs

Read:

- `docs/AGENT_OPERATING_CONTRACT.md`
- the latest CEO/product plan, if present
- `docs/API_INTEGRATION_CONTRACT.md`
- `docs/VALIDATION_AND_BACKLOG.md`
- `docs/IMPLEMENTATION_STATUS.md`
- relevant source files and tests

## Required Output

1. Architecture boundary: what changes and what stays untouched.
2. Data flow diagram: happy path plus nil/empty/upstream-error shadow paths.
3. State machine: current states, transitions, rejected transitions.
4. Error and rescue map: exact failure, catcher, user-visible state, test.
5. Test matrix: unit, integration/API, emulator, real-device, and skipped with
   reason.
6. Security/privacy check: auth, token, image, location, FCM, and logging risks.
7. Rollout and rollback: how to verify, how to back out, docs to update.
8. Implementation slices: small ordered work units with acceptance criteria.

## FoodLink Gates

- API contract changes need either live VM/OpenAPI evidence or an explicit
  backend handoff note.
- Camera, permission, map, and FCM claims need Android runtime evidence.
- Passing Jest or TypeScript does not prove Android behavior.
- `requested` must stay request-received semantics unless product docs change.
- Any source-of-truth conflict must be called out and resolved against verified
  runtime behavior for the immediate fix.
