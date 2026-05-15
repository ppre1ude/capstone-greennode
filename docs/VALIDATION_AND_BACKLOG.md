# FoodLink Validation And Backlog

> 목적: 중간 발표 전에 급하게 구현한 MVP 기능을 실제로 검증하고, 그 결과를 바탕으로 다음 스프린트 백로그를 정리한다.
>
> 이 문서는 "발표 전까지 구현할 목록"이 아니라, 이미 만든 MVP의 현재 상태를 확인하기 위한 검증/정리 문서다.

## Agent Workflow

- Authority: verified MVP behavior, QA evidence, bug classification, backlog
  candidates, acceptance criteria, and follow-up work.
- Read before: fixing bugs, validating user flows, changing backlog priority,
  claiming a feature is done, or planning a sprint slice.
- Update when: a validation result changes, a bug is fixed, a backlog item is
  reprioritized, or a new risk is discovered.
- Required evidence: environment, reproduction steps, actual result, expected
  result, related code/API, and next action.
- Related workflows: `qa`, `diagnose`, `triage-issue`, `tdd`, `to-issues`.
- Source-of-truth conflicts: verified runtime/API behavior recorded here wins
  over summary claims in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).
  Domain naming still defers to [DOMAIN_MODEL.md](./DOMAIN_MODEL.md).

## Evidence And Backlog Gates

- Evidence entry: every new validation result should identify date, environment,
  flow, actual result, evidence, and follow-up.
- Backlog entry: every next-sprint item should include classification, priority,
  background, current behavior, expected behavior, acceptance criteria,
  verification method, and related files/API.
- Completion claim: a checked item must point to either automated tests,
  API/server evidence, emulator QA, real-device QA, or an explicitly documented
  reason verification was skipped.

## 진행 원칙

- 기능을 새로 늘리기 전에 현재 MVP 흐름이 실제 데이터와 실패 케이스에서 어떻게 동작하는지 확인한다.
- 각 항목은 `정상 동작`, `버그`, `미구현`, `정책 결정 필요`, `발표/문서화 필요` 중 하나로 분류한다.
- Codex에게 작업을 맡길 때는 한 번에 큰 기능 전체를 맡기기보다, 아래의 작업 묶음 단위로 검증하게 한다.
- 검증 결과는 재현 절차, 실제 결과, 기대 결과, 관련 로그/파일, 다음 액션까지 남긴다.

## 2026-05-06 Office-hours 제품 흐름 결정

이 섹션은 FoodLink 세부 기획 office-hours 결과를 기준으로 한다. 과거 검증 로그의 `게시글`, `post`, `product` 표현은 도메인상 **나눔 식재료**를 뜻하는 기술/이전 명칭으로 해석한다.

### 핵심 가치와 사용자

- 핵심 가치는 남는 식재료 처리의 귀찮음과 죄책감을 줄이는 것이다.
- 환경 지표(CO2 절감량, 월간 기여량 등)는 핵심 가치가 아니라 사용자가 잘한 일을 확인하는 보조 성취 레이어다.
- 초기 페르소나는 전남대 등 대학가, 원룸촌, 고시원 주변의 1인 가구 구성원이다.
- 현재 대안 행동은 남는 식재료를 버리거나, 한 번에 요리한 뒤 소분해 보관하는 것이다.

### 공급자/수요자 MVP 흐름

공급자 흐름:

```text
남는 식재료 촬영/선택
  -> AI 분석
  -> 나눔 가능 기준 통과
  -> 나눔 식재료 등록 정보 확인/수정
  -> 등록 가능 공유 냉장고 선택
  -> 등록 완료
  -> 근처 사용자에게 푸시 알림
```

수요자 흐름:

```text
홈에서 근처 available 나눔 식재료 발견
  -> 상세 화면 진입
  -> 보관 공유 냉장고 확인
  -> 나눔 신청하기
  -> status: available -> requested
  -> 공급자에게 신청 알림
```

- MVP는 `available -> requested`까지 검증한다.
- `requested`는 신청 접수이며 예약 확정이 아니다.
- MVP에서 `requested` 이후 공급자 승인/거절 액션은 없다.
- 첫 신청 이후 추가 신청은 막는다. 백엔드는 첫 신청 성공 시 `available -> requested`를 원자적으로 처리하고, 작성자 본인 신청은 403, 이미 `requested`인 나눔 식재료의 추가 신청은 409로 거절한다.
- 냉장고 운영자 화면은 제품 범위에는 포함하지만, 공유 냉장고/지도/신청 흐름이 안정화된 뒤 후순위로 제작한다. MVP 운영 제어는 수동 운영으로 시작한다.

### 홈과 지도 역할

- 홈은 사용자가 **나눔 식재료를 먼저 찾는 화면**이다.
- 홈의 1차 섹션은 가까운 available 나눔 식재료다. 거리 우선, 동일 권역에서는 최신순을 기본으로 한다.
- "만료 임박" 표현은 쓰지 않는다. 대신 `오늘 가져가기 좋은 재료`, `오늘 추천`, `권장 수령일: 오늘`처럼 긍정적이고 행동 가능한 표현을 쓴다.
- "많이 찾는 식재료"는 실제 조회/신청/관심 데이터가 쌓인 뒤 도입할 후순위 추천 기능이다.
- 지도는 주변 공유 냉장고와 각 냉장고 안의 available 나눔 식재료를 탐색하는 화면이다.

### AI 판정과 사용자 문구

- 백엔드 AI label은 `Fresh`, `Mid`, `Stale`이다. 기존 프론트 문서의 `Normal`은 `Mid`와 같은 나눔 가능 그룹으로 번역한다.
- `Fresh`와 `Mid`는 사용자 흐름에서 모두 `상태가 좋아 보여요`와 `나눔 가능`으로 통합 표시한다.
- `Stale`은 나눔 기준 미충족으로 분류하고 등록하지 않는다. `Bad`, `Rotten`은 현재 백엔드 label은 아니지만 방어적 호환 label로 내려오면 같은 차단 그룹으로 처리한다.
- `not_food`, `non_food`, `low_quality`, `screenshot`, `ui_screenshot` rejection reason enum은 Post-MVP 백엔드 항목이다. 앱은 enum이 내려오면 등록하지 않도록 방어적으로 처리하되, 현재 MVP 서버 계약은 generate 400의 `detail`과 성공 응답의 `isFresh`, `freshnessLabel`, `analysisMessage`를 우선한다.
- `confidenceScore`는 Stage 2 신선도 분류 모델의 softmax max 확률이다. 차단 정책이 아니라 보조 표시/검토 신호다.
- 사용자-facing 부정 문구는 `부패`, `상함`, `썩음`, `나쁨`, `AI 실패`가 아니라 `나눔 기준에 맞지 않아요`, `식재료 사진으로 확인되지 않았어요`, `사진으로 상태를 확인하기 어려워요` 계열을 쓴다.

### 후속 결정 필요

- `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `review_required`, `multi_object_review` 등 rejection reason enum은 Post-MVP에서 백엔드와 확정한다.
- 백엔드 Phase 1.5의 Post 구조 변경(`title/description/category` 제거, `detectedFruitKo/freshnessLabel/confidenceScore` 추가)은 프론트 코드 반영과 VM/API 런타임 QA를 진행했다. 2026-05-06에는 실제 VM `POST /posts`/`GET /posts/{id}` 응답에서 AI 메타데이터가 `null`로 저장되는 계약 불일치를 발견했고, 2026-05-08 백엔드가 버그로 인정해 sidecar 저장/복원 방식으로 수정 및 VM 재배포했다. 2026-05-08 VM/API 재검증과 실제 Android MVP flow 재검증은 통과했고, 실제 FCM 수신 QA만 환경 blocker로 남아 있다.
- 프론트는 백엔드가 구현한 `POST /posts/{id}/requests`와 `GET /fridges/{id}/posts?status=available`를 연동했다. 둘 다 2026-05-06 VM/API 런타임 QA에서 상태 전환과 available 제외 동작을 확인했다.
- `requested` 이후 `reserved`, `completed`, `cancelled`, `expired` 흐름은 후속 버전에서 설계한다.

## 2026-05-06 백엔드 Phase 1.5 반영 상태

백엔드가 프론트 변경 공지 문서 기준으로 VM 배포와 검증을 완료했다. 이 섹션은 프론트 검증/백로그 관점에서 백엔드 답변을 재분류한다.

| 항목                  | 백엔드 상태                                                                                         | 프론트 상태                                                                                    | 다음 액션                                              |
| --------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 나눔 신청 API         | `POST /posts/{id}/requests` 구현, 201/403/409 VM 검증 완료                                          | `requestShare(postId)`, 상세 CTA, 201/403/409 UI, 홈 refresh 신호 구현 완료                    | 2026-05-06 VM API 201/403/409 통과                     |
| 신청 동시 경합        | `SELECT ... FOR UPDATE` + 단일 트랜잭션으로 첫 신청만 성공. 이후 요청은 409                         | 409를 정상 race 결과로 처리하고 CTA를 `신청 접수` 상태로 비활성화                              | 중복 신청 409 확인. 병렬 경합 부하 테스트는 후속       |
| 나눔 상태             | `available`, `requested`, `completed` 존재. `/posts/nearby`는 available만 반환                      | `Post.status` 타입과 상세/홈 상태 표시 반영. 신청 성공/409 시 상세 상태와 홈 refresh 신호 반영 | requested 전환 후 `/posts/nearby` 제외 확인            |
| Post 구조             | `title/description/category` 제거, `detectedFruitKo/freshnessLabel/confidenceScore` 추가. 2026-05-08 `imageToken` sidecar AI 메타데이터 저장/복원 수정 VM 배포 완료. `/posts/nearby`, `/fridges/{id}/posts`는 `PostNearbyRead`라 `confidenceScore`가 없다 | `src/types/post.ts`, `PostNearbyRead`, `createPost()` payload, 홈/냉장고 카드, 상세, 등록 확인 화면 반영 완료 | 2026-05-08 VM/API 재검증, 로컬 계약 회귀, 실제 Android 홈/상세/지도 UI 재검증 통과 |
| AI label              | `Fresh/Mid/Stale/unknown`, `Mid`는 기존 `Normal` 그룹                                               | `postPolicy`가 `Fresh/Mid`를 나눔 가능, `Stale/unknown`을 등록 불가로 매핑                     | fixture 기반 수동 QA                                   |
| confidenceScore       | Stage 2 신선도 분류 softmax max 확률로 확정. 백엔드 표시 가이드는 0.9 이상 높음, 0.9 미만 확인 필요 | 앱 기준을 `confidenceScore < 0.9`로 갱신. 단독 등록 차단은 하지 않음                           | 0.4/0.7/1.0 fixture로 확인 필요 표시 QA                |
| rejection reason enum | `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `review_required`, `multi_object_review` 등은 Post-MVP | 앱은 enum을 받으면 방어적으로 처리 가능. screenshot/UI는 MVP에서 서버 차단 불가라 통과 허용     | false-positive fixture는 report-only 관찰 및 후속 계약 검증 |
| Stale 최종 등록 방어  | `Stale`이면 generate 400, `imageToken` 미발급. create는 무효/만료 토큰 400                          | 프론트도 `canShare=false` UX 가드를 갖고 있음                                                  | 서버가 최종 방어선임을 전제로 stale/token 실패 UX 검증 |
| 알림                  | `share_created`, `share_requested` payload 구현                                                     | FCM 수신 handler와 로컬 알림함 구현. 읽음 상태 API 없음                                        | 실제 기기 foreground/background/terminated 수신 QA     |
| 냉장고별 나눔 식재료  | `GET /fridges/{id}/posts?status=available` 구현/검증                                                | 지도에서 선택 냉장고 내부 available 목록 노출 구현. `PostNearbyRead` 타입/fixture는 `confidenceScore`, `authorId`, `updatedAt` 없이 `fridgeName` 포함 형태로 정렬. 신청 성공 후 지도 내부 목록도 `requestedPostId` refresh 신호로 즉시 제거 | 실제 Android UI 재검증 통과 |

## 2026-05-08 백엔드 공식 답변 반영

- 환경/근거: 백엔드 소스 전수 분석, P0 수정, VM SCP 전송, `docker compose up -d --build api`, health OK 완료 답변.
- P0 Post AI 메타데이터 null:
  - 분류: 백엔드 버그, 수정 완료 및 VM 배포 완료.
  - 원인: `POST /posts/generate`의 AI 분석 결과가 HTTP 응답으로만 내려가고 `imageToken`과 함께 서버에 보관되지 않았다.
  - 수정 후 계약: generate는 이미지와 `{imageToken}.json` AI 메타데이터 sidecar를 임시 저장하고, create는 `move_temp_to_final()`에서 이미지 이동과 JSON 복원을 수행해 Post row에 저장한다.
  - 프론트 payload: 기존대로 `imageToken + fridgeId + expirationDate`만 전송한다. AI 메타데이터를 재전송하지 않는다. 서버 보관 값이 프론트 전송 값보다 우선한다.
  - 기존 null 데이터: 마이그레이션하지 않으며 프론트 fallback(`나눔 식재료 / 분석 중`)을 MVP에서 허용한다.
- AI rejection:
  - `Stale` 또는 `isFresh=false`는 generate 400이며 `imageToken`은 발급되지 않는다.
  - 400 body에서 안정적으로 읽을 필드는 FastAPI `detail`이다. `message`, `analysisMessage`는 400 계약 필드가 아니다.
- confidence:
  - `confidenceScore`는 Stage 2 신선도 모델(Fresh/Mid/Stale)의 softmax max 확률이다.
  - 서버는 confidence만으로 등록을 차단하지 않는다. 프론트의 `< 0.9 => 확인 필요`는 제품 표시 정책이다.
