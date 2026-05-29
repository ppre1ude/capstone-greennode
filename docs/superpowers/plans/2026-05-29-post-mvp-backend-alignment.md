# Post-MVP Backend Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Post-MVP backend response follow-up from documented contracts into safe frontend behavior and repeatable live VM verification.

**Architecture:** Keep runtime behavior defensive: screens may call newly reported backend query contracts, but they must retain local fallback when the VM has not been redeployed or OpenAPI is stale. Verification stays in a read-only script unless explicit mutate flags are used elsewhere.

**Tech Stack:** React Native, React Navigation, Axios API clients, Jest/react-test-renderer, Node.js backend contract scripts.

---

### Task 1: Server Search Screen Wiring

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`
- Modify: `src/screens/map/MapScreen.tsx`
- Test: `__tests__/home.nearbyRefresh.test.tsx`
- Test: `__tests__/map.fridgePosts.test.tsx`

- [x] Home search input sends trimmed non-empty query to `getNearbyPosts(latitude, longitude, radius, skip, limit, q)`.
- [x] Home keeps loaded unfiltered feed for blank search and falls back to local filtering if the server query fails.
- [x] Map search input sends trimmed non-empty query to `getNearbyFridges(latitude, longitude, radius, q, skip, limit)`.
- [x] Map keeps loaded unfiltered fridge list for blank search and falls back to local filtering if the server query fails.
- [x] Focused tests cover server query calls and fallback behavior.

### Task 2: Post-MVP Read-Only Contract Harness

**Files:**
- Create: `scripts/validate-post-mvp-backend-contracts.js`
- Modify: `package.json`
- Test: `__tests__/postMvpBackendContracts.script.test.js`

- [x] Add a read-only script that checks `/openapi.json` for notifications, impact summary, and discovery `q` parameters.
- [x] When `FOODLINK_ACCESS_TOKEN` is present, probe notifications list, impact summary, posts search, and fridges search without mutating data.
- [x] Write a timestamped JSON report under `temp/`.
- [x] Exit non-zero only on failed required checks; skipped authenticated probes must be explicit when token is missing.
- [x] Add Jest tests for OpenAPI parsing, missing-token skip, and response shape validation helpers.

### Task 3: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/VALIDATION_AND_BACKLOG.md`
- Modify: `docs/BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md`

- [x] Document the new search behavior and read-only contract command.
- [x] Keep impact UI marked as blocked pending live response shape.
- [x] Run focused tests, full Jest, typecheck, lint, and `git diff --check`.

### Follow-up: Impact Response Compatibility

**Files:**
- Modify: `src/api/impact.ts`
- Modify: `src/types/impact.ts`
- Modify: `scripts/validate-post-mvp-backend-contracts.js`
- Test: `__tests__/impact.api.test.ts`
- Test: `__tests__/postMvpBackendContracts.script.test.js`

- [x] Normalize camelCase/snake_case impact summary fields into the app camelCase type.
- [x] Keep impact totals optional while preserving zero summary response support.
- [x] Check the impact `period` query parameter in the read-only OpenAPI harness.
- [x] Keep numeric impact UI blocked until live VM final shape is verified.
