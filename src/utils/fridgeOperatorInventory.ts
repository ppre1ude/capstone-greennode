import type { OperatorInventoryItem } from '@/api/operator';

export type OperatorItemStatus =
  | 'available'
  | 'requested'
  | 'needsReview'
  | 'discardCandidate'
  | 'discarded'
  | 'completed'
  | 'missing';

export type OperatorStatusTone = 'good' | 'info' | 'warning' | 'danger';

type StatusSource = {
  status: OperatorItemStatus;
};

export type OperatorInspectionItem = {
  name: string;
  postId: string;
  labelCode?: string;
  storageZone?: string;
  ai: string;
  recommendedUntil: string;
  status: OperatorItemStatus;
};

export const getOperatorItemStatusTone = (
  status: OperatorItemStatus,
): OperatorStatusTone => {
  if (status === 'available' || status === 'completed') {
    return 'good';
  }

  if (status === 'requested') {
    return 'info';
  }

  if (status === 'discardCandidate' || status === 'discarded') {
    return 'danger';
  }

  return 'warning';
};

export const getOperatorItemStatusLabel = (
  status: OperatorItemStatus,
): string => {
  switch (status) {
    case 'available':
      return '신청 가능';
    case 'requested':
      return '신청 접수';
    case 'needsReview':
      return '현장 확인';
    case 'discardCandidate':
      return '폐기 후보';
    case 'discarded':
      return '폐기 완료';
    case 'completed':
      return '수령 완료';
    case 'missing':
      return '분실 확인';
  }
};

export const deriveBasketStatus = (items: StatusSource[]) => {
  const total = items.length;
  const discardCandidateCount = items.filter(
    item => item.status === 'discardCandidate',
  ).length;
  const needsReviewCount = items.filter(
    item => item.status === 'needsReview',
  ).length;
  const requestedCount = items.filter(
    item => item.status === 'requested',
  ).length;

  if (total === 0) {
    return { label: '항목 없음', tone: 'warning' as const };
  }

  if (discardCandidateCount > 0) {
    return {
      label: `${total}개 중 ${discardCandidateCount}개 폐기 후보`,
      tone: 'danger' as const,
    };
  }

  if (needsReviewCount > 0) {
    return {
      label: `${total}개 중 ${needsReviewCount}개 확인 필요`,
      tone: 'warning' as const,
    };
  }

  if (requestedCount === total) {
    return {
      label: `${total}개 모두 신청 접수`,
      tone: 'info' as const,
    };
  }

  return {
    label: `${total}개 신청 가능`,
    tone: 'good' as const,
  };
};

const formatConfidence = (confidenceScore?: number | null): string | null => {
  if (typeof confidenceScore !== 'number') {
    return null;
  }

  return confidenceScore <= 1
    ? confidenceScore.toFixed(2)
    : (confidenceScore / 100).toFixed(2);
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatOperatorDateTime = (value?: string | null): string => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return '-';
  }

  const isDateOnly = DATE_ONLY_PATTERN.test(trimmedValue);
  const normalizedValue = isDateOnly
    ? `${trimmedValue}T00:00:00`
    : trimmedValue.replace(' ', 'T');
  const date = new Date(normalizedValue);

  if (!Number.isFinite(date.getTime())) {
    return trimmedValue;
  }

  const dateText = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });

  if (isDateOnly) {
    return dateText;
  }

  const timeText = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${dateText} ${timeText}`;
};

export const getStorageZoneLabel = (
  storageZone?: OperatorInventoryItem['storageZone'],
): string => {
  if (storageZone === 'ETHYLENE_SEPARATED') {
    return '에틸렌 분리 구역';
  }

  return '일반 구역';
};

export const mapOperatorItemStatus = (
  status: OperatorInventoryItem['status'],
): OperatorItemStatus => {
  if (status === 'expired') {
    return 'discardCandidate';
  }

  if (status === 'disposed') {
    return 'discarded';
  }

  if (status === 'needs_review') {
    return 'needsReview';
  }

  if (
    status === 'available' ||
    status === 'requested' ||
    status === 'completed' ||
    status === 'missing'
  ) {
    return status;
  }

  return 'needsReview';
};

export const canDisposeOperatorItem = (status: OperatorItemStatus): boolean =>
  status === 'available' || status === 'discardCandidate';

export const mapOperatorInventoryItem = (
  item: OperatorInventoryItem,
): OperatorInspectionItem => {
  const confidence = formatConfidence(item.confidenceScore);
  const freshness = item.freshnessLabel ?? 'unknown';

  return {
    name:
      item.itemName ??
      item.detectedFruitKo ??
      item.detectedFruit ??
      '나눔 식재료',
    postId: String(item.postId),
    labelCode: item.labelCode ?? undefined,
    storageZone: getStorageZoneLabel(item.storageZone),
    ai: confidence ? `${freshness}, ${confidence}` : String(freshness),
    recommendedUntil: formatOperatorDateTime(
      item.storageDeadlineAt ?? item.expirationDate ?? item.updatedAt,
    ),
    status: mapOperatorItemStatus(item.status),
  };
};