- screenshot/UI false-positive:
  - MVP AI 파이프라인은 screenshot/UI 판별 모델이 없어 차단할 수 없다.
  - `Fresh + imageToken`이 반환되면 등록 허용이 현재 계약이다. 낮은 confidence는 `확인 필요` 표시만 한다.
  - `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `review_required`, `multi_object_review`는 Post-MVP rejection reason 후보로 둔다.
- 냉장고별 목록:
  - `GET /fridges/{id}/posts?status=available`은 `/posts/nearby`와 같은 `PostNearbyRead` 카드 요약 스키마다.
  - `PostNearbyRead`는 `confidenceScore`, `authorId`, `latitude/longitude`, `updatedAt`을 포함하지 않고 `fridgeName`을 포함한다.
  - `status=available`은 `requested`, `completed`를 제외한다.
- FCM:
  - `share_created`는 냉장고 반경 2km 안에 FCM 토큰이 등록된 다른 사용자가 있을 때 발송된다. 작성자 본인은 제외한다.
  - `share_requested`는 공급자 `fcmToken`이 등록되어 있을 때 발송된다.
  - payload는 문자열 + camelCase(`type`, `postId`, `requestId`, `fruitName`, `fridgeName`)로 확정한다.
  - 별도 테스트 발송 API는 없고, 테스트 계정 2개로 실제 흐름 QA를 권장한다.
- requested:
  - `requested`는 신청 접수 상태이며 예약 확정/수령 완료가 아니다.
  - MVP에서 `reserved`, `cancelled`, `expired`는 코드/계약에 없고, `completed`는 DB에 있지만 전환 API가 없다.
  - 신청 후 `/posts/nearby`와 `/fridges/{id}/posts?status=available`에서 제외되는 것이 최종 계약이다.

프론트 후속 재검증 범위: `generate -> create -> GET /posts/{id} -> /posts/nearby -> /fridges/{id}/posts?status=available -> request -> requested 제외`, generate 400/detail, 무효 `imageToken`, screenshot fixture MVP 허용은 2026-05-08 VM/API에서 재검증했다. 홈/상세/지도/신청의 실제 Android UI는 2026-05-08 실기기에서 재검증했다. 실제 FCM 수신은 남아 있다.

## 2026-05-08 백엔드 답변 기반 VM/API 재검증 결과

- 환경: NHN Cloud VM API, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, 기준 시간 2026-05-08.
- 준비: QA 계정 `codex_p0_author_1778216431239@example.com`, `codex_p0_requester_1778216431239@example.com`을 생성하고 둘 다 `35.1595, 126.9136`으로 위치를 저장했다.
- 통과:
  - `/health`가 정상 응답했다.
  - `POST /posts/generate` fresh fixture는 `바나나`, `Fresh`, `confidenceScore=1`, `imageToken`을 반환했다.
  - 같은 `imageToken`으로 `POST /posts`를 호출해 id `4`를 생성했고, 생성 응답의 `detectedFruitKo=바나나`, `freshnessLabel=Fresh`, `confidenceScore=1`이 non-null이었다.
  - `GET /posts/4`도 AI 메타데이터 non-null과 `status=available`을 반환했다.
  - `/posts/nearby`와 `/fridges/1/posts?status=available`은 생성 직후 id `4`를 포함했고, 카드 표시용 `detectedFruitKo`, `freshnessLabel`, `status`를 제공했다. `confidenceScore` 필드는 `PostNearbyRead` 계약대로 없었다.
  - 작성자 본인 신청은 403, 수요자 첫 신청은 201과 `post.status=requested`, 중복 신청은 409를 반환했다.
  - 신청 후 `GET /posts/4`는 `requested`를 반환했고, `/posts/nearby`와 `/fridges/1/posts?status=available`에서 id `4`가 제외됐다.
  - 무효 `imageToken`으로 `POST /posts`를 호출하면 400을 반환했다.
  - `not-food` fixture의 generate 400 응답은 `detail` 필드를 포함하고 `message` 필드는 없었다.
  - `screenshot-or-ui` fixture는 `Fresh + imageToken`, `confidenceScore=1`로 통과했다. 이는 2026-05-08 백엔드 답변 기준 MVP 허용 동작이다.
- fixture report-only:
  - passed: `fresh-single`, `not-food`, `multi-object`.
  - failed but MVP/report-only expected: `stale-or-rotten`(`Fresh`, confidence `0.79`), `screenshot-or-ui`(`Fresh`, confidence `1`), `low-quality`(`Fresh`, confidence `0.9794`).
  - skipped: `large-image` local-only fixture.
- 자동 회귀:
  - `node .\node_modules\jest\bin\jest.js --runTestsByPath .\__tests__\posts.api.test.ts .\__tests__\postPolicy.test.ts .\__tests__\postDetail.requestShare.test.tsx .\__tests__\home.nearbyRefresh.test.tsx .\__tests__\map.fridgePosts.test.tsx .\__tests__\notificationService.test.ts --runInBand`
  - 6 suites / 50 tests 통과.
- 남은 QA:
  - 실제 FCM 토큰이 있는 기기 2대로 `share_created`, `share_requested` foreground/background/terminated 수신을 확인한다.

## 2026-05-08 실제 Android 기기 백엔드 P0 후속 QA 결과

- 환경: 실제 Android 기기 `SM-S928N` Android 15(API 35, serial `R3CX203CV8X`), release APK, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, `adb reverse tcp:8080 tcp:8080`, QA 계정 `codex_device_1778219070@example.com`.
- 준비:
  - USB 디버깅 기기가 `adb devices -l`에서 `device` 상태로 인식됐다.
  - `/health`는 `FoodLink API is running`을 반환했다.
  - 실제 기기 release APK 검증은 기존 방식대로 `src/config/api.ts`의 `ANDROID_DEVICE_HOST`를 빌드 시점에만 `localhost`로 임시 변경해 수행했고, 소스는 QA 후 빈 값으로 되돌렸다.
  - `android/app/google-services.json`이 없어 Firebase services는 비활성화된 상태다. 실제 FCM 수신 QA는 이번 범위에서 제외했다.
- 통과:
  - 이메일 로그인과 위치 권한 허용, 위치 저장이 통과했다. 저장 위치는 `35.1775512, 126.9031512` 기준이다.
  - fresh fixture로 API 생성한 신규 Post id `5`가 `detectedFruitKo=바나나`, `freshnessLabel=Fresh`, `confidenceScore=1.0`, `status=available`을 반환했다.
  - 홈 pull-to-refresh 후 신규 카드가 `바나나 / 상태가 좋아 보여요 / 전남대학교 공유냉장고`로 표시됐다. 기존 sidecar 수정 전 null 데이터 id `3`은 `나눔 식재료 / 분석 중` fallback으로 남았고, 이는 MVP 허용 동작이다.
  - 상세 화면에서 신규 Post가 `바나나`, `상태가 좋아 보여요`, `AI 신뢰도 100%로 상태가 좋아 보여요 상태로 확인됐어요.`를 표시했다.
  - 지도에서 `전남대학교 공유냉장고 -> 내부 보기`를 열면 내부 available 목록에 신규 Post가 `바나나 / 상태가 좋아 보여요`로 표시됐다.
  - 다른 작성자 fixture Post id `6`, id `7`을 현재 기기 계정으로 신청했을 때 `신청 완료 / 나눔 신청이 접수되었습니다.` 알림이 표시되고 상세 CTA가 `신청 접수` disabled 상태로 전환됐다.
  - API 교차확인: id `7`은 `requested`로 전환됐고 `/fridges/4/posts?status=available`에는 id `5,3`만 남아 id `7`이 제외됐다.
- 발견 및 수정:
  - 발견: 신청 성공 후 상세에서 지도 냉장고 내부 목록으로 뒤로 돌아오면, API에서는 `requested`로 제외됐지만 지도 목록 state에는 방금 신청한 항목이 수동 새로고침 전까지 남았다.
  - 수정: `MapScreen`이 `useFeedRefreshStore.requestedPostId`를 구독해 선택 냉장고 내부 목록에서도 신청된 항목을 즉시 제거하도록 보강했다.
  - 회귀: `__tests__/map.fridgePosts.test.tsx`에 선택 냉장고 목록에서 requested post를 제거하는 테스트를 추가했다.
  - 실기기 재확인: QA용 localhost release APK로 id `7` 신청 후 뒤로 돌아온 지도 내부 목록에서 방금 신청한 항목이 수동 새로고침 없이 즉시 제거되고, 남은 available 항목 `id 5`, 기존 fallback `id 3`만 표시되는 것을 확인했다.
- 후속:
  - 이 섹션의 P0 후속 UI 검증은 VM API fixture 생성 게시글 기반이었다. 이후 아래 `MVP flow closeout QA`에서 실제 앱 갤러리 선택 기반 `generate -> create -> home/detail/map -> request exclusion`을 끝까지 재검증했다.
  - 실제 FCM 수신은 Firebase 설정 파일과 실제 토큰이 있는 2기기/2계정 환경이 필요하다.

## 2026-05-08 MVP flow closeout QA 결과

- 환경: 실제 Android 기기 `SM-S928N` Android 15(API 35, serial `R3CX203CV8X`), release APK, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, `adb reverse tcp:8080 tcp:8080`, QA 계정 `codex_device_1778219070@example.com`.
- 자동 회귀:
  - `node .\node_modules\typescript\bin\tsc --noEmit` 통과.
  - `node .\node_modules\eslint\bin\eslint.js . --quiet` 통과.
  - `node .\node_modules\jest\bin\jest.js --runInBand` 통과: 21 suites / 90 tests.
- 실제 기기 카메라 실패 경로:
  - 실제 카메라 화면에서 셔터 촬영 후 `/posts/generate`가 400을 반환했고, 앱은 `분석 실패`, `나눔 기준에 맞지 않아요. (나눔 기준에 맞지 않아요.)`, `다시 촬영`, `갤러리 선택`을 표시했다.
  - 증거: `temp/mvp-flow-camera-entry.png`, `temp/mvp-flow-camera-stale-failure.png`.
- 실제 기기 갤러리 성공 경로:
  - `docs/qa-fixtures/fresh-single-fresh-20260505.jpg`를 기기 사진 폴더에 넣고 Android Photo Picker에서 선택했다.
  - 분석 결과 화면은 `바나나`, `상태가 좋아 보여요`, `AI 신뢰도 100%`, `나눔 가능`을 표시했다.
  - 등록 확인 화면은 `바나나 / 상태가 좋아 보여요 / 100%`, `등록될 나눔 식재료: 바나나`를 표시했다.
  - `전남대학교 공유냉장고`를 선택해 `POST /posts`를 완료했고, 완료 화면은 `나눔 등록 완료!`와 로컬 알림 미리보기를 표시했다.
  - 생성된 Post는 API 기준 id `8`, `detectedFruitKo=바나나`, `freshnessLabel=Fresh`, `status=available`이었다.
  - 홈 복귀 후 주변 나눔은 `3건`으로 재조회됐고, 첫 카드가 `바나나 / 상태가 좋아 보여요 / 전남대학교 공유냉장고`로 표시됐다.
  - 상세 화면은 id `8`을 `바나나`, `상태가 좋아 보여요`, `AI 신뢰도 100%로 상태가 좋아 보여요 상태로 확인됐어요.`로 표시했다.
  - 증거: `temp/mvp-flow-photo-picker.png`, `temp/mvp-flow-gallery-analysis-result.png`, `temp/mvp-flow-gallery-post-create.png`, `temp/mvp-flow-gallery-fridge-selected.png`, `temp/mvp-flow-gallery-complete.png`, `temp/mvp-flow-home-after-gallery-create.png`, `temp/mvp-flow-detail-after-gallery-create.png`.
- 신청/available 제외:
  - 다른 테스트 계정 `codex_mvp_requester_1778223837@example.com`으로 id `8`을 신청했다.
  - API 교차확인: `GET /posts/8`은 `requested`, `/posts/nearby`와 `/fridges/4/posts?status=available`은 `5,3`만 반환해 id `8`을 제외했다.
  - 앱 홈 새로고침 후 주변 나눔은 `2건`으로 줄었고, 지도 `전남대학교 공유냉장고 -> 내부 보기`도 `바나나` id `5`와 기존 null fallback id `3`만 표시했다.
  - 증거: `temp/mvp-flow-home-after-request-exclusion.png`, `temp/mvp-flow-map-after-request-exclusion.png`.
- fixture/API report-only:
  - 인증 토큰 포함 `node scripts\validate-ai-fixtures.js --report-only` 결과: `fresh-single` 통과, `not-food` 400 통과, `multi-object` 400 통과.
  - `stale-or-rotten`은 `Fresh/confidence=0.79`, `screenshot-or-ui`는 `Fresh/confidence=1`, `low-quality`는 `Fresh/confidence=0.9794`로 통과했다. 이는 2026-05-08 백엔드 답변 기준 MVP 차단 blocker가 아니라 Post-MVP AI/rejection contract 항목이다.
  - 무효 `imageToken`으로 `POST /posts`를 호출하면 400을 반환했다.
- FCM:
  - `android/app/google-services.json`이 없어 Gradle이 Firebase services를 비활성화하고, 현재 연결된 실제 기기는 1대뿐이다.
  - 실제 FCM foreground/background/terminated 수신 QA는 이 환경에서 불가하다. Firebase 설정 포함 빌드, 알림 권한 허용, FCM token이 등록된 2기기/2계정, VM Firebase credentials 또는 발송 로그가 필요하다.
- MVP closeout 판단:
  - `camera/gallery -> generate -> create -> home/detail/map -> request -> requested available 제외` core flow는 닫았다.
  - 실제 FCM 수신은 제품 알림 claim의 별도 blocker로 남긴다.

## 2026-05-08 스프린트 종료 결정

- 판정: 이번 스프린트는 닫는다.
- Scope mode: `HOLD_SCOPE`.
- 닫힌 범위:
  - MVP core flow: `camera/gallery -> generate -> create -> home/detail/map -> request -> requested available 제외`.
  - FCM 프론트 구현: token 준비 경로, 문자열 + camelCase payload 검증, foreground/background/opened/initial handler, 로컬 알림함, Firebase 미설정 fallback.
  - 검색 MVP 범위: 지도 공유 냉장고 이름/주소 로컬 필터.
  - 홈/프로필 mock 통계 숫자 제거.
- 이월 범위:
  - FCM 실수신 QA. 이월 사유는 구현 미완성이 아니라 외부 Firebase/NHN Cloud 환경 blocker다.
  - 현재 blocker: `android/app/google-services.json` 부재, NHN Cloud VM의 Firebase Admin/service account credentials 설정 여부 미확인, 실제 FCM 발송 로그와 Mock FCM 로그 구분 미확인, 2 Android client/2계정/2 FCM token 환경 미준비.
  - `2026-GreenNode.pem`은 NHN Cloud SSH 터널/접속용 키이며 Firebase 앱 초기화나 FCM 발송 권한을 대신하지 않는다.
- 관리자 요청 항목:
  - Android package `com.greennode`용 `google-services.json`.
  - NHN Cloud 백엔드 VM의 Firebase Admin/service account credentials 설정 여부.
  - `share_created`, `share_requested` 발생 시 실제 FCM 발송 완료, `[Mock FCM]`, 반경 내 사용자 없음, 발송 실패 로그를 구분하는 방법.
- 다음 스프린트 시작 조건:
  - Firebase 설정 포함 Android 빌드가 가능해야 한다.
  - 실기기 1대 + Google Play services Android emulator 1대 또는 동등한 2 Android client 환경이 있어야 한다.
  - 두 테스트 계정이 같은 냉장고 반경 2km 안 위치와 FCM token을 서버에 등록해야 한다.
- 다음 스프린트 P0:
  - `share_created`: 계정 A가 나눔 식재료 등록 후 계정 B가 수신하는지 foreground/background/terminated에서 확인한다.
  - `share_requested`: 계정 B가 나눔 신청 후 계정 A가 수신하는지 foreground/background/terminated에서 확인한다.
  - 알림 탭/알림 열기 라우팅이 `PostDetail` fallback으로 이어지는지 확인한다.
- 다음 스프린트 P1:
  - 카메라 권한 거부 시 재요청, 설정 열기, 갤러리 선택 대체 UX를 보강한다.
  - AI 서버 timeout/네트워크 실패를 fault injection으로 재검증하고 화면별 Alert 중심 오류를 공통 retry 패턴으로 정리한다.
  - `stale-or-rotten`, `screenshot-or-ui`, `low-quality` false-positive를 Post-MVP rejection/review reason 계약으로 승격할지 백엔드/AI와 결정한다.
  - 중복 등록 방지를 위해 서버 idempotency key 또는 중복 생성 방지 기준을 검토한다.
- 다음 스프린트 P2:
  - 주변 냉장고 없음 fixture 또는 서버 거리 필터를 검증한다.
  - `detections[]` multi-object 계약 초안과 대표 객체 1개 처리/객체별 분리 등록 UX 방향을 결정한다.
  - 서버 검색 확장 여부, 읽음 상태 API, 내 나눔/받은 나눔, 실제 활동 지표 API는 후순위로 둔다.

## 2026-05-11 다음 스프린트 회의안

이 섹션은 2026-05-11 주간 스프린트 계획 회의에서 기획자/백엔드와 공유할 초안이다. 기존 2026-05-08 종료 결정의 이월 항목을 유지하되, 이번 주에는 사용자가 실제로 쓸 수 있는 세로 흐름 1~2개를 검증까지 완료하고, 다음 큰 기능의 API/DB/UX 계약을 확정하는 것을 목표로 둔다.

### 지난 스프린트 리마인드

- 기능 구현 요약: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- 실제 검증 결과/백로그: [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)
- API 계약/백엔드 연동 상태: [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md)
- 현재 README 요약: [../README.md](../README.md)

| 기능 | 구현 상태 | 테스트/검증 상태 | 부족한 점 |
| --- | --- | --- | --- |
| 이메일 회원가입/로그인 | 구현됨 | 앱/API 흐름 검증됨 | 소셜 로그인, 이메일 인증 없음 |
| 위치 등록/재설정 | 구현됨 | 권한 거부/재시도 단위 테스트, 일부 실기기 QA | 권한 영구 거부 등 추가 실기기 반복 검증 필요 |
| AI 촬영/갤러리 분석 | 부분 구현, MVP 흐름 가능 | 실기기에서 `generate` 성공/실패 경로 검증 | false-positive는 서버/AI 계약 한계로 Post-MVP |
| 나눔 식재료 등록 | 구현됨 | 실기기에서 `generate -> create -> home/detail/map` 검증 | 유통기한 수동 입력/OCR 등은 없음 |
| 홈 주변 나눔 목록 | 구현됨 | 등록 후 홈 재조회, requested 제외 검증 | 서버 검색/추천/랭킹은 없음 |
| 나눔 상세/신청 | 구현됨 | 201/403/409, `available -> requested`, 중복 신청 방어 검증 | `reserved/completed/cancelled/expired` 흐름 없음 |
| 공유 냉장고 지도 | 구현됨 | 지도 마커, 냉장고 선택, 내부 available 목록, 상세 이동 검증 | 냉장고 없음 fixture/API 검증 추가 필요 |
| 공유 냉장고별 나눔 목록 | 구현됨 | 신청 후 내부 목록에서 즉시 제거되는 것까지 실기기 재검증 | 냉장고 inventory 개념은 없음 |
| FCM/알림함 | 프론트 구현됨 | payload parsing, fallback, 로컬 알림함 테스트됨 | 실제 FCM 수신 QA 미완료. 다음 스프린트 P0 |
| 검색 | 최소 구현 | 공유 냉장고 이름/주소 로컬 필터 | 나눔 식재료 검색/서버 검색 없음 |
| 채팅 | 알림함으로 축소 | mock 채팅 제거됨 | WebSocket 채팅은 보류 |
| 통계/탄소 절감 | 목업 제거/정리됨 | 준비 중 상태 | 실제 지표 API/계산식 없음 |
| 냉장고 운영자 기능 | 미구현 | 검증 콘솔 프로토타입 | MVP 범위 밖, 후속 설계 필요 |

현재 검증 완료된 공유 냉장고 관련 흐름:

```text
지도 진입
  -> 주변 공유 냉장고 조회
  -> 마커/카드 선택
  -> 냉장고 내부 available 나눔 식재료 조회
  -> 항목 탭
  -> 상세 이동
  -> 나눔 신청
  -> requested 전환
  -> 홈/지도 목록에서 제외
