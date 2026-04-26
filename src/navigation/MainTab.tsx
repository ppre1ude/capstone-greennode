/**
 * 메인 하단 탭 네비게이터
 * 홈 | 지도 | AI 스캔 (중앙 FAB) | 채팅 | 내 정보
 *
 * @wireframe wireframe-foodlink/homescreen.html (하단바)
 */
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {MainTabParamList} from './types';
import {colors} from '@/theme';

import HomeScreen from '@/screens/home/HomeScreen';

// 임시 Placeholder 화면들 (Phase 3~6에서 교체 예정)
const PlaceholderScreen = ({title}: {title: string}) => (
  <View style={placeholderStyles.container}>
    <Text style={placeholderStyles.emoji}>🚧</Text>
    <Text style={placeholderStyles.title}>{title}</Text>
    <Text style={placeholderStyles.subtitle}>곧 만나요!</Text>
  </View>
);

const MapPlaceholder = () => <PlaceholderScreen title="지도" />;
const CameraPlaceholder = () => <PlaceholderScreen title="AI 스캔" />;
const ChatPlaceholder = () => <PlaceholderScreen title="채팅" />;
const ProfilePlaceholder = () => <PlaceholderScreen title="내 정보" />;

const Tab = createBottomTabNavigator<MainTabParamList>();

/** 중앙 FAB 카메라 버튼 */
const CameraTabButton = ({onPress}: {onPress?: () => void}) => (
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
  Chat: {active: '💬', inactive: '💬'},
  Profile: {active: '👤', inactive: '👤'},
};

const MainTab = () => {
  return (
    <Tab.Navigator
      screenOptions={({route, navigation}) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({focused}) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Text style={styles.tabIcon}>
              {focused ? icons?.active : icons?.inactive}
            </Text>
          );
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarLabel: '홈'}}
      />
      <Tab.Screen
        name="Map"
        component={MapPlaceholder}
        options={{tabBarLabel: '지도'}}
      />
      {/* 
        카메라 탭: 실제 화면은 RootStack의 CameraScan을 띄웁니다.
        여기서는 탭 바에 버튼만 렌더링하기 위해 더미 리스너를 사용합니다.
      */}
      <Tab.Screen
        name="CameraDummy"
        component={CameraPlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarButton: props => (
            <CameraTabButton 
              onPress={() => {
                // RootStack으로 이동
                // @ts-ignore
                props.onPress?.({} as any);
              }} 
            />
          ),
        }}
        listeners={({navigation}) => ({
          tabPress: e => {
            e.preventDefault();
            // RootStack의 CameraScan으로 이동
            navigation.getParent()?.navigate('CameraScan');
          },
        })}
      />
      <Tab.Screen
        name="Chat"
        component={ChatPlaceholder}
        options={{tabBarLabel: '채팅'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePlaceholder}
        options={{tabBarLabel: '내정보'}}
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
