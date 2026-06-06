# FoodLink API Integration Contract

> **문서 목적**: React Native 프론트엔드 개발자가 백엔드 API와 연동할 때 필요한 모든 정보
>
> **기준일**: 2026-05-23
> **검증 기준**: `GET /openapi.json`, 실제 앱/API 검증, 백엔드 Phase 1.5 완료 답변(2026-05-06), 백엔드 P0 수정/VM 재배포 완료 답변(2026-05-08), 백엔드 주간 마감 회신(2026-05-23), [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)
> **도메인 용어 기준**: [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)

---

## Agent Workflow

- Authority: frontend/server request and response contract, auth behavior, SSH
  tunnel setup, image URL handling, AI generate semantics, and FCM integration
  assumptions.
- Read before: changing API clients, response types, request payloads, auth
  flows, image upload/display behavior, location registration, fridge queries,
  or FCM handling.
- Update when: OpenAPI, actual server response, app interpretation, or error
  handling contract changes.
- Required evidence: endpoint, request shape, response shape, observed status
  code, and whether the basis is OpenAPI, live API, or app QA.
- Related workflows: `tdd`, `diagnose`, `qa`, `triage-issue`.
- Source-of-truth conflicts: actual verified server behavior wins over stale
  examples. Product scope defers to [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md), and
  domain naming defers to [DOMAIN_MODEL.md](./DOMAIN_MODEL.md).

## 1. 서버 접속 방법

### ⚠️ SSH 터널 (필수)

NHN Cloud 보안 그룹에서 HTTP(80) 포트가 차단되어 있어, **API 접근 전에 반드시 SSH 터널을 열어야 한다.**

```bash
# 터미널에서 실행하고 열어둔 채로 유지
ssh -L 8080:localhost:80 NHN-Cloud-Server
```

> ❗ 이 터미널을 닫으면 API 연결이 끊긴다.

### 접속 주소 (Base URL)

| 환경                              | Base URL                     |
| --------------------------------- | ---------------------------- |
| 브라우저 (Swagger UI)             | `http://localhost:8080/docs` |
| React Native (Android 에뮬레이터) | `http://10.0.2.2:8080`       |
| React Native (iOS 시뮬레이터)     | `http://localhost:8080`      |
| React Native (실기기, 같은 WiFi)  | `http://{내PC_IP}:8080`      |

### SSH 키 공유 방법

프론트 개발자도 SSH 터널을 열어야 하므로, 아래 파일이 필요하다:

1. SSH 키 파일: `2026-GreenNode.pem`
2. SSH config 설정:

```
Host NHN-Cloud-Server
    HostName 133.186.200.133
    User ubuntu
    IdentityFile 키파일경로/2026-GreenNode.pem
```

---

## 2. API 기본 규칙

- **경로 접두사**: `/api/v1`
- **인증**: JWT Bearer Token (`Authorization: Bearer {token}`)
- **JSON 키 스타일**: camelCase (예: `expirationDate`, `imageUrl`)
- **날짜 형식**: ISO 8601 (`2026-04-30`)
- **페이지네이션**: `skip` + `limit` 쿼리 파라미터

### 도메인/API 명칭 번역

현재 서버와 앱 코드에는 `/posts`, `Post`, `postId` 계열 명칭이 남아 있다. 제품/도메인 문서에서는 이를 **나눔 식재료**로 번역한다.

| API/code term                                   | Domain term                | Note                                                                                        |
| ----------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| `post`, `Post`, `/posts`                        | 나눔 식재료                | 현재 기술 명칭. 사용자-facing 용어로 쓰지 않는다.                                           |
| `createPost`                                    | 나눔 식재료 등록           | AI generate 이후 최종 등록 단계                                                             |
| `nearby posts`                                  | 근처 나눔 식재료           | 홈 피드의 핵심 데이터                                                                       |
| `status`                                        | 나눔 상태                  | `available`, `requested` 등 생명주기 상태                                                   |
| `category`/`freshnessLabel` in AI/post data     | 신선도 등급                | 현재 백엔드 기준 `Fresh`, `Mid`, `Stale`. 도메인상 `Mid`는 기존 `Normal` 그룹으로 번역한다. |
| `detectedFruitKo`                               | 식재료명                   | 나눔 식재료 카드/상세/알림에서 사용자에게 보여줄 대표 식재료명                              |
| `title`, `description`, `category` in post data | 구형 나눔 식재료 작성 필드 | 백엔드 Phase 1.5에서 Post 컬럼에서 제거됨. 프론트 타입/화면은 새 계약으로 갱신됐다.    |

### 응답 공통 형식

```json
{
  "success": true,
  "message": "설명 메시지",
  "data": { ... }
}
```

에러 시:

```json
{
  "success": false,
  "message": "에러 설명",
  "data": null
}
```

### HTTP 상태 코드

| 코드 | 의미                                 |
| ---- | ------------------------------------ |
| 200  | 조회/수정 성공                       |
| 201  | 생성 성공                            |
| 400  | 잘못된 요청 (비즈니스 규칙 위반)     |
| 401  | 인증 실패 (토큰 없음/만료)           |
| 403  | 권한 없음                            |
| 409  | 충돌 (이미 신청 접수됨 등 상태 경합) |
| 404  | 리소스 없음                          |
| 422  | 유효성 검증 실패 (필수 필드 누락)    |

---

## 3. API 엔드포인트 전체 목록

| #   | 메서드 | 경로                        | 설명                      | 인증 |
| --- | ------ | --------------------------- | ------------------------- | ---- |
| 1   | POST   | /api/v1/auth/signup         | 회원가입                  | ❌   |
| 2   | POST   | /api/v1/auth/login          | 로그인                    | ❌   |
| 3   | GET    | /api/v1/auth/me             | 내 정보 조회              | ✅   |
| 4   | PATCH  | /api/v1/auth/me             | 프로필 수정               | ✅   |
| 5   | PUT    | /api/v1/auth/me/location    | 위치+FCM 토큰 갱신        | ✅   |
| 6   | POST   | /api/v1/posts               | 나눔 식재료 등록          | ✅   |
| 7   | POST   | /api/v1/posts/generate      | AI 나눔 식재료 미리보기   | ✅   |
| 8   | GET    | /api/v1/posts/nearby        | 근처 나눔 식재료 목록     | ✅   |
| 9   | GET    | /api/v1/posts/{id}          | 나눔 식재료 상세          | ✅   |
| 10  | DELETE | /api/v1/posts/{id}          | 나눔 식재료 삭제          | ✅   |
| 11  | POST   | /api/v1/posts/{id}/requests | 나눔 신청                 | ✅   |
| 12  | POST   | /api/v1/posts/{id}/cancel   | 작성자 나눔 취소          | ✅   |
| 13  | GET    | /api/v1/users/me/posts      | 내 나눔 목록              | ✅   |
| 14  | GET    | /api/v1/users/me/share-requests | 받은 나눔/신청 목록   | ✅   |
| 15  | POST   | /api/v1/users/me/share-requests/{id}/cancel | 신청자 취소 | ✅ |
| 16  | GET    | /api/v1/fridges/nearby      | 근처 냉장고 현황          | ✅   |
| 17  | GET    | /api/v1/fridges/available   | 등록 가능 냉장고          | ✅   |
| 18  | GET    | /api/v1/fridges/{id}/posts  | 냉장고별 나눔 식재료 조회 | ✅   |
| 19  | GET    | /api/v1/operator/fridges/{fridgeId}/inventory/summary | 운영자 inventory 요약 | ✅ |
| 20  | GET    | /api/v1/operator/fridges/{fridgeId}/inventory/items | 운영자 inventory 품목 조회 | ✅ |
| 21  | PATCH  | /api/v1/operator/items/{postId}/dispose | 운영자 폐기 처분 | ✅ |
| 22  | POST   | /api/v1/share-requests/{requestId}/review | 수령 경험 평가 생성 | ✅ |
| 23  | POST   | /api/v1/share-requests/{requestId}/report | 나눔 신고 생성 | ✅ |
| 24  | GET    | /api/v1/users/{userId}/trust-summary | 공급자 신뢰 요약 조회 | ✅ |

