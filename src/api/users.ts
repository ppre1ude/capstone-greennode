import apiClient from './client';
import type {
  ApiResponse,
  Post,
  UserPostStatusFilter,
  UserShareRequestItem,
  UserShareRequestStatusFilter,
} from '@/types';

const USERS_PREFIX = '/api/v1/users';

const normalizeStatusParam = (statuses?: string[]) =>
  statuses?.filter(status => status !== 'all').join(',') || undefined;

export const getMyPosts = async (
  statuses?: UserPostStatusFilter[],
  skip: number = 0,
  limit: number = 20,
): Promise<ApiResponse<Post[]>> => {
  const response = await apiClient.get(`${USERS_PREFIX}/me/posts`, {
    params: {
      status: normalizeStatusParam(statuses),
      skip,
      limit,
    },
  });
  return response.data;
};

export const getMyShareRequests = async (
  statuses?: UserShareRequestStatusFilter[],
  skip: number = 0,
  limit: number = 20,
): Promise<ApiResponse<UserShareRequestItem[]>> => {
  const response = await apiClient.get(`${USERS_PREFIX}/me/share-requests`, {
    params: {
      status: normalizeStatusParam(statuses),
      skip,
      limit,
    },
  });
  return response.data;
};
