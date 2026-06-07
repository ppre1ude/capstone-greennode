# GreenNode/FoodLink CEO Review - 2026-05-17

## Product Thesis Assessment

판정: 방향은 강하다. 다만 지금은 “완성된 MVP”보다 “핵심 MVP 플로우가 검증된 프로토타입”이라고 말해야 한다.

가장 설득력 있는 제품 논리는 명확하다. 남는 식재료를 버리기 전 AI로 나눔 가능성을 확인하고, 가까운 공유 냉장고를 통해 이웃에게 연결한다. 이 내러티브는 `generate -> create -> home/detail/map -> request -> requested 제외`까지 실제 Android/VM QA가 기록되어 있어 꽤 믿을 만하다.

하지만 “알림이 간다”, “AI가 신선도를 판별한다”, “냉장고 운영자가 관리한다”는 문장은 아직 조심해야 한다. FCM 실수신은 당시 환경 리스크였고 2026-05-25 실기기+emulator 2계정 QA로 닫혔다. screenshot/low-quality/stale false-positive는 MVP 허용 또는 Post-MVP 계약으로 분류되어 있다. 냉장고 운영자 콘솔과 바구니는 현재 정적 fixture 기반 운영 콘셉트다.

> 2026-06-07 상태 갱신: 이 리뷰의 FCM 항목은 2026-05-17 당시 리스크 기록이다. 현재 active 항목은 live VM/OpenAPI 재검증, AI 정확도/계약, 최신 운영자 계정 검증이다.

## What Is Already Credible

- 핵심 나눔 플로우는 credible하다. 문서상 MVP는 `available -> requested`까지이고, 구현/QA도 이 기준에 맞춰 닫혔다.
- AI freshness scan은 “실제 API 호출 기반 분석/등록”으로 말할 수 있다.
- 공유 냉장고 내러티브는 강하다. 지도에서 냉장고를 고르고, `GET /fridges/{id}/posts?status=available`로 내부 available 나눔 식재료를 보는 구조가 구현되어 있다.
- 알림함은 제품 방향으로 맞다. WebSocket 채팅을 버리고 `share_created`, `share_requested` FCM payload를 로컬 알림함에 기록하는 축소는 MVP에 맞는 결정이다.
- 운영자 콘솔은 제품 확장 가능성을 보여주는 프로토타입으로는 유용하다. 다만 실제 MVP 근거는 아니다.
- 바구니/인벤토리 개념은 “현장 운영 레이어”로 분리한 점이 좋다. 사용자-facing 신청 단위로 섞지 않은 판단은 맞다.

## Biggest Product / Story Risks

1. 당시 FCM 리스크가 MVP claim을 흔들었다.
   “등록하면 근처 사용자에게 즉시 알림”은 당시 실수신 QA 없이는 말하면 안 됐다. 2026-05-25 실수신 QA 이후에는 “알림 payload/수신 handler/알림함 구현 완료”까지는 말할 수 있고, 서버 저장형 알림 읽음 동기화는 live VM/OpenAPI 재검증 대상으로 남긴다.

2. AI freshness scan을 과장할 위험이 크다.
   현재 계약은 `Fresh/Mid/Stale` 중심이고, screenshot/UI/low-quality/stale false-positive가 남아 있다. “AI가 안전성을 보장한다”가 아니라 “AI가 나눔 가능성 초안을 제시하고, 위험 케이스는 후속 rejection/review 계약으로 닫는다”가 정확하다.

3. 냉장고 운영자 콘솔은 MVP 스토리를 흐릴 수 있다.
   정적 fixture, operator 권한 없음, 실제 inventory API 없음, 상태 변경 저장 없음. 지금 데모에 넣으면 심사자가 “운영자가 뭘 실제로 할 수 있나?”를 묻게 된다.

4. 바구니는 아직 도메인 결정 전이다.
   바구니를 정식 도메인으로 채택할지, 내부 추적용 grouping으로 둘지 미정이다. 지금 사용자 가치로 전면에 세우면 범위가 흔들린다.

5. OCR/expiry는 신뢰 리스크다.
   현재 유통기한은 이미지에서 읽지 않고 기본 3일 자동값이다. OCR은 구현 대상이 아니라 계약/UX 정의 단계다. 신선도/나눔 가능 기간을 말하려면 이 제한을 숨기면 안 된다.

## What Must Be Closed Before Claiming MVP