### 백엔드 구현 완료, 프론트 연동 필요

아래 흐름은 백엔드 Phase 1.5에서 구현/VM 검증이 완료된 항목이다. 프론트 반영 상태는 항목별로 다르므로, 구현 전 이 표와 [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)를 함께 확인한다.

| Product flow               | Backend state                                                                             | Frontend state                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 나눔 신청하기              | `POST /posts/{id}/requests` 구현, 성공 시 201                                             | 반영 완료. `requestShare(postId)`, 상세 CTA, 성공/실패 UI, 상태 갱신 구현                       |
| 신청 동시 경합 방지        | `SELECT ... FOR UPDATE` + 단일 트랜잭션. 첫 신청만 201, 이후 409                          | 반영 완료. 409를 정상 race 결과로 보고 `다른 사용자가 먼저 신청했어요` 문구와 CTA 비활성화 처리 |
| 작성자 본인 신청 차단      | 403                                                                                       | 반영 완료. 작성자 CTA 숨김, 403 fallback은 `내가 등록한 나눔 식재료예요`                        |
| 신청 알림                  | `share_requested` FCM payload 구현                                                        | 반영 완료. foreground/background/opened/initial 수신 기록, 알림함, 상세 fallback 라우팅 구현    |
| 냉장고별 나눔 식재료       | `GET /fridges/{id}/posts?status=available` 구현. 응답은 `PostNearbyRead`이며 `status` 정확히 일치하는 항목만 반환 | 반영 완료. 지도에서 선택 냉장고의 내부 available 목록, loading/error/empty/list 상태, 상세 이동 구현 |
| Post 응답 구조             | `title/description/category` 제거, `detectedFruitKo/freshnessLabel/confidenceScore` 추가. 2026-05-08 수정 후 `imageToken` sidecar AI 메타데이터를 create 시 복원. 단, `/posts/nearby`, `/fridges/{id}/posts`의 `PostNearbyRead`에는 `confidenceScore`가 없다 | 반영 완료. `src/types/post.ts`, `createPost()`, 홈/냉장고 카드, 상세, 등록 확인 화면은 새 구조 사용 |
| 나눔 기준 미충족 서버 방어 | `Stale`/`isFresh=false`이면 generate 400이고 `imageToken` 미발급. create는 유효한 `imageToken` 없으면 400 | 프론트 `canShare`는 UX 가드로 유지하되 서버가 최종 방어선임을 전제로 오류 처리                  |

---

## 4. 엔드포인트별 상세

### 4.1 회원가입

```
POST /api/v1/auth/signup
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "nickname": "푸드링커",
  "password": "password123"
}
```

**응답 (201)**:

```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "푸드링커",
    "profileImageUrl": null,
    "latitude": null,
    "longitude": null,
    "fcmToken": null,
    "isActive": true,
    "createdAt": "2026-04-25T10:00:00",
    "updatedAt": "2026-04-25T10:00:00"
  }
}
```

### 4.2 로그인

> ⚠️ **JSON이 아니라 `application/x-www-form-urlencoded` 형식** (OAuth2 표준)

```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

```
username=user@example.com&password=password123
```

> ⚠️ 필드명이 `email`이 아니라 `username`이다 (OAuth2 표준).

```javascript
// React Native 예시
const formBody = new URLSearchParams();
formBody.append('username', email);
formBody.append('password', password);

const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formBody.toString(),
});
const result = await response.json();
// result.data.accessToken → AsyncStorage에 저장
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "bearer"
  }
}
```

### 4.2-A 내 정보 조회/프로필 수정

`GET /api/v1/auth/me`는 로그인 사용자 정보와 운영자 진입 힌트를 함께 내려준다. 프론트는 camelCase를 canonical로 사용하되 구형/중간 응답 호환을 위해 snake_case도 정규화한다.

운영자 권한이 없는 유저:

```json
{
  "isOperator": false,
  "operatorRole": null,
  "operatorFridgeIds": []
}
```

운영자 권한이 있는 유저:

```json
{
  "isOperator": true,
  "operatorRole": "operator",
  "operatorFridgeIds": [1]
}
```

`operatorRole`은 `"operator"` 또는 `"admin"`이다. 프론트는 기존 fixture 호환을 위해 `"fridge_operator"`도 운영자 역할로 인정한다.

프로필 수정:

```text
PATCH /api/v1/auth/me
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "nickname": "공급자A_수정",
  "profileImageUrl": "/static/uploads/profile/avatar.jpg"
}
```

닉네임은 2~50자이며 중복 닉네임은 허용된다. MVP에서는 multipart 업로드가 아니라 `profileImageUrl` 문자열을 저장한다. 응답은 `UserRead`와 동일한 shape이며 앱은 저장 성공 후 auth store의 user를 갱신한다.

### 4.3 위치 + FCM 토큰 등록

> 앱 실행 시 + 로그인 직후 위치가 있는 유저는 좌표 갱신을 호출한다. 알림 토큰은 사용자가 명시적으로 알림 권한을 허용했거나 서버에 저장된 기존 토큰이 있을 때만 함께 보낸다.
> 알림 권한은 위치 설정 진입 시 자동으로 요청하지 않는다. 사용자가 알림 CTA를 누르면 앱이 `POST_NOTIFICATIONS`/Firebase permission을 요청하고, 허용된 경우에만 FCM 토큰을 함께 보낸다. 사용자가 알림을 건너뛰거나 거부해도 위치 등록은 `fcmToken` 없이 진행한다.

```
PUT /api/v1/auth/me/location
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "fcmToken": "dX4f3kJQ_8s:APA91bH...",
  "latitude": 35.1595,
  "longitude": 126.9136
}
```

### 4.4 나눔 식재료 자동 생성 (AI 미리보기)

> 이 API는 Post row를 만들지 않는다. 대신 2026-05-08 백엔드 수정 후 서버 임시 저장소에 이미지와 `{imageToken}.json` AI 메타데이터 sidecar를 함께 저장하고, 분석 결과와 `imageToken`을 반환한다. 사용자가 확인/수정 후 4.5의 등록 API로 최종 저장한다.
> 백엔드 Phase 1.5 기준 LLM은 비활성화되어 있으며, 대표 식재료와 신선도 분류 결과를 반환한다.

```
POST /api/v1/posts/generate
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

| 필드      | 타입   | 필수 | 설명                          |
| --------- | ------ | ---- | ----------------------------- |
| image     | File   | ✅   | 촬영한 사진                   |
| user_hint | string | ❌   | 추가 설명 (예: "어제 샀어요") |

> ⚠️ 현재 OpenAPI 기준 필수 form 필드는 `image`뿐이다. `user_hint`는 선택이며 snake_case를 사용한다.

**응답 (200)**:

> 2026-05-23 백엔드 회신 기준 canonical payload다. 공통 `ApiResponse.data` 안에 담겨 내려오는 것을 프론트 타입 기준으로 삼되, 실제 배포 응답이 raw object이면 API client에서 같은 shape로 normalize한다.

