# 프론트 검증 결과 기반 백엔드 필수 확인 요청

날짜: 2026-05-07
우선순위: P0/P1
상태: 프론트는 Phase 1.5 계약 반영, VM/API QA, 실기기 happy path QA, 무기기 fixture/fallback QA를 진행했습니다.

> 2026-06-07 상태 갱신: 이 문서는 2026-05-07 백엔드 확인 요청 기록이다. 아래 FCM 실제 기기 수신 항목은 2026-05-25 실기기+emulator 2계정 QA로 닫혔고, 현재 남은 알림 항목은 서버 저장형 알림 읽음 동기화와 `/notifications` live VM/OpenAPI 재검증이다.

---

## 답변 방식 요청

각 항목은 가능하면 아래 중 하나로 분류해 답변 부탁드립니다.

- 백엔드 버그, 수정 예정
- 현재 계약이 맞음, 프론트 수정 필요
- MVP에서는 허용, Post-MVP로 이관
- 추가 논의 필요

프론트는 답변을 기준으로 MVP flow QA를 다시 돌릴 예정이었습니다. 특히 `generate -> create -> nearby/fridge list -> detail -> request -> requested 제외` 흐름과 FCM 수신 여부를 최종 확인하려고 했고, FCM 수신은 2026-05-25에 닫혔습니다.

---

## P0. Post AI 메타데이터 저장 불일치 확인 요청

프론트/실기기 QA에서 다음 흐름을 확인했습니다.

1. `POST /api/v1/posts/generate`
   - AI 분석 결과는 정상 수신됨
   - 예:
     - `detectedFruitKo=바나나`
     - `aiAnalysis.category=Fresh`
     - `aiAnalysis.confidenceScore=1.0` 또는 `0.91`
     - `imageToken` 발급

2. 이어서 `POST /api/v1/posts`
   - 등록은 성공함

3. 이후 `GET /api/v1/posts/{id}`, `GET /api/v1/posts/nearby`, `GET /api/v1/fridges/{fridge_id}/posts?status=available`
   - 아래 필드가 `null`로 내려옴
     - `detectedFruit`
     - `detectedFruitKo`
     - `freshnessLabel`
     - `confidenceScore`
   - 앱에서는 fallback으로 `나눔 식재료 / 분석 중`이 표시됨

### 확인 질문

1. `POST /posts/generate`에서 생성된 AI 메타데이터는 `imageToken`과 함께 서버 임시 저장소에 보관되고, `POST /posts` 시점에 Post row로 저장되는 구조가 맞나요?

2. 맞다면 현재 `POST /posts` 이후 조회 응답에서 아래 필드가 `null`인 것은 백엔드 버그로 봐도 될까요?
   - `detectedFruit`
   - `detectedFruitKo`
   - `freshnessLabel`
   - `confidenceScore`

3. 아니라면, 프론트가 `POST /posts` payload에 AI 메타데이터를 다시 보내야 하나요?
   - 현재 프론트는 `imageToken + fridgeId + expirationDate` 중심으로 create 요청을 보냅니다.
   - 보안/신뢰성 관점에서는 프론트가 AI 결과를 재전송하는 것보다 서버가 `imageToken` 기준으로 저장하는 편이 맞다고 보고 있습니다.

4. 최종 응답 계약은 Post root field 기준으로 확정하면 되나요?
   - `detectedFruit`
   - `detectedFruitKo`
   - `freshnessLabel`
   - `confidenceScore`
   - `status`

### 완료 기준

백엔드 수정 후 아래가 모두 성립하면 프론트에서 재검증하겠습니다.

- `POST /posts` 성공 직후 응답 또는 `GET /posts/{id}`에서 AI 메타데이터가 null이 아님
- `/posts/nearby`에서도 홈 카드 표시용 AI 메타데이터가 내려옴
- `/fridges/{id}/posts?status=available`에서도 동일 필드가 내려옴
- 기존 null 데이터는 MVP 단계에서 마이그레이션 없이 프론트 fallback 허용 여부를 확인

---

## P1. AI rejection 응답 형태 확인

현재 프론트는 `Stale` 또는 `isFresh=false`일 때 등록 화면으로 넘어가지 않도록 처리하고 있습니다.

프론트에서 이미 고정한 방어선:

- generate 400이면 등록 화면으로 이동하지 않음
- `message` 또는 `detail`을 사용자 문구로 표시
- `Stale`, `not_food`, `low_quality` 계열 문구는 프론트에서 안전한 표현으로 변환
- 실패 Alert에서 `다시 촬영`, `갤러리 선택` 대안을 제공
- `imageToken`이 없으면 분석 결과 화면에서도 최종 등록 차단

