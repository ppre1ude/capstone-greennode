/**
 * PostCompleteScreen — 나눔 식재료 등록 완료 화면
 *
 * 나눔 등록 성공 시 띄워주는 피드백 화면.
 * Lottie 또는 애니메이션 처리 가능, MVP에서는 단순 아이콘과 텍스트 제공.
 * 하단 버튼을 통해 홈 화면으로 복귀.
 *
 * @wireframe wireframe-foodlink/scancomplete.html
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  DSButton,
  DSCard,
  DSIcon,
  DSScreenFooter,
  DSText,
} from '@/design-system';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostComplete'>;

const PostCompleteScreen = ({ route, navigation }: Props) => {
  const { postId } = route.params;
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
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}>
          <DSIcon name="circle-check" size={56} color="primary" />
        </Animated.View>

        <Animated.View style={[styles.resultContent, { opacity: opacityAnim }]}>
          <DSText variant="heading1" color="textOnPrimary" style={styles.title}>
            나눔 등록 완료!
          </DSText>
          <DSText
            variant="body"
            color="textOnPrimary"
            align="center"
            style={styles.subtitle}>
            선택하신 냉장고 주변 이웃들에게{'\n'}나눔 알림을 보낼 준비를 했어요.
          </DSText>

          {/* 알림 카드 */}
          <DSCard variant="elevated" padded={false} style={styles.pushCard}>
            <View style={styles.pushHeader}>
              <DSIcon
                name="bell"
                size="small"
                color="textSecondary"
                style={styles.pushIcon}
              />
              <DSText
                variant="caption"
                color="textSecondary"
                style={styles.pushAppName}>
                FoodLink
              </DSText>
              <DSText variant="small" color="textTertiary">
                등록 직후
              </DSText>
            </View>
            <DSText
              variant="bodyBold"
              color="textPrimary"
              style={styles.pushTitle}>
              새로운 나눔이 등록되었어요!
            </DSText>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.pushBody}>
              근처 공유 냉장고에 나눔 식재료가 등록되었습니다.
            </DSText>
          </DSCard>
        </Animated.View>
      </View>

      <DSScreenFooter style={styles.footer}>
        <DSButton
          label="홈으로 돌아가기"
          color="assistive"
          fullWidth
          onPress={handleGoHome}
          textStyle={styles.homeButtonText}
          style={styles.homeButton}
        />
      </DSScreenFooter>
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  resultContent: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  subtitle: {
    lineHeight: 24,
    marginBottom: 48,
    opacity: 0.9,
  },
  // 알림 안내 미리보기 UI
  pushCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    marginRight: 6,
  },
  pushAppName: {
    flex: 1,
  },
  pushTitle: {
    marginBottom: 4,
  },
  pushBody: {
    lineHeight: 20,
  },
  // 하단
  footer: {
    backgroundColor: colors.primary,
    borderTopWidth: 0,
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
  },
  homeButtonText: {
    color: colors.primary,
  },
});

export default PostCompleteScreen;
