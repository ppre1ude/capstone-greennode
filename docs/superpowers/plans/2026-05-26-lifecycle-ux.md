# Lifecycle UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FoodLink usable after 신청/등록 by adding account-level lifecycle lists, current-action surfaces, notification sync hooks, and requested-state actions.

**Architecture:** Add thin API clients for the backend contract, keep screen state local, and use the existing feed refresh store to invalidate Home/Map after lifecycle mutations. New management UI lives behind Profile entries and Home's current-action hub.

**Tech Stack:** React Native, React Navigation, Zustand, Axios API client, Jest/react-test-renderer.

---

### Task 1: Lifecycle API And Types

**Files:**
- Modify: `src/types/post.ts`
- Modify: `src/types/notification.ts`
- Modify: `src/types/index.ts`
- Modify: `src/api/posts.ts`
- Create: `src/api/notifications.ts`
- Modify: `src/api/auth.ts`
- Test: `__tests__/posts.api.test.ts`
- Test: `__tests__/notifications.api.test.ts`

- [x] Add user post/share-request response types.
- [x] Add `/users/me/posts`, `/users/me/share-requests`, lifecycle mutation clients.
- [x] Add notification list/read clients.
- [x] Normalize operator metadata from both camelCase and snake_case `/auth/me` responses.

### Task 2: User Share Management UI

**Files:**
- Create: `src/screens/profile/MySharesScreen.tsx`
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Test: `__tests__/myShares.screen.test.tsx`
- Test: `__tests__/profile.operatorConsole.test.tsx`

- [x] Add a root stack screen for `MyShares`.
- [x] Route Profile's `내 나눔 내역` and `받은 나눔 내역` entries to the screen.
- [x] Render posted/received tabs with loading, error, empty, and item states.
- [x] Expose contextual actions: detail, store QR, pickup QR, cancel post/request, complete, expire.

### Task 3: Home Current-Action Hub

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`
- Test: `__tests__/home.nearbyRefresh.test.tsx`

- [x] Fetch my posts/share requests on focus.
- [x] Prioritize current actions: pickup QR, store QR, requested share status, recently completed fallback.
- [x] Keep existing route/store refresh behavior.

### Task 4: Notification Server Sync

**Files:**
- Modify: `src/store/notificationStore.ts`
- Modify: `src/screens/chat/ChatListScreen.tsx`
- Test: `__tests__/notificationStore.test.ts`
- Test: `__tests__/chatList.notifications.test.tsx`

- [x] Add sync/merge store method.
- [x] Fetch server notifications on focus and merge with local FCM records.
- [x] Call read/read-all endpoints while preserving local fallback.

### Task 5: Verification

**Files:**
- Modify focused tests as needed.

- [x] Run focused tests for new API/UI behavior.
- [x] Run `npm test -- --runInBand`.
- [x] Run `npx tsc --noEmit`.
- [x] Run `npm run lint`.
