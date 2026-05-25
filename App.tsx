/**
 * FoodLink — React Native App Entry Point
 */
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
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

const initialSafeAreaMetrics = initialWindowMetrics ?? {
  frame: {x: 0, y: 0, width: 0, height: 0},
  insets: {top: 0, right: 0, bottom: 0, left: 0},
};

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
      <SafeAreaProvider initialMetrics={initialSafeAreaMetrics}>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