### 확인 질문

1. `Stale` 또는 `isFresh=false`일 때 `POST /posts/generate`는 계속 400을 반환하나요?

2. 이 경우 `imageToken`은 발급되지 않는 것이 맞나요?

3. 400 body에서 프론트가 안정적으로 읽어도 되는 필드는 무엇인가요?
   - `message`
   - `detail`
   - `analysisMessage`
   - 기타

4. `not_food`, `low_quality`, `multi_object`는 MVP에서는 아직 enum 없이 후속으로 보는 것이 맞나요?

---

## P1. confidenceScore 운영 기준 확인

프론트는 `confidenceScore`가 낮아도 등록을 차단하지 않고, `확인 필요` 보조 표시만 하려고 합니다.

현재 프론트 기준:

- `confidenceScore < 0.9` -> `확인 필요` 표시
- 낮은 confidence만으로 등록 차단하지 않음
- 등록 차단은 `isFresh=false`, `Stale`, generate 400, `imageToken` 없음 기준

### 확인 질문

1. `confidenceScore`는 계속 Stage 2 freshness softmax max 확률로 보면 되나요?

2. 백엔드는 `confidenceScore` 값만으로 등록을 차단하지 않는 것이 맞나요?

3. 프론트 표시 기준은 제품 정책으로 정하고, 서버 계약에는 영향 없는 것으로 봐도 되나요?

---

## P1. screenshot/UI false-positive 추가 QA 결과

실기기 없이 VM API에 직접 이미지를 업로드해 `/posts/generate`를 추가 확인했습니다.

### Fresh fixture

- 파일: `temp/qa-vm-banana.jpg`
- 결과:
  - status: `200`
  - `detectedFruitKo=바나나`
  - `aiAnalysis.category=Fresh`
  - `aiAnalysis.confidenceScore=1.0`
  - `imageToken` 발급

이 케이스는 정상 happy path로 봅니다.

### Screenshot/UI fixture

- 파일: `temp/real-device-camera-screen.png`
- 성격: 실제 식재료 원본 사진이 아니라 앱/기기 화면 캡처 계열 이미지
- 결과:
  - status: `200`
  - `detectedFruitKo=바나나`
  - `aiAnalysis.category=Fresh`
  - `aiAnalysis.confidenceScore=0.5377`
  - `imageToken` 발급

### 충돌 지점

프론트 QA 기준에서 `screenshot-or-ui` 케이스는 아래 중 하나가 기대값입니다.

- generate 400
- `not_food`
- `low_quality`
- `review_required`
- 최소한 낮은 confidence 기반 `확인 필요`

하지만 현재 API는 `Fresh`로 통과시키고 `imageToken`까지 발급합니다.

프론트는 이미지 내용을 직접 판별할 수 없기 때문에, 서버가 `Fresh + imageToken`을 반환하면 현재 계약상 등록 가능 상태로 취급할 수밖에 없습니다.

### 확인 질문

1. screenshot/UI/화면 촬영 이미지를 MVP에서 서버 또는 AI 파이프라인이 차단/review 처리할 수 있나요?

2. 당장 별도 판별이 어렵다면, `confidenceScore=0.5377`처럼 낮은 confidence일 때도 서버 기준으로는 `Fresh + imageToken` 발급이 맞나요?

3. 낮은 confidence는 프론트에서 `확인 필요`로 표시하되 등록은 허용하는 현재 정책을 유지해도 되나요?

4. Post-MVP rejection reason enum에 아래 값을 추가하는 방향은 괜찮나요?
   - `not_food`
   - `low_quality`
   - `screenshot`
   - `ui_screenshot`
   - `review_required`
   - `multi_object_review`

---

## P1. 냉장고별 목록 응답 필드 확인

`GET /api/v1/fridges/{fridge_id}/posts?status=available`을 앱 UI에 붙였습니다.

### 확인 질문

1. 이 API도 `/posts/nearby`, `/posts/{id}`와 동일한 PostRead 필드셋을 보장하나요?

2. `status=available`일 때 `requested`, `completed`는 항상 제외되나요?

3. 지도에서 냉장고 선택 후 내부 목록 표시 용도로 이 API를 계속 사용해도 되나요?

---

## P1. FCM 발송 조건과 payload 확인

프론트는 FCM 수신 handler와 로컬 알림함을 구현했고, 실제 기기 foreground/background/terminated 수신 QA는 2026-05-25 실기기+emulator 2계정으로 닫혔습니다.

