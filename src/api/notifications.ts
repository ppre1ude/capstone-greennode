import apiClient from './client';
import type {
  ApiResponse,
  NotificationRecord,
  ServerNotificationRecord,
} from '@/types';

const NOTIFICATIONS_PREFIX = '/api/v1/notifications';

type ServerNotificationList =
  | ServerNotificationRecord[]
  | {
      items?: ServerNotificationRecord[];
      notifications?: ServerNotificationRecord[];
      results?: ServerNotificationRecord[];
    };

const toStringOrEmpty = (value: unknown) =>
  value == null ? '' : String(value);

const firstPresent = <T>(...values: Array<T | null | undefined>) =>
  values.find(value => value != null);

const getServerNotificationItems = (
  data: ServerNotificationList | null | undefined,
): ServerNotificationRecord[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  for (const key of ['items', 'notifications', 'results'] as const) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

export const normalizeServerNotification = (
  notification: ServerNotificationRecord,
): NotificationRecord => {
  const requestId = firstPresent(
    notification.requestId,
    notification.request_id,
  );

  return {
    id: toStringOrEmpty(notification.id),
    type: notification.type,
    postId: toStringOrEmpty(
      firstPresent(notification.postId, notification.post_id),
    ),
    requestId: requestId == null ? undefined : String(requestId),
    fruitName:
      firstPresent(notification.fruitName, notification.fruit_name) || '',
    fridgeName:
      firstPresent(notification.fridgeName, notification.fridge_name) || '',
    title: notification.title || 'FoodLink 알림',
    body: notification.body || '',
    receivedAt:
      firstPresent(
        notification.receivedAt,
        notification.received_at,
        notification.createdAt,
        notification.created_at,
      ) || new Date().toISOString(),
    readAt: firstPresent(notification.readAt, notification.read_at) ?? null,
    source: 'server',
  };
};

export const getNotifications = async (
  unreadOnly: boolean = false,
  skip: number = 0,
  limit: number = 50,
): Promise<ApiResponse<NotificationRecord[]>> => {
  const response = await apiClient.get(NOTIFICATIONS_PREFIX, {
    params: { unreadOnly, unread_only: unreadOnly, skip, limit },
  });
  const payload = response.data as ApiResponse<ServerNotificationList>;
  const serverNotifications = getServerNotificationItems(payload.data);

  return {
    ...payload,
    data: serverNotifications.map(normalizeServerNotification),
  };
};

export const markServerNotificationRead = async (
  notificationId: string,
): Promise<ApiResponse<NotificationRecord | null>> => {
  const response = await apiClient.patch(
    `${NOTIFICATIONS_PREFIX}/${notificationId}/read`,
  );
  const payload = response.data as ApiResponse<ServerNotificationRecord | null>;

  return {
    ...payload,
    data: payload.data ? normalizeServerNotification(payload.data) : null,
  };
};

export const markAllServerNotificationsRead = async (): Promise<
  ApiResponse<null>
> => {
  const response = await apiClient.patch(`${NOTIFICATIONS_PREFIX}/read-all`);
  return response.data;
};

export const deleteServerNotification = async (
  notificationId: string,
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete(
    `${NOTIFICATIONS_PREFIX}/${notificationId}`,
  );
  return response.data;
};
