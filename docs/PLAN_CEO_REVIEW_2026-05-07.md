# FoodLink Plan CEO Review - 2026-05-07

## Verdict

현재 개발 방향은 맞다. 지금은 새 기능을 미리 다듬는 단계가 아니라,
MVP flow가 실제 데이터와 실제 실패 케이스에서 끝까지 성립하는지 반복
점검하는 단계다.

권장 모드: `HOLD_SCOPE` with selective fixes. 범위는 고정하고, MVP 신뢰를
깨는 결함만 선택적으로 고친다.

## System Audit

| Check | Finding |
| --- | --- |
| Branch | `codex/backend-phase1half-frontend-sync`, origin보다 5 commits ahead |
| Working tree | `git diff --stat` 없음, stash 없음 |
| Recent history | QA fixture, AI fallback, permission, FCM, API 계약 검증 중심 |
| Recently touched docs | `VALIDATION_AND_BACKLOG.md`, `IMPLEMENTATION_STATUS.md`, `AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`, `API_INTEGRATION_CONTRACT.md` |
| Source of truth | `VALIDATION_AND_BACKLOG.md`가 검증 결과와 백로그 우선순위의 최상위 기준 |

`VALIDATION_AND_BACKLOG.md`는 이 문서가 "발표 전까지 구현할 목록"이 아니라
"이미 만든 MVP의 현재 상태를 확인하기 위한 검증/정리 문서"라고 정의한다.
최근 작업 이력도 이 선언과 일치한다.

## Step 0 - Scope Call

질문: 추가 기능이나 미구현 기능을 지금 미리 다듬어야 하는가?

답: 아니다. 지금 다듬을 것은 "기능 수"가 아니라 "MVP flow의 신뢰도"다.

이유:

- 사용자가 보는 핵심 약속은 남는 식재료를 등록하고, 근처 사용자가 발견해
  신청할 수 있다는 것이다.
- 현재 남은 리스크는 새 기능 부재보다 "등록 후 식재료명이 fallback으로
  보임", "AI가 명백한 비식품/저품질/스크린샷을 Fresh로 통과시킴",
  "실제 FCM 수신 QA가 닫히지 않음"처럼 신뢰를 직접 깎는 문제다.
- 관리자, 채팅, 예약 확정, 수령 완료, 환경 지표, 소셜 로그인은 지금
  polish해도 MVP의 가장 위험한 구멍을 막지 못한다.

## Critical Gaps

| Priority | Gap | User impact | Required next evidence |
| --- | --- | --- | --- |
| P0 | Post AI metadata storage mismatch | 등록 직전에는 `바나나 / 상태가 좋아 보여요 / 91%`가 보이지만, 등록 후 홈/상세/지도 냉장고 목록에서 `나눔 식재료 / 분석 중` fallback이 보인다. 사용자는 내가 등록한 식재료가 제대로 저장됐는지 의심한다. | Backend fix after `POST /posts`, then re-run create -> nearby -> fridge posts -> detail QA |
| P0 | AI false-positive contract | `stale-or-rotten`, `screenshot-or-ui`, `low-quality` fixture가 live VM API에서 `Fresh`로 통과했다. 프론트는 `imageToken`이 발급되면 최종 차단할 근거가 약하다. | Backend/AI rejection or review contract, then fixture QA with real images |
| P1 | Real FCM receive QA incomplete | "등록 완료 후 근처 사용자에게 알림"과 "신청 후 공급자에게 알림"을 제품 약속으로 말하려면 foreground/background/terminated 수신 evidence가 필요하다. | Real Android device FCM send/receive QA |
| P1 | `requested` copy risk | MVP에서 `requested`는 예약 확정이 아닌 신청 접수다. 문구가 흐리면 사용자는 수령이 확정됐다고 오해할 수 있다. | Detail/notification copy check against product brief |
| P2 | Device-specific permission paths | 위치 권한 거부는 emulator에서 확인됐지만, camera/stale/token/FCM 조합의 실제 기기 QA는 일부 남아 있다. | Focused device QA matrix |

## Scope To Hold

현재 sprint 안에서 새로 polish하지 말 것:

- WebSocket chat
- supplier approve/reject, `reserved`, `completed`, `cancelled`, `expired`
- admin console
- QR code, pickup token, manager verification
- real statistics or CO2 impact API
- social login and full email verification
- ranking/recommendation based on popularity
- full inventory management inside fridges

이 기능들은 제품 비전에 남겨도 된다. 단, MVP가 `available -> requested`까지
믿을 수 있게 통과한 뒤에 다시 검토한다.

## What Already Exists

- Real API registration path: `generate -> imageToken -> createPost`.
- Nearby and fridge-specific available item discovery.
- Request share API mapping with 201/403/409 handling.
- Location-not-set and permission-denied guards.
- Firebase-missing fallback guards for QA/release builds.
- AI confidence display policy: low confidence asks the user to review, but does
  not block by itself.
- Unit tests around policy, API mapping, fallback, permissions, notifications,
  map fridge posts, and detail request CTA.

## Failure Modes Registry

| Codepath or flow | Failure mode | Rescued? | Test or evidence | User sees |
| --- | --- | --- | --- | --- |
| `POST /posts` after valid generate | AI metadata not persisted | Partially | VM/API and real device QA reproduced | Fallback ingredient/status |
| `/posts/generate` | Screenshot/low-quality/stale passes as Fresh | No, if token issued | VM fixture basic check reproduced | False shareable result |
| `requestShare(postId)` | self request or duplicate request | Yes | VM/API QA 403/409 | CTA becomes non-actionable/error copy |
| FCM foreground/background/terminated | Message not received or not routed | Unknown | Not yet real-device verified | Silent missed notification |
| Location permission denied | User cannot save missing coordinates | Yes | Emulator/unit QA | Retry/settings CTA |
| Camera unavailable in test/device | User cannot capture | Partially | Unit fallback QA | Gallery fallback/error alternatives |
| Invalid or expired `imageToken` | Create should fail | Backend yes, UX needs focused QA | VM invalid token API QA | Registration failure |

Any row with "Unknown" or "No" is a scope blocker before claiming the full MVP
demo is reliable.

## Opinionated Recommendations

1. Keep the next sprint focused on the MVP trust path, not feature breadth.
2. Treat Post AI metadata persistence as the highest product bug. It breaks the
   user's mental model immediately after success.
3. Treat AI false-positive handling as a backend/AI contract issue, not a
   front-end copy issue. Frontend warnings help only after the backend can name
   or withhold unsafe results.
4. Make FCM a verification gate only for the notification claim. Do not let FCM
   block the core create/discover/request demo if the demo can explicitly state
   "notification receive QA pending".
5. Keep `requested` honest in copy: "신청 접수" not "예약 확정".

## Next Vertical Slices

| Order | Slice | Type | Done when |
| --- | --- | --- | --- |
| 1 | Persist AI metadata on created Post | P0 fix | Created item keeps detected fruit, freshness label, confidence across home, detail, fridge list |
| 2 | Re-run end-to-end create/discover/request QA | P0 verification | `generate -> create -> nearby/fridge -> detail -> request -> requested excluded` is recorded with evidence |
| 3 | AI false-positive contract | P0/P1 contract | stale, screenshot/UI, low-quality, not-food cases are rejected or marked review-required by server contract |
| 4 | Real FCM receive QA | P1 verification | `share_created` and `share_requested` are observed on device states or explicitly documented as pending |
| 5 | Copy audit for requested state | P1 polish | UI and local notifications say request received, not reservation confirmed |

## Dream State Delta

The 12-month product can include trusted fridge operations, pickup proof,
supplier approval, admin tools, ranking, and impact metrics. The current MVP
should not simulate those. The current wedge wins if one real user can turn a
leftover ingredient into a visible, requestable share item without losing trust
at any step.

## Review Status

| Review | Status | Notes |
| --- | --- | --- |
| CEO review | Issues open | Scope should hold until P0 trust gaps close |
| Eng review | Recommended next | Needed before broad backend/frontend contract fixes |
| Design review | Optional | Useful only for requested-state copy and confidence UI after policy is fixed |
