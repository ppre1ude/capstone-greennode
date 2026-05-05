import {
  canShareAnalysisResult,
  getAnalysisQualityMeta,
  getConfidencePercent,
  getPostAuthorId,
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

  it.each([
    'not_food',
    'non_food',
    'not-food',
    'screenshot',
    'ui_screenshot',
  ])('blocks non-food AI rejection category %s', category => {
    expect(getQualityMeta(category)).toEqual({
      label: '식재료 사진으로 확인되지 않았어요',
      canShare: false,
    });
    expect(isShareableCategory(category)).toBe(false);
  });

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

  it.each(['fresh', 'good', 'normal', 'mid', 'medium', 'Fresh', 'Normal'])(
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

  it('blocks generated analysis results when the server returns a rejection reason', () => {
    expect(
      getAnalysisQualityMeta({
        isFresh: true,
        confidenceScore: 0.98,
        category: 'Fresh',
        rejectionReason: 'not_food',
        analysisMessage: '식재료가 아닌 이미지입니다.',
      }),
    ).toEqual({label: '식재료 사진으로 확인되지 않았어요', canShare: false});
  });

  it('uses authorId as the post ownership contract', () => {
    expect(getPostAuthorId({authorId: 10})).toBe(10);
    expect(isPostAuthoredByUser({authorId: 10}, 10)).toBe(true);
    expect(isPostAuthoredByUser({authorId: 10}, 11)).toBe(false);
  });

  it('normalizes confidence scores and flags low confidence for review', () => {
    expect(getConfidencePercent(0.57)).toBe(57);
    expect(getConfidencePercent(87)).toBe(87);
    expect(getConfidencePercent(undefined)).toBeNull();
    expect(needsAnalysisReview(0.57)).toBe(true);
    expect(needsAnalysisReview(0.72)).toBe(false);
  });

  it('keeps a legacy userId fallback for older local fixtures only', () => {
    expect(getPostAuthorId({userId: 7})).toBe(7);
    expect(isPostAuthoredByUser({userId: 7}, 7)).toBe(true);
  });
});
