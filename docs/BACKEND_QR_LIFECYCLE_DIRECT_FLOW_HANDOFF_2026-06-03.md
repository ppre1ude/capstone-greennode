# 백엔드 전달용 QR Lifecycle API 구조 변경 요청서

> 작성일: 2026-06-03
> 목적: 프론트에서 `direct` 등록 흐름을 제거하고 QR 보관/수령 생명주기를 정식 제품 흐름으로 바꾼 기준을 백엔드 API 구조 변경 요청으로 전달한다.
> 관련 문서: [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md), [DOMAIN_MODEL.md](./DOMAIN_MODEL.md), [INVENTORY_QR_PRD_V0.md](./INVENTORY_QR_PRD_V0.md), [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md)

## 요약

프론트의 정식 제품 흐름은 더 이상 `POST /posts` 직후 public `available`을 만드는 direct flow가 아니다.

새 기준은 아래 하나의 나눔 생명주기다.

```text
generate
  -> POST /posts with flow="fridge_qr"
  -> pending_store
  -> confirm-store
  -> available
  -> request
  -> requested
  -> confirm-pickup
  -> completed
```

백엔드 변경 핵심:

- `flow: "fridge_qr"` 등록은 `status=pending_store`를 만들어야 한다.
- `pending_store`는 홈, 지도, 냉장고 available 목록, `share_created` 푸시에 노출하지 않는다.
- 보관 QR 인증이 성공해야 `pending_store -> available`로 전환하고 그때부터 public discovery와 푸시가 가능하다.
- 신청은 `available -> requested` 전환과 동시에 30분 임시 선점(`requestExpiresAt`)을 만든다.
- 수령 QR 인증이 성공해야 `requested -> completed`가 된다.
- 작성자 수동 완료 API는 앱 제품 흐름에서 사용하지 않는다.
- `direct`는 앱 제품 계약이 아니다. 남겨야 한다면 내부 QA/마이그레이션 전용으로 분리하고, 일반 앱 client에서는 받지 않는 것이 기준이다.
- 운영자 콘솔 진입 검증을 닫기 위해 최신 VM에 실제 운영자 계정과 담당 냉장고 fixture를 제공해야 한다.

## 프론트 현재 반영

프론트는 이미 아래 계약으로 동작한다.

- `src/types/post.ts`: `PostCreateData.flow?: "fridge_qr"`만 허용한다.
- `src/screens/post/FridgeSelectScreen.tsx`: `createPost({...postData, fridgeId, flow: "fridge_qr"})`를 호출한다.
- `src/screens/post/FridgeSelectScreen.tsx`: create 성공 후 `InventoryQr` 화면으로 이동하고 `postId`, 선택 냉장고 `publicCode`, `storeExpiresAt` 기반 만료 시각을 전달한다.
- `src/screens/inventory/InventoryQrScreen.tsx`: 보관 인증은 `POST /api/v1/inventory/confirm-store`, 수령 인증은 `POST /api/v1/inventory/confirm-pickup`을 호출한다.
- `src/screens/post/PostDetailScreen.tsx`: `requested` 상태에서만 수령 QR 진입을 제공하고 `requestExpiresAt`을 countdown 기준으로 사용한다.
- `__tests__/postCreateFlow.contract.test.ts`: 활성 제품 계약 파일에 `direct` 문자열이 들어가지 않도록 고정한다.

백엔드 회신 반영:

- 2026-06-03 백엔드가 `POST /posts`에서 `flow` 값과 무관하게 `pending_store`를 생성하고, 일반 앱 client의 `direct` 우회 등록을 무시한다고 회신했다.
- `scripts/validate-backend-feature-contracts.js`는 `flow: "fridge_qr" -> confirm-store -> request -> confirm-pickup` 순서로 갱신한다.
- 작성자 수동 `/complete` 검증은 제품 하네스에서 제거한다.
- 운영자/QR fixture는 `fridgeId=1`, `fridgePublicCode=GJ-STATION-001`, `optest@foodlink.com` 계정으로 통일한다.
- 회신 요약은 [BACKEND_QR_LIFECYCLE_RESPONSE_2026-06-03.md](./BACKEND_QR_LIFECYCLE_RESPONSE_2026-06-03.md)를 따른다.