```

현재 부족한 점:

1. 공유 냉장고 자체 운영 기능은 아직 없다. 예: 냉장고 inventory 확인, 냉장고 운영자 확인, 보관 확인, 현장 조정.
2. `주변에 공유 냉장고 없음` 상태와 거리/지역 edge case는 추가 검증이 필요하다.
3. 공유 냉장고와 연결된 실제 알림 claim은 FCM 실수신 QA가 끝나야 완료로 볼 수 있다.

### 이번 주 목표

- 지난 스프린트에서 MVP core flow는 대부분 해결 완료했다. 단, 제품 알림 claim은 2기기/2계정 FCM 실수신 QA까지 끝나야 완료로 본다.
- 이번 주는 기능을 넓히되, 사용자가 실제로 쓸 수 있는 세로 흐름 1~2개를 검증까지 완료한다.
- 동시에 OCR, Auth 확장, 냉장고 inventory처럼 큰 기능은 이번 주에 API/DB/UX 계약을 먼저 합의한다.

### P0: FCM 실수신 QA 완료

목표:

- `share_created`, `share_requested` 실제 수신 확인.
- 2기기/2계정 기준으로 foreground/background/terminated 수신 확인.

필요 사항:

- Android `google-services.json` 준비.
- 백엔드 NHN Cloud VM에 Firebase Admin/service account credentials 설정 여부 확인.
- 실제 발송 로그와 `[Mock FCM]` 로그 구분.
- `share_created`, `share_requested` 각각의 발송 조건 재확인.

완료 기준:

- 계정 A가 나눔 식재료를 등록하면 계정 B가 `share_created`를 수신한다.
- 계정 B가 나눔 신청을 하면 계정 A가 `share_requested`를 수신한다.
- 알림 탭 또는 알림함 항목 탭이 `PostDetail` fallback으로 이어진다.
- 백엔드 로그에서 실제 발송, mock 발송, 반경 내 대상 없음, 발송 실패를 구분할 수 있다.

### P1: 나눔 등록 flow 개선

구현 후보:

- 유통기한 수동 입력.
- 기본값 정책 결정: 현재 기본 3일 유지 여부.
- 날짜 validation.
- 홈/상세 화면의 유통기한 표시 정리.

이번 주 설계만 진행할 항목:

- OCR은 바로 구현하지 않고 필요 API, UX, 실패 케이스 정의까지 진행한다.

백엔드 확인 필요:

- `expirationDate` validation 기준.
- 오늘 이전 날짜 허용 여부.
- 최대 허용 기간.
- 만료된 나눔 식재료를 `/posts/nearby`, `/fridges/{id}/posts?status=available`에서 제외하는 기준.

완료 기준:

- 사용자가 등록 화면에서 유통기한을 직접 확인/수정할 수 있다.
- 잘못된 날짜는 프론트에서 막고, 백엔드 validation 기준과 충돌하지 않는다.
- 홈/상세에서 사용자에게 필요한 날짜 정보가 일관된 문구로 표시된다.

### P1: 홈 화면 발견 섹션 개선

구현 후보:

- 홈 검색 기능.
- `오늘 가져가기 좋은 재료` 같은 규칙 기반 추천 섹션.

결정 필요:

- 검색을 프론트 로컬 필터로 먼저 할지, 서버 검색 API로 할지.
- 랭킹을 이번 주 구현 대상으로 볼지, 데이터 수집/설계만 할지.
- 현재 조회/신청/관심 데이터가 부족하므로 `랭킹`은 실제 인기처럼 보이지 않도록 주의한다.

완료 기준:

- 사용자가 홈에서 나눔 식재료를 더 쉽게 찾을 수 있다.
- 추천 섹션은 실제 데이터 근거가 있는 규칙만 사용한다. 예: 거리, 최신순, 유통기한 가까움.
- `많이 찾는 식재료` 같은 표현은 조회/신청/관심 데이터가 쌓이기 전까지 보류한다.

### P2/설계: Auth 확장

후보:

- 소셜 로그인.
- 이메일 인증.

결정 필요:

- 소셜 로그인 provider를 무엇으로 시작할지. 예: Kakao, Google, Apple 중 1개.
- 이메일 인증 전 서비스 이용을 어디까지 허용할지.
- 이번 주에 둘 다 구현할지, 하나만 구현하고 다른 하나는 계약으로 남길지.

완료 기준:

- 구현 대상과 보류 대상을 명확히 나눈다.
- 백엔드 endpoint, 토큰 처리, 실패/재시도 UX를 문서화한다.

### P2/설계: 냉장고 inventory

현재 구현:

- 냉장고별 available 나눔 식재료 목록 조회.
- 냉장고 운영자 검증 콘솔 정적 프로토타입: `docs/prototypes/fridge-operator-console.html`.

새로 정의할 inventory:

- 실제 공유 냉장고 안의 물리적 재고 상태.
- 수요자-facing 목록이 아니라 **냉장고 운영자**가 점검하는 현장 운영 레이어.
- 개별 나눔 식재료의 현장 상태, 권장 나눔 기한, 점검 필요 여부, 폐기/분실/수령 확인 이력.
- 같은 촬영/보관 흐름에서 나온 여러 나눔 식재료를 묶어 보는 바구니 후보.

이번 주 목표:

- 바로 구현하지 않고 DB/도메인/화면 설계를 완료한다.
- 현재 `GET /fridges/{id}/posts?status=available`와 별도 inventory 개념의 경계를 확정한다.
- 바구니를 정식 도메인 개념으로 채택할지, 단순 추적용 메타데이터로 둘지 결정한다.
- 냉장고 운영자가 상태를 변경할 수 있는 단위가 개별 나눔 식재료인지, 바구니인지, 둘 다인지 결정한다.

현재 판단:

- 사용자 등록/신청 단위는 계속 개별 **나눔 식재료**다.
- inventory는 나눔 식재료 목록의 단순 확장이 아니라 냉장고 운영자용 현장 점검 레이어다.
- 바구니는 사용자-facing 신청 단위가 아니다. 채택하더라도 같은 등록/보관 흐름에서 나온 개별 나눔 식재료를 함께 찾고 점검하기 위한 grouping이다.
- 바구니 상태는 별도 저장값보다 내부 나눔 식재료 상태에서 계산하는 방향을 우선 검토한다.

DB/API 초안:

- `fridge_operators`: 냉장고 운영자와 관리 가능한 공유 냉장고 연결.
- `inventory_baskets` 또는 `registration_batches`: 같은 촬영/보관 흐름에서 생성된 나눔 식재료 묶음. `fridgeId`, `createdBy`, `createdAt`, `sourceScanId` 정도만 최소 보관.
- `posts` 또는 후속 `share_items`: 기존 개별 나눔 식재료에 `basketId`, `recommendedShareUntilAt`, `needsReview` 후보 필드 추가 검토.
- `item_status_events`: 개별 나눔 식재료 상태 변경 이력. `itemId`, `fromStatus`, `toStatus`, `actorId`, `actorRole`, `reason`, `note`, `createdAt`.
- `detections`: multi-object 감지 결과와 생성된 나눔 식재료 연결. `detectionId`, `boundingBox`, `detectedCropKo`, `freshnessLabel`, `confidenceScore`, `postId`.
- 조회 후보: `GET /operator/fridges/{fridgeId}/inventory/summary`, `GET /operator/fridges/{fridgeId}/inventory/items`, `GET /operator/baskets/{basketId}`.
- 변경 후보: `POST /operator/items/{postId}/status-events`로 `discarded`, `missing`, `completed`, `needsReview` 같은 운영자 처리 기록.

완료 기준:

- inventory가 나눔 식재료 목록의 확장인지, 운영자 재고 관리인지 정의한다.
- 바구니 채택 여부와 `basketId`의 의미를 확정한다.
- 냉장고 운영자가 직접 바꿀 수 있는 상태와 상태 변경 이력 필드를 확정한다.
- 필요한 DB 테이블/필드/API 초안을 만든다.
- 프론트 화면 진입점과 MVP 이후 냉장고 운영자 기능과의 연결 방식을 정한다.

## 2026-05-08 subagent-driven Phase 1.5 QA 통합 결과

- 방식: 문서 감사, 로컬 자동 회귀, Android/FCM 준비도, API/알림 계약 코드 감사를 서브에이전트 단위로 분리하고 오케스트레이션에서 결과를 통합했다.
- 문서 정리:
  - `POST /posts/generate` 성공 응답의 canonical AI 판정 위치는 `data.aiAnalysis`로 정리했다. Post 생성/조회 응답의 저장 필드는 root `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`다.
  - `PostNearbyRead`는 `/posts/nearby`, `/fridges/{id}/posts` 카드 요약 스키마이며 `confidenceScore`, `authorId`, `latitude/longitude`, `updatedAt`을 포함하지 않고 `fridgeName`을 포함한다.
- 코드/테스트 정렬:
  - `src/types/post.ts`에 `PostNearbyRead`를 분리하고 `getNearbyPosts()`, `getFridgePosts()`, 홈 카드, 지도 냉장고 내부 목록 타입을 이 계약에 맞췄다.
  - generate 400 처리 경로는 FastAPI `detail`을 우선 읽도록 `getApiErrorMessage(..., {preferDetail: true})`를 적용했다. 다른 API의 `message` 우선 동작은 유지한다.
  - nearby/fridge list 테스트 fixture는 `confidenceScore`, `authorId`, `updatedAt` 없이 `fridgeName`을 포함하는 형태로 갱신했다.
- 로컬 검증:
  - Focused Jest: `apiError`, `cameraScan.fallback`, `fridges.api`, `home.nearbyRefresh`, `map.fridgePosts` 5 suites / 16 tests 통과.
  - Full Jest: 21 suites / 89 tests 통과.
  - TypeScript `--noEmit`: 통과.
  - ESLint: 0 errors, 기존 warning 10건.
  - `git diff --check`: whitespace error 없음. LF/CRLF 경고만 표시.
- Android/FCM 준비도:
  - 이후 `SM-S928N` 실제 기기를 연결해 백엔드 P0 후속 홈/상세/지도/신청 UI를 재검증했다.
  - `android/app/google-services.json`이 없어 Gradle이 Firebase services를 비활성화하는 상태다.
  - 실제 FCM 수신 QA는 Firebase 설정이 포함된 빌드, 알림 권한을 허용한 두 테스트 기기/계정, VM Firebase credentials 또는 실제 발송 로그가 필요하다.
- Phase 1.5 closeout 판단:
  - API 계약, 로컬 회귀, VM/API 재검증, 실제 Android 홈/상세/지도/신청 UI 재검증은 닫았다.
  - 실제 FCM foreground/background/terminated 수신은 환경 blocker로 남긴다.

## 2026-05-06 VM/API 런타임 QA 결과

- 환경: NHN Cloud VM API, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, 기준 시간 2026-05-06.
- 범위: 실기기 카메라, 실제 FCM 수신, Android permission QA는 제외했다. API 런타임 검증을 위해 공개 바나나 이미지 fixture를 `temp/qa-vm-banana.jpg`로 내려받아 `POST /posts/generate`에 업로드했다. 이 파일은 커밋 대상이 아니다.
- 준비: 기존 문서의 `mvp_demo_20260505@example.com` 계정은 VM에서 로그인 실패(`이메일 또는 비밀번호가 올바르지 않습니다`)하여 사용하지 않았다. QA 전용 계정 `codex_api_author_20260506211207@example.com`(id 3), `codex_api_requester_20260506211207@example.com`(id 4)을 생성하고 둘 다 `35.1595, 126.9136`으로 위치를 저장했다.
- 통과:
  - `GET /health`가 `FoodLink API is running`을 반환했다.
  - `POST /auth/signup`, `POST /auth/login`, `PUT /auth/me/location`, `GET /auth/me`가 QA 계정에서 정상 동작했다.
  - `GET /fridges/nearby?latitude=35.1595&longitude=126.9136&radius_km=5`가 공유 냉장고 3개를 반환했다.
  - 초기 `GET /posts/nearby`와 `GET /fridges/1/posts?status=available`은 0건이었다.
  - `POST /posts/generate`는 `detectedFruitKo=바나나`, `aiAnalysis.category=Fresh`, `aiAnalysis.confidenceScore=1.0`, `imageToken`을 반환했다.
  - `POST /posts`로 QA 나눔 식재료 id `2`를 생성했고, 생성 직후 `/posts/nearby`와 `/fridges/1/posts?status=available`에 포함됐다.
  - 작성자가 자기 나눔 식재료 id `2`를 신청하면 403을 반환했다.
  - 다른 사용자가 id `2`를 신청하면 201을 반환하고 `request.status=requested`, `post.status=requested`가 됐다.
  - 신청 후 `GET /posts/2`는 `status=requested`를 반환했다.
  - 신청 후 `/posts/nearby`와 `/fridges/1/posts?status=available`에서 id `2`가 제외됐다.
  - 같은 사용자의 중복 신청은 409를 반환했다.
  - 무효 `imageToken`으로 `POST /posts`를 호출하면 400을 반환했다.
- 충돌:
  - 충돌 문서/공지: `API_INTEGRATION_CONTRACT.md`, `VALIDATION_AND_BACKLOG.md`의 백엔드 Phase 1.5 요약, 백엔드 답변 문서의 "Post 컬럼에 `detected_fruit_ko/freshness_label/confidence_score` 추가 및 사용" 설명.
  - 실제 기준: 2026-05-06 live VM API와 `GET /openapi.json`.
  - 판단: 실제 VM `POST /posts/generate` 응답은 `freshnessLabel`, `confidenceScore`, `isFresh`를 root가 아니라 `data.aiAnalysis` 아래에만 둔다. 또한 `POST /posts`로 생성한 id `2`의 `GET /posts/2` 응답은 `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`가 모두 `null`이었다.
  - 영향: 프론트는 구형 `title/description/category` 없이 동작하지만, 저장된 Post가 AI 메타데이터를 잃으면 홈 카드/상세/냉장고 내부 목록에서 실제 식재료명과 상태/신뢰도 표시가 제품 기대보다 약해진다.
  - 후속: 백엔드가 `imageToken`에 묶인 AI 분석 결과를 Post 생성 시 저장하도록 수정하거나, Post 응답에서 해당 필드가 nullable인 것이 제품상 허용되는지 계약을 다시 정해야 한다.

## 2026-05-06 실제 Android 기기 카메라/등록 QA 결과

- 환경: 실제 Android 기기 `SM-S928N` Android 15(API 35, serial `R3CX203CV8X`), release APK, `adb reverse tcp:8080 tcp:8080`, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, QA 계정 `codex_api_requester_20260506211207@example.com`.
- 준비: 실제 기기에서 release APK를 실행하기 위해 `src/config/api.ts`의 `ANDROID_DEVICE_HOST`를 QA 빌드 시점에만 `localhost`로 임시 변경했다. 소스는 QA 후 빈 값으로 되돌렸고, APK는 adb reverse 전제 빌드다.
- 통과:
  - USB 디버깅 연결 후 `adb devices -l`에서 물리 기기가 `device` 상태로 인식됐다.
  - 최초 release 실행 시 Firebase 설정 부재로 앱 시작 크래시가 발생했고, `notifications.ts`에서 Firebase Messaging 인스턴스를 얻지 못하면 handler 등록을 건너뛰도록 수정했다.
  - 수정 후 release APK가 정상 실행됐고, 카메라 권한 팝업에서 `앱 사용 중에만 허용` 선택 후 카메라 프리뷰가 표시됐다.
  - 실기기 카메라 셔터로 촬영 파일이 생성되고 `/posts/generate`까지 도달했다.
  - 분석 결과 화면이 `나눔 가능`, `상태가 좋아 보여요`, `AI 신뢰도 91%`를 표시했다.
  - `이대로 나눔하기 -> 나눔 등록 -> 냉장고 선택 -> 나눔 완료하기`가 실제 API와 연결되어 등록 완료 화면까지 도달했다.
  - 완료 화면에서 `홈으로 돌아가기`를 누르면 홈의 `/posts/nearby` 목록이 재조회되어 주변 나눔 `1건`과 신규 카드가 표시됐다.
  - 홈 카드 탭 시 상세 화면으로 이동했다.
- 충돌/버그:
  - 충돌 문서/공지: 백엔드 Phase 1.5 요약과 프론트 표시 정책은 등록 후 Post가 `detectedFruitKo/freshnessLabel/confidenceScore`를 유지한다고 설명한다.
  - 실제 기준: 2026-05-06 실제 Android 기기 release QA와 live VM API.
  - 판단: 등록 직전 화면은 AI 결과 `바나나 / 상태가 좋아 보여요 / 91%`를 표시했지만, 등록 완료 후 홈/상세는 `나눔 식재료 / 분석 중 / 근처 공유 냉장고` fallback으로 표시됐다. VM/API QA에서 발견한 Post AI 메타데이터 저장 불일치가 실제 앱에서도 재현됐다.
  - 추가 AI 품질 이슈: 화면상 촬영 대상은 토마토 이미지였으나 AI는 `바나나`로 판별했다. 이는 프론트 크래시/연동 문제는 아니지만 false-positive/분류 품질 증거로 남긴다.
- 증거:
  - `temp/real-device-camera-screen.png`
  - `temp/real-device-after-laptop-capture.png`
  - `temp/real-device-share-form.png`
  - `temp/real-device-fridge-select.png`
  - `temp/real-device-fridge-selected.png`
  - `temp/real-device-after-share-create.png`
  - `temp/real-device-home-after-share-create.png`
  - `temp/real-device-detail-after-share-create.png`
- 후속:
  - P0 `Post AI 메타데이터 저장 계약 불일치 정리`를 백엔드 수정 대상으로 유지한다.
  - 실제 FCM foreground/background/terminated 수신 QA는 아직 미완료다. 다만 Firebase 설정 파일이 없는 release QA 빌드에서 앱이 크래시하지 않도록 알림 handler와 FCM 토큰 등록 경로에 프론트 guard와 회귀 테스트를 추가했다.
  - 당시에는 실제 `Stale`, `not-food`, `low-quality` fixture를 아직 확보하지 못했다. 이후 2026-05-07 fixture를 추가했고, 2026-05-08 기준 false-positive 결과는 Post-MVP AI 계약 항목으로 재분류했다.

## 2026-05-06 무기기 자동 QA 결과

- 환경: Windows 로컬 워크스페이스, 실제 Android 기기 연결 없이 진행.
- 수정:
  - Firebase Messaging 인스턴스 획득을 `firebaseMessaging.ts` 공통 helper로 분리했다.
  - `notifications.ts`뿐 아니라 `deviceRegistration.ts`의 FCM 토큰 조회도 Firebase 설정 부재를 안전하게 건너뛰도록 보강했다.
  - `docs/qa-fixtures/manifest.json`의 깨진 JSON을 복구하고 `docs/qa-fixtures/README.md`를 현재 fixture 파일 규칙에 맞게 정리했다.
- 통과:
  - `node.exe .\node_modules\jest\bin\jest.js --runInBand`: 16 suites / 76 tests 통과.
  - `node.exe .\node_modules\typescript\bin\tsc --noEmit`: 통과.
  - `node.exe .\node_modules\eslint\bin\eslint.js . --quiet`: 통과.
  - `node.exe scripts\validate-ai-fixtures.js`: manifest 파싱과 반복 실행 통과. 당시에는 fixture 이미지가 없어 모든 케이스는 `skipped`.
  - `android\gradlew.bat :app:assembleRelease --console=plain --no-daemon`: release APK 빌드 통과.
- 남은 QA:
  - 당시에는 실제 fixture 이미지가 없으므로 `Stale`, `not-food`, `screenshot-or-ui`, `low-quality`, `multi-object`의 AI 판정 품질을 아직 검증하지 못했다. 이후 fixture 기반 report-only QA까지 진행했고, 최신 판정은 2026-05-08 closeout 섹션을 따른다.
  - 실제 FCM foreground/background/terminated 수신은 Firebase 설정과 실제 메시지 발송 환경이 필요하다.

## 2026-05-07 무기기 fixture/API/fallback QA 결과

- 환경: Windows 로컬 워크스페이스, 실제 Android 기기 연결 없음, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`.
- API fixture 검증:
  - `GET /health` 정상 응답 확인.
  - QA 계정 `codex_fixture_qa_*.example.com`을 생성하고 `35.1595, 126.9136` 위치를 등록한 뒤 `/posts/generate`를 직접 호출했다.
  - `temp/qa-vm-banana.jpg`: 200, `detectedFruitKo=바나나`, `aiAnalysis.category=Fresh`, `aiAnalysis.confidenceScore=1.0`, `imageToken` 발급. Fresh happy path는 API 기준 통과.
  - `temp/real-device-camera-screen.png`: 200, `detectedFruitKo=바나나`, `aiAnalysis.category=Fresh`, `aiAnalysis.confidenceScore=0.5377`, `imageToken` 발급.
- 충돌:
  - 충돌 문서/기준: 당시 `AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`와 `docs/qa-fixtures/manifest.json`은 `screenshot-or-ui`를 generate 400 또는 `확인 필요`로 기대했다. 2026-05-08 이후 이 기대값은 MVP acceptance가 아니라 Post-MVP rejection 목표로 해석한다.
  - 실제 기준: 2026-05-07 live VM API `/posts/generate`.
  - 판단: 앱 화면 캡처가 `Fresh`로 통과하고 `imageToken`까지 발급되므로, 프론트 fallback만으로는 이 케이스를 차단할 수 없다. 당시에는 백엔드/AI 파이프라인 품질 이슈로 기록했으나, 2026-05-08 백엔드 답변으로 MVP 차단 불가/허용 케이스로 재분류했다.
- fallback 자동 테스트 보강:
  - `CameraScanScreen`: 카메라 장치가 없는 환경에서 `갤러리에서 선택하기 -> generate -> AnalysisResult`가 이어지는지 고정했다.
  - `CameraScanScreen`: generate 400 실패 시 등록 화면으로 이동하지 않고 `다시 촬영`/`갤러리 선택` 대안을 제공하는지 고정했다.
  - `CameraScanScreen`: 지원하지 않는 갤러리 파일은 generate 호출 전에 차단하는지 고정했다.
  - `AnalysisResultScreen`: `Stale`/`isFresh=false`와 `imageToken` 누락은 `PostCreate`로 넘어가지 않는지 고정했다.
  - `AnalysisResultScreen`: 낮은 confidence는 `확인 필요`로 표시하되 `imageToken`이 있으면 등록 진행을 막지 않는 정책을 고정했다.
- 검증:
  - `node scripts\validate-ai-fixtures.js`: manifest 파싱/실행 통과. 이 실행 시점에는 `docs/qa-fixtures/`에 실제 fixture 이미지가 없어 모든 케이스는 `skipped`.
  - `node .\node_modules\jest\bin\jest.js --runInBand`: 20 suites / 85 tests 통과.
  - `node .\node_modules\typescript\bin\tsc --noEmit`: 통과.
  - `node .\node_modules\eslint\bin\eslint.js . --quiet`: 통과.
- 남은 QA:
  - 이 시점에는 커밋 가능한 실제 fixture 이미지가 부족해 `Stale`, `not-food`, `low-quality`, `multi-object`의 AI 판정 품질을 닫지 못했다. 이후 fixture 기반 report-only 검증을 수행했고 최신 판정은 2026-05-08 closeout 섹션을 따른다.
  - `screenshot-or-ui`는 실제 API false-positive로 재현됐지만, 2026-05-08 답변 기준 MVP에서는 차단하지 않는다. Post-MVP rejection enum 도입 전까지 report-only로 관찰한다.
  - 당시에는 실제 카메라 센서 촬영과 실제 FCM 수신을 실기기 QA로 남겼다. 이후 2026-05-08 closeout에서 카메라/generate/create/request flow는 재검증했고, 실제 FCM 수신만 남아 있다.

## 2026-05-07 Android emulator 지도 냉장고 내부 목록 UI QA 결과

- 환경: Android emulator `Medium_Phone_API_36.1` (`emulator-5554`), release APK, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, QA 계정 `qa162158@example.com`, 위치 `35.1595, 126.9136`.
- 범위: 지도 탭 진입, 공유 냉장고 마커/캐러셀 렌더링, 냉장고 선택, `GET /fridges/{id}/posts?status=available` 기반 내부 목록 표시, empty 상태, 목록 항목 상세 이동.
- 통과:
  - 홈에서 지도 탭 진입 후 Google Map, marker 3개, 냉장고 검색창, 냉장고 캐러셀, `내부 보기` CTA가 표시됐다.
  - `광주역 공유냉장고` 선택 시 내부 목록 panel이 열리고 `지금 가능한 나눔 식재료가 없습니다` empty 상태가 표시됐다.
  - live VM API에서 available 나눔 식재료가 있는 냉장고가 `fridgeId=4`(`전남대학교 공유냉장고`)임을 확인했다.
  - 캐러셀을 가로 스크롤해 `전남대학교 공유냉장고`를 선택하면 `지금 가능한 나눔 식재료` panel에 1건이 표시됐다.
  - 내부 목록 항목을 탭하면 `PostDetail`로 이동하고 상세 화면에서 `나눔 가능`, `남은 기한`, `상태 안내`, `AI 분석 정보`, `나눔 신청하기` CTA가 표시됐다.
  - 앱 프로세스는 QA 종료 시점에도 살아 있었다. crash buffer의 Fatal은 앱이 아니라 UIAutomator dump timeout 프로세스였다.
- 충돌:
  - 충돌 문서/공지: 당시 백엔드 Phase 1.5 요약과 프론트 표시 정책은 `GET /fridges/{id}/posts?status=available`의 카드 응답 필드 범위를 명확히 분리하지 않았다. 2026-05-08 백엔드 답변 기준 이 API는 `PostRead`가 아니라 `PostNearbyRead`이다.
  - 실제 기준: 2026-05-07 live VM API와 Android emulator UI.
  - 판단: `GET /fridges/4/posts?status=available`은 1건을 반환했지만 `detectedFruit`, `detectedFruitKo`, `freshnessLabel`이 `null`이었다. 지도 내부 목록은 fallback으로 `나눔 식재료 / 분석 중`을 표시했다.
  - 영향: 냉장고 내부 목록의 선택/상세 이동 UI는 통과했지만, 식재료명/상태 표시 품질은 P0 `Post AI 메타데이터 저장 불일치`가 해결되어야 제품 기대 수준이 된다. `confidenceScore`는 `PostNearbyRead`에 포함되지 않는다.
- 증거:
  - `temp/map-ui-map-loaded.png`
  - `temp/map-ui-fridge-posts.png`
  - `temp/map-ui-fridge-post-detail.png`
- 후속:
  - 백엔드가 Post AI 메타데이터 저장을 수정하면 같은 emulator 흐름에서 `전남대학교 공유냉장고 -> 내부 목록 -> 상세` 표시명을 재검증한다.
  - 주변 냉장고 없음/error fixture는 별도 API/fixture 상태가 필요하므로 후속으로 남긴다.

## 2026-05-07 위치 권한 거부 UX 보강 결과

- 환경: Windows 로컬 워크스페이스, React Native unit test.
- 범위: `LocationSetup`의 Android 위치 권한 `denied`, 재시도 후 `granted`, 설정 열기 fallback.
- 수정:
  - 위치 권한이 거부되면 Alert만 띄우지 않고 화면 안에 `위치 권한이 필요해요` 안내와 `권한 다시 요청`, `설정 열기` CTA를 남긴다.
  - Android `NEVER_ASK_AGAIN`과 iOS 비허용 상태는 설정 이동 중심 안내로 분리한다.
  - 위치 탐색 실패는 `현재 위치를 찾지 못했어요` 상태로 분리하고 `위치 다시 찾기`/`설정 열기`를 제공한다.
  - 좌표가 없을 때 `이 위치로 설정하기`는 비활성화되어 `/auth/me/location`을 호출하지 않는다.
- 검증:
  - `node .\node_modules\jest\bin\jest.js --runTestsByPath .\__tests__\locationSetup.notificationPermission.test.tsx --runInBand`
  - `node .\node_modules\typescript\bin\tsc --noEmit`
  - `node .\node_modules\eslint\bin\eslint.js src\screens\location\LocationSetupScreen.tsx src\screens\location\LocationSetupScreen.styles.ts __tests__\locationSetup.notificationPermission.test.tsx --quiet`
- 남은 QA:
  - 실제 Android 기기에서 시스템 권한 팝업의 `거부`, `다시 묻지 않음`, 설정 복귀 후 재시도 흐름은 실기기 QA로 재확인한다.

## 2026-05-07 AI 응답 흐름 fixture/API smoke QA 결과

