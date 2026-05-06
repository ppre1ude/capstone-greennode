# FoodLink Implementation Status

> **작성일**: 2026-05-06
> **기준 브랜치**: `codex/backend-phase1half-frontend-sync`
> **기준 문서**: [`VALIDATION_AND_BACKLOG.md`](./VALIDATION_AND_BACKLOG.md)

## Agent Workflow

- Authority: current implementation state summarized as implemented, partial,
  mock, missing, needs validation, bug, or deferred.
- Read before: reporting status, deciding whether work is already done, or
  preparing release/sprint summaries.
- Update when: a feature moves between status categories or verification changes
  what the team can claim.
- Required evidence: verification command, runtime/API evidence, or a pointer to
  the validation entry that proves the status.
- Related workflows: `document-release`, `retro`, `qa`, `triage-issue`.
- Source-of-truth conflicts: verified results in
  [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md) win over this summary.

이 문서는 초기 Phase 1~6 구현 리포트를 2026-05-05 MVP 검증 결과 기준으로 갱신한 것이다. 과거 문서의 일괄 완료 표현은 실제 서버/기기 검증 결과를 반영하지 못하므로, 현재는 `구현됨`, `부분 구현`, `목업`, `미구현`, `검증 필요`, `버그`로 분리한다.

## 2026-05-06 백엔드 Phase 1.5 동기화

백엔드가 `TEAM_FLOW_CHANGE_NOTICE_2026-05-06.md`를 반영해 VM 배포와 검증을 완료했다. 프론트 상태 문서에서는 이 답변을 다음 기준으로 해석한다.

- 백엔드 구현 완료: `share_requests` 테이블, `POST /posts/{id}/requests`, `available -> requested`, `SELECT ... FOR UPDATE` 동시 경합 처리, 403/409 처리, `share_created`/`share_requested` 알림, `GET /fridges/{id}/posts?status=available`.
- 백엔드 계약 변경: Post의 `title`, `description`, `category` 컬럼이 제거되고 `detectedFruitKo`, `freshnessLabel`, `confidenceScore` 중심 구조로 바뀌었다.
- AI 계약 확정: 백엔드 label은 `Fresh`, `Mid`, `Stale`, `unknown`이며, `Mid`는 기존 프론트의 `Normal` 그룹이다. `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률이다. 제품 기준은 백엔드 활용 가이드를 따라 0.9 미만을 `확인 필요` 구간으로 본다.
- 서버 최종 방어선: `Stale`이면 generate 400으로 `imageToken`이 발급되지 않고, create는 무효/만료 토큰을 400으로 거부한다. 프론트 `canShare`는 UX 가드다.
- 프론트 현재 상태: Post 구조 변경, 나눔 신청 API, 냉장고별 나눔 식재료 조회, FCM 수신 기록/알림함은 React Native 코드에 반영됐다. `src/types/post.ts`, `createPost()` payload, 홈 카드/상세/등록 화면은 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`, `imageToken` 중심으로 동작한다. 상세 화면은 `requestShare(postId)`로 `available -> requested`를 처리하고 홈 refresh 신호를 보낸다. 지도는 선택된 냉장고의 `GET /fridges/{id}/posts?status=available` 결과를 loading/error/empty/list 상태로 보여주고 항목 탭 시 상세로 이동한다. FCM은 문자열 + camelCase payload를 검증해 로컬 알림함에 기록하고, opened/initial 알림은 상세 화면으로 라우팅한다.

### 2026-05-06 VM/API QA 업데이트

