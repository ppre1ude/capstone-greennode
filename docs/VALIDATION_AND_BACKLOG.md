# FoodLink Validation And Backlog

> 목적: 중간 발표 전에 급하게 구현한 MVP 기능을 실제로 검증하고, 그 결과를 바탕으로 다음 스프린트 백로그를 정리한다.
>
> 이 문서는 "발표 전까지 구현할 목록"이 아니라, 이미 만든 MVP의 현재 상태를 확인하기 위한 검증/정리 문서다.

## Agent Workflow

- Authority: verified MVP behavior, QA evidence, bug classification, backlog
  candidates, acceptance criteria, and follow-up work.
- Read before: fixing bugs, validating user flows, changing backlog priority,
  claiming a feature is done, or planning a sprint slice.
- Update when: a validation result changes, a bug is fixed, a backlog item is
  reprioritized, or a new risk is discovered.
- Required evidence: environment, reproduction steps, actual result, expected
  result, related code/API, and next action.
- Related workflows: `qa`, `diagnose`, `triage-issue`, `tdd`, `to-issues`.
- Source-of-truth conflicts: verified runtime/API behavior recorded here wins
  over summary claims in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).
  Domain naming still defers to [DOMAIN_MODEL.md](./DOMAIN_MODEL.md).

## Evidence And Backlog Gates

- Evidence entry: every new validation result should identify date, environment,
  flow, actual result, evidence, and follow-up.
- Backlog entry: every next-sprint item should include classification, priority,
  background, current behavior, expected behavior, acceptance criteria,
  verification method, and related files/API.
- Completion claim: a checked item must point to either automated tests,
  API/server evidence, emulator QA, real-device QA, or an explicitly documented
  reason verification was skipped.

## 진행 원칙

- 기능을 새로 늘리기 전에 현재 MVP 흐름이 실제 데이터와 실패 케이스에서 어떻게 동작하는지 확인한다.
- 각 항목은 `정상 동작`, `버그`, `미구현`, `정책 결정 필요`, `발표/문서화 필요` 중 하나로 분류한다.
- Codex에게 작업을 맡길 때는 한 번에 큰 기능 전체를 맡기기보다, 아래의 작업 묶음 단위로 검증하게 한다.
- 검증 결과는 재현 절차, 실제 결과, 기대 결과, 관련 로그/파일, 다음 액션까지 남긴다.

## 2026-05-06 Office-hours 제품 흐름 결정

이 섹션은 FoodLink 세부 기획 office-hours 결과를 기준으로 한다. 과거 검증 로그의 `게시글`, `post`, `product` 표현은 도메인상 **나눔 식재료**를 뜻하는 기술/이전 명칭으로 해석한다.

### 핵심 가치와 사용자

- 핵심 가치는 남는 식재료 처리의 귀찮음과 죄책감을 줄이는 것이다.
- 환경 지표(CO2 절감량, 월간 기여량 등)는 핵심 가치가 아니라 사용자가 잘한 일을 확인하는 보조 성취 레이어다.
- 초기 페르소나는 전남대 등 대학가, 원룸촌, 고시원 주변의 1인 가구 구성원이다.
- 현재 대안 행동은 남는 식재료를 버리거나, 한 번에 요리한 뒤 소분해 보관하는 것이다.

### 공급자/수요자 MVP 흐름

공급자 흐름:

```text
남는 식재료 촬영/선택
  -> AI 분석
  -> 나눔 가능 기준 통과
  -> 나눔 식재료 등록 정보 확인/수정
  -> 등록 가능 공유 냉장고 선택
  -> 등록 완료
  -> 근처 사용자에게 푸시 알림
```

수요자 흐름:

```text
홈에서 근처 available 나눔 식재료 발견
  -> 상세 화면 진입
  -> 보관 공유 냉장고 확인
  -> 나눔 신청하기
  -> status: available -> requested
  -> 공급자에게 신청 알림
```

- MVP는 `available -> requested`까지 검증한다.
- `requested`는 신청 접수이며 예약 확정이 아니다.
- MVP에서 `requested` 이후 공급자 승인/거절 액션은 없다.
- 첫 신청 이후 추가 신청을 막는 정책을 권장하지만, 최종 기획 확인은 남아 있다.
- 관리자 화면은 제품 범위에는 포함하지만, 공유 냉장고/지도/신청 흐름이 안정화된 뒤 후순위로 제작한다. MVP 운영 제어는 수동 운영으로 시작한다.

### 홈과 지도 역할

- 홈은 사용자가 **나눔 식재료를 먼저 찾는 화면**이다.
- 홈의 1차 섹션은 가까운 available 나눔 식재료다. 거리 우선, 동일 권역에서는 최신순을 기본으로 한다.
- "만료 임박" 표현은 쓰지 않는다. 대신 `오늘 가져가기 좋은 재료`, `오늘 추천`, `권장 수령일: 오늘`처럼 긍정적이고 행동 가능한 표현을 쓴다.
- "많이 찾는 식재료"는 실제 조회/신청/관심 데이터가 쌓인 뒤 도입할 후순위 추천 기능이다.
- 지도는 주변 공유 냉장고와 각 냉장고 안의 available 나눔 식재료를 탐색하는 화면이다.

### AI 판정과 사용자 문구

- `Fresh`와 `Normal`은 사용자 흐름에서 모두 `상태가 좋아 보여요`와 `나눔 가능`으로 통합 표시한다.
- `Stale`, `Bad`, `Rotten`은 AI/백엔드가 `Stale`의 의미를 더 정확히 정의하기 전까지 보수적으로 나눔 기준 미충족으로 분류하고 등록하지 않는다.
- `not_food`, `non_food`, `low_quality`, `screenshot`, `ui_screenshot`은 등록하지 않는다.
- `confidenceScore`는 차단 정책이 아니라 보조 표시/검토 신호다. 이 값이 무엇에 대한 confidence인지 AI/백엔드 계약에서 추가 정의해야 한다.
- 사용자-facing 부정 문구는 `부패`, `상함`, `썩음`, `나쁨`, `AI 실패`가 아니라 `나눔 기준에 맞지 않아요`, `식재료 사진으로 확인되지 않았어요`, `사진으로 상태를 확인하기 어려워요` 계열을 쓴다.

### 후속 결정 필요

- AI/백엔드와 `Stale`의 정확한 의미를 정의한다.
- AI/백엔드와 `confidenceScore`가 무엇의 confidence인지 정의한다.
- 첫 신청 이후 추가 신청을 막는 정책을 기획자와 최종 확인한다.
- `requested` 이후 `reserved`, `completed`, `cancelled`, `expired` 흐름은 후속 버전에서 설계한다.

## 2026-05-05 P0/P1 코드 보강 현황

- P0 `authorId/userId` 계약 불일치: `PostDetailScreen`이 `authorId` 기준으로 작성자 여부를 판단하도록 수정했다. 구형 fixture용 `userId` fallback은 `postPolicy`에만 남겼다.
- P0 `canShare=false` 등록 차단: `AnalysisResultScreen` 버튼 disabled, `PostCreateScreen` 진입 후 guard, `FridgeSelectScreen` 최종 등록 guard를 추가했다.
- P1 목록 실패/빈 상태 분리: 홈 주변 나눔 식재료, 지도 냉장고, 등록 가능 냉장고 목록에 loading/error/empty 상태와 retry UI를 분리했다.
- P1 위치 재설정: 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다.
- P1 위치 미설정 공통 가드: 홈, 지도, AI 스캔 진입점, 냉장고 선택 화면이 `getRegisteredLocation()` 기준을 공유한다. 위치가 없으면 주변 API를 호출하지 않고 `LocationSetup` CTA를 표시한다.
- P1 등록 완료 후 홈 재조회: `PostCompleteScreen`이 홈 탭에 `nearbyPostsRefreshToken`을 전달하고, `HomeScreen`은 포커스/토큰 변경 시 `/posts/nearby`를 다시 조회한다.
- P1 카메라 촬영/fallback: `react-native-vision-camera@5`의 `usePhotoOutput().capturePhotoToFile()` 경로로 수정했다. 에뮬레이터에서 촬영 파일 생성 및 실제 `/posts/generate` 호출까지 확인했고, 실제 기기 셔터 검증은 아직 남았다.
- P1 confidence: `confidenceScore`를 분석 결과/작성 화면에 표시하고 60% 미만은 즉시 차단 대신 `확인 필요`로 분기한다.
- 회귀 테스트: `__tests__/postPolicy.test.ts`에서 품질 정책, confidence, 작성자 판단을 고정한다. `__tests__/postComplete.navigation.test.tsx`, `__tests__/home.nearbyRefresh.test.tsx`에서 등록 완료 홈 복귀와 `/posts/nearby` 재조회 신호를 고정한다.
- AI QA fixture/실기기 체크리스트: [AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)에 성공/실패/false-positive/대용량/실제 기기 촬영 검증 기준을 정리했다.

## 권장 작업 순서

1. MVP 핵심 플로우 검증
2. 실패 케이스와 예외 처리 검증
3. AI 파이프라인 데이터 흐름 검증
4. 한 장 촬영 UX와 multi-object 정책 정리
5. 미구현 기능 상태 점검
6. 다음 스프린트 백로그 재분류

## 1. MVP 핵심 플로우 검증

### 목표

`로그인 -> 최초 위치 등록 -> 사진 촬영 -> AI 분석 -> 나눔 식재료 등록 -> 홈/지도 반영` 흐름이 실제 앱에서 끝까지 이어지는지 확인한다.

### To-do

- [x] 로그인 시 유저 테이블에 유저가 정상 생성되는지 확인
- [x] 기존 유저가 다시 로그인할 때 유저 정보가 정상 업데이트되는지 확인
- [x] 최초 로그인 직후 동네 위치 미설정(`latitude = NULL`, `longitude = NULL`) 상태가 실제로 발생하는지 확인
- [x] 동네 위치 미설정 상태에서 홈 화면이 깨지지 않는지 확인
- [x] 동네 위치 미설정 상태에서 지도 화면이 깨지지 않는지 확인
- [x] 동네 위치 미설정 상태에서 검색 화면이 깨지지 않는지 확인
- [x] 동네 위치 미설정 상태에서 나눔 식재료 등록 플로우가 깨지지 않는지 확인
- [x] 최초 위치 등록 화면으로 자연스럽게 이어지는지 확인
- [x] 최초 위치 등록 후 홈/지도/나눔 식재료 등록에서 위치 데이터가 반영되는지 확인
- [x] 위치 재설정 기능이 실제 위치 데이터와 UI에 반영되는지 확인
- [x] 사진 촬영 후 이미지 파일이 생성되는지 확인
- [x] 촬영한 이미지가 API 서버로 정상 전달되는지 확인
- [x] AI 분석 결과가 앱 화면에 정상 표시되는지 확인
- [x] AI 분석 결과가 나눔 식재료 생성 화면의 기본값으로 정상 반영되는지 확인
- [x] 나눔 식재료 등록 성공 후 홈 화면 또는 관련 목록에 반영되는지 확인
- [x] 나눔 식재료 등록 성공 후 지도/냉장고 관련 화면에 반영되는지 확인

### 산출물

