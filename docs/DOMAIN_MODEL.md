# FoodLink Domain Model

## Agent Workflow

- Authority: canonical FoodLink domain language, relationships, and ambiguity
  resolution.
- Read before: changing names for screens, API fields, statuses, policies, or
  user-facing domain concepts.
- Update when: a new canonical term is introduced, an avoid term is found in
  active docs/code, or a relationship between concepts changes.
- Required evidence: canonical term, avoid terms, relationship rule, and an
  example dialogue when the ambiguity is likely to recur.
- Related workflows: `domain-model`, `ubiquitous-language`, `grill-me`.
- Source-of-truth conflicts: this document wins for terminology. If API fields
  use different names, document the translation in
  [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md).

FoodLink는 사용자가 남는 식재료를 AI로 확인하고, 가까운 공유 냉장고를 통해 이웃에게 나눔 식재료로 연결하는 로컬 식재료 나눔 컨텍스트다.

## Language

**동네 위치**:
주변 나눔 식재료와 공유 냉장고를 찾기 위해 사용자가 등록한 기준 위치.
_Avoid_: `default_location`, 기본 좌표, 현재 GPS

**위치 미설정 사용자**:
아직 **동네 위치**를 등록하지 않은 사용자.
_Avoid_: `default_location = NULL`

**식재료**:
AI가 사진에서 확인하는 음식 재료 대상. 나눔으로 등록되기 전의 원재료 개념이다.
_Avoid_: product, item, crop object

**나눔 식재료**:
공유 냉장고에 보관되어 이웃이 신청할 수 있는 하나의 식재료 등록 단위.
_Avoid_: 게시글, post, product, inventory item, feed item

**나눔 식재료 등록**:
사용자가 남는 식재료를 촬영/선택하고, AI 분석 결과를 확인한 뒤 공유 냉장고를 선택해 나눔 가능한 상태로 만드는 행위.
_Avoid_: 게시글 작성, product upload

**신선도 등급**:
AI가 식재료의 외관 상태를 분류한 내부 등급. 현재 백엔드 label은 `Fresh`, `Mid`, `Stale`, `unknown`이다.
_Avoid_: freshness, 부패도 category, 품질 점수

**나눔 가능 여부**:
분석된 식재료가 나눔 식재료 등록으로 진행될 수 있는지를 판단한 정책 결과.
_Avoid_: freshness, isFresh

**나눔 기준 미충족**:
AI/정책 기준상 나눔 식재료로 등록하지 않는 상태. 사용자에게는 확정적인 부패 판정처럼 말하지 않는다.
_Avoid_: 부패, 상함, 썩음, 나쁨, AI 실패

**확인 필요**:
AI 신뢰도, 사진 품질, 여러 객체 감지 등으로 사용자가 상태를 한 번 더 살펴봐야 하는 검토 신호.
_Avoid_: 실패, 등록 불가, 부패 의심

**공유 냉장고**:
나눔 식재료를 실제로 보관하고 수요자가 수령하러 가는 오프라인 냉장고 위치.
_Avoid_: 냉장고, inventory, 보관함

**등록 가능 공유 냉장고**:
새 나눔 식재료의 보관 장소로 선택할 수 있는 공유 냉장고.
_Avoid_: available 냉장고, 사용 가능한 냉장고

**나눔 신청**:
수요자가 available 상태의 나눔 식재료를 받고 싶다는 의사를 보내는 행위.
_Avoid_: 예약 확정, 결제, 채팅 시작

**나눔 상태**:
나눔 식재료가 신청 가능, 신청 접수, 예약, 완료, 취소, 만료 등으로 변하는 생명주기 상태.
_Avoid_: 게시글 상태, API status

**기술 Post**:
현재 API와 코드에서 쓰는 `/posts`, `Post`, `postId` 계열 기술 명칭. 도메인 언어로는 **나눔 식재료**를 뜻한다.
_Avoid_: 사용자-facing 용어로 post/product 사용

**기술 ShareRequest**:
현재 백엔드에서 나눔 신청 접수를 저장하는 `share_requests` 테이블/모델의 기술 명칭. 도메인 언어로는 **나눔 신청**을 뜻한다.
_Avoid_: 예약, 거래, 채팅 요청

**환경 성취 지표**:
CO2 절감량, 이번 달 기여량처럼 사용자가 잘한 일을 확인하게 해주는 보조 성취 레이어.
_Avoid_: 핵심 가치 제안, 등록 이유의 1순위

## Relationships

