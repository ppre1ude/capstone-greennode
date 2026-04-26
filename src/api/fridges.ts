/**
 * Fridges API 함수
 * @see FRONTEND_INTEGRATION_GUIDE.md § 4.9~4.10
 */
import apiClient from './client';
import type {ApiResponse, Fridge} from '@/types';

const FRIDGES_PREFIX = '/api/v1/fridges';

/** 근처 냉장고 조회 — GET /api/v1/fridges/nearby */
export const getNearbyFridges = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2.0,
): Promise<ApiResponse<Fridge[]>> => {
  const response = await apiClient.get(`${FRIDGES_PREFIX}/nearby`, {
    params: {latitude, longitude, radius_km: radiusKm},
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
    params: {latitude, longitude, radius_km: radiusKm},
  });
  return response.data;
};
