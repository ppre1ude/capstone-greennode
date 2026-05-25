/**
 * FoodLink — React Native App Entry Point
 */
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import AppNavigator from '@/navigation/AppNavigator';
import {
  consumePendingNativeNotificationPayload,
  handleInitialNotificationPayload,
  registerNativeNotificationOpenHandler,
} from '@/services/notifications';
import type {FcmStringDataPayload} from '@/types';

interface AppProps {
  initialNotificationPayload?: FcmStringDataPayload;
}

function App({initialNotificationPayload}: AppProps) {
  React.useEffect(() => {
    handleInitialNotificationPayload(initialNotificationPayload).catch(error => {
      console.warn('Initial native notification handling failed:', error);
    });
    consumePendingNativeNotificationPayload().catch(error => {
      console.warn('Pending native notification handling failed:', error);
    });
  }, [initialNotificationPayload]);

  React.useEffect(() => registerNativeNotificationOpenHandler(), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
