/**
 * AsyncStorage 래퍼 유틸리티
 * JWT 토큰 저장/조회/삭제를 위한 헬퍼 함수
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@foodlink/access_token',
  HAS_ONBOARDED: '@foodlink/has_onboarded',
} as const;

/** JWT 토큰 저장 */
export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
};

/** JWT 토큰 조회 */
export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
};

/** JWT 토큰 삭제 (로그아웃 시) */
export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.ACCESS_TOKEN);
};

/** 온보딩 완료 여부 저장 */
export const setOnboarded = async (): Promise<void> => {
  await AsyncStorage.setItem(KEYS.HAS_ONBOARDED, 'true');
};

/** 온보딩 완료 여부 확인 */
export const hasOnboarded = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
  return value === 'true';
};

/** 전체 초기화 (로그아웃 + 데이터 삭제) */
export const clearAll = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.ACCESS_TOKEN);
};
