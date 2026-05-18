/**
 * PostCreateScreen — 나눔 식재료 정보 입력 폼
 *
 * AnalysisResultScreen에서 "이대로 나눔하기" 선택 시 진입.
 * AI가 판별한 식재료명과 신선도 결과를 확인한 뒤 공유 냉장고를 선택함.
 * 등록(다음) 버튼 누르면 냉장고 선택 화면(FridgeSelect)으로 이동.
 *
 * @wireframe wireframe-foodlink/scanapply.html
 */
import React, {useMemo, useState} from 'react';
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
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  getConfidencePercent,
  getGenerateResultQualityMeta,
  needsAnalysisReview,
} from '@/utils/postPolicy';
import { styles } from './PostCreateScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'PostCreate'>;

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDefaultExpirationDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return formatDateOnly(date);
};

const parseDateOnly = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const isValidExpirationDate = (value: string) => {
  const selectedDate = parseDateOnly(value);
  if (!selectedDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate >= today;
};

const PostCreateScreen = ({ route, navigation }: Props) => {
  const { result, imageUri } = route.params;
  const defaultExpirationDate = useMemo(() => getDefaultExpirationDate(), []);
  const [expirationDate, setExpirationDate] = useState(defaultExpirationDate);
  const detectedCrop =
    result.detectedFruitKo ||
    result.aiAnalysis?.detectedFruitKo ||
    result.detectedFruit ||
    result.aiAnalysis?.detectedFruit ||
    '알 수 없음';
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

  const handleNext = () => {
    if (!quality.canShare || !hasImageToken) {
      Alert.alert(
        '나눔 기준에 맞지 않아요',
        '이 식재료는 나눔 기준에 맞는 상태로 확인되지 않았어요. 다시 촬영해주세요.',
      );
      return;
    }

    if (!isValidExpirationDate(expirationDate)) {
      Alert.alert(
        '날짜 확인 필요',
        '오늘 이후 날짜를 YYYY-MM-DD 형식으로 입력해주세요.',
      );
      return;
    }

    navigation.navigate('FridgeSelect', {
      postData: {
        imageToken: result.imageToken as string,
        expirationDate,
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
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>나눔 등록</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 이미지 미리보기 */}
        <View style={styles.imagePreview}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeIcon}>✨</Text>
            <Text style={styles.aiBadgeText}>AI 분석 완료</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.analysisCard}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>판별 농산물</Text>
              <Text style={styles.analysisValue}>{detectedCrop}</Text>
            </View>
            <View style={styles.analysisDivider} />
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>상태 안내</Text>
              <Text style={styles.analysisValue}>{quality.label}</Text>
            </View>
            <View style={styles.analysisDivider} />
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>AI 참고 신호</Text>
              <Text
                style={[
                  styles.analysisValue,
                  needsReview && styles.analysisValueWarning,
                ]}>
                {confidencePercent != null ? `${confidencePercent}%` : '미제공'}
              </Text>
            </View>
          </View>
          {needsReview && (
            <Text style={styles.reviewNotice}>
              AI가 나눔 가능으로 분석했지만 실제 상태를 직접 확인한 뒤 등록해주세요.
            </Text>
          )}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>등록될 나눔 식재료</Text>
            <Text style={styles.summaryName}>{detectedCrop}</Text>
            <Text style={styles.summaryDescription}>
              공유 냉장고를 선택하면 이 식재료가 나눔 가능 상태로 등록됩니다.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>권장 수령일</Text>
            <TextInput
              style={styles.input}
              value={expirationDate}
              onChangeText={setExpirationDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />
            <Text style={styles.fieldHelp}>
              기본값은 3일 뒤이며, 실제 상태를 보고 오늘 이후 날짜로 조정해주세요.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!quality.canShare || !hasImageToken) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!quality.canShare || !hasImageToken}>
          <Text style={styles.submitButtonText}>
            {quality.canShare ? '다음 단계로' : '나눔 기준 미충족'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PostCreateScreen;
