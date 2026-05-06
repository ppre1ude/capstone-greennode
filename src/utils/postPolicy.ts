import type {GenerateResult} from '@/types';

type PostOwnershipFields = {
  authorId?: number | null;
  userId?: number | null;
};

export type QualityMeta = {
  label: string;
  canShare: boolean;
};

const SHAREABLE_CATEGORIES = new Set(['fresh', 'good', 'normal', 'mid', 'medium']);
const UNSAFE_CATEGORIES = new Set(['rotten', 'stale', 'bad']);

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

  return {label: category || '분석 중', canShare: true};
};

export const isShareableCategory = (category?: string | null): boolean =>
  getQualityMeta(category).canShare;

export const canShareAnalysisResult = (
  result?: Pick<GenerateResult, 'aiAnalysis'> | null,
): boolean => isShareableCategory(result?.aiAnalysis?.category);

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
