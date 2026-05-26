import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import type {NotificationRecord} from '@/types';

const MAX_NOTIFICATION_RECORDS = 50;

interface NotificationState {
  notifications: NotificationRecord[];
  addNotification: (notification: NotificationRecord) => void;
  syncNotifications: (notifications: NotificationRecord[]) => void;
  markNotificationRead: (notificationId: string, readAt?: string) => void;
  markAllNotificationsRead: (readAt?: string) => void;
  clearNotifications: () => void;
}

let pendingRehydration: Promise<void> | null = null;

const getNotificationEventKey = (notification: NotificationRecord) =>
  `${notification.type}:${notification.postId}:${notification.requestId ?? ''}`;

export const useNotificationStore = create<NotificationState>()(
  persist(
    set => ({
      notifications: [],
      addNotification: notification => {
        set(state => {
          const withoutDuplicate = state.notifications.filter(
            item => item.id !== notification.id,
          );
          return {
            notifications: [notification, ...withoutDuplicate].slice(
              0,
              MAX_NOTIFICATION_RECORDS,
            ),
          };
        });
      },
      syncNotifications: notifications => {
        set(state => {
          const byEvent = new Map<string, NotificationRecord>();
          [...state.notifications, ...notifications].forEach(notification => {
            const eventKey = getNotificationEventKey(notification);
            const existing = byEvent.get(eventKey);
            byEvent.set(eventKey, {
              ...existing,
              ...notification,
              readAt: existing?.readAt ?? notification.readAt ?? null,
            });
          });

          return {
            notifications: Array.from(byEvent.values())
              .sort(
                (a, b) =>
                  new Date(b.receivedAt).getTime() -
                  new Date(a.receivedAt).getTime(),
              )
              .slice(0, MAX_NOTIFICATION_RECORDS),
          };
        });
      },
      markNotificationRead: (
        notificationId,
        readAt = new Date().toISOString(),
      ) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === notificationId
              ? {...notification, readAt}
              : notification,
          ),
        }));
      },
      markAllNotificationsRead: (readAt = new Date().toISOString()) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.readAt ? notification : {...notification, readAt},
          ),
        }));
      },
      clearNotifications: () => set({notifications: []}),
    }),
    {
      name: 'foodlink-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const rehydrateNotificationStore = async () => {
  if (!pendingRehydration) {
    pendingRehydration = Promise.resolve(
      useNotificationStore.persist.rehydrate(),
    ).finally(() => {
      pendingRehydration = null;
    });
  }

  return pendingRehydration;
};
