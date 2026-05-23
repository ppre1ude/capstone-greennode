## 2026-05-19 지도 디자인 시스템 마이그레이션 업데이트

- 지도 화면은 기존 MapView/Marker/Circle, API 호출, 냉장고 선택, refresh, 상세 이동 로직을 유지하면서 검색 필드와 반복 카드/시트/액션을 DS primitive로 치환했다.
- DS 카탈로그는 `leading`/`trailing` icon slot, 선택된 list/card 패턴, static status chip 예시를 포함한다.
- 검증 범위는 Jest 회귀 테스트 기준이다. 이 pass에서는 실제 Android 기기 QA를 수행하지 않았고, 남은 시각/실기기 QA는 Task 4 또는 별도 QA에서 확인한다.

# FoodLink Implementation Status

> **작성일**: 2026-05-06
> **기준 브랜치**: `codex/backend-phase1half-frontend-sync` > **기준 문서**: [`VALIDATION_AND_BACKLOG.md`](./VALIDATION_AND_BACKLOG.md)

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

## 2026-05-19 Montage 기반 디자인 시스템 레이어

- 상태 변경: GreenNode의 기존 컬러 팔레트와 `src/theme` 토큰을 유지하면서, Wanted Montage Android/iOS의 컴포넌트 API 패턴을 참고한 `src/design-system` 레이어를 추가했다.
- 구현 범위: `DSText`, `DSButton`, `DSChip`, `DSTextField`, `DSCard`, `DSListCell`을 추가하고, 홈 주변 나눔 카드(`NearbyPostCard`)를 `DSCard`/`DSChip`/`DSText` 조합으로 마이그레이션했다.
- 확장 범위: DS 컴포넌트 카탈로그를 추가하고, 로그인/회원가입/위치 설정/나눔 등록/나눔 상세의 반복 CTA와 입력 패턴을 DS 프리미티브 우선으로 치환한다.
- 설계 기준: Montage는 팔레트 공급원이 아니라 `variant`, `tone`, `size`, `status`, `loading`, `disabled`, leading/trailing slot, 선택/비활성 상태 분리의 참조 모델로 사용한다.
- 검증: `npx tsc --noEmit`, `npm test -- --runInBand`(28 suites / 112 tests), `npm run lint`를 통과했다. lint는 기존 warning 9개가 남아 있지만 exit code는 0이다. 이 환경은 `adb`가 PATH에 없어 Android 시각 QA는 다음 실기기 QA로 넘긴다.

## 2026-05-06 백엔드 Phase 1.5 동기화

백엔드가 `TEAM_FLOW_CHANGE_NOTICE_2026-05-06.md`를 반영해 VM 배포와 검증을 완료했다. 프론트 상태 문서에서는 이 답변을 다음 기준으로 해석한다.

- 백엔드 구현 완료: `share_requests` 테이블, `POST /posts/{id}/requests`, `available -> requested`, `SELECT ... FOR UPDATE` 동시 경합 처리, 403/409 처리, `share_created`/`share_requested` 알림, `GET /fridges/{id}/posts?status=available`.
- 백엔드 계약 변경: Post의 `title`, `description`, `category` 컬럼이 제거되고 `detectedFruitKo`, `freshnessLabel`, `confidenceScore` 중심 구조로 바뀌었다.
- AI 계약 확정: 백엔드 label은 `Fresh`, `Mid`, `Stale`, `unknown`이며, `Mid`는 기존 프론트의 `Normal` 그룹이다. `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률이다. 제품 기준은 백엔드 활용 가이드를 따라 0.9 미만을 `확인 필요` 구간으로 본다.
- 서버 최종 방어선: `Stale`이면 generate 400으로 `imageToken`이 발급되지 않고, create는 무효/만료 토큰을 400으로 거부한다. 프론트 `canShare`는 UX 가드다.
- 프론트 현재 상태: Post 구조 변경, 나눔 신청 API, 냉장고별 나눔 식재료 조회, FCM 수신 기록/알림함은 React Native 코드에 반영됐다. `src/types/post.ts`, `createPost()` payload, 상세/등록 화면은 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`, `imageToken` 중심으로 동작한다. 홈/냉장고 카드는 `PostNearbyRead` 기준으로 `detectedFruitKo`, `freshnessLabel`, `status`, `fridgeName`을 사용하며 `confidenceScore`는 이 카드 요약 응답 계약에 없다. 상세 화면은 `requestShare(postId)`로 `available -> requested`를 처리하고 홈/지도 refresh 신호를 보낸다. 지도는 선택된 냉장고의 `GET /fridges/{id}/posts?status=available` 결과를 loading/error/empty/list 상태로 보여주고 항목 탭 시 상세로 이동하며, 신청 성공 후 해당 항목을 내부 목록에서 즉시 제거한다. FCM은 문자열 + camelCase payload를 검증해 로컬 알림함에 기록하고, opened/initial 알림은 상세 화면으로 라우팅한다.

