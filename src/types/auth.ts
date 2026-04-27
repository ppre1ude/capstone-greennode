/**
 * Auth 관련 타입 정의
 */

export interface User {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  fcmToken: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export interface SignupRequest {
  email: string;
  nickname: string;
  password: string;
}

export interface LocationUpdateRequest {
  fcmToken?: string;
  latitude: number;
  longitude: number;
}
