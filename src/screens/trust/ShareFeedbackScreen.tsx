import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DSButton, DSCard, DSIcon, DSText } from '@/design-system';
import ShareReviewPositiveTagSelector from '@/components/trust/ShareReviewPositiveTagSelector';
import type { RootStackParamList } from '@/navigation/types';
import {
  type ShareReviewPositiveTagId,
} from '@/features/trust/review';
import { createShareReview } from '@/api/trust';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';
import { colors } from '@/theme';
import { getApiErrorMessage } from '@/utils/apiError';
import { getHeaderTopPadding } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareFeedback'>;

const toggleId = <TId extends string>(values: TId[], id: TId): TId[] =>
  values.includes(id)
    ? values.filter(value => value !== id)
    : [...values, id];

const ShareFeedbackScreen = ({ route, navigation }: Props) => {
  const {
    requestId,
    postId,
    providerId,
    fruitName,
    fridgeName,
  } = route.params;
  const [positiveTagIds, setPositiveTagIds] = useState<
    ShareReviewPositiveTagId[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitReview = useTrustFeedbackStore(state => state.submitReview);

  const canSubmitReview = positiveTagIds.length > 0;
  const modeTitle = '수령 경험 평가';
  const modeDescription = useMemo(
    () => '수령 QR 인증이 완료된 나눔만 평가할 수 있어요.',
    [],
  );

  const handleSubmitReview = async () => {
    if (!canSubmitReview || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createShareReview(requestId, {
        positiveTagIds,
        issueTagIds: [],
      });
      const review = response.data;

      submitReview({
        requestId: review?.requestId ?? requestId,
        postId: review?.postId ?? postId,
        providerId: review?.providerId ?? providerId,
        positiveTagIds: review?.positiveTagIds ?? positiveTagIds,
        issueTagIds: review?.issueTagIds ?? [],
      });
      Alert.alert(
        '평가 완료',
        response.message || '수령 경험 평가가 저장되었습니다.',
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        '평가 실패',
        getApiErrorMessage(error, '수령 경험 평가를 저장하지 못했습니다.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <DSIcon name="angle-left" size="large" color="textPrimary" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <DSText variant="heading2">{modeTitle}</DSText>
          <DSText variant="small" color="textSecondary">
            {modeDescription}
          </DSText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <DSCard variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <DSIcon name="circle-check" color="primary" size="large" />
            <View style={styles.summaryTextBlock}>
              <DSText variant="bodyBold">{fruitName}</DSText>
              <DSText variant="small" color="textSecondary">
                {`${fridgeName} · 수령 완료`}
              </DSText>
            </View>
          </View>
        </DSCard>

        <View style={styles.section}>
          <DSText variant="bodyBold" style={styles.sectionTitle}>
            좋았던 점
          </DSText>
          <ShareReviewPositiveTagSelector
            selectedIds={positiveTagIds}
            onToggle={tagId =>
              setPositiveTagIds(current => toggleId(current, tagId))
            }
          />
        </View>

        <DSButton
          label="평가 제출"
          size="medium"
          disabled={!canSubmitReview || isSubmitting}
          loading={isSubmitting}
          loadingLabel="제출 중"
          onPress={handleSubmitReview}
          style={styles.submitButton}
        />
      </ScrollView>
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
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: getHeaderTopPadding(),
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerTitleBlock: {
    flex: 1,
    gap: 4,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextBlock: {
    flex: 1,
    gap: 4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    marginLeft: 2,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default ShareFeedbackScreen;
