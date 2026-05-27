/**
 * OnboardingScreen — 워크스루 슬라이드 (3장)
 *
 * FlatList 기반 가로 스크롤 + 페이지 인디케이터
 * 마지막 슬라이드에서 "시작하기" → 로그인 화면
 *
 * @wireframe temp/screen-onboarding.html
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  ViewToken,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { setOnboarded } from '@/utils/storage';
import {
  DSButton,
  DSChip,
  DSIcon,
  DSText,
  type DSIconName,
} from '@/design-system';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface SlideData {
  id: string;
  icon: DSIconName;
  title: string;
  highlight: string;
  description: string;
  badgeText: string;
  badgeIcon: DSIconName;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    icon: 'camera',
    title: '사진 한 장으로',
    highlight: '신선도 판별',
    description:
      'Vision AI가 잉여 농산물의 상태를 분석하고\n가장 가까운 이웃에게 실시간으로 알려드려요.',
    badgeText: 'Vision AI Scanning',
    badgeIcon: 'flask',
  },
  {
    id: '2',
    icon: 'location-dot',
    title: '반경 2km 내',
    highlight: '로컬 매칭',
    description:
      'GIS 기반 알고리즘이 가장 가까운\n이웃에게 자동으로 알림을 보내드려요.',
    badgeText: '반경 2.0km 내 탐색',
    badgeIcon: 'map-location-dot',
  },
  {
    id: '3',
    icon: 'house-chimney',
    title: '우리 동네',
    highlight: '공유 냉장고',
    description:
      '가까운 공유 냉장고에 식재료를 보관하고\n이웃과 함께 나눠보세요.',
    badgeText: '실시간 냉장고 현황',
    badgeIcon: 'temperature-half',
  },
];

const OnboardingScreen = ({ navigation }: Props) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await handleFinish();
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const handleFinish = async () => {
    await setOnboarded();
    navigation.replace('Login');
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={styles.slide}>
      {/* 일러스트 카드 */}
      <View style={styles.illustrationCard}>
        <DSIcon name={item.icon} size={88} color="primary" />

        {/* 떠있는 뱃지 */}
        <DSChip
          label={item.badgeText}
          tone="primary"
          size="small"
          leading={
            <DSIcon name={item.badgeIcon} size="xsmall" color="primary" />
          }
          style={styles.floatingBadge}
        />
      </View>

      {/* 텍스트 */}
      <View style={styles.textSection}>
        <DSText variant="heading1" color="primary" style={styles.slideTitle}>
          {item.title}
          {'\n'}
          <DSText variant="heading1" style={styles.slideHighlight}>
            {item.highlight}
          </DSText>
          {'부터 나눔까지'}
        </DSText>
        <DSText
          variant="body"
          color="textSecondary"
          align="center"
          style={styles.slideDescription}>
          {item.description}
        </DSText>
      </View>
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* 건너뛰기 버튼 */}
      <DSButton
        label="건너뛰기"
        variant="text"
        color="assistive"
        size="small"
        style={styles.skipButton}
        textStyle={styles.skipText}
        onPress={handleSkip}
      />

      {/* 슬라이드 */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* 페이지 인디케이터 */}
      <View style={styles.indicatorContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex
                ? styles.indicatorActive
                : styles.indicatorInactive,
            ]}
          />
        ))}
      </View>

      {/* 하단 CTA */}
      <View style={styles.footer}>
        <DSButton
          label={isLastSlide ? '시작하기' : '다음으로'}
          size="large"
          fullWidth
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
          onPress={handleNext}
        />

        <DSButton
          label="이미 계정이 있으신가요?"
          variant="text"
          color="assistive"
          size="medium"
          trailing={
            <DSText variant="bodyBold" style={styles.loginLinkBold}>
              로그인
            </DSText>
          }
          accessibilityLabel="이미 계정이 있으신가요? 로그인"
          style={styles.loginLink}
          textStyle={styles.loginLinkText}
          onPress={() => navigation.replace('Login')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    paddingTop: 96,
    alignItems: 'center',
  },
  illustrationCard: {
    width: width - 48,
    aspectRatio: 1,
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  floatingBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textSection: {
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: 'center',
  },
  slideTitle: {
    textAlign: 'center',
    lineHeight: 36,
  },
  slideHighlight: {
    color: colors.secondary,
  },
  slideDescription: {
    marginTop: 16,
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 24,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  nextButton: {
    minHeight: 60,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 18,
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: '600',
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default OnboardingScreen;
