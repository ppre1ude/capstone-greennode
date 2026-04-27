/**
 * 백엔드 API 공통 응답 타입
 * @see docs/FRONTEND_INTEGRATION_GUIDE.md § 2. API 기본 규칙
 */

/** 모든 API 응답의 공통 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