- 핵심 플로우 검증 결과 표
- 발견한 버그 목록
- 다음 스프린트에서 반드시 고칠 항목 목록

### 검증 결과 (2026-05-05)

#### 검증 환경

- API: SSH 터널 `localhost:8080 -> NHN-Cloud-Server:80`, `/docs` 200 확인
- 앱: Android 에뮬레이터 `Medium_Phone_API_36.1`, `com.greennode`, Metro `0.0.0.0:8081`
- 초기 점검 계정: `codex_ui_20260505160056@example.com`
- 실제 파이프라인 재검증 계정: `codexreal202605051720@example.com`
- APK: release APK 재빌드 후 설치, `android/app/build/outputs/apk/release/app-release.apk`
- 기준 코드: `USE_MOCK_AI_PIPELINE` 제거 후 `src/api/posts.ts`의 `generatePost()`와 `createPost()`가 실제 API를 호출
- Android 네트워크: MVP HTTP 터널 검증을 위해 `AndroidManifest.xml`의 `usesCleartextTraffic`을 `true`로 설정. 운영 배포 전에는 HTTPS 또는 범위 제한된 network security config로 되돌릴 필요가 있다.
- 용어 기준: `default_location`이라는 도메인 필드는 쓰지 않는다. 사용자의 **동네 위치**는 `User.latitude`, `User.longitude`가 `null`인지로 등록 여부를 판단한다.

#### 핵심 플로우 검증 결과 표

| 항목 | 분류 | 검증 결과 | 근거/관련 위치 | 다음 액션 |
|---|---|---|---|---|
| 로그인 시 유저 생성 | 정상 동작 | 신규 이메일 계정을 API로 생성하면 `latitude`, `longitude`가 `null`인 유저가 생성된다. 앱 이메일 로그인도 성공한다. | `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `src/screens/auth/SignupScreen.tsx`, `src/screens/auth/LoginEmailScreen.tsx` | 소셜 로그인에서 "로그인 시 유저 생성" 정책은 별도 검증 필요 |
| 기존 유저 재로그인 시 유저 정보 업데이트 | 정상 동작 | 로그인 후 `getMe()`로 최신 유저 정보를 받아 `authStore`에 반영한다. 위치가 있는 유저는 `refreshDeviceRegistration()`으로 위치/FCM 갱신을 시도한다. | `src/screens/auth/LoginEmailScreen.tsx`, `src/store/authStore.ts`, `src/services/deviceRegistration.ts` | FCM 토큰 실패 시 사용자 영향은 2번 실패 케이스에서 추가 검증 |
| 최초 로그인 직후 동네 위치 미설정 | 정상 동작 | 검증 계정 생성 직후 서버 응답과 `/auth/me`에서 `latitude = null`, `longitude = null` 확인. | `GET /api/v1/auth/me` | 유지 |
| 동네 위치 미설정 상태의 홈 화면 | 수정됨 | 정상 UI 흐름에서는 위치 없는 유저가 `LocationSetup`으로 이동한다. 강제 진입 시에도 홈은 `/posts/nearby`를 호출하지 않고 위치 설정 CTA를 보여준다. | `src/screens/home/HomeScreen.tsx`, `src/utils/locationGuard.ts`, `__tests__/locationGuard.test.ts` | 에뮬레이터 강제 진입 QA |
| 동네 위치 미설정 상태의 지도 화면 | 수정됨 | 지도 탭 강제 진입 시 `MapView`를 렌더링하지 않는다. 광주 전남대 기본 좌표 fallback과 반경 원 표시를 제거하고 위치 설정 CTA만 보여준다. | `src/screens/map/MapScreen.tsx`, `src/screens/map/MapScreen.styles.ts`, `src/utils/locationGuard.ts` | 에뮬레이터 강제 진입 QA |
| 동네 위치 미설정 상태의 검색 화면 | 미구현 | 독립 검색 화면이 없다. 홈 검색 아이콘과 지도 검색 입력 UI만 있고 검색 플로우는 연결되어 있지 않다. | `src/screens/home/HomeScreen.tsx`, `src/screens/map/MapScreen.tsx` | 검색 기능은 5번 미구현 기능 점검에서 백로그화 |
| 동네 위치 미설정 상태의 나눔 식재료 등록 | 수정됨 | 홈/중앙 AI 스캔 진입점은 위치가 없으면 `CameraScan` 대신 `LocationSetup`으로 보낸다. `FridgeSelect`에 직접 진입해도 냉장고 API를 호출하지 않고 위치 설정 CTA를 표시한다. | `src/navigation/MainTab.tsx`, `src/screens/home/HomeScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`, `src/utils/locationGuard.ts` | 에뮬레이터 강제 진입 QA |
| 최초 위치 등록 화면 분기 | 정상 동작 | 위치 없는 계정으로 로그인 후 앱이 `동네 설정` 화면으로 자연스럽게 이동했다. | UI 검증, `src/screens/auth/LoginEmailScreen.tsx`, `src/navigation/AppNavigator.tsx` | 유지 |
| 위치 등록 후 홈/지도/나눔 식재료 등록 반영 | 정상 동작 | `이 위치로 설정하기` 후 `/auth/me`에 좌표가 저장됐다. 홈은 `내 동네`로 표시되고, 지도와 냉장고 선택 화면은 실제 냉장고 목록을 조회했다. | `PUT /api/v1/auth/me/location`, `HomeScreen`, `MapScreen`, `FridgeSelectScreen` | 유지 |
| 위치 재설정 기능 | 정상 동작 | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. | `src/screens/home/HomeScreen.tsx`, `src/screens/profile/ProfileScreen.tsx`, `src/screens/location/LocationSetupScreen.tsx` | 권한 거부 상태 전용 CTA 보강 |
| 사진 촬영 후 이미지 파일 생성 | 정상 동작 | `takePhoto()` 호출을 `usePhotoOutput().capturePhotoToFile()`로 수정한 뒤 에뮬레이터 셔터에서 `file:///data/user/0/com.greennode/cache/VisionCamera_*.jpg` 파일 URI가 생성됐다. | UI 검증, `src/screens/camera/CameraScanScreen.tsx`, logcat | 실제 기기 촬영 검증 |
| 촬영/선택 이미지 API 전달 | 정상 동작 | mock 제거 후 release 앱에서 갤러리 선택 이미지와 셔터 촬영 이미지가 실제 `POST /api/v1/posts/generate`로 전달됐다. 셔터 촬영 재검증에서는 서버가 나눔 기준 미충족 상태 400으로 거부해 API 도달이 확인됐다. | `src/api/posts.ts`, `src/screens/camera/CameraScanScreen.tsx`, logcat | 부패/실패 응답 전용 UX 보강 |
| AI 분석 결과 표시 | 정상 동작 | 실제 AI 응답이 `분석 결과` 화면에 표시됐다. 재검증 결과는 `바나나`, `신선`, confidence 100%, 분석 메모 `식재료가 신선합니다. 나눔이 가능합니다.`였다. mock 고정값인 `사과`가 아니었다. | `src/screens/camera/AnalysisResultScreen.tsx` | stale/bad fixture로 나눔 기준 미충족 결과 추가 검증 |
| AI 결과의 나눔 식재료 생성 기본값 반영 | 정상 동작 | 실제 AI 응답 기반으로 `나눔 등록` 화면에 `바나나`, `신선`, 제목 `신선한 바나나 나눔합니다`, 설명 기본값이 채워졌다. | `src/screens/post/PostCreateScreen.tsx` | 유지 |
| 나눔 식재료 등록 후 홈 목록 반영 | 구현됨, 런타임 재검증 필요 | 냉장고 선택 후 실제 `POST /api/v1/posts` 성공과 완료 화면 표시까지 확인했다. 코드상 완료 화면의 홈 복귀는 홈 탭에 `nearbyPostsRefreshToken`을 전달하고, 홈은 포커스/토큰 변경 시 `/posts/nearby`를 재조회한다. | `src/screens/post/PostCompleteScreen.tsx`, `src/screens/home/HomeScreen.tsx`, `__tests__/postComplete.navigation.test.tsx`, `__tests__/home.nearbyRefresh.test.tsx` | 실제 앱에서 등록 직후 홈 목록 반영을 한 번 더 재검증 |
| 나눔 식재료 등록 후 지도/냉장고 관련 반영 | 부분 검증 | 냉장고 선택 화면에서 실제 냉장고 목록 `광주역 공유냉장고`, `충장로 공유냉장고`, `전남대학교 공유냉장고`가 표시됐고, 선택한 냉장고로 실제 나눔 식재료 생성까지 성공했다. 현재 지도는 냉장고 목록 중심이라 나눔 식재료 지도 반영 정책은 별도 정리가 필요하다. | `src/api/posts.ts`, `src/screens/map/MapScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx` | 지도/냉장고 상세에서 나눔 식재료를 어떻게 노출할지 정책 결정 |

#### 해결/잔여 버그 목록

1. 해결됨: `USE_MOCK_AI_PIPELINE`을 제거했고, `generatePost()`와 `createPost()`가 실제 서버를 호출하도록 수정했다. 실제 앱에서 AI 분석, 나눔 식재료 생성, 완료 화면까지 검증했고 테스트 나눔 식재료은 삭제했다.
2. 해결됨: 에뮬레이터 셔터 촬영 TypeError는 `react-native-vision-camera@5` API 변경에 맞춰 수정했고, 촬영 파일 생성 및 실제 API 호출까지 확인했다.
3. 해결됨: 위치 없는 유저가 홈/지도/냉장고 선택에 강제 진입해도 기본 좌표로 주변 API를 호출하지 않는다. 지도는 `MapView` 자체를 렌더링하지 않고, 홈/지도/냉장고 선택은 위치 설정 CTA를 표시한다.

#### 다음 스프린트에서 반드시 고칠 항목

1. 나눔 기준 미충족 상태(`canShare=false`)에서 실제 등록 화면 진입과 최종 등록을 차단하는 가드를 추가한다.
2. 실제 기기에서 카메라 촬영 파일 생성과 `react-native-vision-camera` 설정을 검증한다. 에뮬레이터에서는 갤러리 선택 fallback을 검증 경로로 명시한다.
3. 완료: 위치 미설정 상태에서 홈/지도/나눔 식재료 등록에 강제 진입했을 때 위치 등록 CTA로 되돌리는 공통 가드를 추가한다.
4. 완료: 위치 재설정 진입점을 프로필과 홈 위치 헤더에 연결한다.
5. 독립 검색 화면/검색 결과 상태는 현재 미구현으로 분리해 다음 스프린트 백로그에 넣는다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "1. MVP 핵심 플로우 검증"을 기준으로 현재 코드에서 로그인, 위치 등록, 사진 촬영, AI 분석, 나눔 식재료 등록 흐름을 추적해줘.