### 2026-05-06 VM/API QA 업데이트

- VM 접근: SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`로 `GET /health` 정상 응답을 확인했다.
- 통과: QA 계정 생성/로그인/위치 저장, 주변 냉장고 조회, `generate -> create -> nearby/fridge posts 포함 -> request -> requested 전환 -> nearby/fridge posts 제외`, 작성자 본인 신청 403, 첫 신청 201, 중복 신청 409, 무효 `imageToken` create 400을 확인했다.
- 상태 변경: 나눔 신청 API와 냉장고별 available 나눔 식재료 조회는 프론트 코드 연동, VM/API 런타임 QA, 실제 Android UI 조작 QA를 통과했다. 실제 기기 FCM QA는 Firebase 설정 부재로 별도다.
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
- 남은 검증: 당시에는 fixture 이미지가 없어 `Stale`, `not-food`, `screenshot-or-ui`, `low-quality`, `multi-object` AI 품질 검증이 skipped였다. 2026-05-07 이후 커밋 가능한 fixture가 추가됐고, 2026-05-08 백엔드 답변 기준 stale/screenshot/low-quality false-positive는 Post-MVP AI 계약 항목으로 재분류했다. 실제 FCM 메시지 수신은 계속 별도 기기/FCM 환경이 필요하다.

### 2026-05-07 무기기 fixture/API/fallback QA 업데이트

- VM API: `localhost:8080` 터널로 `/posts/generate`를 직접 검증했다. `temp/qa-vm-banana.jpg`는 `바나나/Fresh/confidence=1.0/imageToken`으로 통과했다.
- 발견한 충돌: `AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`와 `docs/qa-fixtures/manifest.json`은 `screenshot-or-ui`를 400 또는 `확인 필요`로 기대했지만, live VM API는 `temp/real-device-camera-screen.png`를 `바나나/Fresh/confidence=0.5377/imageToken`으로 통과시켰다. 판단 기준은 2026-05-07 live VM API다. 2026-05-08 백엔드 답변으로 이 케이스는 MVP 허용, Post-MVP rejection 목표로 재분류했다.
- 수정: `CameraScanScreen`의 무기기 fallback 경로와 `AnalysisResultScreen`의 등록 차단/확인 필요 정책을 회귀 테스트로 고정했다. 회귀 테스트는 `__tests__/cameraScan.fallback.test.tsx`, `__tests__/analysisResult.fallback.test.tsx`다.
- 통과: 전체 Jest 20 suites / 85 tests, TypeScript `--noEmit`, ESLint `--quiet`, `scripts/validate-ai-fixtures.js`를 실제 기기 없이 통과했다.
- 남은 검증: 이 시점에는 커밋 가능한 fixture 이미지가 부족했으나, 이후 `docs/qa-fixtures/`에 fixture를 추가해 VM/API report-only 검증까지 진행했다. 최신 판정은 `stale-or-rotten`, `screenshot-or-ui`, `low-quality`가 MVP blocker가 아니라 Post-MVP AI false-positive/계약 항목이라는 것이다. 실제 카메라/generate/create/request/exclusion은 2026-05-08 실기기 closeout으로 닫혔고, 실제 FCM 수신만 Firebase 환경 준비 후 검증한다.

### 2026-05-07 Android emulator 지도 UI QA 업데이트

- 기기: Android emulator `Medium_Phone_API_36.1` (`emulator-5554`), release APK, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, QA 계정 `qa162158@example.com`.
- 통과: 지도 탭 진입, Google Map/marker 3개/냉장고 캐러셀 표시, `광주역 공유냉장고` empty 상태, `전남대학교 공유냉장고` 내부 available 목록 1건 표시, 목록 항목 탭 후 상세 화면 이동을 확인했다.
- 발견한 충돌: `GET /fridges/4/posts?status=available`의 1건이 `detectedFruit/detectedFruitKo/freshnessLabel=null`로 내려와 지도 내부 목록과 상세가 `나눔 식재료 / 분석 중` fallback을 표시했다. 이는 기존 P0 Post AI 메타데이터 저장 불일치와 같은 원인으로 본다.
- 증거: `temp/map-ui-map-loaded.png`, `temp/map-ui-fridge-posts.png`, `temp/map-ui-fridge-post-detail.png`.

### 2026-05-07 위치 권한 거부 UX 업데이트

- 수정: `LocationSetup`에서 위치 권한 거부, 영구 거부, 위치 탐색 실패를 화면 상태로 분리했다. 거부 상태는 `권한 다시 요청`과 `설정 열기`, 영구 거부 상태는 설정 이동 중심 안내를 제공한다.
- 안전장치: 좌표가 없으면 `이 위치로 설정하기`가 비활성화되어 `/auth/me/location`을 호출하지 않는다.
- 검증: `__tests__/locationSetup.notificationPermission.test.tsx`에 권한 거부/재시도/설정 열기 회귀 테스트를 추가했고, 해당 테스트와 TypeScript, ESLint를 통과했다.
- 남은 검증: 실제 Android 기기에서 시스템 권한 팝업의 거부/다시 묻지 않음/설정 복귀 후 재시도 흐름은 별도 QA가 필요하다.

### 2026-05-07 AI fixture smoke QA 업데이트

- 준비: `docs/qa-fixtures/`에 커밋 가능한 이미지 fixture를 추가하고, `docs/qa-fixtures/SOURCES.md`에 출처/라이선스를 기록했다. `large-image`는 로컬 전용이라 커밋하지 않는다.
- 백엔드 전달용 압축 문서: [BACKEND_AI_FIXTURE_QA_NOTICE_2026-05-07.md](./BACKEND_AI_FIXTURE_QA_NOTICE_2026-05-07.md)에 fixture 결과와 백엔드/AI 수정 요청 기준을 별도 정리했다.
- 프론트 응답 흐름 QA: `analysisResult.fallback`, `cameraScan.fallback`, `postPolicy`, `posts.api` 테스트 4 suites / 45 tests 통과.
- 실제 VM API smoke QA: `fresh-single`, `not-food`, `multi-object`는 통과했다.
- 발견한 충돌: `stale-or-rotten`, `screenshot-or-ui`, `low-quality` fixture가 live VM API에서 `Fresh`로 통과했다. 이 결과는 프론트 응답 파싱 오류가 아니라 백엔드/AI false-positive 또는 confidence 산정 정책 이슈로 분류한다.

### 2026-05-07 QA 후속 업데이트

- 낮은 confidence UX: 분석 결과 화면과 등록 확인 화면의 `확인 필요` 안내를 `AI가 나눔 가능으로 분석했지만 실제 상태를 직접 확인한 뒤 등록해주세요.`로 강화했다. 낮은 confidence만으로 등록을 차단하지 않는 원칙은 유지한다.
- 실제 Android 위치 권한 거부 QA: 최신 release APK를 Android emulator `emulator-5554`에 설치하고 `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION`을 revoke한 뒤 위치 재설정 화면에서 거부 흐름을 확인했다. `설정에서 위치 권한을 켜주세요`, `설정 열기`, `다시 확인`이 표시되고 `이 위치로 설정하기`는 disabled였다. `설정 열기`는 Android App info로 이동했다. 증거는 `temp/location-permission-denied-emulator.png`다.
- 대용량 이미지 local-only QA: `temp/large-image-local-only-20260507.jpg`를 8,388,609 bytes로 만들어 8MB 초과 fixture를 확인했고, `imageUploadPolicy` 테스트가 업로드 전 차단 문구를 검증했다. 대용량 원본은 git에 넣지 않는다.

### 2026-05-08 백엔드 답변 반영 업데이트

- P0 Post AI 메타데이터 null은 백엔드 버그로 확정됐고, `imageToken` sidecar AI 메타데이터 저장/복원 방식으로 수정되어 VM에 재배포됐다. 프론트는 구현을 바꾸지 않고 `imageToken`, `fridgeId`, `expirationDate`만 전송한다. 2026-05-08 VM/API 재검증에서 생성 응답과 `GET /posts/{id}`의 AI 메타데이터 non-null, `PostNearbyRead` 카드 필드, requested 후 available 목록 제외를 확인했다. 같은 날 실제 Android 기기에서 홈/상세/지도 내부 목록의 신규 Post 표시명/상태가 fallback 없이 보이고, 신청 후 상세와 지도 목록이 `requested` 전환을 반영하는 것을 확인했다.
- MVP flow closeout: 2026-05-08 실제 Android 기기에서 카메라 generate 400 실패 Alert(`다시 촬영`/`갤러리 선택`), 갤러리 fresh fixture 선택, `generate -> create -> home/detail/map`, 다른 테스트 계정의 신청 후 nearby/fridge available 제외까지 재검증했다. 생성된 Post id `8`은 `바나나 / Fresh / confidence 100%`로 저장됐고, 신청 후 `requested`로 전환되어 홈/지도 목록에서 제외됐다. 실제 FCM 수신은 Firebase 설정 파일과 2기기/2계정 token 환경 부재로 남아 있다.
- 기존 null Post 데이터는 마이그레이션하지 않는다. 홈/상세/지도 내부 목록의 fallback은 기존 데이터 대응으로 유지한다.
- generate 400에서 안정적으로 읽을 필드는 FastAPI `detail`이다. `message`, `analysisMessage`는 400 계약 필드가 아니다.
- screenshot/UI false-positive는 MVP 허용으로 재분류했다. 현재 서버/AI는 screenshot/UI 판별 모델이 없으며, `Fresh + imageToken`이면 낮은 confidence에서도 등록 가능하다. 앱은 `confidenceScore < 0.9`에서 `확인 필요`만 표시한다.
- `GET /fridges/{id}/posts`는 `/posts/nearby`와 같은 `PostNearbyRead` 카드 요약 스키마이며, `confidenceScore`를 포함하지 않는다.
- 프론트 타입과 테스트도 `PostNearbyRead`를 분리해 카드 요약 응답에는 `confidenceScore`, `authorId`, `updatedAt`이 없고 `fridgeName`이 있다는 계약에 맞췄다. generate 400은 `detail`을 우선 읽도록 보강했다.
- FCM payload는 문자열 + camelCase로 확정했고, `share_created`는 반경 2km 내 FCM 토큰이 등록된 다른 사용자에게, `share_requested`는 공급자 FCM 토큰이 있을 때 발송된다.
- 스프린트 종료 판정: `camera/gallery -> generate -> create -> home/detail/map -> request -> requested available 제외` core flow와 FCM 프론트 구현은 닫았다. 실제 FCM 수신 QA는 `android/app/google-services.json`, NHN Cloud VM Firebase Admin/service account credentials, 2 Android client/2계정/2 FCM token 환경이 필요하므로 다음 스프린트 P0로 이월한다. `2026-GreenNode.pem`은 SSH 터널용 키라 Firebase 자격증명을 대체하지 않는다.

### 2026-05-21 FCM QA 업데이트

- Android Firebase client config `android/app/google-services.json`은 로컬에 준비됐지만 gitignored 상태로 유지한다. 이 파일은 Firebase project `greennode-94eae`, Android package `com.greennode`용이며, secret/API key 내용을 문서나 git에 노출하지 않는다.
- NHN Cloud VM의 Firebase Admin/service account credentials는 기존 `foodlink-cf8e7` 프로젝트용 자격증명 mismatch가 있었고, VM에서 `greennode-94eae` service account로 교체됐다. VM 경로는 `/home/ubuntu/foodlink/credentials/firebase-service-account.json`, API container mount 경로는 `/app/credentials/firebase-service-account.json`이다. 자격증명 내용은 repo에 두지 않는다.
- 실제 NHN Cloud VM 대상 FCM send는 emulator QA에서 동작했다. backend log는 `share_created`, `share_requested` 모두 success 1 / failure 0을 기록했다.
- foreground QA는 통과했다. emulator가 `share_created`, `share_requested`를 수신했고 로컬 알림 탭에 기록했다.
- background QA는 system notification 표시와 notification tap의 post detail 라우팅을 통과했다.
- terminated surrogate QA는 부분 통과다. app process kill 이후 system notification은 표시됐지만 logcat에 `Background messages only work if the message priority is set to 'high'`가 남았고, terminated 상태의 notification tap 라우팅은 신뢰할 수 없었다.
- true 2-device QA는 아직 막혀 있다. Windows는 USB Samsung device를 감지하지만 `adb devices`에는 `emulator-5554`만 보이므로, physical device ADB authorization/driver/debugging은 사용자 측 해결 후 재개한다.
- 당시 남은 P0 backend handoff는 Android FCM priority `high`와 per-token FCM failure log였다. 2026-05-23 백엔드 회신에서 해당 항목은 구현 예정으로 답변됐고, 프론트 QA는 VM 재배포 후 재개한다. Android notification channel 정리는 별도 local Android polish 작업이며 backend blocker가 아니다.

### 2026-05-20 Inventory/QR 프론트 선행 구현 업데이트

- QR/inventory 계약 확정 후 프론트는 `flow: "fridge_qr"` 등록, 보관 QR 인증, 수령 QR 인증, 운영자 폐기 요청을 실제 API 호출 경로로 연결했다. 백엔드 미배포/불일치 시 Alert 또는 fallback 메시지를 표시한다.
- 운영자 콘솔은 `GET /api/v1/operator/fridges/{fridgeId}/inventory/summary`, `GET /api/v1/operator/fridges/{fridgeId}/inventory/items`, `PATCH /api/v1/operator/items/{postId}/dispose` 계약으로 선행 구현했다. 2026-05-23 백엔드 회신 전의 내부 필드명은 adapter에서 최신 응답 shape로 정렬한다.
- 운영자 폐기 성공 후에는 summary/items를 즉시 재조회해 폐기 대상 수, 만료 임박 수, 항목 상태를 서버 결과 기준으로 다시 맞춘다.
- 운영자 inventory 조회가 401/403으로 거절되면 샘플 재고와 폐기 버튼을 숨기고 `운영자 권한이 필요합니다` 안내만 표시한다. 네트워크/배포 실패 fallback과 권한 실패를 분리했다.
- 프로필의 `냉장고 운영자 콘솔 (실험)` 진입점은 `isOperator`, `operatorRole`, `operatorFridgeIds`, `roles` 중 하나로 운영자 힌트가 있는 계정에만 노출한다.
- 검증: `operator.api`, `fridgeOperatorConsole.screen`, `fridgeSelect.qrFlow`, `inventoryQrPrototype.screen`, `postDetail.requestShare` 테스트와 전체 Jest/TypeScript 검증으로 프론트 계약을 고정했다. 실제 QR 스캔 기기 QA와 백엔드 런타임 QA는 백엔드 배포 후 필요하다.

### 2026-05-21 프론트 마무리 작업 업데이트

- 홈은 현재 불러온 nearby 나눔 중 `status=available`이고 권장 수령일이 오늘 이후인 항목을 `오늘 가져가기 좋은 재료` 섹션에 최대 3개까지 노출한다. 정렬은 권장 수령일 오름차순, 같은 날짜에서는 최신 등록순, 그다음 낮은 id 순이다. 서버 추천/랭킹 API 없이 로컬 규칙으로만 동작한다.
- 운영자 콘솔은 backend inventory items가 빈 목록을 반환할 때 명시적인 empty 상태를 보여주고, 운영자 전용 상태값을 `신청 가능`, `폐기 후보`, `폐기 완료`처럼 사용자-facing label로 표시한다.
- `detections[]` multi-object 응답이 도입될 경우를 대비해 프론트 타입과 분석/등록 화면 표시를 방어적으로 열어뒀다. 현재 정식 분리 등록은 구현하지 않고, 여러 후보가 내려와도 “대표 식재료 1개 기준 등록” 안내만 보여준다.
- 검증: `homeRecommendations`, `home.nearbyRefresh`, `aiDetections`, `analysisResult.fallback`, `postCreate.reviewNotice`, `fridgeOperatorInventory`, `fridgeOperatorConsole.screen` 테스트를 통과했다.

### 2026-05-23 백엔드 회신 반영 업데이트

- FCM: 백엔드는 Android `priority: high`, iOS `apns-priority: 10`, per-token failure log, `[FCM:share_created]`/`[FCM:share_requested]` 로그 prefix를 구현할 예정이다. 프론트의 다음 액션은 백엔드 VM 재배포 완료 후 `share_created`/`share_requested` foreground/background/terminated 및 notification tap routing을 2기기/2계정으로 재검증하는 것이다.
- Operator / Inventory: `GET /api/v1/operator/fridges/{fridgeId}/inventory/summary`, `GET /api/v1/operator/fridges/{fridgeId}/inventory/items`, `PATCH /api/v1/operator/items/{postId}/dispose` 경로가 확정됐다. summary는 `total/available/requested/expired/disposedToday`, items/dispose는 `PostRead` camelCase 기반이다. 프론트는 내부 화면용 필드명과 백엔드 필드명 차이를 adapter에서 흡수해야 한다.
- Dispose 정책: 가능 상태는 `expired`, `available`이고, `requested`, `completed`, `pending_store`, `cancelled`, `disposed`는 409로 거절된다. 성공 후 summary는 `total` 감소 및 `disposedToday` 증가, items/home/map에서는 disposed 항목 미포함이 기준이다.
- Multi-object: `POST /posts/generate`는 root-level 필드와 함께 `detections[]`를 내려주는 것으로 계약이 확정됐다. MVP에서는 단일 객체 배열 래핑(`detections[0]` = 대표 객체), `bbox: null`, `rejectionReason: null`이다. 실제 다중 객체 분리 등록과 non-null rejection reason/bbox는 Post-MVP다.
- 서버 검색: MVP에서는 서버 검색 API를 포함하지 않고 홈/지도 로컬 필터를 유지한다. 향후 필요 시 기존 nearby API에 optional `q`, `skip`, `limit`를 추가하는 방식으로 확장한다.

---

## 1. 현재 상태 요약

| 영역                       | 상태                                     | 요약 |
| -------------------------- | ---------------------------------------- | --- |
| 이메일 인증/로그인         | 구현됨                                   | 이메일 회원가입, 로그인, JWT 저장, `/auth/me` 조회가 동작한다. 소셜 로그인과 이메일 verification은 미구현이며, MVP 로그인 화면은 이메일 진입만 노출한다. |
| 최초 위치 등록             | 구현됨                                   | 위치 없는 유저는 `LocationSetup`으로 이동하고 `/auth/me/location`에 좌표와 FCM 토큰을 저장한다. 홈/지도/나눔 등록 강제 진입도 위치 설정 CTA로 되돌린다. 위치 권한 거부/영구 거부/위치 탐색 실패 시 화면 안에서 재시도와 설정 열기 CTA를 제공하고, 좌표가 없으면 위치 저장을 비활성화한다. |
| 위치 재설정                | 구현됨                                   | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. |
| 디자인 시스템              | 컴포넌트 레이어 도입됨                   | `src/theme`는 GreenNode 색상/타이포그래피/spacing/radius/layout 토큰의 source of truth로 유지한다. `src/design-system`은 Montage식 prop 계약을 React Native 프리미티브로 제공하며, 홈 주변 나눔 카드부터 로그인/회원가입/위치 설정/나눔 등록/나눔 상세의 반복 CTA와 입력 패턴으로 적용 범위를 넓힌다. |
| AI 분석                    | 부분 구현, 실제 기기 촬영/갤러리 QA 통과 | mock 파이프라인은 제거됐고 실제 `/posts/generate` 호출이 동작한다. 백엔드 기준 label은 `Fresh/Mid/Stale/unknown`이며 `Mid`는 기존 `Normal` 그룹이다. 2026-05-23 계약으로 MVP `detections[]`는 단일 객체 배열, `bbox/rejectionReason`은 `null`이다. 앱은 0.9 미만을 `확인 필요`로 표시하며, 낮은 confidence 안내는 실제 상태 직접 확인을 명시한다. |
| 나눔 식재료 등록           | 부분 구현, 실제 기기 등록 QA 통과        | 실제 `generate -> imageToken -> createPost` 흐름으로 서버 등록이 확인됐다. 작성 화면은 AI 판별 식재료명, 신선도, confidence를 확인하고 `fridgeId`, `expirationDate`, `imageToken`만 최종 등록 payload로 보낸다. `canShare=false` 또는 `imageToken` 누락은 분석 결과, 작성, 최종 등록 단계에서 차단한다. |
| 나눔 식재료 상세/삭제/신청 | 부분 구현, 실제 기기 신청 QA 통과        | 실제 상세 응답의 `authorId` 기준으로 작성자 여부를 판단한다. 상세 화면은 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`를 표시한다. `available` 나눔 식재료는 `requestShare(postId)`로 신청하고, 201/409 이후 `신청 접수` 상태로 CTA를 비활성화한다. 403은 작성자 본인 fallback 문구로 처리한다. |
| 홈 주변 나눔 식재료        | 부분 구현, 실제 기기 홈 재조회 통과      | `/posts/nearby` 데이터를 카드로 표시한다. 홈 포커스와 등록 완료 refresh token 변경 시 재조회한다. 2026-05-21부터 현재 로딩된 nearby 목록에서 권장 수령일이 가까운 available 항목을 `오늘 가져가기 좋은 재료`로 로컬 추천한다. |
| 지도/냉장고                | 부분 구현, 실제 기기 UI QA 통과          | `/fridges/nearby`, `/fridges/available` 조회와 지도 마커/냉장고 선택은 동작한다. 지도에서 냉장고를 선택하면 `GET /fridges/{id}/posts?status=available`로 내부 available 나눔 식재료를 조회하고, loading/error/empty/list 상태를 분리한다. |
| 냉장고 운영자/QR           | 프론트 선행 구현, 백엔드 계약 확정       | `flow: "fridge_qr"` 등록, 보관 QR 인증, 수령 QR 인증, 운영자 폐기 요청을 실제 API 호출 경로로 연결했다. 2026-05-23 기준 operator summary/items/dispose 경로와 응답 shape가 확정됐고, 배포 후 권한/빈 목록/available·expired dispose/409 상태 QA가 필요하다. |
| 나눔 신청                  | 프론트 코드 연동 완료, 실제 기기 QA 통과 | 프론트는 `requestShare(postId)`, 상세 CTA, 201/403/409 UX, 홈/지도 refresh store를 구현했다. 2026-05-08 실제 Android 기기에서 신청 완료 alert, 상세 `신청 접수` 전환, 지도 냉장고 내부 목록 즉시 제거를 확인했다. |
| FCM                        | foreground/background 실수신 QA 통과, 백엔드 재배포 대기 | 2026-05-21 emulator QA에서 `share_created`, `share_requested` 실제 send success 1 / failure 0, foreground 수신/로컬 알림 탭 기록, background system notification 표시와 tap의 `PostDetail` 라우팅을 확인했다. 2026-05-23 백엔드가 Android `priority: high`, APNS priority, per-token log를 추가하기로 했으므로 VM 재배포 후 terminated tap routing과 physical 2-device QA를 재검증한다. |
| 채팅                       | 보류                                     | 정적 채팅 mock 데이터는 제거했다. WebSocket/API 계약은 없다. |
| 통계/탄소 절감             | 정리됨                                   | 실제 지표 API가 없는 홈/프로필 mock 숫자는 제거하고 준비 중 상태로 표시한다. |
| 검색                       | 부분 구현, 서버 검색 Post-MVP            | MVP 검색은 홈 나눔 식재료명/냉장고명 로컬 필터와 지도 공유 냉장고 이름/주소 로컬 필터로 제한했다. 2026-05-23 백엔드 회신 기준 서버 검색은 MVP 미포함이며, 필요 시 nearby API의 optional `q` 파라미터로 확장한다. |

