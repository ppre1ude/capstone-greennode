import { Platform } from 'react-native';

export const getHeaderTopPadding = (androidContentPadding = 16) => {
  if (Platform.OS === 'ios') {
    return 56;
  }

  return androidContentPadding;
};
