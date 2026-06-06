# Backlog To-do Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close locally implementable unfinished backlog work and separate the remaining external verification blockers from app-code tasks.

**Architecture:** Treat `docs/VALIDATION_AND_BACKLOG.md` as the active backlog. Local implementation work is limited to app behavior that can be proven with Jest/TypeScript in this repository; VM, iOS simulator, backend redeploy, and AI model work remain verification blockers.

**Tech Stack:** React Native 0.85, Jest, TypeScript, existing design-system primitives.

---

### Task 1: Camera Permission Fallback

**Files:**
- Modify: `src/screens/camera/CameraScanScreen.tsx`
- Verify: `__tests__/cameraScan.fallback.test.tsx`
- Document: `docs/VALIDATION_AND_BACKLOG.md`

- [x] **Step 1: Run the existing regression test**

Run: `npm test -- --runInBand __tests__/cameraScan.fallback.test.tsx`
Expected: FAIL because the static scan fallback hides `권한 다시 요청` and `설정 열기`.

- [x] **Step 2: Restore permission-based branching**

Remove the force-static fallback so `!hasPermission` renders recovery actions, `device == null` renders gallery fallback, and the camera surface renders only when permission and device exist.

- [x] **Step 3: Re-run the focused test**

Run: `npm test -- --runInBand __tests__/cameraScan.fallback.test.tsx`
Expected: PASS, 6 tests.

### Task 2: Backlog Classification

**Files:**
- Modify: `docs/VALIDATION_AND_BACKLOG.md`

- [x] **Step 1: Mark the camera permission fallback to-do complete**

Record the focused Jest command as evidence.

- [x] **Step 2: Keep external verification blockers open**

Do not mark VM, iOS simulator, backend redeploy, AI model, or missing fixture evidence as complete without fresh runtime evidence.

### Task 3: Existing Dirty Changes Verification

**Files:**
- Inspect: `scripts/mock-api.js`
- Inspect: `src/design-system/components/Chip.tsx`
- Inspect: `src/screens/post/FridgeSelectScreen.styles.ts`
- Inspect: `src/utils/homeRecommendations.ts`
- Verify: targeted Jest suites and TypeScript.

- [x] **Step 1: Run focused tests covering touched surfaces**

Run: `npm test -- --runInBand __tests__/cameraScan.fallback.test.tsx __tests__/fridgeSelect.qrFlow.test.tsx __tests__/homeRecommendations.test.ts __tests__/posts.api.test.ts __tests__/designSystem.components.test.tsx`

- [x] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit`

- [x] **Step 3: Commit only coherent implementation units**

Commit the camera fallback fix and any verified backlog-adjacent changes as separate conventional commits.

### Task 4: Mock API Contract Smoke

**Files:**
- Modify: `scripts/mock-api.js`

- [x] **Step 1: Check script syntax**

Run: `node --check scripts/mock-api.js`

- [x] **Step 2: Run QR lifecycle smoke**

Run the mock server on an isolated port and verify `generate -> create pending_store -> confirm-store -> notifications`.
