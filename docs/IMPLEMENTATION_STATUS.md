# FoodLink Implementation Status

> **작성일**: 2026-05-06
> **기준 브랜치**: `codex/p2-fixture-search-notifications`
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

---

## 1. 현재 상태 요약

| 영역 | 상태 | 요약 |
| --- | --- | --- |
| 이메일 인증/로그인 | 구현됨 | 이메일 회원가입, 로그인, JWT 저장, `/auth/me` 조회가 동작한다. 소셜 로그인과 이메일 verification은 미구현이다. |
| 최초 위치 등록 | 구현됨 | 위치 없는 유저는 `LocationSetup`으로 이동하고 `/auth/me/location`에 좌표와 FCM 토큰을 저장한다. 홈/지도/나눔 등록 강제 진입도 위치 설정 CTA로 되돌린다. |
| 위치 재설정 | 구현됨 | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. |
| AI 분석 | 부분 구현 | mock 파이프라인은 제거됐고 실제 `/posts/generate` 호출이 동작한다. confidence 표시와 `확인 필요` 상태가 추가됐다. `confidenceScore`는 차단 기준이 아니라 보조 표시로 둔다. 에뮬레이터 셔터 촬영은 파일 생성 및 API 호출까지 재검증됐고, 실제 기기 검증은 남았다. |
| 나눔 식재료 등록 | 부분 구현 | 실제 `generate -> imageToken -> createPost` 흐름으로 서버 등록이 확인됐다. 현재 API/code의 `post`는 도메인상 나눔 식재료를 뜻한다. `canShare=false`는 분석 결과, 작성, 최종 등록 단계에서 차단한다. 등록 완료 후 홈 복귀는 주변 목록 재조회 신호를 전달한다. |
| 나눔 식재료 상세/삭제 | 수정됨 | 실제 상세 응답의 `authorId` 기준으로 작성자 여부를 판단한다. 구형 fixture를 위해 `userId` fallback만 남겼다. |
| 홈 주변 나눔 식재료 | 부분 구현 | `/posts/nearby` 데이터를 카드로 표시한다. API 실패와 빈 상태는 UI에서 분리됐다. 위치가 없으면 API를 호출하지 않고 위치 설정 CTA를 표시한다. 홈은 냉장고보다 available 나눔 식재료를 먼저 보여주는 화면이다. 홈 포커스와 등록 완료 refresh token 변경 시 재조회한다. |
| 지도/냉장고 | 부분 구현 | `/fridges/nearby`, `/fridges/available` 조회와 지도 마커/냉장고 선택은 동작한다. 제품상 지도는 주변 공유 냉장고와 그 안의 available 나눔 식재료 탐색 화면이지만, 현재 구현은 냉장고 목록/선택까지다. 위치가 없으면 지도 기본 좌표 fallback 없이 위치 설정 CTA를 표시한다. API 실패와 빈 상태는 분리됐고, 주변 냉장고 없음 상태는 서버 필터 확인이 필요하다. |
| 나눔 신청 | 미구현 | MVP 목표 흐름은 수요자가 상세 화면에서 `나눔 신청하기`를 눌러 `available -> requested`로 전환하는 것이다. `requested`는 신청 접수이며 예약 확정이 아니다. |
| FCM | 부분 구현 | FCM 토큰 등록은 있다. 실제 수신 handler, 알림 목록, 읽음 상태는 없다. 탭은 빈 알림함으로 축소했다. |
| 채팅 | 보류 | 정적 채팅 mock 데이터는 제거했다. WebSocket/API 계약은 없다. |
| 통계/탄소 절감 | 정리됨 | 실제 지표 API가 없는 홈/프로필 mock 숫자는 제거하고 준비 중 상태로 표시한다. |
| 검색 | 부분 구현 | MVP 검색은 지도 공유 냉장고 이름/주소 로컬 필터로 제한했다. 서버 검색 API는 없다. |

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
  - stale/bad fixture로 나눔 기준 미충족 결과 재검증
  - 분석 실패 후 수동 입력 CTA 추가 여부 결정

### Phase 4: 나눔 식재료 등록 흐름

- 상태: 부분 완료
- 완료:
  - AI 추천 제목/설명/카테고리 기반 작성 화면
  - 냉장고 선택
  - 실제 `POST /api/v1/posts` 생성. API/code의 `post`는 도메인상 나눔 식재료
  - 완료 화면
  - 위치 미설정 상태의 냉장고 선택 강제 진입 시 `/fridges/available` 호출 차단과 위치 설정 CTA 표시
  - 등록 완료 후 홈 복귀 시 `/posts/nearby` 재조회 신호 전달과 홈 포커스 재조회
- 남은 작업:
  - imageToken 만료/중복 등록/idempotency 검증
  - 유통기한 기본 3일 자동값 정책 정리

### Phase 5: 지도 및 냉장고 탐색

- 상태: 부분 완료
- 완료:
  - 지도, 반경 원, 냉장고 마커, 하단 캐러셀
  - 실제 냉장고 목록 조회
  - 위치 미설정 상태에서는 전남대 기본 좌표 fallback 없이 위치 설정 CTA 표시
- 남은 작업:
  - 주변 냉장고 없음 fixture/API 검증
  - 냉장고 상세/내부 아이템 정책 결정
  - 냉장고별 available 나눔 식재료 노출 정책 결정

### Phase 6: 알림 및 내 정보

- 상태: 목업/부분 완료
- 완료:
  - 프로필 기본 정보 표시
  - 로그아웃
  - FCM 토큰 등록 시도
- 남은 작업:
  - 프로필 수정/내 나눔/관심/받은 나눔 메뉴 연결
  - FCM 수신 handler와 알림함 구현
  - 나눔 신청하기와 `available -> requested` 상태 전환 구현
  - 알림 읽음 상태/API 계약 구현
  - 실제 활동 지표 API 계약 구현

---

## 3. 다음 작업 우선순위

### P0

1. 완료: `authorId/userId` 계약 불일치 수정
2. 완료: 나눔 기준 미충족/등록 차단 상태에서 실제 등록 차단

### P1

1. 완료: 홈/지도/냉장고 목록 실패 상태와 빈 상태 분리
2. 완료: 위치 재설정 진입점 연결
3. 완료: 위치 미설정 강제 진입 공통 가드와 위치 설정 CTA 정리
4. 부분 완료: 카메라 실패 시 갤러리 fallback 개선. 실제 기기 촬영 재검증은 남음
5. 완료: AI confidence 표시와 `확인 필요` 상태 도입
6. 미구현: 나눔 신청하기, 첫 신청 이후 추가 신청 차단, `available -> requested` 상태 전환

### P2

1. 완료: 검색 MVP 범위는 지도 공유 냉장고 이름/주소 로컬 필터로 결정
2. 부분 완료: FCM 탭은 빈 알림함으로 축소. 수신/읽음 handler는 남음
3. 완료: 홈/프로필 목업 통계 숫자 제거
4. multi-object detection 계약 연구

### 보류

- WebSocket 기반 실시간 채팅
- 소셜 로그인 전체 구현
- 이메일 verification 전체 예외 케이스
- 냉장고 내부 inventory
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
