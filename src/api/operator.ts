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
  status?: 'disposed';
  disposedAt?: string;
};

export const disposeOperatorItem = async (
  postId: number,
): Promise<ApiResponse<DisposeOperatorItemResult>> => {
  const response = await apiClient.patch(
    `${OPERATOR_PREFIX}/items/${postId}/dispose`,
  );
  return response.data;
};

export const getOperatorInventorySummary = async (
  fridgeId: number,
): Promise<ApiResponse<OperatorInventorySummary>> => {
  const response = await apiClient.get(
    `${OPERATOR_PREFIX}/fridges/${fridgeId}/inventory/summary`,
  );
  return response.data;
};

export const getOperatorInventoryItems = async (
  fridgeId: number,
): Promise<ApiResponse<OperatorInventoryItem[]>> => {
  const response = await apiClient.get(
    `${OPERATOR_PREFIX}/fridges/${fridgeId}/inventory/items`,
  );
  return response.data;
};
