# Auth Expansion Phase 4 Contract

> 범위: 이메일 인증, Google/Apple 소셜 로그인. 이 계약은 현재 MVP 또는 immediate Post-MVP 앱 표면이 아니며, 해당 flow를 노출하기 전에 필요한 백엔드/프론트 합의 기준이다.

## 제품 경계

- 이메일/비밀번호 회원가입과 로그인은 백엔드 endpoint와 provider SDK 검증이 끝날 때까지 유일한 활성 로그인 경로로 유지한다.
- 모바일 앱은 provider token 교환 endpoint가 준비되기 전까지 Google/Apple 버튼을 활성 상태로 노출하지 않는다.
- `emailVerifiedAt`이 `null`이어도 browsing, 위치 설정, 주변 탐색, 지도 탐색, 프로필 조회는 허용한다.
- 나눔 식재료 등록, 나눔 신청, 신뢰 피드백, 운영자 inventory action은 이메일 인증 또는 백엔드가 검증 완료로 판단한 social provider 이후에만 허용한다.
- social provider email을 백엔드가 검증 완료로 신뢰할 수 없으면 이메일/비밀번호 사용자와 같은 이메일 인증 flow로 보낸다.

## 사용자 모델 추가

`GET /api/v1/auth/me`는 현재 세션의 source of truth로 유지한다.

```json
{
  "id": 1,
  "email": "user@example.com",
  "emailVerifiedAt": "2026-06-07T00:00:00Z",
  "linkedProviders": ["password", "google"]
}
```

규칙:

- `emailVerifiedAt`은 nullable이며 `email_verified_at`으로 내려올 수 있다. 앱은 두 필드를 이미 정규화한다.
- `linkedProviders`는 Phase 4 선택 필드다. 생략되면 앱은 `emailVerifiedAt`만 신뢰한다.
- provider 계정 식별자는 이메일이 아니라 provider stable subject 기준으로 저장한다.

## 이메일 인증 API

### 인증 메일 발송

```http
POST /api/v1/auth/email-verifications
Authorization: Bearer <FoodLink JWT>
Content-Type: application/json
```

```json
{
  "email": "user@example.com"
}
```

응답:

```json
{
  "success": true,
  "message": "인증 메일을 보냈습니다.",
  "data": {
    "email": "user@example.com",
    "expiresAt": "2026-06-07T00:30:00Z",
    "resendAfter": "2026-06-07T00:01:00Z"
  }
}
```

### 인증 토큰 확인

```http
POST /api/v1/auth/email-verifications/confirm
Authorization: Bearer <FoodLink JWT>
Content-Type: application/json
```

```json
{
  "token": "verification-token"
}
```

응답:

```json
{
  "success": true,
  "message": "이메일 인증이 완료되었습니다.",
  "data": {
    "emailVerifiedAt": "2026-06-07T00:10:00Z"
  }
}
```

상태 규칙:

| Status | Case |
| --- | --- |
| 200 | 이미 인증된 이메일 또는 토큰 확인 성공 |
| 400 | 이메일 누락 또는 토큰 형식 오류 |
| 401 | FoodLink JWT 없음 또는 만료 |
| 409 | 토큰 만료, 이미 사용된 토큰, 다른 계정에 묶인 토큰 |
| 422 | 로그인 계정 이메일과 요청 이메일 불일치 |
| 429 | 재발송 rate limit |

## 소셜 로그인 API

소셜 로그인은 provider token을 기존 이메일 로그인과 같은 `LoginResponse` shape로 교환한다.

### Google

```http
POST /api/v1/auth/social/google
Content-Type: application/json
```

```json
{
  "idToken": "google-id-token"
}
```

### Apple

```http
POST /api/v1/auth/social/apple
Content-Type: application/json
```

```json
{
  "identityToken": "apple-identity-token",
  "authorizationCode": "apple-authorization-code",
  "nonce": "nonce-used-by-client"
}
```

응답:

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

상태 규칙:

| Status | Case |
| --- | --- |
| 200 | 기존 provider 계정 로그인 |
| 201 | provider 계정으로 신규 FoodLink 사용자 생성 |
| 400 | provider token 누락 또는 요청 형식 오류 |
| 401 | provider token 검증 실패 |
| 409 | 명시적 계정 연결이 필요한 이메일/계정 병합 충돌 |
| 422 | 필수 provider claim 누락 |
| 500 | provider 검증 인프라 장애 |

## 계정 연결 정책

- 같은 provider subject는 항상 같은 FoodLink 사용자로 매핑한다.
- 기존 password 계정과 같은 verified email이 들어오면 두 계정을 모두 인증하는 별도 연결 flow가 없는 한 `409 account_link_required`를 반환한다.
- Apple private relay email은 provider email로 취급하고 password 계정과 자동 병합하지 않는다.
- Google/Apple이 verified email을 보장하면 사용자 생성 시 `emailVerifiedAt`을 즉시 채울 수 있다.

## 프론트 수용 기준

- 로그인 화면은 백엔드 endpoint와 native provider SDK 연동이 모두 준비되기 전까지 social button을 숨긴다.
- 소셜 로그인 성공 후 앱은 `accessToken`을 저장하고 `/auth/me`를 호출한 뒤 기존 이메일 로그인과 같은 위치 guard를 따른다.
- `emailVerifiedAt`이 `null`이면 나눔 식재료 등록, 나눔 신청, 신뢰 피드백, 운영자 action에서 mutation API를 호출하지 않고 이메일 인증 필요 상태를 보여준다.
- 인증 메일 발송/확인 실패는 provider 또는 token 내부 값을 노출하지 않는 사용자-facing 문구로 변환한다.
- 로그아웃은 pending provider state를 지우고 기존 token 제거 경로를 사용한다.

## 백엔드 수용 기준

- `/auth/me`는 모든 사용자에 대해 nullable `emailVerifiedAt`을 반환한다.
- 이메일 발송/확인 endpoint는 로그인 계정 소유권을 검증한다.
- 소셜 로그인 endpoint는 기존 `LoginResponse` shape를 반환하고, 발급된 JWT는 `/auth/me`에서 유효해야 한다.
- provider account record는 provider name, provider subject, email, email verified flag, linked FoodLink user id를 저장한다.
- 401/409/422 케이스는 backend contract test matrix에 포함한다.

## 검증 명령

```powershell
$env:FOODLINK_API_BASE_URL='http://localhost:8080'
npm run qa:post-mvp-contracts
```

Phase 4에서 앱 UI를 활성화하기 전 auth 전용 live VM 하네스를 추가한다.

```powershell
npm run qa:auth-expansion-contracts
```
