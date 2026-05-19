import {
  formatStorageDeadlineLabel,
  getStorageZoneLabel,
  resolveStoragePolicy,
} from '@/features/inventory';

describe('inventory storage policy', () => {
  const storedAt = new Date(2026, 4, 19, 9, 0, 0);

  it('maps apples to the ethylene separated zone with conservative deadlines', () => {
    const policy = resolveStoragePolicy({
      itemName: '사과',
      quality: 'Mid',
      storedAt,
    });

    expect(policy).toMatchObject({
      ruleKey: 'apple',
      zone: 'ETHYLENE_SEPARATED',
      zoneLabel: '에틸렌 분리 구역',
      serviceExposureDays: 15,
      needsReview: false,
    });
    expect(policy.deadlineLabel).toBe('06-03 09:00');
  });

  it('keeps tomatoes in the general zone and uses backend Fresh/Mid days', () => {
    const policy = resolveStoragePolicy({
      itemName: '방울 토마토',
      quality: 'Fresh',
      storedAt,
    });

    expect(policy).toMatchObject({
      ruleKey: 'tomato',
      zone: 'GENERAL',
      zoneLabel: '일반 구역',
      serviceExposureDays: 23,
      needsReview: false,
    });
    expect(policy.deadlineLabel).toBe('06-11 09:00');
  });

  it('maps bananas to the backend 3 day storage policy', () => {
    const policy = resolveStoragePolicy({
      itemName: '바나나',
      quality: 'Fresh',
      storedAt,
    });

    expect(policy).toMatchObject({
      ruleKey: 'banana',
      zone: 'GENERAL',
      serviceExposureDays: 3,
      deadlineLabel: '05-22 09:00',
      needsReview: false,
    });
  });

  it('falls back to a short review-required policy for unknown items', () => {
    const policy = resolveStoragePolicy({
      itemName: '청경채',
      storedAt,
    });

    expect(policy).toMatchObject({
      ruleKey: 'default',
      zone: 'GENERAL',
      serviceExposureDays: 3,
      needsReview: true,
    });
  });

  it('formats labels and zone names without safety guarantee language', () => {
    expect(getStorageZoneLabel('GENERAL')).toBe('일반 구역');
    expect(formatStorageDeadlineLabel(new Date(2026, 4, 19, 18, 5))).toBe(
      '05-19 18:05',
    );
    expect(formatStorageDeadlineLabel(null)).toBe('운영자 확인 필요');
  });
});