```json
{
  "success": true,
  "data": {
    "detectedFruit": "banana",
    "detectedFruitKo": "바나나",
    "aiAnalysis": {
      "isFresh": true,
      "confidenceScore": 0.96,
      "category": "Fresh",
      "analysisMessage": "상태가 좋아 보여요. 나눔이 가능합니다.",
      "detectedFruit": "banana",
      "detectedFruitKo": "바나나",
      "analysisSkipped": false
    },
    "imageToken": "a1b2c3d4-...",
    "rejectionReason": null,
    "detections": [
      {
        "id": "detection-1",
        "label": "banana",
        "labelKo": "바나나",
        "freshnessLabel": "Fresh",
        "confidenceScore": 0.96,
        "shareable": true,
        "bbox": {"x": 120, "y": 180, "width": 310, "height": 420}
      }
    ]
  }
}
```

> 2026-05-23 canonical 기준: `POST /posts/generate`는 root-level `detectedFruit`, `detectedFruitKo`, `imageToken`, `rejectionReason`, `detections[]`를 내려준다. 2026-05-29 Post-MVP shape 대응으로 root-level `reviewReason`도 방어적으로 받는다. AI 신선도 판정은 `data.aiAnalysis.category`, `data.aiAnalysis.confidenceScore`, `data.aiAnalysis.isFresh`와 `data.detections[0]`가 같은 대표 객체를 가리키는 것으로 본다. Post 생성/조회 응답의 최종 저장 필드는 root `freshnessLabel`, `confidenceScore`, `detectedFruit`, `detectedFruitKo`다. 프론트 타입은 과거/호환 응답을 방어적으로 받기 위해 root `freshnessLabel`, `confidenceScore`, `isFresh`, `aiAnalysis.rejectionReason`, `aiAnalysis.reviewReason`을 optional로 유지한다.

`detections[]` MVP 계약:

| 필드 | 타입 | MVP 값 |
| --- | --- | --- |
| `id` | `string` | `"detection-1"` |
| `label` | `string` | AI 감지 영문명 |
| `labelKo` | `string` | AI 감지 한국어명 |
| `freshnessLabel` | `Fresh` / `Mid` / `Stale` | 대표 객체 신선도 |
| `confidenceScore` | `number` | 0.0~1.0 |
| `shareable` | `boolean` | 최종 등록 대상 여부. `false`는 앱에서 제외 표시 |
| `bbox` | `object \| null` | 원본 이미지 기준 절대 픽셀 rectangle. 구형 classification 응답은 `null` |

**에러 시 → 400 및 프론트 표시 정책**:

| 상황                      | 서버 응답 기준                                           | 사용자-facing 표시                                                           |
| ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 나눔 기준 미충족(`Stale`) | generate 400. `imageToken` 미발급                         | "나눔 기준에 맞지 않아요. 다시 촬영해주세요."                                |
| AI 서버 장애              | generate 400/5xx 또는 네트워크 오류                      | "AI 분석 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."              |
| 비이미지 파일             | generate 400                                             | "지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 이미지만 업로드 가능합니다." |

> 2026-05-08 백엔드 답변 기준 generate 400에서 안정적으로 읽을 수 있는 필드는 FastAPI `detail`뿐이다. `message`, `analysisMessage`는 400 계약 필드가 아니다. 프론트는 `detail`을 읽되 사용자-facing 문구로 안전하게 번역한다.
> 단, `부패`, `상함`, `썩음`처럼 분쟁을 만들 수 있는 표현은 사용자-facing 문구에서 `나눔 기준에 맞지 않아요` 계열로 번역한다.

> 용어 기준: 현재 백엔드 AI 신선도 등급은 `Fresh`, `Mid`, `Stale`, `unknown`이다. 기존 프론트 문서의 `Normal`은 `Mid`와 같은 나눔 가능 그룹으로 취급한다. `Fresh/Mid`는 사용자 흐름에서 `상태가 좋아 보여요`와 `나눔 가능`으로 통합 표시한다. `Stale`은 **나눔 기준 미충족**으로 보고 분석 결과, 작성, 최종 등록 단계에서 모두 막는다. `unknown`은 바로 등록 가능한 상태로 보지 않고 `확인 필요` 또는 실패 문구로 처리한다. `Bad/Rotten`은 현재 백엔드 label이 아니라 구형/후속 label로만 방어적으로 매핑한다.

> confidence 기준: `confidenceScore`는 **Stage 2 신선도 분류 모델의 softmax max 확률**이다. 객체 탐지 confidence나 식재료 여부 confidence가 아니다. "이 식재료가 Fresh/Mid/Stale 중 어떤 상태인지"에 대한 모델 확신도로 표시하며, 이 값 자체로 등록을 차단하지 않는다. 차단 기준은 `isFresh=false` 또는 나눔 기준 미충족 신선도 등급이다.
>
> confidence 표시 가이드: 제품 기준은 백엔드 답변을 따라 0.9 이상은 높은 확신, 0.9 미만은 사용자가 한 번 더 확인해야 하는 `확인 필요` 구간으로 본다. 이 구간은 등록 차단 기준이 아니라 UX 강조 기준이다.

> false-positive 계약: MVP 서버/AI 파이프라인은 스크린샷/UI 캡처 여부를 별도로 판별하지 못한다. 따라서 `isFresh=true`이면 낮은 `confidenceScore`에서도 `Fresh + imageToken`이 발급될 수 있으며, 프론트는 `확인 필요`를 표시하되 등록은 허용한다. 2026-05-23 기준 `rejectionReason`은 MVP 정상 응답에서 `null`이며, `stale`, `not_food`, `low_quality`, `screenshot`, `multi_object_review` 같은 non-null enum은 백엔드 Post-MVP 항목이다. 앱은 enum이 내려오면 방어적으로 등록 차단 UX를 표시한다.
>
> 서버 방어선: `Stale` 또는 `isFresh=false` 결과는 generate 단계에서 400으로 거부되며 `imageToken`이 발급되지 않는다. `POST /posts`는 `imageToken`이 필수이고, 만료/무효 토큰은 400으로 거부된다. 따라서 프론트의 `canShare=false` 가드는 UX 편의용이고, 실제 최종 방어선은 서버의 `imageToken` 체계다.

**사용자-facing AI 결과 문구**

| Internal result                | User-facing status                  | CTA                                          |
| ------------------------------ | ----------------------------------- | -------------------------------------------- |
| `Fresh`, `Mid` (`Normal` 그룹) | `상태가 좋아 보여요`, `나눔 가능`   | `이대로 나눔 등록하기`                       |
| `Stale`                        | `나눔 기준에 맞지 않아요`           | `다시 촬영하기`, `다른 사진 선택`            |
| `unknown`                      | `사진으로 상태를 확인하기 어려워요` | `다시 촬영하기`, `다른 사진 선택`            |
| `Bad`, `Rotten`                | `나눔 기준에 맞지 않아요`           | 현재 백엔드 label은 아니지만 방어적으로 차단 |
| `not_food`, `non_food`         | `식재료 사진으로 확인되지 않았어요` | Post-MVP enum. 내려오면 차단                 |
| `low_quality`                  | `사진으로 상태를 확인하기 어려워요` | Post-MVP enum. 내려오면 확인/재촬영 유도     |
| low `confidenceScore` only     | `상태를 한 번 더 확인해주세요`      | 등록 차단 아님                               |

### 4.5 나눔 식재료 등록

> ⚠️ **이미지 파일 업로드 없음!** generate에서 받은 `imageToken`을 JSON에 포함.

```
POST /api/v1/posts
Authorization: Bearer {token}
Content-Type: application/x-www-form-urlencoded
```

```javascript
const data = {
  fridgeId: 1,
  expirationDate: null,
  imageToken: generateResult.imageToken, // ← generate에서 받은 토큰
  flow: 'fridge_qr',
};

// ⚠️ 이미지 파일은 보내지 않음! (이미 generate에서 서버에 저장됨)

const response = await fetch(`${BASE_URL}/api/v1/posts`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: `data=${encodeURIComponent(JSON.stringify(data))}`,
});
```

