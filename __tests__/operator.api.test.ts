import apiClient from '@/api/client';
import {disposeOperatorItem} from '@/api/operator';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    patch: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('operator API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disposes an operator item through the backend endpoint', async () => {
    mockedApiClient.patch.mockResolvedValue({
      data: {
        success: true,
        message: '폐기 처분 완료',
        data: {
          postId: 110,
          status: 'disposed',
          disposedAt: '2026-05-20T09:00:00Z',
        },
      },
    });

    const response = await disposeOperatorItem(110);

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/api/v1/operator/items/110/dispose',
    );
    expect(response.data?.status).toBe('disposed');
  });
});
