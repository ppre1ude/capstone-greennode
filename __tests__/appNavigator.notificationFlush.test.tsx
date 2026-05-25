import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AppNavigator from '@/navigation/AppNavigator';
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
  });

  it('flushes pending notification navigation after route state changes', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AppNavigator />);
    });

    expect(mockNavigationContainerProps.current?.onReady).toBe(
      flushPendingNotificationNavigation,
    );
    expect(mockNavigationContainerProps.current?.onStateChange).toBe(
      flushPendingNotificationNavigation,
    );
    expect(registerForegroundNotificationHandlers).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });
});
