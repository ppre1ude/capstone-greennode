# FoodLink Post-MVP Product And Contract Decisions

> 기준일: 2026-05-29
>
> 목적: MVP 이후 제품/계약 미결 항목을 구현 가능한 backend/frontend contract 단위로 고정한다.
>
> 범위: 이 문서는 제품/계약 결정이다. 실제 endpoint 구현 여부와 runtime QA 상태는 [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)를 따른다.

## Scope Call

판정: `HOLD_SCOPE`.

2026-05-06 기준의 과거 MVP 검증 범위였던 농산물 등록과 신청 접수는 Android 기준으로 닫혔다. 이후 QR 보관/수령 인증은 별도 나눔 flow가 아니라 같은 나눔 생명주기의 검증 레이어로 채택했다. 다만 iOS 기본 동작 점검 증거와 실제 운영자 계정 기반 진입 재검증은 아직 남아 있다. 따라서 Post-MVP 기능을 한 번에 확장하지 않고, 다음 구현이 가능한 계약 단위만 확정한다. 우선순위는 사용자 나눔 생명주기 신뢰도에 직접 닿는 항목을 먼저 둔다.

우선순위:

1. 백엔드가 구현 완료로 회신한 notifications/server search와 상태가 상충한 impact summary의 live VM 재검증
2. AI rejection/review response shape 계약
3. 서버 저장형 알림 목록/읽음 동기화
4. 환경 성취 지표 계산식/API
5. 서버 검색
6. Multi-object 대표 객체 선택 정책과 모델 고도화 분리
7. 운영자 role 관리 정책
8. Email verification/social login Phase 4 분리
9. WebSocket 채팅 제외

## Backend Response Update

2026-05-29 백엔드 상세 회신 검토 결과는 [BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md](./BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md)를 따른다.

- AI는 현재 모델에서 응답 구조만 맞출 수 있다. 비식재료, 스크린샷, 저품질 이미지의 실제 판별은 AI 모델 재학습/추가 모델 없이는 불가능하다.
- Multi-object는 현재 object detection 모델이 없어 실제 다중 후보와 normalized `bbox`를 만들 수 없다.
- Notifications와 server search는 백엔드가 구현 완료로 회신했지만, live VM/OpenAPI에 재노출되기 전까지는 검증 완료로 보지 않는다.
- Impact는 백엔드 회신 내부에서 구현 상태가 상충하므로 live VM response를 기준으로 확정한다.
- Email verification과 social login은 이번 즉시 구현 범위에서 제외하고 Phase 4 auth expansion으로 묶는다.

## Decision 1: AI Rejection And Review Reason

결정: `rejectionReason`과 `reviewReason`을 분리한다.

- `rejectionReason`: 등록을 막는 hard block이다. 서버는 `imageToken`을 발급하지 않는다.
- `reviewReason`: 등록은 허용하지만 사용자가 상태를 다시 확인해야 하는 soft review다.
- 앱은 기존처럼 `rejectionReason`이 있으면 등록을 막고, `reviewReason` 또는 낮은 `confidenceScore`는 `확인 필요`로 표시한다.

Hard block enum:

| Enum | 의미 | HTTP | Image token |
| --- | --- | --- | --- |
| `stale` | 나눔 기준 미충족 | 400 | 없음 |
| `not_food` | 식재료가 아님 | 400 | 없음 |
| `low_quality` | 판별 불가 수준의 사진 품질 | 400 | 없음 |
| `screenshot` | 실제 식재료 사진이 아닌 일반 스크린샷 | 400 | 없음 |
| `ui_screenshot` | 앱/웹 UI 캡처 | 400 | 없음 |

Soft review enum:

| Enum | 의미 | HTTP | Image token |
| --- | --- | --- | --- |
| `review_required` | 상태 또는 식재료 식별 재확인 필요 | 200 | 있음 |
| `multi_object_review` | 여러 식재료 후보가 감지됨 | 200 | 있음 |
| `low_confidence` | confidence가 제품 기준 미만 | 200 | 있음 |
| `low_quality` | 등록은 허용하지만 사진 품질 재확인 필요 | 200 | 있음 |
| `screenshot` | 실제 식재료 사진 여부 재확인 필요 | 200 | 있음 |
| `ui_screenshot` | UI 캡처 의심 | 200 | 있음 |

Backend response guideline:

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

Review success response는 기존 `POST /posts/generate` 정상 payload에 `reviewReason`을 추가한다.

백엔드 회신 기준 현재 AI 모델은 `not_food`, `screenshot`, `ui_screenshot`, `low_quality`를 실제로 판별하지 못한다. 따라서 `npm run qa:ai-fixtures` full strict 통과는 모델 고도화 이후 gate로 두고, 당장은 reason 없는 generic 400 제거와 응답 shape만 검증한다.

