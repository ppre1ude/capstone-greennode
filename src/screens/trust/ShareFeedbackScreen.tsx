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
import { DSButton, DSCard, DSChip, DSIcon, DSText } from '@/design-system';
import type { RootStackParamList } from '@/navigation/types';
import {
  SHARE_REPORT_REASON_OPTIONS,
  type ShareReportReasonId,
} from '@/features/trust/report';
import {
  SHARE_REVIEW_ISSUE_TAGS,
  SHARE_REVIEW_POSITIVE_TAGS,
  type ShareReviewIssueTagId,
  type ShareReviewPositiveTagId,
} from '@/features/trust/review';
import { createShareReport, createShareReview } from '@/api/trust';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';
import { colors } from '@/theme';
import { getApiErrorMessage } from '@/utils/apiError';
import { getHeaderTopPadding } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareFeedback'>;
type FeedbackMode = 'review' | 'report';

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
    initialMode = 'review',
  } = route.params;
  const [mode, setMode] = useState<FeedbackMode>(initialMode);
  const [positiveTagIds, setPositiveTagIds] = useState<
    ShareReviewPositiveTagId[]
  >([]);
  const [issueTagIds, setIssueTagIds] = useState<ShareReviewIssueTagId[]>([]);
  const [reportReasonId, setReportReasonId] =
    useState<ShareReportReasonId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitReview = useTrustFeedbackStore(state => state.submitReview);
  const submitReport = useTrustFeedbackStore(state => state.submitReport);

  const canSubmitReview = positiveTagIds.length + issueTagIds.length > 0;
  const canSubmitReport = reportReasonId !== null;
  const modeTitle = mode === 'review' ? '수령 경험 평가' : '신고하기';
  const modeDescription = useMemo(
    () =>
      mode === 'review'
        ? '수령 QR 인증이 완료된 나눔만 평가할 수 있어요.'
        : '신고는 운영자 검토가 필요한 경우에만 남겨주세요.',
    [mode],
  );

  const handleSubmitReview = async () => {
    if (!canSubmitReview || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createShareReview(requestId, {
        positiveTagIds,
        issueTagIds,
      });
      const review = response.data;

      submitReview({
        requestId: review?.requestId ?? requestId,
        postId: review?.postId ?? postId,
        providerId: review?.providerId ?? providerId,
        positiveTagIds: review?.positiveTagIds ?? positiveTagIds,
        issueTagIds: review?.issueTagIds ?? issueTagIds,
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

  const handleSubmitReport = async () => {
    if (reportReasonId === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createShareReport(requestId, {
        reasonId: reportReasonId,
      });
      const report = response.data;

      submitReport({
        requestId: report?.requestId ?? requestId,
        postId: report?.postId ?? postId,
        providerId: report?.providerId ?? providerId,
        reasonId: report?.reasonId ?? reportReasonId,
      });
      Alert.alert('신고 접수', response.message || '신고가 접수되었습니다.');
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        '신고 실패',
        getApiErrorMessage(error, '신고를 접수하지 못했습니다.'),
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
          <View style={styles.modeTabs}>
            <DSChip
              label="평가"
              selected={mode === 'review'}
              tone="primary"
              onPress={() => setMode('review')}
            />
            <DSChip
              label="신고"
              selected={mode === 'report'}
              tone="warning"
              onPress={() => setMode('report')}
            />
          </View>
        </DSCard>

        {mode === 'review' ? (
          <>
            <View style={styles.section}>
              <DSText variant="bodyBold" style={styles.sectionTitle}>
                좋았던 점
              </DSText>
              <View style={styles.tagWrap}>
                {SHARE_REVIEW_POSITIVE_TAGS.map(tag => (
                  <DSChip
                    key={tag.id}
                    label={tag.label}
                    selected={positiveTagIds.includes(tag.id)}
                    tone="success"
                    variant="outlined"
                    onPress={() =>
                      setPositiveTagIds(current => toggleId(current, tag.id))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <DSText variant="bodyBold" style={styles.sectionTitle}>
                아쉬웠던 점
              </DSText>
              <View style={styles.tagWrap}>
                {SHARE_REVIEW_ISSUE_TAGS.map(tag => (
                  <DSChip
                    key={tag.id}
                    label={tag.label}
                    selected={issueTagIds.includes(tag.id)}
                    tone="warning"
                    variant="outlined"
                    onPress={() =>
                      setIssueTagIds(current => toggleId(current, tag.id))
                    }
                  />
                ))}
              </View>
            </View>

            <DSButton
              label="평가 제출"
              disabled={!canSubmitReview || isSubmitting}
              loading={isSubmitting}
              loadingLabel="제출 중"
              onPress={handleSubmitReview}
              style={styles.submitButton}
            />
          </>
        ) : (
          <>
            <View style={styles.section}>
              <DSText variant="bodyBold" style={styles.sectionTitle}>
                신고 사유 선택
              </DSText>
              <View style={styles.reportOptionList}>
                {SHARE_REPORT_REASON_OPTIONS.map(reason => {
                  const selected = reportReasonId === reason.id;

                  return (
                    <TouchableOpacity
                      key={reason.id}
                      accessibilityLabel={reason.label}
                      accessibilityRole="radio"
                      accessibilityState={{checked: selected}}
                      activeOpacity={0.82}
                      onPress={() => setReportReasonId(reason.id)}
                      style={[
                        styles.reportOption,
                        selected ? styles.reportOptionSelected : null,
                      ]}>
                      <View
                        style={[
                          styles.radioOuter,
                          selected ? styles.radioOuterSelected : null,
                        ]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <DSText
                        variant="bodyBold"
                        color={selected ? 'error' : 'textPrimary'}
                        style={styles.reportOptionText}>
                        {reason.label}
                      </DSText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <DSButton
              label="신고 제출"
              color="danger"
              disabled={!canSubmitReport || isSubmitting}
              loading={isSubmitting}
              loadingLabel="제출 중"
              onPress={handleSubmitReport}
              style={styles.submitButton}
            />
          </>
        )}
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
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    marginLeft: 2,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportOptionList: {
    gap: 10,
  },
  reportOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reportOptionSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error,
  },
  reportOptionText: {
    flex: 1,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioOuterSelected: {
    borderColor: colors.error,
  },
  radioInner: {
    backgroundColor: colors.error,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default ShareFeedbackScreen;
