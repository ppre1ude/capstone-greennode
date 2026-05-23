import apiClient from './client';
import type {
  ApiResponse,
  FreshnessLabel,
  Post,
  PostStatus,
  PostStorageZone,
} from '@/types';

const OPERATOR_PREFIX = '/api/v1/operator';

export type OperatorInventorySummary = {
  fridgeId?: number;
  fridgeName?: string;
  totalItems: number;
  availableItems: number;
  requestedItems: number;
  expiringSoonItems: number;
  expiredItems: number;
  needsReviewItems: number;
  ethyleneSeparatedItems?: number;
  disposedItems?: number;
  lastSyncedAt?: string | null;
};

export type OperatorInventoryItemStatus =
  | PostStatus
  | 'needs_review'
  | 'missing';

export type OperatorInventoryItem = {
  postId: number;
  labelCode?: string | null;
  itemName?: string | null;
  detectedFruitKo?: string | null;
  detectedFruit?: string | null;
  status: OperatorInventoryItemStatus;
  freshnessLabel?: FreshnessLabel | string | null;
  confidenceScore?: number | null;
  storageZone?: PostStorageZone | string | null;
  storageDeadlineAt?: string | null;
  expirationDate?: string | null;
  updatedAt?: string | null;
};

export type DisposeOperatorItemResult = {
  post?: Post;
  postId?: number;
  status?: PostStatus;
  disposedAt?: string | null;
};

type BackendOperatorInventorySummary = {
  fridgeId?: number;
  fridgeName?: string;
  total?: number;
  available?: number;
  requested?: number;
  expired?: number;
  disposedToday?: number;
};

type BackendOperatorInventoryItem = Partial<Post> &
  Partial<OperatorInventoryItem> & {
    id?: number;
  };

type ApiResponseLike<T> = ApiResponse<T> | T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  isRecord(value) && 'success' in value && 'data' in value;

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeApiResponse = <TRaw, TNormalized>(
  payload: ApiResponseLike<TRaw>,
  normalize: (data: TRaw) => TNormalized,
): ApiResponse<TNormalized> => {
  if (isApiResponse<TRaw>(payload)) {
    return {
      success: payload.success,
      message: payload.message,
      data: payload.data == null ? null : normalize(payload.data),
    };
  }

  return {
    success: true,
    message: 'ok',
    data: normalize(payload as TRaw),
  };
};

const normalizeOperatorSummary = (
  summary: BackendOperatorInventorySummary & Partial<OperatorInventorySummary>,
): OperatorInventorySummary => ({
  fridgeId: summary.fridgeId,
  fridgeName: summary.fridgeName,
  totalItems: toNumber(summary.totalItems ?? summary.total),
  availableItems: toNumber(summary.availableItems ?? summary.available),
  requestedItems: toNumber(summary.requestedItems ?? summary.requested),
  expiringSoonItems: toNumber(summary.expiringSoonItems),
  expiredItems: toNumber(summary.expiredItems ?? summary.expired),
  needsReviewItems: toNumber(summary.needsReviewItems),
  ethyleneSeparatedItems: toNumber(summary.ethyleneSeparatedItems),
  disposedItems: toNumber(summary.disposedItems ?? summary.disposedToday),
  lastSyncedAt: summary.lastSyncedAt ?? null,
});

const normalizeOperatorItem = (
  item: BackendOperatorInventoryItem,
): OperatorInventoryItem => {
  const postId = toNumber(item.postId ?? item.id);

  return {
    postId,
    labelCode: item.labelCode ?? null,
    itemName:
      item.itemName ?? item.detectedFruitKo ?? item.detectedFruit ?? null,
    detectedFruitKo: item.detectedFruitKo ?? null,
    detectedFruit: item.detectedFruit ?? null,
    status: (item.status ?? 'needs_review') as OperatorInventoryItemStatus,
    freshnessLabel: item.freshnessLabel ?? null,
    confidenceScore: item.confidenceScore ?? null,
    storageZone: item.storageZone ?? null,
    storageDeadlineAt: item.storageDeadlineAt ?? null,
    expirationDate: item.expirationDate ?? null,
    updatedAt: item.updatedAt ?? null,
  };
};

const normalizeDisposeResult = (
  data: BackendOperatorInventoryItem & DisposeOperatorItemResult,
): DisposeOperatorItemResult => {
  const post = data.post ?? (data.id ? (data as Post) : undefined);

  return {
    post,
    postId: data.postId ?? data.id ?? post?.id,
    status: data.status ?? post?.status,
    disposedAt: data.disposedAt ?? data.updatedAt ?? post?.updatedAt ?? null,
  };
};

export const disposeOperatorItem = async (
  postId: number,
): Promise<ApiResponse<DisposeOperatorItemResult>> => {
  const response = await apiClient.patch(
    `${OPERATOR_PREFIX}/items/${postId}/dispose`,
  );
  return normalizeApiResponse(response.data, normalizeDisposeResult);
};

export const getOperatorInventorySummary = async (
  fridgeId: number,
): Promise<ApiResponse<OperatorInventorySummary>> => {
  const response = await apiClient.get(
    `${OPERATOR_PREFIX}/fridges/${fridgeId}/inventory/summary`,
  );
  return normalizeApiResponse(response.data, normalizeOperatorSummary);
};

export const getOperatorInventoryItems = async (
  fridgeId: number,
): Promise<ApiResponse<OperatorInventoryItem[]>> => {
  const response = await apiClient.get(
    `${OPERATOR_PREFIX}/fridges/${fridgeId}/inventory/items`,
  );
  return normalizeApiResponse(response.data, items =>
    items.map(normalizeOperatorItem),
  );
};
