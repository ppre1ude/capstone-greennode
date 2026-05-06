/**
 * 메인 하단 탭 네비게이터
 * 홈 | 지도 | AI 스캔 (중앙 FAB) | 알림 | 내 정보
 *
 * @wireframe wireframe-foodlink/homescreen.html (하단바)
 */
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {MainTabParamList} from './types';
import {colors} from '@/theme';
import {useAuthStore} from '@/store/authStore';
import {hasRegisteredLocation} from '@/utils/locationGuard';

import HomeScreen from '@/screens/home/HomeScreen';
import MapScreen from '@/screens/map/MapScreen';
import ChatListScreen from '@/screens/chat/ChatListScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

const CameraPlaceholder = () => (
  <View style={placeholderStyles.container}>
    <Text style={placeholderStyles.emoji}>📷</Text>
    <Text style={placeholderStyles.title}>AI 스캔</Text>
  </View>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

/** 중앙 FAB 카메라 버튼 */
const CameraTabButton = ({
  onPress,
}: {
  onPress?: React.ComponentProps<typeof TouchableOpacity>['onPress'];
}) => (
  <TouchableOpacity style={fabStyles.wrapper} onPress={onPress}>
    <View style={fabStyles.button}>
      <Text style={fabStyles.icon}>📷</Text>
    </View>
    <Text style={fabStyles.label}>AI 스캔</Text>
  </TouchableOpacity>
);

/** 탭 아이콘 매핑 */
const TAB_ICONS: Record<string, {active: string; inactive: string}> = {
  Home: {active: '🏠', inactive: '🏡'},
  Map: {active: '🗺️', inactive: '🗺️'},
  CameraScan: {active: '📷', inactive: '📷'},
  Chat: {active: '🔔', inactive: '🔔'},
  Profile: {active: '👤', inactive: '👤'},
};

const TabIcon = ({
  routeName,
  focused,
}: {
  routeName: keyof MainTabParamList;
  focused: boolean;
}) => {
  const icons = TAB_ICONS[routeName];
  return (
    <Text style={styles.tabIcon}>
      {focused ? icons?.active : icons?.inactive}
    </Text>
  );
};

const homeIcon = ({focused}: {focused: boolean}) => (
  <TabIcon routeName="Home" focused={focused} />
);

const mapIcon = ({focused}: {focused: boolean}) => (
  <TabIcon routeName="Map" focused={focused} />
);

const chatIcon = ({focused}: {focused: boolean}) => (
  <TabIcon routeName="Chat" focused={focused} />
);

const profileIcon = ({focused}: {focused: boolean}) => (
  <TabIcon routeName="Profile" focused={focused} />
);

const emptyLabel = () => null;

const cameraTabButton = ({
  onPress,
}: {
  onPress?: React.ComponentProps<typeof TouchableOpacity>['onPress'];
}) => (
  <CameraTabButton onPress={onPress} />
);

const MainTab = () => {
  const user = useAuthStore(state => state.user);
  const hasLocation = hasRegisteredLocation(user);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarLabel: '홈', tabBarIcon: homeIcon}}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{tabBarLabel: '지도', tabBarIcon: mapIcon}}
      />
      {/* 
        카메라 탭: 실제 화면은 RootStack의 CameraScan을 띄웁니다.
        여기서는 탭 바에 버튼만 렌더링하기 위해 더미 리스너를 사용합니다.
      */}
      <Tab.Screen
        name="CameraDummy"
        component={CameraPlaceholder}
        options={{
          tabBarLabel: emptyLabel,
          tabBarButton: cameraTabButton,
        }}
        listeners={({navigation}) => ({
          tabPress: e => {
            e.preventDefault();
            if (!hasLocation) {
              navigation.getParent()?.navigate('LocationSetup', {allowBack: true});
              return;
            }
            // RootStack의 CameraScan으로 이동
            navigation.getParent()?.navigate('CameraScan');
          },
        })}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{tabBarLabel: '알림', tabBarIcon: chatIcon}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{tabBarLabel: '내정보', tabBarIcon: profileIcon}}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 84,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 22,
  },
});

const fabStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -20,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
});

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});

export default MainTab;