---

## 2. Phase별 현실 기준

### Phase 1: 기반 세팅 및 인증

- 상태: 부분 완료
- 완료:
  - `SplashScreen`, `OnboardingScreen`, `LoginScreen`, `LoginEmailScreen`, `SignupScreen`
  - 이메일 회원가입/로그인 API 연동
  - JWT 저장과 401 처리
- 남은 작업:
  - MVP 범위 밖인 소셜 로그인 버튼은 로그인 화면에서 숨겼다. 소셜 로그인 전체 구현은 후속이다.
  - 이메일 verification은 서버/API/화면 모두 없음

### Phase 2: 위치 설정 및 홈

- 상태: 부분 완료
- 완료:
  - 최초 위치 등록
  - 홈 주변 나눔 식재료 조회와 pull-to-refresh
  - 홈 빈 상태 표시
  - 위치 미설정 강제 진입 시 `/posts/nearby` 호출 차단과 위치 설정 CTA 표시
  - 위치 권한 거부/영구 거부/위치 탐색 실패 시 `LocationSetup` 내 재시도/설정 열기 CTA
- 남은 작업:
  - 실제 통계/탄소 절감 계산식과 API 계약 정의

### Phase 3: 카메라 촬영 및 AI 분석

- 상태: 부분 완료
- 완료:
  - 갤러리 이미지 선택 후 실제 AI generate 호출
  - 실제 AI 응답의 `detectedFruit`, `aiAnalysis`, `imageToken` 수신
  - 분석 결과 화면 표시
  - 실제 Android 기기 카메라 셔터 촬영 후 generate 400 실패 Alert와 재촬영/갤러리 대안 표시
  - 실제 Android 기기 갤러리 fresh fixture 선택 후 분석 결과 표시
