# Backend Contract Request: Frontend Feature Todo

> 기준일: 2026-05-25
> 목적: 프론트에서 처리 가능한 UX 보강은 진행했고, 실제 데이터 기능으로 연결하려면 필요한 백엔드 계약을 한 문서로 전달한다.

## 이번 프론트 반영

- 알림함은 로컬 저장소 기준 `모두 읽음`을 지원한다. 서버 읽음 API가 없어 기기 로컬 `readAt`만 갱신한다.
- 프로필의 `내 나눔 내역`, `관심 식재료`, `받은 나눔 내역`, `프로필 수정`은 generic placeholder 대신 어떤 서버 계약이 필요해 막혀 있는지 명확히 안내한다.
- 운영자 콘솔 진입은 이미 `isOperator`, `operatorRole`, `operatorFridgeIds`, `roles` 중 하나가 내려오는 경우에만 노출되도록 방어 구현되어 있다.

## 현재 Live OpenAPI에 없는 계약

현재 `http://localhost:8080/openapi.json` 기준 확인된 관련 경로는 `/auth/me`, `/auth/me/location`, `/posts`, `/posts/nearby`, `/posts/{post_id}`, `/posts/{post_id}/requests`, `/fridges/*`, `/operator/*`, `/inventory/*` 수준이다.

다음 계약은 아직 없다.

- 프로필 수정: 닉네임, 프로필 이미지 저장.
- 내 나눔 목록: 내가 등록한 Post 목록과 상태별 필터.
- 받은 나눔 목록: 내가 신청/수령한 요청 목록.
- 관심 식재료: 관심 등록/해제/목록.
- 알림 서버 목록/읽음: 기기 변경 후에도 유지되는 알림 히스토리, 읽음 동기화.
- 서버 검색: `nearby` 목록의 `q`, pagination, 정렬 계약.
- 통계/탄소/포인트: 계산식과 사용자별 지표 API.
- 운영자 role metadata: `/auth/me` 응답의 운영자 힌트.
- 일반 나눔 lifecycle: 신청 취소, 예약 확정, 일반 완료, 만료 전환.
- 소셜 로그인/이메일 인증.
- AI rejection/review reason enum의 실제 non-null 응답.

## 요청 Endpoint 초안

### 1. 프로필 수정

```http
PATCH /api/v1/auth/me
Content-Type: application/json

{
  "nickname": "새 닉네임",
  "profileImageUrl": "/static/uploads/profile/..."
}
```

응답:

```http
200 ApiResponse<UserRead>
```

프론트 필요사항:

- `nickname` 변경 후 `/auth/me`와 같은 `UserRead` shape 반환.
- 프로필 이미지 업로드를 별도 multipart endpoint로 분리할지, URL만 받는지 확정.

### 2. 내 나눔 목록

```http
GET /api/v1/users/me/posts?status=available,requested,completed,cancelled,expired,pending_store&skip=0&limit=20
```

응답:

```http
200 ApiResponse<PostRead[]>
```

프론트 필요사항:

- 작성자 본인 Post만 반환.
- `pending_store`, `available`, `requested`, `completed`, `cancelled`, `expired`, `disposed` 상태 포함 여부 확정.
- QR 보관 대기/수령 대기 CTA를 만들 수 있도록 `labelCode`, `storageZone`, `storeExpiresAt`, `requestExpiresAt`, `pickedUpAt` 포함.

### 3. 받은 나눔/신청 목록

```http
GET /api/v1/users/me/share-requests?status=requested,completed,cancelled,expired&skip=0&limit=20
```

응답 예:

```json
{
  "success": true,
  "data": [
    {
      "request": {
        "id": 11,
        "postId": 49,
        "requesterId": 13,
        "status": "requested",
        "createdAt": "2026-05-25T13:21:13Z"
      },
      "post": {
        "id": 49,
        "status": "requested",
        "detectedFruitKo": "바나나",
        "fridgeId": 1,
        "labelCode": "#02",
        "storageZone": "GENERAL"
      }
    }
  ]
}
```

프론트 필요사항:

- 신청자 기준 목록.
- 수령 QR 진입에 필요한 `post`, `fridge`, `requestExpiresAt` 포함.

### 4. 관심 식재료

```http
GET /api/v1/users/me/favorites?skip=0&limit=20
POST /api/v1/posts/{post_id}/favorite
DELETE /api/v1/posts/{post_id}/favorite
```

응답:

```http
200 ApiResponse<PostNearbyRead[]>
201 ApiResponse<FavoriteRead>
200 ApiResponse<null>
```

프론트 필요사항:

- 상세/카드에서 관심 여부를 바로 표시할 수 있는 `isFavorited` 포함 여부 결정.
- 관심 Post가 `requested/completed/disposed` 상태가 된 뒤 목록에 남을지 정책 필요.

