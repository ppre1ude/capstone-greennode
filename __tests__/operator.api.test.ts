import apiClient from '@/api/client';
import {
  disposeOperatorItem,
  getOperatorInventoryItems,
  getOperatorInventorySummary,
} from '@/api/operator';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
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
        id: 110,
        fridgeId: 1,
        authorId: 7,
        detectedFruit: 'apple',
        detectedFruitKo: '사과',
        freshnessLabel: 'Fresh',
        confidenceScore: 0.95,
        imageUrl: '/static/uploads/posts/7/apple.jpg',
        expirationDate: '2026-05-25',
        status: 'disposed',
        updatedAt: '2026-05-20T09:00:00Z',
        createdAt: '2026-05-20T08:00:00Z',
      },
    });

    const response = await disposeOperatorItem(110);

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/api/v1/operator/items/110/dispose',
    );
    expect(response.data?.status).toBe('disposed');
    expect(response.data?.postId).toBe(110);
    expect(response.data?.post?.status).toBe('disposed');
  });

  it('normalizes backend operator inventory summary for a fridge', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        fridgeId: 1,
        fridgeName: '광주역 공유냉장고',
        total: 5,
        available: 3,
        requested: 1,
        expired: 1,
        disposedToday: 0,
      },
    });

    const response = await getOperatorInventorySummary(1);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/operator/fridges/1/inventory/summary',
    );
    expect(response.success).toBe(true);
    expect(response.data?.fridgeName).toBe('광주역 공유냉장고');
    expect(response.data?.totalItems).toBe(5);
    expect(response.data?.availableItems).toBe(3);
    expect(response.data?.requestedItems).toBe(1);
    expect(response.data?.expiredItems).toBe(1);
    expect(response.data?.disposedItems).toBe(0);
  });

  it('keeps legacy wrapped operator summary responses compatible', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          totalItems: 8,
          availableItems: 4,
          requestedItems: 1,
          expiringSoonItems: 2,
          expiredItems: 1,
          needsReviewItems: 0,
          ethyleneSeparatedItems: 1,
          lastSyncedAt: '2026-05-20T00:00:00Z',
        },
      },
    });

    const response = await getOperatorInventorySummary(1);

    expect(response.success).toBe(true);
    expect(response.data?.totalItems).toBe(8);
    expect(response.data?.expiringSoonItems).toBe(2);
    expect(response.data?.ethyleneSeparatedItems).toBe(1);
  });

  it('normalizes backend operator inventory items for a fridge', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: [
        {
          id: 120,
          authorId: 7,
          fridgeId: 1,
          detectedFruit: 'apple',
          detectedFruitKo: '사과',
          freshnessLabel: 'Fresh',
          confidenceScore: 0.95,
          imageUrl: '/static/uploads/posts/7/apple.jpg',
          expirationDate: '2026-05-25',
          status: 'expired',
          labelCode: '#07',
          storageZone: 'ETHYLENE_SEPARATED',
          storageDeadlineAt: '2026-05-19T00:00:00Z',
          createdAt: '2026-05-20T08:00:00Z',
          updatedAt: '2026-05-20T09:00:00Z',
        },
      ],
    });

    const response = await getOperatorInventoryItems(1);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/operator/fridges/1/inventory/items',
    );
    expect(response.success).toBe(true);
    expect(response.data?.[0]?.postId).toBe(120);
    expect(response.data?.[0]?.itemName).toBe('사과');
    expect(response.data?.[0]?.labelCode).toBe('#07');
  });
});
