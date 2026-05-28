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
  isOperator?: boolean | null;
  operatorRole?: 'operator' | 'admin' | 'fridge_operator' | null;
  operatorFridgeIds?: number[] | null;
  roles?: string[] | null;
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

export interface UserProfileUpdateRequest {
  nickname?: string;
  profileImageUrl?: string | null;
}
