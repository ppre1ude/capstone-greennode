/**
 * 루트 앱 네비게이터
 * Auth 상태 + 위치 등록 여부에 따라 분기
 *
 * - 비로그인 → AuthStack
 * - 로그인 + 위치 미등록 → LocationSetup
 * - 로그인 + 위치 등록 → MainTab
 */
import React, {useCallback, useEffect, useRef} from 'react';
import {
  AppState,
  Linking,
  type AppStateStatus,
} from 'react-native';
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
import ShareFeedbackScreen from '@/screens/trust/ShareFeedbackScreen';
import MySharesScreen from '@/screens/profile/MySharesScreen';
import FridgeOperatorConsoleScreen from '@/screens/operator/FridgeOperatorConsoleScreen';
import InventoryQrScreen from '@/screens/inventory/InventoryQrScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

type DemoDeepLinkRoute =
  | {name: 'Main'; params: RootStackParamList['Main']}
  | {name: 'InventoryQr'; params: RootStackParamList['InventoryQr']}
  | {name: 'PostDetail'; params: RootStackParamList['PostDetail']}
  | {
      name: 'FridgeOperatorConsole';
      params: RootStackParamList['FridgeOperatorConsole'];
    }
  | {name: 'MyShares'; params: RootStackParamList['MyShares']};

const parseQueryParams = (url: string) => {
  const queryStart = url.indexOf('?');
  if (queryStart < 0) {
    return {} as Record<string, string>;
  }

  return url
    .slice(queryStart + 1)
    .split('&')
    .filter(Boolean)
    .reduce<Record<string, string>>((params, pair) => {
      const [rawKey, rawValue = ''] = pair.split('=');
      if (!rawKey) {
        return params;
      }

      try {
        params[decodeURIComponent(rawKey)] = decodeURIComponent(
          rawValue.replace(/\+/g, ' '),
        );
      } catch {
        params[rawKey] = rawValue;
      }

      return params;
    }, {});
};

const optionalQueryValue = (
  params: Record<string, string>,
  key: string,
): string | undefined => {
  const value = params[key]?.trim();
  return value ? value : undefined;
};

export const parseFoodlinkDeepLink = (
  url?: string | null,
): DemoDeepLinkRoute | null => {
  if (!url?.startsWith('foodlink://')) {
    return null;
  }

  const pathEnd = url.indexOf('?');
  const rawPath = (pathEnd >= 0 ? url.slice(0, pathEnd) : url).replace(
    /^foodlink:\/+/,
    '',
  );
  const parts = rawPath.split('/').filter(Boolean);
  const queryParams = parseQueryParams(url);

  if (parts[0] === 'home') {
    const completedPostId = Number(queryParams.completedPostId);

    return {
      name: 'Main',
      params: {
        screen: 'Home',
        params: Number.isFinite(completedPostId)
          ? {completedPostId}
          : undefined,
      },
    };
  }

  if (parts[0] === 'inventory') {
    const mode = parts[1] === 'pickup' ? 'pickup' : 'store';
    const postId = Number(parts[2]);

    if (!Number.isFinite(postId)) {
      return null;
    }

    return {
      name: 'InventoryQr',
      params: {
        mode,
        postId,
        fridgePublicCode: optionalQueryValue(queryParams, 'fridgePublicCode'),
        fridgeName: optionalQueryValue(queryParams, 'fridgeName'),
        fridgeLocation: optionalQueryValue(queryParams, 'fridgeLocation'),
        pendingExpiresAt: optionalQueryValue(queryParams, 'pendingExpiresAt'),
      },
    };
  }

  if (parts[0] === 'posts') {
    const postId = Number(parts[1]);
    return Number.isFinite(postId)
      ? {
          name: 'PostDetail',
          params: {postId},
        }
      : null;
  }

  if (parts[0] === 'operator' && parts[1] === 'fridges') {
    const fridgeId = Number(parts[2]);
    return {
      name: 'FridgeOperatorConsole',
      params: {
        fridgeId: Number.isFinite(fridgeId) ? fridgeId : undefined,
        fridgeName: optionalQueryValue(queryParams, 'fridgeName'),
      },
    };
  }

  if (parts[0] === 'my-shares') {
    const initialTab = queryParams.initialTab === 'received'
      ? 'received'
      : queryParams.initialTab === 'posted'
        ? 'posted'
        : undefined;

    return {
      name: 'MyShares',
      params: initialTab ? {initialTab} : undefined,
    };
  }

  return null;
};

export const buildFoodlinkDeepLinkResetState = (route: DemoDeepLinkRoute) =>
  route.name === 'Main'
    ? {
        index: 0,
        routes: [route],
      }
    : {
        index: 1,
        routes: [{name: 'Main' as const}, route],
      };

const AppNavigator = () => {
  const user = useAuthStore(state => state.user);
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const logout = useAuthStore(state => state.logout);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const pendingDeepLinkRoute = useRef<DemoDeepLinkRoute | null>(null);

  const consumePendingDeepLink = useCallback(() => {
    if (!isLoggedIn || !user || !rootNavigationRef.isReady()) {
      return;
    }

    const route = pendingDeepLinkRoute.current;
    if (!route) {
      return;
    }

    pendingDeepLinkRoute.current = null;
    rootNavigationRef.reset(buildFoodlinkDeepLinkResetState(route));
  }, [isLoggedIn, user]);
  const consumePendingDeepLinkRef = useRef(consumePendingDeepLink);

  useEffect(() => {
    consumePendingDeepLinkRef.current = consumePendingDeepLink;
  }, [consumePendingDeepLink]);

  const queueDeepLink = useCallback((url?: string | null) => {
    const route = parseFoodlinkDeepLink(url);
    if (!route) {
      return;
    }

    pendingDeepLinkRoute.current = route;
    setTimeout(() => {
      consumePendingDeepLinkRef.current();
    }, 0);
  }, []);

  useEffect(() => {
    return onUnauthorized(async () => {
      await logout();
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.reset({index: 0, routes: [{name: 'Auth'}]});
      }
    });
  }, [logout]);

  useEffect(() => {
    consumePendingDeepLink();
  }, [consumePendingDeepLink]);

  useEffect(() => {
    Linking.getInitialURL()
      .then(queueDeepLink)
      .catch(error => {
        console.warn('Failed to read initial deep link:', error);
      });

    const subscription = Linking.addEventListener('url', event => {
      queueDeepLink(event.url);
    });

    return () => subscription.remove();
  }, [queueDeepLink]);

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
      onReady={() => {
        flushPendingNotificationNavigation();
        consumePendingDeepLink();
      }}
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
          name="ShareFeedback"
          component={ShareFeedbackScreen}
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
          name="InventoryQr"
          component={InventoryQrScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
