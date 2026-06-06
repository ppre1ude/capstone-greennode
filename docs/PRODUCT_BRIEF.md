# FoodLink Product Brief

> **최종 수정일**: 2026-05-26
> **프로젝트명**: FoodLink (패키지명: greennode)  
> **플랫폼**: React Native (Android / iOS)

---

## Agent Workflow

- Authority: product vision, MVP boundaries, user flow, and deferred feature
  scope.
- Read before: changing user-visible behavior, adding/removing a feature,
  changing a screen's purpose, or reprioritizing MVP work.
- Update when: MVP scope, feature status, user flow, or product positioning
  changes.
- Required evidence: decision reason, affected user flow, and whether the change
  is implemented, partial, deferred, or validation-only.
- Related workflows: `grill-me`, `to-prd`, `to-issues`, `request-refactor-plan`.
- Source-of-truth conflicts: domain naming defers to
  [DOMAIN_MODEL.md](./DOMAIN_MODEL.md), API reality defers to
  [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md), and verified
  QA status defers to [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md).

## Service Definition

**Vision AI + 공유 냉장고 기반 로컬 나눔 식재료 발견/신청 플랫폼**

FoodLink의 핵심 가치는 남는 식재료 처리의 귀찮음과 죄책감을 줄이는 것이다. 사용자는 남는 식재료를 촬영하고, AI가 나눔 가능 기준을 확인하면 가까운 공유 냉장고에 연결해 주변 사용자에게 알릴 수 있다. 수요자는 홈에서 근처 available 나눔 식재료를 먼저 발견하고, 지도에서 공유 냉장고와 그 안의 식재료를 탐색한 뒤 나눔 신청을 할 수 있다.

환경 성취 지표(CO2 절감량, 월간 기여량 등)는 핵심 가치가 아니라 사용자가 잘한 일을 확인하게 해주는 보조 성취 레이어다. MVP의 첫 보상은 "처리가 끝났다"는 안도감과 "근처 이웃에게 알림이 갔다"는 완료감이다.

## Engagement And Lifecycle Principle

FoodLink는 사용자를 오래 붙잡는 콘텐츠 앱이 아니다. 핵심 지표는 세션 길이가 아니라 사용자가 남는 식재료 처리, 보관, 신청, 수령, 완료를 막힘 없이 끝냈는지다. 좋은 세션은 짧을 수 있다.

다만 짧게 끝난 뒤 다시 돌아올 이유가 없으면 제품 루프가 약하다. 재방문은 피드 소비가 아니라 진행 중인 나눔 lifecycle에서 자연스럽게 생겨야 한다.

앱은 사용자가 지금 맡고 있는 다음 행동을 첫 화면, 알림, 내역, 운영자 화면에서 같은 상태 모델로 보여줘야 한다.

- 공급자: 등록 대기, QR 입고 필요, 신청 접수, 취소/만료/완료 상태를 확인한다.
- 수요자: 신청한 나눔, 남은 임시 선점 시간, 수령 QR 필요, 수령 완료 상태를 확인한다.
- 냉장고 운영자: 현재 재고, 만료/폐기 필요, 확인 필요 항목을 처리한다.

따라서 후속 기능 우선순위는 채팅, 포인트, 소셜 로그인, 랭킹보다 내 진행 중인 나눔 허브, 내 나눔/받은 나눔 내역, `requested` 이후 lifecycle을 먼저 둔다. 서버 알림 저장/읽음 동기화는 백엔드 2026-05-27 회신 기준 Post-MVP로 분리한다.

## UX Quality Principle

현재 앱의 MVP 흐름은 `스캔 -> 등록 -> 홈/지도 노출 -> 신청`으로 읽히지만, 반복 사용 제품으로 보이려면 사용자가 지금 처리해야 할 lifecycle action과 모바일 UI 마감이 더 선명해야 한다.

제품 UX는 아래 기준을 따른다.

