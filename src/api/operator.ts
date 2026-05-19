import apiClient from './client';
import type {ApiResponse, Post} from '@/types';

const OPERATOR_PREFIX = '/api/v1/operator';

export type DisposeOperatorItemResult = {
  post?: Post;
  postId?: number;
  status?: 'disposed';
  disposedAt?: string;
};

export const disposeOperatorItem = async (
  postId: number,
): Promise<ApiResponse<DisposeOperatorItemResult>> => {
  const response = await apiClient.patch(
    `${OPERATOR_PREFIX}/items/${postId}/dispose`,
  );
  return response.data;
};
