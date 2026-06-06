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
사용자가 남는 농산물/식재료를 촬영/선택하고, AI 분석 결과를 확인한 뒤 공유 냉장고를 선택해 나눔 식재료 생명주기를 시작하는 행위. 정식 QR 흐름에서는 이 행위만으로 public 목록에 노출하지 않고 **등록 대기** 상태를 만든다.
_Avoid_: 게시글 작성, product upload

**농산물 등록 흐름**:
스캔, AI 모델 확인, 결과 확인, 공유 냉장고 선택, 나눔 식재료 등록으로 이어지는 제품 흐름. QR 기능과 별개의 나눔 flow가 아니라, QR 보관 인증으로 이어지는 앞 단계다.
_Avoid_: 기존 MVP flow, 일반 나눔 flow, 직거래 flow

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
AI 검토 신호, 사진 품질, 여러 객체 감지 등으로 사용자가 상태를 한 번 더 살펴봐야 하는 검토 신호.
_Avoid_: 실패, 등록 불가, 부패 의심

**공유 냉장고**:
나눔 식재료를 실제로 보관하고 수요자가 수령하러 가는 오프라인 냉장고 위치.
_Avoid_: 냉장고, inventory, 보관함

**등록 가능 공유 냉장고**:
새 나눔 식재료의 보관 장소로 선택할 수 있는 공유 냉장고.
_Avoid_: available 냉장고, 사용 가능한 냉장고

**냉장고 운영자**:
공유 냉장고를 현장에서 점검하고, 보관된 나눔 식재료의 수령 확인, 폐기, 분실 확인, 정리 같은 운영 작업을 수행하는 사람.
_Avoid_: 시스템 관리자, admin, 백오피스 관리자

**냉장고 QR**:
공유 냉장고에 고정으로 붙어 있는 QR 코드. 사용자가 해당 공유 냉장고 앞에 왔음을 확인하는 식별자이며, QR 자체를 비밀키처럼 믿지 않는다.
_Avoid_: 일회용 사용자 QR, 비밀 인증키

**QR 인증**:
사용자가 냉장고 QR을 스캔하고, 서버가 로그인 사용자, 진행 중인 행동, 공유 냉장고, action별 제한 시간을 검증해 보관 확인 또는 수령 확인을 처리하는 행위.
_Avoid_: QR만으로 인증 완료, 위치 보증

**등록 대기**:
공급자가 나눔 식재료 등록을 시작했지만 아직 공유 냉장고 QR 인증으로 실제 보관을 확인하지 않은 상태. 사용자-facing available 목록에 노출하지 않는다.
_Avoid_: 등록 완료, available

**임시 선점**:
QR 도입 이후 수요자의 나눔 신청이 30분 동안 해당 나눔 식재료를 다른 사용자에게서 잠시 막아두는 상태.
_Avoid_: 예약 확정, 수령 완료

**라벨 코드**:
공급자가 실제 식재료에 적거나 붙이는 짧은 식별 코드. 수요자와 냉장고 운영자가 물리적 식재료를 찾는 데 쓴다.
_Avoid_: 개인정보 라벨, 사용자명 라벨

**보관 구역**:
공유 냉장고 안에서 나눔 식재료를 놓는 물리적 구역. 초기 정책은 일반 구역과 에틸렌 분리 구역 정도로 제한한다.
_Avoid_: 복잡한 창고 위치 체계

**냉장고 재고**:
냉장고 운영자가 점검하는 공유 냉장고 안의 물리적 나눔 식재료 상태. 수요자-facing nearby feed나 냉장고별 available 목록과 구분한다.
_Avoid_: 사용자-facing inventory item

**보관 배치**:
한 번의 QR 보관 확인으로 생긴 물리적 보관 묶음. 기술 구현에서는 `basket`, `inventory_batch`, `registration_batch` 같은 이름이 후보지만, 사용자-facing 신청 단위는 계속 **나눔 식재료**다.
_Avoid_: 사용자가 골라야 하는 바구니

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

**수령 경험 평가**:
수요자가 **수령 QR 인증**으로 실제 수령을 완료한 뒤, 해당 **기술 ShareRequest** 1건에 대해 남기는 태그 기반 경험 피드백.
_Avoid_: 별점, 공급자 점수, 안전성 보증

**나눔 신고**:
수령 완료 이후 운영자 검토가 필요한 문제를 **기술 ShareRequest** 1건에 연결해 남기는 요청. 평가 태그가 아니라 단일 신고 사유, 작업 상태(`open`, `reviewing`, `closed`), 판단 결과(`pending`, `dismissed`, `violation_confirmed`), 운영 조치(`none`, `warning_issued`, `post_hidden`, `post_removed`, `temporary_share_restricted`, `account_suspended`)를 가진 운영 큐 항목이다.
_Avoid_: 가벼운 불만족 태그와 혼합, 공개 낙인

