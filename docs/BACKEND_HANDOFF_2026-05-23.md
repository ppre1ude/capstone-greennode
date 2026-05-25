# Backend Handoff Sync - 2026-05-23

> Frontend request date: 2026-05-21  
> Backend response date: 2026-05-23  
> Frontend document sync date: 2026-05-23

이 문서는 2026-05-23 백엔드 회신을 기존 프론트 문서와 대조한 결과다. 구현 완료 상태가 아니라 **백엔드 구현 예정 및 배포 후 프론트 QA 가능** 상태를 기준으로 정리한다.

## Comparison Summary

| Topic | Previous frontend docs | 2026-05-23 backend response | Frontend document action |
| --- | --- | --- | --- |
| FCM final QA | Android `priority: high`, per-token failure log를 백엔드 handoff P0로 요청 중 | Android `priority: high`, iOS `apns-priority: 10`, per-token result log, `[FCM:share_created]`/`[FCM:share_requested]` prefix 추가 예정 | "요청 중"을 "백엔드 구현 예정, VM 재배포 후 QA"로 변경 |
| FCM logs | 실제 발송/mock/대상 없음/per-token 실패 구분 필요 | 8가지 로그 상태와 `docker compose logs api \| grep FCM` 확인 기준 제시 | QA checklist에 로그 패턴 추가 |
| Operator summary | 프론트 선행 구현 또는 후보 계약 | `GET /api/v1/operator/fridges/{fridgeId}/inventory/summary` 신규 추가, 응답 shape 확정 | API 계약 문서와 PRD에 `total/available/requested/expired/disposedToday` shape 반영 |
| Operator items | 선행 구현. 일부 문서는 후보 표현 유지 | `GET /api/v1/operator/fridges/{fridgeId}/inventory/items`, 기존 `PostRead[]` camelCase 사용 | items는 `PostRead[]` 기반으로 정리 |
| Dispose | `PATCH /api/v1/operator/items/{postId}/dispose` 선행 구현 | 경로 유지. 성공 시 `PostRead` 전체 필드와 `status: disposed`. disposed 항목은 summary/items/home/map에서 제외 | 409 불가 상태와 dispose 후 일관성 기준 추가 |
| Multi-object | `detections[]` 도입 대비 방어 구현, 계약 미확정 | MVP에서는 단일 객체 배열 래핑. `bbox: null`, `rejectionReason: null`, 대표 1개만 등록 | `detections[]` 확정 계약으로 변경하되 다중 객체 UX는 Post-MVP 유지 |
| Rejection reason | Post-MVP enum 후보 | MVP는 `null`; `stale/not_food/low_quality/screenshot/multi_object_review`는 Post-MVP | enum 후보 유지, MVP에서는 `null` 명시 |
| Server search | 로컬 검색 유지, 서버 검색 없음 | MVP 미포함. Post-MVP optional `q` 파라미터 후보 | 기존 로컬 필터 유지, Post-MVP 결정 근거 추가 |

## Frontend Implementation Impact

### Now

- 문서와 타입/API 테스트를 백엔드의 확정 계약에 맞춘다.
- Operator summary 응답은 기존 프론트 내부 필드명(`totalItems`, `availableItems` 등)과 백엔드 필드명(`total`, `available` 등)이 다르므로 API adapter 또는 type normalization이 필요하다.
- Operator items/dispose는 `PostRead` 기반 응답을 받는 것으로 정리한다.
- Generate result는 root-level `rejectionReason`과 `detections[]`를 canonical field로 취급한다. `aiAnalysis` 내부의 legacy/defensive fields는 호환으로 유지한다.

### After Backend Deploy

- FCM physical 2-device/2-account QA를 다시 수행한다.
- `docker compose logs api | grep FCM` 결과와 프론트 수신/notification tap 증거를 대조한다.
- Operator 권한 계정, 비운영자 계정, 빈 냉장고, `available/expired/requested` 항목이 있는 냉장고로 runtime QA를 수행한다.

## Backend-Blocked Items

- FCM priority/per-token logging은 백엔드 VM 재배포 후에만 최종 QA 가능하다.
- Operator summary/items/dispose의 실제 런타임 QA는 백엔드 구현/배포 및 테스트 데이터 생성 후 가능하다.
- Multi-object의 실제 `detections.length > 1`, `bbox`, non-null `rejectionReason`은 Post-MVP 모델 도입 후 검증한다.