- 남은 작업:
  - Post-MVP AI/rejection contract: `stale-or-rotten`, `screenshot-or-ui`, `low-quality` false-positive를 rejection/review reason으로 처리할지 결정
  - 실제 FCM 수신 QA와 분리된 순수 알림 표시 UX polish
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
  - 유통기한 기본 3일 자동값 정책 정리

### Phase 5: 지도 및 냉장고 탐색

- 상태: 부분 완료
- 완료:
  - 지도, 반경 원, 냉장고 마커, 하단 캐러셀
  - 실제 냉장고 목록 조회
  - 선택 냉장고 내부 available 나눔 식재료 목록 조회와 상세 이동
  - 위치 미설정 상태에서는 전남대 기본 좌표 fallback 없이 위치 설정 CTA 표시
  - Android emulator에서 냉장고 empty/list 상태와 내부 목록 항목 상세 이동 QA
- 남은 작업:
  - 주변 냉장고 없음 fixture/API 검증

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
  - 알림 읽음 상태/API 계약 구현
  - 실제 활동 지표 API 계약 구현

---

## 3. 다음 작업 우선순위

### P0

1. 완료: `authorId/userId` 계약 불일치 수정
2. 완료: 나눔 기준 미충족/등록 차단 상태에서 실제 등록 차단
3. 완료: 백엔드 Phase 1.5 Post 구조 변경 반영. `src/types/post.ts`, `PostCreateData`, 카드/상세/등록 화면의 `title/description/category` 의존을 제거하고, 카드 요약은 `PostNearbyRead` 필드 중심으로, 상세/등록 화면은 `detectedFruitKo/freshnessLabel/confidenceScore/status` 중심으로 갱신

