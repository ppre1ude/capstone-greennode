/**
 * AnalysisResultScreen — AI 분석 결과 화면 (Phase 3)
 *
 * CameraScanScreen에서 촬영/업로드한 이미지의 AI 분석 결과를 보여줌
 * - 신선도 등급, 상태 안내
 * - 나눔 가능/나눔 기준 미충족 여부
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSScreenFooter,
  DSText,
} from '@/design-system';
import { colors } from '@/theme';
import {
  getDetectionName,
  getDetectionSummary,
  getResultDetections,
} from '@/utils/aiDetections';
import {
  getConfidencePercent,
  getGenerateResultQualityMeta,
  needsAnalysisReview,
} from '@/utils/postPolicy';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResult'>;

const AnalysisResultScreen = ({ route, navigation }: Props) => {
  const { result, imageUri } = route.params;

  const quality = getGenerateResultQualityMeta(result);
  const confidencePercent = getConfidencePercent(
    result.confidenceScore ?? result.aiAnalysis?.confidenceScore,
  );
  const needsReview =
    quality.canShare &&
    (quality.label === '확인 필요' ||
      needsAnalysisReview(
        result.confidenceScore ?? result.aiAnalysis?.confidenceScore,
      ));
  const hasImageToken = Boolean(result.imageToken);
  const canProceed = quality.canShare && hasImageToken;
  const statusLabel = !quality.canShare
    ? quality.label
    : needsReview
    ? '확인 필요'
    : '나눔 가능';
  const detectedCrop =
    result.detectedFruitKo ||
    result.aiAnalysis?.detectedFruitKo ||
    result.detectedFruit ||
    result.aiAnalysis?.detectedFruit ||
    '알 수 없음';
  const analysisMessage =
    result.aiAnalysis?.analysisMessage || '분석 결과를 불러올 수 없습니다.';
  const detections = getResultDetections(result);
  const showMultiObjectNotice = detections.length > 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <DSIcon name="angle-left" size="large" color="primary" />
        </TouchableOpacity>
        <DSText
          variant="bodyBold"
          color="textPrimary"
          style={styles.headerTitle}>
          분석 결과
        </DSText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 이미지 섹션 */}
        <View style={styles.imageSection}>
          <Image source={{ uri: imageUri }} style={styles.scannedImage} />
          {/* AI result badge */}
          <View style={styles.resultBadgeContainer}>
            <DSChip
              label={statusLabel}
              tone={
                !quality.canShare
                  ? 'error'
                  : needsReview
                  ? 'warning'
                  : 'primary'
              }
              size="large"
              leading={
                <DSIcon
                  name={
                    quality.canShare && !needsReview
                      ? 'circle-check'
                      : 'circle-exclamation'
                  }
                  size="small"
                  color={
                    !quality.canShare
                      ? 'error'
                      : needsReview
                      ? 'warning'
                      : 'primary'
                  }
                />
              }
              style={styles.resultBadge}
            />
          </View>
        </View>

        {/* analysis content */}
        <DSCard variant="elevated" padded={false} style={styles.analysisCard}>
          <View style={styles.cardHeader}>
            <DSText
              variant="bodyBold"
              color="textPrimary"
              style={styles.cardTitle}>
              AI 분석 결과
            </DSText>
            <DSChip
              label={needsReview ? '확인 필요' : quality.label}
              tone={needsReview ? 'warning' : 'primary'}
              variant="outlined"
              size="large"
              style={[
                styles.qualityPill,
                needsReview && styles.qualityPillWarning,
              ]}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.infoLabel}>
              판별 농산물
            </DSText>
            <DSText
              variant="bodyBold"
              color="textPrimary"
              style={styles.infoValue}>
              {detectedCrop}
            </DSText>
          </View>

          <View style={styles.infoRow}>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.infoLabel}>
              상태 안내
            </DSText>
            <DSText
              variant="bodyBold"
              color="textPrimary"
              style={styles.infoValue}>
              {quality.label}
            </DSText>
          </View>

          <View style={styles.infoRow}>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.infoLabel}>
              AI 참고 신호
            </DSText>
            <DSText
              variant="bodyBold"
              color="textPrimary"
              style={styles.infoValue}>
              {confidencePercent != null ? `${confidencePercent}%` : '미제공'}
            </DSText>
          </View>

          {showMultiObjectNotice ? (
            <View style={styles.detectionBox}>
              <Text style={styles.detectionTitle}>감지된 식재료 후보</Text>
              <Text style={styles.detectionHint}>
                이번 등록은 대표 식재료 1개 기준으로 진행합니다.
              </Text>
              {detections.map((detection, index) => (
                <View
                  key={`${getDetectionName(detection)}-${index}`}
                  style={styles.detectionRow}>
                  <Text style={styles.detectionName} numberOfLines={1}>
                    {getDetectionName(detection)}
                  </Text>
                  <Text style={styles.detectionMeta}>
                    {getDetectionSummary(detection)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {needsReview && (
            <DSCard
              variant="plain"
              padded={false}
              style={[styles.summaryBox, styles.reviewBox]}>
              <DSText
                variant="caption"
                color="warning"
                style={styles.reviewTitle}>
                확인 필요
              </DSText>
              <DSText
                variant="caption"
                color="textSecondary"
                style={styles.summaryText}>
                AI가 나눔 가능으로 분석했지만 실제 상태를 직접 확인한 뒤
                등록해주세요.
              </DSText>
            </DSCard>
          )}

          <DSCard variant="plain" padded={false} style={styles.summaryBox}>
            <DSText
              variant="caption"
              color="primary"
              style={styles.summaryTitle}>
              분석 메모
            </DSText>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.summaryText}>
              {analysisMessage}
            </DSText>
          </DSCard>
        </DSCard>
      </ScrollView>

      {/* CTA (하단 고정) */}
      <DSScreenFooter style={styles.footer}>
        <DSButton
          label="다시 촬영"
          variant="outlined"
          color="assistive"
          fullWidth
          style={styles.retakeButton}
          onPress={() => navigation.goBack()}
        />

        <DSButton
          label={canProceed ? '이대로 나눔하기' : '나눔 기준 미충족'}
          fullWidth
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          disabled={!canProceed}
          onPress={() => {
            navigation.replace('PostCreate', {
              result,
              imageUri,
            });
          }}
        />
      </DSScreenFooter>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowOffset: { width: 0, height: 2 },
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
  qualityPill: {
    minWidth: 64,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 12,
  },
  qualityPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  qualityPillWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.warning,
  },
  qualityPillWarningText: {
    color: colors.warning,
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
  detectionBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  detectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  detectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  detectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detectionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  reviewBox: {
    backgroundColor: '#FEF3C7',
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 8,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AnalysisResultScreen;
