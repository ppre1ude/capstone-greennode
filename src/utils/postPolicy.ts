import type {AiAnalysis, GenerateResult} from '@/types';

type PostOwnershipFields = {
  authorId?: number | null;
  userId?: number | null;
};

export type QualityMeta = {
  label: string;
  canShare: boolean;
};

const SHAREABLE_CATEGORIES = new Set([
  'fresh',
  'good',
  'normal',
  'mid',
  'medium',
]);
const UNSAFE_CATEGORIES = new Set(['rotten', 'stale', 'bad']);
const REJECTED_CATEGORIES = new Set([
  'not_food',
  'non_food',
  'not-food',
  'non-food',
  'low_quality',
  'low-quality',
  'screenshot',
  'ui_screenshot',
  'ui-screenshot',
]);
const REVIEW_CATEGORIES = new Set([
  'uncertain',
  'review_required',
  'review-required',
  'multi_object_review',
  'multi-object-review',
]);

export const getQualityMeta = (category?: string | null): QualityMeta => {
  const normalized = (category || '').toLowerCase();

  if (SHAREABLE_CATEGORIES.has(normalized)) {
    if (['normal', 'mid', 'medium'].includes(normalized)) {
      return {label: '보통', canShare: true};
    }
    return {label: '신선', canShare: true};
  }

  if (UNSAFE_CATEGORIES.has(normalized)) {
    return {label: '부패 의심', canShare: false};
  }

  if (REJECTED_CATEGORIES.has(normalized)) {
    return {label: '등록 불가', canShare: false};
  }

  if (REVIEW_CATEGORIES.has(normalized)) {
    return {label: '확인 필요', canShare: true};
  }

  return {label: category || '분석 중', canShare: true};
};

export const isShareableCategory = (category?: string | null): boolean =>
  getQualityMeta(category).canShare;

export const getAnalysisQualityMeta = (
  analysis?: Partial<AiAnalysis> | null,
): QualityMeta => {
  const rejectionMeta = getQualityMeta(analysis?.rejectionReason);

  if (!rejectionMeta.canShare || rejectionMeta.label === '확인 필요') {
    return rejectionMeta;
  }

  const reviewMeta = getQualityMeta(analysis?.reviewReason);

  if (reviewMeta.label === '확인 필요') {
    return reviewMeta;
  }

  return getQualityMeta(analysis?.category);
};

export const canShareAnalysisResult = (
  result?: Pick<GenerateResult, 'aiAnalysis'> | null,
): boolean => getAnalysisQualityMeta(result?.aiAnalysis).canShare;

export const getConfidencePercent = (
  confidenceScore?: number | null,
): number | null => {
  if (typeof confidenceScore !== 'number' || Number.isNaN(confidenceScore)) {
    return null;
  }

  if (confidenceScore <= 1) {
    return Math.round(confidenceScore * 100);
  }

  return Math.round(confidenceScore);
};

export const needsAnalysisReview = (
  confidenceScore?: number | null,
  thresholdPercent: number = 60,
): boolean => {
  const confidencePercent = getConfidencePercent(confidenceScore);
  return confidencePercent != null && confidencePercent < thresholdPercent;
};

export const getPostAuthorId = (post: PostOwnershipFields): number | null =>
  post.authorId ?? post.userId ?? null;

export const isPostAuthoredByUser = (
  post: PostOwnershipFields,
  userId?: number | null,
): boolean => userId != null && getPostAuthorId(post) === userId;
