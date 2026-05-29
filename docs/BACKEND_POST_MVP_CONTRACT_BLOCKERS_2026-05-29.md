# Backend Post-MVP Contract Handoff - 2026-05-29

> 목적: 백엔드가 이 문서만 보고 Post-MVP 계약 구현에 착수할 수 있게, 현재 live VM gap, 필요한 endpoint, request/response shape, 정책 결정, acceptance criteria를 한 곳에 정리한다.

## Current Runtime Evidence

- 환경: `localhost:8080 -> NHN Cloud VM:80` SSH tunnel, 2026-05-29.
- OpenAPI: `/openapi.json` 조회 성공.
- AI fixture: `npm run qa:ai-fixtures -- --report-only` 실행. 최신 report는 `temp/ai-fixtures-report-only-20260528T163234Z.txt`.
- 알림/지표/인증/search: OpenAPI path와 live VM endpoint를 함께 확인.

AI fixture 관찰값:

| Fixture | Current VM result | Required contract |
| --- | --- | --- |
| `fresh-single` | `Fresh`, `confidence=1`, reason 없음 | 정상 shareable |
| `stale-or-rotten` | `Fresh`, `confidence=0.79`, reason 없음 | `rejectionReason=stale` 또는 명시 review |
| `not-food` | 400 generic rejection | `error.rejectionReason=not_food` |
| `screenshot-or-ui` | `Fresh`, `confidence=1`, reason 없음 | `rejectionReason=screenshot/ui_screenshot` 또는 `reviewReason=screenshot/ui_screenshot` |
| `low-quality` | `Fresh`, `confidence=0.9794`, reason 없음 | `rejectionReason=low_quality` 또는 `reviewReason=low_quality` |
| `multi-object` | 400 generic rejection | 200 + `reviewReason=multi_object_review` + `detections[]` |

Endpoint 관찰값:

| Contract | Current VM result | Status |
| --- | --- | --- |
| `GET /api/v1/notifications` | 404, OpenAPI path 없음 | backend blocker |
| `PATCH /api/v1/notifications/{id}/read` | OpenAPI path 없음 | backend blocker |
| `PATCH /api/v1/notifications/read-all` | OpenAPI path 없음 | backend blocker |
| `DELETE /api/v1/notifications/{id}` | OpenAPI path 없음 | backend blocker |
| `GET /api/v1/users/me/impact/summary` | 404, OpenAPI path 없음 | backend/product blocker |
| `GET /api/v1/posts/nearby?q=...` | OpenAPI parameter 없음 | backend blocker |
| `GET /api/v1/fridges/nearby?q=...` | OpenAPI parameter 없음 | backend blocker |
| `POST /api/v1/auth/email-verifications` | OpenAPI path 없음 | backend/auth blocker |
| `POST /api/v1/auth/social/google` | OpenAPI path 없음 | backend/auth blocker |
| `POST /api/v1/auth/social/apple` | OpenAPI path 없음 | backend/auth blocker |

## Backend Response Received

2026-05-29 백엔드 상세 회신은 [BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md](./BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md)에 프론트 관점으로 검토했다. 이 handoff 문서는 프론트가 요청한 목표 계약을 보존하되, 실제 다음 액션은 백엔드 회신의 구현 가능 범위를 기준으로 조정한다.

핵심 해석:

- AI는 응답 shape 개선만 즉시 가능하다. `not_food`, `screenshot`, `ui_screenshot`, `low_quality`의 실제 판별은 현재 ResNet-50 단일 분류 모델로 불가능하다.
- Multi-object는 현재 object detection 모델이 없어 실제 `detections.length >= 2` acceptance를 닫을 수 없다.
- Notifications와 server search는 백엔드가 구현 완료로 회신했으나, live VM/OpenAPI 재검증 전까지는 reported implemented 상태로 둔다.
- Impact는 회신 내부에서 "구현 완료"와 "완전 미구현/개발 계획" 표현이 상충하므로 live VM 확인 전까지 확정하지 않는다.
- Email verification과 social login은 MVP/Post-MVP immediate scope에서 제외하고 Phase 4 auth expansion으로 분리한다.

## Implementation Priority

