# 백엔드 전달용 기능 계약 요청서

> 작성일: 2026-05-25
> 목적: 프론트에서 구현이 막힌 기능을 백엔드 계약 단위로 정리하고, 우선 확정해야 할 API/응답 shape를 요청한다.

## 요약

프론트는 현재 이메일 로그인, 위치 등록, 주변 나눔 조회, 나눔 신청, FCM 수신/로컬 알림함, QR 보관/수령, 운영자 inventory 조회/폐기까지 연동되어 있습니다.

다만 아래 기능은 프론트 화면 또는 방어 로직은 준비되어 있어도, 백엔드 API/응답 필드가 없어 실제 기능으로 연결할 수 없습니다.

우선 확정이 필요한 항목은 세 가지입니다.

1. `/auth/me` 운영자 metadata
2. 내 나눔/받은 나눔 목록
3. 알림 서버 목록/읽음 상태

## 우선순위 요청

| 우선순위 | 항목 | 필요한 결정 | 프론트 영향 |
| --- | --- | --- | --- |
| P0 | 운영자 role metadata | `/auth/me`에 운영자 힌트를 추가할지, 별도 endpoint로 줄지 결정 | 실제 운영자 계정만 운영자 콘솔 메뉴를 볼 수 있음 |
| P0 | 내 나눔 목록 | 내가 등록한 Post 목록 endpoint와 상태 필터 결정 | 내 나눔 관리, QR 보관 대기, 신청 상태 확인 화면 구현 가능 |
| P0 | 받은 나눔/신청 목록 | 내가 신청/수령한 request 목록 shape 결정 | 받은 나눔 내역, 수령 QR 재진입 화면 구현 가능 |
| P1 | 알림 서버 목록/읽음 | FCM record를 서버 source of truth로 저장할지 결정 | 기기 변경/재설치 후 알림 이력 복원 가능 |
| P1 | 프로필 수정 | 닉네임/프로필 이미지 저장 API 결정 | 프로필 수정 버튼 실제 연결 가능 |
| P1 | 관심 식재료 | favorite 등록/해제/목록 API 결정 | 관심 식재료 메뉴와 상세 favorite 버튼 구현 가능 |
| P2 | 일반 나눔 lifecycle | 취소/완료/만료 전환 API와 권한 결정 | `requested` 이후 사용자 액션 구현 가능 |
| P2 | 서버 검색 | nearby API의 `q`, pagination, 정렬 계약 결정 | 로컬 필터를 서버 검색으로 확장 가능 |
| P2 | 통계/탄소/포인트 | 계산식과 사용자 stats API 결정 | 현재 `준비 중` 지표를 실제 수치로 교체 가능 |
| Post-MVP | AI rejection/review enum | non-null `rejectionReason`/`reviewReason` enum 결정 | false-positive fixture를 strict acceptance로 승격 가능 |
| Post-MVP | 소셜 로그인/이메일 인증 | provider, verification flow, 계정 병합 정책 결정 | 이메일 로그인 외 인증 수단 구현 가능 |

## 1. 운영자 Role Metadata

현재 상황:

- 운영자 inventory API는 VM에서 동작 확인됨.
- 프론트는 아래 필드 중 하나만 내려오면 운영자 콘솔 진입을 노출할 수 있음.
- 하지만 live `/auth/me` `UserRead`에는 해당 필드가 없음.

요청:

```http
GET /api/v1/auth/me
```

응답에 아래 중 최소 계약을 추가해 주세요.

```json
{
  "isOperator": true,
  "operatorRole": "fridge_operator",
  "operatorFridgeIds": [1, 3],
  "roles": ["member", "fridge_operator"]
}
```

결정 필요:

- 운영자 권한은 `/auth/me`에 포함할지, 별도 `GET /api/v1/operator/me`로 분리할지
- 관리자와 냉장고 운영자를 구분할 role 값
- 권한이 없을 때 `false`, `null`, `[]` 중 어떤 형태로 안정 반환할지

## 2. 내 나눔 목록

요청 endpoint 초안:

```http
GET /api/v1/users/me/posts?status=available,requested,completed,cancelled,expired,pending_store&skip=0&limit=20
```

응답:

```http
200 ApiResponse<PostRead[]>
```

필요한 필드:

- `id`
- `status`
- `detectedFruitKo`
- `freshnessLabel`
- `imageUrl`
- `fridgeId`
- `fridgeName`
- `expirationDate`
- `labelCode`
- `storageZone`
- `storeExpiresAt`
- `requestExpiresAt`
- `storedAt`
- `pickedUpAt`
- `createdAt`
- `updatedAt`

