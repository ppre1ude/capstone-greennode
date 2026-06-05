import React from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import MainTab from '@/navigation/MainTab';

let mockCapturedNavigatorProps: {
  screenOptions?: {
    tabBarButton?: (props: unknown) => React.ReactNode;
    tabBarStyle?: unknown;
  };
} = {};
let mockSafeAreaBottomInset = 0;

jest.mock('@react-navigation/bottom-tabs', () => {
  const ReactForMock = require('react');

  return {
    createBottomTabNavigator: jest.fn(() => ({
      Navigator: (props: {
        children?: React.ReactNode;
        screenOptions?: unknown;
      }) => {
        mockCapturedNavigatorProps = props as typeof mockCapturedNavigatorProps;
        return ReactForMock.createElement(
          ReactForMock.Fragment,
          null,
          props.children,
        );
      },
      Screen: () => null,
    })),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: mockSafeAreaBottomInset,
    left: 0,
  }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
}));

jest.mock('@/utils/locationGuard', () => ({
  hasRegisteredLocation: jest.fn(() => false),
}));

jest.mock('@/screens/home/HomeScreen', () => () => null);
jest.mock('@/screens/map/MapScreen', () => () => null);
jest.mock('@/screens/chat/ChatListScreen', () => () => null);
jest.mock('@/screens/profile/ProfileScreen', () => () => null);

const originalPlatformOS = Platform.OS;

const setPlatformOS = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
};

const renderMainTabAndGetTabBarStyle = async (bottomInset: number) => {
  mockSafeAreaBottomInset = bottomInset;
  mockCapturedNavigatorProps = {};

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<MainTab />);
  });

  const tabBarStyle = StyleSheet.flatten(
    mockCapturedNavigatorProps.screenOptions?.tabBarStyle,
  ) as ViewStyle;

  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });

  return tabBarStyle;
};

describe('MainTab bottom safe-area handling', () => {
  afterEach(() => {
    setPlatformOS(originalPlatformOS);
    mockSafeAreaBottomInset = 0;
  });

  it('lifts Android tab content above system navigation controls when bottom inset is 0', async () => {
    setPlatformOS('android');

    const tabBarStyle = await renderMainTabAndGetTabBarStyle(0);

    expect(tabBarStyle.height).toBe(132);
    expect(tabBarStyle.paddingBottom).toBe(68);
  });

  it('uses a larger reported Android bottom inset instead of the fallback', async () => {
    setPlatformOS('android');

    const tabBarStyle = await renderMainTabAndGetTabBarStyle(64);

    expect(tabBarStyle.height).toBe(148);
    expect(tabBarStyle.paddingBottom).toBe(84);
  });

  it('uses the reported iOS safe-area bottom without Android fallback', async () => {
    setPlatformOS('ios');

    const tabBarStyle = await renderMainTabAndGetTabBarStyle(34);

    expect(tabBarStyle.height).toBe(118);
    expect(tabBarStyle.paddingBottom).toBe(54);
  });

  it('uses a custom tab button to suppress oversized Android native ripple', async () => {
    setPlatformOS('android');

    await renderMainTabAndGetTabBarStyle(0);

    expect(mockCapturedNavigatorProps.screenOptions?.tabBarButton).toEqual(
      expect.any(Function),
    );
  });
});