- 첫 화면은 발견만 담당하지 않는다. 진행 중인 나눔, 입고 QR 필요, 수령 QR 필요, 남은 시간, 신청 상태 같은 현재 action을 함께 보여준다.
- 하단 CTA는 Android/iOS system navigation 영역과 겹치지 않아야 한다. 모든 fixed footer는 safe area inset을 기준으로 배치한다.
- 실제 사용자 플로우에는 `테스트`, `프로토타입`, `초기화` 같은 내부 QA 언어를 노출하지 않는다. QR 보관/수령은 제품 기능 언어로 설명한다.
- 액션, 내비게이션, 입력, 버튼 slot에는 emoji를 쓰지 않고 디자인 시스템의 icon/asset을 사용한다.
- 지도에서 냉장고를 선택했을 때는 하단 carousel과 상세 sheet가 서로 경쟁하지 않게 하나의 primary surface를 유지한다.
- 프로필은 placeholder 모음이 아니라 내 나눔, 받은 나눔, 알림/작업 중 최소 하나를 실제 관리 표면으로 승격한다.

## First Persona

초기 페르소나는 전남대 등 대학가, 원룸촌, 고시원 주변의 1인 가구 구성원이다.

- 남는 식재료가 자주 생기지만 판매/나눔글 작성까지 하기는 번거롭다.
- 현재는 버리거나, 한 번에 요리한 뒤 소분해 보관하는 방식으로 처리한다.
- 냉장고 공간과 이동 동선이 제한되어 있어 "가까운 공유 냉장고"와 "빠른 처리"가 중요하다.
- 주변 사용자 밀도가 있어 푸시 알림과 수령 신청 검증이 가능하다.

## Current MVP Boundary

2026-05-06 기획 기준의 MVP는 아래 흐름을 검증한다.

- 공급자가 남는 식재료를 촬영/선택한다.
- AI가 대표 식재료와 나눔 가능 여부를 판단한다.
- 백엔드 AI label은 `Fresh/Mid/Stale`이다. `Mid`는 기존 프론트 문서의 `Normal` 그룹으로 번역한다.
- `Fresh/Mid` 계열은 사용자에게 `상태가 좋아 보여요`와 `나눔 가능`으로 통합 표시한다.
- `Stale`은 사용자에게 `나눔 기준에 맞지 않아요`로 안내하고 등록하지 않는다. `not_food`, `low_quality`, `screenshot` 계열 rejection reason은 Post-MVP 백엔드 항목이다. 2026-05-23 기준 MVP 정상 응답의 root-level `rejectionReason`은 `null`이고, `detections[]`는 단일 대표 객체 래핑이다. 특히 screenshot/UI 캡처는 MVP 서버가 차단할 수 없어 `Fresh + imageToken`으로 통과할 수 있으며, 이 경우 앱은 `확인 필요` 표시만 하고 등록은 허용한다.
- `confidenceScore`는 Stage 2 신선도 분류 모델의 softmax max 확률이며, 차단 기준이 아니라 내부 검토 신호로만 사용한다. 제품 기준은 백엔드 활용 가이드를 따라 0.9 미만을 `확인 필요` 구간으로 보되, 사용자/운영자 UI에는 원값, 소수, 퍼센트, `AI 참고 신호 92%` 같은 정량 신호를 노출하지 않는다.
- 공급자는 공유 냉장고를 선택해 나눔 식재료 생명주기를 시작한다.
- 보관 QR 인증 전까지 나눔 식재료는 `pending_store`이며, 근처 사용자 목록이나 푸시 알림에 노출하지 않는다.
- 보관 QR 인증이 끝나 `available`이 된 뒤 근처 사용자에게 푸시 알림을 보낸다.
- 수요자는 홈/알림/지도에서 나눔 식재료를 확인하고 `나눔 신청하기`를 누른다.
- 정식 상태 흐름은 `pending_store -> available -> requested -> completed`다. `requested`는 신청 접수와 30분 임시 선점이지 예약 확정이나 수령 완료가 아니다.