- **위치 미설정 사용자**는 **동네 위치**가 없다.
- 현재 앱 계약에서 **동네 위치**는 nullable latitude와 longitude로 표현한다.
- AI 분석은 대표 **식재료** 하나에 대해 하나의 **신선도 등급**과 하나의 **나눔 가능 여부**를 만든다.
- `Fresh`와 `Mid` 계열 **신선도 등급**은 사용자 흐름에서 모두 `상태가 좋아 보여요`와 `나눔 가능`으로 통합 표시한다. 기존 프론트 문서의 `Normal`은 `Mid`와 같은 그룹이다.
- `Stale`은 **나눔 기준 미충족**으로 보고 등록하지 않는다. `unknown`은 바로 등록 가능한 상태로 보지 않고 확인/실패 상태로 처리한다. `Bad`, `Rotten`은 현재 백엔드 label은 아니지만 구형/후속 label로 내려오면 같은 차단 그룹으로 다룬다.
- `not_food`, `non_food`, `low_quality`, `screenshot`, `ui_screenshot` 계열은 **나눔 기준 미충족** 또는 식재료 사진 확인 실패로 보고 등록하지 않는다.
- `confidenceScore`는 Stage 2 신선도 분류 모델의 softmax max 확률이다. 객체 탐지 confidence나 식재료 여부 confidence가 아니며, 단독 차단 기준으로 쓰지 않는다.
- 하나의 **나눔 식재료**는 작성자 한 명과 **공유 냉장고** 하나에 속한다.
- 하나의 **공유 냉장고**에는 0개 이상의 **나눔 식재료**가 연결될 수 있다.
- 홈은 사용자가 먼저 **나눔 식재료**를 찾는 화면이다.
- 지도는 주변 **공유 냉장고**와 그 안의 available **나눔 식재료**를 탐색하는 화면이다.
- MVP의 수요자 흐름은 `available -> requested`까지 검증한다.
- `requested`는 수요자의 **나눔 신청**이 접수된 상태이며, 예약 확정(`reserved`)이나 수령 완료(`completed`)가 아니다.
- 첫 신청이 접수되면 서버는 나눔 상태를 `requested`로 바꾸고 추가 신청을 거절한다. 이미 `requested`인 나눔 식재료에 대한 추가 신청은 409 충돌이다.
- MVP에서는 `requested` 이후 공급자 승인 행동을 요구하지 않는다. 운영 문제는 초기에는 수동 운영으로 제어하고, 관리자 화면은 후순위 제품 범위로 둔다.

## State Vocabulary

| State       | Domain meaning              | MVP scope                                      |
| ----------- | --------------------------- | ---------------------------------------------- |
| `available` | 신청 가능한 나눔 식재료     | 구현/검증 대상                                 |
| `requested` | 수요자의 나눔 신청이 접수됨 | 백엔드 구현됨, 프론트 연동 대상                |
| `reserved`  | 특정 수요자에게 예약 확정됨 | 후속                                           |
| `completed` | 실제 수령 완료              | 백엔드 상태값은 존재하지만 앱 제품 흐름은 후속 |
| `cancelled` | 등록자/운영자가 취소        | 후속 또는 수동 운영                            |
| `expired`   | 나눔 가능 기간이 지남       | 후속                                           |

## Command And Transition Rules

| Command          | Actor         | Preconditions                                                   | State/effect                    | Rule                                                                                                |
| ---------------- | ------------- | --------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| 나눔 식재료 등록 | 공급자        | 동네 위치 있음, AI 결과가 나눔 가능, 등록 가능 공유 냉장고 선택 | 새 나눔 식재료 `available` 생성 | 등록 완료는 실제 보관 검증이 아니라 공유 냉장고에 등록 의사를 연결한 상태다.                        |
| 나눔 신청        | 수요자        | 나눔 식재료가 `available`, 신청자가 작성자가 아님               | `available -> requested`        | 첫 신청 접수 후 추가 신청 CTA를 막는다. 서버는 작성자 본인 신청 403, 중복/경합 신청 409를 반환한다. |
| 신청 접수 알림   | 시스템        | 나눔 신청 성공                                                  | 공급자에게 신청 알림            | 공급자 승인/거절은 MVP에 없다.                                                                      |
| 수령 완료        | 수요자/운영자 | 후속 버전의 예약/수령 검증 수단 필요                            | `completed`                     | QR, 비밀번호 토큰, 관리자 확인을 설계한 뒤에만 제품 흐름에 넣는다.                                  |
| 운영자 조정      | 운영자        | 관리자 화면 또는 수동 운영 절차 필요                            | `cancelled`, `expired` 등       | 관리자 화면은 제품 범위에는 있지만 MVP 구현 범위 밖이다.                                            |