### 5. 알림 서버 목록/읽음

```http
GET /api/v1/notifications?unreadOnly=false&skip=0&limit=50
PATCH /api/v1/notifications/{notification_id}/read
PATCH /api/v1/notifications/read-all
DELETE /api/v1/notifications/{notification_id}
```

응답 예:

```json
{
  "id": "server-notification-id",
  "type": "share_created",
  "postId": "49",
  "requestId": null,
  "fruitName": "바나나",
  "fridgeName": "광주역 공유냉장고",
  "title": "근처에 나눔이 등록됐어요",
  "body": "광주역 공유냉장고에 바나나 나눔이 등록됐어요.",
  "receivedAt": "2026-05-25T13:21:13Z",
  "readAt": null
}
```

프론트 필요사항:

- FCM payload와 서버 알림 record의 id 연결.
- 로컬 수신 기록과 서버 목록을 병합할지, 서버 목록을 source of truth로 둘지 결정.

### 6. 운영자 Role Metadata

현재 프론트는 아래 필드 중 하나가 있으면 운영자 콘솔을 노출할 수 있다.

```json
{
  "isOperator": true,
  "operatorRole": "fridge_operator",
  "operatorFridgeIds": [1, 3],
  "roles": ["member", "fridge_operator"]
}
```

요청:

```http
GET /api/v1/auth/me
-> UserRead + operator metadata
```

프론트 필요사항:

- 운영자 권한이 있는 냉장고 id 목록.
- 관리자와 냉장고 운영자의 역할 구분.
- 권한이 없으면 해당 필드는 `false`, `null`, `[]` 중 하나로 안정 반환.

### 7. 일반 나눔 Lifecycle

현재 확정 흐름:

- `POST /posts/{id}/requests`: `available -> requested`
- QR flow: `pending_store -> available -> requested -> completed`

추가 요청:

```http
POST /api/v1/posts/{post_id}/cancel
POST /api/v1/posts/{post_id}/complete
POST /api/v1/share-requests/{request_id}/cancel
POST /api/v1/posts/{post_id}/expire
```

프론트 필요사항:

- 작성자 취소와 신청자 취소 권한 구분.
- 일반 나눔 완료와 QR 수령 완료의 상태/감사 로그 차이.
- 만료는 서버 배치인지 사용자 액션인지 정책 확정.

### 8. 서버 검색

```http
GET /api/v1/posts/nearby?latitude=35.1595&longitude=126.9136&radius_km=2&q=apple&skip=0&limit=50
GET /api/v1/fridges/nearby?latitude=35.1595&longitude=126.9136&radius_km=2&q=station
```

프론트 필요사항:

- 기존 nearby 응답 shape 유지.
- `q`가 없으면 현재 동작과 동일.
- 검색 대상: `detectedFruitKo`, fridge name/address, 향후 태그 포함 여부.

### 9. 통계/탄소/포인트

```http
GET /api/v1/users/me/stats
```

응답 예:

```json
{
  "totalShared": 12,
  "totalReceived": 5,
  "carbonSavedKg": 8.4,
  "points": 1200,
  "trustScore": 72
}
```

프론트 필요사항:

- 탄소 절감 계산식.
- 포인트 적립/차감 이벤트 기준.
- 신선도 온도 또는 trust score의 제품 의미.

### 10. AI Rejection/Review Reason

현재 앱은 아래 값들을 방어적으로 처리할 수 있다.

```text
stale
not_food
non_food
low_quality
screenshot
ui_screenshot
review_required
multi_object_review
```

요청:

- `POST /api/v1/posts/generate`가 rejection/review 시 root-level `rejectionReason` 또는 `aiAnalysis.rejectionReason`/`aiAnalysis.reviewReason`을 안정적으로 반환.
- 400 응답이면 FastAPI `detail`에 사용자에게 보여줄 수 있는 문구 포함.
- `stale-or-rotten`, `screenshot-or-ui`, `low-quality` fixture가 Fresh false-positive로 통과하지 않도록 모델 또는 rule 보강.

## 우선순위 제안

1. `/auth/me` 운영자 metadata: 이미 operator inventory가 동작하므로 가장 작은 계약으로 앱 진입 정책을 닫을 수 있다.
2. 내 나눔/받은 나눔 목록: QR 보관/수령, 신청 상태 확인, 일반 사용자 운영 흐름을 만들기 위한 핵심 화면이다.
3. 알림 서버 목록/읽음: 현재는 로컬 읽음만 가능하므로 기기 변경/재설치 시 이력이 사라진다.
4. 프로필 수정/관심 식재료: 제품 완성도는 높이지만 핵심 transaction보다는 후순위다.
5. 검색/통계/소셜/이메일 인증/AI enum 확장: Post-MVP로 별도 일정화한다.