**공급자 신뢰 뱃지**:
QR 보관 인증, 수령 완료 기록, 긍정 평가처럼 공개 가능한 긍정/검증 행동을 요약해 보여주는 태그형 신뢰 신호. 신고 건수, 위반 여부, 제재 이력은 공개 뱃지에 포함하지 않는다.
_Avoid_: 신뢰도 점수, 등급, 랭킹

**환경 성취 지표**:
CO2 절감량, 이번 달 기여량처럼 사용자가 잘한 일을 확인하게 해주는 보조 성취 레이어.
_Avoid_: 핵심 가치 제안, 등록 이유의 1순위

## Relationships

- **위치 미설정 사용자**는 **동네 위치**가 없다.
- 현재 앱 계약에서 **동네 위치**는 nullable latitude와 longitude로 표현한다.
- AI 분석은 대표 **식재료** 하나에 대해 하나의 **신선도 등급**과 하나의 **나눔 가능 여부**를 만든다.
- `Fresh`와 `Mid` 계열 **신선도 등급**은 사용자 흐름에서 모두 `상태가 좋아 보여요`와 `나눔 가능`으로 통합 표시한다. 기존 프론트 문서의 `Normal`은 `Mid`와 같은 그룹이다.
- `Stale`은 **나눔 기준 미충족**으로 보고 등록하지 않는다. `unknown`은 바로 등록 가능한 상태로 보지 않고 확인/실패 상태로 처리한다. `Bad`, `Rotten`은 현재 백엔드 label은 아니지만 구형/후속 label로 내려오면 같은 차단 그룹으로 다룬다.
- `not_food`, `non_food`, `low_quality` 계열은 서버가 rejection/review 신호를 주면 **나눔 기준 미충족** 또는 식재료 사진 확인 실패로 보고 등록하지 않는다. 단, 2026-05-08 MVP 서버 계약에서 `screenshot`, `ui_screenshot` 계열은 별도 판별 모델이 없어 `Fresh + imageToken`으로 통과할 수 있으며, 이 경우 낮은 confidence는 숫자 없는 **확인 필요**로만 표시하고 등록은 허용한다. `screenshot`, `ui_screenshot`은 Post-MVP rejection reason 후보로 관리한다.
- `confidenceScore`는 Stage 2 신선도 분류 모델의 softmax max 확률이다. 객체 탐지 confidence나 식재료 여부 confidence가 아니며, 단독 차단 기준으로 쓰지 않는다. 사용자/운영자 UI에는 원값, 소수, 퍼센트 같은 정량 신뢰도 표현을 노출하지 않는다.
- 하나의 **나눔 식재료**는 작성자 한 명과 **공유 냉장고** 하나에 속한다.
- 하나의 **공유 냉장고**에는 0개 이상의 **나눔 식재료**가 연결될 수 있다.
- MVP의 **권장 수령일**은 AI가 판정한 소비기한이 아니라 앱이 제안하는 단기 수령 목표다. 앱은 기본 3일 뒤를 제안하고, OCR/라벨 소비기한 인식이 없으므로 공급자는 오늘, 내일, 3일 뒤 안에서만 조정한다. 임의의 장기 날짜 입력은 허용하지 않는다.
- 홈은 사용자가 먼저 **나눔 식재료**를 찾는 화면이다.
- 지도는 주변 **공유 냉장고**와 그 안의 available **나눔 식재료**를 탐색하는 화면이다.
- **농산물 등록 흐름**은 QR 보관 인증 전까지 수요자-facing 목록에 나눔 식재료를 노출하지 않는다.
- 정식 QR 흐름에서 **나눔 식재료 등록**은 `pending_store`를 만들고, **보관 QR 인증**이 성공한 뒤에야 `available`이 된다.
- `requested`는 수요자의 **나눔 신청**이 접수되고 해당 나눔 식재료를 30분 동안 **임시 선점**한 상태이며, 예약 확정(`reserved`)이나 수령 완료(`completed`)가 아니다.
- 첫 신청이 접수되면 서버는 나눔 상태를 `requested`로 바꾸고 추가 신청을 거절한다. 이미 `requested`인 나눔 식재료에 대한 추가 신청은 409 충돌이다.
- 정식 QR 흐름에서는 `requested` 이후 공급자 승인 행동을 요구하지 않는다. 수요자가 제한 시간 안에 **수령 QR 인증**을 완료해야 나눔 완료가 된다.
- **수령 경험 평가**와 **나눔 신고**는 수요자가 **수령 QR 인증**을 완료해 `ShareRequest.status=completed`가 된 뒤에만 허용한다.
- **공급자 신뢰 뱃지**는 개별 별점이 아니라 완료된 QR 생명주기와 태그 기반 평가를 집계한 결과다. 신고는 공개 신뢰 뱃지가 아니라 운영자 검토와 제재 판단으로만 이어진다.
- **냉장고 운영자**는 시스템 계정/권한 전체를 관리하는 admin이 아니라, 특정 공유 냉장고의 현장 상태를 점검하는 운영 역할이다.
- **등록 대기** 나눔 식재료는 **보관 QR 인증** 전까지 홈/지도/냉장고 available 목록에 노출하지 않는다.
- **냉장고 QR**은 공유 냉장고 식별자일 뿐이고, 실제 인증은 서버가 사용자, pending action, fridgeId, action별 제한 시간을 검증해 처리한다.
- **라벨 코드**는 QR 인증과 별개다. QR은 냉장고 앞 인증이고 라벨은 냉장고 안에서 물리적 식재료를 찾기 위한 식별자다.
- **보관 구역**은 처음에는 `GENERAL`과 `ETHYLENE_SEPARATED` 정도로 제한한다. 에틸렌 분리 구역은 물리 설치가 보류되어도 데이터 모델에서 표현할 수 있어야 한다.
- **냉장고 재고**는 수요자-facing 목록이 아니라 **냉장고 운영자**가 점검하는 현장 운영 레이어다.

