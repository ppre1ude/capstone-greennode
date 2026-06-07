# Backend Trust Feedback Contract Request

> 목적: 수령 QR 인증 이후에만 가능한 태그 기반 평가, 운영자 처리용 신고 시스템, 공급자 신뢰 요약 API를 백엔드 계약으로 요청한다.
> 기준일: 2026-06-04
> 프론트 데모 상태: 로컬 Zustand 상태로 평가/신고 제출과 신뢰 뱃지 반영 UI 구현
> 운영 모델: [TRUST_FEEDBACK_OPERATING_MODEL.md](./TRUST_FEEDBACK_OPERATING_MODEL.md)

---

## 결정 요약

- 평가/신고 단위는 `ShareRequest` 1건이다.
- 평가/신고는 `ShareRequest.status=completed`이고 연결된 `Post.status=completed`인 경우에만 허용한다.
- 수령 QR 인증이 완료되지 않은 신청자는 평가/신고할 수 없다.
- 별점은 이번 범위에서 제외한다. 평가는 태그 선택형으로만 저장한다.
- 신고는 평가와 분리한다. 신고는 태그 피드백이 아니라 운영자 검토 큐에 들어가는 단일 사유 분류 건이며, 공급자 공개 점수나 공개 뱃지로 노출하지 않는다.
- 사용자-facing 문구에서 `썩음`, `상함` 같은 표현은 쓰지 않고 `상태 확인 필요`, `나눔 기준 확인 필요` 계열로 완화한다.

## 신규 모델

### ShareReview

```json
{
  "id": 1,
  "requestId": 55,
  "postId": 41,
  "providerId": 4,
  "requesterId": 3,
  "positiveTagIds": ["good_condition", "matched_photo"],
  "issueTagIds": ["different_from_photo"],
  "createdAt": "2026-06-04T12:00:00Z",
  "updatedAt": "2026-06-04T12:00:00Z"
}
```

권장 unique constraint:

```text
UNIQUE(request_id, requester_id)
```

### ShareReport

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

`status` 후보:

```text
open | reviewing | closed
```

상태 의미:

| status | 의미 |
| --- | --- |
| `open` | 신고 접수 후 아직 운영자가 확인하지 않음 |
| `reviewing` | 운영자가 확인 중 |
| `closed` | 운영자 판단과 조치 기록 완료 |

`resolution` 후보:

```text
pending | dismissed | violation_confirmed
```

`action` 후보:

```text
none | warning_issued | post_hidden | post_removed | temporary_share_restricted | account_suspended
```

처리 의미:

| resolution | action 후보 | 의미 |
| --- | --- | --- |
| `pending` | `none` | 아직 판단 전 |
| `dismissed` | `none` | 문제 없음 또는 증거 부족 |
| `violation_confirmed` | `warning_issued` | 경고 |
| `violation_confirmed` | `post_hidden` | 나눔 비공개 |
| `violation_confirmed` | `post_removed` | 나눔 삭제 |
| `violation_confirmed` | `temporary_share_restricted` | 일정 기간 등록/나눔 제한 |
| `violation_confirmed` | `account_suspended` | 계정 정지 |

## 태그 enum

### positiveTagIds

| id | 사용자 문구 |
| --- | --- |
| `good_condition` | 상태가 좋아요 |
| `matched_photo` | 사진과 비슷해요 |
| `easy_to_find` | 찾기 쉬웠어요 |
| `want_again` | 다시 받고 싶어요 |

### issueTagIds

| id | 사용자 문구 |
| --- | --- |
| `different_from_photo` | 사진과 달라요 |
| `label_hard_to_find` | 라벨을 찾기 어려웠어요 |
| `pickup_location_unclear` | 수령 위치가 헷갈렸어요 |
| `condition_needs_check` | 상태 확인이 필요했어요 |

### report reasonId

| id | 사용자 문구 |
| --- | --- |
| `different_from_photo` | 등록 사진과 실제 식재료가 달라요 |
| `condition_needs_check` | 수령한 식재료 상태 확인이 필요해요 |
| `label_or_zone_mismatch` | 라벨/보관 위치가 맞지 않았어요 |
| `missing_or_not_found` | 이미 없거나 찾을 수 없었어요 |
| `inappropriate_listing` | 부적절한 등록이에요 |

## 요청 API

### 1. 수령 경험 평가 생성

```text
POST /api/v1/share-requests/{requestId}/review
Authorization: Bearer {token}
Content-Type: application/json
```

요청:

```json
{
  "positiveTagIds": ["good_condition", "matched_photo"],
  "issueTagIds": ["label_hard_to_find"]
}
```

응답:

