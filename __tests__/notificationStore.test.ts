import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  rehydrateNotificationStore,
  useNotificationStore,
} from '@/store/notificationStore';
import type {NotificationRecord} from '@/types';

const STORAGE_KEY = 'foodlink-notifications';

const backgroundNotification: NotificationRecord = {
  id: 'background-message-1',
  type: 'share_created',
  postId: '10',
  fruitName: 'Tomato',
  fridgeName: 'Community fridge',
  title: 'Nearby share registered',
  body: 'Tomato was registered in Community fridge.',
  receivedAt: '2026-05-10T00:00:00.000Z',
  source: 'background',
};

describe('notification store', () => {
  beforeEach(async () => {
    useNotificationStore.setState({notifications: []});
    await AsyncStorage.clear();
  });

  it('rehydrates notifications written while the app was backgrounded', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {notifications: [backgroundNotification]},
        version: 0,
      }),
    );

    expect(useNotificationStore.getState().notifications).toEqual([]);

    await rehydrateNotificationStore();

    expect(useNotificationStore.getState().notifications).toEqual([
      backgroundNotification,
    ]);
  });

  it('marks all local notifications as read without replacing existing read timestamps', () => {
    useNotificationStore.setState({
      notifications: [
        backgroundNotification,
        {
          ...backgroundNotification,
          id: 'already-read-message',
          readAt: '2026-05-10T00:10:00.000Z',
        },
      ],
    });

    useNotificationStore
      .getState()
      .markAllNotificationsRead('2026-05-10T00:20:00.000Z');

    expect(useNotificationStore.getState().notifications).toEqual([
      {...backgroundNotification, readAt: '2026-05-10T00:20:00.000Z'},
      {
        ...backgroundNotification,
        id: 'already-read-message',
        readAt: '2026-05-10T00:10:00.000Z',
      },
    ]);
  });

  it('dedupes server notifications with local FCM records by event key', () => {
    useNotificationStore.setState({
      notifications: [
        {
          ...backgroundNotification,
          id: 'fcm-message-1',
          requestId: '99',
          readAt: '2026-05-10T00:30:00.000Z',
        },
      ],
    });

    useNotificationStore.getState().syncNotifications([
      {
        ...backgroundNotification,
        id: 'server-new',
        postId: '11',
        receivedAt: '2026-05-10T00:40:00.000Z',
        source: 'server',
      },
      {
        ...backgroundNotification,
        id: 'server-message-1',
        requestId: '99',
        receivedAt: '2026-05-10T00:10:00.000Z',
        readAt: null,
        source: 'server',
      },
    ]);

    expect(useNotificationStore.getState().notifications).toMatchObject([
      {id: 'server-new', source: 'server'},
      {
        id: 'server-message-1',
        source: 'server',
        requestId: '99',
        readAt: '2026-05-10T00:30:00.000Z',
      },
    ]);
  });
});