1. Live VM/OpenAPI 재확인: 백엔드가 구현 완료로 회신한 notifications, server search와 상태가 상충하는 impact summary부터 확인한다.
2. AI response shape: 현재 모델 한계 내에서 generic 400 제거와 `rejectionReason`/`reviewReason` 필드 추가를 검증한다.
3. Server-backed notifications: 프론트 sync/read/delete fallback 경로가 이미 준비되어 있으므로 endpoint가 확인되면 앱 알림함 동기화를 검증한다.
4. Impact summary: live shape와 산정 버전이 확인된 뒤 `추정 절감` UI 연결 여부를 결정한다.
5. Server search: `q` parameter가 OpenAPI/live VM에 반영되면 홈/지도 로컬 필터 fallback을 유지한 채 이관한다.
6. AI model upgrade와 multi-object detection: fixture full strict 통과와 실제 `detections.length >= 2`는 Phase 4 모델 고도화 항목이다.
7. Email verification, social login, WebSocket chat: 이번 구현 후보에서 제외한다.

## 1. AI Rejection/Review Reason

### Endpoint

```text
POST /api/v1/posts/generate
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Required semantics

- Hard block은 400 응답으로 내려준다.
- Hard block은 `imageToken`을 발급하지 않는다.
- Hard block reason은 `error.rejectionReason`에 둔다.
- Soft review는 200 응답으로 내려준다.
- Soft review는 기존 generate payload를 유지하고 `data.reviewReason`을 추가한다.
- Soft review는 `imageToken`을 발급한다.
- `rejectionReason`과 `reviewReason`을 동시에 내려주지 않는다.

### Enum

Hard block enum:

| Enum | Meaning |
| --- | --- |
| `stale` | 나눔 기준 미충족 또는 부패/상함 |
| `not_food` | 식재료가 아님 |
| `low_quality` | 판별 불가능한 저품질 이미지라 등록 차단 |
| `screenshot` | 실제 식재료 사진이 아닌 일반 스크린샷 |
| `ui_screenshot` | 앱/지도/런처 등 UI 캡처 |

Soft review enum:

| Enum | Meaning |
| --- | --- |
| `review_required` | 상태 또는 식재료 판별 재확인 필요 |
| `low_confidence` | confidence가 제품 기준보다 낮음 |
| `low_quality` | 등록은 허용하지만 사진 품질 재확인 필요 |
| `screenshot` | 등록은 허용하지만 실제 사진 여부 재확인 필요 |
| `ui_screenshot` | 등록은 허용하지만 UI 캡처 의심 |
| `multi_object_review` | 여러 식재료 후보가 감지됨 |

### Hard block response

```json
{
  "success": false,
  "message": "식재료 사진으로 확인되지 않았어요.",
  "data": null,
  "error": {
    "code": "AI_REJECTED",
    "rejectionReason": "not_food"
  }
}
```

### Soft review response

```json
{
  "success": true,
  "message": "AI 분석이 완료되었습니다.",
  "data": {
    "detectedFruit": "banana",
    "detectedFruitKo": "바나나",
    "imageToken": "generated-image-token",
    "rejectionReason": null,
    "reviewReason": "low_quality",
    "aiAnalysis": {
      "isFresh": true,
      "category": "Fresh",
      "confidenceScore": 0.72,
      "detectedFruit": "banana",
      "detectedFruitKo": "바나나",
      "reviewReason": "low_quality"
    },
    "detections": []
  }
}
```

### Acceptance criteria

백엔드 회신 반영: 아래 기준은 목표 계약이다. 현재 모델에서는 `not_food`, `screenshot/ui_screenshot`, `low_quality`의 실제 판별을 acceptance gate로 닫지 않고, 우선 응답 shape와 generic 400 제거를 검증한다.

- `fresh-single`: 200, `Fresh` or `Mid`, `imageToken` 있음, reason 없음.
- `stale-or-rotten`: 400 + `error.rejectionReason=stale`, 또는 200 + 명시 `reviewReason`.
- `not-food`: 400 + `error.rejectionReason=not_food`.
- `screenshot-or-ui`: 400 + `rejectionReason=screenshot/ui_screenshot`, 또는 200 + `reviewReason=screenshot/ui_screenshot`.
- `low-quality`: 400 + `rejectionReason=low_quality`, 또는 200 + `reviewReason=low_quality`.
- reason 없는 generic 400은 contract failure로 본다.

QA command:

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures
```

