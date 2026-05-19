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