## 요청 API 계약

### 1. 나눔 식재료 등록

```http
POST /api/v1/posts
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer {token}
```

요청 body:

```text
data=<urlencoded JSON>
```

JSON:

```json
{
  "fridgeId": 1,
  "expirationDate": "2026-06-10",
  "imageToken": "temp-image-token",
  "flow": "fridge_qr",
  "selectedDetectionId": "detection-1"
}
```

필드 기준:

| 필드 | 필수 | 기준 |
| --- | --- | --- |
| `fridgeId` | 필수 | 사용자가 선택한 공유 냉장고 id |
| `expirationDate` | 필수 | `YYYY-MM-DD` |
| `imageToken` | 필수 | `POST /posts/generate`가 발급한 유효 토큰 |
| `flow` | 필수 권장 | 정식 앱 흐름은 `"fridge_qr"` |
| `selectedDetectionId` | 선택 | multi-object 후보가 있을 때 대표 후보 id. `bbox`는 보내지 않음 |

성공 응답:

```json
{
  "success": true,
  "message": "보관 QR 인증을 진행해주세요.",
  "data": {
    "id": 123,
    "authorId": 10,
    "fridgeId": 1,
    "fridgeName": "광주역 앞 공유냉장고",
    "detectedFruit": "apple",
    "detectedFruitKo": "사과",
    "freshnessLabel": "Fresh",
    "confidenceScore": 0.92,
    "imageUrl": "/static/uploads/posts/10/example.png",
    "expirationDate": "2026-06-10",
    "status": "pending_store",
    "storeExpiresAt": "2026-06-03T02:10:00Z",
    "createdAt": "2026-06-03T02:00:00Z",
    "updatedAt": "2026-06-03T02:00:00Z"
  }
}
```

백엔드 처리 기준:

- `imageToken`과 AI sidecar를 검증하고, 서버 sidecar AI 메타데이터를 Post에 복원한다.
- 프론트가 AI 메타데이터를 다시 보내더라도 서버 sidecar 값을 우선한다.
- `flow: "fridge_qr"`이면 `status="pending_store"`를 생성한다.
- `storeExpiresAt = now + 10 minutes`를 내려준다.
- timestamp는 `Z` 또는 offset이 포함된 ISO-8601을 권장한다. timezone 없는 문자열을 내려야 한다면 VM/UTC 기준으로 고정해야 한다.
- `pending_store`는 `/posts/nearby`, `/fridges/{id}/posts?status=available`, FCM `share_created` 대상이 아니다.

direct 처리 기준:

- `flow: "direct"`는 앱 제품 계약이 아니다.
- 마이그레이션 기간에 남긴다면 일반 사용자 앱 client에서는 접근할 수 없게 제한한다.
- direct를 완전히 제거하는 시점에는 프론트 QA 하네스도 QR 경로로 함께 갱신한다.

### 2. 보관 QR 인증

```http
POST /api/v1/inventory/confirm-store
Content-Type: application/json
Authorization: Bearer {token}
```

요청:

```json
{
  "postId": 123,
  "fridgePublicCode": "GJ-STATION-001"
}
```

성공 응답:

```json
{
  "success": true,
  "message": "입고 인증이 완료되었습니다.",
  "data": {
    "postId": 123,
    "status": "available",
    "labelCode": "#03",
    "storageZone": "GENERAL",
    "storageDeadlineAt": "2026-06-10T02:00:00Z",
    "storedAt": "2026-06-03T02:05:00Z"
  }
}
```

검증 기준:

- 로그인 사용자와 `post.authorId`가 일치해야 한다.
- Post 상태가 `pending_store`여야 한다.
- `fridgePublicCode`가 활성 공유 냉장고로 해석되어야 한다.
- QR 냉장고가 Post의 `fridgeId`와 일치해야 한다.
- 현재 시간이 `storeExpiresAt` 안이어야 한다.
- 성공 시 `pending_store -> available`로 전환한다.
- 성공 시 `labelCode`, `storageZone`, `storageDeadlineAt`, `storedAt`를 저장/반환한다.
- 성공 후부터 `/posts/nearby`, `/fridges/{id}/posts?status=available`, `share_created` 푸시 대상이 된다.

### 3. 나눔 신청과 30분 임시 선점

```http
POST /api/v1/posts/{post_id}/requests
Authorization: Bearer {token}
```

성공 응답:

```json
{
  "success": true,
  "message": "나눔 신청이 완료되었습니다.",
  "data": {
    "request": {
      "id": 77,
      "postId": 123,
      "requesterId": 20,
      "status": "requested",
      "createdAt": "2026-06-03T02:15:00Z"
    },
    "post": {
      "id": 123,
      "authorId": 10,
      "fridgeId": 1,
      "fridgeName": "광주역 앞 공유냉장고",
      "detectedFruitKo": "사과",
      "status": "requested",
      "labelCode": "#03",
      "storageZone": "GENERAL",
      "requestExpiresAt": "2026-06-03T02:45:00Z"
    }
  }
}
```

검증 기준:

- 대상 Post는 `available`이어야 한다.
- 작성자 본인 신청은 403이다.
- 첫 신청만 성공한다. 이미 `requested`이면 409다.
- 성공 시 `available -> requested`로 전환한다.
- 성공 시 `requestExpiresAt = now + 30 minutes`를 설정한다.
- 성공 후 public available 목록에서 제외한다.
- 공급자에게 `share_requested` 알림을 보낸다.

### 4. 수령 QR 인증

```http
POST /api/v1/inventory/confirm-pickup
Content-Type: application/json
Authorization: Bearer {token}
```

요청:

```json
{
  "postId": 123,
  "fridgePublicCode": "GJ-STATION-001"
}
```

성공 응답:

```json
{
  "success": true,
  "message": "수령 인증이 완료되었습니다.",
  "data": {
    "postId": 123,
    "status": "completed",
    "labelCode": "#03",
    "storageZone": "GENERAL",
    "pickedUpAt": "2026-06-03T02:28:00Z"
  }
}
```

검증 기준:

- 로그인 사용자와 현재 활성 `ShareRequest.requesterId`가 일치해야 한다.
- Post 상태가 `requested`여야 한다.
- 현재 시간이 `requestExpiresAt` 안이어야 한다.
- QR 냉장고가 Post의 `fridgeId`와 일치해야 한다.
- 성공 시 `requested -> completed`로 전환한다.
- 연결된 `ShareRequest.status`도 `completed`로 맞춘다.
- `pickedUpAt`을 기록한다.
- 작성자 수동 완료 API는 앱 제품 흐름에서 사용하지 않는다.

### 5. 만료와 취소

서버 배치 또는 lazy-expire 기준:

- `pending_store`가 `storeExpiresAt`을 넘기면 `cancelled` 또는 비노출 terminal 상태로 전환한다.
- `requested`가 `requestExpiresAt`을 넘기면 `available`로 복원한다.
- 단, 복원 시점에 보관/수령 기한이 끝났다면 `expired`가 우선이다.
- 프론트는 별도 expire API를 호출하지 않는다.

사용자 취소 기준:

- 작성자 취소: `POST /api/v1/posts/{post_id}/cancel`
- 허용 상태: `pending_store`, `available`, `requested`
- `requested` 취소 시 연결된 `ShareRequest`도 `cancelled`
- 신청자 취소: `POST /api/v1/users/me/share-requests/{request_id}/cancel`
- 신청자 취소 성공 시 `ShareRequest.status = cancelled`, `Post.status = available`

