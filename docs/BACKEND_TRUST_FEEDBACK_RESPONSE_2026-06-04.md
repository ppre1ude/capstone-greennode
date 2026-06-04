# Backend Trust Feedback Response 2026-06-04

> 목적: `BACKEND_TRUST_FEEDBACK_CONTRACT_REQUEST_2026-06-04.md`에 대한 백엔드 회신을 프론트 구현 기준으로 요약한다.

## 확정 사항

- 평가와 신고 단위는 `ShareRequest` 1건이며, 평가는 `(requestId, requesterId)` 기준 1회만 생성된다.
- 평가/신고는 `ShareRequest.status=completed`와 `Post.status=completed`가 모두 충족된 뒤에만 허용된다.
- 평가는 별점 없이 `positiveTagIds`, `issueTagIds` 태그 배열만 저장한다.
- 신고는 평가 태그나 공급자 공개 신뢰 요약에 섞지 않고 운영자 검토 큐 `ShareReport`로만 저장한다.
- 사용자-facing 문구에서는 `부패`, `썩음`, `상함` 같은 표현을 쓰지 않고 `상태 확인 필요`, `나눔 기준에 맞지 않아요` 계열로 완화한다.

## 프론트 연동 API

```text
POST /api/v1/share-requests/{requestId}/review
POST /api/v1/share-requests/{requestId}/report
GET  /api/v1/users/{userId}/trust-summary
```

리뷰 요청:

```json
{
  "positiveTagIds": ["good_condition", "matched_photo"],
  "issueTagIds": ["label_hard_to_find"]
}
```

신고 요청:

```json
{
  "reasonId": "missing_or_not_found"
}
```

신뢰 요약 응답은 `completedShares`, `positiveReviewCount`, `matchedPhotoCount`, `easyToFindCount`, `badges`, `computedAt`을 포함한다. 공개 화면은 `badges`에 `store_qr_verified`가 있을 때만 `QR 보관 인증` 뱃지를 표시하고, 신고/제재 이력 필드를 기대하지 않는다.

## 검증 포인트

- `requested` 상태 평가/신고는 409.
- `completed` 상태 평가/신고는 201.
- 중복 평가는 409.
- 작성자 본인의 자기 나눔 평가/신고는 403.
- 미지원 평가 태그 또는 신고 사유는 422.
- 신고 처리 결과와 제재 이력은 공개 프로필/상세에 미노출.
