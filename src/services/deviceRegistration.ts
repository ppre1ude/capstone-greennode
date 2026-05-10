import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {updateLocation} from '@/api/auth';
import {getMessagingOrNull} from '@/services/firebaseMessaging';
import type {User} from '@/types';

type MessagingInstance = NonNullable<ReturnType<typeof getMessagingOrNull>>;

const isAuthorizedMessagingStatus = (
  authorizationStatus: unknown,
): boolean =>
  authorizationStatus === 1 ||
  authorizationStatus === 2 ||
  authorizationStatus === 3 ||
  authorizationStatus === true;

const requestNotificationPermission = async (
  messagingInstance: MessagingInstance,
): Promise<boolean> => {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );

    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }

  const authorizationStatus: unknown =
    await messagingInstance.requestPermission();
  const isAuthorized =
    isAuthorizedMessagingStatus(authorizationStatus) ||
    authorizationStatus === undefined;

  if (!isAuthorized) {
    return false;
  }

  await messagingInstance.registerDeviceForRemoteMessages();
  return true;
};

const getCurrentDeviceFcmTokenIfAuthorized = async (): Promise<
  string | undefined
> => {
  const messagingInstance = getMessagingOrNull();
  if (!messagingInstance) {
    return undefined;
  }

  try {
    const authorizationStatus = await messagingInstance.hasPermission();
    if (!isAuthorizedMessagingStatus(authorizationStatus)) {
      return undefined;
    }

    await messagingInstance.registerDeviceForRemoteMessages();
    return await messagingInstance.getToken();
  } catch (error) {
    console.warn('FCM token refresh error:', error);
    return undefined;
  }
};

export const getFcmToken = async (): Promise<string | undefined> => {
  const messagingInstance = getMessagingOrNull();
  if (!messagingInstance) {
    return undefined;
  }

  try {
    const granted = await requestNotificationPermission(messagingInstance);
    if (!granted) {
      return undefined;
    }

    return await messagingInstance.getToken();
  } catch (error) {
    console.warn('FCM token error:', error);
    return undefined;
  }
};

export const getCurrentCoordinates = (): Promise<{
  latitude: number;
  longitude: number;
}> =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  });

export const refreshDeviceRegistration = async (user: User) => {
  if (user.latitude === null || user.longitude === null) {
    return;
  }

  const fcmToken = await getCurrentDeviceFcmTokenIfAuthorized();
  let latitude = user.latitude;
  let longitude = user.longitude;

  try {
    const current = await getCurrentCoordinates();
    latitude = current.latitude;
    longitude = current.longitude;
  } catch (error) {
    console.warn('Location refresh error:', error);
  }

  await updateLocation({latitude, longitude, fcmToken});
};
