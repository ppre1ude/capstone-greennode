export const INVENTORY_HOLD_DURATION_MS = 30 * 60 * 1000;

export type InventoryDateInput = Date | number | string;

const toTimestampMs = (value: InventoryDateInput): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    return new Date(value).getTime();
  }

  return value;
};

export const createInventoryHoldExpiresAt = (
  heldAt: InventoryDateInput,
): Date => new Date(toTimestampMs(heldAt) + INVENTORY_HOLD_DURATION_MS);

export const getInventoryHoldRemainingMs = (
  expiresAt: InventoryDateInput,
  now: InventoryDateInput = Date.now(),
): number => Math.max(0, toTimestampMs(expiresAt) - toTimestampMs(now));

export const isInventoryHoldExpired = (
  expiresAt: InventoryDateInput,
  now: InventoryDateInput = Date.now(),
): boolean => toTimestampMs(now) >= toTimestampMs(expiresAt);

export const formatInventoryHoldRemaining = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
};
