import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Linking} from 'react-native';
import AppNavigator, {
  buildFoodlinkDeepLinkResetState,
  parseFoodlinkDeepLink,
} from '@/navigation/AppNavigator';
import {
  flushPendingNotificationNavigation,
  registerForegroundNotificationHandlers,
} from '@/services/notifications';

const mockNavigationContainerProps: {current?: Record<string, unknown>} = {};

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const actual = jest.requireActual('@react-navigation/native');

  return {
    ...actual,
    NavigationContainer: ({children, ...props}: Record<string, unknown>) => {
      mockNavigationContainerProps.current = props;
      return React.createElement(React.Fragment, null, children);
    },
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({children}: {children: React.ReactNode}) =>
        React.createElement(React.Fragment, null, children),
      Screen: () => null,
    }),
  };
});

jest.mock('@/services/notifications', () => ({
  flushPendingNotificationNavigation: jest.fn(),
  registerForegroundNotificationHandlers: jest.fn(() => jest.fn()),
}));

describe('AppNavigator notification routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigationContainerProps.current = undefined;
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('flushes pending notification navigation after route state changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AppNavigator />);
    });

    expect(mockNavigationContainerProps.current?.onReady).toEqual(
      expect.any(Function),
    );
    expect(mockNavigationContainerProps.current?.onStateChange).toBe(
      flushPendingNotificationNavigation,
    );
    expect(registerForegroundNotificationHandlers).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => {
      const onReady = mockNavigationContainerProps.current
        ?.onReady as () => void;
      onReady();
    });

    expect(flushPendingNotificationNavigation).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });

  it('parses foodlink inventory and tab deep links', () => {
    expect(
      parseFoodlinkDeepLink(
        'foodlink://inventory/pickup/31?fridgePublicCode=GJ-001&fridgeName=Station+One&fridgeLocation=B1&pendingExpiresAt=2026-05-21T12%3A20%3A00Z',
      ),
    ).toEqual({
      name: 'InventoryQr',
      params: {
        mode: 'pickup',
        postId: 31,
        fridgePublicCode: 'GJ-001',
        fridgeName: 'Station One',
        fridgeLocation: 'B1',
        pendingExpiresAt: '2026-05-21T12:20:00Z',
      },
    });
    expect(
      parseFoodlinkDeepLink('foodlink://my-shares?initialTab=posted'),
    ).toEqual({
      name: 'MyShares',
      params: {initialTab: 'posted'},
    });
  });

  it('parses home deep links without stacking Main twice', () => {
    const route = parseFoodlinkDeepLink(
      'foodlink://home?completedPostId=42',
    );

    expect(route).toEqual({
      name: 'Main',
      params: {
        screen: 'Home',
        params: {completedPostId: 42},
      },
    });
    expect(buildFoodlinkDeepLinkResetState(route!)).toEqual({
      index: 0,
      routes: [route],
    });
  });
});
