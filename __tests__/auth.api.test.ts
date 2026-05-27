import apiClient from '@/api/client';
import { getMe, updateProfile } from '@/api/auth';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
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

  it('updates the current user profile through PATCH /auth/me', async () => {
    mockedApiClient.patch.mockResolvedValue({
      data: {
        success: true,
        message: '사용자 조회 성공',
        data: {
          id: 1,
          email: 'member@example.com',
          nickname: '공급자A_수정',
          profileImageUrl: '/static/uploads/profile/avatar.jpg',
          latitude: 35,
          longitude: 126,
          fcmToken: null,
          isActive: true,
          isOperator: false,
          operatorRole: null,
          operatorFridgeIds: [],
          createdAt: '2026-05-25T00:00:00Z',
          updatedAt: '2026-05-27T00:00:00Z',
        },
      },
    });

    const response = await updateProfile({
      nickname: '공급자A_수정',
      profileImageUrl: '/static/uploads/profile/avatar.jpg',
    });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/api/v1/auth/me', {
      nickname: '공급자A_수정',
      profileImageUrl: '/static/uploads/profile/avatar.jpg',
    });
    expect(response.data).toMatchObject({
      nickname: '공급자A_수정',
      profileImageUrl: '/static/uploads/profile/avatar.jpg',
      isOperator: false,
      operatorRole: null,
      operatorFridgeIds: [],
    });
  });
});
