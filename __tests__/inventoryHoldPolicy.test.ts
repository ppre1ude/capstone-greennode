import {
  INVENTORY_HOLD_DURATION_MS,
  PENDING_STORE_TIMEOUT_MS,
  REQUEST_HOLD_DURATION_MS,
  createInventoryHoldExpiresAt,
  createPendingStoreExpiresAt,
  createRequestHoldExpiresAt,
  formatInventoryHoldRemaining,
  getInventoryHoldRemainingMs,
  isInventoryHoldExpired,
  parseServerLifecycleTimestampMs,
} from '@/features/inventory';

describe('inventory hold policy', () => {
  const heldAt = new Date('2026-05-19T00:00:00.000Z');

  it('keeps request holds at 30 minutes for pickup countdowns', () => {
    const expiresAt = createInventoryHoldExpiresAt(heldAt);
    const requestExpiresAt = createRequestHoldExpiresAt(heldAt);

    expect(INVENTORY_HOLD_DURATION_MS).toBe(30 * 60 * 1000);
    expect(REQUEST_HOLD_DURATION_MS).toBe(30 * 60 * 1000);
    expect(expiresAt.getTime()).toBe(
      heldAt.getTime() + REQUEST_HOLD_DURATION_MS,
    );
    expect(requestExpiresAt.getTime()).toBe(expiresAt.getTime());
  });

  it('creates a 10 minute pending-store expiry for QR intake', () => {
    const expiresAt = createPendingStoreExpiresAt(heldAt);

    expect(PENDING_STORE_TIMEOUT_MS).toBe(10 * 60 * 1000);
    expect(expiresAt.getTime()).toBe(
      heldAt.getTime() + PENDING_STORE_TIMEOUT_MS,
    );
  });

  it('calculates remaining hold time and clamps expired holds to zero', () => {
    const expiresAt = createInventoryHoldExpiresAt(heldAt);

    expect(
      getInventoryHoldRemainingMs(
        expiresAt,
        new Date('2026-05-19T00:10:00.000Z'),
      ),
    ).toBe(20 * 60 * 1000);
    expect(
      getInventoryHoldRemainingMs(
        expiresAt,
        new Date('2026-05-19T00:30:01.000Z'),
      ),
    ).toBe(0);
  });

  it('treats timezone-less backend hold timestamps as UTC', () => {
    expect(
      getInventoryHoldRemainingMs(
        '2026-05-28T11:38:21.707849',
        '2026-05-28T11:08:21.707Z',
      ),
    ).toBe(30 * 60 * 1000);

    expect(
      isInventoryHoldExpired(
        '2026-05-28T11:38:21.707849',
        '2026-05-28T11:08:21.707Z',
      ),
    ).toBe(false);
  });

  it('keeps whitespace-padded backend timestamps invalid as received', () => {
    expect(
      parseServerLifecycleTimestampMs(' 2026-05-28T11:38:21.707849 '),
    ).toBeNaN();
  });

  it('parses explicit offset backend timestamps as their UTC instant', () => {
    expect(
      parseServerLifecycleTimestampMs('2026-05-28T20:38:21.707849+09:00'),
    ).toBe(
      parseServerLifecycleTimestampMs('2026-05-28T11:38:21.707849Z'),
    );
  });

  it('parses leap-day lifecycle timestamps with the target year calendar', () => {
    expect(parseServerLifecycleTimestampMs('2024-02-29T00:00:00Z')).toBe(
      Date.UTC(2024, 1, 29),
    );
    expect(parseServerLifecycleTimestampMs('2023-02-29T00:00:00Z')).toBeNaN();
  });

  it.each([
    '2026-05-28 11:38:21.707849Z',
    '2026-05-28t11:38:21.707849z',
  ])('rejects JS Date lenient timestamp string %s', value => {
    expect(parseServerLifecycleTimestampMs(value)).toBeNaN();
  });

  it('rejects date-only lifecycle timestamp strings', () => {
    expect(parseServerLifecycleTimestampMs('2026-05-28')).toBeNaN();
  });

  it.each([
    '2026-02-30T11:38:21Z',
    '2026-05-28T24:00Z',
    '2026-05-28T11:60Z',
    '2026-05-28T11:38:60Z',
    '2026-05-28T11:38+09:60',
  ])('rejects impossible lifecycle timestamp %s', value => {
    expect(parseServerLifecycleTimestampMs(value)).toBeNaN();
  });

  it('treats the exact expiry time as expired', () => {
    const expiresAt = createInventoryHoldExpiresAt(heldAt);

    expect(
      isInventoryHoldExpired(expiresAt, new Date('2026-05-19T00:29:59.999Z')),
    ).toBe(false);
    expect(
      isInventoryHoldExpired(expiresAt, new Date('2026-05-19T00:30:00.000Z')),
    ).toBe(true);
  });

  it('formats remaining hold time as MM:SS', () => {
    expect(formatInventoryHoldRemaining(INVENTORY_HOLD_DURATION_MS)).toBe(
      '30:00',
    );
    expect(formatInventoryHoldRemaining(65 * 1000)).toBe('01:05');
    expect(formatInventoryHoldRemaining(999)).toBe('00:01');
    expect(formatInventoryHoldRemaining(-1)).toBe('00:00');
  });
});
