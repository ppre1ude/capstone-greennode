import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import messaging from '@react-native-firebase/messaging';
import {updateLocation} from '@/api/auth';
import type {User} from '@/types';

const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  await messaging().requestPermission();
  await messaging().registerDeviceForRemoteMessages();
};

export const getFcmToken = async (): Promise<string | undefined> => {
  try {
    await requestNotificationPermission();
    return await messaging().getToken();
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

  const fcmToken = await getFcmToken();
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