- 환경: Windows 로컬 워크스페이스, SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80`, QA 계정 `qa162158@example.com`.
- 준비:
  - `docs/qa-fixtures/`에 커밋 가능한 이미지 fixture를 추가했다.
  - source/license 기록은 `docs/qa-fixtures/SOURCES.md`에 둔다.
  - `large-image`는 로컬 전용 fixture라 커밋하지 않는다.
  - 백엔드 전달용 압축 문서는 [BACKEND_AI_FIXTURE_QA_NOTICE_2026-05-07.md](./BACKEND_AI_FIXTURE_QA_NOTICE_2026-05-07.md)에 둔다.
- 프론트 응답 흐름 QA:
  - `node .\node_modules\jest\bin\jest.js --runTestsByPath .\__tests__\analysisResult.fallback.test.tsx .\__tests__\cameraScan.fallback.test.tsx .\__tests__\postPolicy.test.ts .\__tests__\posts.api.test.ts --runInBand`
  - 4 suites / 45 tests 통과.
  - 검증 범위: `Fresh/Mid`, `Stale`/`isFresh=false`, generate 400, `imageToken` 누락, 낮은 confidence 확인 필요, Post fallback 응답 처리.
  - 낮은 confidence에서 `확인 필요`만 보여주면 실제 false-positive 위험이 충분히 드러나지 않아, 분석 결과 화면과 등록 확인 화면의 보조 문구를 `AI가 나눔 가능으로 분석했지만 실제 상태를 직접 확인한 뒤 등록해주세요.`로 강화했다.
- 실제 AI/API smoke QA:
  - 명령: `FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> node .\scripts\validate-ai-fixtures.js`
  - 분석/기록용 명령: `FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> node .\scripts\validate-ai-fixtures.js --report-only`
  - strict mode는 runnable fixture 실패 시 exit code `1`, report-only mode는 같은 실패를 출력하되 exit code `0`을 반환한다.
  - 통과:
    - `fresh-single`: `바나나`, `Fresh`, confidence `1`.
    - `not-food`: generate 400.
    - `multi-object`: generate 400. 현재 기대값은 대표 객체 1개 또는 review/reject 중 하나라 통과로 분류한다.
  - 실패:
    - `stale-or-rotten`: 썩은 사과 이미지가 `바나나`, `Fresh`, confidence `0.79`로 통과했다.
    - `screenshot-or-ui`: synthetic UI 이미지가 `바나나`, `Fresh`, confidence `1`로 통과했다.
    - `low-quality`: 저품질 바나나 파생 이미지가 `바나나`, `Fresh`, confidence `0.9794`로 통과했다.
  - skipped: `large-image`는 로컬 전용이다.
- 충돌:
  - 충돌 문서/기준: `AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`, `docs/qa-fixtures/manifest.json`은 `stale-or-rotten`, `screenshot-or-ui`, `low-quality`를 거부 또는 확인 필요로 기대한다.
  - 실제 기준: 2026-05-07 live VM API `/posts/generate`.
  - 판단: 실패 3건은 프론트 응답 파싱 오류가 아니라 백엔드/AI 파이프라인 false-positive 또는 confidence 산정 정책 이슈다.
  - 영향: 프론트는 서버가 200 + `Fresh` + `imageToken`을 반환하면 등록 가능 흐름으로 보내는 것이 현재 계약상 맞다. 해당 케이스를 막으려면 백엔드/AI가 400, `isFresh=false`, rejection/review reason, 또는 낮은 confidence를 반환해야 한다.
- 후속:
  - 백엔드/AI에 `stale-or-rotten`, `screenshot-or-ui`, `low-quality` fixture 결과를 공유하고 수정 후 같은 script로 재검증한다.
  - `large-image`는 실제 로컬/기기 업로드 크기 guard QA에서 별도로 검증한다.

## 2026-05-07 QA 후속 검증 결과

- 환경: Windows 로컬 워크스페이스, Android emulator `emulator-5554`, 최신 release APK 재설치 후 진행.
- P0 백엔드 전달용 압축:
  - [BACKEND_AI_FIXTURE_QA_NOTICE_2026-05-07.md](./BACKEND_AI_FIXTURE_QA_NOTICE_2026-05-07.md)를 추가했다.
  - 전달 대상은 `stale-or-rotten`, `screenshot-or-ui`, `low-quality` false-positive와 `fresh-single`, `not-food`, `multi-object` 통과 결과다.
  - 판단 기준: 프론트는 서버가 200 + `Fresh` + `imageToken`을 반환하면 현재 계약상 등록 가능 흐름으로 보내는 것이 맞다. 해당 케이스를 막으려면 백엔드/AI가 400, `isFresh=false`, rejection/review reason, 또는 낮은 confidence를 반환해야 한다.
- P1 실패 결과 표시 보강:
  - `AnalysisResultScreen`과 `PostCreateScreen`의 낮은 confidence 안내 문구를 강화했다.
  - 통과: `node .\node_modules\jest\bin\jest.js --runTestsByPath .\__tests__\analysisResult.fallback.test.tsx .\__tests__\postCreate.reviewNotice.test.tsx .\__tests__\imageUploadPolicy.test.ts --runInBand`
  - 통과: `node .\node_modules\typescript\bin\tsc --noEmit`
- P1 실제 Android 위치 권한 거부 QA:
  - 최신 release APK를 emulator에 설치한 뒤 QA 계정 `qa162158@example.com`으로 로그인했다.
  - `pm revoke`로 `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`을 제거하고 프로필 `동네 위치 재설정`으로 진입했다.
  - Android 권한 팝업에서 `Don't allow`를 선택하면 앱 화면에 `설정에서 위치 권한을 켜주세요`, `설정 열기`, `다시 확인`이 표시됐다.
  - 좌표가 없으므로 `이 위치로 설정하기`는 disabled 상태였고 `/auth/me/location`을 호출할 수 없는 UI 상태였다.
  - `설정 열기` CTA는 Android App info 화면으로 이동했다.
  - 증거: `temp/location-permission-denied-emulator.png`.
  - 남은 범위: 물리 기기에서 `거부`, `다시 묻지 않음`, 설정에서 권한 허용 후 앱 복귀 재시도 흐름은 아직 별도 QA가 필요하다.
- P2 대용량 이미지 local-only QA:
  - `temp/large-image-local-only-20260507.jpg`를 8,388,609 bytes로 생성해 8MB 초과 local-only fixture를 확인했다.
  - `validateImageForUpload()`는 `MAX_UPLOAD_IMAGE_BYTES + 1`을 업로드 전 차단하고 `이미지 용량이 8MB를 초과합니다. 더 작은 사진을 선택하거나 촬영 후 다시 시도해주세요.`를 반환한다.
  - 통과: `node .\node_modules\jest\bin\jest.js --runTestsByPath .\__tests__\imageUploadPolicy.test.ts --runInBand`
  - 이 fixture는 커밋하지 않고 `temp/` 또는 공유 드라이브 증거로만 둔다.

## 2026-05-05 P0/P1 코드 보강 현황

- P0 `authorId/userId` 계약 불일치: `PostDetailScreen`이 `authorId` 기준으로 작성자 여부를 판단하도록 수정했다. 구형 fixture용 `userId` fallback은 `postPolicy`에만 남겼다.
- P0 `canShare=false` 등록 차단: `AnalysisResultScreen` 버튼 disabled, `PostCreateScreen` 진입 후 guard, `FridgeSelectScreen` 최종 등록 guard를 추가했다.
- P1 목록 실패/빈 상태 분리: 홈 주변 나눔 식재료, 지도 냉장고, 등록 가능 냉장고 목록에 loading/error/empty 상태와 retry UI를 분리했다.
- P1 위치 재설정: 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다.
- P1 위치 권한 거부 UX: `LocationSetup`에서 권한 거부/영구 거부/위치 탐색 실패를 화면 상태로 분리하고 재시도/설정 열기 CTA를 제공한다.
- P1 위치 미설정 공통 가드: 홈, 지도, AI 스캔 진입점, 냉장고 선택 화면이 `getRegisteredLocation()` 기준을 공유한다. 위치가 없으면 주변 API를 호출하지 않고 `LocationSetup` CTA를 표시한다.
- P1 등록 완료 후 홈 재조회: `PostCompleteScreen`이 홈 탭에 `nearbyPostsRefreshToken`을 전달하고, `HomeScreen`은 포커스/토큰 변경 시 `/posts/nearby`를 다시 조회한다.
- P1 카메라 촬영/fallback: `react-native-vision-camera@5`의 `usePhotoOutput().capturePhotoToFile()` 경로로 수정했다. 에뮬레이터와 실제 Android 기기에서 촬영 파일 생성 및 실제 `/posts/generate` 호출까지 확인했다. 무기기 fallback 자동 테스트와 2026-05-08 실기기 camera/gallery closeout을 완료했다. `stale-or-rotten`/`low-quality` false-positive는 MVP blocker가 아니라 Post-MVP AI 계약 항목이다.
- P1 confidence: `confidenceScore`를 분석 결과/작성 화면에 표시하고, 제품 기준을 `confidenceScore < 0.9`이면 `확인 필요`로 확정했다. 낮은 confidence만으로 등록을 차단하지 않는다.
- P0 Post 구조 변경: `Post`/`PostCreateData`/`GenerateResult` 타입과 `createPost()` payload를 백엔드 Phase 1.5 계약으로 갱신했다. 홈/냉장고 카드는 `PostNearbyRead` 기준 `detectedFruitKo`, `freshnessLabel`, `status`를 사용하고, 상세 화면과 등록 확인 화면은 `confidenceScore`까지 표시한다. 구형 `title/description/category` 표시/전송 의존은 제거했다.
- P1 나눔 신청 API: `requestShare(postId)` client와 `PostDetailScreen` CTA를 연결했다. 201 응답은 `post.status=requested`를 상세에 반영하고 홈 refresh 신호를 보낸다. 403은 `내가 등록한 나눔 식재료예요`, 409는 `다른 사용자가 먼저 신청했어요`로 처리하고 CTA를 `신청 접수` 상태로 비활성화한다.
- P1 냉장고별 나눔 식재료 조회: `getFridgePosts(fridgeId, 'available')` client와 `MapScreen` 선택 냉장고 내부 목록을 연결했다. 내부 목록은 loading/error/empty/list 상태를 냉장고 목록 상태와 분리하고, 항목 탭 시 `PostDetail`로 이동한다.
- 회귀 테스트: `__tests__/postPolicy.test.ts`에서 품질 정책, confidence, 작성자 판단을 고정한다. `__tests__/postComplete.navigation.test.tsx`, `__tests__/home.nearbyRefresh.test.tsx`에서 등록 완료 홈 복귀와 `/posts/nearby` 재조회 신호를 고정한다.
- AI QA fixture/실기기 체크리스트: [AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)에 성공/실패/false-positive/대용량/실제 기기 촬영 검증 기준을 정리했다.

## 권장 작업 순서

1. MVP 핵심 플로우 검증
2. 실패 케이스와 예외 처리 검증
3. AI 파이프라인 데이터 흐름 검증
4. 한 장 촬영 UX와 multi-object 정책 정리
5. 미구현 기능 상태 점검
6. 다음 스프린트 백로그 재분류

## 1. MVP 핵심 플로우 검증

### 목표

`로그인 -> 최초 위치 등록 -> 사진 촬영 -> AI 분석 -> 나눔 식재료 등록 -> 홈/지도 반영` 흐름이 실제 앱에서 끝까지 이어지는지 확인한다.

### To-do

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

### 산출물

- 핵심 플로우 검증 결과 표
- 발견한 버그 목록
- 다음 스프린트에서 반드시 고칠 항목 목록

### 검증 결과 (2026-05-05)

#### 검증 환경

- API: SSH 터널 `localhost:8080 -> NHN-Cloud-Server:80`, `/docs` 200 확인
- 앱: Android 에뮬레이터 `Medium_Phone_API_36.1`, `com.greennode`, Metro `0.0.0.0:8081`
- 초기 점검 계정: `codex_ui_20260505160056@example.com`
- 실제 파이프라인 재검증 계정: `codexreal202605051720@example.com`
- APK: release APK 재빌드 후 설치, `android/app/build/outputs/apk/release/app-release.apk`
- 기준 코드: `USE_MOCK_AI_PIPELINE` 제거 후 `src/api/posts.ts`의 `generatePost()`와 `createPost()`가 실제 API를 호출
- Android 네트워크: MVP HTTP 터널 검증을 위해 `AndroidManifest.xml`의 `usesCleartextTraffic`을 `true`로 설정. 운영 배포 전에는 HTTPS 또는 범위 제한된 network security config로 되돌릴 필요가 있다.
- 용어 기준: `default_location`이라는 도메인 필드는 쓰지 않는다. 사용자의 **동네 위치**는 `User.latitude`, `User.longitude`가 `null`인지로 등록 여부를 판단한다.

#### 핵심 플로우 검증 결과 표

| 항목                                       | 분류                       | 검증 결과                                                                                                                                                                                                                                                   | 근거/관련 위치                                                                                                                                                      | 다음 액션                                                    |
| ------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 로그인 시 유저 생성                        | 정상 동작                  | 신규 이메일 계정을 API로 생성하면 `latitude`, `longitude`가 `null`인 유저가 생성된다. 앱 이메일 로그인도 성공한다.                                                                                                                                          | `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `src/screens/auth/SignupScreen.tsx`, `src/screens/auth/LoginEmailScreen.tsx`                                 | 소셜 로그인에서 "로그인 시 유저 생성" 정책은 별도 검증 필요  |
| 기존 유저 재로그인 시 유저 정보 업데이트   | 정상 동작                  | 로그인 후 `getMe()`로 최신 유저 정보를 받아 `authStore`에 반영한다. 위치가 있는 유저는 `refreshDeviceRegistration()`으로 위치 좌표를 갱신한다. 이 자동 갱신 경로는 알림 권한 요청을 열지 않으며, 기존 `fcmToken`이 있을 때만 함께 보낸다.                   | `src/screens/auth/LoginEmailScreen.tsx`, `src/store/authStore.ts`, `src/services/deviceRegistration.ts`                                                             | 실제 FCM 토큰 재발급/회전 처리는 후속 검토                  |
| 최초 로그인 직후 동네 위치 미설정          | 정상 동작                  | 검증 계정 생성 직후 서버 응답과 `/auth/me`에서 `latitude = null`, `longitude = null` 확인.                                                                                                                                                                  | `GET /api/v1/auth/me`                                                                                                                                               | 유지                                                         |
| 동네 위치 미설정 상태의 홈 화면            | 수정됨                     | 정상 UI 흐름에서는 위치 없는 유저가 `LocationSetup`으로 이동한다. 강제 진입 시에도 홈은 `/posts/nearby`를 호출하지 않고 위치 설정 CTA를 보여준다.                                                                                                           | `src/screens/home/HomeScreen.tsx`, `src/utils/locationGuard.ts`, `__tests__/locationGuard.test.ts`                                                                  | 에뮬레이터 강제 진입 QA                                      |
| 동네 위치 미설정 상태의 지도 화면          | 수정됨                     | 지도 탭 강제 진입 시 `MapView`를 렌더링하지 않는다. 광주 전남대 기본 좌표 fallback과 반경 원 표시를 제거하고 위치 설정 CTA만 보여준다.                                                                                                                      | `src/screens/map/MapScreen.tsx`, `src/screens/map/MapScreen.styles.ts`, `src/utils/locationGuard.ts`                                                                | 에뮬레이터 강제 진입 QA                                      |
| 동네 위치 미설정 상태의 검색 화면          | 미구현                     | 독립 검색 화면이 없다. 홈 검색 아이콘과 지도 검색 입력 UI만 있고 검색 플로우는 연결되어 있지 않다.                                                                                                                                                          | `src/screens/home/HomeScreen.tsx`, `src/screens/map/MapScreen.tsx`                                                                                                  | 검색 기능은 5번 미구현 기능 점검에서 백로그화                |
| 동네 위치 미설정 상태의 나눔 식재료 등록   | 수정됨                     | 홈/중앙 AI 스캔 진입점은 위치가 없으면 `CameraScan` 대신 `LocationSetup`으로 보낸다. `FridgeSelect`에 직접 진입해도 냉장고 API를 호출하지 않고 위치 설정 CTA를 표시한다.                                                                                    | `src/navigation/MainTab.tsx`, `src/screens/home/HomeScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`, `src/utils/locationGuard.ts`                            | 에뮬레이터 강제 진입 QA                                      |
| 최초 위치 등록 화면 분기                   | 정상 동작                  | 위치 없는 계정으로 로그인 후 앱이 `동네 설정` 화면으로 자연스럽게 이동했다.                                                                                                                                                                                 | UI 검증, `src/screens/auth/LoginEmailScreen.tsx`, `src/navigation/AppNavigator.tsx`                                                                                 | 유지                                                         |
| 위치 등록 후 홈/지도/나눔 식재료 등록 반영 | 정상 동작                  | `이 위치로 설정하기` 후 `/auth/me`에 좌표가 저장됐다. 홈은 `내 동네`로 표시되고, 지도와 냉장고 선택 화면은 실제 냉장고 목록을 조회했다.                                                                                                                     | `PUT /api/v1/auth/me/location`, `HomeScreen`, `MapScreen`, `FridgeSelectScreen`                                                                                     | 유지                                                         |
| 위치 재설정 기능                           | 정상 동작                  | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다.                                                                                                                                                                           | `src/screens/home/HomeScreen.tsx`, `src/screens/profile/ProfileScreen.tsx`, `src/screens/location/LocationSetupScreen.tsx`                                          | 권한 거부 상태 전용 CTA 보강                                 |
| 사진 촬영 후 이미지 파일 생성              | 정상 동작                  | `takePhoto()` 호출을 `usePhotoOutput().capturePhotoToFile()`로 수정한 뒤 에뮬레이터 셔터에서 `file:///data/user/0/com.greennode/cache/VisionCamera_*.jpg` 파일 URI가 생성됐다.                                                                              | UI 검증, `src/screens/camera/CameraScanScreen.tsx`, logcat                                                                                                          | 실제 기기 촬영 검증                                          |
| 촬영/선택 이미지 API 전달                  | 정상 동작                  | mock 제거 후 release 앱에서 갤러리 선택 이미지와 셔터 촬영 이미지가 실제 `POST /api/v1/posts/generate`로 전달됐다. 셔터 촬영 재검증에서는 서버가 나눔 기준 미충족 상태 400으로 거부해 API 도달이 확인됐다.                                                  | `src/api/posts.ts`, `src/screens/camera/CameraScanScreen.tsx`, logcat                                                                                               | 나눔 기준 미충족/실패 응답 전용 UX 보강                      |
| AI 분석 결과 표시                          | 정상 동작                  | 실제 AI 응답이 `분석 결과` 화면에 표시됐다. 재검증 결과는 `바나나`, `신선`, confidence 100%, 분석 메모 `식재료가 신선합니다. 나눔이 가능합니다.`였다. mock 고정값인 `사과`가 아니었다.                                                                      | `src/screens/camera/AnalysisResultScreen.tsx`                                                                                                                       | `Stale` fixture로 나눔 기준 미충족 결과 추가 검증            |
| AI 결과의 나눔 식재료 생성 기본값 반영     | 정상 동작                  | 실제 AI 응답 기반으로 `나눔 등록` 화면에 `바나나`, `신선`, 제목 `신선한 바나나 나눔합니다`, 설명 기본값이 채워졌다.                                                                                                                                         | `src/screens/post/PostCreateScreen.tsx`                                                                                                                             | 유지                                                         |
| 나눔 식재료 등록 후 홈 목록 반영           | 구현됨, 런타임 재검증 필요 | 냉장고 선택 후 실제 `POST /api/v1/posts` 성공과 완료 화면 표시까지 확인했다. 코드상 완료 화면의 홈 복귀는 홈 탭에 `nearbyPostsRefreshToken`을 전달하고, 홈은 포커스/토큰 변경 시 `/posts/nearby`를 재조회한다.                                              | `src/screens/post/PostCompleteScreen.tsx`, `src/screens/home/HomeScreen.tsx`, `__tests__/postComplete.navigation.test.tsx`, `__tests__/home.nearbyRefresh.test.tsx` | 실제 앱에서 등록 직후 홈 목록 반영을 한 번 더 재검증         |
| 나눔 식재료 등록 후 지도/냉장고 관련 반영  | 구현됨, 런타임 재검증 필요 | 냉장고 선택 화면에서 실제 냉장고 목록 `광주역 공유냉장고`, `충장로 공유냉장고`, `전남대학교 공유냉장고`가 표시됐고, 선택한 냉장고로 실제 나눔 식재료 생성까지 성공했다. 코드상 지도는 냉장고 선택 시 `GET /fridges/{id}/posts?status=available`로 내부 available 목록을 조회하고 상세 이동을 제공한다. | `src/api/fridges.ts`, `src/screens/map/MapScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`, `__tests__/map.fridgePosts.test.tsx`                              | 실제 앱에서 등록 직후 해당 냉장고 선택 시 목록 반영 검증 |

#### 해결/잔여 버그 목록

