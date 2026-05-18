# Montage Design System Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a React Native component layer inspired by Wanted Montage while preserving GreenNode's existing color palette.

**Architecture:** Keep `src/theme` as the source of color, type, spacing, and radius tokens. Add `src/design-system` for reusable primitives whose public APIs mirror Montage concepts: `variant`, `color`, `size`, `status`, `disabled`, `loading`, leading/trailing content, and selected state. Migrate one real product surface first, then expand screen-by-screen after the component contracts stabilize.

**Tech Stack:** React Native 0.85, React 19, TypeScript, Jest/react-test-renderer.

---

## Source Analysis

Montage Android (`wanteddev/montage-android`) is a Kotlin Compose design system. The relevant component API pattern is visible in `library/src/main/java/com/wanted/android/wanted/design/actions/button/WantedButton.kt`: public components expose simple semantic props, then resolve visual details through `WantedButtonDefaults`. Android also separates component contracts such as `ButtonVariant`, `ButtonType`, `ButtonSize`, and `WantedChipContract.ChipSize`.

Montage iOS (`wanteddev/montage-ios`) is a SwiftUI design system. The strongest portable pattern is the fluent component surface in files such as `Sources/Montage/1 Components/2 Actions/Button.swift`, `Sources/Montage/1 Components/3 Selection And Input/TextField.swift`, and `Sources/Montage/1 Components/4 Contents/ListCell.swift`: base components stay small, modifiers/props express state, and accessibility is handled inside the component.

For GreenNode, do not import native Montage packages directly. This project is React Native and already has domain-specific colors in `src/theme/colors.ts`; the migration should port component contracts and interaction states, not Wanted's palette.

## Branch Strategy

Create `codex/montage-design-system-migration` from `codex/operator-and-mvp-ux-polish` HEAD. This keeps the history as a stacked branch:

```text
main -> codex/operator-and-mvp-ux-polish -> codex/montage-design-system-migration
```

When publishing, target the design-system PR at `codex/operator-and-mvp-ux-polish`. After the UX polish branch lands, retarget or rebase this branch onto `main`.

---

### Task 1: Add Design System Primitives

**Files:**
- Create: `src/design-system/components/Text.tsx`
- Create: `src/design-system/components/Button.tsx`
- Create: `src/design-system/components/Chip.tsx`
- Create: `src/design-system/components/TextField.tsx`
- Create: `src/design-system/components/Card.tsx`
- Create: `src/design-system/components/ListCell.tsx`
- Create: `src/design-system/components/index.ts`
- Create: `src/design-system/index.ts`
- Create: `__tests__/designSystem.components.test.tsx`

- [x] **Step 1: Write component smoke tests**

Create tests that render the primitives and assert user-facing behavior: button label, loading state, disabled press blocking, chip selected accessibility state, text field status caption, card/list cell content.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- --runInBand __tests__/designSystem.components.test.tsx`
Expected: FAIL because `src/design-system` does not exist yet.

- [x] **Step 3: Implement primitives**

Implement components using existing `colors`, `spacing`, `radius`, `layout`, and `textStyles`. Use Montage-inspired prop names while keeping React Native conventions:

```tsx
<DSButton variant="solid" color="primary" size="large" loading disabled />
<DSChip variant="solid" size="medium" selected leading={<Icon />} />
<DSTextField label="이메일" status="error" caption="확인해주세요" />
<DSListCell title="위치 재설정" caption="현재 동네를 바꿉니다" chevron />
```

- [x] **Step 4: Run primitive tests**

Run: `npm test -- --runInBand __tests__/designSystem.components.test.tsx`
Expected: PASS.

### Task 2: Migrate NearbyPostCard To The New Layer

**Files:**
- Modify: `src/components/home/NearbyPostCard.tsx`
- Test: `__tests__/home.nearbyRefresh.test.tsx`
- Test: `__tests__/designSystem.components.test.tsx`

- [x] **Step 1: Replace local card/chip/text styling**

Use `DSCard`, `DSChip`, and `DSText` inside `NearbyPostCard` while preserving current layout and copy.

- [x] **Step 2: Keep behavior unchanged**

The component must still call `onPress`, resolve image URLs through `getImageUrl`, show the post status label, freshness label, relative time, display name, and fridge fallback.

- [x] **Step 3: Run affected tests**

Run: `npm test -- --runInBand __tests__/home.nearbyRefresh.test.tsx __tests__/designSystem.components.test.tsx`
Expected: PASS.

### Task 3: Document The Migration Contract

**Files:**
- Modify: `docs/DESIGN_SYSTEM.md`

- [x] **Step 1: Add a component layer section**

Document that Montage is used as a component API reference, not as the source palette. List the first primitives and their intended use.

- [x] **Step 2: Record rollout rule**

Document that future screen work should prefer `src/design-system` primitives before adding screen-local button, chip, text field, card, or list cell styles.

- [x] **Step 3: Run docs-safe checks**

Run: `npm test -- --runInBand __tests__/designSystem.components.test.tsx`
Expected: PASS.
