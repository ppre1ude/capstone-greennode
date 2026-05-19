# FoodLink Inventory And QR PRD v0

> 상태: Post-MVP 기획 초안
> 작성일: 2026-05-19
> 관련 문서: [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md),
> [DOMAIN_MODEL.md](./DOMAIN_MODEL.md),
> [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)

## Problem Statement

FoodLink MVP는 AI 분석부터 `available -> requested`까지의 디지털 루프를 검증했다. 하지만 아직 공급자가 실제로 선택한 공유 냉장고에 식재료를 넣었는지, 수요자가 제한 시간 안에 실제로 수령했는지는 증명하지 못한다.

이 공백은 세 가지 제품 리스크를 만든다.

- 앱에는 보이지만 실제 공유 냉장고에는 없는 ghost inventory가 생길 수 있다.
- 수요자가 신청만 하고 가져가지 않으면 다른 사용자가 계속 막힌다.
- 냉장고 운영자가 물리적 식재료를 식별, 만료, 폐기, 감사할 수 있는 기준이 없다.

다음 제품 레이어는 앱 상태 전환과 실제 냉장고 앞 행동을 연결해야 한다. 단, MVP를 무거운 창고 관리 시스템으로 만들지 않아야 한다.

## Solution

Post-MVP 방향으로 inventory와 QR 인증 레이어를 채택한다.

공유 냉장고마다 고정 QR을 붙인다. 사용자가 QR을 스캔하면 앱은 “이 사용자가 이 냉장고 앞에서 특정 행동을 완료하려 한다”는 신호를 서버에 보낸다. QR 자체는 비밀 인증키가 아니다. 서버가 JWT, pending action, fridgeId, action별 제한 시간, 현재 상태를 검증해서 실제 상태 전환을 수행한다.

공급자 흐름은 즉시 public 등록이 아니라 보관 확인 흐름으로 바뀐다.

```text
AI 분석
  -> 등록 대기 생성
  -> 선택한 공유 냉장고 방문
  -> 10분 안에 냉장고 QR 스캔
  -> 라벨 부착
  -> available 노출
```

수요자 흐름은 제한 없는 `requested`가 아니라 30분 임시 선점으로 바뀐다.

```text
나눔 신청
  -> 30분 임시 선점
  -> 다른 사용자 신청 차단
  -> 공유 냉장고 방문
  -> 냉장고 QR 스캔
  -> 수령 완료
```

냉장고 운영자에게는 최소 운영 화면을 제공한다. 범위는 현재 재고 요약, 만료 임박/만료 항목, 분실/확인 필요 항목, 폐기 완료 처리까지로 제한한다.

## Product Decisions

1. QR 인증은 Post-MVP inventory 레이어로 채택한다.
2. 냉장고 운영자는 정식 운영 역할로 채택한다.
3. QR 도입 후 `requested`는 30분 임시 선점 상태로 확장한다.
4. 공급자 보관 인증 제한은 10분, 수요자 수령 인증 제한은 30분으로 확정한다.
5. QR은 사용자 action마다 새로 만들지 않고 공유 냉장고마다 고정으로 붙인다.
6. QR은 냉장고 식별자이며, 실제 인증과 상태 전환은 서버 검증으로 처리한다.
7. 라벨 스티커는 강하게 권장한다. QR은 냉장고 앞 인증이고, 라벨은 냉장고 안에서 식재료를 찾고 운영자가 점검하기 위한 장치다.
8. 에틸렌 분리 구역은 MVP 블로커가 아니지만, 데이터 모델은 `GENERAL` / `ETHYLENE_SEPARATED` 수준의 보관 구역 정책을 지원해야 한다.

## Goals

- 실제 보관 확인 전에는 나눔 식재료를 public 목록에 노출하지 않는다.
- 신청 후 30분이 지나면 임시 선점을 자동 해제한다.
- 짧은 라벨 코드로 물리적 식재료를 찾을 수 있게 한다.
- 냉장고 운영자가 만료/폐기/분실/확인 필요 항목을 점검할 수 있게 한다.
- 사용자 경험은 가볍게 유지한다. 핵심은 스캔, 라벨, 완료다.
- 기존 `Post` / **나눔 식재료** 도메인과 호환되게 설계하되, 후속 백엔드 rename 가능성은 열어둔다.

