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
- 프론트 현재 상태: Post 구조 변경과 나눔 신청 API는 React Native 코드에 반영됐다. `src/types/post.ts`, `createPost()` payload, 홈 카드/상세/등록 화면은 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`, `imageToken` 중심으로 동작한다. 상세 화면은 `requestShare(postId)`로 `available -> requested`를 처리하고 홈 refresh 신호를 보낸다. 냉장고별 나눔 식재료 조회와 FCM 수신 handler는 아직 미연동이다.

---

## 1. 현재 상태 요약

| 영역                       | 상태                              | 요약                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이메일 인증/로그인         | 구현됨                            | 이메일 회원가입, 로그인, JWT 저장, `/auth/me` 조회가 동작한다. 소셜 로그인과 이메일 verification은 미구현이다.                                                                                                                                                                                                                                                                                                             |
| 최초 위치 등록             | 구현됨                            | 위치 없는 유저는 `LocationSetup`으로 이동하고 `/auth/me/location`에 좌표와 FCM 토큰을 저장한다. 홈/지도/나눔 등록 강제 진입도 위치 설정 CTA로 되돌린다.                                                                                                                                                                                                                                                                    |
| 위치 재설정                | 구현됨                            | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다.                                                                                                                                                                                                                                                                                                                                          |
| AI 분석                    | 부분 구현                         | mock 파이프라인은 제거됐고 실제 `/posts/generate` 호출이 동작한다. 백엔드 기준 label은 `Fresh/Mid/Stale/unknown`이며 `Mid`는 기존 `Normal` 그룹이다. `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률이고 차단 기준이 아니다. 앱은 0.9 미만을 `확인 필요`로 표시한다. 에뮬레이터 셔터 촬영은 파일 생성 및 API 호출까지 재검증됐고, 실제 기기 검증은 남았다.                                                        |
| 나눔 식재료 등록           | 부분 구현                         | 실제 `generate -> imageToken -> createPost` 흐름으로 서버 등록이 확인됐다. 백엔드 Phase 1.5 구조에 맞춰 작성 화면은 제목/설명/카테고리 입력 대신 AI 판별 식재료명, 신선도, confidence를 확인하고 `fridgeId`, `expirationDate`, `imageToken`만 최종 등록 payload로 보낸다. `canShare=false` 또는 `imageToken` 누락은 분석 결과, 작성, 최종 등록 단계에서 차단한다. 등록 완료 후 홈 복귀는 주변 목록 재조회 신호를 전달한다. |
| 나눔 식재료 상세/삭제/신청 | 부분 구현                         | 실제 상세 응답의 `authorId` 기준으로 작성자 여부를 판단한다. 상세 화면은 구형 `title/description/category` 대신 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`를 표시한다. `available` 나눔 식재료는 `requestShare(postId)`로 신청하고, 201/409 이후 `신청 접수` 상태로 CTA를 비활성화한다. 403은 작성자 본인 fallback 문구로 처리한다.                                                                  |
| 홈 주변 나눔 식재료        | 부분 구현                         | `/posts/nearby` 데이터를 카드로 표시한다. 홈 카드는 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`를 사용한다. API 실패와 빈 상태는 UI에서 분리됐다. 위치가 없으면 API를 호출하지 않고 위치 설정 CTA를 표시한다. 홈은 냉장고보다 available 나눔 식재료를 먼저 보여주는 화면이다. 홈 포커스와 등록 완료 refresh token 변경 시 재조회한다.                                                                 |
| 지도/냉장고                | 부분 구현, 백엔드 API 추가됨      | `/fridges/nearby`, `/fridges/available` 조회와 지도 마커/냉장고 선택은 동작한다. 백엔드는 `GET /fridges/{id}/posts?status=available`도 구현했지만 프론트는 아직 냉장고별 나눔 식재료 목록을 노출하지 않는다. 위치가 없으면 지도 기본 좌표 fallback 없이 위치 설정 CTA를 표시한다. API 실패와 빈 상태는 분리됐고, 주변 냉장고 없음 상태는 서버 필터 확인이 필요하다.                                                        |
| 나눔 신청                  | 프론트 코드 연동 완료, VM QA 필요 | 백엔드는 `POST /posts/{id}/requests`, `available -> requested`, `SELECT ... FOR UPDATE` 경합 처리, 작성자 403, 중복/경합 409, 신청 알림을 구현/검증했다. 프론트는 `requestShare(postId)`, 상세 CTA, 201/403/409 UX, 홈 refresh store를 구현했다. 실제 VM API 201/403/409 런타임 QA는 남았다.                                                                                                                               |
| FCM                        | 부분 구현, 백엔드 payload 확정    | FCM 토큰 등록은 있다. 백엔드는 `share_created`, `share_requested` 타입과 camelCase payload(`postId`, `requestId`, `fruitName`, `fridgeName`)를 확정했다. 실제 수신 handler, 알림 목록, 읽음 상태는 없다. 탭은 빈 알림함으로 축소했다.                                                                                                                                                                                      |
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
  - 위치 미설정 상태에서는 전남대 기본 좌표 fallback 없이 위치 설정 CTA 표시
- 남은 작업:
  - 주변 냉장고 없음 fixture/API 검증
  - 백엔드가 구현한 `GET /fridges/{id}/posts?status=available`를 지도/냉장고 상세에 연동

### Phase 6: 알림 및 내 정보

- 상태: 목업/부분 완료
- 완료:
  - 프로필 기본 정보 표시
  - 로그아웃
  - FCM 토큰 등록 시도
- 남은 작업:
  - 프로필 수정/내 나눔/관심/받은 나눔 메뉴 연결
  - `share_created`, `share_requested` FCM 수신 handler와 알림함 구현
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
6. 완료, VM QA 필요: 나눔 신청하기 API 연동, 첫 신청 이후 추가 신청 차단, `available -> requested` 상태 전환, 403/409 처리
7. 백엔드 완료/프론트 미구현: 냉장고별 나눔 식재료 조회 API 연동

### P2

1. 완료: 검색 MVP 범위는 지도 공유 냉장고 이름/주소 로컬 필터로 결정
2. 부분 완료: FCM 탭은 빈 알림함으로 축소. `share_created`/`share_requested` 수신/읽음 handler는 남음
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