코드를 먼저 읽고 실제 플로우를 설명한 뒤, 각 체크 항목이 현재 구현상 가능한지/불가능한지/검증이 필요한지 분류해줘. 필요한 경우 에뮬레이터나 로그를 사용해서 검증하고, 결과를 문서에 업데이트해줘.
```

## 2. 실패 케이스와 예외 처리 검증

### 목표

MVP가 성공 케이스만 동작하는 상태인지, 실패 상황에서도 앱이 멈추지 않고 사용자에게 적절한 안내를 하는지 확인한다.

### To-do

- [x] 나눔 기준 미충족 상태가 `나쁨`일 때 나눔 식재료 등록이 막히는지 확인
- [x] 나눔 기준 미충족 상태가 `나쁨`일 때 사용자에게 실패 이유가 표시되는지 확인
- [x] 실패 후 재촬영, 수동 수정, 이전 화면 이동 등 대안이 있는지 확인
- [x] API 서버 연결 실패 시 앱이 멈추지 않는지 확인
- [x] AI 서버 연결 실패 시 앱이 멈추지 않는지 확인
- [x] 네트워크 끊김 상태에서 주요 화면이 어떻게 동작하는지 확인
- [x] 나눔 식재료 등록 버튼을 여러 번 눌렀을 때 중복 등록되지 않는지 확인
- [x] 큰 이미지 업로드 시 압축 또는 실패 처리가 있는지 확인
- [x] 카메라 권한 거부 시 안내와 대체 흐름이 있는지 확인
- [x] 위치 권한 거부 시 안내와 대체 흐름이 있는지 확인
- [x] 주변 냉장고 없음 상태가 자연스럽게 표시되는지 확인
- [x] 나눔 식재료 없음 상태가 자연스럽게 표시되는지 확인
- [x] 검색 결과 없음 상태가 자연스럽게 표시되는지 확인
- [x] 다른 유저의 나눔 식재료 수정/삭제가 막히는지 확인

### 산출물

- 실패 케이스별 현재 동작 기록
- 사용자에게 보여줄 문구/대안이 필요한 곳 목록
- 서버/API/AI 실패 시 보완해야 할 에러 핸들링 목록

### 검증 결과 (2026-05-05)

#### 검증 범위

- 코드 점검: `src/screens/camera/*`, `src/screens/post/*`, `src/screens/location/*`, `src/screens/home/HomeScreen.tsx`, `src/screens/map/MapScreen.tsx`, `src/api/posts.ts`, `src/api/client.ts`, `src/config/api.ts`
- 직접 API 확인:
  - `/docs` 응답 200
  - 잘못된 `imageToken`으로 나눔 식재료 생성 요청 시 HTTP 400, `이미지가 만료되었거나 유효하지 않습니다. 다시 촬영해주세요.` 반환
  - 작성자 A가 만든 임시 나눔 식재료를 사용자 B 토큰으로 삭제 요청 시 HTTP 403, `권한이 없습니다.` 반환
  - 임시 나눔 식재료은 작성자 토큰으로 삭제 완료
- 앱 동작 참고: 1번 MVP 핵심 플로우 검증에서 에뮬레이터 홈 빈 상태, 갤러리 업로드 플로우, 위치 설정 이후 홈/지도/냉장고 흐름 확인
- mock 제거 후 추가 확인: release 앱에서 실제 AI 분석(`바나나`/`신선`)과 실제 나눔 식재료 생성(id `6`, 검증 후 삭제)을 확인
- 미실행: 실제 네트워크 차단, OS 권한 revoke, 대용량 이미지 업로드는 이번 단계에서 코드 기준으로 판정했다.

#### 항목별 현재 동작

| 항목 | 판정 | 현재 동작/근거 | 후속 작업 |
| --- | --- | --- | --- |
| 나눔 기준 미충족 등록 차단 | 구현됨 | `AnalysisResultScreen`은 `canShare=false`일 때 CTA를 disabled 처리하고, `PostCreateScreen`/`FridgeSelectScreen`에도 최종 품질 가드가 있다. | stale/bad fixture로 회귀 검증 |
| 나눔 기준 미충족 실패 이유 표시 | 구현됨, fixture 검증 필요 | `generatePost` 실패나 서버 에러는 `message`뿐 아니라 `detail`도 Alert에 표시한다. 실제 stale/bad fixture는 아직 확보하지 못했다. | stale/bad fixture 또는 테스트 이미지를 확보하고, 나눔 기준 미충족 사유 문구를 실제 앱에서 검증한다. |
| 실패 후 대안 흐름 | 부분 구현 | 분석 결과 화면에는 재촬영과 작성 화면 진입이 있다. generate 실패 Alert는 `다시 촬영`/`갤러리 선택` 대안을 제공한다. 수동 입력 CTA는 아직 없다. | 실패 Alert에 수동 입력 선택지를 추가할지 결정한다. |
| API 서버 연결 실패 | 부분 구현 | 홈/지도/냉장고 목록은 error/empty 상태와 retry UI를 분리했다. 위치 등록, 나눔 식재료 상세, 나눔 식재료 생성은 여전히 화면별 Alert 중심이다. | API 오류 문구 추출과 retry 패턴을 공통화한다. |
| AI 서버 연결 실패 | 추가 검증 필요 | `postMultipart`는 네트워크 오류와 30초 타임아웃을 reject하고 `CameraScanScreen`이 Alert를 띄운다. mock 제거 후 실제 성공 경로는 검증했지만, AI 서버 중단/타임아웃 fault injection은 아직 하지 않았다. | AI 서버 중단/타임아웃 케이스를 실제 환경에서 재검증한다. |
| 네트워크 끊김 | 미흡 | 공통 offline 상태가 없고, 화면별로 Alert 또는 로그만 남긴다. 홈/지도는 실패가 빈 상태처럼 보일 수 있다. | 공통 네트워크 에러 문구와 retry 패턴을 정한다. |
| 중복 등록 방지 | 부분 구현 | `FridgeSelectScreen`은 `isSubmitting`과 ref 기반 re-entry guard로 같은 화면의 빠른 중복 제출을 막는다. 서버 idempotency는 아직 없다. | 서버에도 idempotency key 또는 중복 방지 기준을 검토한다. |
| 큰 이미지 업로드 | 부분 구현 | 갤러리 선택은 2048px 리사이즈, `quality: 0.8`, 8MB 초과 업로드 전 차단을 적용한다. 업로드 진행률은 아직 없다. | 실제 대용량 fixture로 차단 문구와 앱 멈춤 여부를 검증한다. |
| 카메라 권한 거부 | 미흡 | 권한이 없으면 `카메라 권한이 필요합니다.` 문구만 보인다. 권한 재요청, 설정 이동, 갤러리 대체 버튼이 없다. 카메라 장치가 없을 때만 갤러리 fallback이 있다. | 권한 거부 화면에 다시 요청/설정 열기/갤러리 선택을 제공한다. |
| 위치 권한 거부 | 부분 구현 | 권한 요청 문구와 Alert는 있다. 거부 후 `이 위치로 설정하기` 버튼은 다시 활성화되고 누르면 `위치 정보를 가져올 수 없습니다.` Alert만 나온다. | 권한 거부 상태 전용 CTA와 설정 이동/재시도 흐름을 추가한다. |
| 주변 냉장고 없음 | 구현됨, 실제 좌표 추가 검증 필요 | `FridgeSelectScreen`과 `MapScreen`에 빈 상태 문구가 있다. 실제 냉장고가 없는 좌표를 넣은 에뮬레이터 검증은 아직 하지 않았다. | 테스트용 no-fridge 좌표 또는 fixture로 빈 상태를 재현한다. |
| 나눔 식재료 없음 | 구현됨 | 1번 검증에서 홈 화면이 `아직 근처에 나눔이 없어요` 빈 상태를 표시했다. | 없음. |
| 검색 결과 없음 | 구현됨 | 홈 검색 아이콘은 지도 탭으로 이동하고, 지도 검색 입력은 공유 냉장고 이름/주소를 로컬 필터링한다. 결과가 없으면 빈 상태와 검색 초기화를 제공한다. | 서버 검색/나눔 식재료 검색은 후속 범위로 분리한다. |
| 타 유저 수정/삭제 차단 | 부분 구현 | 상세 화면은 작성자일 때만 삭제 버튼을 보여준다. 직접 API 검증에서도 타 사용자 삭제는 HTTP 403으로 막혔다. 수정 기능은 아직 화면/API 흐름이 없어 검증 대상에서 제외된다. | 수정 기능을 만들 때 동일한 소유자 가드를 적용하고, 403 UX를 통일한다. |

#### 버그/미구현 후보

- 나눔 기준 미충족 등록 차단은 구현됐고, 서버 400 `detail`도 Alert에 표시하도록 수정했다. 실제 stale/bad fixture 검증이 남았다.
- mock 파이프라인은 제거되어 실제 성공 경로는 확인됐다. 다만 나눔 기준 미충족 판정 fixture, AI 장애, 중복 생성 같은 실패 경로는 아직 별도 재현이 필요하다.
- 홈/지도/냉장고 목록 조회 실패는 error/empty 상태가 분리됐지만, 네트워크 끊김/공통 오류 문구는 아직 화면별로 흩어져 있다.
- 카메라/위치 권한 거부 후 대체 흐름이 부족하다.
- 검색 결과 없음 상태는 지도 공유 냉장고 로컬 검색 기준으로 구현했다.
- 대용량 이미지는 8MB 초과 업로드 전 차단을 추가했다. 네트워크 끊김 UX와 업로드 진행률은 아직 없다.

#### 다음 스프린트 처리 제안

- 우선순위 1: stale/bad fixture 확보, 나눔 기준 미충족 실패 사유 실제 앱 검증, 실제 나눔 식재료 생성의 중복 방지 검증
- 우선순위 2: API/AI/네트워크 실패 공통 UX, 권한 거부 대체 흐름, 목록 화면 retry 상태
- 우선순위 3: 서버 idempotency, 네트워크 끊김 UX, 업로드 진행률, 검색 서버 확장 여부 결정

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "2. 실패 케이스와 예외 처리 검증"을 기준으로 현재 앱의 예외 처리 상태를 점검해줘.

특히 나눔 기준 미충족 상태가 나쁨일 때 나눔 식재료 등록 실패 처리, API/AI 서버 실패 처리, 권한 거부 처리, 중복 등록 방지를 중점적으로 봐줘. 실제 코드 위치와 함께 버그/미구현/정책 결정 필요 항목으로 분류해줘.
```

## 3. AI 파이프라인 데이터 흐름 검증

### 목표

사진이 앱에서 서버와 AI 파이프라인을 거치며 어떤 데이터로 변환되는지 확인하고, 현재 모델이 어떤 판단을 하는지 검증한다.

### To-do

- [x] 앱에서 생성한 이미지 데이터 형식 확인
- [x] 앱에서 API 서버로 보내는 request payload 확인
- [ ] API 서버에서 AI 서버로 넘기는 데이터 형식 확인
- [ ] AI 서버 응답 형식 확인
- [x] AI 응답이 앱의 분석 결과 화면으로 변환되는 방식 확인
- [x] AI 응답이 나눔 식재료 생성 데이터로 변환되는 방식 확인
- [x] 현재 모델이 대표 객체 하나만 판단하는지 확인
- [ ] 현재 모델이 여러 객체를 분리할 수 있는지 확인
- [ ] 한 이미지에 여러 음식이 있을 때 결과가 어떻게 나오는지 확인
- [x] AI confidence 값이 있는지 확인
- [x] AI confidence 값이 있다면 현재 UI/로직에서 사용되는지 확인
- [x] 부패도 판단 기준이 `좋음/보통/나쁨`인지, 다른 상태값이 있는지 확인
- [x] `나쁨` 상태가 어느 레이어에서 등록 실패로 바뀌는지 확인

### 테스트 이미지 후보

- [x] 음식 하나가 선명하게 찍힌 사진
- [ ] 음식 여러 개가 함께 찍힌 사진
- [ ] 어두운 사진
- [ ] 흔들린 사진
- [ ] 너무 가까운 사진
- [ ] 너무 먼 사진
- [ ] 포장재가 있는 사진
- [ ] 라벨이나 유통기한이 보이는 사진
- [ ] 내부 상태가 보이지 않는 사진

### 산출물

- 앱 -> API -> AI -> API -> 앱 데이터 흐름 요약
- 실제 request/response 예시
- AI 결과 필드 설명
- multi-object detection 적용 가능 지점
- 다음 스프린트에서 보강할 AI 관련 작업 목록

### 검증 결과 (2026-05-05)

#### 검증 범위

- 앱 코드: `CameraScanScreen`, `posts.ts`, `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`, `types/post.ts`
- API 계약: `GET /openapi.json`
- 실제 API 호출: `POST /api/v1/posts/generate`
- 실제 앱 흐름 참고: 1번 MVP 검증에서 release 앱으로 갤러리 이미지 선택 후 `바나나`/`신선` 결과와 실제 나눔 식재료 생성 확인
- 미검증: API 서버 내부에서 AI 서버로 넘기는 raw payload, raw AI 서버 응답, multi-object 이미지 결과

#### 앱 -> API -> 앱 데이터 흐름

1. `CameraScanScreen`에서 이미지가 준비된다.
   - 카메라 촬영: `file://${photo.path}`, 기본 `type='image/jpeg'`, `name='photo.jpg'`
   - 갤러리 선택: `asset.uri`, `asset.type`, `asset.fileName`
   - 갤러리는 `quality: 0.8`만 지정하며 최대 해상도/파일 크기 제한은 없다.
2. `generatePost()`가 `multipart/form-data`를 만든다.
   - 필수 필드: `image`
   - 선택 필드: `user_hint`
   - 인증: `Authorization: Bearer {token}`
   - 전송: `XMLHttpRequest`, timeout 30초
3. 서버가 `PostGenerateResult`를 반환한다.
   - 추천 나눔 식재료 필드: `suggestedTitle`, `suggestedDescription`, `suggestedCategory`
   - 감지 객체 필드: `detectedFruit`, `detectedFruitKo`
   - AI 필드: `aiAnalysis.isFresh`, `confidenceScore`, `category`, `analysisMessage`, `analysisSkipped`
   - 최종 등록 연결 필드: `imageToken`
4. `AnalysisResultScreen`은 route param의 `result`와 `imageUri`만 사용한다.
   - `aiAnalysis.category`를 `fresh/good`, `normal/mid/medium`, `rotten/stale/bad`로 매핑한다.
   - `confidenceScore`는 화면 표시나 차단 조건으로 직접 사용하지 않는다.
   - `canShare=false`여도 CTA 스타일만 흐려지고 실제 이동은 막히지 않는다.
5. `PostCreateScreen`은 AI 응답을 나눔 식재료 초깃값으로 변환한다.
   - 제목/설명/카테고리: `suggestedTitle`, `suggestedDescription`, `suggestedCategory`
   - 판별 농산물: `detectedFruitKo || aiAnalysis.detectedFruitKo || detectedFruit || aiAnalysis.detectedFruit`
   - 이미지 원본은 다시 보내지 않고 `imageToken`만 다음 화면으로 넘긴다.
6. `FridgeSelectScreen`은 냉장고 선택 후 `POST /api/v1/posts`를 호출한다.
   - 현재 서버 OpenAPI 기준 content type은 `application/x-www-form-urlencoded`
   - body는 `data=<JSON 문자열>`이고 JSON 안에 `title`, `description`, `category`, `fridgeId`, `expirationDate`, `imageToken`이 들어간다.
   - 통합 가이드의 `multipart/form-data` 예시는 현재 OpenAPI/앱 구현과 다르므로 갱신이 필요하다.

#### 실제 request/response 예시

요청:

```text
POST /api/v1/posts/generate
Authorization: Bearer {token}
Content-Type: multipart/form-data

image=@android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png; type=image/png
```

응답 요약:

```json
{
  "success": true,
  "message": "나눔 식재료 자동 생성이 완료되었습니다.",
  "data": {
    "suggestedTitle": "신선한 사과 나눔합니다",
    "suggestedDescription": "AI 분석 결과: Fresh (신뢰도 100%). 사과을(를) 나눔합니다. 관심 있으신 분은 연락주세요!",
    "suggestedCategory": "기타",
    "detectedFruit": "apple",
    "detectedFruitKo": "사과",
    "aiAnalysis": {
      "isFresh": true,
      "confidenceScore": 1.0,
      "category": "Fresh",
      "analysisMessage": "식재료가 신선합니다. 나눔이 가능합니다.",
      "detectedFruit": "apple",
      "detectedFruitKo": "사과",
      "analysisSkipped": false
    },
    "isAutoGenerated": false,
    "imageToken": "dcf7...510e"
  }
}
```

#### 확인된 판단

| 항목 | 결론 | 근거 | 후속 작업 |
| --- | --- | --- | --- |
| 앱 이미지 데이터 | 확인됨 | 카메라/갤러리 모두 `{uri, type, name}` 형태로 `generatePost()`에 전달된다. | 파일 크기/해상도/압축 정책 추가 |
| generate request | 확인됨 | OpenAPI는 `multipart/form-data`, `image` 필수, `user_hint` 선택으로 정의한다. | `API_INTEGRATION_CONTRACT.md` 갱신 완료. 앱/서버 category enum 정합성은 별도 구현 필요 |
| API -> AI 내부 payload | 미확인 | 현재 repo에는 백엔드/AI 서버 코드가 없다. OpenAPI도 앱과 API 서버 사이 계약만 보여준다. | 백엔드 코드 또는 서버 로그로 별도 검증 |
| raw AI 서버 응답 | 미확인 | 앱이 받는 것은 API 서버가 정리한 `PostGenerateResult`이다. | AI 서버 원 응답 schema 확보 |
| 대표 객체 처리 | 현재 계약은 단일 객체 | 응답 schema가 `detectedFruit`/`detectedFruitKo` 단일 문자열만 제공한다. 배열, bounding box, object id 필드가 없다. | multi-object를 하려면 `detections[]` 같은 새 계약 필요 |
| multi-object 실제 성능 | 미확인 | 여러 음식이 있는 테스트 이미지를 아직 호출하지 않았다. | 테스트 이미지 세트 준비 후 generate 반복 검증 |
| confidence | 화면 표시/확인 필요 분기 구현 | `confidenceScore`는 분석 결과/작성 화면에 표시되고, 낮은 confidence는 `확인 필요`로 분기한다. 단, confidence만으로 즉시 등록 차단하지는 않는다. | threshold와 사용자 확인 UX를 실제 fixture로 검증 |
| 신선도 등급 | 서버 값은 문자열 | 확인된 값은 `Fresh`; 앱은 `fresh/good`, `normal/mid/medium`, `rotten/stale/bad`를 **신선도 등급**으로 매핑한다. `Fresh/Normal` 계열은 나눔 가능, `Stale/Bad/Rotten` 계열은 나눔 기준 미충족이다. | category enum을 서버와 앱에서 고정 |
| 나눔 기준 미충족 등록 가드 | 구현됨 | `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`에서 `canShare=false`일 때 등록 진행과 최종 등록을 차단한다. | stale/bad fixture로 회귀 검증 |

#### 다음 스프린트 AI 보강 작업 후보

1. category enum 정합성 고정: `Fresh/Normal/Stale/Bad/Rotten` 등 서버 문자열과 앱 품질 라벨 매핑을 테스트로 고정한다.
2. stale/bad 테스트 fixture 확보: `Fresh` 외에 `Normal`, `Stale/Bad/Rotten` 응답을 실제 이미지 또는 서버 fixture로 재현한다.
3. confidence 정책 추가: 낮은 confidence일 때 재촬영, 수동 입력, 등록 차단 중 하나로 결정한다.
4. 나눔 기준 미충족 등록 차단 회귀 검증: `canShare=false`일 때 화면 이동과 최종 등록이 계속 막히는지 stale/bad fixture로 확인한다.
5. multi-object 연구 항목 분리: 현재 계약은 단일 객체이므로 다음 스프린트에서는 `detections[]` 응답 구조와 UI 표시 방식을 먼저 설계한다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "3. AI 파이프라인 데이터 흐름 검증"을 기준으로 이미지 업로드부터 AI 응답이 나눔 식재료 생성 데이터로 바뀌는 과정을 추적해줘.

관련 코드 파일, request/response 형태, 현재 사용되는 AI 결과 필드, 나눔 기준 미충족 상태가 나쁨일 때 차단되는 위치를 정리해줘. 가능하면 로그를 추가하거나 기존 로그를 확인해서 실제 데이터 예시도 남겨줘.
```

## 4. 한 장 촬영 UX와 multi-object 정책 정리

### 목표

교수님 피드백인 multi-object detection 적용 가능성과, 세이님 피드백인 한 장 촬영 흐름의 리스크를 다음 스프린트 정책으로 정리한다.

### To-do

- [x] 한 장 촬영만으로 충분히 판단 가능한 케이스 정리
- [x] 한 장 촬영으로 판단이 어려운 케이스 정리
- [x] 라벨, 유통기한, 내부 상태가 사진 한 장에 안 보일 때의 처리 방식 정하기
- [x] 잘못 찍은 사진일 때 재촬영 유도 UI가 있는지 확인
- [x] AI confidence가 낮을 때 등록을 막을지 정하기
- [x] AI confidence가 낮을 때 재촬영을 요구할지 정하기
- [x] AI confidence가 낮을 때 수동 입력으로 넘길지 정하기
- [x] 여러 음식이 감지될 때 하나의 나눔 식재료로 처리할지 정하기
- [x] 여러 음식이 감지될 때 객체별로 분리 등록할지 정하기
- [x] 여러 객체 중 하나라도 `나쁨`이면 전체 등록을 막을지 정하기
- [x] 여러 객체별로 나눔 기준 미충족 상태를 표시할지 정하기
- [x] multi-object detection을 지금 MVP에 붙일지, 다음 스프린트 연구/검증 항목으로 둘지 정하기

### 권장 정책 초안

- 기본 흐름은 한 장 촬영으로 유지한다.
- AI confidence가 낮거나, 여러 객체가 감지되거나, 부패 판단이 불확실하면 추가 확인을 요구한다.
- 추가 확인은 처음부터 여러 장 촬영을 강제하기보다 재촬영 또는 수동 수정으로 처리한다.
- multi-object detection은 바로 필수 기능으로 넣기보다, 먼저 현재 파이프라인에 붙일 수 있는 지점과 판단 기준을 검증한다.

### 검증 결과 (2026-05-05)

#### 검증 범위

- 코드: `src/screens/home/HomeScreen.tsx`, `src/screens/camera/CameraScanScreen.tsx`, `src/screens/camera/AnalysisResultScreen.tsx`, `src/screens/post/PostCreateScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`, `src/api/posts.ts`, `src/types/post.ts`
- API 계약: `GET /openapi.json`의 `POST /api/v1/posts/generate`, `PostGenerateResult`, `PostAIResult`
- 실제 UI: Android 에뮬레이터 `com.greennode` 홈 -> `AI 신선도 스캔` -> 카메라 화면
- 캡처 근거: `temp/section4-scan-screen.png`

#### 구현 상태 요약

| 항목 | 분류 | 검증 결과 | 근거/관련 위치 | 다음 액션 |
|---|---|---|---|---|
| 한 장 촬영 기본 흐름 | 정상 동작 | 현재 앱은 사진 1장을 `POST /api/v1/posts/generate`에 보내고, 결과 1개를 분석 결과/나눔 식재료 작성 화면으로 넘긴다. 홈 화면 문구도 `사진 한 장으로 나눔 가능 여부 확인`이다. | `CameraScanScreen.processImage()`, `generatePost()`, `HomeScreen` UI | MVP 기본 흐름은 한 장 촬영으로 유지 |
| 한 장으로 충분한 케이스 | 정책 결정 필요 | 외관이 잘 보이는 단일 과일/채소, 포장 밖에서 상태를 충분히 볼 수 있는 식재료는 한 장 촬영으로 처리 가능하다. 현재 실제 검증도 단일 대표 객체 응답을 전제로 통과했다. | `GenerateResult.detectedFruit`, `aiAnalysis.category` | 데모/검증 이미지는 단일 객체 중심으로 준비 |
| 한 장으로 어려운 케이스 | 정책 결정 필요 | 유통기한 라벨, 포장 내부 상태, 절단면, 냄새/촉감, 캔/불투명 포장, 어두움/흔들림/가림, 여러 음식이 섞인 사진은 한 장만으로 신뢰하기 어렵다. | 현재 UI에는 보조 질문/추가 촬영 단계 없음 | 낮은 confidence 또는 불확실 상태에서 재촬영/수동 수정으로 보낸다 |
| 라벨/유통기한/내부 상태 | 미구현 | 앱은 유통기한을 이미지에서 읽지 않고 나눔 식재료 생성 시 기본 3일 후로 설정한다. 라벨 OCR, 포장 내부 상태 확인, 유통기한 수동 입력 필드는 없다. | `PostCreateScreen`의 `expDate + 3일` | 유통기한 수동 입력 또는 라벨 사진/OCR은 다음 스프린트 후보 |
| 잘못 찍은 사진 재촬영 UI | 부분 구현 | 분석 결과 화면에는 `다시 촬영` 버튼이 있다. 촬영 실패 Alert는 갤러리 선택 대안을 제공한다. 분석 실패 Alert는 아직 서버 오류 문구 중심이다. | `AnalysisResultScreen` footer, `CameraScanScreen` catch Alert | 분석 실패 Alert를 재촬영/갤러리/수동 입력 액션형 대안으로 변경 |
| AI confidence 표시/활용 | 부분 구현 | `confidenceScore`는 분석 결과/작성 화면에 표시되고 낮은 confidence는 `확인 필요`로 분기한다. 다만 재촬영 강제나 수동 입력 전용 CTA는 없다. | `AiAnalysis.confidenceScore`, `AnalysisResultScreen`, `PostCreateScreen` | 낮은 confidence fixture로 실제 UX 검증 |
| confidence 낮을 때 등록 차단 | 정책 결정 완료 | 낮은 confidence는 단독 등록 차단 사유로 보지 않고 `확인 필요`로 표시한다. 나눔 기준 미충족 신선도 등급만 `canShare=false`로 등록을 차단한다. | `AnalysisResultScreen`, `postPolicy.needsAnalysisReview()` | 확인 필요 상태에서 사용자 확인/수동 수정 UX 보강 |
| confidence 낮을 때 재촬영 | 부분 구현 | 낮은 confidence 전용 안내는 표시되지만 재촬영을 강제하지는 않는다. | `AnalysisResultScreen`, `CameraScanScreen` | `confidenceScore < threshold`면 재촬영 CTA를 강조 |
| confidence 낮을 때 수동 입력 | 부분 구현 | 분석 성공 뒤 나눔 식재료 작성 화면에서 제목/카테고리/설명은 수정 가능하다. 하지만 낮은 confidence 또는 분석 실패에서 바로 수동 입력으로 넘기는 흐름은 없다. | `PostCreateScreen` TextInput, category chip | `수동으로 입력` CTA 추가 |
| 여러 음식 하나의 나눔 식재료 처리 | 현재 구조상 단일 대표 객체만 가능 | 현재 응답 계약은 `detectedFruit`, `detectedFruitKo` 단일 문자열이다. `detections[]`, bounding box, object id가 없다. | OpenAPI `PostGenerateResult`, `PostAIResult`, `src/types/post.ts` | MVP에서는 대표 객체 1개 나눔 식재료로만 처리 |
| 여러 음식 객체별 분리 등록 | 미구현 | 앱 내 route param, 타입, 나눔 식재료 작성 화면이 모두 단일 결과를 전제로 한다. 객체별 분리 등록 UX가 없다. | `RootStackParamList`, `GenerateResult`, `PostCreateScreen` | 다음 스프린트에서 계약/UX 먼저 설계 |
| 여러 객체 중 하나라도 나쁨일 때 차단 | 미구현 | multi-object 결과가 없어서 객체별 `나쁨` 판단 자체가 불가능하다. 서버 설명상 `Stale`/AI 장애는 generate 단계에서 400으로 거부되는 흐름이므로 앱은 실패 Alert만 받는다. | OpenAPI `generate` 설명, `CameraScanScreen` error handling | multi-object 도입 시 보수적으로 전체 확인 필요 상태 처리 |
| 객체별 나눔 기준 미충족 상태 표시 | 미구현 | 단일 `category`만 표시한다. 객체별 상태, confidence, 박스 표시 UI가 없다. | `AnalysisResultScreen` 품질 분류, `PostCreateScreen` 분석 카드 | `detections[]` 계약 이후 표시 방식 설계 |
| multi-object 적용 시점 | 정책 결정 | 지금 MVP에는 붙이지 않는다. 현재 파이프라인은 단일 이미지/단일 대표 객체 계약이라 multi-object를 붙이면 API 계약, 결과 화면, 나눔 식재료 작성/분리 등록 UX가 동시에 바뀐다. | `PostGenerateResult` 필드 목록, 앱 route 구조 | 다음 스프린트 연구/검증 항목으로 분리 |

#### 정책 결정안

- MVP 기본값은 한 장 촬영 유지.
- 한 장 촬영은 `단일 식재료 + 외관이 충분히 보임 + Fresh/Mid + confidence 기준 이상`일 때만 바로 진행한다.
- 라벨, 유통기한, 내부 상태가 핵심인 식재료는 AI가 확정하지 않고 `확인 필요`로 분기한다.
- 낮은 confidence는 단독 등록 차단 사유로 확정하지 않는다. 대신 재촬영, 갤러리 재선택, 수동 입력 중 하나를 요구한다.
- `Stale/Bad/Rotten` 또는 서버 generate 400은 직접 나눔 등록으로 보내지 않고 재촬영/수동 확인으로 돌린다.
- multi-object detection은 MVP 필수 기능이 아니라 다음 스프린트의 API 계약/UX 연구 항목으로 둔다.
- multi-object를 도입할 경우 먼저 `detections[]` 계약을 정의한다. 최소 필드는 `label`, `labelKo`, `confidence`, `qualityCategory`, `bbox`다.

#### 다음 스프린트 작업 후보

1. 나눔 기준 미충족(`canShare=false`) 등록 차단을 stale/bad fixture로 회귀 검증한다.
2. 낮은 confidence fixture로 `확인 필요` 상태와 작성 화면 표시를 검증한다.
3. 분석 실패/촬영 실패 Alert를 `다시 촬영`, `갤러리에서 선택`, `수동 입력` 액션으로 바꾼다.
4. 유통기한 기본 3일 자동값 대신 수동 입력 필드를 추가하거나, 최소한 작성 화면에서 수정 가능하게 만든다.
5. multi-object 검증용 이미지 세트를 준비한다: 단일 객체, 여러 객체, 흐림/어두움, 라벨/유통기한 포함, 포장 내부 미노출, 나눔 기준 미충족.
6. API 초안에 `detections[]` 응답 계약을 추가하고, 대표 객체 1개 처리와 객체별 분리 등록 중 어느 UX가 맞는지 별도 검증한다.
7. 완료: 에뮬레이터 셔터의 `Capture error TypeError: undefined is not a function`는 `usePhotoOutput().capturePhotoToFile()` 적용 후 사라졌고, 촬영 파일이 API로 전달됐다.

### 산출물

- 한 장 촬영 유지/변경 결정
- multi-object detection 적용 여부 결정
- AI confidence 기반 fallback 정책
- 다음 스프린트용 AI/UX 작업 후보

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "4. 한 장 촬영 UX와 multi-object 정책 정리"를 바탕으로 현재 코드와 AI 파이프라인 구조에서 한 장 촬영 흐름을 유지할 때의 리스크를 정리해줘.

현재 구현으로 대응 가능한 것과 정책 결정이 필요한 것을 나누고, 다음 스프린트에 넣을 수 있는 작은 작업 단위로 쪼개줘.
```

## 5. 미구현 기능 상태 점검

### 목표

아직 안 된 기능을 모두 구현하려 하지 말고, 현재 구현 상태와 다음 스프린트 우선순위를 분리한다.

### To-do

- [x] 소셜 로그인 구현 상태 확인
- [x] 이메일 인증 구현 상태 확인
- [x] 최초 위치 등록 구현 상태 확인
- [x] 위치 재설정 구현 상태 확인
- [x] 홈 화면의 오늘의 나눔 정보 구성 방식 정하기
- [x] 홈 화면의 탄소 절감액 표시 방식 정하기
- [x] 홈 화면의 내 주변 실시간 나눔 영역 구성 방식 정하기
- [x] 홈 화면 데이터 없음 상태 확인
- [x] 검색 기능 구현 상태 확인
- [x] 검색 결과 없음 상태 확인
- [x] 푸쉬 알림 구현 상태 확인
- [x] 유저 프로필 구현 상태 확인
- [x] 유저 통계 표시 여부 결정
- [x] 냉장고 내부 아이템 조회 구현 상태 확인
- [x] 지도에서 근처 냉장고 조회가 실제 데이터로 동작하는지 확인
- [x] 채팅 탭을 유지할지 제거할지 결정
- [x] 채팅을 WebSocket으로 구현할지 단순 문의/예약 기능으로 축소할지 결정

### 우선순위 기준

#### 우선순위 높음

- 로그인/유저 생성
- 최초 위치 등록/위치 재설정
- 사진 업로드와 AI 파이프라인
- 나눔 식재료 등록 성공/실패 처리
- 홈 화면 기본 데이터 표시
- 냉장고 지도/목록 기본 조회

#### 우선순위 중간

- 검색 기능
- 유저 프로필/통계
- 냉장고 내부 아이템 조회
- 푸쉬 알림
- 소셜 로그인/이메일 인증 보강

#### 우선순위 낮음 또는 보류

- WebSocket 기반 실시간 채팅
- 복잡한 탄소 절감 통계 시각화
- 소셜 로그인 전체 예외 케이스
- 이메일 verification 전체 예외 케이스

### 검증 결과 (2026-05-05)

#### 검증 범위

- 코드 점검: `src/screens/auth/*`, `src/screens/home/HomeScreen.tsx`, `src/screens/map/MapScreen.tsx`, `src/screens/profile/ProfileScreen.tsx`, `src/screens/chat/ChatListScreen.tsx`, `src/screens/location/LocationSetupScreen.tsx`, `src/api/*`, `src/services/deviceRegistration.ts`
- API 계약 확인: `GET /openapi.json`
- 확인된 서버 API: `/auth/signup`, `/auth/login`, `/auth/me`, `/auth/me/location`, `/posts`, `/posts/generate`, `/posts/nearby`, `/fridges/nearby`, `/fridges/available`
- 미확인/부재 API: 소셜 로그인, 이메일 verification, 검색, 유저 통계, 냉장고 내부 아이템, 채팅/WebSocket

#### 기능별 구현 상태

| 항목 | 상태 | 현재 구현 | 다음 액션 |
| --- | --- | --- | --- |
| 소셜 로그인 | 목업 | `LoginScreen`에 카카오/Apple/Google 버튼은 있지만 `준비 중` Alert만 표시한다. 서버 OpenAPI에도 소셜 로그인 엔드포인트가 없다. | MVP에서는 이메일 로그인만 공식 경로로 표시하거나, 소셜 버튼을 숨긴다. |
| 이메일 인증 | 미구현 | 이메일 형식 검증과 회원가입 API만 있다. 이메일 인증 메일, OTP, verification 상태 필드는 없다. | 다음 스프린트 범위 밖이면 “이메일 형식 검증만 제공”으로 명시한다. |
| 최초 위치 등록 | 구현됨 | 로그인 후 `latitude === null`이면 `LocationSetup`으로 분기하고, GPS 좌표와 FCM 토큰을 `/auth/me/location`에 저장한다. | 권한 거부/수동 위치 입력 UX 보강. |
| 위치 재설정 | 구현됨 | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. API는 `/auth/me/location`을 재사용한다. | 권한 거부/수동 위치 입력 UX 보강. |
| 주변 나눔 수 | 부분 구현/임시 | 홈 통계는 `posts.length`를 `주변 나눔`으로 표시한다. pagination 전 현재 조회 결과 수 기준이다. | 실제 통계로 유지하려면 기준과 API를 정의한다. |
| 탄소 절감액 | 정리됨 | 홈과 프로필의 고정 kg 값을 제거하고 `준비 중`으로 표시한다. 계산식/API는 없다. | 실제 지표를 넣으려면 계산식과 API 계약을 먼저 정의한다. |
| 내 주변 실시간 나눔 | 부분 구현 | `getNearbyPosts()`로 실제 주변 나눔 식재료를 가져와 카드로 표시한다. 실시간 구독, pagination, `전체보기` 동작은 없다. | 등록 완료 후 refresh 보장, 전체보기/상세 연결 UX 보강. |
| 홈 데이터 없음 상태 | 구현됨 | 나눔 식재료가 없으면 `아직 근처에 나눔이 없어요` 빈 상태를 표시한다. | API 실패와 진짜 빈 상태를 구분하는 에러 UI 추가. |
| 검색 기능 | 부분 구현 | 홈 검색 아이콘은 지도 탭으로 이동하고, 지도 검색 입력은 공유 냉장고 이름/주소 로컬 필터로 동작한다. 서버 OpenAPI에는 검색 엔드포인트가 없다. | 나눔 식재료/동네 서버 검색은 후속 범위로 분리. |
| 검색 결과 없음 | 구현됨 | MVP 검색은 지도 공유 냉장고 이름/주소 로컬 필터로 제한했다. 결과 없음 상태와 검색 초기화가 있다. | 나눔 식재료/동네 서버 검색은 후속 범위로 분리. |
| 푸쉬 알림 | 부분 구현 | Firebase Messaging 의존성, Android 알림 권한, FCM 토큰 등록은 있다. foreground/background 수신 처리, 알림 목록, 읽음 상태는 없다. 채팅 탭 mock 데이터는 제거하고 빈 알림함으로 축소했다. | “FCM 토큰 등록 + 빈 알림함”까지만 구현으로 범위를 명확히 하고 수신 핸들러를 별도 작업화. |
| 유저 프로필 | 부분 구현 | 닉네임/이메일은 실제 유저 정보를 표시한다. 프로필 수정, 메뉴 이동, 내 나눔/관심/받은 나눔은 연결되어 있지 않다. | 프로필 수정 또는 내 나눔 내역 중 하나만 우선 연결. |
| 유저 통계 | 정리됨 | 신선도 온도, 포인트, 탄소 절감량의 하드코딩 숫자를 제거하고 `준비 중` 상태로 표시한다. | 실제 지표를 넣으려면 계산식과 API 계약을 먼저 정의. |
| 냉장고 내부 아이템 조회 | 미구현 | 지도/선택 화면은 냉장고 목록만 조회한다. 냉장고 상세/내부 아이템 API와 화면이 없다. | 나눔 식재료를 냉장고별로 볼 것인지, 별도 inventory를 둘 것인지 정책 결정. |
| 지도 근처 냉장고 조회 | 구현됨 | `MapScreen`이 `/fridges/nearby`, `FridgeSelectScreen`이 `/fridges/available`을 호출한다. 1번 검증에서 실제 냉장고 목록 표시를 확인했다. | 위치 미설정 기본 좌표 fallback과 API 실패 UI 보강. |
| 채팅 탭 | 축소됨 | `ChatListScreen`의 `MOCK_CHATS`를 제거하고 탭 라벨을 `알림`으로 바꿨다. WebSocket, 채팅방 상세, 메시지 송수신 API는 없다. | MVP에서는 알림함으로 유지하고 WebSocket 채팅은 보류. |
| WebSocket 채팅 | 미구현/보류 권장 | 코드와 OpenAPI 모두 실시간 채팅 계약이 없다. 구현/검증 비용이 크다. | 다음 스프린트에서는 단순 문의/예약 CTA 또는 알림함으로 축소한다. |

#### 다음 스프린트 우선순위 제안

1. 위치 재설정 연결: 이미 있는 `/auth/me/location`과 `LocationSetup`을 재사용할 수 있어 비용 대비 효과가 크다.
2. 홈/지도 목록 실패 UI: 현재 API 실패가 빈 상태처럼 보일 수 있으므로, retry와 에러 상태를 분리한다.
3. 검색 MVP 범위 결정: 서버 검색 없이 지도 냉장고명 로컬 필터부터 시작할지 결정한다.
4. 푸쉬 범위 명확화: FCM 토큰 등록은 있으므로, 실제 수신 핸들러와 알림함을 별도 이슈로 분리한다.
5. 목업 통계 정리: 탄소 절감액, 포인트, 신선도 온도는 실제 지표가 아니므로 숨김/준비 중/실제 API 중 하나로 결정한다.

#### 채팅 탭 결정

- 결정: WebSocket 채팅은 보류하고, 현재 탭은 `알림함`으로 축소한다.
- 이유: 현재 구현은 정적 mock 데이터뿐이고, 서버 계약도 없다. 실시간 채팅은 인증, 방 생성, 메시지 저장, 읽음 상태, 푸쉬 연동까지 필요해서 MVP 다음 스프린트의 핵심 리스크를 키운다.
- 현실적인 대안: 나눔 식재료 상세의 `나눔 신청하기` CTA를 먼저 만들고, 신청 상태/푸쉬 알림/알림함으로 흐름을 단순화한다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "5. 미구현 기능 상태 점검"을 기준으로 현재 코드에서 각 기능이 구현됨/부분 구현/미구현/목업인지 분류해줘.

다음 스프린트에서 먼저 해야 할 기능을 근거와 함께 우선순위로 정리하고, 채팅 탭은 유지/제거/축소 중 어떤 선택이 현실적인지 코드 구조와 검증 비용 관점에서 판단해줘.
```

## 6. 다음 스프린트 백로그 정리

### 목표

검증 결과를 바탕으로 다음 스프린트에서 실제로 작업할 수 있는 작은 단위의 백로그를 만든다.

### 분류 규칙

- `버그`: 이미 구현된 기능이 기대대로 동작하지 않는 것
- `미구현`: 화면 또는 API가 없거나 mock 데이터에 머무른 것
- `정책 결정 필요`: 코드보다 먼저 제품/UX 판단이 필요한 것
- `검증 필요`: 코드상으로는 구현되어 보이지만 실제 기기/서버에서 확인해야 하는 것
- `문서화 필요`: 발표나 팀 공유를 위해 설명 기준이 필요한 것

### To-do

- [x] MVP 핵심 플로우 검증 결과를 이슈 후보로 변환
- [x] 실패 케이스 검증 결과를 이슈 후보로 변환
- [x] AI 파이프라인 보강 항목을 이슈 후보로 변환
- [x] 한 장 촬영 UX 정책 결정을 문서화
- [x] multi-object detection 적용 여부를 문서화
- [x] 미구현 기능의 우선순위를 다음 스프린트 범위로 재조정
- [x] 각 백로그 항목에 acceptance criteria 작성
- [x] 각 백로그 항목에 검증 방법 작성
- [x] 스프린트에서 제외할 항목을 명시

### 백로그 템플릿

```md
## 작업명

- 분류:
- 우선순위:
- 배경:
- 현재 동작:
- 기대 동작:
- Acceptance Criteria:
  - [ ] 
  - [ ] 
- 검증 방법:
- 관련 파일/화면/API:
- 비고:
```

### 백로그 초안 (2026-05-05)

#### P0/P1: 다음 스프린트 필수 후보

## 나눔 기준 미충족/등록 차단 상태에서 실제 등록 차단

- 분류: 버그
- 우선순위: P0
- 상태: 완료, fixture 회귀 검증 필요
- 배경: `AnalysisResultScreen`은 과거에 `canShare=false`일 때 CTA를 흐리게 보이게만 하고 실제 이동을 막지 않았다.
- 현재 동작: `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`에서 나눔 기준 미충족 신선도 등급의 등록 진행을 차단한다.
- 기대 동작: 등록 차단 상태에서는 분석 결과 화면, 나눔 식재료 작성 화면, 최종 등록 직전에서 모두 차단한다.
- Acceptance Criteria:
  - [x] `canShare=false`이면 `이대로 나눔하기` 버튼이 실제 disabled 처리된다.
  - [x] route 직접 진입 또는 상태 조작으로 `PostCreate`/`FridgeSelect`에 들어가도 최종 등록 전에 차단된다.
  - [x] 사용자에게 재촬영/갤러리 선택 중 최소 하나의 대안이 제공된다.
- 검증 방법: `AnalysisResultScreen` 단위 테스트, stale/bad fixture 기반 수동 QA, `FridgeSelectScreen` 최종 등록 guard 테스트
- 관련 파일/화면/API: `src/screens/camera/AnalysisResultScreen.tsx`, `src/screens/post/PostCreateScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`
- 비고: 실제 stale/bad fixture가 아직 없어 수동 QA는 남아 있다.

## 나눔 식재료 상세 authorId/userId 계약 불일치 수정

- 분류: 버그
- 우선순위: P0
- 상태: 완료
- 배경: 실제 `GET /api/v1/posts/{id}` 응답은 `authorId`를 반환하지만 앱 `Post` 타입과 `PostDetailScreen`은 `userId`를 사용한다.
- 현재 동작: 작성자 판단은 `authorId` 기준으로 처리하고, 구형 fixture를 위해 `userId` fallback만 남겨둔다.
- 기대 동작: API 응답 계약과 앱 타입/화면 로직이 일치하고, 작성자에게 삭제 버튼이 표시된다.
- Acceptance Criteria:
  - [x] `Post` 타입이 실제 API 응답의 작성자 필드를 반영한다.
  - [x] 상세/삭제 UI가 동일한 작성자 판단 기준을 사용한다.
  - [x] 작성자 계정에서는 삭제 버튼이 보이고, 타 계정에서는 보이지 않는다.
- 검증 방법: 실제 post id `7` 상세 조회, 작성자/타 사용자 로그인 QA, 타입 체크
- 관련 파일/화면/API: `src/types/post.ts`, `src/screens/post/PostDetailScreen.tsx`, `GET /api/v1/posts/{id}`
- 비고: 7번 데이터 준비 중 실제 응답으로 추가 발견.

## 홈/지도/냉장고 목록 실패 상태와 빈 상태 분리

- 분류: 버그
- 우선순위: P1
- 상태: 완료, 네트워크 fault injection QA 필요
- 배경: 목록 조회 실패가 `console.warn`에만 남고 화면은 빈 상태처럼 보일 수 있다.
- 현재 동작: 홈/지도/냉장고 목록 API 실패 시 오류 문구와 retry UI를 표시한다.
- 기대 동작: API 실패와 실제 데이터 없음이 UI에서 구분된다.
- Acceptance Criteria:
  - [x] 홈 주변 나눔 식재료 조회 실패 시 오류 문구와 다시 시도 버튼이 표시된다.
  - [x] 지도/냉장고 목록 조회 실패 시 오류 문구와 다시 시도 버튼이 표시된다.
  - [x] 정상 빈 상태 문구는 API 성공 + 데이터 0건일 때만 표시된다.
- 검증 방법: API base URL 오류 주입, 네트워크 차단 QA, 컴포넌트 테스트
- 관련 파일/화면/API: `HomeScreen`, `MapScreen`, `FridgeSelectScreen`, `/posts/nearby`, `/fridges/nearby`, `/fridges/available`

## 나눔 식재료 등록 완료 후 홈 주변 목록 재조회

- 분류: 버그
- 우선순위: P1
- 상태: 완료, 실제 앱 런타임 재검증 필요
- 배경: `POST /api/v1/posts` 성공 후 완료 화면에서 홈으로 돌아갈 때 홈 목록이 이전 `/posts/nearby` 결과를 그대로 보여줄 수 있다.
- 현재 동작: `PostCompleteScreen`의 `홈으로 돌아가기`는 RootStack을 `Main > Home`으로 reset하면서 `nearbyPostsRefreshToken`과 `completedPostId`를 전달한다. `HomeScreen`은 포커스되거나 refresh token이 바뀔 때 `getNearbyPosts()`를 호출한다.
- 기대 동작: `등록 완료 -> 홈 복귀 -> 주변 나눔 식재료 재조회`가 navigation state에 명시적으로 표현되고, 홈 도착 시 `/posts/nearby` 호출이 보장된다.
- Acceptance Criteria:
  - [x] 등록 완료 화면의 홈 복귀 route가 `Main > Home`과 refresh token을 포함한다.
  - [x] 홈 화면은 refresh token 변경 시 현재 동네 위치로 `/posts/nearby`를 재호출한다.
  - [x] 위치 미설정 상태에서는 기존 위치 등록 CTA 흐름을 유지하고 주변 API를 호출하지 않는다.
- 검증 방법: `__tests__/postComplete.navigation.test.tsx`, `__tests__/home.nearbyRefresh.test.tsx`, 실제 앱에서 등록 직후 홈 목록 갱신 확인
- 관련 파일/화면/API: `PostCompleteScreen`, `HomeScreen`, `MainTabParamList.Home`, `/posts/nearby`

## 위치 재설정 진입점 연결

- 분류: 미구현
- 우선순위: P1
- 상태: 완료, 권한 거부 UX 보강 남음
- 배경: 최초 위치 등록은 구현됐지만 위치 재설정 UI는 연결되지 않았다.
- 현재 동작: 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다.
- 기대 동작: 사용자가 홈 또는 프로필에서 현재 위치 재설정 화면으로 진입할 수 있다.
- Acceptance Criteria:
  - [x] 홈 위치 헤더 또는 프로필 설정에서 `LocationSetup` 재진입이 가능하다.
  - [x] 기존 위치가 있는 사용자도 새 좌표를 `/auth/me/location`에 저장할 수 있다.
  - [ ] 위치 권한 거부 시 설정/재시도 안내가 표시된다.
- 검증 방법: 위치 있는 계정으로 재설정 QA, `/auth/me` 좌표 변경 확인
- 관련 파일/화면/API: `HomeScreen`, `ProfileScreen`, `LocationSetupScreen`, `PUT /api/v1/auth/me/location`

## 위치 미설정 강제 진입 공통 가드

- 분류: 버그
- 우선순위: P1
- 상태: 완료, 에뮬레이터 강제 진입 QA 필요
- 배경: 정상 네비게이션은 위치 없는 사용자를 `LocationSetup`으로 보내지만, 지도나 냉장고 선택에 강제 진입하면 기본 좌표 또는 Alert/goBack 흐름이 보일 수 있었다.
- 현재 동작: `getRegisteredLocation()`을 공통 위치 판정 기준으로 사용한다. 홈, 지도, AI 스캔 진입점, 냉장고 선택 화면은 위치가 없으면 주변 API를 호출하지 않고 `LocationSetup` CTA를 보여준다.
- 기대 동작: 위치 미설정 사용자는 기본 좌표 주변 데이터처럼 보이는 화면을 보지 않는다.
- Acceptance Criteria:
  - [x] 위치가 없으면 홈은 `/posts/nearby`를 호출하지 않고 위치 설정 CTA를 표시한다.
  - [x] 위치가 없으면 지도는 `MapView`와 전남대 기본 좌표 fallback을 렌더링하지 않는다.
  - [x] 위치가 없으면 중앙 AI 스캔 버튼과 홈 히어로 CTA는 `CameraScan` 대신 `LocationSetup`으로 이동한다.
  - [x] 위치가 없으면 `FridgeSelect`는 `/fridges/available`을 호출하지 않고 위치 설정 CTA를 표시한다.
  - [x] 위치 판정은 `latitude=0`, `longitude=0` 같은 유효한 좌표를 누락으로 오인하지 않는다.
- 검증 방법: `__tests__/locationGuard.test.ts`, eslint, typecheck, 에뮬레이터에서 위치 없는 계정 강제 진입 QA
- 관련 파일/화면/API: `src/utils/locationGuard.ts`, `HomeScreen`, `MapScreen`, `MainTab`, `FridgeSelectScreen`, `/posts/nearby`, `/fridges/nearby`, `/fridges/available`

## 실제 기기 카메라 촬영 경로 재검증 및 fallback 개선

- 분류: 검증 필요
- 우선순위: P1
- 상태: 에뮬레이터 검증 완료, 실제 기기 미검증
- 배경: 에뮬레이터에서 셔터 촬영 시 `Capture error TypeError: undefined is not a function`가 발생했다.
- 현재 동작: `react-native-vision-camera@5` API에 맞춰 `usePhotoOutput().capturePhotoToFile()`로 수정했고, 에뮬레이터에서 촬영 파일 생성 및 API 호출까지 확인했다.
- 기대 동작: 실제 기기에서는 촬영 파일이 생성되고, 실패 시 갤러리 선택/수동 입력 대안이 제공된다.
- Acceptance Criteria:
  - [ ] 실제 Android 기기에서 촬영 파일 URI가 생성된다.
  - [ ] 에뮬레이터 실패 시 Alert가 대안 액션을 제공한다.
  - [ ] 촬영/갤러리 모두 `generatePost()`까지 도달한다.
- 검증 방법: 실제 기기 QA, 에뮬레이터 fallback QA, logcat 확인
- 관련 파일/화면/API: `CameraScanScreen`, `react-native-vision-camera`, `POST /api/v1/posts/generate`
- 체크리스트: [AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)

## AI confidence와 확인 필요 상태 도입

- 분류: 정책 결정 필요
- 우선순위: P1
- 상태: 부분 완료, fixture 검증 필요
- 배경: API는 `confidenceScore`를 반환하지만 앱은 표시/분기/차단에 사용하지 않는다.
- 현재 동작: `confidenceScore`를 분석 결과/작성 화면에 표시하고, 낮은 confidence는 `확인 필요`로 분기한다.
- 기대 동작: 낮은 confidence는 즉시 차단이 아니라 `확인 필요` 상태로 분기하고 재촬영/수동 입력을 유도한다.
- Acceptance Criteria:
  - [x] confidence가 분석 결과 화면에 표시된다.
  - [x] threshold 미만일 때 `확인 필요` 상태가 표시된다.
  - [x] threshold 값과 정책이 문서화된다.
- 검증 방법: mock/fixture 응답으로 confidence 0.4/0.7/1.0 테스트, 수동 QA
- 관련 파일/화면/API: `AiAnalysis.confidenceScore`, `AnalysisResultScreen`, `PostCreateScreen`

## AI false-positive 차단 계약 정리

- 분류: 정책 결정/서버 계약
- 우선순위: P1
- 상태: 앱 방어 로직/fixture 반복 검증 스크립트 추가, 서버/AI 계약 반영 필요
- 배경: 에뮬레이터 QA에서 비식재료/스크린샷성 이미지가 `바나나 / 신선 / 100%`로 통과했다.
- 현재 동작: 앱은 이미지 내용을 자체 판별하지 않지만, 서버가 `not_food/non_food/low_quality/screenshot/ui_screenshot` category 또는 `rejectionReason`을 주면 등록 차단으로 처리한다. `multi_object_review/review_required`는 `확인 필요`로 표시한다.
- 기대 동작: 서버/AI는 비식재료, 스크린샷, 앱 아이콘, 실내 배경을 `Fresh` 식재료로 반환하지 않는다.
- Acceptance Criteria:
  - [ ] `not_food`, `low_quality`, `multi_object_review` 등 실패/검토 사유 enum을 서버 계약에 추가한다.
  - [ ] 비식재료/스크린샷 fixture는 generate 400 또는 `확인 필요`로 처리된다.
  - [x] 앱은 서버 실패 사유를 사용자에게 보여주고 등록을 진행하지 않는다.
- 검증 방법: [AI QA fixture 문서](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)의 `not-food`, `screenshot-or-ui`, `low-quality` fixture로 `npm run qa:ai-fixtures` 반복 호출
- 관련 파일/화면/API: `POST /api/v1/posts/generate`, `CameraScanScreen`, `AnalysisResultScreen`, `postPolicy`

#### P2: 다음 스프린트 범위 조정 후보

## 검색 MVP 범위 결정 및 최소 구현

- 분류: 미구현
- 우선순위: P2
- 배경: 홈 검색 아이콘과 지도 검색 입력은 있지만 동작이 없다.
- 현재 동작: 홈 검색 아이콘은 지도 탭으로 이동하고, 지도 검색 입력은 현재 불러온 공유 냉장고의 이름/주소를 로컬 필터링한다.
- 기대 동작: MVP에서는 서버 검색 없이 공유 냉장고명/주소 로컬 필터를 제공한다. 나눔 식재료/동네 서버 검색은 후속 범위로 분리한다.
- Acceptance Criteria:
  - [x] 검색 대상은 MVP에서 공유 냉장고 이름/주소로 제한한다.
  - [x] 결과 없음 상태가 표시된다.
  - [x] 홈 검색 affordance는 지도 검색 진입점으로 연결한다.
- 검증 방법: `filterFridges` 단위 테스트, 검색어 입력 QA, 결과 있음/없음 상태 확인
- 관련 파일/화면/API: `HomeScreen`, `MapScreen`, `fridgeSearch`

## 목업 통계와 탄소 절감 표시 정리

- 분류: 목업 제거/정책 결정 필요
- 우선순위: P2
- 배경: 홈/프로필 통계가 하드코딩 값이다.
- 현재 동작: 홈 탄소 절감과 프로필 신선도 온도/포인트/탄소 절감 mock 숫자를 제거하고 `준비 중`으로 표시한다.
- 기대 동작: 실제 API가 없으면 숨김/준비 중/설명형 문구 중 하나로 정리한다.
- Acceptance Criteria:
  - [x] 홈 탄소 절감 mock 값은 운영성 UI에서 제거된다.
  - [x] 프로필 mock 통계를 제거하거나 준비 중 상태로 바꾼다.
  - [ ] 실제 지표로 유지하려면 계산식과 API 계약이 문서화된다.
- 검증 방법: 홈/프로필 UI QA, API 계약 확인
- 관련 파일/화면/API: `HomeScreen`, `ProfileScreen`

## FCM 수신 처리와 알림함 범위 정의

- 분류: 부분 구현
- 우선순위: P2
- 배경: FCM 토큰 등록은 있지만 알림 수신/목록/읽음 처리는 없다.
- 현재 동작: 완료 화면은 그대로 두고, 채팅 탭의 가짜 채팅/알림 mock 데이터는 제거했다. 탭 라벨은 `알림`으로 축소했고 빈 알림함 상태를 표시한다.
- 기대 동작: 다음 스프린트에서는 WebSocket 채팅 대신 알림함 또는 단순 신청 흐름으로 축소한다.
- Acceptance Criteria:
  - [ ] foreground/background 알림 수신 handler가 정의된다.
  - [x] 알림함으로 유지하고 WebSocket 채팅은 보류한다.
  - [x] mock 알림 데이터가 빈 알림함 상태로 대체된다.
- 검증 방법: FCM 테스트 메시지 수신 QA, 앱 foreground/background 확인
- 관련 파일/화면/API: `deviceRegistration.ts`, `ChatListScreen`, Firebase Messaging

## multi-object detection 연구/계약 초안

- 분류: 정책 결정 필요
- 우선순위: P2
- 배경: 현재 API와 앱 타입은 단일 대표 객체만 지원한다.
- 현재 동작: `detectedFruit`/`detectedFruitKo` 단일 문자열만 처리한다.
- 기대 동작: 다음 스프린트에서는 구현보다 먼저 `detections[]` 계약과 UX 정책을 검증한다.
- Acceptance Criteria:
  - [ ] `detections[]` 최소 필드 초안이 작성된다.
  - [ ] 대표 객체 1개 처리와 객체별 분리 등록 중 UX 방향을 결정한다.
  - [ ] multi-object fixture 이미지 세트를 준비한다.
- 검증 방법: multi-object 이미지 API 실험, 계약 리뷰
- 관련 파일/화면/API: `PostGenerateResult`, `AiAnalysis`, `AnalysisResultScreen`

#### 스프린트 제외/보류

- WebSocket 기반 실시간 채팅: 서버 계약과 앱 구조가 없으므로 보류. `알림함` 또는 `나눔 신청하기`로 축소한다.
- 소셜 로그인 전체 구현: 이메일 로그인 MVP가 동작하므로 우선순위 낮음. 버튼을 숨기거나 준비 중으로 명확히 둔다.
- 이메일 verification 전체 예외 케이스: 인증 메일/OTP 서버 계약이 없어 보류.
- 냉장고 내부 inventory: 현재 서버는 냉장고 목록만 제공한다. 냉장고별 나눔 식재료 목록으로 대체할지 먼저 결정한다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 검증 결과를 바탕으로 다음 스프린트 백로그 초안을 만들어줘.

각 항목은 작업명, 분류, 우선순위, 배경, 현재 동작, 기대 동작, acceptance criteria, 검증 방법, 관련 파일/화면/API를 포함해야 해. 구현 작업과 정책 결정 작업을 분리해줘.
```

## 7. 시연/검증용 데이터 준비

### 목표

기능이 비어 보이지 않도록 검증용 데이터와 이미지 케이스를 준비한다.

### To-do

- [x] 검증용 유저 계정 준비
- [x] 검증용 위치 데이터 준비
- [x] 검증용 냉장고 데이터 준비
- [x] 검증용 나눔 식재료 데이터 준비
- [x] AI 성공 케이스 이미지 준비
- [ ] AI 실패 케이스 이미지 준비
- [ ] 나눔 기준 미충족 상태 `나쁨` 케이스 이미지 준비
- [ ] multi-object 예시 이미지 준비
- [ ] 주변 냉장고 없음 상태를 확인할 수 있는 위치 준비
- [x] 나눔 식재료 없음 상태를 확인할 수 있는 조건 준비
- [x] 검색 결과 없음 상태를 확인할 수 있는 키워드 준비

### 준비 결과 (2026-05-05)

#### 실제 서버 데이터

| 용도 | 값 | 상태 | 비고 |
| --- | --- | --- | --- |
| 시연용 계정 | `mvp_demo_20260505@example.com` / `Password123` | 준비됨 | 위치 등록, 나눔 식재료 생성 완료. 테스트 전용 계정으로만 사용 |
| 빈 상태 확인 계정 | `mvp_empty_20260505@example.com` / `Password123` | 준비됨 | 제주 좌표 기준 주변 나눔 식재료 0건 확인 |
| 시연용 위치 | `35.1595, 126.9136` | 준비됨 | 광주 전남대 인근. 홈/지도/냉장고 목록 검증용 |
| 나눔 식재료 없음 위치 | `33.4996, 126.5312` | 준비됨 | `/posts/nearby` 0건 확인. 단, 냉장고 목록은 서버가 3건을 반환함 |
| 냉장고 데이터 | id `1` 광주역 공유냉장고, id `3` 충장로 공유냉장고, id `4` 전남대학교 공유냉장고 | 준비됨 | `/fridges/available?latitude=35.1595&longitude=126.9136` 기준 |
| 시연용 나눔 식재료 | id `7`, `[MVP 검증] 신선한 사과 나눔합니다` | 준비됨 | 실제 `generate -> imageToken -> createPost` 흐름으로 생성 |
| AI 성공 이미지 | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | 임시 준비됨 | 실제 AI가 `사과`/`Fresh`로 판정. 실제 식재료 사진은 별도 확보 필요 |
| 검색 결과 없음 키워드 | `zz-no-result-foodlink`, `없는냉장고테스트` | 준비됨 | 검색 기능 구현 후 no-result fixture로 사용 |

#### 실제 생성된 나눔 식재료 상세

```json
{
  "id": 7,
  "authorId": 10,
  "fridgeId": 1,
  "title": "[MVP 검증] 신선한 사과 나눔합니다",
  "category": "기타",
  "imageUrl": "/static/uploads/posts/10/85f9f3d4-e5ce-44ae-af5b-7aa5fe6260c9.png",
  "expirationDate": "2026-05-08",
  "status": "available",
  "latitude": 35.1595,
  "longitude": 126.9136
}
```

주의: 상세 응답은 `authorId`를 반환한다. 앱은 `authorId` 기준으로 작성자 여부를 판단하고, 구형 fixture 호환을 위해 `userId` fallback만 남긴다.

#### 아직 준비하지 못한 fixture

| 항목 | 상태 | 이유 | 다음 액션 |
| --- | --- | --- | --- |
| AI 실패 케이스 이미지 | 미준비 | 현재 확보한 실제 이미지는 성공 케이스뿐이다. 서버 generate 400을 안정적으로 재현하는 이미지가 필요하다. | [AI QA fixture 문서](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)의 `not-food`, `screenshot-or-ui`, `low-quality` 세트 확보 |
| 나눔 기준 미충족 상태 `나쁨` 이미지 | 미준비 | 실제 `Stale/Bad/Rotten` 응답을 만드는 테스트 이미지가 없다. | [AI QA fixture 문서](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)의 `stale-or-rotten` fixture 또는 서버 fixture 모드 준비 |
| multi-object 예시 이미지 | 미준비 | 여러 식재료가 동시에 담긴 실제 사진이 없다. 현재 API 계약도 단일 대표 객체만 반환한다. | [AI QA fixture 문서](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)의 `multi-object` fixture 확보 |
| 주변 냉장고 없음 위치 | 준비 실패 | `0,0`, 제주, 부산, 뉴욕 좌표에서도 `/fridges/nearby`가 3건을 반환했다. 반경 필터가 기대와 다를 가능성이 있다. | 서버 냉장고 거리 필터를 확인하거나 no-fridge fixture를 백엔드에 추가 |

#### 재현 명령 요약

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
PUT /api/v1/auth/me/location
POST /api/v1/posts/generate
POST /api/v1/posts
GET /api/v1/posts/7
GET /api/v1/posts/nearby?latitude=33.4996&longitude=126.5312&radius_km=2.0
GET /api/v1/fridges/available?latitude=35.1595&longitude=126.9136&radius_km=2.0
```

## 최종 기준선

다음 스프린트로 넘어가기 전에 최소한 아래 질문에 답할 수 있어야 한다.

- 로그인하면 유저가 실제로 생성/업데이트되는가?
- 동네 위치 미설정(`latitude = NULL`, `longitude = NULL`) 유저가 앱을 써도 깨지지 않는가?
- 위치 등록 후 앱의 주요 화면이 정상적으로 위치를 사용하고 있는가?
- 사진 촬영 데이터가 AI 파이프라인까지 실제로 전달되는가?
- AI 응답이 나눔 식재료 등록 데이터로 어떻게 변환되는가?
- 나눔 기준 미충족 상태가 `나쁨`일 때 사용자는 무엇을 보게 되는가?
- 서버/API/AI/권한/네트워크 실패 시 앱이 멈추지 않는가?
- 한 장 촬영 흐름은 유지할 것인가, 조건부 추가 확인을 붙일 것인가?
- multi-object detection은 다음 스프린트의 구현 대상인가, 연구/검증 대상인가?
- 채팅, 푸쉬, 통계, 소셜 로그인은 다음 스프린트에 넣을 만큼 중요한가?