아래 항목은 정식 생명주기와 별개의 사용자 flow로 만들지 않는다.

- QR 코드, 비밀번호 토큰, 보관 사진, 냉장고 운영자 확인은 실제 보관/수령 검증 수단 후보이며, 기본 제품 흐름은 QR 보관/수령 인증이다.
- `reserved` 상태. 정식 QR 흐름에서는 신청 접수/임시 선점과 수령 완료 사이에 별도 예약 확정 상태를 두지 않는다.
- 냉장고 운영자 화면. 2026-05-23 기준 operator summary/items/dispose 최소 API 계약은 확정됐지만, 운영자 테스트 데이터와 백엔드 VM 재배포 후 runtime QA가 필요하다.
- WebSocket 기반 실시간 채팅
- 소셜 로그인, 이메일 verification, 실제 활동 지표 API
- 진짜 인기 랭킹. 데이터가 쌓이기 전까지 "많이 찾는 식재료"는 후순위 추천 기능이다.

2026-05-29 Post-MVP 제품/계약 결정은 [POST_MVP_PRODUCT_CONTRACT_DECISIONS.md](./POST_MVP_PRODUCT_CONTRACT_DECISIONS.md)를 따른다. 결정 요지는 기능 확장이 아니라 scope 고정이다. AI는 hard block `rejectionReason`과 soft review `reviewReason`을 분리하지만, 현재 모델은 비식재료/스크린샷/저품질/multi-object를 실제로 판별하지 못하므로 정확도 gate는 Phase 4 모델 고도화로 분리한다. 서버 알림 저장소는 Post-MVP source of truth로 채택하되 WebSocket 채팅은 제외한다. 환경 성취 지표는 완료/수령 확인된 나눔 식재료 기준의 backend-computed estimate로만 노출하고, email verification과 social login은 Phase 4 auth expansion으로 묶는다.

## Product Flow Contract

| Flow slice       | Entry point    | Must happen                                                                                                                                              | Result state/effect                                             | Explicitly excluded                         |
| ---------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| 농산물 등록 흐름 | 카메라, 갤러리 | AI 분석 결과를 보여주고, 나눔 기준 통과 항목만 공유 냉장고 선택과 보관 QR 인증으로 보낸다.                                                               | `POST /posts` 성공 후 `status=pending_store`, 보관 QR 인증 대기 | QR 없는 별도 생성 flow                      |
| 나눔 기준 미충족 | AI 분석 결과   | 현재 백엔드 기준 `Stale`은 등록 흐름으로 보내지 않는다. screenshot/UI 캡처는 MVP에서 차단 불가이므로 통과 가능하며, 비식재료/저품질 사진은 Post-MVP rejection reason 계약 전까지 false-positive 검증 대상으로 둔다. | 사용자에게 `나눔 기준에 맞지 않아요` 또는 `확인 필요` 계열 문구 표시 | 부패/상함/썩음 같은 확정 판정 표현          |
| 근처 나눔 발견   | 홈, 푸시 알림  | 홈은 냉장고보다 available 나눔 식재료를 먼저 보여준다.                                                                                                   | 상세 화면에서 보관 공유 냉장고와 신청 CTA 확인                  | 실제 인기 랭킹, 채팅 기반 탐색              |
| 공유 냉장고 탐색 | 지도           | 지도는 주변 공유 냉장고와 냉장고 안의 available 나눔 식재료를 탐색하게 한다.                                                                             | 냉장고 기준으로 상세/신청 흐름에 진입                           | 지도를 홈 피드의 대체 화면으로 사용         |
| 나눔 신청        | 상세 화면      | 보관 QR 인증으로 `available`이 된 나눔 식재료만 신청할 수 있고, 첫 신청 접수 후 `requested`로 전환한다.                                                   | 신청 접수/30분 임시 선점, 추가 신청 CTA 비활성화                | 예약 확정, 공급자 승인/거절                 |
| 환경 성취 확인   | 등록 완료 후   | 사용자의 좋은 행동을 숫자로 확인시키는 보조 레이어로만 제공한다.                                                                                         | 안도감/완료감 이후 보조 지표 노출                               | 핵심 가치나 수익 모델을 대체하는 1차 동기   |