`requested`는 예약 확정이 아니므로 수요자에게 "예약됐어요"라고 말하지 않는다. 적절한 표현은 `신청이 접수됐어요`, `공급자에게 신청 알림을 보냈어요`다.

## Product Principles

- 핵심 가치는 남는 식재료 처리의 귀찮음과 죄책감을 줄이는 것이다.
- 환경 성취 지표는 핵심 가치가 아니라 사용자가 잘한 일을 확인하게 해주는 보조 레이어다.
- 사용자에게 부정적인 AI 결과를 확정적 품질 판정처럼 말하지 않는다. 기본 표현은 `나눔 기준에 맞지 않아요`다.
- `Fresh`와 `Mid`(`Normal` 그룹)의 세부 차이는 내부 데이터/추천/QA에서만 쓰고, 사용자 흐름에서는 같은 나눔 가능 상태로 다룬다.

## Example Dialogue

> **Dev:** "신규 가입 유저를 홈으로 보낼 때 `default_location`을 확인하면 되나요?"
> **Domain expert:** "`default_location`이 아니라 **동네 위치**라고 부르세요. latitude와 longitude가 없으면 **위치 미설정 사용자**입니다."
>
> **Dev:** "API가 `/posts`를 쓰니까 도메인도 나눔 게시글이라고 부르면 되나요?"
> **Domain expert:** "아니요. 현재 API의 `post`는 기술 명칭입니다. 사용자와 제품 문서에서는 **나눔 식재료**라고 부르세요."
>
> **Dev:** "AI가 Fresh와 Mid를 다르게 주면 사용자에게 둘 다 보여줘야 하나요?"
> **Domain expert:** "주요 흐름에서는 합칩니다. 둘 다 `상태가 좋아 보여요`와 `나눔 가능`으로 보여주고, 내부 정책과 QA에서만 구분하세요. 기존 문서의 Normal은 Mid 그룹으로 번역합니다."
>
> **Dev:** "confidence가 45%면 등록을 막나요?"
> **Domain expert:** "아니요. `confidenceScore`는 신선도 분류 모델이 Fresh/Mid/Stale 중 하나로 분류한 softmax max 확률입니다. 0.9 미만이면 `확인 필요`로 표시하지만, 값만으로 등록을 막지는 않습니다."
>
> **Dev:** "수요자가 나눔 신청을 누르면 예약 확정인가요?"
> **Domain expert:** "아니요. MVP의 `requested`는 신청 접수입니다. 예약 확정과 수령 완료는 후속 상태입니다."

## Flagged Ambiguities

- `post`, `게시글`, `product`, `item`이 섞여 쓰였다. 해결: 도메인 용어는 **나눔 식재료**, 현재 API/코드의 `post`는 **기술 Post**로 번역한다.
- `default_location`이 검증 문서에서 쓰였지만 앱/서버 계약은 nullable latitude와 longitude를 사용한다. 해결: **동네 위치**와 **위치 미설정 사용자**를 쓴다.
- `freshness`, `isFresh`, `category`, `freshnessLabel`이 섞여 쓰였다. 해결: **신선도 등급**은 AI 분류, **나눔 가능 여부**는 등록 정책이다.
- `Normal`과 `Mid`가 섞여 쓰였다. 해결: 현재 백엔드 label은 `Mid`, 기존 프론트 문서의 `Normal`은 같은 나눔 가능 그룹으로 번역한다.
- `Bad/Rotten`은 현재 백엔드 label이 아니다. 해결: 현재 서버 계약에서는 `Stale`만 나눔 기준 미충족 label로 보고, `Bad/Rotten`은 방어적 호환 label로만 차단한다.
- `confidenceScore`의 의미가 불명확했다. 해결: Stage 2 신선도 분류 모델의 softmax max 확률이며, 단독 등록 차단 기준으로 쓰지 않는다.
- confidence 표시 threshold는 백엔드 활용 가이드를 따라 0.9 미만으로 확정했다. 단, 낮은 confidence만으로 등록을 차단하지 않고 `확인 필요` UX로만 사용한다.
- 첫 신청 이후 추가 신청 차단은 백엔드에서 구현됐다. 해결: 첫 신청 접수 후 `requested`로 전환하고 추가 신청은 409로 거절한다.
- 관리자 화면은 제품 범위에는 포함되지만 MVP 구현 범위에서는 제외한다. 초기 운영 제어는 수동 운영으로 처리한다.
