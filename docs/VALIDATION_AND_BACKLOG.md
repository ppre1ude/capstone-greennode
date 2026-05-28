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

- MVP 핵심 흐름인 `등록 -> 냉장고/홈 노출 -> 신청 -> 알림 -> QR 보관/수령`은 검증 완료 상태다.
- 2026-05-27 백엔드 feature contract는 프론트 API client와 화면에 연결됐다.
- 알림 탭은 MVP에서 FCM 수신 기록과 로컬 AsyncStorage 읽음 상태만 사용한다. 서버 저장형 알림 API는 Post-MVP다.
- `requested` 이후 취소/완료 전이는 사용자-facing 정책과 API 계약이 확정됐다. 만료는 서버 배치로 처리한다.
- 현재 주요 blocker는 최신 live VM E2E 검증이다. 2026-05-28 기준 로컬 `localhost:8080` SSH tunnel 미연결로 `/openapi.json` 접근이 막혀 있었다.

## 활성 P0

### 최신 VM feature-contract E2E 닫기

- 분류: QA blocker
- 배경: 프론트 연결은 끝났지만 최신 백엔드 live VM에서 실제 mutation matrix를 다시 닫아야 한다.
- 현재 상태: `npm run qa:backend-contracts` 하네스는 준비됐고, tunnel 미연결이 마지막 blocker였다.
- 기대 동작: 실제 VM에서 profile PATCH, my posts/share requests, lifecycle mutation, 200/403/409 matrix를 통과한다.
- 검증 방법: tunnel(`localhost:8080 -> NHN Cloud VM:80`)을 연 뒤 `$env:FOODLINK_API_BASE_URL='http://localhost:8080'; npm run qa:backend-contracts -- --mutate`.
- 산출물: `temp/backend-feature-contract-e2e-<timestamp>.json`.

To-do:

- [x] `GET /users/me/posts`, `GET /users/me/share-requests`, `PATCH /auth/me` API client 연결
- [x] `/posts/{id}/cancel|complete`, `/users/me/share-requests/{id}/cancel` API client 연결
- [x] 내 나눔/받은 나눔 화면 진입점 연결
- [x] profile PATCH 폼 연결
- [x] read-only preflight 하네스 준비
- [ ] SSH tunnel 연결 후 live VM mutate E2E 실행
- [ ] my posts/share requests 최신 VM 응답 확인
- [ ] profile PATCH 최신 VM 응답 확인
- [ ] lifecycle mutation 200/403/409 matrix 확인
- [ ] 운영자 계정 환경변수 확보 시 operator role-gated profile 확인

### 진행 중인 나눔 허브 완성도 확인

- 분류: UX/QA
- 배경: 사용자가 지금 처리해야 할 나눔 action을 앱에서 바로 봐야 한다.
- 현재 상태: 홈의 `진행 중인 나눔` 허브와 내 나눔/받은 나눔 화면은 연결됐다.
- 기대 동작: QR 필요, 신청 접수, 제한 시간, 완료/만료/취소 상태가 사용자 언어로 표시된다.
- 검증 방법: Android emulator 또는 실기기에서 등록자/신청자 2계정으로 홈, 상세, 내역 화면 smoke QA.

To-do:

- [x] 사용자가 내가 등록한 나눔 식재료와 내가 신청/수령한 나눔 식재료를 앱 안에서 확인할 수 있다.
- [x] QR 보관/수령 화면의 사용자-facing copy에서 내부 QA 언어가 제거된다.
- [x] API-backed QR 보관/수령 화면은 QA용 시뮬레이션 action을 노출하지 않고 실제 scanner callback으로 confirm API를 호출한다.
- [x] QR 화면 route/screen/test 명명은 `InventoryQr`, `InventoryQrScreen`, `inventoryQr.screen.test.tsx`로 production-facing 구조를 사용한다.
- [ ] 홈 또는 전용 허브에서 사용자가 지금 처리해야 할 나눔 action을 볼 수 있다.
- [ ] 진행 중인 action은 `입고 QR 필요`, `수령 QR 필요`, `신청 접수`, `수령 제한 시간`, `완료/만료/취소` 같은 사용자-facing 상태로 표시된다.

### Android 시각 회귀 QA

- 분류: UI QA
- 배경: 기능은 연결됐지만 fixed footer, 지도 overlay, 하단 surface의 실제 화면 검증이 남아 있다.
- 기대 동작: CTA가 system navigation bar와 겹치지 않고, 지도와 냉장고 내부 목록의 위계가 명확하다.
- 검증 방법: Android emulator와 가능하면 실기기 screenshot.

To-do:

- [ ] Android emulator/실기기 screenshot에서 주요 fixed footer CTA가 system navigation bar와 겹치지 않는다.
- [ ] 지도에서 냉장고 선택 시 하단 primary surface가 하나로 정리되어 지도와 냉장고 내부 목록의 위계가 명확하다.

## 활성 P1

### iOS smoke QA evidence

- 분류: QA
- 배경: Android 중심 검증은 닫혔지만 iOS 시뮬레이터 evidence가 없다.
- 기대 동작: iOS에서 로그인, 위치 권한, 카메라/갤러리, 지도, 알림 권한, 홈/상세/신청 smoke 흐름이 깨지지 않는다.

To-do:

- [ ] iOS 시뮬레이터에서 로그인, 위치 권한, 카메라/갤러리, 지도, 알림 권한, 홈/상세/신청 smoke QA evidence가 남는다.