`나눔 신청`의 첫 신청 잠금 정책은 현재 제품 가정이다. 기존 회의에서 최종 확정이 보류된 항목이므로, 기획자가 다른 결정을 내리면 이 문서와 [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)에 충돌 기준과 변경 이유를 함께 남긴다.
백엔드 Phase 1.5는 이 제품 가정에 맞춰 첫 신청 접수 후 `requested`로 전환하고, 작성자 본인 신청은 403, 중복/경합 신청은 409로 거절하도록 구현했다.

## Inventory And QR Direction

공유 냉장고의 QR 인증, 냉장고 운영자 역할, 30분 임시 선점 흐름은 별도 사용자 flow가 아니라 FoodLink 나눔 생명주기의 정식 검증 레이어다. `requested`는 단순 신청 접수만이 아니라 30분 동안 다른 사용자의 신청을 막는 임시 선점 상태다.

핵심 방향:

- 공급자는 AI 분석과 냉장고 선택 후 바로 public `available`을 만들지 않고 `pending_store` 상태에서 시작한다.
- 공급자가 선택한 공유 냉장고의 QR을 10분 안에 스캔하면 실제 보관 확인이 끝나고, 그때부터 나눔 식재료가 available 목록에 노출된다.
- 수요자가 나눔 신청을 하면 30분 임시 선점이 걸리고, 수요자는 냉장고 앞에서 QR을 스캔해 수령 확인을 완료한다.
- QR은 냉장고를 식별하는 고정 QR이며, 실제 인증은 서버가 JWT, pending action, fridgeId, action별 제한 시간을 검증해서 처리한다.
- 라벨 스티커는 강하게 권장한다. QR은 냉장고 앞 인증이고, 라벨은 냉장고 안에서 물건을 찾고 운영자가 점검하기 위한 장치다.
- 에틸렌 분리 구역은 MVP 블로커는 아니지만, `GENERAL` / `ETHYLENE_SEPARATED` 수준의 보관 구역 정책을 데이터 모델에 포함한다.

상세 PRD는 [INVENTORY_QR_PRD_V0.md](./INVENTORY_QR_PRD_V0.md)를 기준으로 한다.

## Product Loops

### 공급자 루프

```text
남는 식재료 발생
  -> 촬영 또는 갤러리 선택
  -> AI 분석 결과 확인
  -> 나눔 가능 기준 통과
  -> 나눔 식재료 등록 정보 확인/수정
  -> 등록 가능 공유 냉장고 선택
  -> 등록 완료
  -> 근처 사용자에게 푸시 알림 발송
```

공급자 루프의 1차 보상은 환경 지표가 아니라 처리 완료감이다. 완료 화면은 "공유 냉장고에 등록됐어요", "근처 이웃에게 나눔 알림을 보냈어요", "누군가 신청하면 알려드릴게요"를 먼저 전달해야 한다. CO2 절감량은 보조 정보로 둔다.

### 수요자 루프

```text
홈에서 근처 available 나눔 식재료 발견
  -> 나눔 식재료 상세 진입
  -> 보관 공유 냉장고와 상태 확인
  -> 나눔 신청하기
  -> 상태 available -> requested
  -> 공급자에게 신청 알림
```

MVP에서 공급자는 `requested` 이후 별도 승인 행동을 하지 않는다. 첫 신청 이후 추가 신청은 막는다.

## Home And Map Roles

홈은 "냉장고를 먼저 찾는 화면"이 아니라 "내 주변에서 가져갈 수 있는 나눔 식재료를 먼저 찾는 화면"이다.

홈 우선 섹션:

