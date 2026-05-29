import apiClient from '@/api/client';
import { getImpactSummary } from '@/api/impact';

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
});
