# Design System Remaining Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the next practical slice of Montage-inspired design-system adoption across remaining high-traffic screens, excluding real-device QA.

**Architecture:** Keep `src/theme` as the color and typography token source, and continue migrating repeated controls to `src/design-system` primitives. Preserve screen behavior and navigation contracts while replacing duplicated button, card, text, chip, and field styling.

**Tech Stack:** React Native 0.85, TypeScript, Jest, React Test Renderer, Android adb/emulator only if locally available.

---

### Task 1: Auth, Onboarding, And Profile DS Adoption

**Files:**

- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/auth/OnboardingScreen.tsx`
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Test: existing auth/profile render and navigation tests, or the narrowest full Jest fallback if no targeted test exists.

- [x] Replace repeated login/onboarding/profile CTAs with `DSButton`, preserving labels, disabled/loading behavior, accessibility labels, and existing `onPress` behavior.
- [x] Replace repeated profile rows/cards with `DSCard`, `DSListCell`, and `DSChip` where the DS primitive expresses the same user-facing state.
- [x] Replace high-value headings, descriptions, helper text, and empty states with `DSText` while keeping the current visual hierarchy and copy.
- [x] Keep decorative brand/product illustration glyphs local if they are not action icons; use DS leading/trailing slots for button/list icons.
- [x] Run `npx tsc --noEmit` and the narrowest relevant Jest tests available after the change.

### Task 2: Post, Fridge, Camera, And Analysis DS Adoption

**Files:**

- Modify: `src/screens/post/PostCompleteScreen.tsx`
- Modify: `src/screens/post/FridgeSelectScreen.tsx`
- Modify: `src/screens/post/FridgeSelectScreen.styles.ts`
- Modify: `src/screens/camera/AnalysisResultScreen.tsx`
- Modify: `src/screens/camera/CameraScanScreen.tsx`
- Modify: `src/screens/camera/CameraScanScreen.styles.ts`
- Test: `__tests__/postComplete.navigation.test.tsx`, `__tests__/analysisResult.fallback.test.tsx`, `__tests__/cameraScan.fallback.test.tsx`, plus any impacted fridge test.

- [x] Replace repeated completion, retry, submit, permission, and fallback CTAs with `DSButton`.
- [x] Replace status badges, result summary blocks, and selectable fridge cards with `DSChip`, `DSCard`, or `DSListCell` where safe.
- [x] Replace high-value headings, captions, warnings, and empty-state copy with `DSText`.
- [x] Preserve photo capture, analysis fallback, fridge selection, and completion navigation behavior exactly.
- [x] Run `npm test -- --runInBand __tests__/postComplete.navigation.test.tsx __tests__/analysisResult.fallback.test.tsx __tests__/cameraScan.fallback.test.tsx` plus the narrowest impacted fridge test.

### Task 3: Map Screen And Icon Rule Application

**Files:**

- Modify: `src/screens/map/MapScreen.tsx`
- Modify: `src/screens/map/MapScreen.styles.ts`
- Modify: `src/design-system/catalog/DesignSystemCatalog.tsx`
- Modify: `docs/DESIGN_SYSTEM.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify: `docs/VALIDATION_AND_BACKLOG.md`
- Test: `__tests__/map.fridgePosts.test.tsx`, `__tests__/designSystem.catalog.test.tsx`

- [x] Replace repeated map search, retry, refresh, detail, and sheet actions with DS primitives where doing so does not alter map behavior.
- [x] Apply the documented icon rule in code by using DS `leading`/`trailing` slots for action icons and keeping purely illustrative glyphs out of shared primitives.
- [x] Extend the catalog to cover the icon slot and selected-list/card patterns used by the migrated screens.
- [x] Update core docs so they describe the current DS adoption state, remaining QA gap, and the no-real-device-QA constraint for this pass.
- [x] Run `npm test -- --runInBand __tests__/map.fridgePosts.test.tsx __tests__/designSystem.catalog.test.tsx`.

### Task 4: Verification, Screenshot Attempt, And Commit

**Files:**

- All changed files.

- [x] Run `npx tsc --noEmit`.
- [x] Run `npm test -- --runInBand`.
- [x] Run `npm run lint`.
- [x] Run `git diff --check`.
- [x] Check adb/emulator availability from the Android SDK path. If an emulator/device is available, capture app screenshots for the migrated flows. If not available, record the exact blocker and do not fabricate screenshots.
- [x] Commit all changes with a 3-5 line Korean commit message.
