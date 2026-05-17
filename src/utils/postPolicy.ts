import type { AiAnalysis, GenerateResult } from '@/types';

type PostOwnershipFields = {
  authorId?: number | null;
  userId?: number | null;
};

type PostDisplayFields = {
  detectedFruit?: string | null;
  detectedFruitKo?: string | null;
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
const UNKNOWN_CATEGORIES = new Set(['unknown', '알 수 없음']);
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

const REVIEW_LABEL = '확인 필요';
export const CONFIDENCE_REVIEW_THRESHOLD_PERCENT = 90;

export const getQualityMeta = (category?: string | null): QualityMeta => {
  const normalized = (category || '').toLowerCase();

  if (SHAREABLE_CATEGORIES.has(normalized)) {
    return { label: '상태가 좋아 보여요', canShare: true };
  }

  if (UNSAFE_CATEGORIES.has(normalized)) {
    return { label: '나눔 기준에 맞지 않아요', canShare: false };
  }

  if (UNKNOWN_CATEGORIES.has(normalized)) {
    return { label: '사진으로 상태를 확인하기 어려워요', canShare: false };
  }

  if (REJECTED_CATEGORIES.has(normalized)) {
    if (['low_quality', 'low-quality'].includes(normalized)) {
      return { label: '사진으로 상태를 확인하기 어려워요', canShare: false };
    }
    return { label: '식재료 사진으로 확인되지 않았어요', canShare: false };
  }

  if (REVIEW_CATEGORIES.has(normalized)) {
    return { label: REVIEW_LABEL, canShare: true };
  }

  return { label: category || '분석 중', canShare: true };
};

export const isShareableCategory = (category?: string | null): boolean =>
  getQualityMeta(category).canShare;

export const getAnalysisQualityMeta = (
  analysis?: Partial<AiAnalysis> | null,
): QualityMeta => {
  if (analysis?.isFresh === false) {
    return { label: '나눔 기준에 맞지 않아요', canShare: false };
  }

  const rejectionMeta = getQualityMeta(analysis?.rejectionReason);

  if (!rejectionMeta.canShare || rejectionMeta.label === REVIEW_LABEL) {
    return rejectionMeta;
  }

  const reviewMeta = getQualityMeta(analysis?.reviewReason);

  if (reviewMeta.label === REVIEW_LABEL) {
    return reviewMeta;
  }

  return getQualityMeta(analysis?.category);
};

export const getGenerateResultQualityMeta = (
  result?: Partial<GenerateResult> | null,
): QualityMeta => {
  if (!result?.aiAnalysis && !result?.freshnessLabel) {
    return { label: '분석 중', canShare: false };
  }

  if (result?.isFresh === false) {
    return { label: '나눔 기준에 맞지 않아요', canShare: false };
  }

  const analysisMeta = getAnalysisQualityMeta(result?.aiAnalysis);

  if (!analysisMeta.canShare || analysisMeta.label === REVIEW_LABEL) {
    return analysisMeta;
  }

  const rootFreshnessMeta = getQualityMeta(result?.freshnessLabel);

  if (result?.freshnessLabel && rootFreshnessMeta.label !== '분석 중') {
    return rootFreshnessMeta;
  }

  return analysisMeta;
};

export const canShareAnalysisResult = (
  result?: Pick<
    GenerateResult,
    'aiAnalysis' | 'freshnessLabel' | 'isFresh'
  > | null,
): boolean => getGenerateResultQualityMeta(result).canShare;

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
  thresholdPercent: number = CONFIDENCE_REVIEW_THRESHOLD_PERCENT,
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

export const getPostDisplayName = (post: PostDisplayFields): string =>
  post.detectedFruitKo || post.detectedFruit || '나눔 식재료';

export const getPostRelativeTimeLabel = (
  createdAt?: string | null,
  now: Date = new Date(),
): string => {
  if (!createdAt) {
    return '등록일 확인 중';
  }

  const createdDate = new Date(createdAt);
  const diffMs = now.getTime() - createdDate.getTime();

  if (Number.isNaN(createdDate.getTime()) || Number.isNaN(diffMs)) {
    return '등록일 확인 중';
  }

  if (diffMs < 60_000) {
    return '방금 등록';
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}일 전`;
  }

  return `${createdDate.getMonth() + 1}/${createdDate.getDate()} 등록`;
};

export const getPostStatusLabel = (status?: string | null): string => {
  switch (status) {
    case 'available':
      return '나눔 가능';
    case 'requested':
      return '신청 접수';
    case 'completed':
      return '나눔 완료';
    default:
      return '상태 확인 중';
  }
};