## Non-Goals

- 창고형 재고 관리 전체.
- 개별 중량 추적.
- 결제, 정산, 상업 주문 관리.
- WebSocket 채팅.
- 전체 시스템 설정을 다루는 광범위한 admin 콘솔.
- 식품 안전 인증 또는 법적 안전 보증.
- OCR 기반 유통기한 자동 인식.
- 모든 부적절 식재료 케이스의 완전 자동 판별.

## User Stories

1. 공급자는 AI 분석 후 나눔 등록을 시작하고 싶다. 그래야 남는 식재료 처리 흐름을 빠르게 시작할 수 있다.
2. 공급자는 앱이 어느 공유 냉장고로 가야 하는지 알려주길 원한다. 그래야 잘못된 냉장고에 넣지 않는다.
3. 공급자는 냉장고 앞에서 QR을 스캔하고 싶다. 그래야 실제 보관 위치가 확인된다.
4. 공급자는 QR 인증 후 짧은 라벨 코드를 받고 싶다. 그래야 실제 식재료에 식별표를 붙일 수 있다.
5. 공급자는 10분 제한 시간을 명확히 보고 싶다. 그래야 언제 등록 대기가 취소되는지 알 수 있다.
6. 공급자는 보관 인증을 끝내지 못한 등록이 자동 취소되길 원한다. 그래야 넣지 않은 식재료가 앱에 노출되지 않는다.
7. 수요자는 나눔 신청 후 30분 동안 해당 식재료가 잠시 잡혀 있길 원한다. 그래야 냉장고로 이동하는 동안 다른 사용자가 가져가지 않는다.
8. 수요자는 남은 선점 시간을 보고 싶다. 그래야 언제까지 수령해야 하는지 알 수 있다.
9. 수요자는 냉장고 앞에서 QR을 스캔하고 싶다. 그래야 올바른 냉장고에서 수령했음을 확인할 수 있다.
10. 수요자는 30분 안에 수령하지 못하면 자동으로 선점이 풀리길 원한다. 그래야 다른 사용자가 막히지 않는다.
11. 수요자는 라벨 코드와 보관 구역을 보고 싶다. 그래야 공급자와 채팅하지 않고도 식재료를 찾을 수 있다.
12. 수요자는 물리 라벨에 개인정보가 들어가지 않길 원한다. 그래야 비대면 나눔이 부담스럽지 않다.
13. 냉장고 운영자는 현재 보관 중인 식재료를 한눈에 보고 싶다. 그래야 빠르게 점검할 수 있다.
14. 냉장고 운영자는 만료 임박/만료 항목을 따로 보고 싶다. 그래야 우선 처리할 항목이 드러난다.
15. 냉장고 운영자는 만료 항목을 폐기 완료 처리하고 싶다. 그래야 앱이 더 이상 해당 항목을 available로 취급하지 않는다.
16. 냉장고 운영자는 라벨 코드와 보관 구역을 보고 싶다. 그래야 앱 기록과 실제 식재료를 매칭할 수 있다.
17. 냉장고 운영자는 에틸렌 분리 대상 항목을 확인하고 싶다. 그래야 물리 냉장고가 지원할 때 품질 보존에 맞게 분리할 수 있다.
18. 시스템은 등록 대기를 10분 뒤 만료시키고 싶다. 그래야 미완료 등록이 쌓이지 않는다.
19. 시스템은 임시 선점을 30분 뒤 해제하고 싶다. 그래야 수령되지 않은 식재료가 다시 available로 돌아갈 수 있다.
20. 시스템은 QR 스캔이 선택한 냉장고와 일치하는지 검증해야 한다. 그래야 아무 냉장고 QR로 완료 처리할 수 없다.
21. 시스템은 상태 변경을 이벤트로 기록해야 한다. 그래야 분쟁과 운영자 처리를 추적할 수 있다.
22. 기획자는 품목별 보관 정책을 쓰고 싶다. 그래야 보수적 운영 기준을 만들 수 있다.
23. 개발자는 QR 스캔을 재사용 가능한 모듈로 만들고 싶다. 그래야 보관 인증과 수령 인증이 같은 파서/권한/에러 처리를 공유한다.
24. 개발자는 inventory API를 nearby feed API와 분리하고 싶다. 그래야 운영자 워크플로우가 사용자 발견 계약을 오염시키지 않는다.

