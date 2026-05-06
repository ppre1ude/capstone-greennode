# FoodLink Flow Change Notice

> 작성일: 2026-05-06
> 목적: FoodLink MVP 흐름과 도메인 용어 변경 사항을 프론트엔드, Codex, 백엔드 개발자가 같은 기준으로 이해하게 한다.
>
> 이 문서는 변경 공지/핸드오프 문서다. 최종 source of truth는 아래 문서에 둔다.
>
> - 제품 범위: [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md)
> - 도메인 용어: [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
> - API 계약: [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md)
> - 검증/백로그: [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)
> - 구현 상태: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

## 백엔드 답변 반영 상태

2026-05-06 백엔드가 이 공지의 검토 항목을 Phase 1.5로 구현/VM 검증 완료했다. 이 문서의 아래 내용은 당시 프론트가 백엔드에 보낸 **원본 변경 공지**로 보존한다. 현재 상태는 다음 문서가 우선한다.

- API 계약 확정/변경: [API_INTEGRATION_CONTRACT.md](./API_INTEGRATION_CONTRACT.md)
- 프론트 구현 상태와 남은 작업: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- 검증/백로그 재분류: [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)

현재 확정된 차이:

- 나눔 신청 API는 `POST /api/v1/posts/{post_id}/requests`로 구현됐다.
- 첫 신청 성공 시 `available -> requested`, 작성자 본인 신청은 403, 중복/경합 신청은 409다.
- 백엔드 AI label은 `Fresh/Mid/Stale`이며 `Mid`는 기존 `Normal` 그룹이다.
- `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률이다.
- 냉장고별 나눔 식재료 조회 API는 `GET /api/v1/fridges/{fridge_id}/posts?status=available`로 구현됐다.
- Post 구조는 `title/description/category` 중심에서 `detectedFruitKo/freshnessLabel/confidenceScore` 중심으로 바뀌었고, 프론트 반영이 필요하다.

## 요약

FoodLink MVP의 핵심 흐름을 **남는 식재료 등록 → 공유 냉장고 등록 → 근처 사용자 알림 → 나눔 신청**으로 다시 정리했다.

이번 변경의 가장 큰 결정은 도메인 용어를 `게시글`이나 `product`가 아니라 **나눔 식재료**로 고정한 것이다. 현재 API와 코드에는 `/posts`, `Post`, `postId`가 남아 있지만, 제품/도메인 언어에서는 모두 **나눔 식재료**로 번역한다.

## 이번에 확정한 제품 기준

### 1. 핵심 가치

FoodLink의 핵심 가치는 환경 지표가 아니라 **남는 식재료 처리의 귀찮음과 죄책감을 줄이는 것**이다.

CO2 절감량, 월간 기여량 같은 환경 지표는 사용자가 잘한 일을 확인하는 보조 성취 레이어로 둔다. 등록 완료 화면이나 프로필에서 핵심 보상보다 먼저 노출하지 않는다.

### 2. MVP 공급자 흐름

```text
남는 식재료 촬영/선택
  -> AI 분석
  -> 나눔 가능 기준 통과
  -> 나눔 식재료 등록 정보 확인/수정
  -> 등록 가능 공유 냉장고 선택
  -> 등록 완료
  -> 근처 사용자에게 푸시 알림 발송
```

MVP에서는 QR 코드, 비밀번호 토큰, 관리자 승인으로 실제 보관 여부를 강제하지 않는다. 이 검증은 후속 버전에서 설계한다.

### 3. MVP 수요자 흐름

```text
홈에서 근처 available 나눔 식재료 발견
  -> 나눔 식재료 상세 진입
  -> 보관 공유 냉장고와 상태 확인
  -> 나눔 신청하기
  -> status: available -> requested
  -> 공급자에게 신청 알림
```

`requested`는 신청 접수 상태다. 예약 확정이나 수령 완료가 아니다.

현재 제품 가정은 첫 신청이 오면 `available -> requested`로 전환하고 추가 신청 CTA를 막는 것이다. 다만 이 정책은 기획 최종 확인이 남아 있으므로, 다른 결정을 내리면 제품 문서와 검증 문서에 변경 이유를 남겨야 한다.

### 4. 홈과 지도 역할

홈은 사용자가 **나눔 식재료를 먼저 찾는 화면**이다. 냉장고를 먼저 찾는 화면이 아니다.

홈의 우선순위:

1. 가까운 나눔 식재료
2. 오늘 가져가기 좋은 재료
3. 많이 찾는 식재료

`많이 찾는 식재료`는 실제 조회/신청/관심 데이터가 쌓인 뒤 도입한다.

지도는 주변 공유 냉장고와 각 냉장고 안의 available 나눔 식재료를 탐색하는 화면이다. 공지 작성 당시 구현은 냉장고 목록/선택까지였고, 현재 백엔드는 냉장고별 나눔 식재료 조회 API를 구현했다.

## AI 판정과 사용자 문구 변경

### 사용자에게 보여줄 문구

| 내부 결과                      | 사용자-facing 상태                  | 등록                                         |
| ------------------------------ | ----------------------------------- | -------------------------------------------- |
| `Fresh`, `Mid` (`Normal` 그룹) | `상태가 좋아 보여요`, `나눔 가능`   | 가능                                         |
| `Stale`                        | `나눔 기준에 맞지 않아요`           | 차단                                         |
| `Bad`, `Rotten`                | `나눔 기준에 맞지 않아요`           | 현재 백엔드 label은 아니지만 방어적으로 차단 |
| `not_food`, `non_food`         | `식재료 사진으로 확인되지 않았어요` | 차단                                         |
| `low_quality`                  | `사진으로 상태를 확인하기 어려워요` | 차단                                         |
| low `confidenceScore` only     | `상태를 한 번 더 확인해주세요`      | 차단 아님                                    |

`Fresh`와 `Mid`의 차이는 내부 QA/추천/데이터에서는 유지할 수 있지만, 사용자 흐름에서는 같은 나눔 가능 상태로 보여준다. 기존 `Normal`은 `Mid` 그룹으로 번역한다.

### 피해야 할 문구

사용자-facing 문구에서는 아래 표현을 쓰지 않는다.

- `부패`
- `상함`
- `썩음`
- `부패 의심`
- `나눔 주의`
- `만료 임박`
- `유통기한 임박`
- `곧 버려질`
- `상한 식재료`

이유는 사용자에게 확정적인 품질 판정처럼 들리거나, 식재료 상태에 대한 분쟁을 만들 수 있기 때문이다.

## 백엔드 개발자가 확인해야 할 사항

### 1. `/posts` 명칭은 유지 가능하지만 도메인 번역이 필요함

현재 서버 API가 `/posts`, `Post`, `postId`를 쓰는 것은 당장 바꾸지 않아도 된다. 다만 제품 언어와 문서에서는 이를 **나눔 식재료**로 번역한다.

서버 응답 message에 `게시글`이 남아 있을 수 있다. 프론트에서는 사용자 UI에서 **나눔 식재료**로 번역한다. 서버 message까지 바꿀 수 있다면 더 좋지만, API 호환성을 깨는 변경은 별도 협의한다.

### 2. 나눔 신청 API 계약이 필요함

공지 작성 당시 상세 화면의 `나눔 신청하기` CTA는 준비중이며 검증된 신청 API가 없었다. 현재 백엔드는 아래 후보 그대로 구현했다.

권장 endpoint 후보:

```text
POST /api/v1/posts/{post_id}/requests
```

필수 계약:

| 항목      | 기준                                         |
| --------- | -------------------------------------------- |
| 대상      | `status=available`인 나눔 식재료             |
| 요청자    | 작성자가 아닌 인증 사용자                    |
| 성공 효과 | 첫 신청을 접수하고 `status=requested`로 변경 |
| 성공 응답 | 갱신된 나눔 식재료와 신청 접수 객체          |
| 중복/경합 | 이미 `requested`이면 409                     |
| 알림      | 신청 성공 후 공급자에게 신청 알림 발송       |

### 3. `Stale` 의미 정의가 필요함

공지 작성 당시 프론트 정책은 `Stale/Bad/Rotten`을 모두 나눔 기준 미충족으로 보고 등록을 막는 것이었다. 현재 백엔드 label은 `Fresh/Mid/Stale`이며 `Stale`만 나눔 기준 미충족 label이다. `Bad/Rotten`은 방어적 호환 label로만 남긴다.

후속 논의에서 `Stale`을 등록 가능으로 바꾸려면 AI 기준, API 응답, 사용자 문구, QA fixture, 테스트를 함께 갱신해야 한다.

### 4. `confidenceScore` 의미 정의가 필요함

현재 `confidenceScore`는 차단 기준이 아니라 보조 표시/검토 신호다.

공지 작성 당시에는 이 값이 아래 중 무엇의 confidence인지 백엔드/AI 계약에서 정의해야 했다. 현재 정의는 **Stage 2 신선도 분류 모델의 softmax max 확률**이다.

- 객체 탐지 confidence
- 신선도 분류 confidence: 현재 확정
- 식재료 여부 confidence
- 전체 파이프라인 confidence

정의 이후에도 낮은 confidence만으로 등록을 막지 않는다. 프론트 UX 기준은 백엔드 활용 가이드에 맞춰 `confidenceScore < 0.9`를 `확인 필요`로 표시하는 것으로 확정했다.

### 5. 냉장고 내부 나눔 식재료 조회 API가 필요함

제품상 지도는 공유 냉장고와 그 안의 available 나눔 식재료를 탐색하는 화면이다.

공지 작성 당시 구현/API는 냉장고 목록 조회와 등록 가능 냉장고 선택까지였다. 현재 백엔드는 `GET /api/v1/fridges/{fridge_id}/posts?status=available`를 구현했고, 프론트 연동이 남았다.

## 프론트/Codex 쪽 변경 사항

- `postPolicy`의 사용자-facing label을 새 기획 기준으로 변경했다.
- `Fresh/Mid`는 `상태가 좋아 보여요`로 통합한다. 기존 `Normal`은 `Mid` 그룹으로 번역한다.
- `Stale`은 `나눔 기준에 맞지 않아요`로 표시하고 등록을 차단한다. `Bad/Rotten`은 방어적 호환 label로만 차단한다.
- 비식재료/스크린샷/저품질 사진의 문구를 분리했다.
- 서버가 `부패`, `게시할 수 없는 식재료` 같은 문구를 반환해도 프론트 공통 에러 처리에서 사용자-facing 문구로 변환한다.
- 코드 주석과 사용자 Alert에서 `게시글` 표현을 `나눔 식재료` 기준으로 정리했다.
- QA fixture와 테스트 기대값도 새 문구 기준으로 갱신했다.

## 검증 결과

아래 검증을 통과했다.

```bash
npm test -- --runInBand
node .\node_modules\typescript\bin\tsc --noEmit
npm run lint -- --quiet
git diff --check
```

Markdown 문서의 상대 링크도 확인했다.

## 후속 논의 필요

1. 완료: `나눔 신청하기` API endpoint와 응답 형태 확정
2. 완료: 첫 신청 이후 추가 신청 차단 정책 확정 및 백엔드 구현
3. 완료: `Stale`은 현재 나눔 기준 미충족 label로 유지
4. 완료: `confidenceScore`는 Stage 2 신선도 분류 softmax max 확률
5. 완료: 냉장고별 available 나눔 식재료 조회 API 구현
6. 남음: 관리자 화면의 후순위 범위와 수동 운영 기준 정리
7. 남음: Post-MVP rejection reason enum(`not_food`, `low_quality` 등) 설계
