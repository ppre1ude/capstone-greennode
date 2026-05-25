/**
 * SplashScreen — 앱 최초 진입
 *
 * 1. 로고 + 슬로건 표시
 * 2. AsyncStorage에서 JWT 토큰 검증
 * 3. 분기: 온보딩 / 로그인 / 홈
 *
 * @wireframe wireframe-foodlink/splash.html
 */
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@/navigation/types';
import {useAuthStore} from '@/store/authStore';
import {hasOnboarded} from '@/utils/storage';
import {flushPendingNotificationNavigation} from '@/services/notifications';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const SplashScreen = ({navigation}: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    // 로고 페이드인 + 스케일 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 토큰 체크 + 분기 (1.5초 후)
    const timer = setTimeout(async () => {
      await checkAuth();
    }, 1500);

    return () => clearTimeout(timer);
  }, [checkAuth, fadeAnim, scaleAnim]);

  useEffect(() => {
    const authState = useAuthStore.getState();
    if (authState.isLoading) {return;}

    const doNavigate = async () => {
      if (authState.isLoggedIn) {
        // 로그인됨 → 위치 유무에 따라 분기
        // AuthStack을 벗어나서 RootStack 레벨로 이동
        const rootNav = navigation.getParent();
        if (rootNav) {
          if (authState.hasLocation) {
            rootNav.reset({index: 0, routes: [{name: 'Main'}]});
          } else {
            rootNav.reset({index: 0, routes: [{name: 'LocationSetup'}]});
          }
          requestAnimationFrame(flushPendingNotificationNavigation);
        }
      } else {
        const onboarded = await hasOnboarded();
        if (onboarded) {
          navigation.replace('Login');
        } else {
          navigation.replace('Onboarding');
        }
      }
    };

    doNavigate();
  }, [isLoading, isLoggedIn, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Animated.View
        style={[
          styles.logoSection,
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
        ]}>
        {/* 로고 아이콘 */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🍃</Text>
        </View>

        <Text style={styles.appName}>FoodLink</Text>
        <Text style={styles.tagline}>
          버려지는 식재료에{'\n'}새로운 가치를 더하는{'\n'}가장 쉬운 방법
        </Text>
      </Animated.View>

      {/* 하단 로딩 인디케이터 */}
      <Animated.View style={[styles.loadingSection, {opacity: fadeAnim}]}>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map(i => (
            <LoadingDot key={i} delay={i * 200} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

/** 로딩 점 애니메이션 컴포넌트 */
const LoadingDot = ({delay}: {delay: number}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, {opacity}]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 42,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  loadingSection: {
    position: 'absolute',
    bottom: 80,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});

export default SplashScreen;