### P1

1. 완료: 홈/지도/냉장고 목록 실패 상태와 빈 상태 분리
2. 완료: 위치 재설정 진입점 연결
3. 완료: 위치 미설정 강제 진입 공통 가드와 위치 설정 CTA 정리
4. 완료, 실제 기기 QA 필요: 위치 권한 거부/영구 거부/위치 탐색 실패 UX 보강. `LocationSetup`은 재시도/설정 열기 CTA를 제공하고 좌표가 없으면 위치 저장을 막는다.
5. 완료, 실제 기기 QA 통과: 카메라 실패 시 `다시 촬영`/`갤러리 선택` 대안과 갤러리 fresh fixture 기반 등록 flow를 확인했다.
6. 완료, Post-MVP AI 계약 필요: AI confidence 표시와 `확인 필요` 상태 도입. 제품 기준은 `confidenceScore < 0.9`이며 단독 등록 차단 기준은 아니다. `stale-or-rotten`, `screenshot-or-ui`, `low-quality` false-positive는 Post-MVP rejection/review reason 계약으로 분리한다.
7. 완료, VM/API QA 통과: 나눔 신청하기 API 연동, 첫 신청 이후 추가 신청 차단, `available -> requested` 상태 전환, 403/409 처리
8. 완료, VM/API QA 및 실제 Android UI QA 통과: 냉장고별 나눔 식재료 조회 API 연동. 지도에서 선택한 냉장고의 available 목록을 표시하고 항목 탭 시 상세로 이동한다. 2026-05-08 VM/API와 실제 Android 기기에서 백엔드 Post AI 메타데이터 수정 후 신규 Post 표시명/상태, requested 제외, 신청 후 지도 내부 목록 즉시 제거를 재확인했다.

