import {
  canLeaveShareFeedback,
  getProviderTrustBadges,
} from '@/features/trust/feedback';
import {
  SHARE_REPORT_REASON_OPTIONS,
  isActiveShareReportStatus,
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
      }).map(badge => badge.label),
    ).toEqual(['QR 보관 인증', '수령 완료 12회', '좋은 평가 9회']);
  });

  it('never exposes report state as public trust badges', () => {
    expect(
      getProviderTrustBadges({
        completedShares: 12,
        positiveReviewCount: 9,
      })
        .map(badge => badge.label)
        .join(' '),
    ).not.toMatch(/신고|검토|위반|제재/);
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

  it('treats only active report statuses as operator work', () => {
    expect(isActiveShareReportStatus('open')).toBe(true);
    expect(isActiveShareReportStatus('reviewing')).toBe(true);
    expect(isActiveShareReportStatus('closed')).toBe(false);
  });
});