## 목록과 응답 shape

### Public discovery

```http
GET /api/v1/posts/nearby?...&status implicit available
GET /api/v1/fridges/{fridge_id}/posts?status=available
```

기준:

- `available`만 반환한다.
- `pending_store`, `requested`, `completed`, `cancelled`, `expired`, `disposed`는 반환하지 않는다.
- 카드 요약 응답에는 `requestExpiresAt`, `labelCode`, `storageZone`이 없어도 된다.

### 내 나눔 목록

```http
GET /api/v1/users/me/posts?status=available,requested,completed,cancelled,expired,pending_store,disposed&skip=0&limit=20
```

필수 필드:

- `id`, `authorId`, `fridgeId`, `fridgeName`
- `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`
- `imageUrl`, `expirationDate`, `status`
- `storeExpiresAt`, `requestExpiresAt`, `storedAt`, `pickedUpAt`
- `labelCode`, `storageZone`, `storageDeadlineAt`
- `createdAt`, `updatedAt`

### 받은 나눔 목록

```http
GET /api/v1/users/me/share-requests?status=requested,completed,cancelled,expired&skip=0&limit=20
```

응답 구조:

```json
{
  "success": true,
  "data": [
    {
      "request": {
        "id": 77,
        "postId": 123,
        "requesterId": 20,
        "status": "requested",
        "createdAt": "2026-06-03T02:15:00Z"
      },
      "post": {
        "id": 123,
        "status": "requested",
        "fridgeId": 1,
        "fridgeName": "광주역 앞 공유냉장고",
        "detectedFruitKo": "사과",
        "imageUrl": "/static/uploads/posts/10/example.png",
        "expirationDate": "2026-06-10",
        "labelCode": "#03",
        "storageZone": "GENERAL",
        "requestExpiresAt": "2026-06-03T02:45:00Z"
      }
    }
  ]
}
```

기준:

- 목록 API는 `fridgePublicCode`를 꼭 노출하지 않아도 된다.
- QR 화면은 실제 스캔한 `fridgePublicCode`를 인증 API에 전달하고, 서버가 냉장고 일치를 검증한다.

## QR payload 기준

냉장고 QR은 공유 냉장고를 식별하는 public code다.

권장 payload:

```json
{"fridgePublicCode":"GJ-STATION-001"}
```

허용 후보:

```text
GJ-STATION-001
foodlink://fridges/GJ-STATION-001/verify
https://foodlink.app/q/fridges/GJ-STATION-001
```

보안 기준:

- QR은 비밀번호가 아니라 식별자다.
- QR만으로 보관/수령이 완료되면 안 된다.
- 서버는 로그인 사용자, 진행 중인 pending action, Post 상태, 냉장고 일치, 제한 시간을 함께 검증해야 한다.

## 에러 기준

프론트 QR 화면은 현재 아래 status를 사용자-facing 문구로 처리한다.

| Status | 의미 | 프론트 표시 |
| --- | --- | --- |
| 400 | 잘못된 요청 또는 QR payload | 유효하지 않은 QR 코드 |
| 401 | 로그인 필요 | 공통 인증 실패 처리 |
| 403 | 권한 불일치 | 이 식재료의 신청자 또는 작성자가 아님 |
| 404 | Post 또는 냉장고 없음 | 해당 냉장고를 찾을 수 없음 |
| 409 | 상태 불일치, 이미 완료, 중복 신청 | 이미 처리된 식재료 또는 신청 경합 |
| 410 | 보관/수령 제한 시간 만료 | 보관 기한이 만료된 식재료 |

권장:

- wrong fridge는 400보다 409 또는 403으로 구분해도 된다. 다만 response message에는 "선택한 냉장고 QR이 아닙니다"처럼 원인을 남긴다.
- 만료는 가능하면 410을 사용한다.
- 응답은 기존 `ApiResponse` wrapper를 유지한다.

