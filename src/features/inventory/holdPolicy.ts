export const PENDING_STORE_TIMEOUT_MS = 10 * 60 * 1000;
export const REQUEST_HOLD_DURATION_MS = 30 * 60 * 1000;
export const INVENTORY_HOLD_DURATION_MS = REQUEST_HOLD_DURATION_MS;

export type InventoryDateInput = Date | number | string;

const SERVER_LIFECYCLE_ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?$/;

const getUtcTimestampMs = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
): number => {
  const date = new Date(
    Date.UTC(0, month - 1, day, hour, minute, second, millisecond),
  );
  date.setUTCFullYear(year);
  return date.getTime();
};

const getDaysInMonth = (year: number, month: number): number =>
  new Date(getUtcTimestampMs(year, month + 1, 0, 0, 0, 0, 0)).getUTCDate();

const isValidDateTime = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): boolean =>
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= getDaysInMonth(year, month) &&
  hour >= 0 &&
  hour <= 23 &&
  minute >= 0 &&
  minute <= 59 &&
  second >= 0 &&
  second <= 59;

const getMillisecondsFromFraction = (fraction?: string): number => {
  if (!fraction) {
    return 0;
  }

  return Number(fraction.slice(0, 3).padEnd(3, '0'));
};

const getOffsetMs = (timezone?: string): number | null => {
  if (!timezone || timezone === 'Z') {
    return 0;
  }

  const match = /^([+-])(\d{2}):(\d{2})$/.exec(timezone);
  if (!match) {
    return null;
  }

  const [, sign, hoursValue, minutesValue] = match;
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const offsetMs = (hours * 60 + minutes) * 60 * 1000;
  return sign === '+' ? offsetMs : -offsetMs;
};

export const parseServerLifecycleTimestampMs = (value: string): number => {
  const match = SERVER_LIFECYCLE_ISO_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    return Number.NaN;
  }

  const [
    ,
    yearValue,
    monthValue,
    dayValue,
    hourValue,
    minuteValue,
    secondValue = '0',
    fraction,
    timezone,
  ] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);

  if (!isValidDateTime(year, month, day, hour, minute, second)) {
    return Number.NaN;
  }

  const offsetMs = getOffsetMs(timezone);
  if (offsetMs === null) {
    return Number.NaN;
  }

  return (
    getUtcTimestampMs(
      year,
      month,
      day,
      hour,
      minute,
      second,
      getMillisecondsFromFraction(fraction),
    ) - offsetMs
  );
};

const toTimestampMs = (value: InventoryDateInput): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    return parseServerLifecycleTimestampMs(value);
  }

  return value;
};

export const createPendingStoreExpiresAt = (
  heldAt: InventoryDateInput,
): Date => new Date(toTimestampMs(heldAt) + PENDING_STORE_TIMEOUT_MS);

export const createRequestHoldExpiresAt = (
  heldAt: InventoryDateInput,
): Date => new Date(toTimestampMs(heldAt) + REQUEST_HOLD_DURATION_MS);

export const createInventoryHoldExpiresAt = createRequestHoldExpiresAt;

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
