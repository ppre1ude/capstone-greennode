/**
 * 루트 앱 네비게이터
 * Auth 상태 + 위치 등록 여부에 따라 분기
 *
 * - 비로그인 → AuthStack
 * - 로그인 + 위치 미등록 → LocationSetup
 * - 로그인 + 위치 등록 → MainTab
 */
import React, {useEffect, useRef} from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';
import {rootNavigationRef} from './rootNavigation';
import {onUnauthorized} from '@/api/authEvents';
import {useAuthStore} from '@/store/authStore';
import {refreshDeviceRegistration} from '@/services/deviceRegistration';
import {
  flushPendingNotificationNavigation,
  registerForegroundNotificationHandlers,
} from '@/services/notifications';
import {rehydrateNotificationStore} from '@/store/notificationStore';

import AuthStack from './AuthStack';
import MainTab from './MainTab';
import LocationSetupScreen from '@/screens/location/LocationSetupScreen';
import CameraScanScreen from '@/screens/camera/CameraScanScreen';
import AnalysisResultScreen from '@/screens/camera/AnalysisResultScreen';
import PostCreateScreen from '@/screens/post/PostCreateScreen';
import FridgeSelectScreen from '@/screens/post/FridgeSelectScreen';
import PostCompleteScreen from '@/screens/post/PostCompleteScreen';
import PostDetailScreen from '@/screens/post/PostDetailScreen';
import MySharesScreen from '@/screens/profile/MySharesScreen';
import FridgeOperatorConsoleScreen from '@/screens/operator/FridgeOperatorConsoleScreen';
import InventoryQrPrototypeScreen from '@/screens/inventory/InventoryQrPrototypeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const user = useAuthStore(state => state.user);
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const logout = useAuthStore(state => state.logout);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    return onUnauthorized(async () => {
      await logout();
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.reset({index: 0, routes: [{name: 'Auth'}]});
      }
    });
  }, [logout]);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      return;
    }

    refreshDeviceRegistration(user).catch(error => {
      console.warn('Device registration refresh failed:', error);
    });
  }, [isLoggedIn, user]);

  useEffect(() => registerForegroundNotificationHandlers(), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasBackgrounded =
        appState.current === 'background' || appState.current === 'inactive';
      appState.current = nextAppState;

      if (wasBackgrounded && nextAppState === 'active') {
        rehydrateNotificationStore().catch(error => {
          console.warn('Notification store rehydration failed:', error);
        });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer
      ref={rootNavigationRef}
      onReady={flushPendingNotificationNavigation}
      onStateChange={flushPendingNotificationNavigation}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen
          name="LocationSetup"
          component={LocationSetupScreen}
          options={{gestureEnabled: false}}
        />
        <Stack.Screen
          name="Main"
          component={MainTab}
          options={{gestureEnabled: false}}
        />
        <Stack.Screen
          name="CameraScan"
          component={CameraScanScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="AnalysisResult"
          component={AnalysisResultScreen}
        />
        <Stack.Screen
          name="PostCreate"
          component={PostCreateScreen}
        />
        <Stack.Screen
          name="FridgeSelect"
          component={FridgeSelectScreen}
        />
        <Stack.Screen
          name="PostComplete"
          component={PostCompleteScreen}
          options={{gestureEnabled: false}}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
        />
        <Stack.Screen
          name="MyShares"
          component={MySharesScreen}
        />
        <Stack.Screen
          name="FridgeOperatorConsole"
          component={FridgeOperatorConsoleScreen}
        />
        <Stack.Screen
          name="InventoryQrPrototype"
          component={InventoryQrPrototypeScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
