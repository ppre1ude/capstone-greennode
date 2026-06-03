import {
  canLeaveShareFeedback,
  getProviderTrustBadges,
} from '@/features/trust/feedback';

describe('trust feedback policy', () => {
  it('allows feedback only after request and post are completed', () => {
    expect(
      canLeaveShareFeedback({
        request: {status: 'completed'},
        post: {status: 'completed'},
      }),
    ).toBe(true);

    expect(
      canLeaveShareFeedback({
        request: {status: 'requested'},
        post: {status: 'requested'},
      }),
    ).toBe(false);

    expect(
      canLeaveShareFeedback({
        request: {status: 'completed'},
        post: {status: 'requested'},
      }),
    ).toBe(false);
  });

  it('summarizes completed pickup and positive feedback as trust badges', () => {
    expect(
      getProviderTrustBadges({
        completedShares: 12,
        positiveReviewCount: 9,
        openReportCount: 0,
      }).map(badge => badge.label),
    ).toEqual([
      'QR 보관 인증',
      '수령 완료 12회',
      '좋은 평가 9회',
      '최근 신고 검토 없음',
    ]);
  });
});