## Decision 2: Multi-Object UX

결정: 다음 Post-MVP increment에서도 기본 등록 단위는 대표 객체 1개다. 자동 객체별 분리 등록은 보류한다.

이유:

- 한 장 사진에서 여러 식재료를 자동 분리하면 수량, 보관 구역, 권장 수령일, 라벨 코드, 폐기/수령 lifecycle이 객체별로 갈라진다.
- 현재 도메인 모델의 사용자-facing 단위는 계속 **나눔 식재료** 하나다.
- 사용자가 급하게 처리하려는 상황에서는 자동 분리보다 대표 객체 선택과 빠른 등록이 더 안전하다.

Product behavior:

- `detections.length === 1`: 기존 흐름 유지.
- `detections.length > 1`: 후보 목록을 보여주고 대표 식재료 1개로 등록된다고 안내한다.
- 사용자는 대표 후보를 바꿀 수 있다.
- 분리 등록은 `추가 등록` 후속 action으로만 제공한다. 한 번의 submit이 여러 `POST /posts`를 만들지 않는다.

Post-MVP contract:

```json
{
  "detectedFruit": "banana",
  "detectedFruitKo": "바나나",
  "reviewReason": "multi_object_review",
  "selectedDetectionId": "detection-1",
  "detections": [
    {
      "id": "detection-1",
      "label": "banana",
      "labelKo": "바나나",
      "freshnessLabel": "Fresh",
      "confidenceScore": 0.91,
      "bbox": {"x": 0.12, "y": 0.18, "width": 0.31, "height": 0.42}
    }
  ]
}
```

`bbox`는 이미지 기준 0~1 normalized rectangle이다. MVP 호환을 위해 `bbox: null`은 계속 허용한다.

백엔드 회신 기준 현재 모델은 단일 이미지 분류만 가능하므로 실제 `detections.length > 1`과 non-null `bbox`는 Phase 4 object detection 모델 도입 이후 acceptance다. 프론트의 대표 후보 UI와 `selectedDetectionId` 전송은 방어 준비 상태로 유지한다.

## Decision 3: Server-Backed Notifications

결정: 서버 알림 저장소를 Post-MVP source of truth로 채택한다. 로컬 FCM 기록은 offline/foreground fallback cache로 유지한다.

Endpoint contract:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/notifications?unreadOnly=false&skip=0&limit=50` | 계정 알림 목록 |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | 단일 읽음 처리 |
| `PATCH` | `/api/v1/notifications/read-all` | 전체 읽음 처리 |
| `DELETE` | `/api/v1/notifications/{notificationId}` | 단일 삭제 |

Notification record:

```json
{
  "id": 1,
  "type": "share_requested",
  "postId": 42,
  "requestId": 7,
  "fruitName": "바나나",
  "fridgeName": "광주역 공유냉장고",
  "title": "나눔 신청이 도착했어요",
  "body": "바나나 나눔에 신청이 접수되었습니다.",
  "createdAt": "2026-05-29T00:00:00Z",
  "readAt": null
}
```

Merge rule:

- 앱은 server record를 우선한다.
- 같은 `type + postId + requestId` event key의 로컬 FCM 기록은 server record로 dedupe한다.
- 서버가 없거나 네트워크 실패면 로컬 FCM 기록만 보여준다.
- WebSocket은 알림 저장소가 안정화될 때까지 도입하지 않는다.
- 백엔드가 구현 완료로 회신했으므로 다음 검증은 live VM/OpenAPI에서 4 endpoint, 본인 소유 검증, soft delete를 확인하는 것이다.

## Decision 4: Impact And Carbon Metrics

결정: 환경 성취 지표는 backend-computed estimate로만 노출한다. 클라이언트 mock 숫자는 다시 넣지 않는다.

계산 범위:

- `completed` 또는 `picked_up`으로 확인된 나눔 식재료만 집계한다.
- `available`, `requested`, `pending_store`는 아직 실제 절감으로 계산하지 않는다.
- 폐기(`disposed`)와 만료(`expired`)는 절감 지표에 포함하지 않는다.

API contract:

```text
GET /api/v1/users/me/impact/summary?period=month
Authorization: Bearer {token}
```

```json
{
  "totalShared": 5,
  "totalReceived": 3,
  "completedShares": 8,
  "estimatedFoodSavedGrams": 1360,
  "estimatedCarbonSavedGrams": 3400,
  "calculationVersion": "impact-v1",
  "computedAt": "2026-05-29T00:00:00Z"
}
```

Formula contract:

```text
estimatedFoodSavedGrams = sum(share.estimatedWeightGrams)
estimatedCarbonSavedGrams = sum(share.estimatedWeightGrams * categoryCarbonFactor)
```

`estimatedWeightGrams`와 `categoryCarbonFactor`는 서버 설정 테이블로 관리한다. 출처가 확정되기 전까지 UI 문구는 `추정 절감`으로만 표시한다.

백엔드 회신은 impact 상태를 "구현 완료"와 "완전 미구현/개발 계획"으로 동시에 서술하므로, 앱 연결 전 live VM에서 endpoint 존재와 최종 shape를 확인한다.

## Decision 5: Server Search

결정: 글로벌 검색 endpoint를 새로 만들지 않고 기존 discovery endpoint를 확장한다.

Contract:

```text
GET /api/v1/posts/nearby?latitude=...&longitude=...&radius_km=2&q=바나나&skip=0&limit=20
GET /api/v1/fridges/nearby?latitude=...&longitude=...&radius_km=2&q=광주역&skip=0&limit=20
```

Rules:

- 나눔 식재료 검색은 `available` discovery만 대상으로 한다.
- 검색 대상은 `detectedFruitKo`, `detectedFruit`, 공유 냉장고명, 공유 냉장고 주소다.
- 홈/지도 로컬 필터는 server search 출시 전 fallback으로 유지한다.
- 정렬은 거리 우선, 같은 거리권에서는 최신순이다.
- 백엔드가 `q` 구현 완료로 회신했으므로 OpenAPI parameter와 live response 확인 후 이관한다.

## Decision 6: Auth Expansion

결정: email verification과 social login은 이번 immediate Post-MVP 구현에서 제외하고 Phase 4 auth expansion으로 묶는다.

Email verification 후보 contract:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/email-verifications` | 인증 메일 발송 |
| `POST` | `/api/v1/auth/email-verifications/confirm` | 토큰 확인 |
| `GET` | `/api/v1/auth/me` | `emailVerifiedAt` 반환 |

