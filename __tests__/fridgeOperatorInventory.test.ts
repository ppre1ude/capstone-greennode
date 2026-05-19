import {
  deriveBasketStatus,
  getOperatorItemStatusTone,
} from '@/utils/fridgeOperatorInventory';

describe('fridge operator inventory helpers', () => {
  it('marks a basket as review-required when any item needs field review', () => {
    expect(
      deriveBasketStatus([
        {status: 'available'},
        {status: 'needsReview'},
        {status: 'available'},
      ]),
    ).toEqual({
      label: '3개 중 1개 확인 필요',
      tone: 'warning',
    });
  });

  it('marks a basket as requested only when every item is requested', () => {
    expect(
      deriveBasketStatus([{status: 'requested'}, {status: 'requested'}]),
    ).toEqual({
      label: '2개 모두 신청 접수',
      tone: 'info',
    });
  });

  it('treats discard candidates as the highest-priority operator action', () => {
    expect(
      deriveBasketStatus([{status: 'available'}, {status: 'discardCandidate'}]),
    ).toEqual({
      label: '2개 중 1개 폐기 후보',
      tone: 'danger',
    });
  });

  it('maps operator-only statuses to display tones', () => {
    expect(getOperatorItemStatusTone('available')).toBe('good');
    expect(getOperatorItemStatusTone('requested')).toBe('info');
    expect(getOperatorItemStatusTone('needsReview')).toBe('warning');
    expect(getOperatorItemStatusTone('discardCandidate')).toBe('danger');
  });
});