결정 필요:

- 작성자가 삭제한 Post를 목록에 남길지 여부
- `disposed` 항목을 작성자 목록에서 보여줄지 여부
- `pending_store`가 만료되었을 때 상태를 `expired`로 바꿀지 별도 상태로 둘지

## 3. 받은 나눔/신청 목록

요청 endpoint 초안:

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
        "fridgeName": "광주역 공유냉장고",
        "labelCode": "#02",
        "storageZone": "GENERAL",
        "requestExpiresAt": "2026-05-25T13:51:13Z"
      }
    }
  ]
}
```

결정 필요:

- 신청자가 취소할 수 있는지
- 수령 완료 후 목록 보관 기간
- 수령 QR 재진입에 필요한 fridge public code를 내려줄 수 있는지

## 4. 알림 서버 목록/읽음

현재 상황:

- 프론트는 FCM 수신 기록을 AsyncStorage에 저장하고 로컬 `readAt`만 관리함.
- 재설치/기기 변경 시 알림 이력은 복원 불가.

요청 endpoint 초안:

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

결정 필요:

- FCM 발송 시 서버 notification row를 함께 생성할지
- FCM message id와 서버 notification id를 어떻게 연결할지
- 로컬 수신 기록과 서버 목록이 중복될 때 병합 기준

## 5. 프로필 수정

요청 endpoint 초안:

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

결정 필요:

- 프로필 이미지 업로드를 별도 multipart endpoint로 둘지
- 닉네임 중복/길이/금칙어 정책

## 6. 관심 식재료

요청 endpoint 초안:

```http
GET /api/v1/users/me/favorites?skip=0&limit=20
POST /api/v1/posts/{post_id}/favorite
DELETE /api/v1/posts/{post_id}/favorite
```

결정 필요:

- 상세/카드 응답에 `isFavorited`를 포함할지
- `requested`, `completed`, `disposed` 상태의 Post가 관심 목록에 남는지

## 7. 일반 나눔 Lifecycle

현재 확정 흐름:

- `POST /posts/{id}/requests`: `available -> requested`
- QR flow: `pending_store -> available -> requested -> completed`

추가 요청 후보:

```http
POST /api/v1/posts/{post_id}/cancel
POST /api/v1/posts/{post_id}/complete
POST /api/v1/share-requests/{request_id}/cancel
POST /api/v1/posts/{post_id}/expire
```

결정 필요:

- 작성자 취소와 신청자 취소 권한
- 일반 나눔 완료와 QR 수령 완료의 차이
- 만료 처리는 서버 배치인지 사용자 액션인지

## 8. 서버 검색

요청 endpoint 초안:

```http
GET /api/v1/posts/nearby?latitude=35.1595&longitude=126.9136&radius_km=2&q=apple&skip=0&limit=50
GET /api/v1/fridges/nearby?latitude=35.1595&longitude=126.9136&radius_km=2&q=station
```

결정 필요:

- `q` 검색 대상: 식재료명, 냉장고명, 주소, 태그
- 정렬: 거리순, 최신순, 신선도순 중 기본값
- 기존 `nearby` 응답 shape 유지 여부

## 9. 통계/탄소/포인트

요청 endpoint 초안:

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

결정 필요:

- 탄소 절감 계산식
- 포인트 적립/차감 이벤트
- `trustScore` 또는 신선도 온도의 제품 의미

## 10. AI Rejection/Review Reason

현재 프론트가 방어 처리 가능한 enum 후보:

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

- `POST /api/v1/posts/generate`가 rejection/review 시 root-level `rejectionReason` 또는 `aiAnalysis.rejectionReason`/`aiAnalysis.reviewReason`을 안정적으로 반환
- 400 응답이면 FastAPI `detail`에 사용자에게 보여줄 수 있는 문구 포함
- `stale-or-rotten`, `screenshot-or-ui`, `low-quality` fixture가 Fresh false-positive로 통과하지 않도록 모델 또는 rule 보강

## 백엔드에 먼저 받고 싶은 답변

1. P0 세 항목(`/auth/me` role, 내 나눔 목록, 받은 나눔 목록)을 이번 스프린트에서 계약 확정 가능한가?
2. 알림 목록/읽음은 서버 저장형으로 갈 것인가, MVP에서는 FCM + 로컬 기록으로 유지할 것인가?
3. 프로필 수정/관심 식재료는 이번 범위에 포함할 것인가?
4. 일반 나눔 취소/완료/만료는 QR lifecycle과 같은 상태 machine에 포함할 것인가, 별도 후속으로 둘 것인가?
