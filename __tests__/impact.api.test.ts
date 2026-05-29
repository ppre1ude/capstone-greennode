import apiClient from '@/api/client';
import { getImpactSummary, normalizeImpactSummary } from '@/api/impact';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('impact API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the current user impact summary for the requested period', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: '환경 지표를 조회했습니다.',
        data: {
          totalShared: 5,
          totalReceived: 3,
          completedShares: 8,
          estimatedFoodSavedGrams: 1360,
          estimatedCarbonSavedGrams: 3400,
          calculationVersion: 'impact-v1',
          computedAt: '2026-05-29T00:00:00Z',
        },
      },
    });

    const response = await getImpactSummary('month');

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/users/me/impact/summary',
      {
        params: { period: 'month' },
      },
    );
    expect(response.data).toMatchObject({
      completedShares: 8,
      calculationVersion: 'impact-v1',
    });
  });

  it('normalizes backend snake_case and numeric string impact fields', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: '환경 지표를 조회했습니다.',
        data: {
          total_shared: '5',
          total_received: 3,
          completed_shares: '8',
          estimated_food_saved_grams: '1360',
          estimated_carbon_saved_grams: 3400,
          calculation_version: 'impact-v1',
          computed_at: '2026-05-29T00:00:00Z',
        },
      },
    });

    const response = await getImpactSummary('all');

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/users/me/impact/summary',
      {
        params: { period: 'all' },
      },
    );
    expect(response.data).toEqual({
      totalShared: 5,
      totalReceived: 3,
      completedShares: 8,
      estimatedFoodSavedGrams: 1360,
      estimatedCarbonSavedGrams: 3400,
      calculationVersion: 'impact-v1',
      computedAt: '2026-05-29T00:00:00Z',
    });
  });

  it('keeps missing optional totals out of the normalized summary', () => {
    expect(
      normalizeImpactSummary({
        completedShares: 0,
        estimatedFoodSavedGrams: 0,
        estimatedCarbonSavedGrams: 0,
        calculationVersion: 'impact-v1',
        computedAt: '2026-05-29T00:00:00Z',
      }),
    ).toEqual({
      completedShares: 0,
      estimatedFoodSavedGrams: 0,
      estimatedCarbonSavedGrams: 0,
      calculationVersion: 'impact-v1',
      computedAt: '2026-05-29T00:00:00Z',
    });
  });

  it('rejects non-numeric impact number fields', () => {
    expect(() =>
      normalizeImpactSummary({
        completed_shares: 'zero',
        estimated_food_saved_grams: '0',
        estimated_carbon_saved_grams: '0',
        calculation_version: 'impact-v1',
        computed_at: '2026-05-29T00:00:00Z',
      }),
    ).toThrow('Invalid impact summary number field');
  });

  it('rejects missing required impact metadata fields', () => {
    expect(() =>
      normalizeImpactSummary({
        completed_shares: 0,
        estimated_food_saved_grams: 0,
        estimated_carbon_saved_grams: 0,
        calculation_version: null,
        computed_at: '2026-05-29T00:00:00Z',
      }),
    ).toThrow('Invalid impact summary string field');
  });
});
