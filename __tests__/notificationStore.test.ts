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
});