- VM 접근: SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`로 `GET /health` 정상 응답을 확인했다.
- 통과: QA 계정 생성/로그인/위치 저장, 주변 냉장고 조회, `generate -> create -> nearby/fridge posts 포함 -> request -> requested 전환 -> nearby/fridge posts 제외`, 작성자 본인 신청 403, 첫 신청 201, 중복 신청 409, 무효 `imageToken` create 400을 확인했다.
- 상태 변경: 나눔 신청 API와 냉장고별 available 나눔 식재료 조회는 프론트 코드 연동과 VM/API 런타임 QA를 통과했다. 실제 Android UI 조작 QA와 실제 기기 FCM/카메라 QA는 별도다.
- 발견한 충돌: 백엔드 Phase 1.5 요약과 API 문서는 Post가 `detectedFruitKo/freshnessLabel/confidenceScore`를 저장한다고 설명하지만, live VM에서 생성한 Post id `2`의 상세 응답은 `detectedFruit/detectedFruitKo/freshnessLabel/confidenceScore=null`이었다. 판단 기준은 live VM API와 `GET /openapi.json`이며, 상세 증거와 후속 P0는 [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)에 기록했다.

### 2026-05-06 실제 Android 기기 QA 업데이트

- 기기: `SM-S928N` Android 15(API 35, serial `R3CX203CV8X`), release APK, `adb reverse tcp:8080 tcp:8080`, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`.
- 통과: 실제 기기에서 카메라 권한 허용, 프리뷰 표시, 셔터 촬영, `/posts/generate` 분석 결과 표시, 등록 화면 진입, 냉장고 선택, `POST /posts` 등록 완료, 완료 화면, 홈 복귀 후 `/posts/nearby` 재조회와 카드 표시, 카드 상세 진입을 확인했다.
- 수정: Firebase 설정 파일이 없는 release QA 빌드에서 `messaging()` 호출이 앱 시작 크래시를 일으켜, Messaging 인스턴스 생성 실패 시 알림 handler 등록을 건너뛰는 guard를 추가했다. 회귀 테스트는 `__tests__/notificationService.firebaseFallback.test.ts`다.
- 발견한 충돌: 등록 전 분석 결과는 `바나나 / 상태가 좋아 보여요 / 91%`였지만 등록 후 홈/상세는 `나눔 식재료 / 분석 중` fallback으로 표시됐다. VM/API QA에서 발견한 Post AI 메타데이터 저장 불일치가 실제 앱에서도 재현됐다.
- AI 품질 증거: 카메라는 화면상 토마토 이미지를 촬영했지만 백엔드 AI는 `바나나`로 판별했다. 이는 프론트 연동 오류가 아니라 false-positive/분류 품질 후속 검증 항목이다.

### 2026-05-06 무기기 QA 업데이트

- 수정: Firebase Messaging 인스턴스 획득을 `firebaseMessaging.ts` 공통 helper로 분리하고, 알림 handler뿐 아니라 FCM 토큰 조회 경로도 Firebase 설정 부재를 안전하게 건너뛰도록 보강했다. 회귀 테스트는 `__tests__/notificationService.firebaseFallback.test.ts`, `__tests__/deviceRegistration.firebaseFallback.test.ts`다.
- 수정: `docs/qa-fixtures/manifest.json`이 깨진 JSON이라 `qa:ai-fixtures`가 시작 전 실패할 수 있었다. manifest와 fixture README를 복구했다.
- 통과: 전체 Jest 16 suites / 76 tests, TypeScript `--noEmit`, ESLint `--quiet`, `scripts/validate-ai-fixtures.js`, Android `:app:assembleRelease`를 실제 기기 없이 통과했다.
- 남은 검증: fixture 이미지가 없어 `Stale`, `not-food`, `screenshot-or-ui`, `low-quality`, `multi-object` AI 품질 검증은 아직 skipped 상태다. 실제 FCM 메시지 수신도 별도 기기/FCM 환경이 필요하다.

### 2026-05-07 무기기 fixture/API/fallback QA 업데이트

- VM API: `localhost:8080` 터널로 `/posts/generate`를 직접 검증했다. `temp/qa-vm-banana.jpg`는 `바나나/Fresh/confidence=1.0/imageToken`으로 통과했다.
- 발견한 충돌: `AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`와 `docs/qa-fixtures/manifest.json`은 `screenshot-or-ui`를 400 또는 `확인 필요`로 기대하지만, live VM API는 `temp/real-device-camera-screen.png`를 `바나나/Fresh/confidence=0.5377/imageToken`으로 통과시켰다. 판단 기준은 2026-05-07 live VM API이며, 이 케이스는 백엔드/AI false-positive로 유지한다.
- 수정: `CameraScanScreen`의 무기기 fallback 경로와 `AnalysisResultScreen`의 등록 차단/확인 필요 정책을 회귀 테스트로 고정했다. 회귀 테스트는 `__tests__/cameraScan.fallback.test.tsx`, `__tests__/analysisResult.fallback.test.tsx`다.
- 통과: 전체 Jest 20 suites / 85 tests, TypeScript `--noEmit`, ESLint `--quiet`, `scripts/validate-ai-fixtures.js`를 실제 기기 없이 통과했다.
- 남은 검증: 커밋 가능한 실제 fixture 이미지가 없어 `Stale`, `not-food`, `low-quality`, `multi-object` AI 품질은 아직 닫지 못했다. 실제 카메라 센서와 실제 FCM 수신은 실기기 QA로 남긴다.

---

## 1. 현재 상태 요약