### 확인 질문

1. `POST /posts` 성공 시 `share_created`는 실제로 발송되나요?

2. `POST /posts/{id}/requests`가 201로 성공할 때 `share_requested`는 실제로 발송되나요?

3. 최종 payload 필드는 아래 camelCase 기준으로 보면 되나요?
   - `type`
   - `postId`
   - `requestId`
   - `fruitName`
   - `fridgeName`

4. 실제 기기 QA를 위해 백엔드에서 테스트 계정 또는 특정 FCM token 대상으로 테스트 메시지 발송을 지원할 수 있나요?

### 완료 기준

- `share_created`와 `share_requested` payload 계약 확정
- 실제 Android 기기와 emulator에서 foreground/background/terminated 중 가능한 범위의 수신 확인 완료
- 수신 실패 시 백엔드 발송 문제인지, Firebase 설정 문제인지, 프론트 수신 문제인지 분리 가능

---

## P1. `requested` 상태 의미 확인

프론트 제품 문구는 `requested`를 예약 확정이 아니라 `신청 접수`로 표현하려고 합니다.

현재 MVP 정의:

- 첫 신청 성공 시 `available -> requested`
- `requested`는 신청 접수 상태
- MVP에서는 공급자 승인/거절, 예약 확정, 수령 완료까지 구현하지 않음
- 이미 `requested`인 나눔 식재료의 추가 신청은 409로 거절

### 확인 질문

1. 백엔드도 `requested`를 예약/수령 확정이 아닌 신청 접수 상태로 정의하나요?

2. MVP에서 `reserved`, `completed`, `cancelled`, `expired` 흐름은 프론트가 노출하지 않는 것으로 봐도 되나요?

3. `POST /posts/{id}/requests` 201 이후 `/posts/nearby`와 `/fridges/{id}/posts?status=available`에서 해당 나눔 식재료가 제외되는 현재 동작을 최종 계약으로 보면 되나요?

---

## 프론트에서 완료한 보강

프론트는 아래 항목을 구현/테스트로 고정했습니다.

- 카메라 장치가 없으면 갤러리 선택 fallback 제공
- 갤러리 선택 이미지가 정상 generate되면 분석 결과 화면으로 이동
- generate 400이면 등록 화면으로 이동하지 않음
- 지원하지 않는 이미지 형식은 generate 호출 전에 차단
- `Stale`/`isFresh=false`는 등록 차단
- `imageToken` 누락은 등록 차단
- 낮은 confidence는 `확인 필요`로 표시하지만, confidence만으로 등록 차단하지 않음
- 냉장고별 available 나눔 식재료 목록을 지도 선택 냉장고 UI에 연결
- FCM 수신 handler와 로컬 알림함 구현
- `requested` 상태를 `신청 접수`로 표시하는 방향으로 제품 문구 정리

---

## 프론트 재검증 예정 범위

백엔드 답변 또는 수정 후 프론트는 아래 순서로 재검증하겠습니다.

1. `POST /posts/generate` happy path
2. `POST /posts` 생성 직후 AI 메타데이터 유지 여부
3. `/posts/nearby` 홈 카드 표시
4. `/fridges/{id}/posts?status=available` 지도 냉장고 내부 목록 표시
5. `/posts/{id}` 상세 표시
6. `POST /posts/{id}/requests` 201/403/409
7. `requested` 전환 후 nearby/fridge available 목록 제외
8. `Stale`/generate 400/무효 `imageToken` 등록 차단 UX
9. screenshot/UI/low-quality fixture의 rejection 또는 review 처리
10. `share_created`/`share_requested` FCM 실제 기기 수신. 2026-05-25 실기기+emulator 2계정 QA로 닫힘

---

## 2026-05-08 백엔드 공식 답변 반영

이 섹션은 위 확인 요청에 대한 백엔드 답변을 프론트 검증 기준으로 재분류한 기록이다. 구현 변경은 하지 않고 문서 계약만 갱신한다.

### P0. Post AI 메타데이터 저장 불일치

- 분류: 백엔드 버그, 수정 완료, VM 배포 완료.
- 원인: `POST /posts/generate`의 AI 분석 결과가 HTTP 응답으로만 전달되고 `imageToken`과 연결되어 서버에 보관되지 않았다.
- 수정 후 흐름:
  - generate: 이미지와 `{imageToken}.json` AI 메타데이터 sidecar를 임시 저장한다.
  - create: `imageToken`으로 이미지 이동과 JSON 복원을 수행하고 Post row에 AI 메타데이터를 저장한다.
