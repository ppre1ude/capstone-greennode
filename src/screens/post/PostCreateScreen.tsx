/**
 * PostCreateScreen — 나눔 식재료 정보 입력 폼
 *
 * AnalysisResultScreen에서 "이대로 나눔하기" 선택 시 진입.
 * AI가 판별한 식재료명과 신선도 결과를 확인한 뒤 공유 냉장고를 선택함.
 * 등록(다음) 버튼 누르면 냉장고 선택 화면(FridgeSelect)으로 이동.
 *
 * @wireframe wireframe-foodlink/scanapply.html
 */
import React, { useEffect, useMemo, useState } from 'react';
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
  getDetectionName,
  getDetectionSummary,
  getResultDetections,
} from '@/utils/aiDetections';
import {
  getGenerateResultQualityMeta,
  needsAnalysisReview,
} from '@/utils/postPolicy';
import { styles } from './PostCreateScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'PostCreate'>;

const PICKUP_OFFSET_OPTIONS = [
  { label: '오늘', offsetDays: 0 },
  { label: '내일', offsetDays: 1 },
  { label: '3일 뒤', offsetDays: 3 },
] as const;

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateByOffset = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateOnly(date);
};

const getDetectionId = (detection?: { id?: string | number | null }) => {
  if (detection?.id == null) {
    return undefined;
  }

  return String(detection.id);
};

const getDefaultDetectionIndex = (
  detections: ReturnType<typeof getResultDetections>,
) => {
  const firstDetectionWithIdIndex = detections.findIndex(
    detection => detection.id != null,
  );

  return firstDetectionWithIdIndex >= 0 ? firstDetectionWithIdIndex : 0;
};

const PostCreateScreen = ({ route, navigation }: Props) => {
  const { result, imageUri } = route.params;
  const [selectedPickupOffsetDays, setSelectedPickupOffsetDays] = useState(3);
  const expirationDate = useMemo(
    () => getDateByOffset(selectedPickupOffsetDays),
    [selectedPickupOffsetDays],
  );
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
  const showMultiObjectNotice = detections.length > 1;
  const defaultDetectionIndex = useMemo(
    () => getDefaultDetectionIndex(detections),
    [detections],
  );
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState(
    defaultDetectionIndex,
  );
  useEffect(() => {
    setSelectedDetectionIndex(defaultDetectionIndex);
  }, [defaultDetectionIndex, detections]);
  const selectedDetection = showMultiObjectNotice
    ? detections[selectedDetectionIndex] ?? detections[defaultDetectionIndex]
    : undefined;
  const selectedDetectionId = getDetectionId(selectedDetection);
  const representativeName = selectedDetection
    ? getDetectionName(selectedDetection)
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
        expirationDate,
        ...(selectedDetectionId ? { selectedDetectionId } : {}),
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

          {showMultiObjectNotice ? (
            <DSCard
              variant="outlined"
              padded={false}
              style={styles.detectionCard}>
              <Text style={styles.detectionTitle}>감지된 식재료 후보</Text>
              <Text style={styles.detectionHint}>
                대표 식재료 1개를 선택해 등록합니다.
              </Text>
              {detections.map((detection, index) => (
                <TouchableOpacity
                  key={`${getDetectionName(detection)}-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: selectedDetectionIndex === index,
                  }}
                  onPress={() => setSelectedDetectionIndex(index)}
                  style={[
                    styles.detectionRow,
                    selectedDetectionIndex === index &&
                      styles.detectionRowSelected,
                  ]}>
                  <Text style={styles.detectionName} numberOfLines={1}>
                    {getDetectionName(detection)}
                  </Text>
                  <Text style={styles.detectionMeta}>
                    {getDetectionSummary(detection)}
                  </Text>
                </TouchableOpacity>
              ))}
            </DSCard>
          ) : null}

          <DSCard variant="outlined" padded={false} style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>나눔 식재료</Text>
            <Text style={styles.summaryName}>{representativeName}</Text>
            <Text style={styles.summaryDescription}>
              공유 냉장고를 선택하면 QR 보관 인증 대기 상태로 생성됩니다.
            </Text>
          </DSCard>

          <View style={styles.field}>
            <View style={styles.dateLabelRow}>
              <Text style={styles.dateLabel}>권장 수령일</Text>
              <Text style={styles.dateLimit}>최대 3일</Text>
            </View>
            <DSCard variant="outlined" padded={false} style={styles.dateCard}>
              <View style={styles.dateIcon}>
                <DSIcon name="clock" size="small" color="primary" />
              </View>
              <View style={styles.dateCopy}>
                <Text style={styles.dateValue}>{expirationDate}</Text>
                <Text style={styles.dateCaption}>
                  앱이 제안한 수령 권장일입니다.
                </Text>
              </View>
            </DSCard>
            <View style={styles.dateOptions}>
              {PICKUP_OFFSET_OPTIONS.map(option => (
                <DSChip
                  key={option.offsetDays}
                  label={option.label}
                  size="large"
                  tone="primary"
                  selected={selectedPickupOffsetDays === option.offsetDays}
                  onPress={() =>
                    setSelectedPickupOffsetDays(option.offsetDays)
                  }
                  accessibilityLabel={`${option.label}로 권장 수령일 설정`}
                />
              ))}
            </View>
            <Text style={styles.dateHelper}>
              소비기한을 자동으로 읽지 않기 때문에 오늘부터 3일 안에서만
              조정할 수 있어요. 실제 상태가 애매하면 더 빠른 수령일을
              선택해주세요.
            </Text>
          </View>
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