| 영역                       | 상태                              | 요약                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이메일 인증/로그인         | 구현됨                            | 이메일 회원가입, 로그인, JWT 저장, `/auth/me` 조회가 동작한다. 소셜 로그인과 이메일 verification은 미구현이다.                                                                                                                                                                                                                                                                                                             |
| 최초 위치 등록             | 구현됨                            | 위치 없는 유저는 `LocationSetup`으로 이동하고 `/auth/me/location`에 좌표와 FCM 토큰을 저장한다. 홈/지도/나눔 등록 강제 진입도 위치 설정 CTA로 되돌린다.                                                                                                                                                                                                                                                                    |
| 위치 재설정                | 구현됨                            | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다.                                                                                                                                                                                                                                                                                                                                          |
| AI 분석                    | 부분 구현, 실제 기기 촬영 QA 통과 | mock 파이프라인은 제거됐고 실제 `/posts/generate` 호출이 동작한다. 백엔드 기준 label은 `Fresh/Mid/Stale/unknown`이며 `Mid`는 기존 `Normal` 그룹이다. `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률이고 차단 기준이 아니다. 앱은 0.9 미만을 `확인 필요`로 표시한다. 에뮬레이터와 실제 Android 기기에서 셔터 촬영, 파일 생성, API 호출, 결과 표시를 확인했다. 단, 실제 기기에서 토마토 이미지가 `바나나`로 판별된 false-positive 품질 이슈가 있다.                                                        |
| 나눔 식재료 등록           | 부분 구현, 실제 기기 등록 QA 통과 | 실제 `generate -> imageToken -> createPost` 흐름으로 서버 등록이 확인됐다. 백엔드 Phase 1.5 구조에 맞춰 작성 화면은 제목/설명/카테고리 입력 대신 AI 판별 식재료명, 신선도, confidence를 확인하고 `fridgeId`, `expirationDate`, `imageToken`만 최종 등록 payload로 보낸다. `canShare=false` 또는 `imageToken` 누락은 분석 결과, 작성, 최종 등록 단계에서 차단한다. 실제 기기에서 등록 완료와 홈 복귀 후 주변 목록 재조회를 확인했다. 단, 등록 후 Post 응답에서 AI 메타데이터가 null이 되어 홈/상세가 fallback을 표시하는 서버 계약 불일치가 남아 있다. |
| 나눔 식재료 상세/삭제/신청 | 부분 구현                         | 실제 상세 응답의 `authorId` 기준으로 작성자 여부를 판단한다. 상세 화면은 구형 `title/description/category` 대신 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`를 표시한다. `available` 나눔 식재료는 `requestShare(postId)`로 신청하고, 201/409 이후 `신청 접수` 상태로 CTA를 비활성화한다. 403은 작성자 본인 fallback 문구로 처리한다. 실제 기기 등록 직후 상세 진입은 통과했지만 AI 메타데이터 null fallback이 재현됐다.                                                                  |
| 홈 주변 나눔 식재료        | 부분 구현, 실제 기기 홈 재조회 통과 | `/posts/nearby` 데이터를 카드로 표시한다. 홈 카드는 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`를 사용한다. API 실패와 빈 상태는 UI에서 분리됐다. 위치가 없으면 API를 호출하지 않고 위치 설정 CTA를 표시한다. 홈은 냉장고보다 available 나눔 식재료를 먼저 보여주는 화면이다. 홈 포커스와 등록 완료 refresh token 변경 시 재조회한다. 실제 기기 등록 완료 후 주변 나눔 `1건`이 표시됐다.                                                                 |
| 지도/냉장고                | 프론트 코드 연동 완료, VM/API QA 통과 | `/fridges/nearby`, `/fridges/available` 조회와 지도 마커/냉장고 선택은 동작한다. 지도에서 냉장고를 선택하면 `GET /fridges/{id}/posts?status=available`로 내부 available 나눔 식재료를 조회하고, loading/error/empty/list 상태를 분리한다. VM API에서 생성 직후 냉장고 내부 목록 포함과 신청 후 `requested` 제외를 확인했다. 실제 Android UI 조작 QA는 후속이다.                    |
| 나눔 신청                  | 프론트 코드 연동 완료, VM/API QA 통과 | 백엔드는 `POST /posts/{id}/requests`, `available -> requested`, `SELECT ... FOR UPDATE` 경합 처리, 작성자 403, 중복/경합 409, 신청 알림을 구현/검증했다. 프론트는 `requestShare(postId)`, 상세 CTA, 201/403/409 UX, 홈 refresh store를 구현했다. 2026-05-06 VM API에서 작성자 본인 403, 첫 신청 201, 중복 신청 409, 신청 후 `requested` 전환과 주변 목록 제외를 확인했다.                                                                                                                               |
| FCM                        | 프론트 코드 연동 완료, 수신 QA 필요 | FCM 토큰 등록과 `share_created`, `share_requested` 수신 handler가 있다. 위치 설정 화면은 진입 즉시 알림 권한을 요청하지 않고 `나눔 알림 받기` CTA를 눌렀을 때만 토큰을 준비한다. 기존 유저의 위치 자동 갱신 경로도 알림 권한 요청을 열지 않으며, 기존 `fcmToken`이 있을 때만 함께 보낸다. Android 13+ 알림 권한 거부 시 Firebase permission/register/getToken을 호출하지 않고 `fcmToken` 없이 위치 등록을 계속한다. payload는 문자열 + camelCase(`postId`, `requestId`, `fruitName`, `fridgeName`, `type`)로 검증한다. foreground/background/opened/initial 알림은 로컬 알림함에 기록하고, 알림 열기와 알림함 항목 탭은 `PostDetail`로 이동한다. `share_requested`는 내 나눔 관리 화면이 없으므로 MVP에서 상세 fallback을 쓴다. Firebase 설정이 없는 QA/release 빌드에서는 Messaging 인스턴스 생성 실패를 알림 handler와 FCM 토큰 조회 양쪽에서 guard한다. 실제 FCM 메시지 수신 QA와 읽음 상태 API는 없다. |
| 채팅                       | 보류                              | 정적 채팅 mock 데이터는 제거했다. WebSocket/API 계약은 없다.                                                                                                                                                                                                                                                                                                                                                               |
| 통계/탄소 절감             | 정리됨                            | 실제 지표 API가 없는 홈/프로필 mock 숫자는 제거하고 준비 중 상태로 표시한다.                                                                                                                                                                                                                                                                                                                                               |
| 검색                       | 부분 구현                         | MVP 검색은 지도 공유 냉장고 이름/주소 로컬 필터로 제한했다. 서버 검색 API는 없다.                                                                                                                                                                                                                                                                                                                                          |

---

## 2. Phase별 현실 기준

### Phase 1: 기반 세팅 및 인증

- 상태: 부분 완료
- 완료:
  - `SplashScreen`, `OnboardingScreen`, `LoginScreen`, `LoginEmailScreen`, `SignupScreen`
  - 이메일 회원가입/로그인 API 연동
  - JWT 저장과 401 처리
- 남은 작업:
  - 소셜 로그인 버튼은 `준비 중` Alert만 표시하므로 숨김/보류/실구현 중 결정 필요
  - 이메일 verification은 서버/API/화면 모두 없음

### Phase 2: 위치 설정 및 홈

- 상태: 부분 완료
- 완료:
  - 최초 위치 등록
  - 홈 주변 나눔 식재료 조회와 pull-to-refresh
  - 홈 빈 상태 표시
  - 위치 미설정 강제 진입 시 `/posts/nearby` 호출 차단과 위치 설정 CTA 표시
- 남은 작업:
  - 실제 통계/탄소 절감 계산식과 API 계약 정의

### Phase 3: 카메라 촬영 및 AI 분석

- 상태: 부분 완료
- 완료:
  - 갤러리 이미지 선택 후 실제 AI generate 호출
  - 실제 AI 응답의 `detectedFruit`, `aiAnalysis`, `imageToken` 수신
  - 분석 결과 화면 표시
- 남은 작업:
  - 실제 기기 카메라 셔터 검증
  - `Stale` fixture로 나눔 기준 미충족 결과 재검증
  - `confidenceScore` 0.4/0.7/1.0 fixture로 `확인 필요` 표시 재검증
  - 분석 실패 후 수동 입력 CTA 추가 여부 결정

### Phase 4: 나눔 식재료 등록 흐름

- 상태: 부분 완료
- 완료:
  - AI 판별 식재료명/신선도/confidence 기반 등록 확인 화면
  - 냉장고 선택
  - 실제 `POST /api/v1/posts` 생성. API/code의 `post`는 도메인상 나눔 식재료
  - 백엔드 Phase 1.5 Post 구조 반영: `title/description/category` 의존 제거, `detectedFruitKo/freshnessLabel/confidenceScore` 사용
  - 완료 화면
  - 위치 미설정 상태의 냉장고 선택 강제 진입 시 `/fridges/available` 호출 차단과 위치 설정 CTA 표시
  - 등록 완료 후 홈 복귀 시 `/posts/nearby` 재조회 신호 전달과 홈 포커스 재조회
- 남은 작업:
  - `Stale` generate 400과 `imageToken` 미발급/무효 토큰 create 400 UX 검증
  - 유통기한 기본 3일 자동값 정책 정리

### Phase 5: 지도 및 냉장고 탐색

- 상태: 부분 완료
- 완료:
  - 지도, 반경 원, 냉장고 마커, 하단 캐러셀
  - 실제 냉장고 목록 조회
  - 선택 냉장고 내부 available 나눔 식재료 목록 조회와 상세 이동
  - 위치 미설정 상태에서는 전남대 기본 좌표 fallback 없이 위치 설정 CTA 표시
- 남은 작업:
  - 주변 냉장고 없음 fixture/API 검증
  - 냉장고별 목록 실제 VM/API 런타임 QA

### Phase 6: 알림 및 내 정보

- 상태: 프론트 코드 연동 완료, 실제 기기 QA 필요
- 완료:
  - 프로필 기본 정보 표시
  - 로그아웃
  - FCM 토큰 등록 시도
  - 위치 설정 화면의 명시적 알림 권한 CTA
  - 기존 유저 위치 자동 갱신 시 알림 권한 자동 요청 방지
  - Android 13+ 알림 권한 거부 시 FCM token/register 생략
  - `share_created`, `share_requested` foreground/background/opened/initial 수신 handler
  - 문자열 + camelCase FCM payload 검증
  - 로컬 알림함 수신 기록/빈 상태
  - 알림 열기와 알림함 항목 탭 시 `PostDetail` fallback 라우팅
- 남은 작업:
  - 프로필 수정/내 나눔/관심/받은 나눔 메뉴 연결
  - 실제 기기 FCM foreground/background/terminated 수신 QA
  - 나눔 신청하기 실제 VM API 201/403/409 QA
  - 알림 읽음 상태/API 계약 구현
  - 실제 활동 지표 API 계약 구현

---

## 3. 다음 작업 우선순위

### P0

1. 완료: `authorId/userId` 계약 불일치 수정
2. 완료: 나눔 기준 미충족/등록 차단 상태에서 실제 등록 차단
3. 완료: 백엔드 Phase 1.5 Post 구조 변경 반영. `src/types/post.ts`, `PostCreateData`, 카드/상세/등록 화면의 `title/description/category` 의존을 제거하고 `detectedFruitKo/freshnessLabel/confidenceScore/status` 중심으로 갱신

### P1

1. 완료: 홈/지도/냉장고 목록 실패 상태와 빈 상태 분리
2. 완료: 위치 재설정 진입점 연결
3. 완료: 위치 미설정 강제 진입 공통 가드와 위치 설정 CTA 정리
4. 부분 완료: 카메라 실패 시 갤러리 fallback 개선. 실제 기기 촬영 재검증은 남음
5. 완료, fixture QA 필요: AI confidence 표시와 `확인 필요` 상태 도입. 제품 기준은 `confidenceScore < 0.9`이며 단독 등록 차단 기준은 아니다.
6. 완료, VM/API QA 통과: 나눔 신청하기 API 연동, 첫 신청 이후 추가 신청 차단, `available -> requested` 상태 전환, 403/409 처리
7. 완료, VM/API QA 통과, 실제 앱 UI QA 후속: 냉장고별 나눔 식재료 조회 API 연동. 지도에서 선택한 냉장고의 available 목록을 표시하고 항목 탭 시 상세로 이동한다.

### P2

1. 완료: 검색 MVP 범위는 지도 공유 냉장고 이름/주소 로컬 필터로 결정
2. 완료, 실제 기기 QA 필요: FCM 수신 handler와 알림함. `share_created`/`share_requested` foreground/background/opened/initial 수신 기록, 문자열 + camelCase payload 검증, 상세 fallback 라우팅을 구현했다. 읽음 상태 API는 후속이다.
3. 완료: 홈/프로필 목업 통계 숫자 제거
4. multi-object detection 계약 연구

### 보류

- WebSocket 기반 실시간 채팅
- 소셜 로그인 전체 구현
- 이메일 verification 전체 예외 케이스
- 냉장고 내부 inventory. 단, 냉장고별 available 나눔 식재료 조회 API는 구현됐으므로 지도/냉장고 상세 탐색과 구분한다.
- 관리자 화면. 제품 범위에는 포함하지만 MVP 구현 범위에서는 제외

---

## 4. 검증 명령

현재 자동 테스트 기준:

```bash
npm run lint -- --quiet
npm test -- --runInBand
node ./node_modules/typescript/bin/tsc --noEmit
```

실제 앱/서버 검증은 [`VALIDATION_AND_BACKLOG.md`](./VALIDATION_AND_BACKLOG.md)의 각 섹션 결과와 시연/검증용 데이터 준비 항목을 기준으로 한다.
