# FoodLink — 프론트엔드 구현 현황 리포트

> **작성일**: 2026-05-05
> **기준 브랜치**: `feat/mvpflow` / `codex/docs-consistency`
> **기준 문서**: [`MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md`](./MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md)

이 문서는 초기 Phase 1~6 구현 리포트를 2026-05-05 MVP 검증 결과 기준으로 갱신한 것이다. 과거 문서의 일괄 완료 표현은 실제 서버/기기 검증 결과를 반영하지 못하므로, 현재는 `구현됨`, `부분 구현`, `목업`, `미구현`, `검증 필요`, `버그`로 분리한다.

---

## 1. 현재 상태 요약

| 영역 | 상태 | 요약 |
| --- | --- | --- |
| 이메일 인증/로그인 | 구현됨 | 이메일 회원가입, 로그인, JWT 저장, `/auth/me` 조회가 동작한다. 소셜 로그인과 이메일 verification은 미구현이다. |
| 최초 위치 등록 | 구현됨 | 위치 없는 유저는 `LocationSetup`으로 이동하고 `/auth/me/location`에 좌표와 FCM 토큰을 저장한다. |
| 위치 재설정 | 구현됨 | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. |
| AI 분석 | 부분 구현 | mock 파이프라인은 제거됐고 실제 `/posts/generate` 호출이 동작한다. confidence 표시와 `확인 필요` 상태가 추가됐다. 실제 기기 카메라 셔터 검증은 남았다. |
| 게시글 등록 | 부분 구현 | 실제 `generate -> imageToken -> createPost` 흐름으로 서버 게시글 생성이 확인됐다. `canShare=false`는 분석 결과, 작성, 최종 등록 단계에서 차단한다. |
| 게시글 상세/삭제 | 수정됨 | 실제 상세 응답의 `authorId` 기준으로 작성자 여부를 판단한다. 구형 fixture를 위해 `userId` fallback만 남겼다. |
| 홈 주변 게시글 | 부분 구현 | `/posts/nearby` 데이터를 카드로 표시한다. API 실패와 빈 상태는 UI에서 분리됐다. |
| 지도/냉장고 | 부분 구현 | `/fridges/nearby`, `/fridges/available` 조회와 지도 마커/냉장고 선택은 동작한다. API 실패와 빈 상태는 분리됐고, 주변 냉장고 없음 상태는 서버 필터 확인이 필요하다. |
| FCM | 부분 구현 | FCM 토큰 등록은 있다. 실제 수신 handler, 알림함, 읽음 상태는 없다. |
| 채팅 | 목업 | `ChatListScreen`은 정적 mock 데이터만 표시한다. WebSocket/API 계약은 없다. |
| 통계/탄소 절감 | 목업 | 홈/프로필의 탄소 절감량, 포인트, 신선도 온도는 하드코딩이다. |
| 검색 | 미구현 | 홈 검색 아이콘과 지도 입력은 동작하지 않는다. 서버 검색 API도 없다. |

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
  - 홈 주변 게시글 조회와 pull-to-refresh
  - 홈 빈 상태 표시
- 남은 작업:
  - 홈 통계/탄소 절감 mock 정리

### Phase 3: 카메라 촬영 및 AI 분석

- 상태: 부분 완료
- 완료:
  - 갤러리 이미지 선택 후 실제 AI generate 호출
  - 실제 AI 응답의 `detectedFruit`, `aiAnalysis`, `imageToken` 수신
  - 분석 결과 화면 표시
- 남은 작업:
  - 실제 기기 카메라 셔터 검증
  - stale/bad fixture로 부패 의심 결과 재검증
  - 분석 실패 후 수동 입력 CTA 추가 여부 결정

### Phase 4: 게시글 등록 흐름

- 상태: 부분 완료
- 완료:
  - AI 추천 제목/설명/카테고리 기반 작성 화면
  - 냉장고 선택
  - 실제 `POST /api/v1/posts` 생성
  - 완료 화면
- 남은 작업:
  - 등록 완료 후 홈 목록 refresh 보장
  - imageToken 만료/중복 등록/idempotency 검증
  - 유통기한 기본 3일 자동값 정책 정리

### Phase 5: 지도 및 냉장고 탐색

- 상태: 부분 완료
- 완료:
  - 지도, 반경 원, 냉장고 마커, 하단 캐러셀
  - 실제 냉장고 목록 조회
- 남은 작업:
  - 위치 미설정 상태에서 기본 좌표 fallback 제거 또는 CTA 표시
  - 주변 냉장고 없음 fixture/API 검증
  - 냉장고 상세/내부 아이템 정책 결정
  - 지도 검색 입력 동작 연결

### Phase 6: 알림 및 내 정보

- 상태: 목업/부분 완료
- 완료:
  - 프로필 기본 정보 표시
  - 로그아웃
  - FCM 토큰 등록 시도
- 남은 작업:
  - 프로필 수정/내 나눔/관심/받은 나눔 메뉴 연결
  - FCM 수신 handler와 알림함 구현
  - 채팅 탭 제거 또는 알림함으로 축소
  - mock 통계 제거

---

## 3. 다음 작업 우선순위

### P0

1. 완료: `authorId/userId` 계약 불일치 수정
2. 완료: 부패 의심/등록 불가 상태에서 실제 등록 차단

### P1

1. 완료: 홈/지도/냉장고 목록 실패 상태와 빈 상태 분리
2. 완료: 위치 재설정 진입점 연결
3. 부분 완료: 카메라 실패 시 갤러리 fallback 개선. 실제 기기 촬영 재검증은 남음
4. 완료: AI confidence 표시와 `확인 필요` 상태 도입

### P2

1. 검색 MVP 범위 결정
2. FCM 수신/알림함 범위 정의
3. 목업 통계 정리
4. multi-object detection 계약 연구

### 보류

- WebSocket 기반 실시간 채팅
- 소셜 로그인 전체 구현
- 이메일 verification 전체 예외 케이스
- 냉장고 내부 inventory

---

## 4. 검증 명령

현재 자동 테스트 기준:

```bash
npm run lint -- --quiet
npm test -- --runInBand
node ./node_modules/typescript/bin/tsc --noEmit
```

실제 앱/서버 검증은 [`MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md`](./MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md)의 각 섹션 결과와 시연/검증용 데이터 준비 항목을 기준으로 한다.
