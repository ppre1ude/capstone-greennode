import {
  canDisposeOperatorItem,
  deriveBasketStatus,
  formatOperatorDateTime,
  getOperatorItemStatusLabel,
  getOperatorItemStatusTone,
  getStorageZoneLabel,
  mapOperatorInventoryItem,
  mapOperatorItemStatus,
} from '@/utils/fridgeOperatorInventory';

describe('fridge operator inventory helpers', () => {
  it('marks a basket as review-required when any item needs field review', () => {
    expect(
      deriveBasketStatus([
        { status: 'available' },
        { status: 'needsReview' },
        { status: 'available' },
      ]),
    ).toEqual({
      label: '3개 중 1개 확인 필요',
      tone: 'warning',
    });
  });

  it('marks a basket as requested only when every item is requested', () => {
    expect(
      deriveBasketStatus([{ status: 'requested' }, { status: 'requested' }]),
    ).toEqual({
      label: '2개 모두 신청 접수',
      tone: 'info',
    });
  });

  it('treats discard candidates as the highest-priority operator action', () => {
    expect(
      deriveBasketStatus([
        { status: 'available' },
        { status: 'discardCandidate' },
      ]),
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

  it('maps operator-only statuses to user-facing labels', () => {
    expect(getOperatorItemStatusLabel('available')).toBe('신청 가능');
    expect(getOperatorItemStatusLabel('discardCandidate')).toBe('폐기 후보');
    expect(getOperatorItemStatusLabel('discarded')).toBe('폐기 완료');
    expect(getOperatorItemStatusLabel('missing')).toBe('분실 확인');
  });

  it('normalizes backend inventory statuses into operator inspection statuses', () => {
    expect(mapOperatorItemStatus('expired')).toBe('discardCandidate');
    expect(mapOperatorItemStatus('disposed')).toBe('discarded');
    expect(mapOperatorItemStatus('needs_review')).toBe('needsReview');
    expect(mapOperatorItemStatus('available')).toBe('available');
    expect(mapOperatorItemStatus('requested')).toBe('requested');
  });

  it('allows disposal only for inventory that can still be operator-handled', () => {
    expect(canDisposeOperatorItem('available')).toBe(true);
    expect(canDisposeOperatorItem('discardCandidate')).toBe(true);
    expect(canDisposeOperatorItem('requested')).toBe(false);
    expect(canDisposeOperatorItem('discarded')).toBe(false);
  });

  it('keeps operator inventory display mapping outside the screen', () => {
    expect(getStorageZoneLabel('ETHYLENE_SEPARATED')).toBe('에틸렌 분리 구역');
    expect(formatOperatorDateTime(null)).toBe('-');
    expect(formatOperatorDateTime('not-a-date')).toBe('not-a-date');

    expect(
      mapOperatorInventoryItem({
        postId: 11,
        detectedFruitKo: '사과',
        status: 'expired',
        freshnessLabel: 'Mid',
        confidenceScore: 72,
        storageZone: 'ETHYLENE_SEPARATED',
        storageDeadlineAt: 'not-a-date',
      }),
    ).toEqual({
      name: '사과',
      postId: '11',
      labelCode: undefined,
      storageZone: '에틸렌 분리 구역',
      ai: 'Mid',
      recommendedUntil: 'not-a-date',
      status: 'discardCandidate',
    });
  });
});