**등록 후 백엔드 자동 처리**:

1. imageToken 검증 (존재 + 1시간 이내)
2. 공유 냉장고 검증 (존재 + 활성)
3. 검증된 이미지 → 최종 경로로 이동
4. `{imageToken}.json` sidecar에서 AI 메타데이터 복원
5. `shareable=true` 감지 품목별 개별 Post 저장 (`status = pending_store`, `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, 개별 `imageUrl`)
6. 보관 QR 인증 후 available 전환과 FCM 알림 발송

`Stale` 판정 이미지는 generate 단계에서 임시 저장까지 도달하지 않으므로 `imageToken`이 없다. generate를 우회해 `POST /posts`를 직접 호출해도 유효한 토큰이 없으면 등록되지 않는다.

> 2026-06-01 다중 일괄 등록 계약 기준 payload는 `fridgeId`, `imageToken`, 선택 `expirationDate`, `flow`다. 앱 정식 흐름은 `flow: "fridge_qr"`를 보낸다. `expirationDate`가 `null` 또는 누락되면 서버가 품목별 보관 규칙으로 자동 산정한다. AI 메타데이터, `selectedDetectionId`, `bbox`, 객체별 crop 데이터는 create payload에 보내지 않는다. 응답 `data`는 단일 Post가 아니라 `PostRead[]` 배열이다.
>
> 2026-05-06 live VM conflict: 공개 fresh fixture로 `generate -> create -> detail`을 실행했을 때 생성된 Post id `2`의 AI 필드가 모두 `null`이었다. 2026-05-08 백엔드 답변 기준 이 현상은 백엔드 버그로 확정됐고, `save_temp_image()`/`move_temp_to_final()` sidecar 저장/복원 방식으로 VM 재배포 완료됐다. 프론트는 기존 null 데이터 fallback을 MVP에서 유지한다.

**에러**:

- 만료/잘못된 토큰 → 400 "이미지가 만료되었거나 유효하지 않습니다. 다시 촬영해주세요."

### 4.6 근처 나눔 식재료 조회

```
GET /api/v1/posts/nearby?latitude=35.1595&longitude=126.9136&radius_km=2.0&skip=0&limit=50
Authorization: Bearer {token}
```

### 4.7 나눔 식재료 상세 조회

```
GET /api/v1/posts/{post_id}
Authorization: Bearer {token}
```

**응답 필드 주의**:

실제 검증된 상세 응답은 작성자 필드로 `authorId`를 반환한다.

```json
{
  "success": true,
  "message": "나눔 식재료 상세 조회 성공",
  "data": {
    "id": 7,
    "authorId": 10,
    "fridgeId": 1,
    "detectedFruitKo": "사과",
    "freshnessLabel": "Fresh",
    "confidenceScore": 0.92,
    "imageUrl": "/static/uploads/posts/10/85f9f3d4-e5ce-44ae-af5b-7aa5fe6260c9.png",
    "expirationDate": "2026-05-08",
    "status": "available",
    "latitude": 35.1595,
    "longitude": 126.9136,
    "createdAt": "2026-05-05T09:17:02.058243",
    "updatedAt": "2026-05-05T09:17:02.058252"
  }
}
```

> 서버 `message`에 구형 표현인 `게시글`이 남아 있을 수 있다. 실제 서버 응답 증거로는 기록하되, 앱 UI와 제품 문서에서는 **나눔 식재료**로 번역한다.
>
> `status: "available"`은 보관 QR 인증이 끝나 수요자가 신청할 수 있는 **나눔 상태**다. 정식 QR 흐름은 `pending_store -> available -> requested -> completed`이며, 작성자/신청자 취소는 `cancelled`, 서버 배치/lazy-expire 만료는 `expired`로 전이된다. `requested`는 수요자의 나눔 신청이 접수되고 30분 임시 선점이 걸린 상태이며 예약 확정이 아니다. `reserved`는 사용하지 않는다.
>
> 작성자 여부 판단은 `authorId` 기준으로 처리한다. 구형 fixture의 `userId`는 호환용 fallback으로만 본다.
>
> 백엔드 Phase 1.5 이후 Post DB 컬럼에서 `title`, `description`, `category`는 제거됐고, `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`가 추가됐다. 2026-05-08 수정 후 신규 생성 Post는 generate 단계의 서버 sidecar AI 메타데이터를 create 시점에 복원한다. 기존 null 데이터는 마이그레이션하지 않으므로 앱 fallback은 유지한다.

### 4.8 나눔 신청하기

상세 화면의 `나눔 신청하기` CTA는 이 API에 연결되어 있다. 백엔드는 구현 및 VM 검증이 완료됐고, 프론트는 API client, CTA, 성공/실패 상태, 홈/지도 목록 갱신 신호를 코드에 반영했다. 2026-05-08 실제 Android UI QA에서 신청 후 `requested` 전환과 홈/지도 available 목록 제외를 확인했다.

```
POST /api/v1/posts/{post_id}/requests
Authorization: Bearer {token}
```

**계약**

| 항목             | 기준                                                            |
| ---------------- | --------------------------------------------------------------- |
| 대상             | `status=available`인 나눔 식재료                                |
| 요청자           | 작성자가 아닌 인증 사용자                                       |
| 성공 효과        | 첫 신청을 접수하고 나눔 상태를 `requested`로 변경               |
| 성공 응답        | 신청 접수 객체와 갱신된 나눔 식재료를 함께 반환                 |
| 작성자 본인 신청 | 403                                                             |
| 동시 경합        | 서버가 `SELECT ... FOR UPDATE` 행 잠금과 단일 트랜잭션으로 처리 |
| 중복/경합        | 이미 `requested`인 경우 409                                     |
| 사용자 문구      | `신청이 접수됐어요`, `공급자에게 신청 알림을 보냈어요`          |
| 금지 문구        | `예약 확정`, `수령 완료`, `결제 완료`                           |

**응답 (201)**:

```json
{
  "success": true,
  "data": {
    "request": {
      "id": 1,
      "postId": 1,
      "requesterId": 2,
      "status": "requested",
      "createdAt": "2026-05-06T12:00:00"
    },
    "post": {
      "id": 1,
      "authorId": 1,
      "fridgeId": 1,
      "detectedFruit": "apple",
      "status": "requested",
      "detectedFruitKo": "사과",
      "freshnessLabel": "Fresh",
      "confidenceScore": 0.92
    }
  },
  "message": "나눔 신청이 완료되었습니다."
}
```

프론트 처리 기준:

- 201: 상세 CTA를 신청 접수 상태로 바꾸고 홈 `/posts/nearby` 재조회 또는 해당 항목 제거를 트리거한다.
- 403: 작성자 본인 신청이다. 상세 화면에서는 애초에 신청 CTA를 숨기거나 비활성화하고, fallback으로 `내가 등록한 나눔 식재료예요` 계열 문구를 표시한다.
- 409: 이미 다른 신청이 접수된 상태다. 동시 신청 경합에서 정상적으로 발생할 수 있으므로 `다른 사용자가 먼저 신청했어요` 또는 `이미 신청이 접수된 나눔이에요` 계열 문구를 표시하고 CTA를 비활성화한다.

### 4.9 나눔 식재료 삭제

```
DELETE /api/v1/posts/{post_id}
Authorization: Bearer {token}
```

> 작성자 본인만 삭제 가능 (403 반환)

### 4.9-A 계정 단위 나눔 lifecycle

내 나눔 목록:

```text
GET /api/v1/users/me/posts?status=available,requested,completed,cancelled,expired,pending_store,disposed&skip=0&limit=20
Authorization: Bearer {token}
```

응답은 `PostRead[]`이며 `fridgeName`이 포함된다. 작성자가 삭제한 Post는 hard delete되어 목록에 남지 않는다. 운영자 폐기 항목은 작성자가 사유를 인지할 수 있도록 `disposed` 상태로 목록에 포함한다. `pending_store` 입고 만료는 서버 배치/lazy-expire로 `cancelled` 전이되며, 프론트는 별도 만료 API를 호출하지 않는다. 화면에서 입고/보관 deadline을 표시할 때는 `storageDeadlineAt`을 사용하고, 구형 fixture의 `storeExpiresAt`은 호환 fallback으로만 본다.

받은 나눔/신청 목록:

```text
GET /api/v1/users/me/share-requests?status=requested,completed,cancelled,expired&skip=0&limit=20
Authorization: Bearer {token}
```

응답은 `{ request, post }[]` 중첩 구조다. `post.fridgeName`, `post.labelCode`, `post.storageZone`, `post.requestExpiresAt`, `post.imageUrl`, `post.expirationDate`를 화면 표시와 QR 재진입에 사용한다. 목록 API는 fridge `publicCode`를 노출하지 않는다.

작성자 취소 mutation:

```text
POST /api/v1/posts/{post_id}/cancel
Authorization: Bearer {token}
```

- cancel: `available`, `requested`, `pending_store`에서 작성자 본인만 가능하다. `requested` 취소 시 연결된 `ShareRequest`도 `cancelled`가 된다.
- 작성자 완료 API는 앱 제품 흐름에서 사용하지 않는다. 정식 완료 기준은 수요자 `confirm-pickup`이다.
- expire: 사용자 호출 API를 사용하지 않는다. 만료는 서버 배치가 처리한다.

신청자 취소:

```text
POST /api/v1/users/me/share-requests/{request_id}/cancel
Authorization: Bearer {token}
```

신청자 본인의 `requested` 신청만 취소할 수 있다. 성공 시 `ShareRequest.status = cancelled`, 묶여 있던 `Post.status = available`로 복원된다.

### 4.10 근처 냉장고 조회

```
GET /api/v1/fridges/nearby?latitude=35.1595&longitude=126.9136&radius_km=2.0
Authorization: Bearer {token}
```

### 4.11 등록 가능 냉장고

```
GET /api/v1/fridges/available?latitude=35.1595&longitude=126.9136&radius_km=2.0
Authorization: Bearer {token}
```

### 4.12 냉장고별 나눔 식재료 조회

```
GET /api/v1/fridges/{fridge_id}/posts?status=available
Authorization: Bearer {token}
```

지도/냉장고 상세에서 특정 공유 냉장고 안의 available 나눔 식재료를 보여주기 위한 API다. 프론트는 `getFridgePosts(fridgeId, 'available')` client를 통해 지도 냉장고 선택 시 이 목록을 조회한다. 목록 항목은 `PostDetail`로 이동하며, loading/error/empty 상태는 냉장고 목록 상태와 별도로 관리한다.

응답 스키마는 `/posts/nearby`와 같은 `PostNearbyRead`이다. `GET /posts/{id}`의 `PostRead` 전체 필드셋과 동일하지 않다.

| 필드 | `PostRead` | `PostNearbyRead` |
| ---- | ---------- | ---------------- |
| `detectedFruit` | ✅ | ✅ |
| `detectedFruitKo` | ✅ | ✅ |
| `freshnessLabel` | ✅ | ✅ |
| `confidenceScore` | ✅ | ❌ |
| `authorId` | ✅ | ❌ |
| `latitude`/`longitude` | ✅ | ❌ |
| `updatedAt` | ✅ | ❌ |
| `fridgeName` | ❌ | ✅ |

`status=available`은 정확히 `status == "available"`인 항목만 반환한다. `requested`, `completed`는 제외된다.

### 4.13 운영자 Inventory API

> 2026-05-25 VM runtime QA 완료. `localhost:8080`에서 운영자/비운영자 권한, 빈 냉장고, `available`/`expired` dispose 성공, `requested` dispose 409, dispose 후 operator items 및 냉장고 available 목록 제외를 확인했다.
> 2026-05-27 백엔드 회신 기준 `/auth/me`가 `isOperator`, `operatorRole`, `operatorFridgeIds`를 내려준다. 앱 프로필 진입점은 이 metadata로 운영자 콘솔을 노출한다.

#### Inventory summary

```text
GET /api/v1/operator/fridges/{fridgeId}/inventory/summary
Authorization: Bearer {token}
```

**응답 (200)**:

```json
{
  "fridgeId": 1,
  "fridgeName": "광주역 공유냉장고",
  "total": 5,
  "available": 3,
  "requested": 1,
  "expired": 1,
  "disposedToday": 0
}
```

프론트 내부 화면은 요약 카드 표현을 위해 `totalItems`, `availableItems`, `requestedItems`, `expiredItems`, `disposedItems` 계열 이름을 사용할 수 있지만, API adapter에서는 위 백엔드 필드를 canonical로 normalize한다.

#### Inventory items

```text
GET /api/v1/operator/fridges/{fridgeId}/inventory/items
Authorization: Bearer {token}
```

**응답 (200)**: `PostRead[]` camelCase 배열.

```json
[
  {
    "id": 42,
    "authorId": 7,
    "fridgeId": 1,
    "detectedFruit": "apple",
    "detectedFruitKo": "사과",
    "freshnessLabel": "Fresh",
    "confidenceScore": 0.95,
    "imageUrl": "/static/uploads/posts/7/abc.jpg",
    "expirationDate": "2026-05-25",
    "status": "available",
    "labelCode": "#03",
    "storageZone": "GENERAL",
    "storedAt": "2026-05-23T10:00:00Z",
    "storageDeadlineAt": "2026-05-26T10:00:00Z",
    "requestExpiresAt": null,
    "pickedUpAt": null,
    "createdAt": "2026-05-23T09:50:00Z",
    "updatedAt": "2026-05-23T10:00:00Z",
    "latitude": 35.1595,
    "longitude": 126.8526
  }
]
```

#### Dispose

```text
PATCH /api/v1/operator/items/{postId}/dispose
Authorization: Bearer {token}
```

**응답 (200)**: `PostRead` 전체 필드, `status: "disposed"`.

권한/상태별 응답:

| 시나리오 | HTTP | 프론트 처리 |
| --- | --- | --- |
| 운영자 권한 있음 | 200 | summary/items 재조회 |
| 운영자 권한 없음 | 403 | 샘플 fallback 숨김, 권한 안내 표시 |
| 냉장고 없음 | 404 | 오류 안내 및 재시도 |
| inventory 없음 | 200 | summary `total: 0`, items `[]` empty state |
| 폐기 불가 상태 | 409 | 서버 메시지 표시. `requested`, `completed`, `pending_store`, `cancelled`, `disposed`는 폐기 불가 |

Dispose 일관성 기준:

1. 성공 응답은 해당 item `status=disposed`.
2. summary 재조회 시 `total` 감소, `disposedToday` 증가.
3. items 재조회 시 disposed 항목 미포함.
4. `/posts/nearby`와 `/fridges/{id}/posts`에서도 disposed 항목 미포함.

2026-05-25 VM evidence:

- 운영자 계정: `optest@foodlink.com`, fridge 1/3 권한.
- 비운영자 계정: `codex_fcm_b_1779690163@example.com`.
- 테스트 데이터: `QA3-A` available, `QA3-E` expired, `QA3-R` requested.
- 결과: 무인증 summary 401, 비운영자 summary/items/dispose 403, fridge 3 summary `total=0` 및 items `[]`, fridge 999999 summary 404, requested dispose 409, available/expired dispose 200, disposed 항목은 operator items와 `/fridges/1/posts?status=available`에서 제외.
- 원본 evidence: `temp/operator-inventory-vm-qa-20260525.json`.

### 4.14 Trust feedback, report, provider summary

2026-06-04 백엔드 회신 기준 실제 endpoint가 확정됐다. 상세 운영 기준은 [TRUST_FEEDBACK_OPERATING_MODEL.md](./TRUST_FEEDBACK_OPERATING_MODEL.md)와 [BACKEND_TRUST_FEEDBACK_RESPONSE_2026-06-04.md](./BACKEND_TRUST_FEEDBACK_RESPONSE_2026-06-04.md)를 따른다.

평가 생성:

```text
POST /api/v1/share-requests/{requestId}/review
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "positiveTagIds": ["good_condition", "matched_photo"],
  "issueTagIds": ["label_hard_to_find"]
}
```

신고 생성:

```text
POST /api/v1/share-requests/{requestId}/report
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "reasonId": "missing_or_not_found"
}
```

권한/상태 기준:

| 상황 | 상태 |
| --- | --- |
| 미인증 | 401 |
| 요청자 불일치 또는 작성자 본인 자기 나눔 평가/신고 | 403 |
| 신청 또는 나눔 식재료가 `completed`가 아님 | 409 |
| 중복 평가 | 409 |
| 미지원 평가 태그 또는 신고 사유 | 422 |

공급자 신뢰 요약:

```text
GET /api/v1/users/{userId}/trust-summary
Authorization: Bearer {token}
```

```json
{
  "success": true,
  "data": {
    "userId": 4,
    "completedShares": 12,
    "positiveReviewCount": 9,
    "matchedPhotoCount": 8,
    "easyToFindCount": 7,
    "badges": ["store_qr_verified", "completed_pickup", "positive_reviews"],
    "computedAt": "2026-06-04T12:10:00.000Z"
  }
}
```

프론트 표시 기준:

- `badges`에 `store_qr_verified`가 있으면 `QR 보관 인증` 뱃지 표시.
- `completedShares`는 `수령 완료 {n}회`.
- `positiveReviewCount`는 사용자-facing 화면에서 `긍정 평가 {n}회`.
- 신고 처리 상태, 신고 건수, 제재 이력은 공개 상세/프로필에 표시하지 않는다.

---

## 5. 이미지 URL 처리

나눔 식재료의 `imageUrl`은 **상대 경로**이다. 앱에서 이미지 표시 시 Base URL을 앞에 붙여야 한다.

```javascript
const imageFullUrl = `${BASE_URL}${post.imageUrl}`;
// → "http://10.0.2.2:8080/static/uploads/posts/1/abc123.jpg"