1. 해결됨: `USE_MOCK_AI_PIPELINE`을 제거했고, `generatePost()`와 `createPost()`가 실제 서버를 호출하도록 수정했다. 실제 앱에서 AI 분석, 나눔 식재료 생성, 완료 화면까지 검증했고 테스트 나눔 식재료은 삭제했다.
2. 해결됨: 에뮬레이터 셔터 촬영 TypeError는 `react-native-vision-camera@5` API 변경에 맞춰 수정했고, 촬영 파일 생성 및 실제 API 호출까지 확인했다.
3. 해결됨: 위치 없는 유저가 홈/지도/냉장고 선택에 강제 진입해도 기본 좌표로 주변 API를 호출하지 않는다. 지도는 `MapView` 자체를 렌더링하지 않고, 홈/지도/냉장고 선택은 위치 설정 CTA를 표시한다.

#### 다음 스프린트에서 반드시 고칠 항목

1. 나눔 기준 미충족 상태(`canShare=false`)에서 실제 등록 화면 진입과 최종 등록을 차단하는 가드를 추가한다.
2. 실제 기기에서 카메라 촬영 파일 생성과 `react-native-vision-camera` 설정을 검증한다. 에뮬레이터에서는 갤러리 선택 fallback을 검증 경로로 명시한다.
3. 완료: 위치 미설정 상태에서 홈/지도/나눔 식재료 등록에 강제 진입했을 때 위치 등록 CTA로 되돌리는 공통 가드를 추가한다.
4. 완료: 위치 재설정 진입점을 프로필과 홈 위치 헤더에 연결한다.
5. 독립 검색 화면/검색 결과 상태는 현재 미구현으로 분리해 다음 스프린트 백로그에 넣는다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "1. MVP 핵심 플로우 검증"을 기준으로 현재 코드에서 로그인, 위치 등록, 사진 촬영, AI 분석, 나눔 식재료 등록 흐름을 추적해줘.

