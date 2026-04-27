/**
 * Auth API 함수
 * @see FRONTEND_INTEGRATION_GUIDE.md § 4.1~4.3
 */
import apiClient from './client';
import type {ApiResponse, User, LoginResponse, SignupRequest, LocationUpdateRequest} from '@/types';

const AUTH_PREFIX = '/api/v1/auth';

/** 회원가입 — POST /api/v1/auth/signup */
export const signup = async (data: SignupRequest): Promise<ApiResponse<User>> => {
  const response = await apiClient.post(`${AUTH_PREFIX}/signup`, data);
  return response.data;
};

/**
 * 로그인 — POST /api/v1/auth/login
 * ⚠️ Content-Type: application/x-www-form-urlencoded (JSON 아님!)
 * ⚠️ 필드명: username (email 아님!)
 */
export const login = async (
  email: string,
  password: string,
): Promise<ApiResponse<LoginResponse>> => {
  const formBody = new URLSearchParams();
  formBody.append('username', email);
  formBody.append('password', password);

  const response = await apiClient.post(`${AUTH_PREFIX}/login`, formBody.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

/** 내 정보 조회 — GET /api/v1/auth/me */
export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await apiClient.get(`${AUTH_PREFIX}/me`);
  return response.data;
};

/** 위치 + FCM 토큰 갱신 — PUT /api/v1/auth/me/location */
export const updateLocation = async (
  data: LocationUpdateRequest,
): Promise<ApiResponse<User>> => {
  const response = await apiClient.put(`${AUTH_PREFIX}/me/location`, data);
  return response.data;
};
