import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

export const getMessagingOrNull = (): FirebaseMessagingTypes.Module | null => {
  try {
    return messaging();
  } catch (error) {
    console.warn('Firebase messaging is unavailable:', error);
    return null;
  }
};