## State Vocabulary

| State       | Domain meaning              | Product rule                                   |
| ----------- | --------------------------- | ---------------------------------------------- |
| `pending_store` | QR 보관 인증 전 등록 대기 | 수요자-facing 목록에 노출하지 않는다.          |
| `available` | 신청 가능한 나눔 식재료     | 보관 QR 인증 후에만 홈/지도/냉장고 목록에 노출한다. |
| `requested` | 신청 접수 및 30분 임시 선점 | 추가 신청을 막고, 수요자 수령 QR 인증을 기다린다. |
| `reserved`  | 특정 수요자에게 예약 확정됨 | 정식 QR 흐름에서는 쓰지 않는다.                |
| `completed` / `picked_up` | 실제 수령 완료 또는 수령 확인 이벤트 | 원칙적으로 수요자 수령 QR 인증으로 확정한다.   |
| `cancelled` | 등록자/냉장고 운영자가 취소 | 등록 대기, 신청 가능, 신청 접수 상태에서 정책에 따라 종료한다. |
| `expired`   | 나눔 가능 기간 또는 QR 제한 시간이 지남 | 서버 배치/lazy-expire가 처리한다.              |
| `disposed`  | 냉장고 운영자가 폐기/회수 완료 | 냉장고 운영자 재고 점검 흐름에서만 사용한다.   |

## Command And Transition Rules

| Command          | Actor         | Preconditions                                                   | State/effect                    | Rule                                                                                                |
| ---------------- | ------------- | --------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| 농산물 등록 흐름 완료 | 공급자        | 동네 위치 있음, AI 결과가 나눔 가능, 등록 가능 공유 냉장고 선택 | 새 나눔 식재료 `pending_store` 생성 | 등록 완료는 실제 보관 검증이 아니다. 보관 QR 인증 전까지 public 목록에 노출하지 않는다.             |
| 나눔 신청        | 수요자        | 나눔 식재료가 `available`, 신청자가 작성자가 아님               | `available -> requested`        | 첫 신청 접수 후 추가 신청 CTA를 막는다. 서버는 작성자 본인 신청 403, 중복/경합 신청 409를 반환한다. |
| 신청 접수 알림   | 시스템        | 나눔 신청 성공                                                  | 공급자에게 신청 알림            | 공급자 승인/거절은 정식 QR 흐름에 없다.                                                             |
| 보관 QR 인증     | 공급자        | `pending_store`, 선택한 공유 냉장고, 10분 안의 냉장고 QR 스캔 | `pending_store -> available`    | QR 도입 후에는 실제 보관 확인 전까지 public 목록에 노출하지 않는다.                                  |
| 수령 QR 인증     | 수요자        | `requested`, 30분 안의 냉장고 QR 스캔                           | `requested -> completed/picked_up` | 수령 QR 인증이 정식 나눔 완료 기준이다. 제한 시간이 지나면 available로 복원한다.                    |
| 수동 완료 처리   | 냉장고 운영자 또는 예외 권한자 | QR 수령 인증이 불가능하고 운영상 완료 증거가 따로 있음 | `completed`                     | 정식 사용자 흐름이 아니라 감사 로그가 필요한 예외 처리다. 공급자 기본 CTA로 노출하지 않는다.        |
| 냉장고 운영자 조정 | 냉장고 운영자 | 냉장고 운영자 화면 또는 수동 운영 절차 필요                       | `cancelled`, `expired`, `disposed` 등 | 현장 점검과 예외 처리를 위한 운영 흐름이다.                                                          |

