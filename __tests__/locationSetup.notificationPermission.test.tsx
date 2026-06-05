import React from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import ReactTestRenderer from 'react-test-renderer';
import LocationSetupScreen from '@/screens/location/LocationSetupScreen';
import { updateLocation } from '@/api/auth';
import { getFcmToken } from '@/services/deviceRegistration';
import { useAuthStore } from '@/store/authStore';
import { renderWithSafeArea } from '../test-utils/renderWithSafeArea';

jest.mock('@/api/auth', () => ({
  updateLocation: jest.fn(),
}));

jest.mock('@/services/deviceRegistration', () => ({
  getFcmToken: jest.fn(),
}));

const mockedUpdateLocation = updateLocation as jest.MockedFunction<
  typeof updateLocation
>;
const mockedGetFcmToken = getFcmToken as jest.MockedFunction<
  typeof getFcmToken
>;
const mockedGetCurrentPosition = Geolocation.getCurrentPosition as jest.Mock;
const mockedOpenSettings = jest.spyOn(Linking, 'openSettings');

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root.findAllByType(TouchableOpacity).find(button =>
    button.findAllByType(Text).some(textNode => {
      const children = textNode.props.children;
      return Array.isArray(children)
        ? children.join('') === label
        : children === label;
    }),
  );

const findHostByTestId = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  testID: string,
) =>
  renderer.root.find(
    node => node.props.testID === testID && typeof node.type === 'string',
  );

describe('LocationSetupScreen notification permission flow', () => {
  const navigation = {
    goBack: jest.fn(),
    reset: jest.fn(),
  };
  const renderLocationSetup = () =>
    renderWithSafeArea(
      <LocationSetupScreen
        navigation={navigation as never}
        route={{ params: { allowBack: false } } as never}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { get: () => 'android' });
    Object.defineProperty(Platform, 'Version', { get: () => 35 });
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    mockedGetCurrentPosition.mockImplementation(success => {
      success({
        coords: {
          latitude: 35.1595,
          longitude: 126.9132,
        },
      });
    });
    mockedGetFcmToken.mockResolvedValue('fcm-token');
    mockedOpenSettings.mockResolvedValue();
    mockedUpdateLocation.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        id: 1,
        email: 'user@example.com',
        nickname: '테스터',
        profileImageUrl: null,
        latitude: 35.1595,
        longitude: 126.9132,
        fcmToken: 'fcm-token',
        isActive: true,
        createdAt: '2026-05-07T00:00:00Z',
        updatedAt: '2026-05-07T00:00:00Z',
      },
    });
    useAuthStore.setState({
      token: 'access-token',
      user: null,
      isLoading: false,
      isLoggedIn: true,
      hasLocation: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('asks for push notifications only after the user chooses the notification CTA', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetFcmToken).not.toHaveBeenCalled();

    const notificationButton = findButtonByText(renderer!, '나눔 알림 받기');
    expect(notificationButton).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      notificationButton?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedGetFcmToken).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findAllByProps({ children: '알림 받을 준비가 됐어요' }),
    ).not.toHaveLength(0);

    const submitButton = findButtonByText(renderer!, '이 위치로 설정하기');
    expect(submitButton).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      submitButton?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedUpdateLocation).toHaveBeenCalledWith({
      latitude: 35.1595,
      longitude: 126.9132,
      fcmToken: 'fcm-token',
    });
  });

  it('stacks the notification prompt so long copy does not compete with the CTA', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    const notificationPanel = findHostByTestId(
      renderer!,
      'location-notification-panel',
    );
    const panelStyle = StyleSheet.flatten(
      notificationPanel.props.style,
    ) as ViewStyle;

    expect(panelStyle.flexDirection).toBe('column');
    expect(panelStyle.alignItems).toBe('stretch');

    const copyGroup = findHostByTestId(
      renderer!,
      'location-notification-copy',
    );
    const copyStyle = StyleSheet.flatten(copyGroup.props.style) as ViewStyle;
    expect(copyStyle.flex).toBeUndefined();
    expect(copyStyle.flexShrink).toBe(1);
  });

  it('renders GIS and GPS visual signals in the location map area', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(findHostByTestId(renderer!, 'location-map-visual')).toBeTruthy();
    expect(
      renderer!.root.findAllByProps({ children: '동네 위치 확인' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '정확도 우선' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '35.1595, 126.9132' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '공유 냉장고' }),
    ).not.toHaveLength(0);
  });

  it('keeps a recoverable in-screen path when Android location permission is denied', async () => {
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED);

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAllByProps({ children: '위치 권한이 필요해요' }),
    ).not.toHaveLength(0);
    expect(findButtonByText(renderer!, '권한 다시 요청')).toBeTruthy();
    expect(findButtonByText(renderer!, '설정 열기')).toBeTruthy();

    const submitButton = findButtonByText(renderer!, '이 위치로 설정하기');
    expect(submitButton?.props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      submitButton?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedUpdateLocation).not.toHaveBeenCalled();

    const settingsButton = findButtonByText(renderer!, '설정 열기');
    await ReactTestRenderer.act(async () => {
      settingsButton?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('lets the user retry location permission from the denied state', async () => {
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED)
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED);

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    const retryButton = findButtonByText(renderer!, '권한 다시 요청');
    expect(retryButton).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      retryButton?.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetCurrentPosition).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findAllByProps({ children: '35.15950, 126.91320' }),
    ).not.toHaveLength(0);
  });

  it('uses settings-first recovery when Android location permission is blocked', async () => {
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED);

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAllByProps({
        children: '설정에서 위치 권한을 켜주세요',
      }),
    ).not.toHaveLength(0);
    expect(findButtonByText(renderer!, '설정 열기')).toBeTruthy();
    expect(findButtonByText(renderer!, '다시 확인')).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '설정 열기')?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedOpenSettings).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '다시 확인')?.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetCurrentPosition).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findAllByProps({ children: '35.15950, 126.91320' }),
    ).not.toHaveLength(0);
  });

  it('lets the user retry when geolocation cannot return coordinates', async () => {
    mockedGetCurrentPosition
      .mockImplementationOnce((_success, error) => {
        error(new Error('position unavailable'));
      })
      .mockImplementationOnce(success => {
        success({
          coords: {
            latitude: 35.1595,
            longitude: 126.9132,
          },
        });
      });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderLocationSetup());
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({ children: '현재 위치를 찾지 못했어요' }),
    ).not.toHaveLength(0);

    const submitButton = findButtonByText(renderer!, '이 위치로 설정하기');
    expect(submitButton?.props.disabled).toBe(true);

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '위치 다시 찾기')?.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetCurrentPosition).toHaveBeenCalledTimes(2);
    expect(
      renderer!.root.findAllByProps({ children: '35.15950, 126.91320' }),
    ).not.toHaveLength(0);
  });
});