## Domain Model

| 용어 | 의미 |
| --- | --- |
| **냉장고 QR** | 공유 냉장고에 고정으로 붙은 QR. 냉장고 식별에 사용한다. |
| **QR 인증** | 사용자가 냉장고 QR을 스캔하고 서버가 진행 중인 보관/수령 action과 대조해 검증하는 행위. |
| **등록 대기** | 공급자가 등록을 시작했지만 아직 QR 인증으로 실제 보관을 확인하지 않은 상태. |
| **임시 선점** | 수요자의 나눔 신청이 30분 동안 다른 사용자 신청을 막는 상태. |
| **라벨 코드** | `#0012`처럼 짧은 식별 코드. 공급자가 스티커에 적고 수요자/운영자가 식재료를 찾을 때 사용한다. |
| **보관 구역** | 공유 냉장고 안에서 식재료를 놓는 물리 구역. 초기값은 `GENERAL`, `ETHYLENE_SEPARATED`. |
| **냉장고 재고** | 냉장고 운영자가 점검하는 물리 재고 상태. 사용자-facing nearby feed와 다르다. |
| **보관 배치** | 한 번의 QR 보관 확인으로 생긴 물리적 보관 묶음. 기술명은 `basket`, `inventory_batch`, `registration_batch`가 후보. |

피해야 할 사용자-facing 표현:

- `재고 상품`
- `게시글`
- `예약 확정`
- `식품 안전 보증`
- `부패 확정`

## State Model

### 공급자 보관 흐름

```text
generated
  -> pending_store
  -> stored / available
  -> expired
  -> disposed
```

규칙:

- QR 흐름이 켜진 경우 `POST /posts` 또는 vNext 대체 endpoint는 public `available`이 아니라 `pending_store`를 만든다.
- `pending_store`는 홈, 지도, 냉장고 available 목록에 노출하지 않는다.
- 공급자는 선택한 공유 냉장고 QR을 10분 안에 스캔해야 한다.
- 보관 인증이 성공하면 `available`로 전환하고 라벨 코드를 만든다.
- 10분이 지나면 `pending_store`는 `cancelled` 또는 이에 해당하는 비노출 종료 상태가 된다.

### 수요자 수령 흐름

```text
available
  -> requested
  -> picked_up / completed
```

규칙:

- QR 도입 후 `requested`는 30분 임시 선점이다.
- 임시 선점 중에는 다른 사용자가 신청할 수 없다.
- 수령 인증이 성공하면 picked up / completed로 전환한다.
- 30분이 지나면 available로 복원한다. 단, 그 사이 보관 기한이 끝났다면 expired가 우선한다.
- 기존 상태명을 재사용해야 하면 최종 상태는 `completed`로 두고, 운영 이벤트 이름을 `picked_up`으로 둘 수 있다.

### 운영자 흐름

```text
available or requested
  -> expired
  -> disposed
```

규칙:

- 만료 항목은 사용자-facing discovery에서 숨긴다.
- 운영자는 만료/만료 임박 항목을 별도 화면에서 본다.
- 폐기 완료는 누가 언제 처리했는지 기록한다.
- 분실/확인 필요 항목은 조용히 삭제하지 않고 상태 이벤트로 남긴다.

## QR Verification

백엔드 확정 QR payload:

```json
{"fridgePublicCode":"GJ-STATION-001"}
```

단순 문자열 public code도 허용한다.

```text
GJ-STATION-001
```

프론트 parser는 기존 딥링크/HTTPS 형식도 계속 허용한다.

```text
foodlink://fridges/{publicCode}/verify
```

```text
https://foodlink.app/q/fridges/{publicCode}
```

서버 검증 조건:

- 사용자가 로그인되어 있다.
- QR `publicCode`가 활성 공유 냉장고로 해석된다.
- 사용자에게 진행 중인 pending action이 있다.
- pending action이 action별 제한 시간 안에 있다. `pending_store`는 10분, `requested`는 30분이다.
- pending action의 `fridgeId`와 QR의 fridge가 일치한다.
- 이미 완료, 만료, 취소된 action이 아니다.
- 후속 권장: 기기 위치가 해당 냉장고와 충분히 가깝다.

