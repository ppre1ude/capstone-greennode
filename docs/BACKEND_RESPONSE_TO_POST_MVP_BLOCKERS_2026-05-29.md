# Backend Response Review - Post-MVP Contract Blockers - 2026-05-29

> 원문: `C:\Users\cjh51\OneDrive\Documents\카카오톡 받은 파일\BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md`
>
> 목적: 백엔드 회신을 프론트 문서 기준으로 해석하고, 바로 반영할 결정과 live VM 재검증이 필요한 항목을 분리한다.

## 결론

백엔드 회신은 Post-MVP 계약을 전부 구현 가능하다고 본 것이 아니다. 현재 스프린트에서 닫을 수 있거나 live VM으로 확인해야 할 것은 **서버 저장형 알림, 서버 검색, impact summary, AI 응답 shape**이고, **AI 실제 분류 정확도와 multi-object detection, email verification, social login은 Phase 4 이후 항목**으로 보는 것이 맞다.

특히 AI와 multi-object는 프론트 acceptance 기준을 낮추는 문제가 아니라, 현재 백엔드 AI 모델의 기능 경계를 인정해야 하는 문제다. 현재 모델은 ResNet-50 기반 단일 이미지 분류 파이프라인이며, 비식재료/스크린샷/저품질/다중 객체를 실제로 판별하지 못한다.

## 1:1 검토표

| 항목 | 백엔드 회신 | 프론트 해석 | 문서 반영 |
| --- | --- | --- | --- |
| AI rejection/review reason | 응답 구조는 대응 가능, 실제 `not_food`/`screenshot`/`low_quality` 분류는 불가 | shape 계약과 모델 정확도 검증을 분리 | fixture strict 기준을 모델 고도화 전 전체 통과 gate로 쓰지 않음 |
| Multi-object representative | 현재 object detection 모델이 없어 실제 다중 객체 감지 불가 | 대표 후보 UI와 `selectedDetectionId`는 방어 준비 상태로 유지 | 실제 `detections.length >= 2`, normalized `bbox`는 Phase 4 모델 교체 후 acceptance |
| Server-backed notifications | 백엔드 구현 완료로 회신 | live VM/OpenAPI 재배포 확인 전까지는 "reported implemented" | 4 endpoint, 권한 규칙, soft delete를 VM에서 재검증 |
| Impact/carbon metrics | 요약표는 구현 완료, 본문은 미구현/개발 계획으로 상충 | 상태가 불명확하므로 live VM/OpenAPI 확인 필요 | `totalShared`, `totalReceived`, zero summary, `calculationVersion` 확인 항목 추가 |
| Server search | nearby `q` 확장 구현 완료로 회신 | live VM/OpenAPI 확인 후 로컬 필터 fallback 유지 여부 결정 | `posts/nearby`, `fridges/nearby`의 `q`, pagination, 정렬 규칙 확인 |
| Email verification | MVP 제외 권장, `/auth/me.emailVerifiedAt: null`만 선반영 가능 | 전체 인증 flow는 Phase 4 | UI는 인증 전용 flow를 만들지 않음 |
| Social login | MVP 제외 권장 | 버튼은 비활성 또는 숨김, provider token 교환 endpoint 요구는 Phase 4 | 기존 email/password 로그인 유지 |
| WebSocket chat | 제외 합의 | 변경 없음 | 알림 저장소/lifecycle 안정화 후 구조화 메시지부터 검토 |

## 수용하는 변경

- AI 응답은 `rejectionReason`과 `reviewReason`을 분리한다.
- 현재 AI 모델에서는 `stale` 일부와 낮은 confidence 정도만 현실적인 shape 대응 범위로 본다.
- `not_food`, `screenshot`, `ui_screenshot`, `low_quality`의 실제 정확도는 모델 재학습 또는 별도 모델/API 없이는 acceptance gate로 닫지 않는다.
- multi-object UX는 대표 객체 1개 등록 방침을 유지하되, 실제 다중 후보는 object detection 모델 도입 뒤 검증한다.
- 서버 저장형 알림은 source of truth 방향을 유지한다.
- 환경 지표는 backend-computed estimate만 표시하고 UI에는 `추정 절감`으로 표현한다.
- 서버 검색은 신규 global search가 아니라 기존 nearby API 확장으로 유지한다.
- email verification과 social login은 현재 MVP/Post-MVP immediate scope에서 제외하고 Phase 4 auth expansion으로 분리한다.

## 주의할 점

- 백엔드 회신의 Impact 상태는 문서 내부에서 상충한다. 요약표의 "구현 완료"만 믿지 말고 `/openapi.json`과 live response로 확인한다.
- 알림 테이블 추가를 위해 `docker compose down -v`가 필요하다는 회신은 운영 데이터 삭제 위험이 있다. 실제 배포 전에는 volume wipe가 아니라 migration 또는 데이터 보존 절차가 있는지 확인해야 한다.
- notification `id`는 백엔드 예시에서 numeric이고 프론트 초안은 string도 허용했다. 앱 타입은 numeric/string 호환을 유지하고, live response 기준으로 문서를 고정한다.
- impact response는 백엔드 예시에 `totalShared`, `totalReceived`, `completedShares`가 함께 있다. 기존 프론트 문서의 `completedShares` 단독 계약보다 넓으므로, 앱 연결 전 최종 shape를 확인한다.

## 재검증 계획

1. 백엔드 재배포 후 `/openapi.json`에서 notifications, impact, nearby `q` parameter 노출 확인.
2. live VM에서 notifications 4 endpoint의 본인/타인 권한, read-all, soft delete 확인.
3. live VM에서 impact summary 빈 사용자 200 + zero summary와 `calculationVersion`, `computedAt` 확인.
4. live VM에서 `posts/nearby?q=...`, `fridges/nearby?q=...`의 검색 대상과 정렬 확인.
5. AI fixture는 full set을 report-only로 계속 기록하고, 응답 shape가 구현된 뒤 reason 없는 generic 400 제거만 별도 gate로 검증.