`requested`는 예약 확정이 아니므로 수요자에게 "예약됐어요"라고 말하지 않는다. 적절한 표현은 `신청이 접수됐어요`, `수령 제한 시간 안에 QR 인증을 완료해주세요`다.

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
> **Domain expert:** "아니요. `confidenceScore`는 신선도 분류 모델이 Fresh/Mid/Stale 중 하나로 분류한 softmax max 확률입니다. 0.9 미만이면 숫자 없이 `확인 필요`로 표시하지만, 값만으로 등록을 막지는 않습니다."
>
> **Dev:** "스크린샷이 `Fresh + imageToken`으로 통과하면 프론트가 막아야 하나요?"
> **Domain expert:** "MVP에서는 막지 않습니다. 서버가 screenshot/UI 판별 모델을 갖고 있지 않으므로 현재 계약은 통과 허용이고, 프론트는 낮은 confidence를 숫자 없는 `확인 필요`로만 표시합니다. 차단은 Post-MVP rejection reason이 내려온 뒤 적용합니다."
>
> **Dev:** "수요자가 나눔 신청을 누르면 예약 확정인가요?"
> **Domain expert:** "아니요. `requested`는 신청 접수와 30분 임시 선점입니다. 예약 확정이 아니고, 수령 QR 인증이 끝나야 나눔 완료입니다."
>
> **Dev:** "농산물 등록 흐름이 끝나면 바로 주변 나눔 목록에 보여줘도 되나요?"
> **Domain expert:** "아니요. 농산물 등록은 보관 의사를 만든 상태입니다. 보관 QR 인증 전까지는 등록 대기이고, 홈/지도/냉장고 available 목록에 노출하지 않습니다."

## Flagged Ambiguities

- `post`, `게시글`, `product`, `item`이 섞여 쓰였다. 해결: 도메인 용어는 **나눔 식재료**, 현재 API/코드의 `post`는 **기술 Post**로 번역한다.
- `default_location`이 검증 문서에서 쓰였지만 앱/서버 계약은 nullable latitude와 longitude를 사용한다. 해결: **동네 위치**와 **위치 미설정 사용자**를 쓴다.
- `freshness`, `isFresh`, `category`, `freshnessLabel`이 섞여 쓰였다. 해결: **신선도 등급**은 AI 분류, **나눔 가능 여부**는 등록 정책이다.
- `Normal`과 `Mid`가 섞여 쓰였다. 해결: 현재 백엔드 label은 `Mid`, 기존 프론트 문서의 `Normal`은 같은 나눔 가능 그룹으로 번역한다.
- `Bad/Rotten`은 현재 백엔드 label이 아니다. 해결: 현재 서버 계약에서는 `Stale`만 나눔 기준 미충족 label로 보고, `Bad/Rotten`은 방어적 호환 label로만 차단한다.
- `confidenceScore`의 의미가 불명확했다. 해결: Stage 2 신선도 분류 모델의 softmax max 확률이며, 단독 등록 차단 기준으로 쓰지 않는다.
- confidence 검토 threshold는 백엔드 활용 가이드를 따라 0.9 미만으로 확정했다. 단, 낮은 confidence만으로 등록을 차단하지 않고 숫자 없는 `확인 필요` UX로만 사용한다.
- `screenshot`/`ui_screenshot` 처리 범위가 불명확했다. 해결: 2026-05-08 MVP 계약에서는 서버가 `Fresh + imageToken`을 반환하면 등록을 허용하고, Post-MVP rejection reason 후보로만 관리한다.
- 첫 신청 이후 추가 신청 차단은 백엔드에서 구현됐다. 해결: 첫 신청 접수 후 `requested`로 전환하고 추가 신청은 409로 거절한다.
- `관리자`가 시스템 admin인지 냉장고 현장 운영자인지 불명확했다. 해결: 냉장고 상태 파악, 점검, 폐기, 수령 확인을 수행하는 역할은 **냉장고 운영자**로 부른다.
- `기존 MVP 흐름`, `일반 나눔`, `직거래 흐름`이 QR 기능과 분리된 별도 나눔 flow처럼 쓰였다. 해결: 제품 도메인에서는 **농산물 등록 흐름**이 QR 보관/수령 인증으로 이어지는 하나의 생명주기다. 보관 QR 인증 전에는 `pending_store`이며 public 목록에 노출하지 않는다.
- 작성자 `complete`가 정식 나눔 완료처럼 노출될 수 있었다. 해결: 나눔 완료의 원칙은 수요자 **수령 QR 인증**이고, 수동 완료 처리는 냉장고 운영자 또는 예외 권한자가 수행하는 감사 대상 예외 처리다.
- **냉장고 운영자**가 개별 나눔 식재료 상태를 직접 변경할 수 있는지는 바구니 기능을 정식 채택할지와 함께 결정한다.
