import {PermissionsAndroid, Platform} from 'react-native';

const loadDeviceRegistration = () =>
  require('@/services/deviceRegistration') as typeof import('@/services/deviceRegistration');

describe('device registration notification permission', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not fetch or register an FCM token when Android notification permission is denied', async () => {
    Object.defineProperty(Platform, 'OS', {get: () => 'android'});
    Object.defineProperty(Platform, 'Version', {get: () => 35});

    const messagingInstance = {
      requestPermission: jest.fn(),
      registerDeviceForRemoteMessages: jest.fn(),
      getToken: jest.fn(),
    };

    jest.doMock('@react-native-firebase/messaging', () => ({
      __esModule: true,
      default: () => messagingInstance,
    }));

    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

    const {getFcmToken} = loadDeviceRegistration();

    await expect(getFcmToken()).resolves.toBeUndefined();
    expect(messagingInstance.requestPermission).not.toHaveBeenCalled();
    expect(messagingInstance.registerDeviceForRemoteMessages).not.toHaveBeenCalled();
    expect(messagingInstance.getToken).not.toHaveBeenCalled();
  });

  it('does not open the push permission flow while refreshing an already located device', async () => {
    Object.defineProperty(Platform, 'OS', {get: () => 'android'});
    Object.defineProperty(Platform, 'Version', {get: () => 35});

    const messagingInstance = {
      requestPermission: jest.fn(),
      registerDeviceForRemoteMessages: jest.fn(),
      getToken: jest.fn(),
    };
    const updateLocation = jest.fn().mockResolvedValue({
      success: true,
      message: 'ok',
      data: null,
    });
    const getCurrentPosition = jest.fn(success => {
      success({
        coords: {
          latitude: 35.1595,
          longitude: 126.9132,
        },
      });
    });

    jest.doMock('@react-native-firebase/messaging', () => ({
      __esModule: true,
      default: () => messagingInstance,
    }));
    jest.doMock('@/api/auth', () => ({
      updateLocation,
    }));
    jest.doMock('react-native-geolocation-service', () => ({
      getCurrentPosition,
    }));

    const permissionSpy = jest.spyOn(PermissionsAndroid, 'request');
    const {refreshDeviceRegistration} = loadDeviceRegistration();

    await refreshDeviceRegistration({
      id: 1,
      email: 'user@example.com',
      nickname: '테스터',
      profileImageUrl: null,
      latitude: 35.1595,
      longitude: 126.9132,
      fcmToken: null,
      isActive: true,
      createdAt: '2026-05-07T00:00:00Z',
      updatedAt: '2026-05-07T00:00:00Z',
    });

    expect(permissionSpy).not.toHaveBeenCalled();
    expect(messagingInstance.requestPermission).not.toHaveBeenCalled();
    expect(messagingInstance.registerDeviceForRemoteMessages).not.toHaveBeenCalled();
    expect(messagingInstance.getToken).not.toHaveBeenCalled();
    expect(updateLocation).toHaveBeenCalledWith({
      latitude: 35.1595,
      longitude: 126.9132,
      fcmToken: undefined,
    });
  });
});