## 운영자 계정과 권한 검증 요청

운영자 콘솔 노출은 프론트가 임의로 결정할 수 없고, 최신 VM의 `/auth/me`와 operator API 권한 응답이 source of truth다. 프론트 UI와 테스트는 준비되어 있지만 실제 운영자 계정 credential이 없으면 live VM 검증을 닫을 수 없다.

프론트 현재 처리:

- `GET /api/v1/auth/me` 응답에서 `isOperator`, `operatorRole`, `operatorFridgeIds`, `roles`를 정규화한다.
- 아래 조건 중 하나라도 맞으면 프로필에 `냉장고 운영자 콘솔` 진입점을 노출한다.
  - `isOperator === true`
  - `operatorRole`이 `"operator"`, `"admin"`, `"fridge_operator"` 중 하나
  - `operatorFridgeIds`가 비어 있지 않은 배열
  - `roles`에 `"operator"`, `"admin"`, `"fridge_operator"` 중 하나 포함
- 권한 없는 계정에는 운영자 콘솔 진입점을 숨긴다.
- 운영자 콘솔 진입 후 `GET /api/v1/operator/fridges/{fridgeId}/inventory/summary`, `GET /api/v1/operator/fridges/{fridgeId}/inventory/items`, `PATCH /api/v1/operator/items/{postId}/dispose`를 호출한다.
- operator API가 401/403을 반환하면 샘플 fallback과 폐기 CTA를 숨기고 `운영자 권한이 필요합니다` 안내만 표시한다.

백엔드에 필요한 fixture:

| 항목 | 필요 내용 |
| --- | --- |
| 운영자 계정 | 최신 VM에 로그인 가능한 email/password. 비밀번호는 문서에 남기지 말고 별도 안전 채널로 전달 |
| 운영자 metadata | `/auth/me`에서 `isOperator: true`, `operatorRole`, `operatorFridgeIds` 반환 |
| 담당 냉장고 | 운영자 계정이 접근 가능한 `fridgeId`, `fridgeName`, 가능하면 `fridgePublicCode` |
| 비운영자 계정 | 별도 제공이 가능하면 좋지만, 프론트 QA 하네스가 일반 계정은 생성 가능 |
| operator inventory 데이터 | 담당 냉장고에 summary/items가 200으로 반환되는 상태. 빈 목록이면 `total=0`, `items=[]`로 안정 반환 |

