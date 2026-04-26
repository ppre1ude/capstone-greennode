/**
 * Axios API 클라이언트 인스턴스
 *
 * - Base URL: Android 에뮬레이터 기준 10.0.2.2:8080
 * - JWT Bearer Token 자동 주입
 * - 401 수신 시 토큰 삭제 (재로그인 유도)
 *
 * @see FRONTEND_INTEGRATION_GUIDE.md § 1~2
 */
import axios, {InternalAxiosRequestConfig, AxiosError} from 'axios';
import {Platform} from 'react-native';
import {getToken, removeToken} from '@/utils/storage';

// ── Base URL 분기 ────────────────────────────────
// Android 에뮬레이터: 10.0.2.2 = host의 localhost
// iOS 시뮬레이터:     localhost 그대로 사용
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: JWT 토큰 자동 주입 ──────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// ── Response Interceptor: 에러 핸들링 ────────────
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // JWT 만료 → 토큰 삭제, 앱에서 재로그인 유도
      await removeToken();
      // TODO: Navigation reset to login (Phase 1에서 구현)
    }
    return Promise.reject(error);
  },
);

export {BASE_URL};
export default apiClient;