<Image source={{ uri: imageFullUrl }} />;
```

---

## 6. FCM 푸시 알림

현재 앱은 FCM 토큰을 받아 `/auth/me/location`에 등록하고, `share_created`, `share_requested` 수신 기록을 알림함에 저장한다. 백엔드는 나눔 식재료 등록 시 `share_created`, 나눔 신청 시 `share_requested` 알림을 발송한다. FCM 제약상 `data` payload의 모든 값은 문자열이며, 키는 camelCase다. 읽음 상태 API, 서버 알림 목록 API, 디버그 테스트 발송 API는 아직 없다.

2026-05-25 QA 기준으로 Android `priority: high`, iOS `apns-priority: 10`, per-token failure log, `[FCM:share_created]`/`[FCM:share_requested]` 로그 prefix가 VM에 반영된 상태를 확인했다. 프론트는 실기기+에뮬레이터 2계정, debug/release, background/terminated/process-killed/lockscreen, Android 14/15 matrix에서 notification tap routing을 확인했다.

발송 조건:

- `share_created`: 냉장고 반경 2km 안에 FCM 토큰이 등록된 다른 사용자가 있어야 한다. 작성자 본인에게는 발송하지 않는다.
- `share_requested`: 공급자(작성자)의 `fcmToken`이 `/auth/me/location`으로 등록되어 있어야 한다.
- VM에 Firebase credentials가 없으면 실제 발송 대신 Mock FCM 로그가 남는다.

### 설정 순서

1. Firebase 프로젝트: `greennode-94eae`
2. `@react-native-firebase/app` + `@react-native-firebase/messaging` 설치
3. `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) 배치

