import apiClient from './client';
import type {
  ApiResponse,
  ImpactSummary,
  ImpactSummaryPeriod,
  ServerImpactSummary,
} from '@/types';

const IMPACT_SUMMARY_PATH = '/api/v1/users/me/impact/summary';

const firstPresent = <T>(...values: Array<T | null | undefined>) =>
  values.find(value => value != null);

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error('Invalid impact summary number field');
};

const optionalNumber = (value: number | string | null | undefined) => {
  if (value == null) {
    return undefined;
  }
  return toNumber(value);
};

const toRequiredString = (value: string | null | undefined) => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  throw new Error('Invalid impact summary string field');
};

export const normalizeImpactSummary = (
  summary: ServerImpactSummary,
): ImpactSummary => {
  const totalShared = firstPresent(summary.totalShared, summary.total_shared);
  const totalReceived = firstPresent(
    summary.totalReceived,
    summary.total_received,
  );
  const normalized: ImpactSummary = {
    completedShares: toNumber(
      firstPresent(summary.completedShares, summary.completed_shares),
    ),
    estimatedFoodSavedGrams: toNumber(
      firstPresent(
        summary.estimatedFoodSavedGrams,
        summary.estimated_food_saved_grams,
      ),
    ),
    estimatedCarbonSavedGrams: toNumber(
      firstPresent(
        summary.estimatedCarbonSavedGrams,
        summary.estimated_carbon_saved_grams,
      ),
    ),
    calculationVersion: toRequiredString(
      firstPresent(summary.calculationVersion, summary.calculation_version),
    ),
    computedAt: toRequiredString(
      firstPresent(summary.computedAt, summary.computed_at),
    ),
  };

  const normalizedTotalShared = optionalNumber(totalShared);
  const normalizedTotalReceived = optionalNumber(totalReceived);

  if (normalizedTotalShared != null) {
    normalized.totalShared = normalizedTotalShared;
  }
  if (normalizedTotalReceived != null) {
    normalized.totalReceived = normalizedTotalReceived;
  }

  return normalized;
};

export const getImpactSummary = async (
  period: ImpactSummaryPeriod = 'month',
): Promise<ApiResponse<ImpactSummary>> => {
  const response = await apiClient.get(IMPACT_SUMMARY_PATH, {
    params: { period },
  });
  const payload = response.data as ApiResponse<ServerImpactSummary>;

  return {
    ...payload,
    data: payload.data ? normalizeImpactSummary(payload.data) : null,
  };
};
