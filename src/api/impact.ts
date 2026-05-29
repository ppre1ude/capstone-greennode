import apiClient from './client';
import type { ApiResponse, ImpactSummary, ImpactSummaryPeriod } from '@/types';

const IMPACT_SUMMARY_PATH = '/api/v1/users/me/impact/summary';

export const getImpactSummary = async (
  period: ImpactSummaryPeriod = 'month',
): Promise<ApiResponse<ImpactSummary>> => {
  const response = await apiClient.get(IMPACT_SUMMARY_PATH, {
    params: { period },
  });
  return response.data;
};
