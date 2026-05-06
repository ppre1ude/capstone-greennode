import apiClient from '@/api/client';
import {getFridgePosts} from '@/api/fridges';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('fridges API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches available posts inside a specific fridge', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          {
            id: 10,
            fridgeId: 7,
            authorId: 1,
            detectedFruit: 'apple',
            detectedFruitKo: '사과',
            freshnessLabel: 'Fresh',
            confidenceScore: 0.95,
            imageUrl: '/static/posts/10.jpg',
            expirationDate: '2026-05-08',
            status: 'available',
            createdAt: '2026-05-06T00:00:00Z',
            updatedAt: '2026-05-06T00:00:00Z',
          },
        ],
      },
    });

    const response = await getFridgePosts(7);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/fridges/7/posts',
      {
        params: {status: 'available'},
      },
    );
    expect(response.data?.[0].fridgeId).toBe(7);
  });
});
