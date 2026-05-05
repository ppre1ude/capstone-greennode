/**
 * Posts API 함수
 * @see FRONTEND_INTEGRATION_GUIDE.md § 4.4~4.8
 */
import apiClient, {BASE_URL} from './client';
import type {ApiResponse, Post, GenerateResult, PostCreateData} from '@/types';
import {getToken} from '@/utils/storage';

const POSTS_PREFIX = '/api/v1/posts';

/**
 * AI + LLM 자동 생성 (미리보기) — POST /api/v1/posts/generate
 * ⚠️ multipart/form-data, snake_case 필드명
 */
export const generatePost = async (
  image: {uri: string; type: string; name: string},
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
 * 게시글 등록 — POST /api/v1/posts
 * ⚠️ 이미지 파일 전송 없음! imageToken만 JSON에 포함
 */
export const createPost = async (
  data: PostCreateData,
): Promise<ApiResponse<Post>> => {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}${POSTS_PREFIX}`, {
    method: 'POST',
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
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

const createApiError = (status: number, data: unknown) => {
  const error = new Error(`Request failed with status code ${status}`) as Error & {
    response?: {status: number; data: unknown};
  };
  error.response = {status, data};
  return error;
};

const postMultipart = async <T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> =>
  new Promise(async (resolve, reject) => {
    const token = await getToken();
    const request = new XMLHttpRequest();

    request.open('POST', `${BASE_URL}${path}`);
    request.timeout = 30000;
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    request.onload = () => {
      try {
        const responseData = JSON.parse(request.responseText || '{}');
        if (request.status >= 200 && request.status < 300) {
          resolve(responseData);
          return;
        }
        reject(createApiError(request.status, responseData));
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = () => reject(new Error('Network Error'));
    request.ontimeout = () => reject(new Error('Request timed out'));
    request.send(formData);
  });
