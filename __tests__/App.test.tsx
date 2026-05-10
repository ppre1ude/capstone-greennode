/**
 * @format
 */

import React from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {rehydrateNotificationStore} from '@/store/notificationStore';
import App from '../App';

jest.mock('@/store/notificationStore', () => {
  const actual = jest.requireActual('@/store/notificationStore');

  return {
    ...actual,
    rehydrateNotificationStore: jest.fn(() => Promise.resolve()),
  };
});

const mockedRehydrateNotificationStore =
  rehydrateNotificationStore as jest.MockedFunction<
    typeof rehydrateNotificationStore
  >;

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});

test('rehydrates notifications when the app returns to foreground', async () => {
  const appStateListeners: Array<(state: AppStateStatus) => void> = [];
  const removeAppStateListener = jest.fn();
  const addEventListenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((event, listener) => {
      if (event === 'change') {
        appStateListeners.push(listener);
      }

      return {remove: removeAppStateListener} as never;
    });

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    appStateListeners[0]('background');
    appStateListeners[0]('active');
  });

  expect(mockedRehydrateNotificationStore).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });

  expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  addEventListenerSpy.mockRestore();
  mockedRehydrateNotificationStore.mockClear();
});
