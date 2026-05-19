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

  it('fetches operator inventory summary for a fridge', async () => {
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

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/operator/fridges/1/inventory/summary',
    );
    expect(response.data?.totalItems).toBe(8);
  });

  it('fetches operator inventory items for a fridge', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          {
            postId: 120,
            labelCode: '#07',
            itemName: '사과',
            status: 'expired',
            storageZone: 'ETHYLENE_SEPARATED',
            storageDeadlineAt: '2026-05-19T00:00:00Z',
          },
        ],
      },
    });

    const response = await getOperatorInventoryItems(1);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/operator/fridges/1/inventory/items',
    );
    expect(response.data?.[0]?.labelCode).toBe('#07');
  });
});
