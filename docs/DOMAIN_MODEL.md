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

FoodLink는 사용자가 식재료를 AI로 확인하고, 가까운 공유 냉장고에 연결해 이웃에게 나눔 게시글로 노출하는 로컬 식재료 나눔 컨텍스트다.

## Language

**동네 위치**:
주변 나눔 게시글과 공유 냉장고를 찾기 위해 사용자가 등록한 기준 위치.
_Avoid_: `default_location`, 기본 좌표, 현재 GPS

**위치 미설정 사용자**:
아직 **동네 위치**를 등록하지 않은 사용자.
_Avoid_: `default_location = NULL`

**신선도 등급**:
AI가 식재료의 외관 상태를 분류한 등급.
_Avoid_: freshness, 부패도 category, 품질 점수

**나눔 가능 여부**:
분석된 식재료가 나눔 등록으로 진행될 수 있는지를 판단한 정책 결과.
_Avoid_: freshness, isFresh

**확인 필요**:
나눔 가능한 신선도 등급이지만 AI 신뢰도가 낮아 사용자의 확인이 필요한 상태.
_Avoid_: 실패, 등록 불가

**부패 의심**:
식재료가 stale, bad, rotten 계열로 보여 나눔 등록이 불가한 상태.
_Avoid_: 나쁨, AI 실패

**공유 냉장고**:
사용자가 나눔 식재료를 실제로 보관하고 나눔 게시글이 연결되는 오프라인 냉장고 위치.
_Avoid_: 냉장고, inventory, 보관함

**등록 가능 공유 냉장고**:
새 나눔 게시글의 보관 장소로 선택할 수 있는 공유 냉장고.
_Avoid_: available 냉장고, 사용 가능한 냉장고

**나눔 게시글**:
하나의 공유 냉장고에 보관된 하나의 나눔 가능한 식재료를 이웃에게 알리는 글.
_Avoid_: post, feed item, inventory item

**나눔 상태**:
나눔 게시글이 나눔 가능, 예약, 완료, 취소, 만료 등으로 변하는 생명주기 상태.
_Avoid_: 게시글 상태, API status

## Relationships

- **위치 미설정 사용자**는 **동네 위치**가 없다.
- 현재 앱 계약에서 **동네 위치**는 nullable latitude와 longitude로 표현한다.
- AI 분석은 대표 식재료 하나에 대해 하나의 **신선도 등급**과 하나의 **나눔 가능 여부**를 만든다.
- **신선도 등급** 중 Fresh와 Normal 계열은 나눔 가능, Stale/Bad/Rotten 계열은 **부패 의심**이다.
- **확인 필요**는 **부패 의심**과 다르다. 사용자 확인을 요구하지만 그 자체로 등록을 차단하지 않는다.
- 하나의 **나눔 게시글**은 작성자 한 명과 **공유 냉장고** 하나에 속한다.
- 하나의 **공유 냉장고**에는 0개 이상의 **나눔 게시글**이 연결될 수 있다.
- 현재 MVP는 **공유 냉장고** 위치와 주변 **나눔 게시글**을 보여주지만, 별도 냉장고 inventory는 모델링하지 않는다.
- 현재 서버 응답에서 관측된 **나눔 상태**는 `available`뿐이며, 예약/완료/취소/만료는 아직 앱 플로우로 구현되지 않았다.

## Example Dialogue

> **Dev:** "신규 가입 유저를 홈으로 보낼 때 `default_location`을 확인하면 되나요?"
> **Domain expert:** "`default_location`이 아니라 **동네 위치**라고 부르세요. latitude와 longitude가 없으면 **위치 미설정 사용자**입니다."
>
> **Dev:** "AI가 Fresh를 45% confidence로 반환하면 부패인가요?"
> **Domain expert:** "아니요. 그건 **부패 의심**이 아니라 **확인 필요**입니다. 사용자가 실제 상태를 확인한 뒤 **나눔 게시글**을 만들 수 있습니다."
>
> **Dev:** "공유 냉장고 상세에서 inventory를 보여줘도 되나요?"
> **Domain expert:** "MVP에서는 아닙니다. **공유 냉장고**는 위치이고, 보이는 식재료는 그 위치에 연결된 **나눔 게시글**입니다."

## Flagged Ambiguities

- `default_location`이 검증 문서에서 쓰였지만 앱/서버 계약은 nullable latitude와 longitude를 사용한다. 해결: **동네 위치**와 **위치 미설정 사용자**를 쓴다.
- `freshness`, `isFresh`, `category`가 섞여 쓰였다. 해결: **신선도 등급**은 AI 분류, **나눔 가능 여부**는 등록 정책이다.
- "냉장고"가 물리적 장소와 inventory 화면을 모두 뜻했다. 해결: 물리적 장소는 **공유 냉장고**, inventory는 현재 MVP 범위 밖이다.
- "게시글 상태"가 일반 API 필드처럼 쓰였다. 해결: 도메인 생명주기는 **나눔 상태**라고 부르고, 현재 관측된 값은 `available`뿐이다.
