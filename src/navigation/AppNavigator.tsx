/**
 * 루트 앱 네비게이터
 * Auth 상태 + 위치 등록 여부에 따라 분기
 *
 * - 비로그인 → AuthStack
 * - 로그인 + 위치 미등록 → LocationSetup
 * - 로그인 + 위치 등록 → MainTab
 */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';

import AuthStack from './AuthStack';
import MainTab from './MainTab';
import LocationSetupScreen from '@/screens/location/LocationSetupScreen';
import CameraScanScreen from '@/screens/camera/CameraScanScreen';
import AnalysisResultScreen from '@/screens/camera/AnalysisResultScreen';
import PostCreateScreen from '@/screens/post/PostCreateScreen';
import FridgeSelectScreen from '@/screens/post/FridgeSelectScreen';
import PostCompleteScreen from '@/screens/post/PostCompleteScreen';
import PostDetailScreen from '@/screens/post/PostDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
