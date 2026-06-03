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

export const canLeaveShareFeedback = (item: FeedbackEligibility): boolean =>
  item.request?.status === 'completed' && item.post?.status === 'completed';

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
