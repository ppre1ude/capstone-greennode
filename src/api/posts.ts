/**
 * Posts API 함수
 * @see docs/API_INTEGRATION_CONTRACT.md § 4.4~4.9
 */
import apiClient, { BASE_URL } from './client';
import { createApiError } from './errors';
import { postMultipart } from './multipart';
import type {
  ApiResponse,
  Post,
  PostNearbyRead,
  GenerateResult,
  PostCreateData,
  ShareRequestResult,
} from '@/types';
import { getToken } from '@/utils/storage';

const POSTS_PREFIX = '/api/v1/posts';

/**
 * AI + LLM 자동 생성 (미리보기) — POST /api/v1/posts/generate
 * ⚠️ multipart/form-data, snake_case 필드명
 */
export const generatePost = async (
  image: { uri: string; type: string; name: string },
  userHint?: string,
): Promise<ApiResponse<GenerateResult>> => {
  const formData = new FormData();
  formData.append('image', image as any);
  if (userHint) {
    formData.append('user_hint', userHint);
  }

  return postMultipart<GenerateResult>(`${POSTS_PREFIX}/generate`, formData);
};

/**
 * 나눔 식재료 등록 — POST /api/v1/posts
 * ⚠️ 이미지 파일 전송 없음! imageToken만 JSON에 포함
 */
export const createPost = async (
  data: PostCreateData,
): Promise<ApiResponse<Post[]>> => {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}${POSTS_PREFIX}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(JSON.stringify(data))}`,
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw createApiError(response.status, responseData);
  }
  return responseData;
};

/** 근처 나눔 식재료 조회 — GET /api/v1/posts/nearby */
export const getNearbyPosts = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2.0,
  skip: number = 0,
  limit: number = 50,
  q?: string,
): Promise<ApiResponse<PostNearbyRead[]>> => {
  const trimmedQuery = q?.trim();
  const response = await apiClient.get(`${POSTS_PREFIX}/nearby`, {
    params: {
      latitude,
      longitude,
      radius_km: radiusKm,
      skip,
      limit,
      ...(trimmedQuery ? { q: trimmedQuery } : {}),
    },
  });
  return response.data;
};

/** 나눔 식재료 상세 조회 — GET /api/v1/posts/{id} */
export const getPostDetail = async (
  postId: number,
): Promise<ApiResponse<Post>> => {
  const response = await apiClient.get(`${POSTS_PREFIX}/${postId}`);
  return response.data;
};

/** 나눔 신청하기 — POST /api/v1/posts/{id}/requests */
export const requestShare = async (
  postId: number,
): Promise<ApiResponse<ShareRequestResult>> => {
  const response = await apiClient.post(`${POSTS_PREFIX}/${postId}/requests`);
  return response.data;
};

export const cancelPost = async (
  postId: number,
): Promise<ApiResponse<Post>> => {
  const response = await apiClient.post(`${POSTS_PREFIX}/${postId}/cancel`);
  return response.data;
};

export const cancelShareRequest = async (
  requestId: number,
): Promise<ApiResponse<ShareRequestResult>> => {
  const response = await apiClient.post(
    `/api/v1/users/me/share-requests/${requestId}/cancel`,
  );
  return response.data;
};

/** 나눔 식재료 삭제 — DELETE /api/v1/posts/{id} */
export const deletePost = async (
  postId: number,
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete(`${POSTS_PREFIX}/${postId}`);
  return response.data;
};

/** 이미지 URL 헬퍼: 상대경로 → 절대경로 */
export const getImageUrl = (relativeUrl: string): string => {
  return `${BASE_URL}${relativeUrl}`;
};
