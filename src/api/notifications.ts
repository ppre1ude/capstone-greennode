import apiClient from './client';
import type {
  ApiResponse,
  NotificationRecord,
  ServerNotificationRecord,
} from '@/types';

const NOTIFICATIONS_PREFIX = '/api/v1/notifications';

const toStringOrEmpty = (value: unknown) =>
  value == null ? '' : String(value);

export const normalizeServerNotification = (
  notification: ServerNotificationRecord,
): NotificationRecord => ({
  id: notification.id,
  type: notification.type,
  postId: toStringOrEmpty(notification.postId),
  requestId:
    notification.requestId == null ? undefined : String(notification.requestId),
  fruitName: notification.fruitName || '',
  fridgeName: notification.fridgeName || '',
  title: notification.title || 'FoodLink 알림',
  body: notification.body || '',
  receivedAt:
    notification.receivedAt ||
    notification.createdAt ||
    new Date().toISOString(),
  readAt: notification.readAt ?? null,
  source: 'server',
});

export const getNotifications = async (
  unreadOnly: boolean = false,
  skip: number = 0,
  limit: number = 50,
): Promise<ApiResponse<NotificationRecord[]>> => {
  const response = await apiClient.get(NOTIFICATIONS_PREFIX, {
    params: { unreadOnly, skip, limit },
  });
  const payload = response.data as ApiResponse<ServerNotificationRecord[]>;

  return {
    ...payload,
    data: Array.isArray(payload.data)
      ? payload.data.map(normalizeServerNotification)
      : [],
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
