# GreenNode/FoodLink UX/Product Design Review - 2026-05-17

> 읽기 전용 검토. 파일 수정, 문서 생성, 커밋 없이 수행한 디자인 리뷰 결과를 문서화한다.

## UX / Design Scorecard

| Dimension | Score | 판단 |
| --- | ---: | --- |
| MVP 흐름 명확성 | 8 | `generate -> create -> home/map/detail -> request -> requested 제외` 흐름은 문서와 구현이 대체로 정렬됨 |
| 도메인/용어 정렬 | 7 | 문서는 강함. UI 일부는 AI 정량 신호, `기한 만료`, `푸시 전송`처럼 과신/확정처럼 읽힐 위험 있음 |
| 홈 발견 경험 | 7 | “나눔 식재료 먼저” 원칙은 구현됨. 단 `전체보기`, `방금 전`, 통계 `준비 중`은 덜 닫힘 |
| 지도/냉장고 탐색 | 7 | 냉장고 선택 후 내부 available 목록까지 이어짐. 하단 카드와 목록 패널이 중첩되어 지도 가시성이 줄어듦 |
| 등록/AI 결과 흐름 | 8 | 낮은 confidence를 차단하지 않고 `확인 필요`로 다루는 정책은 잘 반영됨. 다만 confidence copy가 보증처럼 보임 |
| 신청 상태 UX | 7 | `requested` 전환과 CTA 비활성화는 좋음. “예약 아님” 안내가 상세/완료 피드백에 더 명확해야 함 |
| 운영자 콘솔 방향성 | 5 | 좋은 실험 프로토타입이지만 실제 제품 기능처럼 노출되기엔 role/API/상태 전이 결정 부족 |
| 정보구조 | 6 | 프로필에 소비자 메뉴와 운영자 콘솔이 섞여 있음. 알림/채팅 명칭도 사용자 mental model과 어긋남 |
| 시각 완성도 | 6 | 모바일 핵심 화면은 명확하지만 emoji 중심 아이콘, 큰 카드/시트 중첩, 운영자 콘솔 밀도는 polish 필요 |
| Backend 의존성 분리 | 7 | 문서에는 blocker가 잘 적혀 있음. UI에서는 일부 blocker 기능이 이미 가능한 것처럼 보임 |

Overall: **6.8 / 10**

## Key UX Findings

1. 제품 핵심 흐름은 현재 MVP 기준으로 설득력 있다.
   문서는 홈을 “냉장고보다 나눔 식재료를 먼저 찾는 화면”으로 정의하고, 구현도 홈 카드와 지도 내부 목록으로 이를 따른다.

2. 상세 화면이 수령 장소 확인을 충분히 못 한다.
   문서상 수요자는 상세에서 “보관 공유 냉장고 확인 -> 나눔 신청”을 해야 하지만 [PostDetailScreen.tsx](../../src/screens/post/PostDetailScreen.tsx)는 `fridgeId` 중심이고 냉장고명/주소/거리/수령 안내가 약하다. 신청 전 확신을 주는 핵심 정보가 빠져 있다.

3. 몇몇 copy가 backend/운영 현실보다 앞서간다.
   [PostCompleteScreen.tsx](../../src/screens/post/PostCompleteScreen.tsx)는 “나눔 알림(푸시)이 전송되었습니다”처럼 읽힐 수 있는 copy를 갖는다. 실제 FCM 수신 QA가 남아 있으므로 “전송 요청됨” 또는 “알림 대상에게 알려요” 쪽이 더 안전하다.

4. 홈/지도 UI에는 아직 placeholder가 보인다.
   홈의 `탄소 절감: 준비 중`, 카드의 `방금 전`, `전체보기` 미연결은 MVP 데모에서는 허용 가능하지만, 제품 경험에서는 신뢰도를 낮춘다.

5. 지도는 기능은 맞지만 화면 경제성이 낮다.
   선택 냉장고 카드와 내부 목록 패널이 함께 떠서 지도 영역을 많이 가린다. 선택 후에는 큰 녹색 카드와 흰색 목록 패널 중 하나만 남기는 쪽이 낫다.

## Fridge Operator Console Critique

- 현재 콘솔은 P2 “냉장고 inventory” 설계 실험으로는 유용하다. 요약, 바구니 후보, 개별 점검, 검증 규칙이 한 화면에 모여 있어 backend/API 논의용 artefact로 가치가 있다.
- 제품 진입점으로는 아직 이르다. [ProfileScreen.tsx](../../src/screens/profile/ProfileScreen.tsx)에서 `냉장고 운영자 콘솔`이 일반 프로필 메뉴처럼 노출된다. 역할/권한이 없는 사용자는 보지 않아야 하며, 최소한 “실험 기능” 또는 dev/test gate가 필요하다.
- 콘솔이 `needsReview`, `discardCandidate`, `missing`, `completed` 같은 운영 상태를 보여주지만, 문서상 이 상태들은 아직 API/도메인 결정 전이다. UI가 먼저 고정되면 backend가 UI fixture를 따라가게 되는 역전 위험이 있다.
- “바구니 후보”는 좋은 문제 제기지만 아직 사용자-facing 단위가 아니다. 신청/등록 단위는 계속 개별 **나눔 식재료**다.
- 현장 운영 도구라면 현재 dashboard형 화면보다 “오늘 점검할 항목 -> 스캔/확인 -> 상태 변경 사유 -> 저장”의 task-first flow가 필요하다.

