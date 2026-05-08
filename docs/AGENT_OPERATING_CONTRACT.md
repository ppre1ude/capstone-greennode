# FoodLink Agent Operating Contract

> Purpose: define how Codex and other coding agents must plan, implement,
> verify, and document FoodLink work.
>
> This is not a catalog of installed skills. It is the operating contract agents
> must follow before changing code or project docs.

## Core Rules

- MUST treat this document as the first stop for agent-driven work.
- MUST report source-of-truth conflicts instead of silently choosing one side.
  The result must say which documents or code paths conflicted, which authority
  was used, and whether follow-up documentation was updated.
- MUST update the relevant status, validation, or contract document when an
  implementation changes verified behavior.
- MUST keep work scoped to the smallest coherent task that can be verified.
- MUST use domain terms from [DOMAIN_MODEL.md](./DOMAIN_MODEL.md). Do not invent
  alternate names for established FoodLink concepts.
- SHOULD use installed skills by workflow need, not by habit. Small mechanical
  edits do not need a full planning pipeline.

## Source Of Truth

| Authority | Canonical document | Use when |
| --- | --- | --- |
| Agent workflow | [AGENT_OPERATING_CONTRACT.md](./AGENT_OPERATING_CONTRACT.md) | Choosing how Codex should approach a task |
| GStack-style workflow | [GSTACK_WORKFLOW.md](./GSTACK_WORKFLOW.md) | Choosing CEO/eng review routing and MVP hold-scope policy |
| Superpowers-style workflow | [SUPERPOWERS_WORKFLOW.md](./SUPERPOWERS_WORKFLOW.md) | Translating "use Superpowers" into FoodLink skill routing |
| Domain language | [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) | Naming concepts, resolving ambiguity, changing model language |
| Product scope | [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) | Deciding whether a behavior belongs in the MVP or later |
| API/server contract | [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md) | Interpreting server responses, request shapes, auth, tunnel setup |
| Validation and backlog | [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md) | Recording QA evidence, known bugs, next sprint candidates |
| Implementation status | [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Summarizing current shipped/partial/mock/blocked state |
| AI/camera QA detail | [AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md) | Running fixture, false-positive, or real-device camera checks |
| UI system | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Changing visual tokens, components, spacing, typography, icons |

If a source-of-truth document disagrees with code, actual verified runtime
behavior wins for the immediate fix, and the stale document must be updated or
called out as stale.

## Operating Flow

### 1. Orient

- MUST read the canonical docs that match the task before making changes.
- MUST inspect existing code paths before proposing new abstractions.
- SHOULD identify whether the task is a bug, feature, policy decision, QA run,
  documentation update, or refactor.

### 2. Decide

- MUST settle product scope, domain language, and API assumptions before coding.
- MUST ask or document a decision when the work depends on unresolved policy.
- SHOULD prefer the narrowest MVP behavior that can be verified with real data.

### 3. Implement

- MUST keep implementation changes aligned with existing React Native, Zustand,
  Axios, navigation, and test patterns.
- SHOULD use `tdd` for risky logic, policy guards, and regression-prone bugs.
- SHOULD use `diagnose` or `triage-issue` when the task starts from a failure or
  unclear runtime behavior.

### 4. Verify

- MUST run the smallest meaningful verification for the changed behavior.
- MUST distinguish automated tests, emulator QA, real-device QA, and API/server
  checks. Do not imply one proves another.
- SHOULD use Android QA only when the behavior requires runtime, permission,
  camera, map, push, or device evidence.

### 5. Document

- MUST update documentation when behavior, contracts, scope, or status changed.
- MUST include evidence, environment, actual result, and follow-up when updating
  validation documents.
- SHOULD avoid turning docs into prose dumps. Prefer decisions, evidence logs,
  acceptance criteria, and update triggers.

### 6. Backlog

- MUST convert unresolved risks into backlog items or explicit follow-ups.
- MUST separate implementation work from policy decisions and verification-only
  tasks.
- SHOULD keep backlog items independently grabbable by future Codex sessions.

## Workflow Routing

| Task type | Required docs | Preferred workflow | Required output |
| --- | --- | --- | --- |
| Small text or style fix | Relevant file only | Direct edit | Brief summary and any skipped verification |
| "Use Superpowers" shorthand | `SUPERPOWERS_WORKFLOW.md`, relevant source-of-truth docs | Routed FoodLink equivalent | Plan/debug/TDD/verify output matched to the requested intent |
| Domain term or concept change | `DOMAIN_MODEL.md` | `domain-model`, `ubiquitous-language` | Updated terms, relationships, ambiguity notes |
| Product scope change | `PRODUCT_BRIEF.md`, `VALIDATION_AND_BACKLOG.md` | `grill-me`, `to-prd`, `to-issues` | Decision, rationale, backlog impact |
| Scope, ambition, or MVP boundary review | `PRODUCT_BRIEF.md`, `VALIDATION_AND_BACKLOG.md`, `IMPLEMENTATION_STATUS.md` | `plan-ceo-review` | Scope mode, critical gaps, held scope, next slices |
| Architecture or implementation plan review | Product/domain/API docs as applicable | `plan-eng-review` | Data flow, state machine, failure map, test matrix |
| API integration change | `API_INTEGRATION_CONTRACT.md`, relevant code | `tdd`, `diagnose` | Contract update, tests or API evidence |
| Bug or failing behavior | `VALIDATION_AND_BACKLOG.md`, `IMPLEMENTATION_STATUS.md` | `diagnose`, `triage-issue`, `tdd` | Repro, root cause, fix, regression check |
| Mobile runtime QA | `VALIDATION_AND_BACKLOG.md`, relevant specialist doc | `qa`, Android QA workflow | Environment, steps, actual result, evidence |
| Feature implementation | Product/domain/API docs as applicable | `tdd`, targeted implementation | Tests, docs updated, remaining risk |
| Release/status update | `IMPLEMENTATION_STATUS.md`, validation docs | `document-release`, `retro` if applicable | Status changes and verification commands |

## Document Responsibilities

| Document | Authority | Read before | Update when | Required evidence |
| --- | --- | --- | --- | --- |
| `DOMAIN_MODEL.md` | FoodLink language and relationships | Naming a model, screen, API concept, status, or policy | A new concept appears or an ambiguity is resolved | Canonical term, avoid list, relationship, example if useful |
| `PRODUCT_BRIEF.md` | Vision, MVP boundaries, user flow | Changing product behavior or priority | MVP scope, user flow, or deferred feature status changes | Decision reason and affected flow |
| `API_INTEGRATION_CONTRACT.md` | Frontend/server contract | Touching API calls, types, auth, image URLs, FCM, SSH tunnel | Actual server contract or app interpretation changes | Endpoint, request/response, verified behavior or OpenAPI basis |
| `VALIDATION_AND_BACKLOG.md` | QA results and next work | Fixing bugs, validating flows, planning next sprint | Validation result, backlog priority, acceptance criteria changes | Environment, reproduction, actual/expected result, next action |
| `IMPLEMENTATION_STATUS.md` | Current implementation state | Reporting done/partial/mock/blocked status | A feature state changes | Verification command or runtime evidence |
| `AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md` | AI/camera evidence detail | Running AI fixture or real-device camera checks | Fixture set, false-positive policy, or camera evidence changes | Fixture id, device/API environment, screenshots/logs summary |
| `DESIGN_SYSTEM.md` | UI tokens and component guidance | Changing shared UI style | Token/component/icon behavior changes | Affected token or component and expected usage |

## Installed Skills

Skills are installed under `.agents/skills` and recorded in `skills-lock.json`.
Use them when their workflow fits the task. Do not rewrite project decisions just
because a generic skill template expects a conventional file name.

Useful FoodLink mappings:

- `tdd`: policy guards, API mapping, regression-prone behavior.
- `diagnose`: runtime failures, emulator/device issues, unclear bugs.
- `qa`: mobile flow checks that need steps and evidence.
- `triage-issue`: root-cause investigation that should become an issue.
- `domain-model` and `ubiquitous-language`: domain terms and ambiguity cleanup.
- `grill-me`: product/plan pressure testing before broad changes.
- `plan-ceo-review`: gstack-style scope and strategy review. Default FoodLink
  mode is `HOLD_SCOPE` until MVP evidence is clean.
- `plan-eng-review`: gstack-style architecture, data flow, failure mode, and
  test planning before broad implementation.
- `to-issues`: converting validated backlog into issue-sized work.
- `improve-codebase-architecture`: refactor discovery after current docs and
  code are understood.

## Superpowers Shorthand

When the user says "Superpowers" or names a Superpowers upstream workflow, read
[SUPERPOWERS_WORKFLOW.md](./SUPERPOWERS_WORKFLOW.md) and route to the closest
FoodLink-installed skill. This is a project shorthand, not proof that the
upstream Superpowers plugin is installed in the current Codex session.

## Safety

- MUST avoid destructive git or filesystem operations unless explicitly asked.
- MUST preserve user changes in the working tree.
- MUST call out unverified runtime claims. Passing TypeScript or Jest is not the
  same as Android device verification.
- SHOULD leave vendor skill files alone unless the task is explicitly about
  changing installed skills.
