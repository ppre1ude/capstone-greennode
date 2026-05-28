# Backend Post-MVP Contract Blockers - 2026-05-29

> 목적: Post-MVP 제품/계약 결정 중 프론트에서 선반영 가능한 범위와 백엔드 논의/구현 없이는 닫을 수 없는 범위를 분리한다.

## Runtime Evidence

- 환경: `localhost:8080 -> NHN Cloud VM:80` SSH tunnel, 2026-05-29.
- OpenAPI: `/openapi.json` 조회 성공.
- AI fixture: `npm run qa:ai-fixtures -- --report-only` 실행. 최신 report는 `temp/ai-fixtures-report-only-20260528T163234Z.txt`.
- 알림/지표/인증/search: OpenAPI path와 live VM endpoint를 함께 확인.

AI fixture 관찰값:

| Fixture | Current VM result | Contract gap |
| --- | --- | --- |
| `fresh-single` | `Fresh`, `confidence=1`, reason 없음 | 정상 shareable |
| `stale-or-rotten` | `Fresh`, `confidence=0.79`, reason 없음 | `rejectionReason=stale` 또는 명시 review 필요 |
| `not-food` | 400 generic rejection | `error.rejectionReason=not_food` 또는 `reviewReason=not_food` 필요 |
| `screenshot-or-ui` | `Fresh`, `confidence=1`, reason 없음 | `rejectionReason` 또는 `reviewReason=screenshot/ui_screenshot` 필요 |
| `low-quality` | `Fresh`, `confidence=0.9794`, reason 없음 | `rejectionReason` 또는 `reviewReason=low_quality` 필요 |
| `multi-object` | 400 generic rejection | `reviewReason=multi_object_review`와 `detections[]` 필요 |

Endpoint 관찰값:

| Contract | Current VM result | Status |
| --- | --- | --- |
| `GET /api/v1/notifications` | 404, OpenAPI path 없음 | backend blocker |
| `PATCH /api/v1/notifications/{id}/read` | OpenAPI path 없음 | backend blocker |
| `PATCH /api/v1/notifications/read-all` | OpenAPI path 없음 | backend blocker |
| `DELETE /api/v1/notifications/{id}` | OpenAPI path 없음 | backend blocker |
| `GET /api/v1/users/me/impact/summary` | 404, OpenAPI path 없음 | backend/product blocker |
| `GET /api/v1/posts/nearby?q=...` | OpenAPI parameter 없음 | backend blocker |
| `GET /api/v1/fridges/nearby?q=...` | OpenAPI parameter 없음 | backend blocker |
| `POST /api/v1/auth/email-verifications` | OpenAPI path 없음 | backend/auth blocker |

## Frontend Work Completed

- Multi-object 대표 후보 선택 UI를 등록 확인 화면에 추가했다.
- 선택된 후보에 `id`가 있으면 `POST /posts` payload에 `selectedDetectionId`를 포함한다.
- `bbox`는 아직 서버 입력으로 보내지 않는다. normalized bbox는 서버 응답 계약 검증 후 별도 구현한다.
- 알림함은 focus 시 서버 저장형 알림을 가져와 로컬 FCM 기록과 dedupe merge한다.
- 서버 알림 read/read-all/delete는 best-effort로 호출하고, endpoint가 없거나 실패하면 로컬 inbox fallback을 유지한다.
- AI fixture 검증 스크립트는 Post-MVP strict mode에서 generic 400이 아니라 명시 `rejectionReason`/`reviewReason`을 요구하도록 조였다.

## Backend Discussion Required

### 1. AI rejection/review reason

- hard block은 400 응답의 `error.rejectionReason`으로 내려야 한다.
- soft review는 200 generate payload의 `reviewReason`으로 내려야 한다.
- `stale`, `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `multi_object_review`의 실제 모델/rule 매핑이 필요하다.
- 현재 VM은 stale/screenshot/low-quality를 Fresh로 통과시키고, not-food/multi-object는 reason 없는 generic 400이라 계약 검증을 닫을 수 없다.

### 2. Server-backed notifications

- 서버 저장형 알림 endpoint 4개가 아직 live VM/OpenAPI에 없다.
- 프론트는 sync/read/read-all/delete 호출 경로를 준비했지만, live VM 검증은 backend endpoint 구현 뒤 가능하다.
- 서버 record의 id, type, postId, requestId, fruitName, fridgeName, title, body, createdAt/receivedAt, readAt 필드 확정이 필요하다.

### 3. Impact and carbon metrics

- `/users/me/impact/summary` endpoint가 아직 없다.
- `estimatedWeightGrams`, `categoryCarbonFactor`, factor source, `calculationVersion`, 집계 대상 status 정의가 필요하다.
- 프론트 UI 연결은 backend-computed estimate가 준비된 뒤 진행한다.

### 4. Server search

- 별도 global search가 아니라 `/posts/nearby`, `/fridges/nearby`의 optional `q` 확장으로 결정했다.
- 현재 OpenAPI에는 `q` parameter가 없으므로 앱은 기존 로컬 필터 fallback을 유지한다.
- 서버 검색 정렬 기준은 거리 우선, 같은 거리권 최신순으로 확인이 필요하다.

### 5. Email verification, social login, WebSocket chat

- 이메일 verification path가 아직 없다. 이메일 verification은 소셜 로그인보다 먼저 구현한다.
- social login은 Google/Apple 후속 후보이고 이번 프론트 구현 범위에서 제외한다.
- WebSocket chat은 lifecycle/알림 안정화 전까지 제외한다. 필요 시 구조화된 문의/요청 메시지를 먼저 검토한다.