1. **가까운 나눔 식재료**: 거리 우선, 동일 권역에서는 최신순.
2. **오늘 가져가기 좋은 재료**: 만료 임박을 직접 말하지 않고, 권장 수령일/나눔 가능 기간이 가까운 항목을 긍정적으로 표현한다.
3. **많이 찾는 식재료**: 조회/신청/관심 데이터가 쌓인 뒤 도입하는 후순위 추천 기능.

지도는 주변 공유 냉장고와 각 냉장고 안의 available 나눔 식재료를 탐색하는 화면이다. 수요자는 지도에서 냉장고 위치, 거리, 보관 중인 나눔 식재료를 확인하고 상세/신청 흐름으로 이동한다.

피해야 할 사용자 문구:

- `만료 임박`
- `유통기한 임박`
- `곧 버려질`
- `부패 의심`
- `상한 식재료`

권장 문구:

- `오늘 가져가기 좋은 재료`
- `오늘 추천`
- `권장 수령일: 오늘`
- `상태가 좋아 보여요`
- `나눔 기준에 맞지 않아요`

## Core Features

### 1. Vision AI 나눔 가능 기준 확인

- 사진 한 장으로 대표 식재료와 내부 신선도 등급을 분석한다.
- 기획/백엔드 목표: YOLOv8 기반 객체 탐지, ResNet-50 기반 신선도 분류.
- 현재 백엔드 계약: `POST /api/v1/posts/generate`가 대표 식재료, `Fresh/Mid/Stale` 신선도 등급, `isFresh`, `confidenceScore`, `imageToken`을 반환한다. LLM은 비활성화되어 있다. generate는 Post row를 만들지 않지만, 2026-05-08 백엔드 수정 후 서버 임시 저장소에 이미지와 AI 메타데이터 sidecar를 저장하고 `POST /posts` 시점에 복원한다.
- 현재 앱 정책: `Fresh/Mid`는 나눔 가능으로 통합 표시, `Stale`은 등록 차단, 낮은 confidence는 차단이 아니라 `확인 필요` 정성 안내로만 표시한다. confidence 숫자/퍼센트는 화면에 표시하지 않는다.

### 2. 나눔 식재료 등록

- AI 분석 결과를 기반으로 제목/설명/카테고리 초안을 채운다.
- 백엔드 Phase 1.5 이후 Post 저장 구조는 제목/설명/카테고리보다 `detectedFruitKo`, `freshnessLabel`, `confidenceScore` 중심이다. 프론트 작성 화면은 사용자가 확인해야 할 최소 정보와 수정 가능 범위를 이 구조에 맞게 재정렬해야 한다.
- 공급자는 정보를 확인/수정하고 공유 냉장고를 선택한다.
- 권장 수령일은 AI가 산출한 소비기한이 아니라 앱의 단기 수령 제안이다. OCR/라벨 소비기한 인식이 없는 MVP에서는 기본 3일 뒤를 제안하고, 공급자는 오늘·내일·3일 뒤 중에서만 조정한다.
- 등록이 완료되면 근처 사용자에게 푸시 알림을 보낸다.
- QR 생명주기 반영 후 등록은 `pending_store`로 시작하고, 보관 QR 인증이 성공해야 수요자-facing 목록에 노출된다.
- 서버는 `Stale` 분석 결과에 대해 `imageToken`을 발급하지 않고, 무효/만료 토큰으로는 최종 등록을 막는다. 프론트의 나눔 가능 가드는 사용자 경험용이며 서버가 최종 방어선이다. MVP 필수 등록 payload는 `imageToken`, `fridgeId`, `expirationDate`이고 AI 메타데이터를 재전송하지 않는다. Post-MVP multi-object 계약에서는 대표 후보 선택값인 `selectedDetectionId`만 optional로 추가한다.

### 3. 근처 나눔 식재료 발견

- 홈은 근처 available 나눔 식재료를 먼저 보여준다.
- 거리, 등록 시간, 나눔 가능 기간, 내부 상태 정보를 이용해 섹션을 구성한다.
- "만료 임박" 같은 불안 유발 표현 대신 "오늘 가져가기 좋은 재료"처럼 행동을 돕는 표현을 쓴다.