### P2

1. 완료: 검색 MVP 범위는 지도 공유 냉장고 이름/주소 로컬 필터로 결정
2. 완료, 실제 기기 QA 필요: FCM 수신 handler와 알림함. `share_created`/`share_requested` foreground/background/opened/initial 수신 기록, 문자열 + camelCase payload 검증, 상세 fallback 라우팅, 로컬 읽음 표시를 구현했다. 서버 읽음 상태 API는 후속이다.
3. 완료: 홈/프로필 목업 통계 숫자 제거
4. multi-object detection 계약 연구

### 보류

- WebSocket 기반 실시간 채팅
- 소셜 로그인 전체 구현
- 이메일 verification 전체 예외 케이스
- 냉장고 내부 inventory 백엔드 런타임 QA. 프론트는 QR/inventory API 계약을 선행 구현했지만, 실제 서버 배포 후 보관/수령/운영자 목록/폐기 end-to-end 검증이 필요하다.
- 운영자 권한/역할 관리 화면. 운영자 콘솔 진입점과 inventory 점검 화면은 있으나, operator role 부여/관리 UI는 후속이다.

---

## 4. 검증 명령

현재 자동 테스트 기준:

```bash
npm run lint -- --quiet
npm test -- --runInBand
node ./node_modules/typescript/bin/tsc --noEmit
```