- FCM 실수신 QA: 2026-05-25 실기기+emulator 2계정, debug/release, background/terminated/process-killed/lockscreen tap routing으로 닫힘.
- 알림 claim 범위 결정: FCM 수신은 닫혔지만, 서버 저장형 알림 읽음 동기화는 live VM/OpenAPI 확인 전에는 낮춰 말한다.
- AI false-positive 포지셔닝: screenshot/low-quality/stale false-positive를 MVP blocker로 볼지, Post-MVP AI 계약으로 명시할지 문서와 발표 문구를 일치시킨다.
- 유통기한 정책: 기본 3일 자동값을 MVP 한계로 명시하거나, 수동 수정 필드를 넣기 전까지 “유통기한 인식/OCR”을 말하지 않는다.
- 운영자 콘솔 분리: MVP 본편이 아니라 “운영 확장 실험”으로만 보여준다.
- 바구니 결정: 정식 도메인, 내부 grouping, 또는 폐기 중 하나를 선택해야 한다.

## Scope Recommendation

권장 모드: `HOLD_SCOPE` with story reduction.

기능을 더 늘리지 않는다. 지금 필요한 것은 범위 확장이 아니라 claim 정리다.

Hold:

- 나눔 식재료 등록
- AI 분석 결과 확인
- 공유 냉장고 선택
- 홈/지도 발견
- 나눔 신청
- `available -> requested`

Reduce:

- 알림은 FCM 실수신 전까지 “완료”라고 말하지 않는다.
- 운영자 콘솔은 MVP 기능에서 제외하고 프로토타입으로만 둔다.
- 바구니/inventory는 Post-MVP 운영 레이어로 둔다.
- OCR, multi-object, expiry 자동 인식은 다음 스프린트 계약/정책 항목으로 둔다.

Expand:

- 지금 확장할 유일한 것은 기능이 아니라 증거다. FCM 실수신, false-positive fixture 결과, expiry 정책 문구를 닫는 것이 제품 확장보다 우선이다.

## Founder-Level Next Decisions

1. MVP 발표 문장에 “푸시 알림”을 넣을 것인가?
   FCM 실수신 QA는 2026-05-25에 닫혔다. 다만 서버 저장형 알림 읽음 동기화는 live VM/OpenAPI 확인 전에는 “알림함 구조 구현, 읽음 동기화 확인 대기”로 말한다.

2. AI를 “판정”으로 말할 것인가, “보조 확인”으로 말할 것인가?
   현재는 보조 확인이 맞다. “AI freshness guarantee”는 과장이다.

3. 운영자 콘솔을 데모에 넣을 것인가?
   추천: 넣지 않는다. 넣는다면 마지막 20초에 “다음 운영 레이어 실험”으로만 보여준다.

4. 바구니를 정식 개념으로 채택할 것인가?
   추천: 아직 채택하지 않는다. 먼저 operator API와 multi-object 계약이 필요하다.

5. expiry/OCR을 다음 스프린트 P0로 볼 것인가?
   추천: OCR 구현은 보류. 먼저 유통기한 수동 입력/수정이 더 싸고 MVP 신뢰를 더 빨리 올린다.

## Recommended Pitch / Demo Narrative

1. “1인 가구가 남는 식재료를 버리기 전에 FoodLink를 연다.”
2. “사진을 찍으면 AI가 식재료와 상태를 분석하고, 나눔 가능 여부를 보여준다.”
3. “사용자는 결과를 확인한 뒤 가까운 공유 냉장고를 선택해 나눔 식재료로 등록한다.”
4. “근처 사용자는 홈과 지도에서 available 나눔 식재료를 발견한다.”
5. “상세 화면에서 공유 냉장고 위치와 상태를 확인하고 나눔 신청을 누른다.”
6. “첫 신청이 접수되면 상태는 `requested`가 되고, 홈/지도 available 목록에서 빠진다.”
7. “알림은 제품 구조와 실기기 FCM 수신까지 검증됐고, 서버 저장형 읽음 동기화는 live VM 재검증 대상이다.”
8. “운영자 콘솔, 바구니, multi-object, OCR/유통기한 인식은 MVP 이후 신뢰 운영 레이어로 확장한다.”

한 줄 피치:

**FoodLink는 남는 식재료를 AI로 빠르게 확인하고, 가까운 공유 냉장고를 통해 이웃의 신청까지 연결하는 로컬 surplus food sharing MVP다.**

현재 가장 좋은 데모 엔딩은 “우리는 큰 운영 시스템을 만든 척하지 않았다. 가장 중요한 `등록 -> 발견 -> 신청 접수` 루프와 FCM 실수신을 실제 API와 기기에서 닫았고, 이제 AI 품질 계약과 live VM 후속 계약을 닫으면 MVP 신뢰도가 더 단단해진다”이다.
