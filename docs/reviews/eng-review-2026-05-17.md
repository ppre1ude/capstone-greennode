# GreenNode/FoodLink Engineering Review - 2026-05-17

> 2026-06-07 상태 갱신: 이 리뷰의 FCM/운영자 콘솔 P0는 2026-05-17 당시 기준이다. FCM 실수신 QA는 2026-05-25에 닫혔고, 운영자 콘솔 프로필 진입은 operator metadata gate와 일반 사용자 비노출 테스트로 보강했다. 현재 남은 항목은 live VM/OpenAPI 재검증과 최신 운영자 계정 검증이다.

## Current Implementation Facts

- 검토는 읽기 전용으로 수행했다. 기준 커밋은 `0aea561` 이후 상태다.
- 핵심 MVP 흐름은 문서와 구현이 대체로 일치한다: `generate -> create -> home/detail/map -> request -> requested -> available 목록 제외`.
- 냉장고 운영자 콘솔은 실제 운영 기능이 아니라 임시 진입점과 검증 화면이다. 당시에는 프로필 메뉴의 일반 항목이었지만, 현재는 operator metadata gate 뒤에 있고 루트 스택에 등록되어 있다: [ProfileScreen.tsx](../../src/screens/profile/ProfileScreen.tsx), [AppNavigator.tsx](../../src/navigation/AppNavigator.tsx).
- 운영자 콘솔 데이터는 정적 fixture다: [FridgeOperatorConsoleScreen.tsx](../../src/screens/operator/FridgeOperatorConsoleScreen.tsx). 백로그도 operator 권한, 실제 inventory API, 상태 변경 저장, 바구니 정책이 아직 연결되지 않았다고 명시한다: [VALIDATION_AND_BACKLOG.md](../VALIDATION_AND_BACKLOG.md).
- `inventory`는 현재 `GET /fridges/{id}/posts?status=available`와 별개인 냉장고 운영자용 현장 점검 레이어로 정의되어 있다.
- 바구니는 사용자 신청 단위가 아니며, 현재는 내부 개별 나눔 식재료 상태에서 계산하는 prototype helper 수준이다: [fridgeOperatorInventory.ts](../../src/utils/fridgeOperatorInventory.ts).
- `requested`는 예약 확정이 아니라 신청 접수다. 이 기준은 [DOMAIN_MODEL.md](../DOMAIN_MODEL.md)에 정리되어 있고, 앱 상세 CTA도 `available`일 때만 신청 가능하게 동작한다.
- FCM 프론트 코드는 payload 검증, 로컬 알림함 기록, opened/initial 라우팅을 구현했고 실제 실기기 수신 QA도 2026-05-25에 닫혔다.

## Engineering Findings

### P0 - FCM 제품 claim은 2026-05-25 이후 수신 QA 기준으로 닫힘

프론트 handler와 fallback 테스트에 더해 `share_created`/`share_requested` 실제 수신은 2026-05-25 실기기+emulator 2계정, debug/release, background/terminated/process-killed/lockscreen tap routing으로 검증했다. 서버 저장형 알림 읽음 동기화와 `/notifications` OpenAPI 노출은 별도 live VM 재검증 항목이다.

현재 표현은 “프론트 수신 코드와 실제 FCM 수신 QA 완료, 서버 저장형 읽음 동기화 live VM 재검증 대기”가 정확하다.

### P0 - 운영자 콘솔은 role gate 뒤로 이동, 최신 계정 재검증 필요

제품 문서는 냉장고 운영자 화면을 MVP 제외/후순위로 둔다. 프로필 메뉴의 `냉장고 운영자 콘솔`은 현재 operator metadata gate 뒤로 이동했고 일반 사용자 비노출 테스트가 있다. 최신 VM 실제 operator 권한, operator API, 저장 액션은 release/demo claim 전에 재검증해야 한다.

### P1 - Inventory / basket / status-event 경계가 아직 결정 전

문서는 `fridge_operators`, `inventory_baskets` 또는 `registration_batches`, `item_status_events`, `detections` 후보를 열어두고 있다. 변경 후보도 `POST /operator/items/{postId}/status-events` 수준의 초안이다. 지금 프론트가 API를 먼저 고정하면 DB/도메인 결정이 뒤집힐 가능성이 크다.

### P1 - Expiry와 현장 권장 기한이 섞일 위험

