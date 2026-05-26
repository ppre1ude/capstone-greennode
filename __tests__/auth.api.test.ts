import apiClient from '@/api/client';
import { getMe } from '@/api/auth';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('auth API user normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes snake_case operator metadata from /auth/me', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          id: 1,
          email: 'operator@example.com',
          nickname: 'operator',
          profileImageUrl: null,
          latitude: 35,
          longitude: 126,
          fcmToken: null,
          isActive: true,
          is_operator: true,
          operator_role: 'fridge_operator',
          operator_fridge_ids: [1, 3],
          roles: ['member', 'fridge_operator'],
          createdAt: '2026-05-25T00:00:00Z',
          updatedAt: '2026-05-25T00:00:00Z',
        },
      },
    });

    const response = await getMe();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(response.data).toMatchObject({
      isOperator: true,
      operatorRole: 'fridge_operator',
      operatorFridgeIds: [1, 3],
    });
  });
});