### 자격증명 경계

- `android/app/google-services.json`: Android package `com.greennode`용 Firebase 클라이언트 설정 파일이다. 앱이 Firebase로 초기화되고 FCM token을 발급받기 위해 필요하다. 이 파일이 없으면 `android/app/build.gradle`은 Google Services plugin을 적용하지 않고 Firebase services를 비활성화한다.
- `GoogleService-Info.plist`: iOS용 Firebase 클라이언트 설정 파일이다. 현재 MVP 실수신 QA는 Android 기준으로 진행한다.
- Firebase Admin/service account credentials: 백엔드가 실제 FCM 메시지를 발송할 때 필요한 서버용 자격증명이다. 앱/프론트 repo에 넣지 않고 NHN Cloud VM 또는 백엔드 배포 환경의 secret으로 관리해야 한다.
- `2026-GreenNode.pem`: NHN Cloud VM SSH 접속과 터널을 위한 키다. Firebase 앱 초기화, FCM token 발급, FCM 서버 발송 권한을 대신할 수 없다.

FCM 실수신 QA를 하려면 클라이언트 설정 파일과 서버 발송 자격증명이 모두 필요하다. `google-services.json`만 있으면 앱 token 발급 경로를 확인할 수 있지만, `share_created`/`share_requested` 실제 수신까지 검증하려면 백엔드 VM이 Firebase Admin/service account credentials로 실제 발송해야 한다. VM에 credentials가 없으면 `[Mock FCM]` 계열 로그만 남을 수 있다.

2026-05-21 QA note: Android client config `android/app/google-services.json`은 로컬에 있고 gitignored 상태다. Firebase project는 `greennode-94eae`, Android package는 `com.greennode`다. NHN Cloud VM Firebase Admin credentials도 `greennode-94eae`로 맞췄고 VM 경로는 `/home/ubuntu/foodlink/credentials/firebase-service-account.json`, API container mount 경로는 `/app/credentials/firebase-service-account.json`이다. credential 내용은 repo나 문서에 남기지 않는다. 정렬 이후 emulator QA에서 `share_created`, `share_requested` 실제 send가 backend log success 1 / failure 0으로 확인됐고, foreground는 로컬 알림 탭 기록, background는 system notification 표시와 post detail tap routing까지 확인했다. 2026-05-25에는 backend high priority 재배포 후 실기기/에뮬레이터 2계정과 release/process-killed/lockscreen tap routing을 재검증해 `PostDetail` 진입을 확인했다.

2026-05-23 backend handoff의 Android `priority: high`, iOS `apns-priority: 10`, per-token `response.responses` 순회 로그, FCM type별 prefix 항목은 2026-05-25 VM 재배포 후 프론트 QA에서 확인했다. Android 13 또는 추가 OEM 기기는 확보 시 참고 매트릭스로만 보강한다.

### 토큰 등록

```javascript
const fcmToken = await getFcmToken();
// → PUT /api/v1/auth/me/location 으로 서버에 등록
```

앱 구현 기준:

- 위치 설정 화면은 진입 즉시 알림 권한을 요청하지 않고 `나눔 알림 받기` CTA로 권한 요청을 시작한다.
- Android 13 이상에서 `POST_NOTIFICATIONS`가 거부되면 Firebase permission/register/getToken을 호출하지 않고 `fcmToken` 없이 위치 등록을 계속한다.
- Firebase 설정 파일이 없는 QA/release 빌드에서는 FCM 토큰 조회를 건너뛰고 앱 흐름을 유지한다.

