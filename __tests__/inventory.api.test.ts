import apiClient from '@/api/client';
import {confirmPickup, confirmStore} from '@/api/inventory';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('inventory API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('confirms store with the backend QR contract', async () => {
    mockedApiClient.post.mockResolvedValue({
      data: {
        success: true,
        message: '입고 인증이 완료되었습니다.',
        data: {
          postId: 1,
          status: 'available',
          labelCode: '#03',
          storageZone: 'ETHYLENE_SEPARATED',
          storageDeadlineAt: '2026-06-18T05:30:00Z',
          storedAt: '2026-05-19T05:30:00Z',
        },
      },
    });

    const response = await confirmStore({
      postId: 1,
      fridgePublicCode: 'GJ-STATION-001',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/v1/inventory/confirm-store',
      {
        postId: 1,
        fridgePublicCode: 'GJ-STATION-001',
      },
    );
    expect(response.data?.labelCode).toBe('#03');
  });

  it('confirms pickup with postId and fridgePublicCode', async () => {
    mockedApiClient.post.mockResolvedValue({
      data: {
        success: true,
        message: '수거가 완료되었습니다.',
        data: {
          postId: 1,
          status: 'completed',
          labelCode: '#03',
          storageZone: 'ETHYLENE_SEPARATED',
          pickedUpAt: '2026-05-20T02:15:00Z',
        },
      },
    });

    const response = await confirmPickup({
      postId: 1,
      fridgePublicCode: 'GJ-STATION-001',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/v1/inventory/confirm-pickup',
      {
        postId: 1,
        fridgePublicCode: 'GJ-STATION-001',
      },
    );
    expect(response.data?.status).toBe('completed');
  });
});