- 프론트 계약: `POST /posts` payload는 기존대로 `imageToken + fridgeId + expirationDate`만 보낸다. AI 메타데이터는 재전송하지 않는다.
- 우선순위: 서버 보관 값 > 프론트 전송 값.
- 기존 null 데이터: 마이그레이션 없음. 프론트 fallback(`나눔 식재료 / 분석 중`)은 MVP에서 허용한다.
- 프론트 후속: `generate -> create -> detail -> nearby -> fridge list` 재검증.

### P1. AI rejection 응답 형태

- `Stale` 또는 `isFresh=false`는 계속 generate 400이다.
- 이 경우 `imageToken`은 발급되지 않는다.
- 400 body에서 안정적으로 읽을 필드는 FastAPI `detail`뿐이다.
- `message`, `analysisMessage`는 400 계약 필드가 아니다.
- `not_food`, `low_quality`, `multi_object` enum은 MVP 후속이다.

### P1. confidenceScore 운영 기준

- `confidenceScore`는 Stage 2 freshness 모델의 softmax max 확률이다.
- 백엔드는 confidence 값만으로 등록을 차단하지 않는다.
- 프론트의 `confidenceScore < 0.9 -> 확인 필요`는 제품 표시 정책이며 서버 계약에 영향을 주지 않는다.

### P1. screenshot/UI false-positive

- MVP 서버/AI 파이프라인은 screenshot/UI/화면 촬영 여부를 차단할 수 없다.
- `confidenceScore=0.5377`처럼 낮아도 `Fresh + imageToken`이면 현재 계약상 발급이 맞다.
- 프론트는 낮은 confidence에서 `확인 필요`를 표시하되 등록은 허용한다.
- Post-MVP rejection reason 후보:
  - `stale`
  - `not_food`
  - `low_quality`
  - `screenshot`
  - `ui_screenshot`
  - `review_required`
  - `multi_object_review`

### P1. 냉장고별 목록 응답 필드

- `GET /posts/{id}`는 `PostRead` 전체 필드를 반환한다.
- `GET /posts/nearby`와 `GET /fridges/{id}/posts`는 카드 요약용 `PostNearbyRead`를 반환한다.
- `PostNearbyRead`는 `confidenceScore`, `authorId`, `latitude/longitude`, `updatedAt`을 포함하지 않고 `fridgeName`을 포함한다.
- `status=available`이면 `requested`, `completed`는 제외된다.
- 지도에서 냉장고 선택 후 내부 목록 표시 용도로 계속 사용한다.

### P1. FCM 발송 조건과 payload

- `POST /posts` 성공 시 `share_created`는 BackgroundTasks로 발송된다.
- 조건: 냉장고 반경 2km 내 FCM 토큰이 등록된 다른 사용자, Firebase credentials 설정, 작성자 본인 제외.
- `POST /posts/{id}/requests` 201 성공 시 `share_requested`는 공급자에게 발송된다.
- 조건: 공급자의 `fcmToken`이 `/auth/me/location`으로 등록되어 있어야 한다.
- payload는 문자열 + camelCase:
  - `share_created`: `type`, `postId`, `fruitName`, `fridgeName`
  - `share_requested`: `type`, `postId`, `requestId`, `fruitName`, `fridgeName`
- 별도 테스트 발송 API는 없고, 테스트 계정 2개로 실제 흐름 테스트를 권장한다.

### P1. requested 상태 의미

- `requested`는 신청 접수 상태다. 예약 확정, 수령 완료가 아니다.
- MVP에서는 `reserved`, `completed`, `cancelled`, `expired` 흐름을 노출하지 않는다.
- 신청 후 `/posts/nearby`와 `/fridges/{id}/posts?status=available`에서 제외되는 것이 최종 계약이다.

### 프론트 재검증 범위

1. `POST /posts/generate` happy path
2. `POST /posts` 생성 직후 AI 메타데이터 유지
3. `GET /posts/{id}`에서 `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore` 확인
4. `/posts/nearby` 홈 카드 표시 확인
5. `/fridges/{id}/posts?status=available` 지도 냉장고 내부 목록 확인
6. `POST /posts/{id}/requests` 201/403/409
7. `requested` 전환 후 nearby/fridge available 목록 제외
8. `Stale`/generate 400/무효 `imageToken` 등록 차단
9. screenshot fixture는 MVP에서 Fresh 통과 가능, 낮은 confidence면 `확인 필요`
10. `share_created`/`share_requested` 실제 기기 FCM 수신. 2026-05-25 실기기+emulator 2계정 QA로 닫힘
