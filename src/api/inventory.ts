import apiClient from './client';
import type {ApiResponse, PostStatus, PostStorageZone} from '@/types';

const INVENTORY_PREFIX = '/api/v1/inventory';

export type ConfirmStoreRequest = {
  postId: number;
  fridgePublicCode: string;
};

export type ConfirmStoreResult = {
  postId: number;
  status: Extract<PostStatus, 'available'>;
  labelCode: string;
  storageZone: PostStorageZone;
  storageDeadlineAt: string;
  storedAt: string;
};

export type ConfirmPickupRequest = {
  postId: number;
  fridgePublicCode: string;
};

export type ConfirmPickupResult = {
  postId: number;
  status: Extract<PostStatus, 'completed'>;
  labelCode?: string | null;
  storageZone?: PostStorageZone | string | null;
  pickedUpAt: string;
};

export const confirmStore = async (
  data: ConfirmStoreRequest,
): Promise<ApiResponse<ConfirmStoreResult>> => {
  const response = await apiClient.post(`${INVENTORY_PREFIX}/confirm-store`, data);
  return response.data;
};

export const confirmPickup = async (
  data: ConfirmPickupRequest,
): Promise<ApiResponse<ConfirmPickupResult>> => {
  const response = await apiClient.post(
    `${INVENTORY_PREFIX}/confirm-pickup`,
    data,
  );
  return response.data;
};
