export type TrustBadgeTone = 'primary' | 'success' | 'warning' | 'neutral';

export type ProviderTrustBadge = {
  id: string;
  label: string;
  tone: Exclude<TrustBadgeTone, 'warning'>;
  iconName: 'qrcode' | 'circle-check' | 'heart';
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
};

export const canLeaveShareFeedback = (item: FeedbackEligibility): boolean =>
  item.request?.status === 'completed' && item.post?.status === 'completed';

export const getProviderTrustBadges = ({
  completedShares = 0,
  positiveReviewCount = 0,
}: ProviderTrustSummary): ProviderTrustBadge[] => {
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
  ];
};
