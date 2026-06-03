export type ShareFeedbackPositiveTagId =
  | 'good_condition'
  | 'matched_photo'
  | 'easy_to_find'
  | 'want_again';

export type ShareFeedbackIssueTagId =
  | 'different_from_photo'
  | 'label_hard_to_find'
  | 'pickup_location_unclear'
  | 'condition_needs_check';

export type ShareReportReasonId =
  | 'different_from_photo'
  | 'condition_needs_check'
  | 'label_or_zone_mismatch'
  | 'missing_or_not_found'
  | 'inappropriate_listing';

export type ShareReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type ShareFeedbackTag<TId extends string> = {
  id: TId;
  label: string;
};

export type TrustBadgeTone = 'primary' | 'success' | 'warning' | 'neutral';

export type ProviderTrustBadge = {
  id: string;
  label: string;
  tone: TrustBadgeTone;
  iconName: 'qrcode' | 'circle-check' | 'heart' | 'circle-exclamation';
};

type FeedbackEligibility = {
  request?: {
    status?: string | null;
  } | null;
  post?: {
    status?: string | null;
  } | null;
};

export type ProviderTrustSummary = {
  completedShares?: number;
  positiveReviewCount?: number;
  openReportCount?: number;
};

export const POSITIVE_FEEDBACK_TAGS: ShareFeedbackTag<ShareFeedbackPositiveTagId>[] =
  [
    {id: 'good_condition', label: '상태가 좋아요'},
    {id: 'matched_photo', label: '사진과 비슷해요'},
    {id: 'easy_to_find', label: '찾기 쉬웠어요'},
    {id: 'want_again', label: '다시 받고 싶어요'},
  ];

export const ISSUE_FEEDBACK_TAGS: ShareFeedbackTag<ShareFeedbackIssueTagId>[] = [
  {id: 'different_from_photo', label: '사진과 달라요'},
  {id: 'label_hard_to_find', label: '라벨을 찾기 어려웠어요'},
  {id: 'pickup_location_unclear', label: '수령 위치가 헷갈렸어요'},
  {id: 'condition_needs_check', label: '상태 확인이 필요했어요'},
];

export const REPORT_REASON_OPTIONS: ShareFeedbackTag<ShareReportReasonId>[] = [
  {id: 'different_from_photo', label: '등록 사진과 실제 식재료가 달라요'},
  {id: 'condition_needs_check', label: '수령한 식재료 상태 확인이 필요해요'},
  {id: 'label_or_zone_mismatch', label: '라벨/보관 위치가 맞지 않았어요'},
  {id: 'missing_or_not_found', label: '이미 없거나 찾을 수 없었어요'},
  {id: 'inappropriate_listing', label: '부적절한 등록이에요'},
];

export const canLeaveShareFeedback = (item: FeedbackEligibility): boolean =>
  item.request?.status === 'completed' && item.post?.status === 'completed';

export const isOpenShareReportStatus = (status: ShareReportStatus): boolean =>
  status === 'open' || status === 'reviewing';

export const getProviderTrustBadges = ({
  completedShares = 0,
  positiveReviewCount = 0,
  openReportCount = 0,
}: ProviderTrustSummary): ProviderTrustBadge[] => {
  const reportBadge =
    openReportCount > 0
      ? {
          id: 'open-report-review',
          label: `신고 검토 ${openReportCount}건`,
          tone: 'warning' as const,
          iconName: 'circle-exclamation' as const,
        }
      : {
          id: 'no-recent-report',
          label: '최근 신고 검토 없음',
          tone: 'success' as const,
          iconName: 'circle-check' as const,
        };

  return [
    {
      id: 'store-qr-verified',
      label: 'QR 보관 인증',
      tone: 'primary',
      iconName: 'qrcode',
    },
    {
      id: 'completed-shares',
      label: `수령 완료 ${completedShares}회`,
      tone: 'success',
      iconName: 'circle-check',
    },
    {
      id: 'positive-reviews',
      label: `좋은 평가 ${positiveReviewCount}회`,
      tone: 'success',
      iconName: 'heart',
    },
    reportBadge,
  ];
};
