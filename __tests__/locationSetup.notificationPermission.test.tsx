import React from 'react';
import {PermissionsAndroid, Platform, Text, TouchableOpacity} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import ReactTestRenderer from 'react-test-renderer';
import LocationSetupScreen from '@/screens/location/LocationSetupScreen';
import {updateLocation} from '@/api/auth';
import {getFcmToken} from '@/services/deviceRegistration';
import {useAuthStore} from '@/store/authStore';

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

describe('LocationSetupScreen notification permission flow', () => {
  const navigation = {
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {get: () => 'android'});
    Object.defineProperty(Platform, 'Version', {get: () => 35});
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
      renderer = ReactTestRenderer.create(
        <LocationSetupScreen
          navigation={navigation as never}
          route={{params: {allowBack: false}} as never}
        />,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedGetFcmToken).not.toHaveBeenCalled();

    const notificationButton = findButtonByText(
      renderer!,
      '나눔 알림 받기',
    );
    expect(notificationButton).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      notificationButton?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedGetFcmToken).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.findAllByProps({children: '알림 받을 준비가 됐어요'}),
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
});
