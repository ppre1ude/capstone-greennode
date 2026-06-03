# Trust Feedback Operating Model

> 목적: 수령 경험 평가, 나눔 신고, 공급자 신뢰 뱃지를 구현하거나 백엔드에 요청할 때 평가와 신고를 섞지 않도록 고정한다.
> 기준일: 2026-06-04

## 구현 전 결정 게이트

아래 항목 중 하나라도 바뀌면 구현 전에 사용자와 먼저 의논한다.

- 공급자 신뢰, 신고, 랭킹, 뱃지, 공개 노출, 운영자 검토에 영향을 주는 변경
- 평가 태그, 신고 사유, 신고 처리 상태, 신고 집계 기준 변경
- 별점, 점수, 등급, 랭킹처럼 공급자를 정량화하는 기능 추가
- 백엔드 저장 모델, 관리자 API, 운영자 조치 흐름 변경

의논할 때는 반드시 세 가지를 분리해 말한다.

| 항목 | 확인할 질문 |
| --- | --- |
| 사용자 행동 | 수령자가 화면에서 무엇을 누르는가? |
| 저장 모델 | 서버에 어떤 필드와 상태로 저장되는가? |
| 운영자/백엔드 행동 | 이 데이터로 운영자나 백엔드가 무엇을 처리하는가? |

## 고정 결정

- 평가와 신고는 모두 `ShareRequest.status=completed`와 `Post.status=completed` 이후에만 가능하다.
- **수령 경험 평가**는 수령자가 남기는 경험 피드백이다. 여러 개의 긍정/불만족 태그를 선택할 수 있다.
- **나눔 신고**는 운영자 검토 큐에 들어가는 사건이다. 태그가 아니라 단일 `reasonId`, 작업 상태 `status`, 판단 결과 `resolution`, 운영 조치 `action`을 가진다.
- 신고 작업 상태는 `open`, `reviewing`, `closed`를 사용한다.
- 신고 판단 결과는 `pending`, `dismissed`, `violation_confirmed`를 사용한다.
- 신고 운영 조치는 `none`, `warning_issued`, `post_hidden`, `post_removed`, `temporary_share_restricted`, `account_suspended`를 사용한다.
- 공급자 신뢰 뱃지는 별점이나 점수가 아니라 QR 생명주기와 좋은 평가처럼 공개 가능한 긍정/검증 신호만 요약한다.
- 신고 건수, 신고 검토 상태, 위반 여부, 제재 이력은 공개 뱃지나 공개 프로필에 노출하지 않는다.
- 사용자-facing 문구에는 `썩음`, `상함` 같은 표현을 쓰지 않는다.

## 코드 구조

| 파일 | 책임 |
| --- | --- |
| `src/features/trust/review.ts` | 평가 태그 타입과 라벨만 관리 |
| `src/features/trust/report.ts` | 신고 사유, 신고 작업 상태, 판단 결과, 운영 조치만 관리 |
| `src/features/trust/feedback.ts` | 평가 가능 조건과 공급자 신뢰 뱃지 계산만 관리 |
| `src/store/trustFeedbackStore.ts` | 데모용 로컬 평가/신고 저장소 |
| `src/screens/trust/ShareFeedbackScreen.tsx` | 수령 완료 건의 평가/신고 입력 UI |

구조 규칙:

- 신고 사유를 `tag`, `tags`, `reasonIds`로 모델링하지 않는다.
- 평가 태그 상수와 신고 사유 상수를 같은 파일에 두지 않는다.
- 신고를 공급자 공개 뱃지나 공개 점수의 입력으로 쓰지 않는다.
- 신고는 운영자 내부 큐와 제재 판단의 입력으로만 쓴다.

## UI 규칙

| 화면 요소 | UI 패턴 | 이유 |
| --- | --- | --- |
| 좋았던 점 | 다중 선택 칩 | 수령 경험의 긍정 피드백 |
| 아쉬웠던 점 | 다중 선택 칩 | 낮은 강도의 경험 피드백 |
| 운영자 처리 분류 | 라디오 버튼 | 운영자 큐 분류를 위한 단일 주 사유 |
| 신고 제출 | 위험 색상 CTA | 운영자 검토 대상 생성 |
| 공급자 신뢰 뱃지 | 표시용 칩 | 공개 가능한 긍정/검증 신호 요약 |

## 운영자 제재 흐름

신고 처리 결과는 운영자가 직접 반영한다. 자동으로 공급자 공개 평판을 깎지 않는다.

```text
open -> reviewing -> closed
```

| resolution | action 후보 | 의미 |
| --- | --- | --- |
| `pending` | `none` | 아직 판단 전 |
| `dismissed` | `none` | 문제 없음 또는 증거 부족 |
| `violation_confirmed` | `warning_issued` | 경고 |
| `violation_confirmed` | `post_hidden` | 해당 나눔 비공개 |
| `violation_confirmed` | `post_removed` | 해당 나눔 삭제 |
| `violation_confirmed` | `temporary_share_restricted` | 일정 기간 등록/나눔 제한 |
| `violation_confirmed` | `account_suspended` | 계정 정지 |

공개 화면에는 `resolution`과 `action`을 노출하지 않는다. 필요 시 당사자에게만 운영 알림을 보낸다.

## 백엔드 계약

신고 생성 요청은 단일 사유를 보낸다.

```json
{
  "reasonId": "missing_or_not_found"
}
```

응답은 운영자 처리 상태를 포함한다.

```json
{
  "id": 1,
  "requestId": 55,
  "postId": 41,
  "providerId": 4,
  "requesterId": 3,
  "reasonId": "missing_or_not_found",
  "status": "open",
  "resolution": "pending",
  "action": "none",
  "createdAt": "2026-06-04T12:05:00Z",
  "updatedAt": "2026-06-04T12:05:00Z"
}
```

상세 API 요청은 [BACKEND_TRUST_FEEDBACK_CONTRACT_REQUEST_2026-06-04.md](./BACKEND_TRUST_FEEDBACK_CONTRACT_REQUEST_2026-06-04.md)를 따른다.

## 검증 기준

- `__tests__/shareFeedback.screen.test.tsx`: 신고 사유가 radio option으로 렌더링되고 단일 `reasonId`, `open`, `pending`, `none`으로 저장되는지 검증
- `__tests__/trustFeedback.policy.test.ts`: 평가 태그와 신고 사유가 분리된 도메인 카탈로그인지, 신고 상태가 공개 뱃지로 노출되지 않는지 검증
- Android 에뮬레이터 QA: 신고 기본/선택 화면 스크린샷으로 라디오 UI 확인
