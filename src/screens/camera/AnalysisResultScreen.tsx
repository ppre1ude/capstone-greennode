/**
 * AnalysisResultScreen — AI 분석 결과 화면 (Phase 3)
 *
 * CameraScanScreen에서 촬영/업로드한 이미지의 AI 분석 결과를 보여줌
 * - 신선도 점수, 품질 평가
 * - 나눔 권장/불가 여부
 * - 다시 촬영하기 or 이대로 나눔하기
 *
 * @wireframe wireframe-foodlink/scanpage2.html
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResult'>;

const AnalysisResultScreen = ({route, navigation}: Props) => {
  const {result, imageUri} = route.params;

  const isFresh = result.aiAnalysis?.isFresh ?? false;
  const score = result.aiAnalysis?.confidenceScore ?? 0;
  const analysisMessage = result.aiAnalysis?.analysisMessage ?? '분석 결과를 불러올 수 없습니다.';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>분석 결과</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 이미지 섹션 */}
        <View style={styles.imageSection}>
          <Image source={{uri: imageUri}} style={styles.scannedImage} />

          {/* AI 결과 뱃지 */}
          <View style={styles.resultBadgeContainer}>
            <View
              style={[
                styles.resultBadge,
                !isFresh && {backgroundColor: colors.error},
              ]}>
              <Text style={styles.resultBadgeIcon}>{isFresh ? '✨' : '⚠️'}</Text>
              <Text style={styles.resultBadgeText}>
                {isFresh ? '나눔 권장' : '나눔 주의'}
              </Text>
            </View>
          </View>
        </View>

        {/* 상세 분석 내용 */}
        <View style={styles.analysisCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI 신선도 리포트</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{score}%</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 추천 카테고리 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>추천 카테고리</Text>
            <Text style={styles.infoValue}>{result.suggestedCategory || '식재료'}</Text>
          </View>

          {/* 종합 평가 */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>종합 평가</Text>
            <Text style={styles.summaryText}>{analysisMessage}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA (하단 고정) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retakeText}>다시 촬영</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !isFresh && {opacity: 0.6}]}
          onPress={() => {
            navigation.replace('PostCreate', {
              result,
              imageUri,
            });
          }}>
          <Text style={styles.nextText}>이대로 나눔하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 44 : 8,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerIcon: {
    fontSize: 22,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // 이미지
  imageSection: {
    position: 'relative',
    height: 320,
    backgroundColor: '#000000',
  },
  scannedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultBadgeContainer: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  resultBadgeIcon: {
    fontSize: 18,
  },
  resultBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 분석 카드
  analysisCard: {
    margin: 24,
    marginTop: 48, // 뱃지 자리 비우기
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // 하단 버튼
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AnalysisResultScreen;