## 2. Multi-Object Representative Selection

### Required semantics

- 여러 객체가 감지되어도 다음 increment에서는 `POST /posts`가 나눔 식재료 1개만 만든다.
- 자동 객체별 분리 등록은 하지 않는다.
- generate 200 payload에 `reviewReason=multi_object_review`와 실제 `detections[]`를 내려준다.
- 앱은 사용자가 대표 후보 1개를 선택하고 `POST /posts`에 `selectedDetectionId`만 optional로 보낸다.
- 앱은 `bbox`를 create payload에 보내지 않는다.

### Generate response shape

```json
{
  "success": true,
  "message": "AI 분석이 완료되었습니다.",
  "data": {
    "detectedFruit": "banana",
    "detectedFruitKo": "바나나",
    "imageToken": "generated-image-token",
    "rejectionReason": null,
    "reviewReason": "multi_object_review",
    "detections": [
      {
        "id": "detection-1",
        "label": "banana",
        "labelKo": "바나나",
        "freshnessLabel": "Fresh",
        "confidenceScore": 0.91,
        "bbox": {"x": 0.12, "y": 0.18, "width": 0.31, "height": 0.42}
      },
      {
        "id": "detection-2",
        "label": "apple",
        "labelKo": "사과",
        "freshnessLabel": "Fresh",
        "confidenceScore": 0.88,
        "bbox": {"x": 0.51, "y": 0.2, "width": 0.24, "height": 0.36}
      }
    ]
  }
}
```

`bbox`는 이미지 기준 0~1 normalized rectangle이다. 기존 호환을 위해 `bbox: null`은 허용하지만, 실제 multi-object acceptance에서는 normalized bbox가 있어야 한다.

### Create request extension

```text
POST /api/v1/posts
Content-Type: application/x-www-form-urlencoded
```

`data` JSON:

```json
{
  "fridgeId": 1,
  "expirationDate": "2026-06-01",
  "imageToken": "generated-image-token",
  "selectedDetectionId": "detection-2"
}
```

### Acceptance criteria

백엔드 회신 반영: 현재 AI 서버는 object detection 모델이 아니므로 아래 기준은 Phase 4 모델 고도화 이후 목표다. 이번 즉시 범위에서는 프론트가 `detections[]`와 `selectedDetectionId`를 방어적으로 처리하는지만 유지한다.

- `multi-object` fixture는 200 + `reviewReason=multi_object_review` + `detections.length >= 2`.
- 각 detection은 stable `id`를 가진다.
- normalized `bbox`는 `x`, `y`, `width`, `height`가 모두 0~1 범위다.
- `POST /posts`가 `selectedDetectionId`를 받으면 해당 detection을 대표 객체로 저장한다.
- unknown 또는 missing `selectedDetectionId`는 400을 반환하거나 서버 기본 대표 객체를 사용한다. 둘 중 하나를 OpenAPI에 명시한다.

## 3. Server-Backed Notifications

### Required endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/notifications?unreadOnly=false&skip=0&limit=50` | 계정 알림 목록 |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | 단일 읽음 처리 |
| `PATCH` | `/api/v1/notifications/read-all` | 전체 읽음 처리 |
| `DELETE` | `/api/v1/notifications/{notificationId}` | 단일 삭제 |

### Notification record shape

```json
{
  "id": "notification-1",
  "type": "share_requested",
  "postId": 42,
  "requestId": 7,
  "fruitName": "바나나",
  "fridgeName": "광주역 공유냉장고",
  "title": "나눔 신청이 도착했어요",
  "body": "바나나 나눔에 신청이 접수되었습니다.",
  "createdAt": "2026-05-29T00:00:00Z",
  "receivedAt": "2026-05-29T00:00:00Z",
  "readAt": null
}
```

### Required semantics