### 알림 수신

```typescript
type FoodLinkFcmPayload =
  | {type: 'share_created'; postId: string; fruitName: string; fridgeName: string}
  | {type: 'share_requested'; postId: string; requestId: string; fruitName: string; fridgeName: string};
```

앱 구현 기준:

- `index.js`에서 background handler를 등록한다.
- `AppNavigator`에서 foreground, opened-app, initial-notification handler를 등록한다.
- handler는 `data` payload가 문자열 + camelCase인지 검증하고, 유효한 이벤트만 로컬 알림함에 저장한다.
- foreground 수신은 즉시 화면을 이동하지 않고 알림함 기록만 남긴다.
- background/terminated 상태에서 알림을 열면 대상 화면으로 이동한다. 2026-05-25 backend Android FCM priority `high` 적용 후 실기기, emulator, release/process-killed, Samsung lockscreen tap routing에서 `PostDetail` 진입을 재검증했다.

수신 분기 기준:

- `share_created`: 홈 또는 나눔 식재료 상세로 이동한다.
- `share_requested`: 내 나눔 식재료 관리/신청 확인 흐름으로 이동한다. 현재 해당 화면이 없으므로 MVP에서는 나눔 식재료 상세로 fallback한다.

### 알림 데이터 형식

등록 알림:

```json
{
  "notification": {
    "title": "📢 근처에 새 나눔 식재료가 등록되었습니다!",
    "body": "바나나 나눔이 등록되었습니다."
  },
  "data": {
    "type": "share_created",
    "postId": "42",
    "fruitName": "바나나",
    "fridgeName": "광주역 공유냉장고"
  },
  "android": {"priority": "high"},
  "apns": {"headers": {"apns-priority": "10"}}
}
```

신청 알림:

```json
{
  "notification": {
    "title": "나눔 신청이 도착했어요",
    "body": "사과 나눔에 신청이 접수되었습니다"
  },
  "data": {
    "type": "share_requested",
    "postId": "1",
    "requestId": "1",
    "fruitName": "사과",
    "fridgeName": "전남대학교 공유냉장고"
  }
}
```

### 백엔드 FCM 로그 확인

배포 후 백엔드 로그는 아래 기준으로 확인한다.

```bash
docker compose logs api | grep FCM
```

| 상태 | 로그 패턴 예시 |
| --- | --- |
| 실제 FCM 발송 성공 | `[FCM:share_created] OK token=abc...` |
| 실제 FCM 발송 실패 | `[FCM:share_created] FAIL token=abc... code=INVALID_ARGUMENT` |
| 수신 대상 token 없음 | `[FCM:share_created] 토큰 없음 — 사용자 3명 중 FCM 토큰 0개` |
| 반경 내 대상 없음 | `[FCM:share_created] 대상 없음 — 반경 내 사용자 0명` |
| Firebase credentials 문제 | `[FCM:share_created] Mock 발송 — Firebase 미초기화` |
| Mock FCM 발송 | `[Mock FCM] 알림 발송 (3건)` |
| invalid/expired token | `[FCM:share_created] FAIL token=... code=UNREGISTERED` |

---

## 6-A. Post-MVP 계획 계약

이 섹션은 일부 항목이 아직 live VM에서 보장되는 endpoint가 아닌 2026-05-29 제품/계약 결정이다. 구현 전에는 [POST_MVP_PRODUCT_CONTRACT_DECISIONS.md](./POST_MVP_PRODUCT_CONTRACT_DECISIONS.md), [BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md](./BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md), [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)를 함께 확인한다.

2026-05-29 live VM 확인 결과는 [BACKEND_POST_MVP_CONTRACT_BLOCKERS_2026-05-29.md](./BACKEND_POST_MVP_CONTRACT_BLOCKERS_2026-05-29.md)에 분리했다. 현재 VM은 알림 endpoint, impact summary, email verification path를 OpenAPI에 노출하지 않고, nearby discovery endpoint에도 `q` parameter가 없다. AI fixture는 explicit `rejectionReason`/`reviewReason` 계약이 아직 충족되지 않는다.

2026-05-29 백엔드 회신 기준 notifications와 server search는 구현 완료로 보고됐지만 live VM/OpenAPI 재검증 전까지 확정하지 않는다. Impact는 회신 내부에서 구현 상태가 상충한다. AI 실제 분류 정확도와 multi-object detection은 현재 모델 한계로 Phase 4 항목이다.

### AI rejection/review reason

`POST /api/v1/posts/generate`는 hard block과 soft review를 분리한다.

| Field | Meaning | App behavior |
| --- | --- | --- |
| `rejectionReason` | 등록 차단 사유 | `imageToken` 없음, 등록 흐름 차단 |
| `reviewReason` | 사용자 재확인 사유 | `imageToken` 있음, `확인 필요` 표시 후 등록 가능 |

Hard block enum은 `stale`, `not_food`, `low_quality`, `screenshot`, `ui_screenshot`이다. Soft review enum은 `review_required`, `multi_object_review`, `low_confidence`, `low_quality`, `screenshot`, `ui_screenshot`이다.

Hard block 응답은 400을 기본으로 한다.

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

프론트 에러 문구 경로는 generic `message`보다 구조화된 `error.rejectionReason`을 우선한다. `stale`은 나눔 기준 미충족, `not_food`/`non_food`/`screenshot`/`ui_screenshot`은 식재료 사진 아님, `low_quality`는 상태 확인 어려움 문구로 번역한다.

Soft review 응답은 기존 generate 200 payload에 `reviewReason`을 추가한다.

현재 AI 모델은 비식재료, 스크린샷/UI, 저품질 이미지를 실제로 판별하지 못한다. 모델 고도화 전에는 full fixture strict 통과가 아니라 reason 필드 shape와 generic 400 제거만 검증한다.

### Multi-object batch registration

2026-06-01 백엔드 다중 일괄 등록 계약 기준으로 `POST /posts/generate`는 이미지 안의 감지 결과를 `detections[]`로 내려주고, `POST /posts`는 같은 `imageToken`에 연결된 `shareable=true` 품목을 개별 나눔 식재료로 생성해 `PostRead[]` 배열을 반환한다. 앱은 대표 후보를 선택하거나 `selectedDetectionId`를 보내지 않는다. `shareable=false` 품목은 분석/등록 확인 화면에서 제외 대상으로 표시하고, 최종 등록 응답에는 포함되지 않는 것으로 본다.

```json
{
  "imageToken": "image-token",
  "detections": [
    {
      "id": "detection-1",
      "label": "banana",
      "labelKo": "바나나",
      "freshnessLabel": "Fresh",
      "confidenceScore": 0.91,
      "shareable": true,
      "bbox": {"x": 120, "y": 180, "width": 310, "height": 420}
    }
  ]
}
```

`bbox`는 원본 이미지 기준 절대 픽셀 rectangle이다. 기존 `bbox: null`은 호환 값으로 계속 허용한다. 최종 등록 후 앱은 반환된 각 `PostRead.imageUrl`을 그대로 사용하며, 프론트에서 원본 이미지를 수동 crop하지 않는다.

현재 앱의 QR 화면은 실제 인증 API 호출은 한 번에 하나의 `postId`로 수행하되, 일괄 등록 성공 시 생성된 품목 queue를 route param으로 함께 넘겨 `1/N` 진행률과 다음 품목 CTA를 표시한다. 각 품목은 같은 냉장고 QR을 순차 인증하고, 마지막 품목까지 완료하면 배치 보관 인증이 끝난다.

