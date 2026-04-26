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
  StyleSheet,
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

type Props = NativeStackScreenProps<RootStackParamList, 'PostCreate'>;

const CATEGORIES = ['과일', '채소', '가공식품', '유제품', '기타'];

const PostCreateScreen = ({route, navigation}: Props) => {
  const {result, imageUri} = route.params;

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
        expirationDate: expDate.toISOString(),
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
            <Text style={styles.aiBadgeText}>AI 자동 완성됨</Text>
          </View>
        </View>

        <View style={styles.form}>
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
            <Text style={styles.label}>카테고리</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 44 : 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  headerSpacer: {width: 40},
  scrollContent: {
    paddingBottom: 40,
  },
  imagePreview: {
    height: 200,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  aiBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 98, 59, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  aiBadgeIcon: {fontSize: 12},
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    padding: 24,
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  submitButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PostCreateScreen;
