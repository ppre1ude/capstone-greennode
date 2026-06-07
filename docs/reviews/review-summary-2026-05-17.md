# GreenNode/FoodLink Review Summary - 2026-05-17

## Summary

엔지니어링, CEO, 디자인 관점의 공통 결론은 같다.

현재 GreenNode/FoodLink는 `generate -> create -> home/detail/map -> request -> requested 제외` 핵심 루프를 실제 API/Android QA로 상당 부분 검증했다. 다만 2026-05-17 당시 “완성된 MVP”라고 말하려면 FCM 실수신, AI false-positive 포지셔닝, 운영자 콘솔 노출, inventory/basket/status-event 계약을 더 닫아야 했다.

> 2026-06-07 상태 갱신: FCM 실수신 QA는 2026-05-25에 닫혔고, 운영자 콘솔 프로필 진입은 operator metadata gate와 테스트로 일반 사용자 노출을 막았다. 현재 남은 항목은 live VM/OpenAPI, AI 정확도/계약, 최신 운영자 계정 검증이다.

가장 안전한 표현은 **“핵심 MVP 플로우가 검증된 프로토타입”**이다.

## Common P0

1. **FCM 실수신 QA (2026-05-25 닫힘)**
   - `share_created`, `share_requested` 실제 foreground/background/terminated 수신은 2026-05-25 실기기+emulator 2계정 QA로 닫혔다.
   - Android `google-services.json`, VM Firebase Admin/service account credentials, 2기기/2계정/2 FCM token 환경을 갖춘 뒤 검증했다.
   - 서버 저장형 알림 읽음 동기화와 `/notifications` OpenAPI 노출은 별도 live VM 재검증 항목이다.

2. **운영자 콘솔 release-safe 처리**
   - 프로필 진입은 operator metadata 기반으로 숨김 처리했고 일반 사용자 노출 회귀 테스트를 추가했다.
   - 최신 VM 실제 operator 권한, inventory API, 상태 변경 저장은 release/demo claim 전에 재검증해야 한다.
   - 단기 조치는 role gate와 권한 거부 fallback으로 반영했고, 최신 운영자 계정 live VM 확인은 active backlog에 남긴다.

## Common P1

1. **Backend inventory/basket/status-event 계약 확정**
   - `inventory`는 수요자-facing available list가 아니라 냉장고 운영자 현장 점검 레이어로 분리하는 방향이 현재 문서와 가장 잘 맞는다.
   - 바구니는 사용자 신청 단위가 아니다. 정식 도메인인지, registration batch metadata인지 결정해야 한다.
   - 상태 변경은 event 기반으로 설계하되, 허용 transition과 reason enum이 먼저 필요하다.

2. **Expiry / 권장 기한 분리**
   - `expirationDate`를 운영자 폐기 기준으로 그대로 재사용하면 사용자-facing 나눔 기한과 현장 점검 기준이 섞인다.
   - `recommendedShareUntilAt`, `discardCandidate`, `expired` 의미를 백엔드가 먼저 닫아야 한다.

3. **Multi-object는 별도 계약 리뷰로 분리**
   - 현재 앱/API는 단일 대표 객체 계약이다.
   - `detections[]`, bbox, 객체별 freshness, 객체별 등록 UX를 운영자 바구니 기능에 섞어 넣으면 범위가 커진다.

## Frontend Work That Can Proceed First

- 운영자 콘솔 메뉴를 숨기거나 실험/읽기 전용 상태로 명확히 표시.
- 완료 화면과 상세 화면 copy 완화: FCM delivery claim, AI 보증 표현, 예약 확정 오해 제거.
- 상세 화면에 “신청 접수는 예약 확정이 아니에요” 보조 문구 추가.
- 홈 `전체보기` 미연결 정리 또는 지도 탭으로 명확히 연결.
- `방금 전` 같은 placeholder를 실제 `createdAt` 기반 상대 시간으로 교체.
- 지도 냉장고 선택 카드와 내부 목록을 하나의 bottom sheet로 통합하는 prototype.

## Backend/API Decisions To Request

아래는 협의 대상 후보이며, 아직 프론트 구현 계약으로 쓰지 않는다.

- `GET /operator/fridges`
- `GET /operator/fridges/{fridgeId}/inventory/summary`
- `GET /operator/fridges/{fridgeId}/inventory/items`
- `GET /operator/baskets/{basketId}`
- `POST /operator/items/{postId}/status-events`

필수 결정 항목:

- operator role과 `fridgeId` 권한 매핑.
- inventory summary/items 응답 shape.
- `basketId` 의미와 생성 시점.
- 상태 enum, reason enum, transition table.
- FCM 운영 로그 taxonomy.
- `expirationDate`와 `recommendedShareUntilAt`의 분리 여부.
- `detections[]` 도입 여부와 최소 필드.

## Recommended Execution Order

1. 최신 live VM에서 서버 저장형 알림 읽음 동기화와 제품 알림 claim을 재검증한다.
2. 최신 운영자 계정으로 운영자 콘솔 gate와 권한 fallback을 재검증한다.
3. 백엔드와 inventory/basket/status-event 계약을 문서로 확정한다.
4. read-only operator API vertical slice를 만든다: summary/items 조회만.
5. 상태 변경 event API와 UI는 별도 slice로 진행한다.
6. multi-object, OCR, 표준 폐기/권장 기한 자동 계산은 후속 계약 리뷰로 분리한다.