현재 사용자-facing API payload는 `expirationDate` 중심이다. 반면 운영자 inventory 초안은 `recommendedShareUntilAt`, `expired`, 폐기/분실/수령 확인 이력을 다룬다. `expirationDate`를 운영자 현장 폐기 기준으로 재사용하면 사용자-facing 나눔 기한과 운영자 점검 기한이 충돌한다.

### P1 - Multi-object는 UX/API 모두 단일 객체 계약에 묶여 있음

현재 타입은 `detectedFruit`/`detectedFruitKo` 단일 문자열 구조다. 문서는 다음 단계가 구현이 아니라 `detections[]` 계약과 UX 정책 검증이라고 정리한다. 바구니 기능과 multi-object를 함께 밀면 촬영 결과, 분리 등록, basket grouping, operator 점검이 한 번에 엮인다.

### P2 - Post status 타입은 후속 상태를 부분적으로만 반영

앱 타입은 MVP 상태에 맞춰 `available | requested | completed` 중심으로 제한되어 있다. 도메인 상태에는 `reserved`, `cancelled`, `expired`도 있으나 후속이다. 운영자 상태 변경을 시작하면 타입, 문구, CTA 방어가 먼저 필요하다.

## Backend Decisions Needed

- Operator auth: 누가 어떤 `fridgeId`를 운영할 수 있는지, `/operator/*` 권한 실패를 401/403 중 무엇으로 줄지.
- Inventory boundary: 수요자 탐색 목록과 operator inventory summary/items를 별도 API로 둘지.
- Basket semantics: `basketId`가 정식 도메인인지, 같은 등록 흐름 추적용 metadata인지.
- Status events: 허용 transition, actor role, reason enum, idempotency, rollback/undo 가능 여부.
- Expiry policy: `expirationDate`, `recommendedShareUntilAt`, `expired`, `discardCandidate`의 의미와 우선순위.
- 서버 알림 동기화: `/notifications` OpenAPI 노출, read/read-all/delete 저장 상태, 운영 로그 기준.
- AI contracts: `not_food`, `low_quality`, `screenshot`, `multi_object_review`, `detections[]` 도입 시점.

협의 대상 API 후보는 아직 확정 계약이 아니다.

- `/operator/fridges`
- `/operator/fridges/{fridgeId}/inventory/summary`
- `/operator/fridges/{fridgeId}/inventory/items`
- `/operator/baskets/{basketId}`
- `/operator/items/{postId}/status-events`

## Frontend-Ready Work

- 운영자 콘솔 메뉴는 role gate 뒤에 유지하고 최신 VM 운영자 계정으로 진입을 재검증.
- 현재 정적 콘솔은 “프로토타입” 라벨과 no-write 화면으로 유지.
- `fridgeOperatorInventory` helper는 API 계약 전까지 순수 함수 테스트 범위로 유지.
- FCM 수신은 닫혔다. 서버 저장형 읽음 동기화는 live VM 확인 전에는 낮춰 표시.
- `PostStatus` 확장 전 상태별 CTA/문구 매핑 테스트 보강.
- `detections[]` 도입 전 기존 단일 객체 UX 유지, multi-object는 report-only fixture로 관찰.

## Test / QA Gaps

- 미검증: 서버 저장형 알림 읽음 동기화와 `/notifications` live VM 노출.
- 미검증: operator 권한, 실제 inventory API, 상태 변경 저장.
- 미검증: 주변 공유 냉장고 없음 fixture. 문서상 여러 좌표에서도 냉장고 3건 반환 가능성이 남아 있다.
- Post-MVP 대기: stale/screenshot/low-quality false-positive strict gate, multi-object `detections[]`.

## Recommended Next Sequence

1. 서버 저장형 알림 읽음 동기화를 latest live VM/OpenAPI에서 재검증한다.
2. 운영자 콘솔 노출을 최신 operator role 계정으로 재검증한다.
3. Backend와 inventory ADR 수준 결정을 먼저 한다: inventory entity, basket semantics, status-event transition table.
4. read-only operator API vertical slice를 만든다: summary/items 조회만, 상태 변경 없음.
5. 상태 변경은 별도 slice로 분리한다: `POST /operator/items/{postId}/status-events`, optimistic UI 없이 서버 결과만 반영.
6. multi-object와 expiry는 operator 기능에 끼워 넣지 말고 별도 계약 리뷰로 분리한다.
