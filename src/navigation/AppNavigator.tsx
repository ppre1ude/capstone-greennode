/**
 * 루트 앱 네비게이터
 * Auth 상태에 따라 AuthStack 또는 Main(추후)을 분기
 */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';

import AuthStack from './AuthStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Auth" component={AuthStack} />
        {/* Phase 2에서 추가:
        <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
        <Stack.Screen name="Main" component={MainTab} />
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
