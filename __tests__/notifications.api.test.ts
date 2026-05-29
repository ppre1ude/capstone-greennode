import apiClient from '@/api/client';
import {
  deleteServerNotification,
  getNotifications,
  markAllServerNotificationsRead,
  markServerNotificationRead,
  normalizeServerNotification,
} from '@/api/notifications';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    delete: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('notifications API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes server notification records into local inbox records', () => {
    expect(
      normalizeServerNotification({
        id: 'server-1',
        type: 'share_created',
        postId: 42,
        fruitName: 'apple',
        fridgeName: 'Station fridge',
        title: 'New share',
        body: 'Apple is available',
        createdAt: '2026-05-25T00:00:00Z',
        readAt: null,
      }),
    ).toEqual({
      id: 'server-1',
      type: 'share_created',
      postId: '42',
      requestId: undefined,
      fruitName: 'apple',
      fridgeName: 'Station fridge',
      title: 'New share',
      body: 'Apple is available',
      receivedAt: '2026-05-25T00:00:00Z',
      readAt: null,
      source: 'server',
    });
  });

  it('normalizes numeric ids and snake_case server notification fields', () => {
    expect(
      normalizeServerNotification({
        id: 7,
        type: 'share_requested',
        post_id: 42,
        request_id: 99,
        fruit_name: 'banana',
        fridge_name: 'Station fridge',
        title: 'Request',
        body: 'Someone requested banana',
        created_at: '2026-05-25T00:00:00Z',
        read_at: '2026-05-25T00:01:00Z',
      }),
    ).toMatchObject({
      id: '7',
      postId: '42',
      requestId: '99',
      fruitName: 'banana',
      fridgeName: 'Station fridge',
      receivedAt: '2026-05-25T00:00:00Z',
      readAt: '2026-05-25T00:01:00Z',
      source: 'server',
    });
  });

  it('fetches server notifications with unread and pagination params', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          {
            id: 'server-2',
            type: 'share_requested',
            postId: '55',
            requestId: '88',
            fruitName: 'banana',
            fridgeName: 'Main fridge',
            title: 'Request',
            body: 'Someone requested banana',
            receivedAt: '2026-05-25T00:00:00Z',
          },
        ],
      },
    });

    const response = await getNotifications(true, 5, 10);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/notifications', {
      params: { unreadOnly: true, unread_only: true, skip: 5, limit: 10 },
    });
    expect(response.data?.[0]).toMatchObject({
      id: 'server-2',
      postId: '55',
      requestId: '88',
      source: 'server',
    });
  });

  it('unwraps paginated server notification list responses', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          items: [
            {
              id: 5,
              type: 'share_created',
              post_id: 13,
              fruit_name: 'apple',
              fridge_name: 'Main fridge',
              title: 'New share',
              body: 'Apple is available',
              created_at: '2026-05-25T00:00:00Z',
            },
          ],
          total: 1,
        },
      },
    });

    const response = await getNotifications(false, 0, 50);

    expect(response.data).toEqual([
      expect.objectContaining({
        id: '5',
        postId: '13',
        fruitName: 'apple',
        source: 'server',
      }),
    ]);
  });

  it('marks a single notification and all notifications as read', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'ok',
        data: {
          id: 'server-3',
          type: 'share_created',
          postId: '1',
          title: 'Read',
          body: '',
          readAt: '2026-05-25T00:01:00Z',
        },
      },
    });
    mockedApiClient.patch.mockResolvedValueOnce({
      data: { success: true, message: 'ok', data: null },
    });

    await markServerNotificationRead('server-3');
    await markAllServerNotificationsRead();

    expect(mockedApiClient.patch).toHaveBeenNthCalledWith(
      1,
      '/api/v1/notifications/server-3/read',
    );
    expect(mockedApiClient.patch).toHaveBeenNthCalledWith(
      2,
      '/api/v1/notifications/read-all',
    );
  });

  it('deletes server notifications through the soft-delete endpoint', async () => {
    mockedApiClient.delete.mockResolvedValue({
      data: { success: true, message: 'ok', data: null },
    });

    await deleteServerNotification('server-4');

    expect(mockedApiClient.delete).toHaveBeenCalledWith(
      '/api/v1/notifications/server-4',
    );
  });
});