- 앱은 `type + postId + requestId` event key로 로컬 FCM 기록과 서버 record를 dedupe한다.
- 같은 이벤트가 로컬/서버에 모두 있으면 서버 record가 우선한다.
- `GET /notifications`는 최신순으로 반환한다.
- `PATCH /notifications/{id}/read`는 읽음 처리된 record 또는 `null`을 반환할 수 있다.
- `PATCH /notifications/read-all`은 `ApiResponse<null>`이면 충분하다.
- `DELETE /notifications/{id}`는 soft delete 또는 사용자별 숨김 처리여야 한다.

### Acceptance criteria

- endpoint 4개가 OpenAPI에 노출된다.
- 로그인 사용자 본인의 알림만 조회/수정/삭제된다.
- 다른 사용자의 notification id는 403 또는 404다.
- 프론트 fallback sync가 404 없이 동작한다.

## 4. Impact And Carbon Metrics

### Endpoint

```text
GET /api/v1/users/me/impact/summary?period=month
Authorization: Bearer {token}
```

### Response shape

```json
{
  "success": true,
  "message": "환경 지표를 조회했습니다.",
  "data": {
    "completedShares": 8,
    "estimatedFoodSavedGrams": 2400,
    "estimatedCarbonSavedGrams": 6200,
    "calculationVersion": "impact-v1",
    "computedAt": "2026-05-29T00:00:00Z"
  }
}
```

### Policy needed

- 집계 대상은 `completed` 또는 실제 수령 확인된 나눔 식재료만 포함한다.
- `available`, `requested`, `pending_store`, `expired`, `disposed`, `cancelled`는 절감 지표에서 제외한다.
- `estimatedWeightGrams` source를 정한다. 예: category default, user input, backend table.
- `categoryCarbonFactor` source를 정한다.
- `calculationVersion`을 응답에 포함한다.
- 앱 문구는 실제 확정값이 아니라 `추정 절감`으로 표시한다.

### Acceptance criteria

- endpoint가 OpenAPI에 노출된다.
- 빈 사용자도 200 + zero summary를 받는다.
- `calculationVersion`과 `computedAt`이 항상 포함된다.

## 5. Server Search

### Endpoint extension

```text
GET /api/v1/posts/nearby?latitude=...&longitude=...&radius_km=2&q=바나나&skip=0&limit=20
GET /api/v1/fridges/nearby?latitude=...&longitude=...&radius_km=2&q=광주역&skip=0&limit=20
```

### Required semantics

- `q`는 optional이다.
- `q`가 없으면 기존 동작과 동일하다.
- posts search 대상: `detectedFruitKo`, `detectedFruit`, fridge name.
- fridges search 대상: fridge name, address.
- 정렬은 거리 우선, 같은 거리권에서는 최신순 또는 기존 정렬 유지. 실제 규칙을 OpenAPI/문서에 명시한다.
- posts는 `available` discovery만 대상으로 한다.

### Acceptance criteria

- OpenAPI에 `q`, `skip`, `limit` parameter가 명시된다.
- 기존 query에서 `q`가 없어도 backward compatible하다.
- 앱의 기존 로컬 필터 fallback과 결과 shape가 충돌하지 않는다.

## 6. Email Verification

### Required endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/email-verifications` | 인증 메일 발송 |
| `POST` | `/api/v1/auth/email-verifications/confirm` | 토큰 확인 |
| `GET` | `/api/v1/auth/me` | `emailVerifiedAt` 반환 |

### Request/response guideline

Send:

```json
{
  "email": "user@example.com"
}
```

Confirm:

```json
{
  "token": "verification-token"
}
```

`/auth/me` addition:

```json
{
  "emailVerifiedAt": "2026-05-29T00:00:00Z"
}
```

### Policy needed

- browsing과 위치 등록은 verification 전에도 허용할 수 있다.
- 나눔 식재료 등록, 나눔 신청, 운영자 action을 verification 이후로 제한할지 결정한다.
- social login provider가 verified email을 보장하면 `emailVerifiedAt`을 즉시 채울 수 있다.

## 7. Social Login

프론트가 Google/Apple native SDK로 provider token을 얻더라도, 백엔드가 FoodLink JWT로 교환해주는 endpoint가 없으면 실제 앱 로그인은 닫을 수 없다. 기존 앱 세션은 `accessToken` 저장 후 `/auth/me` 조회로 복원되므로, social login도 기존 `LoginResponse`와 같은 응답을 반환해야 한다.

