# Trust Feedback Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수령 QR 인증 완료 건에만 태그 기반 평가와 운영자 처리용 신고를 열고, 나눔 상세와 프로필에 공급자 신뢰 뱃지를 노출한다.

**Architecture:** 평가는 `ShareRequest` 1건에 귀속하고, 데모 앱은 Zustand 로컬 상태로 제출 결과를 즉시 반영한다. 백엔드에는 같은 모델을 실제 저장/API 계약으로 요청하는 문서를 추가한다.

**Tech Stack:** React Native, TypeScript, React Navigation, Zustand, Jest, React Test Renderer.

---

### Task 1: Trust Policy And Local Store

**Files:**
- Create: `src/features/trust/feedback.ts`
- Create: `src/store/trustFeedbackStore.ts`
- Test: `__tests__/trustFeedback.policy.test.ts`

- [x] **Step 1: Write the failing test**

```typescript
import {
  canLeaveShareFeedback,
  getProviderTrustBadges,
} from '@/features/trust/feedback';

it('allows feedback only after request and post are completed', () => {
  expect(
    canLeaveShareFeedback({
      request: { status: 'completed' },
      post: { status: 'completed' },
    }),
  ).toBe(true);
  expect(
    canLeaveShareFeedback({
      request: { status: 'requested' },
      post: { status: 'requested' },
    }),
  ).toBe(false);
});

it('summarizes completed pickup and positive feedback as trust badges', () => {
  expect(
    getProviderTrustBadges({
      completedShares: 12,
      positiveReviewCount: 9,
      openReportCount: 0,
    }).map(badge => badge.label),
  ).toEqual([
    'QR 보관 인증',
    '수령 완료 12회',
    '좋은 평가 9회',
    '최근 신고 검토 없음',
  ]);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/trustFeedback.policy.test.ts`

Expected: FAIL because `@/features/trust/feedback` does not exist.

- [x] **Step 3: Write minimal implementation**

Create feedback tag constants, `canLeaveShareFeedback`, `getProviderTrustBadges`, and a Zustand store keyed by `requestId`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/trustFeedback.policy.test.ts`

Expected: PASS.

### Task 2: Completed Received Shares CTA

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/screens/profile/MySharesScreen.tsx`
- Test: `__tests__/myShares.screen.test.tsx`

- [x] **Step 1: Write the failing test**

Add a completed received share fixture and assert that `평가하기` navigates to `ShareFeedback` with `requestId`, `postId`, `providerId`, `fruitName`, and `fridgeName`.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/myShares.screen.test.tsx`

Expected: FAIL because `ShareFeedback` navigation is not wired.

- [x] **Step 3: Write minimal implementation**

Add `ShareFeedback` route params and render `평가하기`/`신고하기` only when `canLeaveShareFeedback(item)` is true.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/myShares.screen.test.tsx`

Expected: PASS.

### Task 3: Share Feedback Screen

**Files:**
- Create: `src/screens/trust/ShareFeedbackScreen.tsx`
- Modify: `src/navigation/AppNavigator.tsx`
- Test: `__tests__/shareFeedback.screen.test.tsx`

- [x] **Step 1: Write the failing test**

Render the screen, select `상태가 좋아요`, submit, and assert the store records a review for the `requestId`. Switch to 신고 mode, select `이미 없거나 찾을 수 없었어요`, submit, and assert the store records a report.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/shareFeedback.screen.test.tsx`

Expected: FAIL because the screen does not exist.

- [x] **Step 3: Write minimal implementation**

Implement two modes: review and report. Review uses positive and issue tags; report uses report reasons and a separate CTA.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/shareFeedback.screen.test.tsx`

Expected: PASS.

### Task 4: Trust Badges On Detail And Profile

**Files:**
- Modify: `src/screens/post/PostDetailScreen.tsx`
- Modify: `src/screens/post/PostDetailScreen.styles.ts`
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Test: `__tests__/postDetail.requestShare.test.tsx`
- Test: `__tests__/profile.operatorConsole.test.tsx`

- [x] **Step 1: Write failing tests**

Assert post detail renders `공급자 신뢰` and trust badges. Assert profile replaces the old `신선도 온도` copy with `공급자 신뢰`.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- --runInBand __tests__/postDetail.requestShare.test.tsx __tests__/profile.operatorConsole.test.tsx`

Expected: FAIL because the trust badge UI is absent or old profile copy remains.

- [x] **Step 3: Write minimal implementation**

Use `getProviderTrustBadges` and `useTrustFeedbackStore` summaries. Keep badges as DSChip/tag UI, no image assets.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- --runInBand __tests__/postDetail.requestShare.test.tsx __tests__/profile.operatorConsole.test.tsx`

Expected: PASS.

### Task 5: Backend Contract Request And Verification

**Files:**
- Create: `docs/BACKEND_TRUST_FEEDBACK_CONTRACT_REQUEST_2026-06-04.md`
- Modify: `docs/FINAL_PRESENTATION_PLANNING_2026-06-03.md`

- [x] **Step 1: Document API request**

Define `POST /share-requests/{requestId}/review`, `POST /share-requests/{requestId}/report`, and `GET /users/{userId}/trust-summary`.

- [x] **Step 2: Run focused verification**

Run:

```bash
npm test -- --runInBand __tests__/trustFeedback.policy.test.ts __tests__/shareFeedback.screen.test.tsx __tests__/myShares.screen.test.tsx __tests__/postDetail.requestShare.test.tsx __tests__/profile.operatorConsole.test.tsx
node ./node_modules/typescript/bin/tsc --noEmit
git diff --check
```

Expected: all pass.
