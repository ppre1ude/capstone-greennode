import apiClient from './client';
import type { ApiResponse } from '@/types';
import type {
  ShareReportAction,
  ShareReportReasonId,
  ShareReportResolution,
  ShareReportStatus,
} from '@/features/trust/report';
import type {
  ShareReviewIssueTagId,
  ShareReviewPositiveTagId,
} from '@/features/trust/review';

const SHARE_REQUESTS_PREFIX = '/api/v1/share-requests';
const USERS_PREFIX = '/api/v1/users';

export type ShareReview = {
  id: number;
  requestId: number;
  postId: number;
  providerId: number;
  requesterId: number;
  positiveTagIds: ShareReviewPositiveTagId[];
  issueTagIds: ShareReviewIssueTagId[];
  createdAt: string;
  updatedAt: string;
};

export type ShareReport = {
  id: number;
  requestId: number;
  postId: number;
  providerId: number;
  requesterId: number;
  reasonId: ShareReportReasonId;
  status: ShareReportStatus;
  resolution: ShareReportResolution;
  action: ShareReportAction;
  createdAt: string;
  updatedAt: string;
};

export type ProviderTrustBadgeId =
  | 'store_qr_verified'
  | 'completed_pickup'
  | 'positive_reviews'
  | string;

export type ProviderTrustSummaryResponse = {
  userId: number;
  completedShares: number;
  positiveReviewCount: number;
  matchedPhotoCount?: number;
  easyToFindCount?: number;
  badges: ProviderTrustBadgeId[];
  computedAt: string;
};

export type CreateShareReviewRequest = {
  positiveTagIds: ShareReviewPositiveTagId[];
  issueTagIds: ShareReviewIssueTagId[];
};

export type CreateShareReportRequest = {
  reasonId: ShareReportReasonId;
};

export const createShareReview = async (
  requestId: number,
  data: CreateShareReviewRequest,
): Promise<ApiResponse<ShareReview>> => {
  const response = await apiClient.post(
    `${SHARE_REQUESTS_PREFIX}/${requestId}/review`,
    data,
  );
  return response.data;
};

export const createShareReport = async (
  requestId: number,
  data: CreateShareReportRequest,
): Promise<ApiResponse<ShareReport>> => {
  const response = await apiClient.post(
    `${SHARE_REQUESTS_PREFIX}/${requestId}/report`,
    data,
  );
  return response.data;
};

export const getUserTrustSummary = async (
  userId: number,
): Promise<ApiResponse<ProviderTrustSummaryResponse>> => {
  const response = await apiClient.get(`${USERS_PREFIX}/${userId}/trust-summary`);
  return response.data;
};
