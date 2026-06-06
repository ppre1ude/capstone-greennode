# Backend QR Lifecycle Response 2026-06-03

> 목적: `BACKEND_QR_LIFECYCLE_DIRECT_FLOW_HANDOFF_2026-06-03.md`에 대한 백엔드 회신을 프론트 구현/QA 기준으로 요약한다.

## Fixture

| 항목 | 값 |
| --- | --- |
| `fridgeId` | `1` |
| `fridgeName` | `광주역 앞 공유냉장고` |
| `fridgePublicCode` | `GJ-STATION-001` |
| 운영자 email | `optest@foodlink.com` |
| 운영자 password | `testpassword123` |
| `operatorFridgeIds` | `[1]` |

일반 회원은 QA 스크립트에서 `POST /api/v1/auth/signup`으로 생성한다.

## 확정 사항

- `POST /api/v1/posts`는 `flow` 값과 무관하게 최초 상태를 `pending_store`로 생성한다.
- 일반 앱 client의 `flow: "direct"` 우회 등록은 백엔드에서 무시된다.
- `storeExpiresAt`, `requestExpiresAt`은 `Z` 접미사가 있는 ISO-8601 UTC timestamp로 내려온다.
- `pending_store` 10분 입고 제한 만료는 `cancelled`로 통합한다. 만료 후 `confirm-store`는 410을 반환한다.
- `requested` 만료 처리는 1분 배치와 조회 시 lazy-expire를 병행한다. 보관 기한이 같이 끝났다면 `available` 복원보다 `expired`가 우선한다.
- `share_created` 푸시는 `POST /posts` 직후가 아니라 `confirm-store` 성공으로 `available` 전환이 끝난 직후 발송한다.
- 운영자 role grant/revoke는 모바일 앱 밖의 seed/admin CLI/backoffice 범위다.
- QR lifecycle fixture와 운영자 fixture는 같은 `fridgeId=1` 냉장고로 맞춘다.

## 상태 전환

```text
POST /posts
  -> pending_store
  -> POST /inventory/confirm-store
  -> available
  -> POST /posts/{id}/requests
  -> requested
  -> POST /inventory/confirm-pickup
  -> completed
```

## 프론트 후속 반영

- `scripts/validate-backend-feature-contracts.js`는 `flow: "fridge_qr" -> confirm-store -> request -> confirm-pickup` 경로를 사용한다.
- 하네스는 기본 `FOODLINK_QA_FRIDGE_ID=1`, `FOODLINK_QA_FRIDGE_PUBLIC_CODE=GJ-STATION-001`, 운영자 계정 fixture를 사용한다.
- 작성자 수동 `/complete` 검증은 제품 하네스에서 제거한다.
- 운영자 inventory summary/items/dispose는 같은 fixture 냉장고와 운영자 계정으로 검증한다.