코드를 먼저 읽고 실제 플로우를 설명한 뒤, 각 체크 항목이 현재 구현상 가능한지/불가능한지/검증이 필요한지 분류해줘. 필요한 경우 에뮬레이터나 로그를 사용해서 검증하고, 결과를 문서에 업데이트해줘.
```

## 2. 실패 케이스와 예외 처리 검증

### 목표

MVP가 성공 케이스만 동작하는 상태인지, 실패 상황에서도 앱이 멈추지 않고 사용자에게 적절한 안내를 하는지 확인한다.

### To-do

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

### 산출물

- 실패 케이스별 현재 동작 기록
- 사용자에게 보여줄 문구/대안이 필요한 곳 목록
- 서버/API/AI 실패 시 보완해야 할 에러 핸들링 목록

### 검증 결과 (2026-05-05)

#### 검증 범위

- 코드 점검: `src/screens/camera/*`, `src/screens/post/*`, `src/screens/location/*`, `src/screens/home/HomeScreen.tsx`, `src/screens/map/MapScreen.tsx`, `src/api/posts.ts`, `src/api/client.ts`, `src/config/api.ts`
- 직접 API 확인:
  - `/docs` 응답 200
  - 잘못된 `imageToken`으로 나눔 식재료 생성 요청 시 HTTP 400, `이미지가 만료되었거나 유효하지 않습니다. 다시 촬영해주세요.` 반환
  - 작성자 A가 만든 임시 나눔 식재료를 사용자 B 토큰으로 삭제 요청 시 HTTP 403, `권한이 없습니다.` 반환
  - 임시 나눔 식재료은 작성자 토큰으로 삭제 완료
- 앱 동작 참고: 1번 MVP 핵심 플로우 검증에서 에뮬레이터 홈 빈 상태, 갤러리 업로드 플로우, 위치 설정 이후 홈/지도/냉장고 흐름 확인
- mock 제거 후 추가 확인: release 앱에서 실제 AI 분석(`바나나`/`신선`)과 실제 나눔 식재료 생성(id `6`, 검증 후 삭제)을 확인
- 미실행: 실제 네트워크 차단, OS 권한 revoke, 대용량 이미지 업로드는 이번 단계에서 코드 기준으로 판정했다.

#### 항목별 현재 동작

| 항목                            | 판정                             | 현재 동작/근거                                                                                                                                                                                        | 후속 작업                                                                                         |
| ------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 나눔 기준 미충족 등록 차단      | 구현됨                           | `AnalysisResultScreen`은 `canShare=false`일 때 CTA를 disabled 처리하고, `PostCreateScreen`/`FridgeSelectScreen`에도 최종 품질 가드가 있다.                                                            | `Stale` fixture로 회귀 검증                                                                       |
| 나눔 기준 미충족 실패 이유 표시 | 구현됨, fixture 검증 필요        | `generatePost` 실패나 서버 에러는 FastAPI `detail`을 Alert에 표시한다. 2026-05-08 백엔드 답변 기준 generate 400의 안정 필드는 `detail`뿐이다. 실제 `Stale` fixture는 아직 확보하지 못했다.             | `Stale` fixture 또는 테스트 이미지를 확보하고, 나눔 기준 미충족 사유 문구를 실제 앱에서 검증한다. |
| 실패 후 대안 흐름               | 부분 구현                        | 분석 결과 화면에는 재촬영과 작성 화면 진입이 있다. generate 실패 Alert는 `다시 촬영`/`갤러리 선택` 대안을 제공한다. 수동 입력 CTA는 아직 없다.                                                        | 실패 Alert에 수동 입력 선택지를 추가할지 결정한다.                                                |
| API 서버 연결 실패              | 부분 구현                        | 홈/지도/냉장고 목록은 error/empty 상태와 retry UI를 분리했다. 위치 등록, 나눔 식재료 상세, 나눔 식재료 생성은 여전히 화면별 Alert 중심이다.                                                           | API 오류 문구 추출과 retry 패턴을 공통화한다.                                                     |
| AI 서버 연결 실패               | 추가 검증 필요                   | `postMultipart`는 네트워크 오류와 30초 타임아웃을 reject하고 `CameraScanScreen`이 Alert를 띄운다. mock 제거 후 실제 성공 경로는 검증했지만, AI 서버 중단/타임아웃 fault injection은 아직 하지 않았다. | AI 서버 중단/타임아웃 케이스를 실제 환경에서 재검증한다.                                          |
| 네트워크 끊김                   | 미흡                             | 공통 offline 상태가 없고, 화면별로 Alert 또는 로그만 남긴다. 홈/지도는 실패가 빈 상태처럼 보일 수 있다.                                                                                               | 공통 네트워크 에러 문구와 retry 패턴을 정한다.                                                    |
| 중복 등록 방지                  | 부분 구현                        | `FridgeSelectScreen`은 `isSubmitting`과 ref 기반 re-entry guard로 같은 화면의 빠른 중복 제출을 막는다. 서버 idempotency는 아직 없다.                                                                  | 서버에도 idempotency key 또는 중복 방지 기준을 검토한다.                                          |
| 큰 이미지 업로드                | 부분 구현                        | 갤러리 선택은 2048px 리사이즈, `quality: 0.8`, 8MB 초과 업로드 전 차단을 적용한다. 업로드 진행률은 아직 없다.                                                                                         | 실제 대용량 fixture로 차단 문구와 앱 멈춤 여부를 검증한다.                                        |
| 카메라 권한 거부                | 미흡                             | 권한이 없으면 `카메라 권한이 필요합니다.` 문구만 보인다. 권한 재요청, 설정 이동, 갤러리 대체 버튼이 없다. 카메라 장치가 없을 때만 갤러리 fallback이 있다.                                             | 권한 거부 화면에 다시 요청/설정 열기/갤러리 선택을 제공한다.                                      |
| 위치 권한 거부                  | 구현됨                           | 2026-05-07 보강 후 권한 거부/영구 거부/위치 탐색 실패를 화면 상태로 분리했다. `설정 열기`, `다시 확인`, 좌표 없음 저장 비활성화를 제공한다.                                                         | 실제 기기/에뮬레이터 회귀 시나리오 유지                                                           |
| 주변 냉장고 없음                | 구현됨, 실제 좌표 추가 검증 필요 | `FridgeSelectScreen`과 `MapScreen`에 빈 상태 문구가 있다. 실제 냉장고가 없는 좌표를 넣은 에뮬레이터 검증은 아직 하지 않았다.                                                                          | 테스트용 no-fridge 좌표 또는 fixture로 빈 상태를 재현한다.                                        |
| 나눔 식재료 없음                | 구현됨                           | 1번 검증에서 홈 화면이 `아직 근처에 나눔이 없어요` 빈 상태를 표시했다.                                                                                                                                | 없음.                                                                                             |
| 검색 결과 없음                  | 구현됨                           | 홈 검색 아이콘은 지도 탭으로 이동하고, 지도 검색 입력은 공유 냉장고 이름/주소를 로컬 필터링한다. 결과가 없으면 빈 상태와 검색 초기화를 제공한다.                                                      | 서버 검색/나눔 식재료 검색은 후속 범위로 분리한다.                                                |
| 타 유저 수정/삭제 차단          | 부분 구현                        | 상세 화면은 작성자일 때만 삭제 버튼을 보여준다. 직접 API 검증에서도 타 사용자 삭제는 HTTP 403으로 막혔다. 수정 기능은 아직 화면/API 흐름이 없어 검증 대상에서 제외된다.                               | 수정 기능을 만들 때 동일한 소유자 가드를 적용하고, 403 UX를 통일한다.                             |

#### 버그/미구현 후보

- 나눔 기준 미충족 등록 차단은 구현됐고, 서버 400 `detail` Alert도 2026-05-08 실기기 camera 실패 경로에서 확인했다. `stale-or-rotten` fixture가 Fresh로 통과하는 문제는 Post-MVP AI 품질/계약 항목이다.
- mock 파이프라인은 제거되어 실제 성공 경로와 generate 400 실패 경로를 확인했다. AI 장애와 중복 생성 같은 실패 경로는 별도 재현이 필요하다.
- 홈/지도/냉장고 목록 조회 실패는 error/empty 상태가 분리됐지만, 네트워크 끊김/공통 오류 문구는 아직 화면별로 흩어져 있다.
- 위치 권한 거부 후 대체 흐름은 2026-05-07에 보강했다. 카메라 권한 거부 후 대체 UX는 별도 backlog로 남긴다.
- 검색 결과 없음 상태는 지도 공유 냉장고 로컬 검색 기준으로 구현했다.
- 대용량 이미지는 8MB 초과 업로드 전 차단을 추가했다. 네트워크 끊김 UX와 업로드 진행률은 아직 없다.

#### 다음 스프린트 처리 제안

- 우선순위 1: `Stale` fixture 확보, 나눔 기준 미충족 실패 사유 실제 앱 검증, 실제 나눔 식재료 생성의 중복 방지 검증
- 우선순위 2: API/AI/네트워크 실패 공통 UX, 권한 거부 대체 흐름, 목록 화면 retry 상태
- 우선순위 3: 서버 idempotency, 네트워크 끊김 UX, 업로드 진행률, 검색 서버 확장 여부 결정

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "2. 실패 케이스와 예외 처리 검증"을 기준으로 현재 앱의 예외 처리 상태를 점검해줘.

특히 나눔 기준 미충족 상태(`Stale`)일 때 나눔 식재료 등록 실패 처리, API/AI 서버 실패 처리, 권한 거부 처리, 중복 등록 방지를 중점적으로 봐줘. 실제 코드 위치와 함께 버그/미구현/정책 결정 필요 항목으로 분류해줘.
```

## 3. AI 파이프라인 데이터 흐름 검증

### 목표

사진이 앱에서 서버와 AI 파이프라인을 거치며 어떤 데이터로 변환되는지 확인하고, 현재 모델이 어떤 판단을 하는지 검증한다.

### To-do

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

### 테스트 이미지 후보

- [x] 음식 하나가 선명하게 찍힌 사진
- [ ] 음식 여러 개가 함께 찍힌 사진
- [ ] 어두운 사진
- [ ] 흔들린 사진
- [ ] 너무 가까운 사진
- [ ] 너무 먼 사진
- [ ] 포장재가 있는 사진
- [ ] 라벨이나 유통기한이 보이는 사진
- [ ] 내부 상태가 보이지 않는 사진

### 산출물

- 앱 -> API -> AI -> API -> 앱 데이터 흐름 요약
- 실제 request/response 예시
- AI 결과 필드 설명
- multi-object detection 적용 가능 지점
- 다음 스프린트에서 보강할 AI 관련 작업 목록

### 검증 결과 (2026-05-05)

#### 검증 범위

- 앱 코드: `CameraScanScreen`, `posts.ts`, `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`, `types/post.ts`
- API 계약: `GET /openapi.json`
- 실제 API 호출: `POST /api/v1/posts/generate`
- 실제 앱 흐름 참고: 1번 MVP 검증에서 release 앱으로 갤러리 이미지 선택 후 `바나나`/`신선` 결과와 실제 나눔 식재료 생성 확인
- 당시 미검증: API 서버 내부에서 AI 서버로 넘기는 raw payload, raw AI 서버 응답, multi-object 이미지 결과. 이후 multi-object fixture는 VM API에서 400 거부로 관찰했다.

#### 앱 -> API -> 앱 데이터 흐름

1. `CameraScanScreen`에서 이미지가 준비된다.
   - 카메라 촬영: `file://${photo.path}`, 기본 `type='image/jpeg'`, `name='photo.jpg'`
   - 갤러리 선택: `asset.uri`, `asset.type`, `asset.fileName`
   - 갤러리는 `quality: 0.8`만 지정하며 최대 해상도/파일 크기 제한은 없다.
2. `generatePost()`가 `multipart/form-data`를 만든다.
   - 필수 필드: `image`
   - 선택 필드: `user_hint`
   - 인증: `Authorization: Bearer {token}`
   - 전송: `XMLHttpRequest`, timeout 30초
3. 서버가 `PostGenerateResult`를 반환한다.
   - 백엔드 Phase 1.5 이전 응답에는 `suggestedTitle`, `suggestedDescription`, `suggestedCategory`가 있었지만, 현재 백엔드는 LLM 비활성화와 Post 구조 제거 방향으로 바뀌었다.
   - 감지 객체 필드: `detectedFruit`, `detectedFruitKo`
   - AI/신선도 필드: `isFresh`, `freshnessLabel`, `confidenceScore`, `aiAnalysis.isFresh`, `aiAnalysis.category`, `analysisMessage`, `analysisSkipped`
   - 최종 등록 연결 필드: `imageToken`
4. `AnalysisResultScreen`은 route param의 `result`와 `imageUri`만 사용한다.
   - 현재 앱은 `aiAnalysis.category`를 `fresh/good`, `normal/mid/medium`, `rotten/stale/bad`로 방어 매핑한다.
   - 새 백엔드 기준은 `Fresh/Mid/Stale`이며, `Mid`는 `Normal` 그룹으로 처리해야 한다.
   - `confidenceScore`는 화면 표시와 `확인 필요` 분기에만 쓰고 단독 차단 조건으로 직접 사용하지 않는다.
5. `PostCreateScreen`은 AI 응답을 나눔 식재료 초깃값으로 변환한다.
   - 2026-05-05 당시 앱은 제목/설명/카테고리: `suggestedTitle`, `suggestedDescription`, `suggestedCategory`에 의존했다.
   - 현재 앱은 백엔드 Phase 1.5 이후 Post 저장 구조에 맞춰 구형 작성 필드 의존을 제거했고, `detectedFruitKo`, `freshnessLabel`, `confidenceScore` 중심으로 표시한다.
   - 판별 농산물: `detectedFruitKo || aiAnalysis.detectedFruitKo || detectedFruit || aiAnalysis.detectedFruit`
   - 이미지 원본은 다시 보내지 않고 `imageToken`만 다음 화면으로 넘긴다.
6. `FridgeSelectScreen`은 냉장고 선택 후 `POST /api/v1/posts`를 호출한다.
   - 현재 서버 OpenAPI 기준 content type은 `application/x-www-form-urlencoded`
   - 2026-05-05 당시 앱 body는 `data=<JSON 문자열>`이고 JSON 안에 `title`, `description`, `category`, `fridgeId`, `expirationDate`, `imageToken`을 넣었다.
   - 현재 앱 body는 `data=<JSON 문자열>` 안에 `fridgeId`, `expirationDate`, `imageToken`만 넣는다. 2026-05-08 VM/API에서 이 payload로 sidecar AI 메타데이터 복원이 통과했다.

#### 실제 request/response 예시

요청:

```text
POST /api/v1/posts/generate
Authorization: Bearer {token}
Content-Type: multipart/form-data

image=@android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png; type=image/png
```

응답 요약(2026-05-05 검증 당시 예시, Phase 1.5 이전 구형 suggested 필드 포함):

```json
{
  "success": true,
  "message": "나눔 식재료 자동 생성이 완료되었습니다.",
  "data": {
    "suggestedTitle": "신선한 사과 나눔합니다",
    "suggestedDescription": "AI 분석 결과: Fresh (신뢰도 100%). 사과을(를) 나눔합니다. 관심 있으신 분은 연락주세요!",
    "suggestedCategory": "기타",
    "detectedFruit": "apple",
    "detectedFruitKo": "사과",
    "aiAnalysis": {
      "isFresh": true,
      "confidenceScore": 1.0,
      "category": "Fresh",
      "analysisMessage": "식재료가 신선합니다. 나눔이 가능합니다.",
      "detectedFruit": "apple",
      "detectedFruitKo": "사과",
      "analysisSkipped": false
    },
    "isAutoGenerated": false,
    "imageToken": "dcf7...510e"
  }
}
```

#### 확인된 판단

| 항목                       | 결론                                     | 근거                                                                                                                                                                                 | 후속 작업                                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 앱 이미지 데이터           | 확인됨                                   | 카메라/갤러리 모두 `{uri, type, name}` 형태로 `generatePost()`에 전달된다.                                                                                                           | 파일 크기/해상도/압축 정책 추가                                                        |
| generate request           | 확인됨                                   | OpenAPI는 `multipart/form-data`, `image` 필수, `user_hint` 선택으로 정의한다.                                                                                                        | `API_INTEGRATION_CONTRACT.md` 갱신 완료. 앱/서버 category enum 정합성은 별도 구현 필요 |
| API -> AI 내부 payload     | 미확인                                   | 현재 repo에는 백엔드/AI 서버 코드가 없다. OpenAPI도 앱과 API 서버 사이 계약만 보여준다.                                                                                              | 백엔드 코드 또는 서버 로그로 별도 검증                                                 |
| raw AI 서버 응답           | 미확인                                   | 앱이 받는 것은 API 서버가 정리한 `PostGenerateResult`이다.                                                                                                                           | AI 서버 원 응답 schema 확보                                                            |
| 대표 객체 처리             | 현재 계약은 단일 객체                    | 응답 schema가 `detectedFruit`/`detectedFruitKo` 단일 문자열만 제공한다. 배열, bounding box, object id 필드가 없다.                                                                   | multi-object를 하려면 `detections[]` 같은 새 계약 필요                                 |
| multi-object 실제 성능     | 미확인                                   | 여러 음식이 있는 테스트 이미지를 아직 호출하지 않았다.                                                                                                                               | 테스트 이미지 세트 준비 후 generate 반복 검증                                          |
| confidence                 | 정의 확정, 화면 표시/확인 필요 분기 구현 | `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률이다. 분석 결과/작성 화면에 표시되고, `0.9` 미만은 `확인 필요`로 분기한다. 단, confidence만으로 즉시 등록 차단하지는 않는다. | 0.4/0.7/1.0 fixture로 사용자 확인 UX 검증                                              |
| 신선도 등급                | 백엔드 enum 확정                         | 백엔드 값은 `Fresh/Mid/Stale`이다. `Fresh/Mid`는 나눔 가능, `Stale`은 나눔 기준 미충족이다. 앱의 `normal/mid/medium`, `bad/rotten` 매핑은 방어적 호환으로 유지할 수 있다.            | `Fresh/Mid/Stale` fixture로 서버와 앱 매핑을 고정                                      |
| 나눔 기준 미충족 등록 가드 | 구현됨                                   | `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`에서 `canShare=false`일 때 등록 진행과 최종 등록을 차단한다.                                                         | `Stale` fixture로 회귀 검증                                                            |

#### 다음 스프린트 AI 보강 작업 후보

1. category enum 정합성 고정: 백엔드 기준 `Fresh/Mid/Stale`과 앱 품질 라벨 매핑을 테스트로 고정한다.
2. `Stale` 테스트 fixture 확보: `Fresh/Mid` 외에 `Stale` 응답을 실제 이미지 또는 서버 fixture로 재현한다.
3. confidence UX 보강: 제품 기준은 90%로 확정했다. 낮은 confidence일 때 재촬영 강조, 수동 입력, 단순 확인 중 어떤 CTA를 둘지 추가로 정한다.
4. 나눔 기준 미충족 등록 차단 회귀 검증: `canShare=false`일 때 화면 이동과 최종 등록이 계속 막히는지 `Stale` fixture로 확인한다.
5. multi-object 연구 항목 분리: 현재 계약은 단일 객체이므로 다음 스프린트에서는 `detections[]` 응답 구조와 UI 표시 방식을 먼저 설계한다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "3. AI 파이프라인 데이터 흐름 검증"을 기준으로 이미지 업로드부터 AI 응답이 나눔 식재료 생성 데이터로 바뀌는 과정을 추적해줘.

관련 코드 파일, request/response 형태, 현재 사용되는 AI 결과 필드, 나눔 기준 미충족 상태(`Stale`)일 때 차단되는 위치를 정리해줘. 가능하면 로그를 추가하거나 기존 로그를 확인해서 실제 데이터 예시도 남겨줘.
```

## 4. 한 장 촬영 UX와 multi-object 정책 정리

### 목표

교수님 피드백인 multi-object detection 적용 가능성과, 세이님 피드백인 한 장 촬영 흐름의 리스크를 다음 스프린트 정책으로 정리한다.

### To-do

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

### 권장 정책 초안

- 기본 흐름은 한 장 촬영으로 유지한다.
- AI confidence가 낮거나, 여러 객체가 감지되거나, 신선도/나눔 기준 판단이 불확실하면 추가 확인을 요구한다.
- 추가 확인은 처음부터 여러 장 촬영을 강제하기보다 재촬영 또는 수동 수정으로 처리한다.
- multi-object detection은 바로 필수 기능으로 넣기보다, 먼저 현재 파이프라인에 붙일 수 있는 지점과 판단 기준을 검증한다.

### 검증 결과 (2026-05-05)

#### 검증 범위

- 코드: `src/screens/home/HomeScreen.tsx`, `src/screens/camera/CameraScanScreen.tsx`, `src/screens/camera/AnalysisResultScreen.tsx`, `src/screens/post/PostCreateScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`, `src/api/posts.ts`, `src/types/post.ts`
- API 계약: `GET /openapi.json`의 `POST /api/v1/posts/generate`, `PostGenerateResult`, `PostAIResult`
- 실제 UI: Android 에뮬레이터 `com.greennode` 홈 -> `AI 신선도 스캔` -> 카메라 화면
- 캡처 근거: `temp/section4-scan-screen.png`

#### 구현 상태 요약

| 항목                                    | 분류                              | 검증 결과                                                                                                                                                                    | 근거/관련 위치                                                           | 다음 액션                                                        |
| --------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 한 장 촬영 기본 흐름                    | 정상 동작                         | 현재 앱은 사진 1장을 `POST /api/v1/posts/generate`에 보내고, 결과 1개를 분석 결과/나눔 식재료 작성 화면으로 넘긴다. 홈 화면 문구도 `사진 한 장으로 나눔 가능 여부 확인`이다. | `CameraScanScreen.processImage()`, `generatePost()`, `HomeScreen` UI     | MVP 기본 흐름은 한 장 촬영으로 유지                              |
| 한 장으로 충분한 케이스                 | 정책 결정 필요                    | 외관이 잘 보이는 단일 과일/채소, 포장 밖에서 상태를 충분히 볼 수 있는 식재료는 한 장 촬영으로 처리 가능하다. 현재 실제 검증도 단일 대표 객체 응답을 전제로 통과했다.         | `GenerateResult.detectedFruit`, `aiAnalysis.category`                    | 데모/검증 이미지는 단일 객체 중심으로 준비                       |
| 한 장으로 어려운 케이스                 | 정책 결정 필요                    | 유통기한 라벨, 포장 내부 상태, 절단면, 냄새/촉감, 캔/불투명 포장, 어두움/흔들림/가림, 여러 음식이 섞인 사진은 한 장만으로 신뢰하기 어렵다.                                   | 현재 UI에는 보조 질문/추가 촬영 단계 없음                                | 낮은 confidence 또는 불확실 상태에서 재촬영/수동 수정으로 보낸다 |
| 라벨/유통기한/내부 상태                 | 미구현                            | 앱은 유통기한을 이미지에서 읽지 않고 나눔 식재료 생성 시 기본 3일 후로 설정한다. 라벨 OCR, 포장 내부 상태 확인, 유통기한 수동 입력 필드는 없다.                              | `PostCreateScreen`의 `expDate + 3일`                                     | 유통기한 수동 입력 또는 라벨 사진/OCR은 다음 스프린트 후보       |
| 잘못 찍은 사진 재촬영 UI                | 부분 구현                         | 분석 결과 화면에는 `다시 촬영` 버튼이 있다. 촬영 실패 Alert는 갤러리 선택 대안을 제공한다. 분석 실패 Alert는 아직 서버 오류 문구 중심이다.                                   | `AnalysisResultScreen` footer, `CameraScanScreen` catch Alert            | 분석 실패 Alert를 재촬영/갤러리/수동 입력 액션형 대안으로 변경   |
| AI confidence 표시/활용                 | 부분 구현                         | `confidenceScore`는 분석 결과/작성 화면에 표시되고 낮은 confidence는 `확인 필요`로 분기한다. 다만 재촬영 강제나 수동 입력 전용 CTA는 없다.                                   | `AiAnalysis.confidenceScore`, `AnalysisResultScreen`, `PostCreateScreen` | 낮은 confidence fixture로 실제 UX 검증                           |
| confidence 낮을 때 등록 차단            | 정책 결정 완료                    | 낮은 confidence는 단독 등록 차단 사유로 보지 않고 `확인 필요`로 표시한다. 나눔 기준 미충족 신선도 등급만 `canShare=false`로 등록을 차단한다.                                 | `AnalysisResultScreen`, `postPolicy.needsAnalysisReview()`               | 확인 필요 상태에서 사용자 확인/수동 수정 UX 보강                 |
| confidence 낮을 때 재촬영               | 부분 구현                         | 낮은 confidence 전용 안내는 표시되지만 재촬영을 강제하지는 않는다.                                                                                                           | `AnalysisResultScreen`, `CameraScanScreen`                               | `confidenceScore < threshold`면 재촬영 CTA를 강조                |
| confidence 낮을 때 수동 입력            | 부분 구현                         | 분석 성공 뒤 나눔 식재료 작성 화면에서 제목/카테고리/설명은 수정 가능하다. 하지만 낮은 confidence 또는 분석 실패에서 바로 수동 입력으로 넘기는 흐름은 없다.                  | `PostCreateScreen` TextInput, category chip                              | `수동으로 입력` CTA 추가                                         |
| 여러 음식 하나의 나눔 식재료 처리       | 현재 구조상 단일 대표 객체만 가능 | 현재 응답 계약은 `detectedFruit`, `detectedFruitKo` 단일 문자열이다. `detections[]`, bounding box, object id가 없다.                                                         | OpenAPI `PostGenerateResult`, `PostAIResult`, `src/types/post.ts`        | MVP에서는 대표 객체 1개 나눔 식재료로만 처리                     |
| 여러 음식 객체별 분리 등록              | 미구현                            | 앱 내 route param, 타입, 나눔 식재료 작성 화면이 모두 단일 결과를 전제로 한다. 객체별 분리 등록 UX가 없다.                                                                   | `RootStackParamList`, `GenerateResult`, `PostCreateScreen`               | 다음 스프린트에서 계약/UX 먼저 설계                              |
| 여러 객체 중 하나라도 `Stale`일 때 차단 | 미구현                            | multi-object 결과가 없어서 객체별 `Stale` 판단 자체가 불가능하다. 서버 설명상 `Stale`/AI 장애는 generate 단계에서 400으로 거부되는 흐름이므로 앱은 실패 Alert만 받는다.      | OpenAPI `generate` 설명, `CameraScanScreen` error handling               | multi-object 도입 시 보수적으로 전체 확인 필요 상태 처리         |
| 객체별 나눔 기준 미충족 상태 표시       | 미구현                            | 단일 `category`만 표시한다. 객체별 상태, confidence, 박스 표시 UI가 없다.                                                                                                    | `AnalysisResultScreen` 품질 분류, `PostCreateScreen` 분석 카드           | `detections[]` 계약 이후 표시 방식 설계                          |
| multi-object 적용 시점                  | 정책 결정                         | 지금 MVP에는 붙이지 않는다. 현재 파이프라인은 단일 이미지/단일 대표 객체 계약이라 multi-object를 붙이면 API 계약, 결과 화면, 나눔 식재료 작성/분리 등록 UX가 동시에 바뀐다.  | `PostGenerateResult` 필드 목록, 앱 route 구조                            | 다음 스프린트 연구/검증 항목으로 분리                            |

#### 정책 결정안

- MVP 기본값은 한 장 촬영 유지.
- 한 장 촬영은 `단일 식재료 + 외관이 충분히 보임 + Fresh/Mid + confidence 기준 이상`일 때만 바로 진행한다.
- 라벨, 유통기한, 내부 상태가 핵심인 식재료는 AI가 확정하지 않고 `확인 필요`로 분기한다.
- 낮은 confidence는 단독 등록 차단 사유로 확정하지 않는다. 대신 재촬영, 갤러리 재선택, 수동 입력 중 하나를 요구한다.
- `Stale` 또는 서버 generate 400은 직접 나눔 등록으로 보내지 않고 재촬영/수동 확인으로 돌린다. `Bad/Rotten`은 현재 백엔드 label은 아니지만 내려오면 같은 차단 그룹으로 방어 처리한다.
- multi-object detection은 MVP 필수 기능이 아니라 다음 스프린트의 API 계약/UX 연구 항목으로 둔다.
- multi-object를 도입할 경우 먼저 `detections[]` 계약을 정의한다. 최소 필드는 `label`, `labelKo`, `confidence`, `qualityCategory`, `bbox`다.

#### 다음 스프린트 작업 후보

1. 나눔 기준 미충족(`canShare=false`) 등록 차단을 `Stale` fixture로 회귀 검증한다.
2. 낮은 confidence fixture로 `확인 필요` 상태와 작성 화면 표시를 검증한다.
3. 분석 실패/촬영 실패 Alert를 `다시 촬영`, `갤러리에서 선택`, `수동 입력` 액션으로 바꾼다.
4. 유통기한 기본 3일 자동값 대신 수동 입력 필드를 추가하거나, 최소한 작성 화면에서 수정 가능하게 만든다.
5. multi-object 검증용 이미지 세트를 준비한다: 단일 객체, 여러 객체, 흐림/어두움, 라벨/유통기한 포함, 포장 내부 미노출, 나눔 기준 미충족.
6. API 초안에 `detections[]` 응답 계약을 추가하고, 대표 객체 1개 처리와 객체별 분리 등록 중 어느 UX가 맞는지 별도 검증한다.
7. 완료: 에뮬레이터 셔터의 `Capture error TypeError: undefined is not a function`는 `usePhotoOutput().capturePhotoToFile()` 적용 후 사라졌고, 촬영 파일이 API로 전달됐다.

### 산출물

- 한 장 촬영 유지/변경 결정
- multi-object detection 적용 여부 결정
- AI confidence 기반 fallback 정책
- 다음 스프린트용 AI/UX 작업 후보

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "4. 한 장 촬영 UX와 multi-object 정책 정리"를 바탕으로 현재 코드와 AI 파이프라인 구조에서 한 장 촬영 흐름을 유지할 때의 리스크를 정리해줘.

현재 구현으로 대응 가능한 것과 정책 결정이 필요한 것을 나누고, 다음 스프린트에 넣을 수 있는 작은 작업 단위로 쪼개줘.
```

## 5. 미구현 기능 상태 점검

### 목표

아직 안 된 기능을 모두 구현하려 하지 말고, 현재 구현 상태와 다음 스프린트 우선순위를 분리한다.

### To-do

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

### 우선순위 기준

#### 우선순위 높음

- 로그인/유저 생성
- 최초 위치 등록/위치 재설정
- 사진 업로드와 AI 파이프라인
- 나눔 식재료 등록 성공/실패 처리
- 홈 화면 기본 데이터 표시
- 냉장고 지도/목록 기본 조회

#### 우선순위 중간

- 검색 기능
- 유저 프로필/통계
- 냉장고별 나눔 식재료 조회
- 푸쉬 알림
- 소셜 로그인/이메일 인증 보강

#### 우선순위 낮음 또는 보류

- WebSocket 기반 실시간 채팅
- 복잡한 탄소 절감 통계 시각화
- 소셜 로그인 전체 예외 케이스
- 이메일 verification 전체 예외 케이스

### 검증 결과 (2026-05-05)

#### 검증 범위

- 코드 점검: `src/screens/auth/*`, `src/screens/home/HomeScreen.tsx`, `src/screens/map/MapScreen.tsx`, `src/screens/profile/ProfileScreen.tsx`, `src/screens/chat/ChatListScreen.tsx`, `src/screens/location/LocationSetupScreen.tsx`, `src/api/*`, `src/services/deviceRegistration.ts`
- API 계약 확인: `GET /openapi.json`
- 확인된 서버 API: `/auth/signup`, `/auth/login`, `/auth/me`, `/auth/me/location`, `/posts`, `/posts/generate`, `/posts/nearby`, `/posts/{id}/requests`, `/fridges/nearby`, `/fridges/available`, `/fridges/{id}/posts`
- 미확인/부재 API: 소셜 로그인, 이메일 verification, 검색, 유저 통계, 채팅/WebSocket, 알림 읽음 상태

#### 기능별 구현 상태

| 항목                      | 상태                           | 현재 구현                                                                                                                                                                                                                                                            | 다음 액션                                                                                                 |
| ------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 소셜 로그인               | 목업                           | `LoginScreen`에 카카오/Apple/Google 버튼은 있지만 `준비 중` Alert만 표시한다. 서버 OpenAPI에도 소셜 로그인 엔드포인트가 없다.                                                                                                                                        | MVP에서는 이메일 로그인만 공식 경로로 표시하거나, 소셜 버튼을 숨긴다.                                     |
| 이메일 인증               | 미구현                         | 이메일 형식 검증과 회원가입 API만 있다. 이메일 인증 메일, OTP, verification 상태 필드는 없다.                                                                                                                                                                        | 다음 스프린트 범위 밖이면 “이메일 형식 검증만 제공”으로 명시한다.                                         |
| 최초 위치 등록            | 구현됨                         | 로그인 후 `latitude === null`이면 `LocationSetup`으로 분기하고, GPS 좌표와 FCM 토큰을 `/auth/me/location`에 저장한다.                                                                                                                                                | 권한 거부/수동 위치 입력 UX 보강.                                                                         |
| 위치 재설정               | 구현됨                         | 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. API는 `/auth/me/location`을 재사용한다.                                                                                                                                            | 권한 거부/수동 위치 입력 UX 보강.                                                                         |
| 주변 나눔 수              | 부분 구현/임시                 | 홈 통계는 `posts.length`를 `주변 나눔`으로 표시한다. pagination 전 현재 조회 결과 수 기준이다.                                                                                                                                                                       | 실제 통계로 유지하려면 기준과 API를 정의한다.                                                             |
| 탄소 절감액               | 정리됨                         | 홈과 프로필의 고정 kg 값을 제거하고 `준비 중`으로 표시한다. 계산식/API는 없다.                                                                                                                                                                                       | 실제 지표를 넣으려면 계산식과 API 계약을 먼저 정의한다.                                                   |
| 내 주변 실시간 나눔       | 부분 구현                      | `getNearbyPosts()`로 실제 주변 available 나눔 식재료를 가져와 카드로 표시한다. 백엔드 기준 `/posts/nearby`는 requested를 자동 제외한다. 실시간 구독, pagination, `전체보기` 동작은 없다.                                                                             | 신청 성공 후 requested 항목이 홈에서 사라지는지 프론트 연동/QA.                                           |
| 홈 데이터 없음 상태       | 구현됨                         | 나눔 식재료가 없으면 `아직 근처에 나눔이 없어요` 빈 상태를 표시한다.                                                                                                                                                                                                 | API 실패와 진짜 빈 상태를 구분하는 에러 UI 추가.                                                          |
| 검색 기능                 | 부분 구현                      | 홈 검색 아이콘은 지도 탭으로 이동하고, 지도 검색 입력은 공유 냉장고 이름/주소 로컬 필터로 동작한다. 서버 OpenAPI에는 검색 엔드포인트가 없다.                                                                                                                         | 나눔 식재료/동네 서버 검색은 후속 범위로 분리.                                                            |
| 검색 결과 없음            | 구현됨                         | MVP 검색은 지도 공유 냉장고 이름/주소 로컬 필터로 제한했다. 결과 없음 상태와 검색 초기화가 있다.                                                                                                                                                                     | 나눔 식재료/동네 서버 검색은 후속 범위로 분리.                                                            |
| 푸쉬 알림                 | 프론트 코드 연동 완료, 실제 수신 QA 필요 | Firebase Messaging 의존성, Android 알림 권한, FCM 토큰 등록이 있다. `share_created`, `share_requested` foreground/background/opened/initial handler를 구현했고, payload는 문자열 + camelCase(`type`, `postId`, `requestId`, `fruitName`, `fridgeName`)로 검증한다. Firebase 설정이 없는 QA/release 빌드에서는 알림 handler와 FCM 토큰 등록을 안전하게 건너뛴다. 알림함은 로컬 수신 기록/빈 상태 중심이며 읽음 상태 API는 없다. | 실제 기기에서 foreground/background/terminated 수신과 알림 탭 라우팅을 검증한다. |
| 유저 프로필               | 부분 구현                      | 닉네임/이메일은 실제 유저 정보를 표시한다. 프로필 수정, 메뉴 이동, 내 나눔/관심/받은 나눔은 연결되어 있지 않다.                                                                                                                                                      | 프로필 수정 또는 내 나눔 내역 중 하나만 우선 연결.                                                        |
| 유저 통계                 | 정리됨                         | 신선도 온도, 포인트, 탄소 절감량의 하드코딩 숫자를 제거하고 `준비 중` 상태로 표시한다.                                                                                                                                                                               | 실제 지표를 넣으려면 계산식과 API 계약을 먼저 정의.                                                       |
| 냉장고별 나눔 식재료 조회 | 프론트 코드 연동 완료, VM/API QA 및 Android UI 재확인 통과 | 지도에서 특정 냉장고를 선택하면 `GET /fridges/{id}/posts?status=available`로 내부 available 목록을 조회한다. loading/error/empty/list 상태를 분리하고 항목 탭 시 상세로 이동한다. 2026-05-08 VM/API에서 `PostNearbyRead` 카드 필드와 requested 제외를 재확인했고, 실제 Android UI에서 신규 Post 표시명/상태와 신청 후 즉시 제거를 확인했다. | 별도 inventory 개념은 후속으로 분리. |
| 지도 근처 냉장고 조회     | 구현됨                         | `MapScreen`이 `/fridges/nearby`, `FridgeSelectScreen`이 `/fridges/available`을 호출한다. 1번 검증에서 실제 냉장고 목록 표시를 확인했다.                                                                                                                              | 위치 미설정 기본 좌표 fallback과 API 실패 UI 보강.                                                        |
| 채팅 탭                   | 알림함으로 축소/구현됨         | `ChatListScreen`의 `MOCK_CHATS`를 제거하고 탭 라벨을 `알림`으로 바꿨다. 현재는 FCM 수신 기록/빈 상태를 보여준다. WebSocket, 채팅방 상세, 메시지 송수신 API는 없다.                                                                                                 | MVP에서는 알림함으로 유지하고 WebSocket 채팅은 보류.                                                      |
| WebSocket 채팅            | 미구현/보류 권장               | 코드와 OpenAPI 모두 실시간 채팅 계약이 없다. 구현/검증 비용이 크다.                                                                                                                                                                                                  | 다음 스프린트에서는 단순 문의/예약 CTA 또는 알림함으로 축소한다.                                          |

#### 다음 스프린트 우선순위 제안

1. 실제 FCM 수신 QA: Firebase 설정 포함 빌드와 FCM token이 등록된 두 테스트 계정/기기에서 `share_created`, `share_requested` foreground/background/terminated 수신과 알림 탭 라우팅을 확인한다.
2. FCM 발송 로그 분리: 백엔드 로그에서 `FCM 발송 완료`, `[Mock FCM]`, `반경 내 사용자 없음`, `FCM 발송 실패`를 구분한다.
3. Post-MVP AI/rejection contract: `stale-or-rotten`, `screenshot-or-ui`, `low-quality` false-positive를 rejection reason 또는 review-required 계약으로 승격할지 백엔드/AI와 결정한다.
4. Optional UX polish: 분석 실패 후 수동 입력 CTA를 MVP 이후에 추가할지 결정한다.

#### 채팅 탭 결정

- 결정: WebSocket 채팅은 보류하고, 현재 탭은 `알림함`으로 축소한다.
- 이유: 현재 구현은 정적 mock 데이터뿐이고, 서버 계약도 없다. 실시간 채팅은 인증, 방 생성, 메시지 저장, 읽음 상태, 푸쉬 연동까지 필요해서 MVP 다음 스프린트의 핵심 리스크를 키운다.
- 현실적인 대안: 백엔드가 구현한 나눔 식재료 상세의 `나눔 신청하기` API를 먼저 연결하고, 신청 상태/푸쉬 알림/알림함으로 흐름을 단순화한다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 "5. 미구현 기능 상태 점검"을 기준으로 현재 코드에서 각 기능이 구현됨/부분 구현/미구현/목업인지 분류해줘.

다음 스프린트에서 먼저 해야 할 기능을 근거와 함께 우선순위로 정리하고, 채팅 탭은 유지/제거/축소 중 어떤 선택이 현실적인지 코드 구조와 검증 비용 관점에서 판단해줘.
```

## 6. 다음 스프린트 백로그 정리

### 목표

검증 결과를 바탕으로 다음 스프린트에서 실제로 작업할 수 있는 작은 단위의 백로그를 만든다.

### 분류 규칙

- `버그`: 이미 구현된 기능이 기대대로 동작하지 않는 것
- `미구현`: 화면 또는 API가 없거나 mock 데이터에 머무른 것
- `정책 결정 필요`: 코드보다 먼저 제품/UX 판단이 필요한 것
- `검증 필요`: 코드상으로는 구현되어 보이지만 실제 기기/서버에서 확인해야 하는 것
- `문서화 필요`: 발표나 팀 공유를 위해 설명 기준이 필요한 것

### To-do

- [x] MVP 핵심 플로우 검증 결과를 이슈 후보로 변환
- [x] 실패 케이스 검증 결과를 이슈 후보로 변환
- [x] AI 파이프라인 보강 항목을 이슈 후보로 변환
- [x] 한 장 촬영 UX 정책 결정을 문서화
- [x] multi-object detection 적용 여부를 문서화
- [x] 미구현 기능의 우선순위를 다음 스프린트 범위로 재조정
- [x] 각 백로그 항목에 acceptance criteria 작성
- [x] 각 백로그 항목에 검증 방법 작성
- [x] 스프린트에서 제외할 항목을 명시

### 백로그 템플릿

```md
## 작업명

- 분류:
- 우선순위:
- 배경:
- 현재 동작:
- 기대 동작:
- Acceptance Criteria:
  - [ ]
  - [ ]
- 검증 방법:
- 관련 파일/화면/API:
- 비고:
```

### 백로그 초안 (2026-05-05)

#### P0/P1: 다음 스프린트 필수 후보

## 백엔드 Phase 1.5 Post 구조 변경 프론트 반영

- 분류: 서버 계약 변경 대응
- 우선순위: P0
- 상태: 프론트 구현 완료. 2026-05-06 VM/API와 실제 Android 기기 QA에서 서버 메타데이터 저장 불일치 발견, 2026-05-08 백엔드 수정/VM 재배포 완료, 2026-05-08 VM/API 및 실제 Android UI 재검증 통과
- 배경: 백엔드가 Post 컬럼에서 `title`, `description`, `category`를 제거하고 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`를 추가했다. 프론트 타입과 화면은 이 작업 전까지 구형 작성/표시 필드에 의존했다.
- 현재 동작: `src/types/post.ts`의 `Post`, `GenerateResult`, `PostCreateData`가 백엔드 Phase 1.5 구조를 반영한다. `createPost()`는 `fridgeId`, `expirationDate`, `imageToken`만 전송한다. 홈/냉장고 카드는 `PostNearbyRead` 기준으로 `detectedFruitKo`, `freshnessLabel`, `status`를 표시하고, 상세/등록 화면은 `confidenceScore`까지 표시한다.
- 기대 동작: 프론트는 백엔드 Phase 1.5 응답 구조를 기준으로 나눔 식재료명, 신선도 등급, 이미지, 냉장고, 상태를 표시한다. `confidenceScore`는 `PostRead`/등록 확인처럼 응답에 포함되는 화면에서만 표시한다. 사용자-facing 문구는 `나눔 식재료` 기준을 유지한다.
- Acceptance Criteria:
  - [x] `Post` 타입이 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`, `status`를 반영한다.
  - [x] `PostCreateData`와 `createPost()` payload가 백엔드 새 계약에 맞게 갱신된다.
  - [x] 홈 카드와 상세 화면이 `title/description/category` 없이도 깨지지 않는다.
  - [x] `Fresh/Mid/Stale/unknown` 매핑과 `Mid = Normal 그룹` 정책이 테스트로 고정된다.
- 검증 방법: typecheck 통과, `postPolicy`/`posts.api` unit test 통과, 실제 `GET /posts/{id}`/`POST /posts` VM API 검증, 앱 카드/상세 QA
- 관련 파일/화면/API: `src/types/post.ts`, `src/api/posts.ts`, `HomeScreen`, `PostDetailScreen`, `PostCreateScreen`, `POST /api/v1/posts`, `GET /api/v1/posts/{id}`
- 비고: 2026-05-06 VM API에서 `POST /posts/generate`는 AI 분석 결과를 반환했지만, `POST /posts`로 저장한 id `2`의 상세 응답은 `detectedFruit/detectedFruitKo/freshnessLabel/confidenceScore=null`이었다. 같은 현상이 실제 Android 기기 등록 후 홈/상세에서도 `나눔 식재료 / 분석 중` fallback으로 재현됐다. 2026-05-08 백엔드가 버그로 인정하고 `imageToken` sidecar AI 메타데이터 저장/복원 방식으로 수정했다. 프론트 fallback은 기존 null 데이터 대응으로 유지한다.

## Post AI 메타데이터 저장 계약 불일치 정리

- 분류: 서버 계약 불일치
- 우선순위: P0
- 상태: 백엔드 버그로 확정, 2026-05-08 VM 수정 배포 완료, 2026-05-08 VM/API 및 실제 Android UI 재검증 통과
- 배경: 제품/프론트 계약은 나눔 식재료 표시가 `detectedFruitKo`, `freshnessLabel`, `status`를 기준으로 하고, 상세/등록 화면에서는 `confidenceScore`까지 표시한다고 정했다. 백엔드 Phase 1.5 답변도 Post 컬럼 추가를 완료했다고 설명했다.
- 현재 동작: 2026-05-08 VM/API 재검증에서 `POST /posts/generate` fresh fixture가 `바나나/Fresh/confidence=1/imageToken`을 반환했고, 같은 `imageToken`으로 생성한 id `4`의 `POST /posts` 생성 응답과 `GET /posts/4` 상세 응답 모두 `detectedFruitKo`, `freshnessLabel`, `confidenceScore`를 non-null로 반환했다. 2026-05-06 VM QA와 실제 Android 기기 QA에서는 같은 흐름이 null/fallback으로 재현됐으나, 이는 백엔드 sidecar 수정 전 증거다.
- 기대 동작: 서버는 `imageToken`에 연결된 AI 분석 결과를 최종 Post에 저장한다. 수정 후 generate는 임시 저장소에 이미지와 `{imageToken}.json` AI 메타데이터를 저장하고, create는 이미지 이동과 JSON 복원을 수행해 Post row에 저장한다. 프론트는 `imageToken`, `fridgeId`, `expirationDate`만 보낸다.
- Acceptance Criteria:
  - [x] `POST /posts` 성공 후 `GET /posts/{id}`가 `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`를 반환한다. 2026-05-08 VM/API id `4`로 확인했다.
  - [x] `/posts/nearby`와 `/fridges/{id}/posts?status=available`도 카드 표시에 필요한 나눔 식재료명과 상태 값을 제공한다. 단, 해당 카드 요약 스키마(`PostNearbyRead`)는 `confidenceScore`를 포함하지 않는다. 2026-05-08 VM/API id `4`로 확인했다.
  - [x] `POST /posts/generate` 응답의 canonical AI 판정 위치는 OpenAPI/live VM 기준 `data.aiAnalysis`이며, Post 생성/조회 응답의 저장 필드는 root `detectedFruit`, `detectedFruitKo`, `freshnessLabel`, `confidenceScore`로 구분해 문서화했다.
  - [ ] 프론트는 기존 null 메타데이터 fallback으로 화면이 깨지지 않음을 테스트로 유지한다.
- 검증 방법: 공개 fresh fixture로 `generate -> create -> detail -> nearby -> fridge posts` VM API 재검증, 실제 Android 기기 `generate -> create -> home -> detail` 재검증, `NearbyPostCard`/`PostDetailScreen` null metadata fixture 테스트
- 관련 파일/화면/API: `POST /api/v1/posts/generate`, `POST /api/v1/posts`, `GET /api/v1/posts/{id}`, `GET /api/v1/posts/nearby`, `GET /api/v1/fridges/{fridge_id}/posts`, `NearbyPostCard`, `PostDetailScreen`, `MapScreen`
- 비고: 충돌 판단 기준은 2026-05-06 live VM API와 `GET /openapi.json`이었다. 2026-05-08 VM/API와 실제 Android UI 재검증 기준 P0 저장 불일치는 신규 데이터에서 해소됐다. 기존 null 데이터 fallback은 유지한다.

## 나눔 신청 API 프론트 연동

- 분류: 기능 구현
- 우선순위: P1
- 상태: 프론트 코드 연동 완료, VM/API 런타임 QA 통과
- 배경: MVP 수요자 흐름인 `available -> requested`가 백엔드에 구현됐다. 이 작업에서 상세 화면 CTA를 실제 신청 API에 연결했다.
- 현재 동작: 상세 화면의 `나눔 신청하기` CTA가 `POST /api/v1/posts/{post_id}/requests`를 호출한다. 성공 시 상세 `post.status`를 `requested`로 바꾸고 Home/Map refresh store에 requested post id를 전달한다. 403/409는 사용자-facing 문구로 분기한다.
- 기대 동작: 수요자가 available 나눔 식재료 상세에서 `나눔 신청하기`를 누르면 `POST /api/v1/posts/{post_id}/requests`를 호출하고, 성공 시 신청 접수 상태를 표시한다.
- Acceptance Criteria:
  - [x] `requestShare(postId)` API client가 추가된다.
  - [x] 성공 201 응답에서 `request`와 갱신된 `post.status=requested`를 처리한다.
  - [x] 작성자 본인 신청 403은 CTA 숨김/비활성화 또는 fallback 문구로 처리한다.
  - [x] 중복/경합 409는 `다른 사용자가 먼저 신청했어요` 문구와 CTA 비활성화로 처리한다.
  - [x] 신청 성공 후 상세 상태와 홈 `/posts/nearby` 재조회 또는 항목 제거가 보장된다.
- 검증 방법: API client unit test 통과, PostDetail interaction test 통과, Home refresh test 통과, 실제 VM API 201/403/409 QA 통과
- 관련 파일/화면/API: `src/api/posts.ts`, `src/types/post.ts`, `PostDetailScreen`, `HomeScreen`, `POST /api/v1/posts/{post_id}/requests`
- 비고: 2026-05-06 VM QA에서 작성자 본인 신청 403, 첫 신청 201, 중복 신청 409, 신청 후 상세 `status=requested`를 확인했다. 2026-05-08 실제 Android 기기에서 신청 완료 alert, 상세 `신청 접수` disabled CTA, 지도 냉장고 내부 목록 즉시 제거를 확인했다.

## 냉장고별 나눔 식재료 조회 프론트 연동

- 분류: 기능 구현
- 우선순위: P1
- 상태: 프론트 코드 연동 완료, VM/API 런타임 QA 통과, 실제 앱 UI QA 남음
- 배경: 지도는 주변 공유 냉장고와 그 안의 available 나눔 식재료를 탐색하는 화면이다. 백엔드는 `GET /fridges/{id}/posts?status=available`를 구현했다.
- 현재 동작: 지도는 냉장고 목록/마커/캐러셀을 보여주고, 특정 냉장고 선택 시 내부 available 나눔 식재료 목록을 조회한다. 항목 탭 시 상세/신청 흐름으로 이동한다. 상세에서 신청이 성공하면 `requestedPostId` refresh 신호를 받아 지도 내부 목록에서도 해당 항목을 즉시 제거한다.
- 기대 동작: 사용자가 지도에서 냉장고를 선택하면 해당 냉장고의 available 나눔 식재료를 확인하고 상세/신청 흐름으로 이동할 수 있다.
- Acceptance Criteria:
  - [x] `getFridgePosts(fridgeId, status='available')` API client가 추가된다.
  - [x] 냉장고 선택 시 loading/error/empty/list 상태가 분리된다.
  - [x] 목록 항목은 나눔 식재료 상세로 이동한다.
  - [x] 위치 미설정 상태에서는 기존 위치 설정 CTA 가드를 유지한다.
- 검증 방법: API client unit test, 지도 냉장고 선택 QA, empty/error 상태 QA, 실제 VM API available 포함/제외 확인
- 관련 파일/화면/API: `src/api/fridges.ts`, `MapScreen`, `PostDetailScreen`, `GET /api/v1/fridges/{fridge_id}/posts`, `__tests__/fridges.api.test.ts`, `__tests__/map.fridgePosts.test.tsx`
- 비고: 2026-05-06 VM QA에서 생성 직후 냉장고 id `1` 내부 목록에 포함되고, 신청 후 `requested` 상태가 되면 `status=available` 목록에서 제외됨을 확인했다. 2026-05-08 백엔드 답변 기준 이 API는 `PostRead`가 아니라 `/posts/nearby`와 같은 `PostNearbyRead`를 반환하며, `confidenceScore`는 포함하지 않는다. 2026-05-08 실제 Android 기기에서 신청 후 뒤로 돌아온 지도 내부 목록이 stale 항목을 표시하던 문제를 발견해 수정했고, 수동 새로고침 없이 즉시 제거되는 것을 재확인했다.

## 나눔 기준 미충족/등록 차단 상태에서 실제 등록 차단

- 분류: 버그
- 우선순위: P0
- 상태: 앱 가드 완료, 서버 최종 방어 확인됨, fixture 회귀 검증 필요
- 배경: `AnalysisResultScreen`은 과거에 `canShare=false`일 때 CTA를 흐리게 보이게만 하고 실제 이동을 막지 않았다.
- 현재 동작: `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`에서 나눔 기준 미충족 신선도 등급의 등록 진행을 차단한다. 백엔드는 `Stale` generate 결과에 `imageToken`을 발급하지 않고, 무효/만료 토큰 create를 400으로 막는다.
- 기대 동작: 등록 차단 상태에서는 분석 결과 화면, 나눔 식재료 작성 화면, 최종 등록 직전에서 모두 차단한다. 프론트 가드를 우회해도 서버가 등록을 막는다.
- Acceptance Criteria:
  - [x] `canShare=false`이면 `이대로 나눔하기` 버튼이 실제 disabled 처리된다.
  - [x] route 직접 진입 또는 상태 조작으로 `PostCreate`/`FridgeSelect`에 들어가도 최종 등록 전에 차단된다.
  - [x] 사용자에게 재촬영/갤러리 선택 중 최소 하나의 대안이 제공된다.
  - [x] 서버는 `Stale` 분석 결과에 대해 `imageToken`을 발급하지 않는다.
  - [x] 서버는 무효/만료 `imageToken`으로 최종 등록을 막는다.
- 검증 방법: `AnalysisResultScreen` 단위 테스트, `FridgeSelectScreen` 최종 등록 guard 테스트, generate 400/detail 실기기 QA, 무효 token 400 API QA, fixture report-only QA
- 관련 파일/화면/API: `src/screens/camera/AnalysisResultScreen.tsx`, `src/screens/post/PostCreateScreen.tsx`, `src/screens/post/FridgeSelectScreen.tsx`
- 비고: `stale-or-rotten` fixture는 준비됐지만 현재 VM API에서는 Fresh false-positive로 통과한다. MVP에서는 `is_fresh=False`/400 계약과 프론트 차단 경로를 검증했고, stale 분류 품질은 Post-MVP AI 항목으로 남긴다.

## 나눔 식재료 상세 authorId/userId 계약 불일치 수정

- 분류: 버그
- 우선순위: P0
- 상태: 완료
- 배경: 실제 `GET /api/v1/posts/{id}` 응답은 `authorId`를 반환하지만 앱 `Post` 타입과 `PostDetailScreen`은 `userId`를 사용한다.
- 현재 동작: 작성자 판단은 `authorId` 기준으로 처리하고, 구형 fixture를 위해 `userId` fallback만 남겨둔다.
- 기대 동작: API 응답 계약과 앱 타입/화면 로직이 일치하고, 작성자에게 삭제 버튼이 표시된다.
- Acceptance Criteria:
  - [x] `Post` 타입이 실제 API 응답의 작성자 필드를 반영한다.
  - [x] 상세/삭제 UI가 동일한 작성자 판단 기준을 사용한다.
  - [x] 작성자 계정에서는 삭제 버튼이 보이고, 타 계정에서는 보이지 않는다.
- 검증 방법: 실제 post id `7` 상세 조회, 작성자/타 사용자 로그인 QA, 타입 체크
- 관련 파일/화면/API: `src/types/post.ts`, `src/screens/post/PostDetailScreen.tsx`, `GET /api/v1/posts/{id}`
- 비고: 7번 데이터 준비 중 실제 응답으로 추가 발견.

## 홈/지도/냉장고 목록 실패 상태와 빈 상태 분리

- 분류: 버그
- 우선순위: P1
- 상태: 완료, 네트워크 fault injection QA 필요
- 배경: 목록 조회 실패가 `console.warn`에만 남고 화면은 빈 상태처럼 보일 수 있다.
- 현재 동작: 홈/지도/냉장고 목록 API 실패 시 오류 문구와 retry UI를 표시한다.
- 기대 동작: API 실패와 실제 데이터 없음이 UI에서 구분된다.
- Acceptance Criteria:
  - [x] 홈 주변 나눔 식재료 조회 실패 시 오류 문구와 다시 시도 버튼이 표시된다.
  - [x] 지도/냉장고 목록 조회 실패 시 오류 문구와 다시 시도 버튼이 표시된다.
  - [x] 정상 빈 상태 문구는 API 성공 + 데이터 0건일 때만 표시된다.
- 검증 방법: API base URL 오류 주입, 네트워크 차단 QA, 컴포넌트 테스트
- 관련 파일/화면/API: `HomeScreen`, `MapScreen`, `FridgeSelectScreen`, `/posts/nearby`, `/fridges/nearby`, `/fridges/available`

## 나눔 식재료 등록 완료 후 홈 주변 목록 재조회

- 분류: 버그
- 우선순위: P1
- 상태: 완료, 실제 앱 런타임 재검증 필요
- 배경: `POST /api/v1/posts` 성공 후 완료 화면에서 홈으로 돌아갈 때 홈 목록이 이전 `/posts/nearby` 결과를 그대로 보여줄 수 있다.
- 현재 동작: `PostCompleteScreen`의 `홈으로 돌아가기`는 RootStack을 `Main > Home`으로 reset하면서 `nearbyPostsRefreshToken`과 `completedPostId`를 전달한다. `HomeScreen`은 포커스되거나 refresh token이 바뀔 때 `getNearbyPosts()`를 호출한다.
- 기대 동작: `등록 완료 -> 홈 복귀 -> 주변 나눔 식재료 재조회`가 navigation state에 명시적으로 표현되고, 홈 도착 시 `/posts/nearby` 호출이 보장된다.
- Acceptance Criteria:
  - [x] 등록 완료 화면의 홈 복귀 route가 `Main > Home`과 refresh token을 포함한다.
  - [x] 홈 화면은 refresh token 변경 시 현재 동네 위치로 `/posts/nearby`를 재호출한다.
  - [x] 위치 미설정 상태에서는 기존 위치 등록 CTA 흐름을 유지하고 주변 API를 호출하지 않는다.
- 검증 방법: `__tests__/postComplete.navigation.test.tsx`, `__tests__/home.nearbyRefresh.test.tsx`, 실제 앱에서 등록 직후 홈 목록 갱신 확인
- 관련 파일/화면/API: `PostCompleteScreen`, `HomeScreen`, `MainTabParamList.Home`, `/posts/nearby`

## 위치 재설정 진입점 연결

- 분류: 미구현
- 우선순위: P1
- 상태: 완료, 실제 기기 권한 거부 QA 필요
- 배경: 최초 위치 등록은 구현됐지만 위치 재설정 UI는 연결되지 않았다.
- 현재 동작: 홈 위치 헤더와 프로필 `동네 위치 재설정` 메뉴에서 `LocationSetup`으로 재진입한다. 위치 권한 거부 시 화면 안에서 재시도와 설정 열기 CTA를 제공한다.
- 기대 동작: 사용자가 홈 또는 프로필에서 현재 위치 재설정 화면으로 진입할 수 있다.
- Acceptance Criteria:
  - [x] 홈 위치 헤더 또는 프로필 설정에서 `LocationSetup` 재진입이 가능하다.
  - [x] 기존 위치가 있는 사용자도 새 좌표를 `/auth/me/location`에 저장할 수 있다.
  - [x] 위치 권한 거부 시 설정/재시도 안내가 표시된다.
- 검증 방법: 위치 있는 계정으로 재설정 QA, `/auth/me` 좌표 변경 확인, `__tests__/locationSetup.notificationPermission.test.tsx`
- 관련 파일/화면/API: `HomeScreen`, `ProfileScreen`, `LocationSetupScreen`, `PUT /api/v1/auth/me/location`

## 위치 미설정 강제 진입 공통 가드

- 분류: 버그
- 우선순위: P1
- 상태: 완료, 에뮬레이터 강제 진입 QA 필요
- 배경: 정상 네비게이션은 위치 없는 사용자를 `LocationSetup`으로 보내지만, 지도나 냉장고 선택에 강제 진입하면 기본 좌표 또는 Alert/goBack 흐름이 보일 수 있었다.
- 현재 동작: `getRegisteredLocation()`을 공통 위치 판정 기준으로 사용한다. 홈, 지도, AI 스캔 진입점, 냉장고 선택 화면은 위치가 없으면 주변 API를 호출하지 않고 `LocationSetup` CTA를 보여준다.
- 기대 동작: 위치 미설정 사용자는 기본 좌표 주변 데이터처럼 보이는 화면을 보지 않는다.
- Acceptance Criteria:
  - [x] 위치가 없으면 홈은 `/posts/nearby`를 호출하지 않고 위치 설정 CTA를 표시한다.
  - [x] 위치가 없으면 지도는 `MapView`와 전남대 기본 좌표 fallback을 렌더링하지 않는다.
  - [x] 위치가 없으면 중앙 AI 스캔 버튼과 홈 히어로 CTA는 `CameraScan` 대신 `LocationSetup`으로 이동한다.
  - [x] 위치가 없으면 `FridgeSelect`는 `/fridges/available`을 호출하지 않고 위치 설정 CTA를 표시한다.
  - [x] 위치 판정은 `latitude=0`, `longitude=0` 같은 유효한 좌표를 누락으로 오인하지 않는다.
- 검증 방법: `__tests__/locationGuard.test.ts`, eslint, typecheck, 에뮬레이터에서 위치 없는 계정 강제 진입 QA
- 관련 파일/화면/API: `src/utils/locationGuard.ts`, `HomeScreen`, `MapScreen`, `MainTab`, `FridgeSelectScreen`, `/posts/nearby`, `/fridges/nearby`, `/fridges/available`

## 실제 기기 카메라 촬영 경로 재검증 및 fallback 개선

- 분류: 검증 필요
- 우선순위: P1
- 상태: 실제 Android 기기 촬영/분석/등록 완료, 실패 fixture QA 남음
- 배경: 에뮬레이터에서 셔터 촬영 시 `Capture error TypeError: undefined is not a function`가 발생했다.
- 현재 동작: `react-native-vision-camera@5` API에 맞춰 `usePhotoOutput().capturePhotoToFile()`로 수정했고, 에뮬레이터와 실제 Android 기기에서 촬영 파일 생성 및 API 호출까지 확인했다. 실제 기기에서는 카메라 권한 허용 후 촬영, AI 분석 결과 표시, 등록 화면 진입, 냉장고 선택, 최종 등록 완료, 홈 목록 재조회까지 이어졌다.
- 기대 동작: 실제 기기에서는 촬영 파일이 생성되고, 실패 시 갤러리 선택/수동 입력 대안이 제공된다.
- Acceptance Criteria:
  - [x] 실제 Android 기기에서 촬영 파일 URI가 생성된다.
  - [ ] 에뮬레이터 실패 시 Alert가 대안 액션을 제공한다.
  - [x] 실제 기기 촬영이 `generatePost()`까지 도달한다.
  - [ ] 갤러리 fallback이 `generatePost()`까지 도달한다.
- 검증 방법: 실제 기기 QA, 에뮬레이터 fallback QA, logcat 확인. 2026-05-06 실제 기기 QA 증거는 `temp/real-device-*.png`에 저장했다.
- 관련 파일/화면/API: `CameraScanScreen`, `react-native-vision-camera`, `POST /api/v1/posts/generate`
- 체크리스트: [AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)

## AI confidence와 확인 필요 상태 도입

- 분류: 정책 결정 완료, UX 보강 필요
- 우선순위: P1
- 상태: 기준 결정 완료, fixture 검증 필요
- 배경: 백엔드가 `confidenceScore`를 Stage 2 신선도 분류 모델의 softmax max 확률로 확정했다.
- 현재 동작: `confidenceScore`를 분석 결과/작성 화면에 표시하고, `confidenceScore < 0.9`이면 `확인 필요`로 분기한다.
- 기대 동작: 낮은 confidence는 즉시 차단이 아니라 `확인 필요` 상태로 분기하고 재촬영/수동 입력을 유도한다.
- Acceptance Criteria:
  - [x] confidence가 분석 결과 화면에 표시된다.
  - [x] threshold 미만일 때 `확인 필요` 상태가 표시된다.
  - [x] 현재 threshold 값과 정책이 문서화된다.
  - [x] 백엔드 활용 가이드인 0.9 미만 확인 필요 기준을 프론트 UX에 반영한다.
  - [x] confidence 0.4/0.7/1.0 기대값을 테스트로 고정한다.
- 검증 방법: mock/fixture 응답으로 confidence 0.4/0.7/1.0 테스트, 수동 QA
- 관련 파일/화면/API: `AiAnalysis.confidenceScore`, `AnalysisResultScreen`, `PostCreateScreen`

## AI false-positive 차단 계약 정리

- 분류: 정책 결정/서버 계약
- 우선순위: P1
- 상태: 앱 방어 로직/fixture 반복 검증 스크립트 추가, 실제 기기 false-positive 증거 추가. 2026-05-08 백엔드 답변 기준 screenshot/UI 차단은 MVP 허용, rejection reason enum은 Post-MVP
- 배경: 에뮬레이터 QA에서 비식재료/스크린샷성 이미지가 `바나나 / 신선 / 100%`로 통과했다. 2026-05-06 실제 Android 기기 QA에서도 화면상 토마토 이미지를 촬영했으나 AI가 `바나나 / 나눔 가능 / 91%`로 판별했다.
- 현재 동작: 앱은 이미지 내용을 자체 판별하지 않는다. 서버가 `not_food/non_food/low_quality/screenshot/ui_screenshot` category 또는 `rejectionReason`을 주면 등록 차단으로 처리한다. 다만 백엔드 Phase 1.5 기준 해당 enum은 아직 구현되지 않았고 Post-MVP로 기록됐다. MVP 서버/AI는 screenshot/UI 판별 모델이 없어 `Fresh + imageToken`을 반환할 수 있다.
- 기대 동작: MVP에서는 서버가 `Fresh + imageToken`을 반환하면 등록을 허용하고, 낮은 confidence는 `확인 필요`로만 표시한다. Post-MVP에서는 서버/AI가 비식재료, 스크린샷, 앱 아이콘, 실내 배경을 `Fresh` 식재료로 반환하지 않도록 rejection/review reason 계약을 추가한다.
- Acceptance Criteria:
  - [ ] Post-MVP에서 `not_food`, `low_quality`, `screenshot`, `ui_screenshot`, `review_required`, `multi_object_review` 등 실패/검토 사유 enum을 서버 계약에 추가한다.
  - [ ] Post-MVP에서 비식재료/스크린샷 fixture는 generate 400 또는 `확인 필요`로 처리된다.
  - [x] 앱은 서버 실패 사유를 사용자에게 보여주고 등록을 진행하지 않는다.
- 검증 방법: [AI QA fixture 문서](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)의 `not-food`, `screenshot-or-ui`, `low-quality` fixture로 `npm run qa:ai-fixtures -- --report-only` 반복 호출. Post-MVP 차단 계약 도입 후 strict mode로 승격한다.
- 관련 파일/화면/API: `POST /api/v1/posts/generate`, `CameraScanScreen`, `AnalysisResultScreen`, `postPolicy`

#### P2: 다음 스프린트 범위 조정 후보

## 검색 MVP 범위 결정 및 최소 구현

- 분류: 미구현
- 우선순위: P2
- 배경: 홈 검색 아이콘과 지도 검색 입력은 있지만 동작이 없다.
- 현재 동작: 홈 검색 아이콘은 지도 탭으로 이동하고, 지도 검색 입력은 현재 불러온 공유 냉장고의 이름/주소를 로컬 필터링한다.
- 기대 동작: MVP에서는 서버 검색 없이 공유 냉장고명/주소 로컬 필터를 제공한다. 나눔 식재료/동네 서버 검색은 후속 범위로 분리한다.
- Acceptance Criteria:
  - [x] 검색 대상은 MVP에서 공유 냉장고 이름/주소로 제한한다.
  - [x] 결과 없음 상태가 표시된다.
  - [x] 홈 검색 affordance는 지도 검색 진입점으로 연결한다.
- 검증 방법: `filterFridges` 단위 테스트, 검색어 입력 QA, 결과 있음/없음 상태 확인
- 관련 파일/화면/API: `HomeScreen`, `MapScreen`, `fridgeSearch`

## 목업 통계와 탄소 절감 표시 정리

- 분류: 목업 제거/정책 결정 필요
- 우선순위: P2
- 배경: 홈/프로필 통계가 하드코딩 값이다.
- 현재 동작: 홈 탄소 절감과 프로필 신선도 온도/포인트/탄소 절감 mock 숫자를 제거하고 `준비 중`으로 표시한다.
- 기대 동작: 실제 API가 없으면 숨김/준비 중/설명형 문구 중 하나로 정리한다.
- Acceptance Criteria:
  - [x] 홈 탄소 절감 mock 값은 운영성 UI에서 제거된다.
  - [x] 프로필 mock 통계를 제거하거나 준비 중 상태로 바꾼다.
  - [ ] 실제 지표로 유지하려면 계산식과 API 계약이 문서화된다.
- 검증 방법: 홈/프로필 UI QA, API 계약 확인
- 관련 파일/화면/API: `HomeScreen`, `ProfileScreen`

## FCM 수신 처리와 알림함 범위 정의

- 분류: 기능 구현
- 우선순위: P2
- 배경: FCM 토큰 등록은 있지만 알림 수신/목록/읽음 처리는 없다.
- 현재 동작: FCM token은 사용자가 위치 설정 화면의 `나눔 알림 받기` CTA를 눌렀을 때 권한 요청 후 `/auth/me/location`으로 등록한다. 위치 설정 진입과 기존 유저의 위치 자동 갱신만으로는 알림 권한을 요청하지 않으며, Android 13+ `POST_NOTIFICATIONS` 거부 시 Firebase permission/register/getToken을 호출하지 않고 `fcmToken` 없이 위치 등록을 계속한다. `share_created`, `share_requested` handler는 foreground/background/opened/initial 메시지를 로컬 알림함에 기록한다. 알림 열기와 알림함 항목 탭은 `PostDetail`로 이동하며, `share_requested`는 내 나눔 관리 화면이 없으므로 상세 fallback을 쓴다. Firebase 앱이 설정되지 않은 QA/release 빌드에서는 Messaging 인스턴스 생성 실패를 잡고 handler 등록과 FCM 토큰 조회를 건너뛰어 앱 시작/위치 갱신 크래시를 막는다. 2026-05-08 백엔드 답변 기준 `share_created`는 반경 2km 내 FCM 토큰이 있는 다른 사용자에게, `share_requested`는 공급자 FCM 토큰이 있을 때 발송된다.
- 기대 동작: MVP에서는 WebSocket 채팅 대신 알림함과 단순 신청 흐름으로 축소한다. 읽음 상태 API는 후속으로 분리한다.
- Acceptance Criteria:
  - [x] foreground/background 알림 수신 handler가 정의된다.
  - [x] FCM `data` payload는 문자열 + camelCase로 검증한다.
  - [x] `share_created`는 홈 또는 상세로 이동한다.
  - [x] `share_requested`는 MVP에서 상세 화면으로 fallback한다.
  - [x] 알림함은 수신 기록/빈 상태 중심으로 두고 읽음 상태 API는 후속으로 분리한다.
  - [x] 알림함으로 유지하고 WebSocket 채팅은 보류한다.
  - [x] mock 알림 데이터가 빈 알림함 상태로 대체된다.
  - [x] Firebase 설정이 없는 빌드에서도 알림 handler 등록 때문에 앱 시작이 크래시하지 않는다.
  - [x] Firebase 설정이 없는 빌드에서도 FCM 토큰 조회 때문에 위치 등록/갱신이 크래시하지 않는다.
  - [x] 위치 설정 진입만으로 알림 권한을 요청하지 않고, 사용자가 알림 CTA를 누를 때만 FCM 토큰을 준비한다.
  - [x] 기존 유저의 위치 자동 갱신 경로는 알림 권한 요청을 열지 않는다.
  - [x] Android 알림 권한 거부 시 FCM token/register 경로를 호출하지 않는다.
  - [ ] 실제 흐름 테스트로 백엔드 로그의 발송 완료/Mock FCM/반경 내 사용자 없음 상태를 분리한다.
- 검증 방법: FCM 테스트 메시지 수신 QA, 앱 foreground/background 확인, `notificationService.firebaseFallback.test.ts`, `deviceRegistration.firebaseFallback.test.ts`, `deviceRegistration.notificationPermission.test.ts`, `locationSetup.notificationPermission.test.tsx`
- 관련 파일/화면/API: `notifications.ts`, `deviceRegistration.ts`, `firebaseMessaging.ts`, `notificationStore.ts`, `ChatListScreen`, `index.js`, `AppNavigator`, Firebase Messaging

## multi-object detection 연구/계약 초안

- 분류: 정책 결정 필요
- 우선순위: P2
- 배경: 현재 API와 앱 타입은 단일 대표 객체만 지원한다.
- 현재 동작: `detectedFruit`/`detectedFruitKo` 단일 문자열만 처리한다.
- 기대 동작: 다음 스프린트에서는 구현보다 먼저 `detections[]` 계약과 UX 정책을 검증한다.
- Acceptance Criteria:
  - [ ] `detections[]` 최소 필드 초안이 작성된다.
  - [ ] 대표 객체 1개 처리와 객체별 분리 등록 중 UX 방향을 결정한다.
  - [x] multi-object fixture 이미지를 준비하고 VM/API report-only 결과를 기록한다.
- 검증 방법: multi-object 이미지 API 실험, 계약 리뷰
- 관련 파일/화면/API: `PostGenerateResult`, `AiAnalysis`, `AnalysisResultScreen`

#### 스프린트 제외/보류

- WebSocket 기반 실시간 채팅: 서버 계약과 앱 구조가 없으므로 보류. `알림함` 또는 `나눔 신청하기`로 축소한다.
- 소셜 로그인 전체 구현: 이메일 로그인 MVP가 동작하므로 우선순위 낮음. 버튼을 숨기거나 준비 중으로 명확히 둔다.
- 이메일 verification 전체 예외 케이스: 인증 메일/OTP 서버 계약이 없어 보류.
- 냉장고 내부 inventory: 별도 재고 관리 개념은 보류한다. 단, 백엔드가 냉장고별 available 나눔 식재료 조회 API를 구현했고, 프론트는 지도 선택 냉장고 내부 목록으로 연동했다. 별도 inventory/냉장고 운영자 기능은 후속 범위다.

### Codex 작업 지시 예시

```text
docs/VALIDATION_AND_BACKLOG.md의 검증 결과를 바탕으로 다음 스프린트 백로그 초안을 만들어줘.

각 항목은 작업명, 분류, 우선순위, 배경, 현재 동작, 기대 동작, acceptance criteria, 검증 방법, 관련 파일/화면/API를 포함해야 해. 구현 작업과 정책 결정 작업을 분리해줘.
```

## 7. 시연/검증용 데이터 준비

### 목표

기능이 비어 보이지 않도록 검증용 데이터와 이미지 케이스를 준비한다.

### To-do

- [x] 검증용 유저 계정 준비
- [x] 검증용 위치 데이터 준비
- [x] 검증용 냉장고 데이터 준비
- [x] 검증용 나눔 식재료 데이터 준비
- [x] AI 성공 케이스 이미지 준비
- [x] AI 실패 케이스 이미지 준비
- [x] 나눔 기준 미충족 상태 `Stale` 케이스 이미지 준비
- [x] multi-object 예시 이미지 준비
- [ ] 주변 냉장고 없음 상태를 확인할 수 있는 위치 준비
- [x] 나눔 식재료 없음 상태를 확인할 수 있는 조건 준비
- [x] 검색 결과 없음 상태를 확인할 수 있는 키워드 준비

### 준비 결과 (2026-05-05)

#### 실제 서버 데이터

| 용도                  | 값                                                                               | 상태        | 비고                                                               |
| --------------------- | -------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| 시연용 계정           | `mvp_demo_20260505@example.com` / `Password123`                                  | 준비됨      | 위치 등록, 나눔 식재료 생성 완료. 테스트 전용 계정으로만 사용      |
| 빈 상태 확인 계정     | `mvp_empty_20260505@example.com` / `Password123`                                 | 준비됨      | 제주 좌표 기준 주변 나눔 식재료 0건 확인                           |
| 시연용 위치           | `35.1595, 126.9136`                                                              | 준비됨      | 광주 전남대 인근. 홈/지도/냉장고 목록 검증용                       |
| 나눔 식재료 없음 위치 | `33.4996, 126.5312`                                                              | 준비됨      | `/posts/nearby` 0건 확인. 단, 냉장고 목록은 서버가 3건을 반환함    |
| 냉장고 데이터         | id `1` 광주역 공유냉장고, id `3` 충장로 공유냉장고, id `4` 전남대학교 공유냉장고 | 준비됨      | `/fridges/available?latitude=35.1595&longitude=126.9136` 기준      |
| 시연용 나눔 식재료    | id `7`, `[MVP 검증] 신선한 사과 나눔합니다`                                      | 준비됨      | 실제 `generate -> imageToken -> createPost` 흐름으로 생성          |
| AI 성공 이미지        | `docs/qa-fixtures/fresh-single-fresh-20260505.jpg`                               | 준비됨      | 실제 VM API가 `바나나`/`Fresh`/confidence `1.0`으로 판정           |
| 검색 결과 없음 키워드 | `zz-no-result-foodlink`, `없는냉장고테스트`                                      | 준비됨      | 검색 기능 구현 후 no-result fixture로 사용                         |

#### 실제 생성된 나눔 식재료 상세

```json
{
  "id": 7,
  "authorId": 10,
  "fridgeId": 1,
  "title": "[MVP 검증] 신선한 사과 나눔합니다",
  "category": "기타",
  "imageUrl": "/static/uploads/posts/10/85f9f3d4-e5ce-44ae-af5b-7aa5fe6260c9.png",
  "expirationDate": "2026-05-08",
  "status": "available",
  "latitude": 35.1595,
  "longitude": 126.9136
}
```

주의: 상세 응답은 `authorId`를 반환한다. 앱은 `authorId` 기준으로 작성자 여부를 판단하고, 구형 fixture 호환을 위해 `userId` fallback만 남긴다.

#### fixture 준비 상태

| 항목                                 | 상태      | 이유                                                                                                          | 다음 액션                                                                                                                |
| ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| AI 실패 케이스 이미지                | 준비됨    | `not-food`와 `multi-object`는 VM API에서 generate 400을 재현했다. `screenshot-or-ui`, `low-quality`는 Fresh false-positive로 관찰한다. | Post-MVP rejection reason enum과 서버/AI fixture mode 논의                                                               |
| 나눔 기준 미충족 상태 `Stale` 이미지 | 준비됨    | `stale-or-rotten` fixture는 준비됐지만 현재 VM API는 Fresh false-positive로 통과시킨다.                        | 백엔드/AI 모델 개선 또는 서버 fixture mode 준비                                                                          |
| multi-object 예시 이미지             | 준비됨    | `multi-object` fixture는 VM API에서 400으로 거부됐다. 현재 API 계약은 여전히 단일 대표 객체만 반환한다.        | Post-MVP `detections[]` 계약과 UX 정책 결정                                                                              |
| 주변 냉장고 없음 위치                | 준비 실패 | `0,0`, 제주, 부산, 뉴욕 좌표에서도 `/fridges/nearby`가 3건을 반환했다. 반경 필터가 기대와 다를 가능성이 있다. | 서버 냉장고 거리 필터를 확인하거나 no-fridge fixture를 백엔드에 추가                                                     |

#### 재현 명령 요약

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
PUT /api/v1/auth/me/location
POST /api/v1/posts/generate
POST /api/v1/posts
GET /api/v1/posts/7
GET /api/v1/posts/nearby?latitude=33.4996&longitude=126.5312&radius_km=2.0
GET /api/v1/fridges/available?latitude=35.1595&longitude=126.9136&radius_km=2.0
```

## 최종 기준선

다음 스프린트로 넘어가기 전에 최소한 아래 질문에 답할 수 있어야 한다.

- 로그인하면 유저가 실제로 생성/업데이트되는가?
- 동네 위치 미설정(`latitude = NULL`, `longitude = NULL`) 유저가 앱을 써도 깨지지 않는가?
- 위치 등록 후 앱의 주요 화면이 정상적으로 위치를 사용하고 있는가?
- 사진 촬영 데이터가 AI 파이프라인까지 실제로 전달되는가?
- AI 응답이 나눔 식재료 등록 데이터로 어떻게 변환되는가?
- 나눔 기준 미충족 상태(`Stale`)일 때 사용자는 무엇을 보게 되는가?
- 서버/API/AI/권한/네트워크 실패 시 앱이 멈추지 않는가?
- 한 장 촬영 흐름은 유지할 것인가, 조건부 추가 확인을 붙일 것인가?
- multi-object detection은 다음 스프린트의 구현 대상인가, 연구/검증 대상인가?
- 채팅, 푸쉬, 통계, 소셜 로그인은 다음 스프린트에 넣을 만큼 중요한가?
