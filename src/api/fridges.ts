/**
 * Fridges API 함수
 * @see docs/API_INTEGRATION_CONTRACT.md § 4.9~4.10
 */
import apiClient from './client';
import type { ApiResponse, Fridge, PostNearbyRead, PostStatus } from '@/types';

const FRIDGES_PREFIX = '/api/v1/fridges';

/** 근처 냉장고 조회 — GET /api/v1/fridges/nearby */
export const getNearbyFridges = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2.0,
  q?: string,
  skip?: number,
  limit?: number,
): Promise<ApiResponse<Fridge[]>> => {
  const trimmedQuery = q?.trim();
  const params = {
    latitude,
    longitude,
    radius_km: radiusKm,
    ...(trimmedQuery ? { q: trimmedQuery } : {}),
    ...(skip != null ? { skip } : {}),
    ...(limit != null ? { limit } : {}),
  };
  const response = await apiClient.get(`${FRIDGES_PREFIX}/nearby`, {
    params,
  });
  return response.data;
};

/** 등록 가능 냉장고 — GET /api/v1/fridges/available */
export const getAvailableFridges = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2.0,
): Promise<ApiResponse<Fridge[]>> => {
  const response = await apiClient.get(`${FRIDGES_PREFIX}/available`, {
    params: { latitude, longitude, radius_km: radiusKm },
  });
  return response.data;
};

/** 냉장고 내부 나눔 식재료 조회 — GET /api/v1/fridges/{id}/posts */
export const getFridgePosts = async (
  fridgeId: number,
  status: PostStatus = 'available',
): Promise<ApiResponse<PostNearbyRead[]>> => {
  const response = await apiClient.get(`${FRIDGES_PREFIX}/${fridgeId}/posts`, {
    params: { status },
  });
  return response.data;
};
