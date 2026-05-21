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
  const requestedCount = items.filter(item => item.status === 'requested').length;

  if (total === 0) {
    return {label: '항목 없음', tone: 'warning' as const};
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
