import {
  canShareAnalysisResult,
  CONFIDENCE_REVIEW_THRESHOLD_PERCENT,
  getAnalysisQualityMeta,
  getConfidencePercent,
  getGenerateResultQualityMeta,
  getPostAuthorId,
  getPostDisplayName,
  getPostRelativeTimeLabel,
  getPostStatusLabel,
  getQualityMeta,
  isPostAuthoredByUser,
  isShareableCategory,
  needsAnalysisReview,
} from '@/utils/postPolicy';

describe('post policy', () => {
  it.each(['rotten', 'stale', 'bad', 'Rotten', 'Stale', 'Bad'])(
    'blocks unsafe quality category %s',
    category => {
      expect(getQualityMeta(category)).toEqual({
        label: '나눔 기준에 맞지 않아요',
        canShare: false,
      });
      expect(isShareableCategory(category)).toBe(false);
    },
  );

  it.each(['unknown', '알 수 없음'])(
    'blocks unknown freshness category %s',
    category => {
      expect(getQualityMeta(category)).toEqual({
        label: '사진으로 상태를 확인하기 어려워요',
        canShare: false,
      });
      expect(isShareableCategory(category)).toBe(false);
    },
  );

  it.each(['not_food', 'non_food', 'not-food', 'screenshot', 'ui_screenshot'])(
    'blocks non-food AI rejection category %s',
    category => {
      expect(getQualityMeta(category)).toEqual({
        label: '식재료 사진으로 확인되지 않았어요',
        canShare: false,
      });
      expect(isShareableCategory(category)).toBe(false);
    },
  );

  it.each(['low_quality', 'low-quality'])(
    'blocks low-quality AI rejection category %s',
    category => {
      expect(getQualityMeta(category)).toEqual({
        label: '사진으로 상태를 확인하기 어려워요',
        canShare: false,
      });
      expect(isShareableCategory(category)).toBe(false);
    },
  );

  it.each([
    'fresh',
    'good',
    'normal',
    'mid',
    'medium',
    'Fresh',
    'Mid',
    'Normal',
  ])(
    'uses one user-facing label for shareable quality category %s',
    category => {
      expect(getQualityMeta(category)).toEqual({
        label: '상태가 좋아 보여요',
        canShare: true,
      });
      expect(isShareableCategory(category)).toBe(true);
    },
  );

  it.each(['uncertain', 'review_required', 'multi_object_review'])(
    'keeps review-only category %s shareable with 확인 필요 label',
    category => {
      expect(getQualityMeta(category)).toEqual({
        label: '확인 필요',
        canShare: true,
      });
    },
  );

  it('blocks generated analysis results when the server marks the item unsafe', () => {
    expect(
      canShareAnalysisResult({
        aiAnalysis: {
          isFresh: false,
          confidenceScore: 0.2,
          category: 'Bad',
          analysisMessage: '나눔 기준에 맞지 않는 상태입니다.',
        },
      }),
    ).toBe(false);
  });

  it('does not allow sharing when no generate analysis is available', () => {
    expect(canShareAnalysisResult(null)).toBe(false);
    expect(getGenerateResultQualityMeta(null)).toEqual({
      label: '분석 중',
      canShare: false,
    });
  });

  it('blocks generated analysis results when isFresh is false even with a shareable label', () => {
    expect(
      getGenerateResultQualityMeta({
        isFresh: false,
        freshnessLabel: 'Fresh',
        aiAnalysis: {
          isFresh: false,
          confidenceScore: 0.91,
          category: 'Fresh',
        },
      }),
    ).toEqual({ label: '나눔 기준에 맞지 않아요', canShare: false });
  });

  it('blocks generated analysis results when the server returns a rejection reason', () => {
    expect(
      getAnalysisQualityMeta({
        isFresh: true,
        confidenceScore: 0.98,
        category: 'Fresh',
        rejectionReason: 'not_food',
        analysisMessage: '식재료가 아닌 이미지입니다.',
      }),
    ).toEqual({ label: '식재료 사진으로 확인되지 않았어요', canShare: false });
  });

  it('uses authorId as the post ownership contract', () => {
    expect(getPostAuthorId({ authorId: 10 })).toBe(10);
    expect(isPostAuthoredByUser({ authorId: 10 }, 10)).toBe(true);
    expect(isPostAuthoredByUser({ authorId: 10 }, 11)).toBe(false);
  });

  it('derives post display fields from the backend Phase 1.5 post contract', () => {
    expect(getPostDisplayName({ detectedFruitKo: '사과' })).toBe('사과');
    expect(getPostDisplayName({ detectedFruit: 'apple' })).toBe('apple');
    expect(getPostDisplayName({})).toBe('나눔 식재료');
    expect(getPostStatusLabel('available')).toBe('나눔 가능');
    expect(getPostStatusLabel('requested')).toBe('신청 접수');
    expect(getPostStatusLabel('completed')).toBe('나눔 완료');
  });

  it('normalizes confidence scores and flags confidence below 90% for review', () => {
    expect(CONFIDENCE_REVIEW_THRESHOLD_PERCENT).toBe(90);
    expect(getConfidencePercent(0.57)).toBe(57);
    expect(getConfidencePercent(87)).toBe(87);
    expect(getConfidencePercent(undefined)).toBeNull();
    expect(needsAnalysisReview(0.4)).toBe(true);
    expect(needsAnalysisReview(0.7)).toBe(true);
    expect(needsAnalysisReview(1.0)).toBe(false);
    expect(needsAnalysisReview(0.72, 60)).toBe(false);
  });

  it('keeps a legacy userId fallback for older local fixtures only', () => {
    expect(getPostAuthorId({ userId: 7 })).toBe(7);
    expect(isPostAuthoredByUser({ userId: 7 }, 7)).toBe(true);
  });

  it('formats nearby post time from createdAt instead of a fixed placeholder', () => {
    const now = new Date('2026-05-17T12:00:00Z');

    expect(getPostRelativeTimeLabel('2026-05-17T11:59:40Z', now)).toBe(
      '방금 등록',
    );
    expect(getPostRelativeTimeLabel('2026-05-17T11:35:00Z', now)).toBe(
      '25분 전',
    );
    expect(getPostRelativeTimeLabel('2026-05-17T09:00:00Z', now)).toBe(
      '3시간 전',
    );
    expect(getPostRelativeTimeLabel('2026-05-15T12:00:00Z', now)).toBe(
      '2일 전',
    );
    expect(getPostRelativeTimeLabel(null, now)).toBe('등록일 확인 중');
  });
});
