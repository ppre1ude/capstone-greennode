import {
  canShareAnalysisResult,
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
        label: '부패 의심',
        canShare: false,
      });
      expect(isShareableCategory(category)).toBe(false);
    },
  );

  it.each(['fresh', 'good', 'normal', 'mid', 'medium', 'Fresh', 'Normal'])(
    'allows shareable quality category %s',
    category => {
      expect(isShareableCategory(category)).toBe(true);
    },
  );

  it('blocks generated analysis results when the server marks the item unsafe', () => {
    expect(
      canShareAnalysisResult({
        aiAnalysis: {
          isFresh: false,
          confidenceScore: 0.2,
          category: 'Bad',
          analysisMessage: '부패가 의심됩니다.',
        },
      }),
    ).toBe(false);
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
