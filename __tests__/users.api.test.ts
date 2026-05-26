import apiClient from '@/api/client';
import { getMyPosts, getMyShareRequests } from '@/api/users';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('users API lifecycle contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({
      data: { success: true, message: 'ok', data: [] },
    });
  });

  it('fetches my registered posts with a comma-separated status filter', async () => {
    await getMyPosts(['pending_store', 'requested', 'completed'], 0, 50);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/me/posts', {
      params: {
        status: 'pending_store,requested,completed',
        skip: 0,
        limit: 50,
      },
    });
  });

  it('fetches my share requests with requested/completed filters', async () => {
    await getMyShareRequests(['requested', 'completed'], 10, 20);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/users/me/share-requests',
      {
        params: {
          status: 'requested,completed',
          skip: 10,
          limit: 20,
        },
      },
    );
  });
});
