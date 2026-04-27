/**
 * PostCreateScreen — 게시글 정보 입력 폼
 *
 * AnalysisResultScreen에서 "이대로 나눔하기" 선택 시 진입.
 * AI가 추천한 제목, 카테고리, 설명을 기본값으로 채워주고 유저가 수정 가능.
 * 등록(다음) 버튼 누르면 냉장고 선택 화면(FridgeSelect)으로 이동.
 *
 * @wireframe wireframe-foodlink/scanapply.html
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {colors} from '@/theme';
import {styles} from './PostCreateScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'PostCreate'>;

const CATEGORIES = ['과일', '채소', '가공식품', '유제품', '기타'];

const QUALITY_LABELS: Record<string, string> = {
  fresh: '신선',
  normal: '보통',
  mid: '보통',
  stale: '부패 의심',
  rotten: '부패 의심',
};

const getQualityLabel = (category?: string) => {
  if (!category) {
    return '분석 완료';
  }

  return QUALITY_LABELS[category.toLowerCase()] ?? category;
};

const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const PostCreateScreen = ({route, navigation}: Props) => {
  const {result, imageUri} = route.params;
  const detectedCrop =
    result.detectedFruitKo ||
    result.aiAnalysis?.detectedFruitKo ||
    result.detectedFruit ||
    result.aiAnalysis?.detectedFruit ||
    '알 수 없음';
  const qualityLabel = getQualityLabel(result.aiAnalysis?.category);

  const [title, setTitle] = useState(result.suggestedTitle || '');
  const [category, setCategory] = useState(result.suggestedCategory || '과일');
  const [description, setDescription] = useState(
    result.suggestedDescription || '',
  );

  const handleNext = () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    // 유효기간은 MVP 상 기본 3일 후로 설정
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 3);

    navigation.navigate('FridgeSelect', {
      postData: {
        title,
        description,
        category,
        imageToken: result.imageToken,
        expirationDate: formatDateOnly(expDate),
      },
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
          <Image source={{uri: imageUri}} style={styles.image} />
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
              <Text style={styles.analysisLabel}>품질 분류</Text>
              <Text style={styles.analysisValue}>{qualityLabel}</Text>
            </View>
          </View>

          {/* 제목 */}
          <View style={styles.field}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="예) 싱싱한 사과 나눕니다"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>

          {/* 카테고리 */}
          <View style={styles.field}>
            <Text style={styles.label}>나눔 카테고리</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat)}>
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 상세 설명 */}
          <View style={styles.field}>
            <Text style={styles.label}>상세 설명</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="식재료의 상태나 보관 방법 등을 적어주세요."
              placeholderTextColor={colors.textPlaceholder}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!title.trim() || !description.trim()) && styles.submitButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!title.trim() || !description.trim()}>
          <Text style={styles.submitButtonText}>다음 단계로</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PostCreateScreen;
