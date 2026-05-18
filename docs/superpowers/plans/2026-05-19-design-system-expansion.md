# Design System Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Montage-inspired DS layer beyond the first home card by migrating repeated form/CTA/card patterns and adding a lightweight component catalog.

**Architecture:** Keep `src/theme` as the token source and use `src/design-system` primitives for repeated UI behavior. Do not rewrite whole screens; replace duplicated buttons, text fields, chips, and cards where the DS primitive already expresses the same contract.

**Tech Stack:** React Native 0.85, TypeScript, Jest, React Test Renderer.

---

### Task 1: Migrate Repeated Screen Controls To DS Primitives

**Files:**

- Modify: `src/screens/auth/LoginEmailScreen.tsx`
- Modify: `src/screens/auth/SignupScreen.tsx`
- Modify: `src/screens/auth/SignupScreen.styles.ts`
- Modify: `src/screens/location/LocationSetupScreen.tsx`
- Modify: `src/screens/location/LocationSetupScreen.styles.ts`
- Modify: `src/screens/post/PostCreateScreen.tsx`
- Modify: `src/screens/post/PostCreateScreen.styles.ts`
- Modify: `src/screens/post/PostDetailScreen.tsx`
- Modify: `src/screens/post/PostDetailScreen.styles.ts`
- Test: existing tests under `__tests__/locationSetup.notificationPermission.test.tsx`, `__tests__/postCreate.reviewNotice.test.tsx`, `__tests__/postDetail.requestShare.test.tsx`

- [x] Replace repeated submit CTAs with `DSButton`, preserving labels, disabled state, loading state, and `TouchableOpacity`-based tests.
- [x] Replace auth and post date `TextInput` wrappers with `DSTextField`, preserving validation messages, keyboard props, secure text entry, password toggles, and error captions.
- [x] Replace static status badges/cards where safe with `DSChip`/`DSCard`, without changing user-facing copy or product state logic.
- [x] Remove screen-local styles made obsolete by DS primitives.
- [x] Run targeted tests: `npm test -- --runInBand __tests__/locationSetup.notificationPermission.test.tsx __tests__/postCreate.reviewNotice.test.tsx __tests__/postDetail.requestShare.test.tsx`

### Task 2: Add A Lightweight DS Catalog

**Files:**

- Create: `src/design-system/catalog/DesignSystemCatalog.tsx`
- Create: `src/design-system/catalog/index.ts`
- Modify: `src/design-system/index.ts`
- Test: `__tests__/designSystem.catalog.test.tsx`

- [x] Add a standalone `DesignSystemCatalog` component that renders representative `DSButton`, `DSChip`, `DSTextField`, `DSCard`, `DSListCell`, and `DSText` states.
- [x] Keep it export-only and not wired into production navigation.
- [x] Add a render smoke test so the catalog stays type-safe and catches prop regressions.
- [x] Run targeted tests: `npm test -- --runInBand __tests__/designSystem.catalog.test.tsx __tests__/designSystem.components.test.tsx`

### Task 3: Document Icon And Migration Rules

**Files:**

- Modify: `docs/DESIGN_SYSTEM.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify: `docs/VALIDATION_AND_BACKLOG.md`
- Modify: `docs/superpowers/plans/2026-05-19-design-system-expansion.md`

- [x] Document DS icon rules: prefer the established icon library when wired, otherwise slot emoji/text icons remain local screen decoration; DS components own tint/spacing, callers own icon identity.
- [x] Document the catalog and the second migration slice.
- [x] Mark this plan's task checkboxes complete as work lands.

### Task 4: Verify And Commit

**Files:**

- All changed files.

- [x] Run `npx tsc --noEmit`.
- [x] Run `npm test -- --runInBand`.
- [x] Run `npm run lint`.
- [x] Attempt Android visual QA if an emulator/device is available; if not available, record that automated verification is the completed path for this turn.
- [x] Commit with a 3-5 line message.