### 2026-05-20 QR feed refresh update

- API-backed `confirmStore` success now requests a generic nearby feed refresh without a removal id, while `confirmPickup` success requests refresh with the confirmed post id so Home/Map remove completed pickup items from discovery state.
- `PostDetail` now treats an expired valid `requestExpiresAt` on a `requested` post as a restored hold candidate: it keeps the expired hold message, hides pickup QR entry, and requests a generic nearby feed refresh without a post id so discovery can re-query the item as available.

실제 앱/서버 검증은 [`VALIDATION_AND_BACKLOG.md`](./VALIDATION_AND_BACKLOG.md)의 각 섹션 결과와 시연/검증용 데이터 준비 항목을 기준으로 한다.

### 2026-05-20 Inventory/QR 대기 만료 시각 후속 구현

- `FridgeSelect`는 백엔드 `storeExpiresAt`을 `pendingExpiresAt`으로 `InventoryQrPrototype`에 전달한다. 값이 없거나 잘못된 날짜이면 `createdAt + 10분`으로 보정하고, 둘 다 유효하지 않으면 QR 화면의 API fallback countdown을 사용한다.
- `PostDetail`의 수령 QR 진입은 검증된 `requestExpiresAt`을 같은 `pendingExpiresAt` route param으로 넘겨 QR 화면의 30분 countdown과 서버 인증 흐름을 맞춘다.
- API-backed QR 인증 화면에 route `fridgePublicCode`가 없으면 프론트가 임의로 냉장고 불일치 차단을 하지 않는다. 스캔된 public code를 보관/수령 인증 API에 보내고 서버가 pending action과 냉장고 일치를 검증한다.
- Focused verification: `npm test -- --runInBand __tests__/fridgeSelect.qrFlow.test.tsx __tests__/inventoryQrPrototype.screen.test.tsx`.