### Server-backed notifications

서버 저장형 알림은 Post-MVP에서 source of truth가 된다. 로컬 FCM 기록은 offline/foreground fallback cache로 유지한다.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/notifications?unreadOnly=false&skip=0&limit=50` | 계정 알림 목록 |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | 단일 읽음 처리 |
| `PATCH` | `/api/v1/notifications/read-all` | 전체 읽음 처리 |
| `DELETE` | `/api/v1/notifications/{notificationId}` | 단일 삭제 |

앱 merge rule은 `type + postId + requestId` event key dedupe다. 같은 이벤트가 로컬 FCM 기록과 서버 record에 모두 있으면 서버 record가 우선한다.

백엔드가 구현 완료로 회신했으나, live VM에서 4 endpoint와 권한 규칙을 확인하기 전까지 앱은 기존 로컬 FCM fallback을 유지한다.

### Impact summary

환경 성취 지표는 backend-computed estimate로만 표시한다.

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

집계 대상은 `completed` 또는 `picked_up`으로 확인된 나눔 식재료뿐이다. UI는 factor source가 확정되기 전까지 `추정 절감`으로 표시한다.

백엔드 회신에서 impact 구현 상태가 상충하므로, live VM response shape 확인 전에는 앱 숫자 UI를 연결하지 않는다.
프론트 client와 `npm run qa:post-mvp-contracts`는 배포 전환 중 camelCase와 snake_case 응답, 숫자형 문자열을 모두 수용한다. 앱 내부 타입은 `totalShared`, `completedShares`, `estimatedFoodSavedGrams`, `estimatedCarbonSavedGrams`, `calculationVersion`, `computedAt` camelCase 필드로 정규화하되, 지표 값은 숫자 타입으로 고정한다.

### Server search

서버 검색은 별도 global search endpoint가 아니라 기존 discovery endpoint 확장으로 둔다.

```text
GET /api/v1/posts/nearby?latitude=...&longitude=...&radius_km=2&q=바나나&skip=0&limit=20
GET /api/v1/fridges/nearby?latitude=...&longitude=...&radius_km=2&q=광주역&skip=0&limit=20
```

검색 대상은 나눔 식재료명, 공유 냉장고명, 공유 냉장고 주소다. 정렬은 거리 우선, 같은 거리권에서는 최신순이다.

백엔드가 구현 완료로 회신했으므로 OpenAPI에 `q`, `skip`, `limit`가 실제 노출되는지 확인한 뒤 로컬 필터 fallback에서 이관한다.

### Email verification and social login

Email verification과 social login은 이번 immediate scope에서 제외하고 Phase 4 auth expansion으로 묶는다. 상세 정책, 에러, 계정 병합, 프론트 gate 기준은 [AUTH_EXPANSION_PHASE4_CONTRACT.md](./AUTH_EXPANSION_PHASE4_CONTRACT.md)를 따른다.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/email-verifications` | 인증 메일 발송 |
| `POST` | `/api/v1/auth/email-verifications/confirm` | 토큰 확인 |
| `GET` | `/api/v1/auth/me` | `emailVerifiedAt`, 선택 `linkedProviders` 반환 |

Verification 전에도 browsing과 위치 등록은 허용한다. 나눔 식재료 등록, 나눔 신청, 신뢰 피드백, 운영자 action은 verification 이후로 제한한다. 프론트는 `/auth/me.emailVerifiedAt: null`을 방어적으로 처리할 수 있지만, 실제 email verification flow와 Google/Apple social login 버튼은 backend provider token 교환 endpoint와 native provider SDK 연동이 준비될 때까지 숨기거나 비활성화한다.

### Operator role management and WebSocket chat

소비자 앱은 role grant/revoke UI를 제공하지 않는다. 앱은 `/auth/me`의 `isOperator`, `operatorRole`, `operatorFridgeIds`로 운영자 콘솔 진입만 제어한다. Role 관리는 backend seed, admin CLI, 또는 별도 web backoffice 범위다.

WebSocket 채팅은 다음 구현 후보에서 제외한다. 알림 저장소와 lifecycle action이 안정화된 뒤 구조화된 문의/요청 메시지를 먼저 검토한다.

---

## 7. 추천 앱 흐름

### 온보딩

```
앱 실행 → 워크스루 슬라이드 → 로그인/회원가입
→ 위치 권한 요청 + FCM 토큰 획득
→ PUT /auth/me/location 호출
```

### 홈 화면

```
GET /posts/nearby → 근처 available 나눔 식재료
지도 탭: GET /fridges/nearby → 근처 공유 냉장고 목록
냉장고 내부 나눔 식재료 탐색 → GET /fridges/{id}/posts?status=available
냉장고 선택: GET /fridges/available → 등록 가능 공유 냉장고 목록
```

### 나눔 식재료 등록

```
카메라 촬영 → POST /posts/generate (AI 분석)
→ 추천 결과 표시 → 사용자 수정 → 냉장고 선택
→ POST /posts (최종 등록)
→ 근처 사용자에게 푸시 알림
```

### 나눔 신청

```
나눔 식재료 터치 → GET /posts/{id}
→ 이미지 + 상세 정보 + 보관 공유 냉장고 표시
→ 나눔 신청하기 (POST /posts/{id}/requests)
→ 성공 시 status: available -> requested
→ 홈 목록에서는 requested가 자동 제외됨
```

---

## 8. 주의사항 체크리스트

> 이 체크리스트의 빈 항목은 매 개발/QA 실행 때 확인할 조건이다. 구현 완료 여부는 2.2와 [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)를 기준으로 본다.

- [ ] SSH 터널 열어둔 상태에서 개발
- [ ] 로그인 요청은 `application/x-www-form-urlencoded` (JSON 아님)
- [ ] 로그인 필드명은 `username` (email 아님)
- [ ] **나눔 식재료 등록 전 반드시 generate 호출** → imageToken 획득
- [ ] **나눔 식재료 등록 시 이미지 파일 보내지 않음** → `application/x-www-form-urlencoded`의 `data=<JSON>`에 imageToken 포함
- [ ] generate에서 400 수신 시 FastAPI `detail`을 읽고 사용자-facing 안전 문구로 변환
- [ ] imageToken은 1시간 내 사용 (만료 시 다시 촬영)
- [ ] generate API Form 필드는 `image`, 선택 `user_hint`
- [ ] 이미지 URL은 상대경로 → Base URL 붙여서 사용
- [ ] JWT 토큰 만료 60분 → 401 수신 시 재로그인
- [ ] 앱 실행 시 위치는 갱신하고, FCM 토큰은 명시적 알림 권한 허용 또는 기존 저장 토큰이 있을 때만 서버에 등록
- [ ] 나눔 식재료 상세 작성자 판단은 실제 응답의 `authorId` 기준으로 처리
- [ ] `POST /posts`에는 `imageToken + fridgeId + flow`와 선택 `expirationDate`만 보내고 AI 메타데이터/`selectedDetectionId`/`bbox`는 재전송하지 않는다
- [x] `/fridges/{id}/posts`와 `/posts/nearby`는 `PostNearbyRead`라 `confidenceScore`가 없다
- [x] 백엔드 Phase 1.5 Post 구조 반영: `title/description/category` 의존 제거, 카드 요약은 `PostNearbyRead` 필드 중심, 상세/등록은 `detectedFruitKo/freshnessLabel/confidenceScore/status` 사용
- [x] 나눔 신청 API 연동: `POST /posts/{id}/requests`, 201/403/409 처리, 신청 후 상세/홈 상태 갱신
- [x] FCM payload는 문자열 + camelCase `postId`, `requestId`, `fruitName`, `fridgeName`, `type` 사용
