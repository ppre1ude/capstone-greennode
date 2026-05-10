import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import type {NotificationRecord} from '@/types';

const MAX_NOTIFICATION_RECORDS = 50;

interface NotificationState {
  notifications: NotificationRecord[];
  addNotification: (notification: NotificationRecord) => void;
  clearNotifications: () => void;
}

let pendingRehydration: Promise<void> | null = null;

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