보안 기준:

- QR은 식별자이지 비밀번호가 아니다.
- QR이 유출되어도 다른 사람의 action을 완료할 수 없어야 한다.
- 인증은 서버가 로그인 사용자와 pending action 상태로 판단한다.
- 백엔드 MVP에서는 `SharedFridge.publicCode`를 고정 코드로 사용하고 별도 회전은 두지 않는다.

## Label Policy

최소 라벨:

```text
#0012
사과
일반 구역
만료: 05-19 18:00
```

규칙:

- 공급자 닉네임, 전화번호, 이메일, user id를 물리 라벨에 넣지 않는다.
- 라벨 코드는 손으로 쓰기 쉬울 만큼 짧아야 한다.
- 앱은 보관 QR 인증 직후 라벨 안내를 보여준다.
- 운영자 화면은 같은 라벨 코드로 앱 기록과 물리 식재료를 매칭한다.
- 라벨 스티커를 운영할 수 없다면 QR/inventory flow는 온전히 준비됐다고 보기 어렵다.

## Storage Zone Policy

초기 보관 구역:

| Zone | 용도 |
| --- | --- |
| `GENERAL` | 대부분의 식재료 기본 구역 |
| `ETHYLENE_SEPARATED` | 에틸렌 영향 관리가 필요한 식재료 구역 |

정책:

- 실제 냉장고가 처음에는 일반 구역만 갖더라도 데이터 모델은 에틸렌 분리 구역을 표현할 수 있어야 한다.
- 첫 UI에서는 강제 절차가 아니라 안내/라벨/운영자 badge 수준으로 시작한다.
- 운영자 화면은 에틸렌 분리 대상 항목을 그룹 또는 badge로 보여준다.
- 품목별 zone 판단은 조건문이 아니라 정책 테이블로 관리한다.

Notion 캡처 기반 seed 예시:

| 품목 | 보수적 보관 정책 힌트 | 초기 구역 힌트 |
| --- | --- | --- |
| 사과 | 공식 보관 정책을 검증한 뒤 보수적인 서비스 노출/회수 기준 적용 | `ETHYLENE_SEPARATED` 후보 |
| 토마토 | 품질/상태별 보관 기간 차이를 고려해 보수적으로 적용 | 우선 `GENERAL`, 정책 검토 |
| 바나나 | 최상 품질 바나나는 냉장 보관 대상으로 보지 않고, 검은 반점이 있는 경우 짧은 기준 적용 | 우선 `GENERAL`, 정책 검토 |

앱은 이 기한을 식품 안전 보증처럼 말하면 안 된다. 이는 서비스 노출과 운영자 회수 기준이다.

## API Contract

아래는 2026-05-19 백엔드 회신 기준 확정 계약이다.

### Store

```text
POST /api/v1/posts
```

QR 도입 후 동작:

- `pending_store`를 생성한다.
- `postId`, `fridgeId`, `storeExpiresAt`, QR 안내를 반환한다.
- nearby/fridge available 목록에는 노출하지 않는다.
- 기존 MVP 흐름은 `flow` 미전송 또는 `"direct"`로 유지한다.
- QR 흐름은 `flow: "fridge_qr"`를 전송한다.

### Confirm Store

```text
POST /api/v1/inventory/confirm-store
```

요청:

```json
{
  "postId": 123,
  "fridgePublicCode": "FRIDGE_PUBLIC_CODE"
}
```

효과:

- 냉장고 QR과 등록 대기 제한 시간을 검증한다.
- `pending_store -> available`로 전환한다.
- 라벨 코드와 보관/회수 기준 시각을 생성한다.
- available이 된 뒤 `share_created`를 발송한다.

### Request Hold

```text
POST /api/v1/posts/{id}/requests
```

QR 도입 후 동작 후보:

- `available -> requested`로 전환한다.
- `requestExpiresAt = now + 30 minutes`를 설정한다.
- 다른 사용자에게 숨긴다.
- 공급자 FCM이 준비되어 있으면 `share_requested`를 발송한다.

### Confirm Pickup

```text
POST /api/v1/inventory/confirm-pickup
```

요청:

```json
{
  "postId": 123,
  "fridgePublicCode": "FRIDGE_PUBLIC_CODE"
}
```

효과:

- 냉장고 QR과 임시 선점 제한 시간을 검증한다.
- `requested -> completed`로 전환하거나 `picked_up` 이벤트를 기록한다.
- `pickedUpAt`을 기록한다.

### Operator Summary

```text
GET /api/v1/operator/fridges/{fridgeId}/inventory/summary
GET /api/v1/operator/fridges/{fridgeId}/inventory/items
PATCH /api/v1/operator/items/{postId}/dispose
```

MVP 운영자 처리:

- summary/items는 냉장고 운영자 콘솔의 요약 카드와 점검 목록을 채운다.
- `dispose`는 만료/폐기 대상 항목을 `disposed`로 직접 전환한다.
- 백엔드 미배포 또는 권한 불일치 시 프론트는 실패 메시지를 표시하고 샘플 fallback을 유지한다.

Post-MVP 운영자 상태 이벤트 후보:

- `disposed`
- `missing`
- `needs_review`
- `restored`
- `manual_adjustment`

## Data Candidates

| Data | Purpose |
| --- | --- |
| `SharedFridge.publicCode` | 공유 냉장고별 고정 QR public code |
| `fridge_operators` | 운영자와 관리 가능한 공유 냉장고 연결 |
| `inventory_batches` or `registration_batches` | 한 번의 보관 인증에서 생긴 물리 묶음 |
| `labelCode` | 물리 라벨과 운영자 조회용 짧은 코드 |
| `storageZone` | `GENERAL` 또는 `ETHYLENE_SEPARATED` |
| `storeExpiresAt` | 공급자 보관 QR 인증 10분 제한 |
| `requestExpiresAt` | 수요자 수령 QR 인증 30분 제한 |
| `storageDeadlineAt` | 서비스 노출/운영자 회수 기준 |
| `item_status_events` | 상태 변경과 운영자 처리 이력 |
| `storage_policy_rules` | 품목/상태별 기한과 보관 구역 정책 |

## Frontend Modules

QR은 특정 화면에 묻지 않고 재사용 가능한 feature module로 분리한다.

후보 구조:

```text
src/features/qr/
  components/QrScannerScreen.tsx
  components/QrPermissionGate.tsx
  utils/parseFoodLinkQr.ts
  api/qrVerificationApi.ts
  types.ts

src/features/inventory/
  screens/PendingStoreScreen.tsx
  screens/PickupHoldScreen.tsx
  screens/OperatorInventoryScreen.tsx
  api/inventoryApi.ts
  utils/inventoryStatus.ts
  utils/storagePolicy.ts
```

테스트 가능한 deep module 후보:

- QR parser: QR payload를 typed fridge verification target으로 변환한다.
- Inventory status policy: CTA, timeout 상태, 다음 행동을 계산한다.
- Storage policy: 품목/상태를 보관 기한과 보관 구역으로 매핑한다.
- Label presenter: 라벨 코드, 식재료명, 보관 구역, 만료 시각을 포맷한다.

## UX Requirements

### Supplier

등록 진행 상태:

```text
AI 분석 완료 -> 냉장고 선택 -> QR 인증 -> 등록 완료
```

- 등록 대기 생성 후 10분 countdown을 보여준다.
- 재시도와 취소 action을 제공한다.
- QR 인증 후 라벨 부착 안내를 보여준다.
- QR 인증 전에는 홈/지도/냉장고 available 목록에 노출하지 않는다.

### Recipient

- 나눔 신청 후 30분 pickup countdown을 보여준다.
- 냉장고명, 위치, 라벨 코드, 보관 구역, QR 스캔 CTA를 보여준다.
- 시간이 만료되면 임시 선점이 풀렸음을 알리고 discovery로 복귀시킨다.
- 팀이 별도로 예약 모델을 채택하기 전까지 `예약 확정` 문구를 쓰지 않는다.

### Operator

- 냉장고 단위 요약을 보여준다.
  - 총 보관 항목
  - 에틸렌 분리 구역 항목
  - 만료 임박
  - 만료/폐기 대상
- 항목 카드는 라벨 코드, 식재료명, 상태, 보관 구역, 기준 시각, action button을 포함한다.
- 첫 운영자 화면은 점검과 폐기에 집중한다. 통계/정산/광범위한 관리 기능은 후순위다.

## Testing Decisions

