export type ShareReviewPositiveTagId =
  | 'good_condition'
  | 'matched_photo'
  | 'easy_to_find'
  | 'want_again';

export type ShareReviewIssueTagId =
  | 'different_from_photo'
  | 'label_hard_to_find'
  | 'pickup_location_unclear'
  | 'condition_needs_check';

export type ShareReviewTag<TId extends string> = {
  id: TId;
  label: string;
};

export const SHARE_REVIEW_POSITIVE_TAGS: ShareReviewTag<ShareReviewPositiveTagId>[] =
  [
    {id: 'good_condition', label: '상태가 좋아요'},
    {id: 'matched_photo', label: '사진과 비슷해요'},
    {id: 'easy_to_find', label: '찾기 쉬웠어요'},
    {id: 'want_again', label: '다시 받고 싶어요'},
  ];

export const SHARE_REVIEW_ISSUE_TAGS: ShareReviewTag<ShareReviewIssueTagId>[] =
  [
    {id: 'different_from_photo', label: '사진과 달라요'},
    {id: 'label_hard_to_find', label: '라벨을 찾기 어려웠어요'},
    {id: 'pickup_location_unclear', label: '수령 위치가 헷갈렸어요'},
    {id: 'condition_needs_check', label: '상태 확인이 필요했어요'},
  ];