권장 `/auth/me` 응답:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "email": "operator@example.com",
    "nickname": "운영자",
    "isOperator": true,
    "operatorRole": "fridge_operator",
    "operatorFridgeIds": [1],
    "roles": ["member", "fridge_operator"]
  }
}
```

권한 없는 사용자 응답:

```json
{
  "success": true,
  "data": {
    "isOperator": false,
    "operatorRole": null,
    "operatorFridgeIds": [],
    "roles": ["member"]
  }
}
```

operator API 권한 기준:

- 무인증 요청은 401을 반환한다.
- 비운영자 요청은 403을 반환한다.
- 운영자지만 담당하지 않는 냉장고 요청은 403 또는 404로 구분하되, 서버 message에 권한/대상 불일치 원인을 남긴다.
- 존재하지 않는 냉장고는 404를 반환한다.
- 담당 냉장고 inventory가 비어 있으면 200과 빈 상태를 반환한다.
- 폐기 가능한 상태는 `available`, `expired` 중심으로 제한한다.
- `requested`, `completed`, `pending_store`, `cancelled`, `disposed` 폐기 요청은 409를 반환한다.
- 폐기 성공 후 summary/items와 public discovery에서 해당 항목이 제외되어야 한다.

프론트가 실행할 검증 명령:

```powershell
$env:FOODLINK_API_BASE_URL='http://localhost:8080'
$env:FOODLINK_OPERATOR_EMAIL='optest@foodlink.com'
$env:FOODLINK_OPERATOR_PASSWORD='testpassword123'
$env:FOODLINK_QA_FRIDGE_ID='1'
$env:FOODLINK_QA_FRIDGE_PUBLIC_CODE='GJ-STATION-001'
npm run qa:backend-contracts -- --mutate
```

수동 앱 QA 기준:

- 일반 계정으로 로그인하면 프로필에 `냉장고 운영자 콘솔`이 보이지 않는다.
- 운영자 계정으로 로그인하면 프로필에 `냉장고 운영자 콘솔`이 보인다.
- 운영자 콘솔 진입 시 담당 냉장고 summary/items가 403 없이 동기화된다.
- 담당 냉장고가 비어 있으면 empty state가 표시된다.
- 권한이 없는 냉장고 접근은 권한 안내로 처리된다.

역할 관리 범위:

- 모바일 소비자 앱에는 운영자 role grant/revoke UI를 넣지 않는다.
- 운영자 권한 부여와 회수는 backend seed, admin CLI, 또는 별도 web backoffice 범위로 유지한다.

## 백엔드에 받고 싶은 답변

1. `POST /posts`에서 `flow: "fridge_qr"`를 받으면 항상 `pending_store`를 만드는 것으로 확정 가능한가?
2. 일반 앱 client의 `flow: "direct"`를 언제 차단할 수 있는가?
3. `storeExpiresAt`, `requestExpiresAt` timestamp를 `Z` 포함 UTC로 내려줄 수 있는가?
4. `pending_store` 만료 상태명은 `cancelled`로 확정할 것인가, 별도 비노출 terminal 상태가 필요한가?
5. `requested` 만료 시 `available` 복원과 `expired` 우선순위를 서버 배치/lazy-expire 중 어느 방식으로 처리할 것인가?
6. confirm-store 성공 시 `share_created` 푸시 발송 시점을 `available` 전환 직후로 고정할 수 있는가?
7. direct 제거 후 QA 하네스를 QR 경로로 바꾸기 위해 테스트 계정과 냉장고 public code fixture를 제공할 수 있는가?
8. 최신 VM에서 사용할 운영자 계정 email/password를 제공할 수 있는가?
9. 해당 운영자 계정의 `/auth/me`가 `isOperator`, `operatorRole`, `operatorFridgeIds`를 안정적으로 반환하는가?
10. 운영자 계정이 담당하는 `fridgeId`, `fridgeName`, `fridgePublicCode` fixture를 제공할 수 있는가?
11. `/api/v1/operator/fridges/{fridgeId}/inventory/summary`, `/items`, `/operator/items/{postId}/dispose`가 최신 VM/OpenAPI에 노출되어 있는가?
12. 비운영자 403, 무인증 401, 없는 냉장고 404, 담당 외 냉장고 403/404, 빈 inventory 200 `[]` 기준을 유지할 수 있는가?
13. 운영자 role grant/revoke는 모바일 앱 밖의 backend seed/admin CLI/backoffice 범위로 확정해도 되는가?
14. QR lifecycle fixture와 운영자 fixture를 같은 냉장고로 맞춰도 되는가? 가능하면 `FOODLINK_QA_FRIDGE_ID` 하나로 confirm-store, confirm-pickup, operator inventory 검증을 함께 돌리고 싶다.

## 프론트 후속 작업

백엔드 direct 차단 회신 후 프론트 후속:

- [x] `scripts/validate-backend-feature-contracts.js`의 `flow: "direct"` 제거
- [x] mutation matrix에서 create 직후 `confirm-store` 호출 추가
- [x] `POST /posts/{id}/complete`에 기대던 legacy author complete 검증 제거
- [x] 운영자 계정 fixture 기본값 반영
- [x] operator summary/items/dispose 권한 matrix를 같은 fixture 냉장고로 검증하도록 하네스 보강
- [ ] 최신 VM에서 `generate -> create pending_store -> confirm-store -> request -> confirm-pickup -> review/report` E2E 재검증
