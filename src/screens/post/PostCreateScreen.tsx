/**
 * PostCreateScreen — 나눔 식재료 정보 입력 폼
 *
 * AnalysisResultScreen에서 "이대로 나눔하기" 선택 시 진입.
 * AI가 판별한 식재료명과 신선도 결과를 확인한 뒤 공유 냉장고를 선택함.
 * 등록(다음) 버튼 누르면 냉장고 선택 화면(FridgeSelect)으로 이동.
 *
 * @wireframe wireframe-foodlink/scanapply.html
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSScreenFooter,
} from '@/design-system';
import {
  getExcludedDetections,
  getDetectionName,
  getDetectionSummary,
  getResultDetections,
  getShareableDetections,
} from '@/utils/aiDetections';
import {
  getGenerateResultQualityMeta,
  needsAnalysisReview,
} from '@/utils/postPolicy';
import { styles } from './PostCreateScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'PostCreate'>;

const PostCreateScreen = ({ route, navigation }: Props) => {
  const { result, imageUri } = route.params;
  const detectedCrop =
    result.detectedFruitKo ||
    result.aiAnalysis?.detectedFruitKo ||
    result.detectedFruit ||
    result.aiAnalysis?.detectedFruit ||
    '알 수 없음';
  const quality = getGenerateResultQualityMeta(result);
  const needsReview =
    quality.canShare &&
    (quality.label === '확인 필요' ||
      needsAnalysisReview(
        result.confidenceScore ?? result.aiAnalysis?.confidenceScore,
      ));
  const hasImageToken = Boolean(result.imageToken);
  const detections = useMemo(() => getResultDetections(result), [result]);
  const shareableDetections = useMemo(
    () => getShareableDetections(detections),
    [detections],
  );
  const excludedDetections = useMemo(
    () => getExcludedDetections(detections),
    [detections],
  );
  const showDetectionNotice = detections.length > 0;
  const registeredItemCount = detections.length > 0 ? shareableDetections.length : 1;
  const representativeName =
    shareableDetections.length > 1
      ? `${getDetectionName(shareableDetections[0])} 외 ${
          shareableDetections.length - 1
        }개`
      : shareableDetections[0]
      ? getDetectionName(shareableDetections[0])
      : detectedCrop;

  const handleNext = () => {
    if (!quality.canShare || !hasImageToken) {
      Alert.alert(
        '나눔 기준에 맞지 않아요',
        '이 식재료는 나눔 기준에 맞는 상태로 확인되지 않았어요. 다시 촬영해주세요.',
      );
      return;
    }

    navigation.navigate('FridgeSelect', {
      postData: {
        imageToken: result.imageToken as string,
        expirationDate: null,
      },
      qualityCategory:
        result.aiAnalysis?.category ?? result.freshnessLabel ?? undefined,
      qualityCanShare: quality.canShare,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <DSIcon name="angle-left" size="large" color="primary" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>나눔 등록</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 이미지 미리보기 */}
        <View style={styles.imagePreview}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <DSChip
            label="AI 분석 완료"
            tone="primary"
            style={styles.aiBadge}
            leading={
              <DSIcon
                name="wand-magic-sparkles"
                size="xsmall"
                color="primary"
              />
            }
          />
        </View>

        <View style={styles.form}>
          <DSCard padded={false} style={styles.analysisCard}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>판별 농산물</Text>
              <Text style={styles.analysisValue}>{detectedCrop}</Text>
            </View>
            <View style={styles.analysisDivider} />
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>상태 안내</Text>
              <Text style={styles.analysisValue}>{quality.label}</Text>
            </View>
          </DSCard>
          {needsReview && (
            <Text style={styles.reviewNotice}>
              AI가 나눔 가능으로 분석했지만 실제 상태를 직접 확인한 뒤
              등록해주세요.
            </Text>
          )}

          {showDetectionNotice ? (
            <DSCard
              variant="outlined"
              padded={false}
              style={styles.detectionCard}>
              <Text style={styles.detectionTitle}>등록될 식재료</Text>
              <Text style={styles.detectionHint}>
                {`${registeredItemCount}개 품목이 각각 나눔으로 등록됩니다.`}
              </Text>
              {shareableDetections.map((detection, index) => (
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
              {excludedDetections.map((detection, index) => (
                <View
                  key={`excluded-${getDetectionName(detection)}-${index}`}
                  style={[styles.detectionRow, styles.detectionRowExcluded]}>
                  <View style={styles.detectionExcludedCopy}>
                    <Text style={styles.detectionName} numberOfLines={1}>
                      {getDetectionName(detection)}
                    </Text>
                    <Text style={styles.detectionExcludedText}>
                      보관 기준에 맞지 않아 나눔 목록에서 제외됩니다.
                    </Text>
                  </View>
                  <Text style={styles.detectionMeta}>
                    {getDetectionSummary(detection)}
                  </Text>
                </View>
              ))}
            </DSCard>
          ) : null}

          <DSCard variant="outlined" padded={false} style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>나눔 식재료</Text>
            <Text style={styles.summaryName}>{representativeName}</Text>
            <Text style={styles.summaryDescription}>
              공유 냉장고를 선택하면 서버가 품목별 보관 기한을 계산하고 QR
              보관 인증 대기 상태로 생성됩니다.
            </Text>
          </DSCard>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <DSScreenFooter style={styles.footer}>
        <DSButton
          label={quality.canShare ? '다음 단계로' : '나눔 기준 미충족'}
          onPress={handleNext}
          disabled={!quality.canShare || !hasImageToken}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </DSScreenFooter>
    </KeyboardAvoidingView>
  );
};

export default PostCreateScreen;