### Required endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/social/google` | Google ID token 검증 후 FoodLink JWT 발급 |
| `POST` | `/api/v1/auth/social/apple` | Apple identity token/authorization code 검증 후 FoodLink JWT 발급 |

### Request guideline

```json
{
  "idToken": "provider-issued-id-token",
  "authorizationCode": "apple-code-if-needed",
  "nonce": "nonce-if-used"
}
```

### Response guideline

```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "accessToken": "foodlink-jwt",
    "tokenType": "bearer"
  }
}
```

### Backend data model / policy needed

- provider 계정 식별자는 이메일이 아니라 provider stable subject(`sub`) 기준으로 저장한다.
- 같은 사용자가 여러 provider를 연결할 수 있게 하려면 별도 social account table을 권장한다.
- 기존 email/password 계정과 같은 이메일이 들어왔을 때 자동 병합할지, 명시 연결을 요구할지 결정한다.
- Google/Apple이 verified email을 보장하면 `emailVerifiedAt`을 즉시 채울 수 있다.
- Apple private relay email을 일반 이메일과 어떻게 표시/병합할지 결정한다.
- `/auth/me`에 `emailVerifiedAt`과 `authProviders` 또는 `linkedProviders`를 노출할지 결정한다. 계정 연결 UI를 만들지 않는다면 앱 진입에는 필수는 아니지만, 이메일 verification 정책과 충돌을 줄이는 데 유용하다.

### Error contract

| Status | Case |
| --- | --- |
| 400 | provider token missing/invalid request |
| 401 | provider token verification failed |
| 409 | account merge/link conflict |
| 500 | provider verification infrastructure failure |

### Acceptance criteria

- Google ID token으로 FoodLink JWT 발급.
- Apple identity token 또는 authorization code로 FoodLink JWT 발급.
- 발급된 FoodLink JWT로 `/api/v1/auth/me` 조회 성공.
- 신규 social user는 email/nickname/location nullability가 기존 signup user와 호환된다.
- 기존 email user와 같은 이메일 케이스의 정책이 200/409 중 하나로 명확히 고정된다.

## 8. WebSocket Chat

이번 backend handoff의 구현 대상이 아니다.

- 알림 저장소와 lifecycle action이 안정화된 뒤 검토한다.
- 필요하면 WebSocket보다 구조화된 문의/요청 메시지 endpoint를 먼저 검토한다.

## Frontend State

- Multi-object 대표 후보 선택 UI와 `selectedDetectionId` 전송 경로는 준비됨.
- 서버 알림 sync/read/read-all/delete best-effort 호출 경로는 준비됨.
- AI fixture strict gate는 reason 없는 generic 400을 실패로 판정하도록 준비됨.
- Notifications, impact summary, server search는 백엔드 재배포 후 OpenAPI/live VM 확인이 끝나야 프론트 연결 완료로 볼 수 있음.
- Email verification과 social login은 이번 immediate scope에서 제외하고 Phase 4 auth expansion으로 분리됨.

## Backend Definition Of Done

- 구현 대상으로 회신한 endpoint와 parameter가 `/openapi.json`에 노출됨.
- 이 문서와 백엔드 회신의 response shape가 실제 live VM 응답과 일치함.
- AI는 현재 모델에서 판별 가능한 범위에 한해 reason 없는 generic 400을 제거하고 `error.rejectionReason` 또는 `data.reviewReason`을 내려줌.
- `npm run qa:ai-fixtures` full strict 통과는 AI 모델 고도화 이후 gate로 둠. 모델 고도화 전에는 report-only로 정확도 gap을 기록하고, shape 계약만 별도로 검증함.
- notifications endpoint 4개가 로그인 사용자 기준으로 200/403/404 또는 404 masking 권한 규칙을 통과함.
- impact summary는 빈 사용자 200 + zero summary, `calculationVersion`, `computedAt`을 포함함.
- server search는 `q` 없는 기존 호출과 backward compatible하고, `q` 전달 시 OpenAPI와 동일한 검색 대상/정렬을 적용함.
- email verification과 social login endpoint는 이번 DoD에서 제외함. Phase 4 auth expansion에서 별도 DoD를 작성함.
- 구현 완료 후 변경된 endpoint/field/policy를 프론트에 공유.