Policy:

- browsing과 위치 등록은 verification 전에도 허용한다.
- 나눔 식재료 등록, 나눔 신청, 운영자 action은 verification 이후로 제한할 수 있다.
- 프론트에서 인증 상태 UI가 필요하면 `/auth/me`에 `emailVerifiedAt: null`을 방어적으로 처리한다.
- social login은 Google/Apple만 후속 후보로 둔다. provider가 verified email을 보장하면 `emailVerifiedAt`을 즉시 채울 수 있다.
- social login 버튼은 백엔드 provider token 교환 endpoint가 준비될 때까지 숨기거나 비활성 상태로 둔다.

## Decision 7: Operator Role Management UI

결정: 소비자 앱 안에서 role 부여/변경 UI를 만들지 않는다.

Scope:

- 앱은 `/auth/me`의 `isOperator`, `operatorRole`, `operatorFridgeIds`로 운영자 콘솔 진입만 제어한다.
- role grant/revoke는 백엔드 seed, admin CLI, 또는 별도 web backoffice에서 처리한다.
- 모바일 앱에는 본인 권한 정보와 접근 불가 안내만 둔다.

후속 admin contract 후보:

```text
GET /api/v1/admin/operator-roles?email=...
POST /api/v1/admin/operator-roles
DELETE /api/v1/admin/operator-roles/{roleId}
```

이 contract는 consumer app 범위가 아니라 backend/admin scope다.

## Decision 8: WebSocket Chat

결정: WebSocket 채팅은 다음 구현 후보에서 제외한다.

이유:

- 현재 사용자 문제는 실시간 대화보다 신청, 임시 선점, 수령, 취소, 만료 상태를 정확히 보여주는 것이다.
- 채팅은 moderation, 개인정보, 노쇼 대응, 신고 정책을 동시에 요구한다.
- 알림 저장소와 lifecycle action이 안정화되기 전에는 제품 신뢰도를 오히려 낮출 수 있다.

후속 커뮤니케이션이 필요하면 WebSocket보다 구조화된 문의/요청 메시지를 먼저 검토한다.

## Next Implementation Slices

1. 백엔드 재배포 후 OpenAPI/live VM에서 notifications, impact, server search 노출 여부 확인.
2. Server notification endpoint 확인 후 앱 알림함 sync/read/delete live VM 검증. 프론트 fallback sync 경로는 준비됨.
3. Nearby/fridge server search `q` parameter 확인 후 로컬 필터 fallback 유지 상태에서 이관.
4. Impact summary 최종 shape 확인 후 `추정 절감` UI 연결 여부 결정.
5. AI response shape 구현 후 reason 없는 generic 400 제거 검증. fixture full strict는 모델 고도화 후로 분리.
6. Multi-object 실제 detection, normalized `bbox`, `selectedDetectionId` 서버 수용은 Phase 4 object detection 모델 도입 뒤 검증.
7. Admin-only operator role 관리 surface 분리.
