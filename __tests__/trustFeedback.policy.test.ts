import {
  canLeaveShareFeedback,
  getProviderTrustBadges,
} from '@/features/trust/feedback';
import {
  SHARE_REPORT_REASON_OPTIONS,
  isOpenShareReportStatus,
} from '@/features/trust/report';
import {
  SHARE_REVIEW_ISSUE_TAGS,
  SHARE_REVIEW_POSITIVE_TAGS,
} from '@/features/trust/review';

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

  it('keeps review tags separate from operator report reasons', () => {
    expect(SHARE_REVIEW_POSITIVE_TAGS.map(tag => tag.id)).toContain(
      'good_condition',
    );
    expect(SHARE_REVIEW_ISSUE_TAGS.map(tag => tag.id)).toContain(
      'pickup_location_unclear',
    );
    expect(SHARE_REPORT_REASON_OPTIONS.map(reason => reason.id)).toContain(
      'missing_or_not_found',
    );
    expect(SHARE_REPORT_REASON_OPTIONS).not.toBe(SHARE_REVIEW_ISSUE_TAGS);
  });

  it('treats only active report statuses as open report work', () => {
    expect(isOpenShareReportStatus('open')).toBe(true);
    expect(isOpenShareReportStatus('reviewing')).toBe(true);
    expect(isOpenShareReportStatus('resolved')).toBe(false);
    expect(isOpenShareReportStatus('dismissed')).toBe(false);
  });
});