### Icon migration 잔여 정리

- 분류: 디자인 시스템 debt
- 배경: DS primitive와 `DSIcon` 기준은 세웠지만 일부 테스트 fixture와 후속 화면의 glyph/emoji debt가 남아 있다.
- 기대 동작: 사용자-facing UI는 emoji/Text glyph 대신 design-system icon을 우선 사용한다.

To-do:

- [x] 로그인/회원가입/위치 설정 화면은 정책 테스트 범위에 들어갔다.
- [x] `FridgeSelectScreen` 뒤로가기 Text glyph와 Onboarding 일러스트 emoji는 `DSIcon`으로 치환했다.
- [ ] 로그인/회원가입/위치 설정/Onboarding/FridgeSelect는 `DSIcon` 정책 테스트 또는 치환 범위에 들어갔고, 남은 테스트 fixture Text check와 후속 화면 glyph/emoji debt를 화면별로 추적한다.

### AI false-positive와 rejection contract

- 분류: 서버 계약/정책
- 배경: MVP에서는 `rejectionReason`이 정상 응답에서 `null`이다. 비식재료, 저품질, 스크린샷, 다중 객체 검토 enum은 Post-MVP 계약이다.
- 기대 동작: 서버가 실패/검토 사유를 내려주면 앱은 등록을 진행하지 않고 사용자-facing 문구를 보여준다.

To-do:

- [x] 앱은 서버 실패 사유를 사용자에게 보여주고 등록을 진행하지 않는다.
- [x] `confidenceScore < 0.9`는 등록 차단이 아니라 확인 필요 표시로 처리한다.
- [x] confidence 0.4/0.7/1.0 기대값을 테스트로 고정한다.
- [ ] Post-MVP에서 `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `review_required`, `multi_object_review` 등 실패/검토 사유 enum을 서버 계약에 추가한다.
- [ ] Post-MVP에서 비식재료/스크린샷 fixture는 generate 400 또는 `확인 필요`로 처리된다.

### Multi-object UX 결정

- 분류: 제품 정책
- 배경: 프론트 타입은 `detections[]` 후보를 방어적으로 받을 수 있지만, 사용자 UX는 대표 객체 1개 등록을 유지한다.
- 기대 동작: 대표 객체 1개 처리와 객체별 분리 등록 중 방향을 결정한다.

To-do:

- [x] 프론트 타입이 `detections[]` 후보 필드를 방어적으로 받을 수 있다.
- [x] 분석/등록 화면이 여러 후보를 표시하되 대표 식재료 1개 등록 안내를 유지한다.
- [x] 백엔드 `detections[]` 최소 필드 초안이 확정된다.
- [x] multi-object fixture 이미지를 준비하고 VM/API report-only 결과를 기록한다.
- [ ] 대표 객체 1개 처리와 객체별 분리 등록 중 UX 방향을 결정한다.

### 운영자 role 관리 UI

- 분류: Post-MVP/운영 기능
- 배경: `/auth/me` role metadata는 연결됐지만 role 관리 자체는 아직 제품 UI가 아니다.
- 기대 동작: 실제 운영자 계정만 운영자 콘솔에 진입하고, role 부여/변경 정책은 백엔드와 제품에서 확정한다.

To-do:

- [x] `/auth/me`에서 `isOperator`, `operatorRole`, `operatorFridgeIds` 운영자 힌트를 내려준다.
- [x] 실제 운영자 계정만 프로필에서 운영자 콘솔 진입점을 볼 수 있다.
- [ ] 최신 VM 실제 운영자 계정으로 role-gated profile과 operator console 진입을 재검증한다.
- [ ] 운영자 role 관리 UI 범위를 결정한다.

### 서버 저장형 알림 읽음 상태

- 분류: Post-MVP
- 배경: MVP 알림함은 FCM 수신 기록과 로컬 읽음 상태만 사용한다.
- 기대 동작: 서버 저장형 알림 목록, 읽음, 삭제 API를 도입할지 별도 설계한다.

To-do:

- [x] 알림함은 MVP에서 FCM 수신 기록과 로컬 AsyncStorage 읽음 상태로 유지하고, 서버 저장형 목록/읽음 API는 Post-MVP 설계로 분리한다.
- [ ] 서버 저장형 알림 API 계약을 설계한다.

### 실제 지표와 탄소 절감 표시

- 분류: 정책/데이터 계약
- 배경: MVP에서는 mock 통계와 탄소 절감 표시를 운영성 UI에서 제거했다.
- 기대 동작: 실제 지표로 유지하려면 계산식과 API 계약이 먼저 확정된다.

To-do:

- [x] 홈 탄소 절감 mock 값은 운영성 UI에서 제거된다.
- [x] 프로필 mock 통계를 제거하거나 준비 중 상태로 바꾼다.
- [ ] 실제 지표로 유지하려면 계산식과 API 계약이 문서화된다.

## 보존된 To-do 완료 기록

이 섹션은 과거 상세 QA 본문을 제거하면서도 완료된 to-do 체크 이력을 보존하기 위한 기록이다. 세부 근거는 archive 문서를 본다.

### 1. MVP 핵심 플로우 검증

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

- [x] MVP 핵심 플로우 검증 결과를 이슈 후보로 변환
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
- 백엔드 feature contract handoff: [BACKEND_HANDOFF_FEATURE_CONTRACTS_2026-05-25.md](./BACKEND_HANDOFF_FEATURE_CONTRACTS_2026-05-25.md)
