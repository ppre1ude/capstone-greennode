import {
  INVENTORY_HOLD_DURATION_MS,
  createInventoryHoldExpiresAt,
  formatInventoryHoldRemaining,
  getInventoryHoldRemainingMs,
  isInventoryHoldExpired,
} from '@/features/inventory';

describe('inventory hold policy', () => {
  const heldAt = new Date('2026-05-19T00:00:00.000Z');

  it('creates a 30 minute hold expiry from the hold start time', () => {
    const expiresAt = createInventoryHoldExpiresAt(heldAt);

    expect(INVENTORY_HOLD_DURATION_MS).toBe(30 * 60 * 1000);
    expect(expiresAt.getTime()).toBe(
      heldAt.getTime() + INVENTORY_HOLD_DURATION_MS,
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
