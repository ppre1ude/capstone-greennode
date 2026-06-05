# FoodLink Validation And Backlog

> 목적: 현재 남은 검증, blocker, 다음 작업을 한 화면에서 판단한다.
>
> 2026-05-28 이전 전체 원본은 [archive/VALIDATION_AND_BACKLOG_2026-05-28.md](./archive/VALIDATION_AND_BACKLOG_2026-05-28.md)에 보존했다. 완료된 QA 본문, 닫힌 blocker, 오래된 도메인 설명은 메인 문서에서 제거한다.

## 문서 사용 규칙

- 이 문서는 활성 작업판이다. 새 QA 로그를 길게 누적하지 않는다.
- 새 검증 결과는 날짜, 환경, 실제 결과, 기대 결과, 다음 액션만 짧게 남긴다.
- 완료된 상세 증거는 별도 파일, 테스트 결과, `temp/*.json`, PR, 또는 archive 문서로 연결한다.
- 완료된 to-do `[x]`는 당분간 삭제하지 않는다. 사용자가 완료 이력을 눈으로 확인할 수 있게 유지한다.
- source-of-truth 충돌 시 런타임/API 증거가 요약 문서보다 우선한다. 도메인 용어는 [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)를 따른다.

## 현재 기준선

- 과거 MVP 검증 범위는 **농산물 등록 흐름**과 `available -> requested` 신청 접수까지였다. 이 기준은 Android/API 검증으로 이미 닫혔다.
- 현재 정식 도메인 기준은 `농산물 등록 흐름 -> 보관 QR 인증 -> available -> 신청 접수/임시 선점 -> 수령 QR 인증 -> 완료`다. `냉장고 QR 인증`, `진행 중인 나눔`, `내 나눔/받은 나눔`, `운영자 콘솔 진입`, `알림/나눔 생명주기 확장`을 API/화면 연결 기준으로 검증했다.
- 2026-06-03 `direct` 등록 흐름 제거에 맞춘 백엔드 API 구조 변경 요청은 [BACKEND_QR_LIFECYCLE_DIRECT_FLOW_HANDOFF_2026-06-03.md](./BACKEND_QR_LIFECYCLE_DIRECT_FLOW_HANDOFF_2026-06-03.md)에 정리했다. 백엔드 회신 요약은 [BACKEND_QR_LIFECYCLE_RESPONSE_2026-06-03.md](./BACKEND_QR_LIFECYCLE_RESPONSE_2026-06-03.md)를 따른다. 핵심은 `POST /posts`의 정식 제품 흐름을 `flow="fridge_qr"` 기반 `pending_store` 생성으로 고정하고, 보관 QR 인증 후에만 `available`로 노출하는 것이다.
- 2026-06-04 trust feedback 백엔드 회신은 [BACKEND_TRUST_FEEDBACK_RESPONSE_2026-06-04.md](./BACKEND_TRUST_FEEDBACK_RESPONSE_2026-06-04.md)를 따른다. 프론트는 평가/신고를 실제 `/share-requests/{requestId}/review|report` API로 보내고, 공급자 신뢰 뱃지는 `/users/{userId}/trust-summary`를 source of truth로 사용한다.
- 2026-05-28 SM-S928N Android 15 실기기 QA에서 신청 만료 시각 해석, 홈 진행 중 나눔, 받은 나눔 수령 QR, QR 화면과 하단 탭바 safe-area 재검증까지 닫았다.
- 2026-05-27 백엔드 기능 계약은 프론트 API client와 화면에 연결됐다.
- 알림 탭은 MVP에서 FCM 수신 기록과 로컬 AsyncStorage 읽음 상태만 사용한다. 서버 저장형 알림 API는 Post-MVP다.
- `requested` 이후 취소/완료 전이는 사용자-facing 정책과 API 계약이 확정됐다. 만료는 서버 배치로 처리한다.
- 홈의 진행 중인 나눔 허브, 지도 하단 primary surface, 주요 fixed CTA의 `DSScreenFooter` 코드 통합, 앱 UI/fixture icon migration은 2026-05-28 코드/테스트 기준으로 닫혔다.
- 최신 live VM 기능 계약 정상 경로 E2E는 2026-05-28에 통과했다. `requestExpiresAt` 시간대 해석과 Android 하단 surface safe-area 회귀는 2026-05-28 후속 실기기 증거로 닫았고, 잔여 blocker는 운영자 계정 환경변수 확보 후 운영자 권한 기반 프로필/운영자 콘솔 진입 재검증이다.
- Post-MVP 제품/계약 결정은 2026-05-29 [POST_MVP_PRODUCT_CONTRACT_DECISIONS.md](./POST_MVP_PRODUCT_CONTRACT_DECISIONS.md)에 정리했다. 결정 기준은 `HOLD_SCOPE`이며 AI 차단/검토 사유, 여러 객체 대표 후보, 서버 저장형 알림, 환경 성취 지표, 서버 검색, 이메일 인증, 운영자 권한 관리, 소셜 로그인, WebSocket 채팅 범위를 분리했다.
- 2026-05-29 Post-MVP 프론트 선반영과 live VM blocker 분리는 [BACKEND_POST_MVP_CONTRACT_BLOCKERS_2026-05-29.md](./BACKEND_POST_MVP_CONTRACT_BLOCKERS_2026-05-29.md)를 따른다. 프론트는 여러 객체 대표 후보 선택/`selectedDetectionId` 전송과 알림함 서버 동기화 fallback을 준비했다. 이후 백엔드 회신으로 notifications/server search는 구현 완료 보고, impact는 상태 확인 필요, AI 정확도와 auth 확장은 후속 범위로 재분류했다.
- 2026-05-29 백엔드 상세 회신 검토는 [BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md](./BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md)를 따른다. 백엔드는 notifications/server search를 구현 완료로 회신했지만 live VM 재검증이 필요하고, AI 실제 분류 정확도와 multi-object detection은 현재 모델 한계로 Phase 4 항목이다.
- 2026-05-29 후속 반영으로 홈/지도 검색은 서버 `q`를 우선 호출하고, endpoint 미배포나 실패 시 마지막 unfiltered 목록의 로컬 필터로 fallback한다. `npm run qa:post-mvp-contracts`는 notifications, impact, search `q`를 read-only로 확인하는 재검증 하네스다.
- 2026-05-29 추가 후속 반영으로 서버 저장형 알림 client와 `qa:post-mvp-contracts`는 numeric/string `id`, camelCase/snake_case 필드, array 또는 `items`/`notifications`/`results` list wrapper를 모두 방어적으로 수용한다. 알림 목록 query는 `unreadOnly`와 `unread_only`를 전환 호환으로 함께 보낸다.
- 2026-05-29 추가 후속 반영으로 impact summary client와 `qa:post-mvp-contracts`는 camelCase/snake_case 응답과 숫자 문자열을 앱 내부 camelCase 숫자 타입으로 정규화 가능한 shape로 수용한다. 하네스는 impact `period` query도 검증한다.
- 2026-05-29 추가 후속 반영으로 AI generate 400 응답이 generic `message`와 구조화된 `error.rejectionReason`을 함께 내려도 앱은 enum 기반 사용자-facing 문구를 우선 표시한다.