## Terminology / Copy Risks

- AI 정량 신호: 품질 보증처럼 들린다. 문서상 confidence는 softmax max 확률이며 차단 기준이 아니다. 사용자/운영자 UI에는 숫자 confidence를 노출하지 않고 `확인 필요`, `AI 분석은 참고용` 같은 정성 안내로 처리한다.
- `기한 만료`: 실제 expired flow가 MVP에 없으므로 상세 화면에서 무심코 노출되면 상태 체계가 앞서간다. `권장 수령일이 지났어요`처럼 운영/정책 여지를 남기는 표현이 안전하다.
- `나눔 알림(푸시)이 전송되었습니다`: 실제 FCM 수신 검증 전에는 delivery claim으로 읽힌다.
- `전체보기`: 연결된 화면이 없으면 제거하거나 지도 탭/필터 화면으로 명확히 연결해야 한다.
- `냉장고 운영자 콘솔`: 도메인 용어로는 맞지만 일반 사용자 메뉴에 있으면 “관리자/admin” 기능처럼 오해된다.

## Information Architecture Risks

- 프로필은 현재 소비자 계정 관리, 준비 중 통계, 위치 재설정, 운영자 콘솔, 내 나눔/받은 나눔 메뉴가 섞여 있다. 운영자 기능은 별도 role surface로 분리하는 편이 맞다.
- 하단 `알림` 탭은 코드/과거 문맥상 Chat 축소판이다. 사용자에게는 알림함으로 정리하고, 내부 route 이름과 문서도 장기적으로 맞추는 것이 좋다.
- 홈 검색 아이콘이 지도 진입처럼 동작한다면 검색 아이콘보다 지도/탐색 affordance가 맞다. 현재는 “홈에서 식재료 검색” 기대를 만들 수 있다.
- 상세 화면이 신청의 결정 지점인데, 냉장고 위치 정보가 지도에 더 많이 있다. 신청 전 정보가 지도와 상세에 분산되어 있다.

## Prototype Improvements Without Backend

- 프로필의 운영자 콘솔 메뉴를 숨기거나 `실험 기능` 배지/role placeholder를 붙인다.
- 홈 카드의 `방금 전`을 `createdAt` 기반 상대 시간으로 바꾼다.
- `전체보기`를 제거하거나 지도 탭으로 명확히 이동시킨다.
- 완료 화면 copy를 푸시 delivery claim이 아닌 등록 완료 중심으로 완화한다.
- 지도에서 냉장고 선택 시 큰 선택 카드와 내부 목록 패널을 하나의 bottom sheet로 통합한다.
- 운영자 콘솔 fixture에 “읽기 전용 프로토타입” 배너와 “저장 불가” 상태를 명확히 표시한다.
- 상세 CTA 아래에 `신청 접수는 예약 확정이 아니에요` 보조 문구를 추가한다.

## Decisions Blocked By Backend/API

- Post detail 응답에 냉장고명, 주소, 거리, 운영 상태를 포함할지.
- 실제 FCM 수신/읽음 상태를 UI에서 어떻게 claim할지.
- 냉장고 운영자 role, 접근 권한, 관리 가능한 fridge mapping.
- inventory가 public available list의 확장인지, 별도 운영자 재고 레이어인지.
- `basketId`/registration batch를 정식 도메인으로 채택할지.
- 운영자가 변경 가능한 상태와 상태 변경 이벤트 API.
- Post-MVP rejection reason, multi-object detection, screenshot/low-quality 처리 계약.
- 주변 냉장고 없음/거리 필터 fixture.

## Recommended Next Design Iteration

1. 수요자 상세 화면을 먼저 보강한다. 신청 전 냉장고명/주소/거리/수령 안내/`requested` 의미를 한 화면에서 확인하게 만든다.
2. 지도 bottom sheet를 재설계한다. 냉장고 선택 카드와 내부 목록을 하나의 stateful panel로 합치고, empty/error/loading/requested-excluded 상태를 명확히 둔다.
3. 운영자 콘솔은 제품 화면이 아니라 설계 prototype으로 격리한다. role gate, fixture label, read-only banner를 추가하고 API 결정 전 상태 변경 CTA는 비활성 처리한다.
4. copy pass를 한 번 한다. confidence, push, 기한, 예약/신청, 운영자/admin 용어를 문서 기준으로 정리한다.
5. 다음 디자인 리뷰 기준은 “상세에서 수령 장소를 확신할 수 있는가”, “신청 접수가 예약으로 오해되지 않는가”, “운영자 콘솔이 실제 API 미확정 기능처럼 보이지 않는가”다.
