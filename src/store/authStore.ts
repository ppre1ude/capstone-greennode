/**
 * Auth 전역 상태 관리 (Zustand)
 */
import {create} from 'zustand';
import type {User} from '@/types';
import {saveToken, getToken, removeToken} from '@/utils/storage';
import {getMe} from '@/api/auth';

interface AuthState {
  /** JWT 토큰 */
  token: string | null;
  /** 로그인된 유저 정보 */
  user: User | null;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 로그인 상태 */
  isLoggedIn: boolean;
  /** 위치 등록 완료 여부 */
  hasLocation: boolean;

  /** 토큰 설정 + AsyncStorage 저장 */
  setToken: (token: string) => Promise<void>;
  /** 유저 정보 설정 */
  setUser: (user: User) => void;
  /** 로그아웃 */
  logout: () => Promise<void>;
  /** 앱 시작 시 토큰 체크 + 유저 정보 복원 */
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isLoggedIn: false,
  hasLocation: false,

  setToken: async (token: string) => {
    await saveToken(token);
    set({token, isLoggedIn: true});
  },

  setUser: (user: User) => {
    set({
      user,
      hasLocation: user.latitude !== null && user.longitude !== null,
    });
  },

  logout: async () => {
    await removeToken();
    set({
      token: null,
      user: null,
      isLoggedIn: false,
      hasLocation: false,
    });
  },

  checkAuth: async () => {
    set({isLoading: true});
    try {
      const token = await getToken();
      if (!token) {
        set({isLoading: false, isLoggedIn: false});
        return;
      }

      set({token, isLoggedIn: true});

      // 토큰 유효성 검증 + 유저 정보 복원
      const response = await getMe();
      if (response.success && response.data) {
        const user = response.data;
        set({
          user,
          hasLocation: user.latitude !== null && user.longitude !== null,
          isLoading: false,
        });
      } else {
        // 토큰 무효 → 로그아웃 처리
        await get().logout();
        set({isLoading: false});
      }
    } catch {
      // 네트워크 에러 등 → 로그아웃 처리
      await get().logout();
      set({isLoading: false});
    }
  },
}));