## 활성 P0

### 최신 VM feature-contract E2E 닫기

- 분류: QA blocker
- 배경: 프론트 연결은 끝났지만 최신 백엔드 live VM에서 실제 mutation matrix를 다시 닫아야 한다.
- 현재 상태: 2026-05-28 `localhost:8080 -> NHN Cloud VM:80` SSH tunnel 연결 후 당시 mutate 하네스가 통과했다. 2026-06-03/04 백엔드 회신 반영으로 하네스는 direct/manual complete 경로를 제거하고 `pending_store -> confirm-store -> available -> request -> confirm-pickup -> completed`, trust review/report, operator inventory fixture 검증을 사용하도록 갱신했다. 2026-06-04 read-only preflight는 `localhost:8080`의 `/openapi.json`과 `/docs`에 모두 닿지 않아 실패했다. 최신 VM 터널 연결 후 재실행이 남아 있다.
- 기대 동작: 실제 VM에서 profile PATCH, my posts/share requests, QR lifecycle mutation, trust review/report, operator summary/items/dispose, 403/409 상태 규칙 matrix를 통과한다.
- 검증 방법: tunnel(`localhost:8080 -> NHN Cloud VM:80`)을 연 뒤 `$env:FOODLINK_API_BASE_URL='http://localhost:8080'; $env:FOODLINK_QA_FRIDGE_ID='1'; $env:FOODLINK_QA_FRIDGE_PUBLIC_CODE='GJ-STATION-001'; npm run qa:backend-contracts -- --mutate`.
- 산출물: `temp/backend-feature-contract-e2e-20260528T143053Z.json`, `temp/backend-feature-contract-e2e-20260604T093822Z.json`(터널 미연결 preflight 실패).

To-do:

- [x] `GET /users/me/posts`, `GET /users/me/share-requests`, `PATCH /auth/me` API client 연결
- [x] `/posts/{id}/cancel`, `/users/me/share-requests/{id}/cancel`, `/inventory/confirm-store`, `/inventory/confirm-pickup` API client 연결
- [x] 내 나눔/받은 나눔 화면 진입점 연결
- [x] profile PATCH 폼 연결
- [x] read-only preflight 하네스 준비
- [x] SSH tunnel 연결 후 live VM mutate E2E 실행
- [x] my posts/share requests 최신 VM 응답 확인
- [x] profile PATCH 최신 VM 응답 확인
- [x] lifecycle happy path mutation 확인: available cancel, request 후 QR pickup, request 후 requester cancel
- [x] lifecycle 403/409 matrix를 하네스 또는 수동 QA로 보강. 2026-06-04 하네스는 pending_store request 409, 작성자 본인 신청 403, 비작성자 취소 403, 비신청자 pickup 403, 중복 신청 409를 확인하도록 갱신했다.
- [x] trust feedback review/report와 공개 trust summary shape를 하네스에 추가
- [x] 운영자 계정 fixture와 담당 냉장고 fixture 기본값을 하네스에 반영
- [ ] 최신 VM에서 QR lifecycle/trust/operator 갱신 하네스 재실행

### 신청 만료 시각 timezone 해석 수정

- 분류: P0/P1 bug
- 배경: 2026-05-28 SM-S928N Android 15 실기기 QA에서 신청 직후 상세 화면이 `수령 제한 시간이 지났어요`를 표시했다.
- 증거: 서버는 `requestExpiresAt: "2026-05-28T11:38:21.707849"`처럼 timezone 없는 문자열을 내려줬고, 앱은 이를 KST 로컬 11:38로 해석했다. 실제 의도는 VM/UTC 기준 30분 hold로 보이며 한국 시간에서는 당일 20:38이어야 한다.
- 영향: 신청은 성공하지만 수령 QR/진행 중 나눔 UX가 즉시 만료처럼 보여 requester flow를 신뢰할 수 없다.
- 산출물: `temp/android-device-qa-20260528T195534/22-request-status.png`, API 수동 조회.

To-do:

- [x] 프론트가 timezone 없는 서버 lifecycle 시각을 명시적으로 UTC로 파싱한다. `37f73f9`에서 `requestExpiresAt`/`storeExpiresAt`/post lifecycle formatting 경로와 회귀 테스트를 고정했다.
- [x] 신청 직후 상세와 받은 나눔에서 `수령까지 남은 시간` 또는 정상 만료 시각이 표시되는지 실기기 재검증한다. 2026-05-28 SM-S928N Android 15 release QA에서 상세 `수령까지 남은 시간 29:31`, 홈 `수령 QR 필요`, 받은 나눔 `수령 QR 만료 5월 29일 오전 12:30`을 확인했다. 증거는 `temp/android-device-qa-20260528T234844/18-post-detail-after-request.png`, `19-home-after-request.png`, `20-received-shares-after-request.png`다.

### 진행 중인 나눔 허브 완성도 확인

- 분류: UX/QA
- 배경: 사용자가 지금 처리해야 할 나눔 action을 앱에서 바로 봐야 한다.
- 현재 상태: 홈의 `진행 중인 나눔` 허브와 내 나눔/받은 나눔 화면은 연결됐다. 2026-05-28 회귀 테스트 기준으로 계정 lifecycle action과 최근 신청/등록 fallback action이 노출된다.
- 기대 동작: QR 필요, 신청 접수, 제한 시간, 완료/만료/취소 상태가 사용자 언어로 표시된다.
- 검증 방법: Android emulator 또는 실기기에서 등록자/신청자 2계정으로 홈, 상세, 내역 화면 기본 동작 점검.

To-do:

- [x] 사용자가 내가 등록한 나눔 식재료와 내가 신청/수령한 나눔 식재료를 앱 안에서 확인할 수 있다.
- [x] QR 보관/수령 화면의 사용자-facing copy에서 내부 QA 언어가 제거된다.
- [x] API-backed QR 보관/수령 화면은 QA용 시뮬레이션 action을 노출하지 않고 실제 scanner callback으로 confirm API를 호출한다.
- [x] QR 화면 route/screen/test 명명은 `InventoryQr`, `InventoryQrScreen`, `inventoryQr.screen.test.tsx`로 production-facing 구조를 사용한다.
- [x] 홈 또는 전용 허브에서 사용자가 지금 처리해야 할 나눔 action을 볼 수 있다.
- [x] 진행 중인 action은 `입고 QR 필요`, `수령 QR 필요`, `신청 접수`, `수령 제한 시간`, `완료/만료/취소` 같은 사용자-facing 상태로 표시된다. 홈은 active QR/request label을, MyShares는 완료/만료/취소 lifecycle 표면을 맡는다.
- [x] 2026-05-28 실기기 QA에서 발견한 `requestExpiresAt` timezone 해석 문제를 수정한 뒤 진행 중인 나눔 허브와 받은 나눔 수령 QR 상태를 재검증한다. 증거는 `temp/android-device-qa-20260528T234844/19-home-after-request.png`, `20-received-shares-after-request.png`다.

