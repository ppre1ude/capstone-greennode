# 2026-05-23 Backend Handoff Contract Implementation Plan

## Scope

Backend handoff dated 2026-05-23 changed frontend-facing contracts for:

- Operator inventory summary/items/dispose
- `POST /posts/generate` root-level `rejectionReason` and `detections[]`
- FCM final QA logging/priority
- Server search Post-MVP boundary

This plan implements only code changes that are unblocked on the frontend. FCM final QA waits for backend VM redeploy. Server search remains local filtering until a backend endpoint is added.

## Task 1: Operator Inventory API Normalization

Files:

- `src/api/operator.ts`
- `src/screens/operator/FridgeOperatorConsoleScreen.tsx`
- `__tests__/operator.api.test.ts`
- `__tests__/fridgeOperatorConsole.screen.test.tsx`

Steps:

1. Add backend response types for:
   - summary: `fridgeId`, `fridgeName`, `total`, `available`, `requested`, `expired`, `disposedToday`
   - item/dispose: `Post`/`PostRead` camelCase shape with `id` and `status`
2. Normalize API responses into existing screen-friendly `OperatorInventorySummary` and `OperatorInventoryItem` shapes.
3. Keep compatibility with existing legacy frontend fixture shape so current tests and mock fallback paths remain stable.
4. Map backend `id` to internal `postId`, `detectedFruitKo` to display name, and `storageDeadlineAt ?? expirationDate ?? updatedAt` to display deadline.
5. Update dispose handling to accept backend `PostRead` response with `status: "disposed"`.
6. Update tests to assert new backend raw shape normalization.

## Task 2: Generate Result Schema Alignment

Files:

- `src/types/post.ts`
- `src/utils/postPolicy.ts`
- `scripts/validate-ai-fixtures.js`
- `__tests__/posts.api.test.ts`
- `__tests__/postPolicy.test.ts`
- Existing analysis/register UI tests if they fail after type changes

Steps:

1. Add root-level `rejectionReason?: string | null` to `GenerateResult`.
2. Ensure `AiDetection` supports the backend MVP fields:
   - `id`
   - `label`
   - `labelKo`
   - `freshnessLabel`
   - `confidenceScore`
   - `bbox`
3. Update generate API test fixture to include `rejectionReason: null` and one `detections[]` item.
4. Update policy code so root-level `rejectionReason` is canonical and blocks registration when non-null.
5. Keep nested `aiAnalysis.rejectionReason` as a compatibility fallback.
6. Update AI fixture validation script to read root-level `rejectionReason` before nested legacy fields.
7. Assert `generatePost()` preserves root-level `rejectionReason` and `detections[0]`.
8. Assert `postPolicy` blocks root-level rejection reasons, including review-like values returned through `rejectionReason`.

## Task 3: Verification

Run the narrow verification first:

```bash
npm test -- --runInBand __tests__/operator.api.test.ts __tests__/fridgeOperatorConsole.screen.test.tsx __tests__/posts.api.test.ts
```

Then run type checking:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

If the narrow tests expose shared type breakage, expand only to the affected test file.

## Out Of Scope

- No FCM code change until backend deploys Android high priority/per-token logs.
- No server search code change. MVP keeps home/map local filtering.
- No real multi-object split registration. MVP continues representative item registration.
- No QR lifecycle state machine changes until `pending_store`, confirm-store, confirm-pickup, and batch/status-event APIs are finalized.
