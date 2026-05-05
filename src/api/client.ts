/**
 * Axios API 클라이언트 인스턴스
 *
 * - Base URL: Android 에뮬레이터 기준 10.0.2.2:8080
 * - JWT Bearer Token 자동 주입
 * - 401 수신 시 토큰 삭제 (재로그인 유도)
 *
 * @see docs/API_INTEGRATION_CONTRACT.md § 1~2
 */
import axios, {InternalAxiosRequestConfig, AxiosError} from 'axios';
import {getToken, removeToken} from '@/utils/storage';
import {API_BASE_URL} from '@/config/api';
import {emitUnauthorized} from './authEvents';

const BASE_URL = API_BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

export {BASE_URL};
export default apiClient;