### Android 시각 회귀 QA

- 분류: UI QA
- 배경: 기능은 연결됐지만 fixed footer, 지도 overlay, 하단 surface의 실제 화면 검증이 남아 있다.
- 현재 상태: 주요 fixed CTA 화면은 `DSScreenFooter` 공통 safe-area 패턴에 들어갔고, 지도 하단 primary surface 단일 모드는 코드/테스트로 고정됐다. 2026-05-28 SM-S928N Android 15 release QA에서 `InventoryQrScreen` action grid와 메인 하단 탭 label이 system navigation bar와 겹치는 회귀를 재현했다. QR 화면은 `ScrollView` viewport 자체를 Android navigation 영역 위로 올리고, 메인 탭바는 Android 0 bottom inset 환경에서도 fallback inset을 적용하도록 보정했다.
- 기대 동작: CTA가 system navigation bar와 겹치지 않고, 지도와 냉장고 내부 목록의 위계가 명확하다.
- 검증 방법: Android emulator와 가능하면 실기기 screenshot.

To-do:

- [x] Android emulator/실기기 screenshot에서 주요 fixed footer CTA가 system navigation bar와 겹치지 않는다. 2026-05-28 SM-S928N Android 15 release QA에서 QR `ScrollView` bounds `[0,304][1440,2952]`, `navigationBarBackground` bounds `[0,2952][1440,3120]`을 확인했고 scroll-bottom 상태의 QR action grid 전체가 y=2015~2351에 위치했다. 홈 탭 label도 y=2805~2852로 navigation bar 위에 있다. 증거는 `temp/android-device-qa-20260528T234844/21-inventory-qr-fixed.png`, `22-inventory-qr-fixed-bottom.png`, `23-home-tabbar-fixed.png`다.
- [x] 지도에서 냉장고 선택 시 하단 primary surface가 하나로 정리되어 지도와 냉장고 내부 목록의 위계가 명확하다.
- [x] 위치 설정 화면의 mock 지도는 도로망, 격자, GPS 상태, 좌표, 공유 냉장고 표식을 함께 보여 빈 지도 placeholder로 보이지 않는다. 2026-06-05 `Medium_Phone_API_36.1` release APK에서 `동네 위치 확인`, `정확도 우선`, `반경 2km`, `공유 냉장고`, 하단 알림 카드와 CTA가 한 화면에 겹침 없이 표시되는 것을 확인했다. 증거는 `.superpowers/brainstorm/codex-20260604225244/content/location-setup-gis-map-after.png`다.
- [x] `InventoryQrScreen` 하단 `보관 QR 스캔`/`수령 QR 스캔`/`다른 냉장고 스캔`/`다시 시작` action을 safe-area 위로 올리거나 `DSScreenFooter` 패턴으로 옮긴다. QR `ScrollView` viewport와 메인 탭바에 Android navigation fallback inset 회귀 테스트를 추가했다.

## 활성 P1

### iOS 기본 동작 점검 증거

- 분류: QA
- 배경: Android 중심 검증은 닫혔지만 iOS 시뮬레이터 evidence가 없다.
- 기대 동작: iOS에서 로그인, 위치 권한, 카메라/갤러리, 지도, 알림 권한, 홈/상세/신청 기본 흐름이 깨지지 않는다.

To-do:

- [ ] iOS 시뮬레이터에서 로그인, 위치 권한, 카메라/갤러리, 지도, 알림 권한, 홈/상세/신청 기본 동작 점검 증거가 남는다.

### Icon migration 잔여 정리

- 분류: 디자인 시스템 debt
- 배경: DS primitive와 `DSIcon` 기준은 세웠지만 일부 테스트 fixture와 후속 화면의 glyph/emoji debt가 남아 있다.
- 현재 상태: 앱 UI와 DS component fixture의 직접 glyph/emoji는 정책 테스트 범위에 들어갔다. `src`/`__tests__` grep상 남은 emoji는 앱 UI가 아닌 API 주석 경고 기호뿐이다.
- 기대 동작: 사용자-facing UI는 emoji/Text glyph 대신 design-system icon을 우선 사용한다.

To-do:

- [x] 로그인/회원가입/위치 설정 화면은 정책 테스트 범위에 들어갔다.
- [x] `FridgeSelectScreen` 뒤로가기 Text glyph와 Onboarding 일러스트 emoji는 `DSIcon`으로 치환했다.
- [x] 로그인/회원가입/위치 설정/Onboarding/FridgeSelect는 `DSIcon` 정책 테스트 또는 치환 범위에 들어갔고, 남은 테스트 fixture Text check와 후속 화면 glyph/emoji debt를 화면별로 추적한다.

### AI false-positive와 rejection contract

- 분류: 서버 계약/정책
- 배경: MVP에서는 `rejectionReason`이 정상 응답에서 `null`이다. 2026-05-29 결정으로 hard block `rejectionReason`과 soft review `reviewReason`을 분리했다. 같은 날 백엔드 회신으로 현재 AI 모델은 비식재료, 스크린샷, 저품질 이미지를 실제로 판별할 수 없고 응답 shape만 일부 맞출 수 있음이 확인됐다.
- 기대 동작: 서버가 실패 사유를 내려주면 앱은 등록을 진행하지 않고 사용자-facing 문구를 보여준다. 서버가 soft review 사유를 내려주면 앱은 `확인 필요`로 표시하되 등록은 허용한다.

To-do:

- [x] 앱은 서버 실패 사유를 사용자에게 보여주고 등록을 진행하지 않는다.
- [x] `confidenceScore < 0.9`는 등록 차단이 아니라 확인 필요 표시로 처리한다.
- [x] confidence 0.4/0.7/1.0 기대값을 테스트로 고정한다.
- [x] 2026-05-28 실기기 카메라 QA에서 키보드/노트북 사진이 `바나나`, `confidenceScore=0.7`, `확인 필요`로 통과하는 false-positive evidence를 확보했다.
- [x] Post-MVP에서 `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `review_required`, `multi_object_review` 등 실패/검토 사유 enum을 서버 계약에 추가한다. 결정 문서 기준 hard block은 `rejectionReason`, soft review는 `reviewReason`이다.
- [x] 2026-05-29 백엔드 회신을 반영해 fixture full strict 통과와 response shape 검증을 분리한다. 현재 모델로 `not_food`/`screenshot`/`low_quality` 정확도 gate를 닫을 수 없다.
- [x] 앱 정책과 fixture 검증 스크립트가 root-level `reviewReason`을 읽고, `npm run qa:ai-fixtures -- --shape-only`로 reason 없는 generic 400과 모델 정확도 gap을 분리한다.
- [x] 앱 에러 문구 경로가 `error.rejectionReason` hard-block enum을 직접 읽고 generic 400 message보다 우선해 사용자-facing 문구로 번역한다.
- [ ] 백엔드가 가능한 범위의 AI response shape를 구현한 뒤 reason 없는 generic 400 제거와 `error.rejectionReason`/`data.reviewReason` 노출을 live VM에서 검증한다.
- [ ] AI 모델 고도화 또는 별도 판별 모델 도입 후 비식재료/스크린샷/저품질 fixture full strict gate를 다시 연다. 최신 report-only 로그는 `temp/ai-fixtures-report-only-20260528T163234Z.txt`다.

### Multi-object UX 결정

- 분류: 제품 정책
- 배경: 프론트 타입은 `detections[]` 후보를 방어적으로 받을 수 있지만, 사용자 UX는 대표 객체 1개 등록을 유지한다. 2026-05-29 결정으로 자동 객체별 분리 등록은 보류하고 대표 객체 1개 등록을 유지한다. 백엔드 회신 기준 현재 ResNet-50 단일 분류 모델은 실제 object detection을 할 수 없다.
- 기대 동작: 여러 후보가 감지되면 후보 목록을 보여주고 사용자가 대표 식재료 1개를 확인/선택한다.

To-do:

- [x] 프론트 타입이 `detections[]` 후보 필드를 방어적으로 받을 수 있다.
- [x] 분석/등록 화면이 여러 후보를 표시하되 대표 식재료 1개 등록 안내를 유지한다.
- [x] 백엔드 `detections[]` 최소 필드 초안이 확정된다.
- [x] multi-object fixture 이미지를 준비하고 VM/API report-only 결과를 기록한다.
- [x] 대표 객체 1개 처리와 객체별 분리 등록 중 UX 방향을 결정한다. 다음 Post-MVP increment도 대표 객체 1개 등록이고, 자동 분리 등록은 보류한다.
- [x] 프론트 등록 확인 화면에서 대표 후보를 선택하고 후보 `id`가 있으면 `selectedDetectionId`를 `POST /posts` payload로 넘긴다.
- [x] 백엔드가 현재 모델로는 실제 multi-object detection과 normalized `bbox`를 만들 수 없음을 회신했다.
- [ ] Object detection 모델 도입 후 `reviewReason=multi_object_review`, 실제 `detections.length >= 2`, normalized `bbox`, `selectedDetectionId` 수용 계약을 VM에서 다시 검증한다.

### 운영자 role 관리 UI

- 분류: Post-MVP/운영 기능
- 배경: `/auth/me` role metadata는 연결됐지만 role 관리 자체는 아직 제품 UI가 아니다. 2026-05-29 결정으로 소비자 앱 안의 role 부여/변경 UI는 제외한다.
- 기대 동작: 실제 운영자 계정만 운영자 콘솔에 진입하고, role 부여/변경은 backend seed, admin CLI, 또는 별도 web backoffice에서 처리한다.

To-do:

- [x] `/auth/me`에서 `isOperator`, `operatorRole`, `operatorFridgeIds` 운영자 힌트를 내려준다.
- [x] 실제 운영자 계정만 프로필에서 운영자 콘솔 진입점을 볼 수 있다.
- [ ] 최신 VM 실제 운영자 계정으로 프로필의 운영자 콘솔 진입 제어와 운영자 콘솔 진입을 재검증한다.
- [x] 운영자 role 관리 UI 범위를 결정한다. 모바일 소비자 앱에는 role grant/revoke를 넣지 않는다.

### 서버 저장형 알림 읽음 상태

- 분류: Post-MVP
- 배경: MVP 알림함은 FCM 수신 기록과 로컬 읽음 상태만 사용한다. 2026-05-29 결정으로 서버 알림 저장소를 Post-MVP source of truth로 채택한다. 백엔드는 notifications 테이블과 4 endpoint 구현 완료로 회신했다.
- 기대 동작: 서버 저장형 알림 목록, 읽음, 삭제 API를 도입하고 로컬 FCM 기록은 fallback cache로 dedupe한다.

To-do:

- [x] 알림함은 MVP에서 FCM 수신 기록과 로컬 AsyncStorage 읽음 상태로 유지하고, 서버 저장형 목록/읽음 API는 Post-MVP 설계로 분리한다.
- [x] 서버 저장형 알림 API 계약을 설계한다. `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`, `DELETE /notifications/{id}` 기준이다.
- [x] 앱 알림함은 focus 시 서버 알림을 fetch/merge하고 read/read-all/delete를 best-effort 호출한다. endpoint 실패 시 로컬 FCM 기록 fallback을 유지한다.
- [x] 서버 알림 응답의 numeric/string `id`, snake_case 필드, list wrapper 변형을 앱 정규화와 read-only 계약 하네스에서 수용한다. 목록 query는 `unreadOnly`/`unread_only`, `skip`, `limit` 노출을 하네스에서 확인한다.
- [ ] 백엔드 재배포 후 `/api/v1/notifications` 계열 4 endpoint가 OpenAPI/live VM에 노출되는지 확인하고 앱 알림함 server sync를 검증한다. 2026-05-29 프론트 확인 시점의 기존 VM은 404/미노출이었다.

### 실제 지표와 탄소 절감 표시

- 분류: 정책/데이터 계약
- 배경: MVP에서는 mock 통계와 탄소 절감 표시를 운영성 UI에서 제거했다. 홈은 주변 나눔/진행 중인 나눔, 프로필은 수령 완료/좋은 평가 신뢰 요약처럼 이미 연결된 운영 지표만 보여준다. 2026-05-29 결정으로 환경 성취 지표는 backend-computed estimate로만 노출한다. 백엔드 회신은 impact를 구현 완료로 요약했지만 본문에는 완전 미구현/개발 계획으로 적어 상태가 상충한다.
- 기대 동작: 실제 지표로 유지하려면 완료/수령 확인된 나눔 식재료만 집계하고 `추정 절감`으로 표시한다.

To-do:

- [x] 홈 탄소 절감 mock 값은 운영성 UI에서 제거된다.
- [x] 프로필 mock 통계를 제거하고 수령 완료/좋은 평가 신뢰 요약으로 교체한다.
- [x] 실제 지표로 유지하려면 계산식과 API 계약이 문서화된다. `GET /users/me/impact/summary`와 `estimatedWeightGrams * categoryCarbonFactor` 기준이다.
- [x] `getImpactSummary()` API client와 `ImpactSummary` 타입을 추가했다. live VM 확인 전이라 홈/프로필 숫자 UI는 아직 연결하지 않는다.
- [x] `getImpactSummary()`가 camelCase/snake_case 응답을 정규화하고, read-only 하네스가 `period` query와 impact response shape를 확인한다.
- [ ] 백엔드 재배포 후 `/api/v1/users/me/impact/summary`의 OpenAPI/live VM 존재 여부, 빈 사용자 zero summary, `calculationVersion`, `computedAt`, `totalShared`/`totalReceived` 최종 shape를 확인한다. 확인 전에는 앱에 숫자 UI를 연결하지 않는다.

### 서버 검색, 인증, 채팅 Post-MVP 결정

- 분류: 제품/계약
- 배경: 검색, 소셜 로그인, 이메일 인증, WebSocket 채팅은 원래 MVP 흐름이 아니며 계약 없이 UI를 먼저 붙이면 scope가 커진다.
- 기대 동작: server search는 기존 discovery endpoint 확장으로 검증하고, email verification/social login은 Phase 4 auth expansion으로 묶어 제외한다. WebSocket 채팅은 lifecycle/알림 안정화 전까지 제외한다.

To-do:

- [x] 서버 검색 계약 방향을 결정한다. `GET /posts/nearby`와 `GET /fridges/nearby`에 optional `q`, `skip`, `limit`을 추가하는 방식으로 확장한다.
- [x] `getNearbyPosts()`와 `getNearbyFridges()`가 optional `q`, `skip`, `limit`을 보낼 수 있게 API client를 확장했다. 화면은 live VM 확인 전까지 기존 로컬 필터 fallback을 유지한다.
- [x] 홈/지도 검색 화면은 trimmed query가 있으면 서버 `q` 검색을 먼저 호출하고, 실패하면 마지막 unfiltered 결과를 로컬 필터링한다.
- [x] `npm run qa:post-mvp-contracts` read-only 하네스로 OpenAPI의 notifications/impact/search `q` 노출과 인증 read endpoint response shape를 확인할 수 있다.
- [x] 백엔드 회신을 반영해 email verification과 social login을 이번 immediate scope에서 제외하고 Phase 4 auth expansion으로 분리한다.
- [x] WebSocket 채팅 범위를 결정한다. 다음 구현 후보에서 제외하고 알림/신청 lifecycle을 우선한다.
- [x] Post-MVP 구현 시 server search, email verification, social login, WebSocket chat을 각각 독립 후속 항목으로 분리한다. 2026-05-29 backend blocker 문서에 API 필요 범위와 제외 범위를 분리했다.
- [ ] 백엔드가 구현 완료로 회신한 server search `q` parameter가 OpenAPI/live VM에 추가됐는지 확인하고, 서버 검색이 안정화되면 로컬 fallback 유지 범위를 재결정한다.
- [x] `/auth/me.emailVerifiedAt`은 nullable 필드로 방어 처리한다.
- [ ] 실제 email verification/social login flow는 Phase 4에서 별도 계약을 작성한다.

## 보존된 To-do 완료 기록

이 섹션은 과거 상세 QA 본문을 제거하면서도 완료된 to-do 체크 이력을 보존하기 위한 기록이다. 세부 근거는 archive 문서를 본다.

### 1. 과거 MVP/농산물 등록 흐름 검증

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

### 2. 실패 케이스와 예외 처리 검증

- [x] 나눔 기준 미충족 상태(`Stale`)일 때 나눔 식재료 등록이 막히는지 확인
- [x] 나눔 기준 미충족 상태(`Stale`)일 때 사용자에게 실패 이유가 표시되는지 확인
- [x] 실패 후 재촬영, 수동 수정, 이전 화면 이동 등 대안이 있는지 확인
- [x] API 서버 연결 실패 시 앱이 멈추지 않는지 확인
- [x] AI 서버 연결 실패 시 앱이 멈추지 않는지 확인
- [x] 네트워크 끊김 상태에서 주요 화면이 어떻게 동작하는지 확인
- [x] 나눔 식재료 등록 버튼을 여러 번 눌렀을 때 중복 등록되지 않는지 확인
- [x] 큰 이미지 업로드 시 압축 또는 실패 처리가 있는지 확인
- [ ] 카메라 권한 거부 시 안내와 대체 흐름이 있는지 확인
- [x] 위치 권한 거부 시 안내와 대체 흐름이 있는지 확인
- [x] 주변 냉장고 없음 상태가 자연스럽게 표시되는지 확인
- [x] 나눔 식재료 없음 상태가 자연스럽게 표시되는지 확인
- [x] 검색 결과 없음 상태가 자연스럽게 표시되는지 확인
- [x] 다른 유저의 나눔 식재료 수정/삭제가 막히는지 확인

### 3. AI 파이프라인 데이터 흐름 검증

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
- [x] 신선도 등급 기준이 `Fresh/Mid/Stale`인지 확인
- [x] `Stale` 상태가 어느 레이어에서 등록 실패로 바뀌는지 확인

테스트 이미지 후보:

- [x] 음식 하나가 선명하게 찍힌 사진
- [ ] 음식 여러 개가 함께 찍힌 사진
- [ ] 어두운 사진
- [ ] 흔들린 사진
- [ ] 너무 가까운 사진
- [ ] 너무 먼 사진
- [ ] 포장재가 있는 사진
- [ ] 라벨이나 유통기한이 보이는 사진
- [ ] 내부 상태가 보이지 않는 사진

### 4. 한 장 촬영 UX와 multi-object 정책 정리

- [x] 한 장 촬영만으로 충분히 판단 가능한 케이스 정리
- [x] 한 장 촬영으로 판단이 어려운 케이스 정리
- [x] 라벨, 유통기한, 내부 상태가 사진 한 장에 안 보일 때의 처리 방식 정하기
- [x] 잘못 찍은 사진일 때 재촬영 유도 UI가 있는지 확인
- [x] AI confidence가 낮을 때 등록을 막을지 정하기
- [x] AI confidence가 낮을 때 재촬영을 요구할지 정하기
- [x] AI confidence가 낮을 때 수동 입력으로 넘길지 정하기
- [x] 여러 음식이 감지될 때 하나의 나눔 식재료로 처리할지 정하기
- [x] 여러 음식이 감지될 때 객체별로 분리 등록할지 정하기
- [x] 여러 객체 중 하나라도 `Stale`이면 전체 등록을 막을지 정하기
- [x] 여러 객체별로 나눔 기준 미충족 상태를 표시할지 정하기
- [x] multi-object detection을 지금 MVP에 붙일지, 다음 스프린트 연구/검증 항목으로 둘지 정하기

### 5. 미구현 기능 상태 점검

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
- [x] 냉장고별 나눔 식재료 조회 구현 상태 확인
- [x] 지도에서 근처 냉장고 조회가 실제 데이터로 동작하는지 확인
- [x] 채팅 탭을 유지할지 제거할지 결정
- [x] 채팅을 WebSocket으로 구현할지 단순 문의/예약 기능으로 축소할지 결정

### 6. 다음 스프린트 백로그 정리

- [x] 원래 MVP 흐름 검증 결과를 이슈 후보로 변환
- [x] 실패 케이스 검증 결과를 이슈 후보로 변환
- [x] AI 파이프라인 보강 항목을 이슈 후보로 변환
- [x] 한 장 촬영 UX 정책 결정을 문서화
- [x] multi-object detection 적용 여부를 문서화
- [x] 미구현 기능의 우선순위를 다음 스프린트 범위로 재조정
- [x] 각 백로그 항목에 acceptance criteria 작성
- [x] 각 백로그 항목에 검증 방법 작성
- [x] 스프린트에서 제외할 항목을 명시

### 7. 시연/검증용 데이터 준비

- [x] 검증용 유저 계정 준비
- [x] 검증용 위치 데이터 준비
- [x] 검증용 냉장고 데이터 준비
- [x] 검증용 나눔 식재료 데이터 준비
- [x] AI 성공 케이스 이미지 준비
- [x] AI 실패 케이스 이미지 준비
- [x] 나눔 기준 미충족 상태 `Stale` 케이스 이미지 준비
- [x] multi-object 예시 이미지 준비
- [x] 주변 냉장고 없음 상태를 확인할 수 있는 위치 준비
- [x] 나눔 식재료 없음 상태를 확인할 수 있는 조건 준비
- [x] 검색 결과 없음 상태를 확인할 수 있는 키워드 준비

## 참고 문서

- 전체 과거 로그: [archive/VALIDATION_AND_BACKLOG_2026-05-28.md](./archive/VALIDATION_AND_BACKLOG_2026-05-28.md)
- 구현 상태 요약: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- 도메인 용어와 정책: [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
- API 계약: [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md)
- Post-MVP 제품/계약 결정: [POST_MVP_PRODUCT_CONTRACT_DECISIONS.md](./POST_MVP_PRODUCT_CONTRACT_DECISIONS.md)
- Post-MVP backend blocker: [BACKEND_POST_MVP_CONTRACT_BLOCKERS_2026-05-29.md](./BACKEND_POST_MVP_CONTRACT_BLOCKERS_2026-05-29.md)
- Post-MVP backend response review: [BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md](./BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md)
- 백엔드 feature contract handoff: [BACKEND_HANDOFF_FEATURE_CONTRACTS_2026-05-25.md](./BACKEND_HANDOFF_FEATURE_CONTRACTS_2026-05-25.md)
