/**
 * PostCompleteScreen — 나눔 식재료 등록 완료 화면
 *
 * 나눔 등록 성공 시 띄워주는 피드백 화면.
 * Lottie 또는 애니메이션 처리 가능, MVP에서는 단순 아이콘과 텍스트 제공.
 * 하단 버튼을 통해 홈 화면으로 복귀.
 *
 * @wireframe wireframe-foodlink/scancomplete.html
 */
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostComplete'>;

const PostCompleteScreen = ({route, navigation}: Props) => {
  const {postId} = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  const handleGoHome = () => {
    // RootStack을 처음부터 리셋하고 홈 탭에 재조회 신호를 전달한다.
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          params: {
            screen: 'Home',
            params: {
              completedPostId: postId,
              nearbyPostsRefreshToken: Date.now(),
            },
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconCircle,
            {transform: [{scale: scaleAnim}], opacity: opacityAnim},
          ]}>
          <Text style={styles.icon}>🎉</Text>
        </Animated.View>

        <Animated.View
          style={[styles.resultContent, {opacity: opacityAnim}]}>
          <Text style={styles.title}>나눔 등록 완료!</Text>
          <Text style={styles.subtitle}>
            선택하신 냉장고 주변 이웃들에게{'\n'}나눔 알림을 보낼 준비를 했어요.
          </Text>

          {/* 알림 카드 */}
          <View style={styles.pushCard}>
            <View style={styles.pushHeader}>
              <Text style={styles.pushIcon}>🔔</Text>
              <Text style={styles.pushAppName}>FoodLink</Text>
              <Text style={styles.pushTime}>등록 직후</Text>
            </View>
            <Text style={styles.pushTitle}>새로운 나눔이 등록되었어요!</Text>
            <Text style={styles.pushBody}>근처 공유 냉장고에 나눔 식재료가 등록되었습니다.</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 56,
  },
  resultContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  // 알림 안내 미리보기 UI
  pushCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  pushHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pushIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  pushAppName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    flex: 1,
  },
  pushTime: {
    fontSize: 12,
    color: '#999999',
  },
  pushTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pushBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // 하단
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  homeButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PostCompleteScreen;
