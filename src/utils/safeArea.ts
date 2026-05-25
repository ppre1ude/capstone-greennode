import { Platform, StatusBar } from 'react-native';

export const getHeaderTopPadding = (androidContentPadding = 16) => {
  if (Platform.OS === 'ios') {
    return 56;
  }

  return (StatusBar.currentHeight ?? 0) + androidContentPadding;
};
