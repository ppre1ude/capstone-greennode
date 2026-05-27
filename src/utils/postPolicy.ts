import type {
  AiAnalysis,
  GenerateResult,
  PostStatus,
  ShareRequestStatus,
} from '@/types';

type PostOwnershipFields = {
  authorId?: number | null;
  userId?: number | null;
};

type PostDisplayFields = {
  detectedFruit?: string | null;
  detectedFruitKo?: string | null;
};

type PostLifecycleFields = {
  status?: PostStatus | string | null;
  expirationDate?: string | null;
  requestExpiresAt?: string | null;
  storeExpiresAt?: string | null;
  pickedUpAt?: string | null;
  updatedAt?: string | null;
};

type ShareRequestLifecycleFields = {
  request: {
    status?: ShareRequestStatus | string | null;
  };
  post: PostLifecycleFields;
};

export type QualityMeta = {
  label: string;
  canShare: boolean;
};

export const HOME_POST_LIFECYCLE_STATUSES = [
  'pending_store',
  'available',
  'requested',
  'completed',
] as const satisfies readonly PostStatus[];

export const HOME_SHARE_REQUEST_LIFECYCLE_STATUSES = [
  'requested',
  'completed',
] as const satisfies readonly ShareRequestStatus[];

export const MY_POST_LIFECYCLE_STATUSES = [
  'pending_store',
  'available',
  'requested',
  'completed',
  'cancelled',
  'expired',
] as const satisfies readonly PostStatus[];

export const MY_SHARE_REQUEST_LIFECYCLE_STATUSES = [
  'requested',
  'completed',
  'cancelled',
  'expired',
] as const satisfies readonly ShareRequestStatus[];

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

const getRejectionReasonQualityMeta = (
  reason?: string | null,
): QualityMeta | null => {
  if (!reason) {
    return null;
  }

  const meta = getQualityMeta(reason);

  if (!meta.canShare) {
    return meta;
  }

  if (meta.label === REVIEW_LABEL) {
    return { ...meta, canShare: false };
  }

  return { label: '사진으로 상태를 확인하기 어려워요', canShare: false };
};

export const getAnalysisQualityMeta = (
  analysis?: Partial<AiAnalysis> | null,
): QualityMeta => {
  if (analysis?.isFresh === false) {
    return { label: '나눔 기준에 맞지 않아요', canShare: false };
  }

  const rejectionMeta = getRejectionReasonQualityMeta(
    analysis?.rejectionReason,
  );

  if (rejectionMeta) {
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
  const rootRejectionMeta = getRejectionReasonQualityMeta(
    result?.rejectionReason,
  );

  if (rootRejectionMeta) {
    return rootRejectionMeta;
  }

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
    'aiAnalysis' | 'freshnessLabel' | 'isFresh' | 'rejectionReason'
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
    case 'pending_store':
      return '입고 대기';
    case 'available':
      return '나눔 가능';
    case 'requested':
      return '신청 접수';
    case 'completed':
      return '나눔 완료';
    case 'expired':
      return '보관 만료';
    case 'disposed':
      return '폐기 완료';
    case 'cancelled':
      return '등록 취소';
    default:
      return '상태 확인 중';
  }
};

export const getShareRequestStatusLabel = (
  status?: ShareRequestStatus | string | null,
): string => {
  switch (status) {
    case 'requested':
      return '신청 접수';
    case 'completed':
      return '수령 완료';
    case 'cancelled':
      return '신청 취소';
    case 'expired':
      return '수령 만료';
    default:
      return status ? String(status) : '상태 확인 중';
  }
};

export const isPostInLifecycleSummary = (post: PostLifecycleFields): boolean =>
  post.status === 'pending_store' ||
  post.status === 'available' ||
  post.status === 'requested';

export const isPostAwaitingStoreQr = (post: PostLifecycleFields): boolean =>
  post.status === 'pending_store';

export const isPostAwaitingPickupConfirmation = (
  post: PostLifecycleFields,
): boolean => post.status === 'requested';

export const isShareRequestAwaitingPickup = (
  item: ShareRequestLifecycleFields,
): boolean =>
  item.request.status === 'requested' && item.post.status === 'requested';

export const canCancelPost = (post: PostLifecycleFields): boolean =>
  post.status === 'pending_store' || post.status === 'available';

export const canCompletePost = (post: PostLifecycleFields): boolean =>
  post.status === 'requested';

export const canExpirePost = (post: PostLifecycleFields): boolean =>
  post.status === 'requested' || post.status === 'available';

export const formatPostLifecycleDate = (
  value?: string | null,
  fallback = '일정 확인 필요',
): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPostLifecycleDeadlineLabel = (
  post: PostLifecycleFields,
): string => {
  if (post.status === 'pending_store') {
    return `입고 QR 만료 ${formatPostLifecycleDate(post.storeExpiresAt)}`;
  }

  if (post.status === 'requested') {
    return `수령 QR 만료 ${formatPostLifecycleDate(post.requestExpiresAt)}`;
  }

  if (post.status === 'completed') {
    return `완료 ${formatPostLifecycleDate(post.pickedUpAt ?? post.updatedAt)}`;
  }

  return `권장 수령일 ${post.expirationDate ?? '일정 확인 필요'}`;
};