### 4. 공유 냉장고 탐색

- 지도는 주변 공유 냉장고와 그 안의 available 나눔 식재료를 탐색하게 한다.
- 공유 냉장고는 수령 장소이자 신뢰 장치다.
- 현재 검증 결과: 광주 전남대 인근 좌표에서 냉장고 목록은 실제 API로 조회됐다. 백엔드는 `GET /fridges/{id}/posts?status=available`도 구현했다. 단, 주변 냉장고 없음 상태는 임의 좌표에서도 서버가 3건을 반환해 별도 서버 필터 검증이 필요하다.

### 5. 나눔 신청과 푸시 알림

- 보관 QR 인증 후 근처 사용자에게 푸시 알림을 보낸다.
- 수요자는 상세 화면에서 `나눔 신청하기`를 누른다.
- 신청 상태 전환은 `available -> requested`다.
- `requested`는 신청 접수와 30분 임시 선점이며 예약 확정이 아니다.
- 백엔드는 `POST /posts/{id}/requests`, `share_requested` 알림, 403/409 상태 처리를 구현했다. 프론트는 상세 CTA와 로컬 알림함을 이 계약에 맞게 연결했다. 2026-05-21 emulator foreground/background QA는 통과했고, terminated/physical 2-device QA는 2026-05-23 백엔드 FCM priority/log 재배포 후 재검증한다.
- 채팅은 MVP에서 보류하고 알림함/신청 흐름으로 축소한다.

### 6. 환경 성취 지표

- CO2 절감량, 월간 절감량, 기여 기록은 보조 성취 레이어다.
- 실제 지표 API와 계산식이 없으면 mock 숫자를 운영 UI에 노출하지 않는다.
- 등록 완료 이후 사용자의 좋은 행동을 확인시켜주는 용도로만 사용한다.

## Technical Stack

| 영역            | 기술                                   |
| --------------- | -------------------------------------- |
| 프론트엔드      | React Native (TypeScript)              |
| 네비게이션      | React Navigation (Stack + Bottom Tabs) |
| 상태 관리       | Zustand                                |
| HTTP 클라이언트 | Axios                                  |
| 카메라          | react-native-vision-camera             |
| 지도            | react-native-maps (Google Maps)        |
| 위치            | react-native-geolocation-service       |
| 푸시 알림       | @react-native-firebase/messaging       |
| 폼 검증         | react-hook-form + zod                  |
| 인증            | JWT Bearer Token (AsyncStorage)        |

## Backend Integration

- **서버**: NHN Cloud (SSH 터널 경유)
- **Base URL**: `http://10.0.2.2:8080` (Android 에뮬레이터 기준)
- **API 명세**: [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md) 참고
- **Swagger UI**: `http://localhost:8080/docs` (SSH 터널 연결 후)
- **Firebase 프로젝트**: `foodlink-cf8e7`
- **MVP 검증 문서**: [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)

## Team

- **프론트엔드**: React Native 앱 개발, UI/UX 구현
- **백엔드**: FastAPI 서버, DB 관리, AI 모델 연동
- **AI/ML**: YOLOv8 + ResNet-50 모델 학습 및 서빙

## Related Documents

| 문서          | 경로                                                         | 설명                              |
| ------------- | ------------------------------------------------------------ | --------------------------------- |
| 도메인 모델   | [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)                         | FoodLink 용어, 관계, 모호성       |
| API 연동 계약 | [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md) | 백엔드 API 명세 및 연동 방법      |
| 검증/백로그   | [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)     | MVP 검증 결과와 다음 작업         |
| 디자인 시스템 | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)                       | 컬러/타이포그래피 토큰, DS 컴포넌트 레이어, UI 마이그레이션 규칙 |
| Inventory/QR PRD | [INVENTORY_QR_PRD_V0.md](./INVENTORY_QR_PRD_V0.md)         | QR 인증, 30분 임시 선점, 냉장고 재고 운영 v0 |