테스트는 내부 구현이 아니라 외부 행동과 상태 전이를 검증해야 한다.

필수 테스트 영역:

- QR parser가 FoodLink deep link와 HTTPS fallback URL을 허용한다.
- QR parser가 무관한 QR payload를 거절한다.
- 보관 인증은 냉장고가 다르면 실패한다.
- 보관 인증은 10분이 지나면 실패한다.
- 보관 인증 성공 후 항목이 hidden에서 available로 바뀐다.
- 나눔 신청은 `requestExpiresAt`을 설정하고 available 목록에서 숨긴다.
- 수령 인증은 냉장고가 다르면 실패한다.
- 수령 인증은 30분이 지나면 실패한다.
- 임시 선점 timeout은 항목을 available로 복원한다. 단, 보관 기한 만료가 있으면 expired가 우선한다.
- 운영자 폐기 처리는 사용자-facing discovery에서 항목을 숨긴다.
- Storage policy는 품목별 보관 구역과 기준 시각을 계산한다.
- Label presenter는 개인정보를 출력하지 않는다.

현재 앱의 prior art:

- API mapping과 status handling: `__tests__/posts.api.test.ts`.
- 상세 신청 CTA: `__tests__/postDetail.requestShare.test.tsx`.
- 지도 냉장고 내부 목록 refresh: `__tests__/map.fridgePosts.test.tsx`.
- 알림 payload: `__tests__/notificationService.test.ts`.

## Rollout Plan

1. 실제 FCM 기기 QA가 닫힐 때까지 현재 MVP `available -> requested` 구현은 유지한다.
2. Inventory/QR 도메인 모델과 백엔드 schema를 feature flag 또는 vNext API path 뒤에 추가한다.
3. QR parser와 scanner module을 먼저 만들고 로컬 테스트를 붙인다.
4. 공급자 `pending_store` 흐름을 구현한다. 프론트는 `flow: "fridge_qr"` 등록과 confirm-store 호출을 선행 구현했다.
5. 수요자 30분 임시 선점과 confirm-pickup 흐름을 구현한다. 프론트는 `requestExpiresAt` countdown과 confirm-pickup 호출을 선행 구현했다.
6. timeout job 또는 lazy-expire 로직을 구현한다.
7. 최소 냉장고 운영자 inventory 화면을 구현한다. 프론트는 summary/items 조회와 dispose 호출을 선행 구현했다.
8. API 계약 QA, Android emulator QA, 실제 기기 QR/FCM QA 순서로 검증한다.

## Open Questions

1. `POST /posts`가 바로 `pending_store`를 만들도록 바꿀 것인가, 아니면 현재 MVP 계약 보호를 위해 새 inventory endpoint를 둘 것인가?
2. 수령 완료 최종 상태명을 `completed`, `picked_up`, 또는 `completed + picked_up event` 중 무엇으로 둘 것인가?
3. 첫 출시에서 GPS 근접 검증까지 요구할 것인가, 아니면 QR-only 인증으로 시작할 것인가?
4. 공식 보관 정책과 별개로 FoodLink 서비스 노출 기한의 최대 cap을 둘 것인가?
5. 냉장고 QR public code는 누가 회전할 수 있는가?
6. 첫 물리 파일럿에 라벨 스티커가 준비되는가?
7. 첫 물리 파일럿에 에틸렌 분리 구역이 실제로 있는가, 아니면 모델만 먼저 둘 것인가?

## Acceptance Criteria

- 공급자가 만든 항목은 냉장고 QR 인증 전까지 public 목록에 보이지 않는다.
- 공급자는 정확히 10분 안에 보관 QR 인증을 완료해야 한다.
- 수요자 신청은 30분 임시 선점을 만들고 다른 신청을 막는다.
- 수요자 임시 선점은 30분 안에 수령 인증이 없으면 자동 해제된다.
- QR 인증은 잘못된 냉장고에서 완료될 수 없다.
- 라벨 코드는 공급자, 수요자, 운영자 모두에게 일관되게 보인다.
- 운영자는 만료/폐기 대상 항목을 식별할 수 있다.
- 에틸렌 분리 구역은 복잡한 냉장고 레이아웃 없이도 표현 가능하다.
- 기존 MVP 문서는 현재 구현과 Post-MVP PRD를 명확히 구분한다.
