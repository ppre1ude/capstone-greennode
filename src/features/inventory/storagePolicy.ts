import type {InventoryDateInput} from './holdPolicy';

export type StorageZone = 'GENERAL' | 'ETHYLENE_SEPARATED';

export type StoragePolicyQuality =
  | 'Fresh'
  | 'Mid'
  | 'fresh'
  | 'mid'
  | 'best'
  | 'normal'
  | 'unknown';

export type StoragePolicyInput = {
  itemName: string;
  quality?: StoragePolicyQuality;
  storedAt: InventoryDateInput;
};

export type StoragePolicyResult = {
  itemName: string;
  ruleKey: 'apple' | 'tomato' | 'banana' | 'default';
  zone: StorageZone;
  zoneLabel: string;
  serviceExposureDays: number | null;
  serviceExposureUntilAt: Date | null;
  deadlineLabel: string;
  needsReview: boolean;
  guidance: string;
};

type StoragePolicyRule = {
  key: StoragePolicyResult['ruleKey'];
  keywords: string[];
  zone: StorageZone;
  exposureDaysByQuality: Record<'Fresh' | 'Mid', number>;
  fallbackQuality: 'Fresh' | 'Mid';
  needsReview?: boolean;
  guidance: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const STORAGE_ZONE_LABELS: Record<StorageZone, string> = {
  GENERAL: '일반 구역',
  ETHYLENE_SEPARATED: '에틸렌 분리 구역',
};

const STORAGE_POLICY_RULES: StoragePolicyRule[] = [
  {
    key: 'apple',
    keywords: ['사과', 'apple'],
    zone: 'ETHYLENE_SEPARATED',
    exposureDaysByQuality: {
      Fresh: 30,
      Mid: 15,
    },
    fallbackQuality: 'Mid',
    guidance:
      '에틸렌 발생량이 높은 품목이라 분리 구역 배치를 안내합니다.',
  },
  {
    key: 'tomato',
    keywords: ['토마토', 'tomato'],
    zone: 'GENERAL',
    exposureDaysByQuality: {
      Fresh: 23,
      Mid: 10,
    },
    fallbackQuality: 'Mid',
    guidance:
      '일반 구역에 배치하고 서버의 품질 판정에 따른 회수 기준을 씁니다.',
  },
  {
    key: 'banana',
    keywords: ['바나나', 'banana'],
    zone: 'GENERAL',
    exposureDaysByQuality: {
      Fresh: 3,
      Mid: 3,
    },
    fallbackQuality: 'Mid',
    guidance: '일반 구역에 배치하고 짧은 3일 회수 기준을 씁니다.',
  },
];

const normalizeItemName = (itemName: string): string =>
  itemName.trim().toLowerCase().replace(/\s+/g, '');

const normalizeQuality = (
  quality: StoragePolicyQuality,
): 'Fresh' | 'Mid' => {
  if (quality === 'Fresh' || quality === 'fresh' || quality === 'best') {
    return 'Fresh';
  }

  return 'Mid';
};

const toTimestampMs = (value: InventoryDateInput): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    return new Date(value).getTime();
  }

  return value;
};

const findStoragePolicyRule = (itemName: string): StoragePolicyRule => {
  const normalizedItemName = normalizeItemName(itemName);

  return (
    STORAGE_POLICY_RULES.find(rule =>
      rule.keywords.some(keyword =>
        normalizedItemName.includes(normalizeItemName(keyword)),
      ),
    ) ?? {
      key: 'default',
      keywords: [],
      zone: 'GENERAL',
      exposureDaysByQuality: {Fresh: 3, Mid: 3},
      fallbackQuality: 'Mid',
      needsReview: true,
      guidance:
        '품목별 정책이 아직 없어 운영자 확인이 필요한 기본 회수 기준을 씁니다.',
    }
  );
};

export const getStorageZoneLabel = (zone: StorageZone): string =>
  STORAGE_ZONE_LABELS[zone];

export const formatStorageDeadlineLabel = (date: Date | null): string => {
  if (!date) {
    return '운영자 확인 필요';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
};

export const resolveStoragePolicy = ({
  itemName,
  quality = 'unknown',
  storedAt,
}: StoragePolicyInput): StoragePolicyResult => {
  const rule = findStoragePolicyRule(itemName);
  const normalizedQuality =
    quality === 'unknown' ? rule.fallbackQuality : normalizeQuality(quality);
  const serviceExposureDays = rule.exposureDaysByQuality[normalizedQuality];
  const serviceExposureUntilAt = new Date(
    toTimestampMs(storedAt) + serviceExposureDays * DAY_MS,
  );

  return {
    itemName,
    ruleKey: rule.key,
    zone: rule.zone,
    zoneLabel: getStorageZoneLabel(rule.zone),
    serviceExposureDays,
    serviceExposureUntilAt,
    deadlineLabel: formatStorageDeadlineLabel(serviceExposureUntilAt),
    needsReview: Boolean(rule.needsReview),
    guidance: rule.guidance,
  };
};