```json
{
  "success": true,
  "message": "수령 경험 평가가 저장되었습니다.",
  "data": {
    "id": 1,
    "requestId": 55,
    "postId": 41,
    "providerId": 4,
    "requesterId": 3,
    "positiveTagIds": ["good_condition", "matched_photo"],
    "issueTagIds": ["label_hard_to_find"],
    "createdAt": "2026-06-04T12:00:00Z",
    "updatedAt": "2026-06-04T12:00:00Z"
  }
}
```

권한/상태 규칙:

- 401: 미인증
- 403: 해당 `ShareRequest`의 requester가 아님
- 409: 이미 평가한 request
- 409: `ShareRequest.status` 또는 `Post.status`가 `completed`가 아님
- 422: 지원하지 않는 tag id

### 2. 신고 생성

```text
POST /api/v1/share-requests/{requestId}/report
Authorization: Bearer {token}
Content-Type: application/json
```

요청:

```json
{
  "reasonId": "missing_or_not_found"
}
```

응답:

```json
{
  "success": true,
  "message": "신고가 접수되었습니다.",
  "data": {
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
}
```

권한/상태 규칙:

- 401: 미인증
- 403: 해당 `ShareRequest`의 requester가 아님
- 409: `ShareRequest.status` 또는 `Post.status`가 `completed`가 아님
- 422: 지원하지 않는 reason id

운영자 처리 API 후보:

```text
GET /api/v1/admin/share-reports?status=open
PATCH /api/v1/admin/share-reports/{reportId}
```

처리 요청:

```json
{
  "status": "closed",
  "resolution": "violation_confirmed",
  "action": "warning_issued"
}
```

MVP 데모에서는 관리자 처리 화면까지 구현하지 않지만, 백엔드는 `status`, `resolution`, `action`을 기준으로 운영자 검토 목록과 제재 이력을 만들 수 있어야 한다. 신고 처리 결과는 공개 프로필이나 나눔 상세에 노출하지 않는다.

### 3. 공급자 신뢰 요약 조회

```text
GET /api/v1/users/{userId}/trust-summary
Authorization: Bearer {token}
```

응답:

```json
{
  "success": true,
  "message": "공급자 신뢰 요약 조회 성공",
  "data": {
    "userId": 4,
    "completedShares": 12,
    "positiveReviewCount": 9,
    "matchedPhotoCount": 8,
    "easyToFindCount": 7,
    "badges": [
      "store_qr_verified",
      "completed_pickup",
      "positive_reviews"
    ],
    "computedAt": "2026-06-04T12:10:00Z"
  }
}
```

프론트 표시 기준:

```text
QR 보관 인증
수령 완료 {completedShares}회
좋은 평가 {positiveReviewCount}회
```

## 프론트 데모와 실제 API 연결 차이

2026-06-07 현재 프론트는 로컬 데모 저장소가 아니라 실제 API client 경로를 사용한다. 백엔드 최신 VM 재검증 전에는 local mock과 `npm run qa:backend-contracts -- --mutate` 하네스로 아래 계약 drift를 먼저 잡는다.

- `ShareFeedbackScreen`의 평가 제출 -> `POST /share-requests/{requestId}/review`
- `ShareFeedbackScreen`의 신고 제출 -> `POST /share-requests/{requestId}/report`
- `PostDetailScreen`, `ProfileScreen`의 뱃지 -> `GET /users/{userId}/trust-summary`

## QA 체크리스트

최신 live VM 재검증은 [VALIDATION_AND_BACKLOG.md](./VALIDATION_AND_BACKLOG.md)의 QR lifecycle/trust/operator 하네스 항목으로 남긴다.

- [x] `requested` 상태 신청은 평가/신고 거절. 2026-06-07 local mock backend feature-contract 하네스 기준 409 확인.
- [x] `completed` 상태 신청은 평가/신고 허용. 2026-06-07 local mock backend feature-contract 하네스 기준 review/report 생성 확인.
- [x] 동일 requester/request 중복 평가 409. 2026-06-07 local mock backend feature-contract 하네스 기준 확인.
- [x] 작성자 본인은 자기 나눔 평가 불가. 2026-06-07 local mock backend feature-contract 하네스 기준 403 확인.
- [x] 미지원 태그 422. 2026-06-07 local mock backend feature-contract 하네스 기준 확인.
- [x] 신고 생성 후 운영자 검토 목록에 노출. 2026-06-07 local mock backend feature-contract 하네스 기준 admin report list 노출 확인.
- [x] 신고 처리 결과와 제재 이력은 공개 프로필/상세에 미노출. 공개 trust summary는 긍정/검증 badge와 count만 정규화한다.
