/**
 * Posts API 함수
 * @see FRONTEND_INTEGRATION_GUIDE.md § 4.4~4.8
 */
import apiClient, {BASE_URL} from './client';
import type {ApiResponse, Post, GenerateResult, PostCreateData} from '@/types';

const POSTS_PREFIX = '/api/v1/posts';

/**
 * AI + LLM 자동 생성 (미리보기) — POST /api/v1/posts/generate
 * ⚠️ multipart/form-data, snake_case 필드명
 */
export const generatePost = async (
  image: {uri: string; type: string; name: string},
  foodName: string,
  userHint?: string,
): Promise<ApiResponse<GenerateResult>> => {
  const formData = new FormData();
  formData.append('image', image as any);
  formData.append('food_name', foodName);
  if (userHint) {
    formData.append('user_hint', userHint);
  }

  const response = await apiClient.post(`${POSTS_PREFIX}/generate`, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return response.data;
};

/**
 * 게시글 등록 — POST /api/v1/posts
 * ⚠️ 이미지 파일 전송 없음! imageToken만 JSON에 포함
 */
export const createPost = async (
  data: PostCreateData,
): Promise<ApiResponse<Post>> => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));

  const response = await apiClient.post(POSTS_PREFIX, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return response.data;
};

/** 근처 게시글 조회 — GET /api/v1/posts/nearby */
export const getNearbyPosts = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2.0,
  skip: number = 0,
  limit: number = 50,
): Promise<ApiResponse<Post[]>> => {
  const response = await apiClient.get(`${POSTS_PREFIX}/nearby`, {
    params: {latitude, longitude, radius_km: radiusKm, skip, limit},
  });
  return response.data;
};

/** 게시글 상세 조회 — GET /api/v1/posts/{id} */
export const getPostDetail = async (
  postId: number,
): Promise<ApiResponse<Post>> => {
  const response = await apiClient.get(`${POSTS_PREFIX}/${postId}`);
  return response.data;
};

/** 게시글 삭제 — DELETE /api/v1/posts/{id} */
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
