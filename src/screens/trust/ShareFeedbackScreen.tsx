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
  ISSUE_FEEDBACK_TAGS,
  POSITIVE_FEEDBACK_TAGS,
  REPORT_REASON_TAGS,
  type ShareFeedbackIssueTagId,
  type ShareFeedbackPositiveTagId,
  type ShareReportReasonId,
} from '@/features/trust/feedback';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';
import { colors } from '@/theme';
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
    ShareFeedbackPositiveTagId[]
  >([]);
  const [issueTagIds, setIssueTagIds] = useState<ShareFeedbackIssueTagId[]>([]);
  const [reportReasonIds, setReportReasonIds] = useState<
    ShareReportReasonId[]
  >([]);
  const submitReview = useTrustFeedbackStore(state => state.submitReview);
  const submitReport = useTrustFeedbackStore(state => state.submitReport);

  const canSubmitReview = positiveTagIds.length + issueTagIds.length > 0;
  const canSubmitReport = reportReasonIds.length > 0;
  const modeTitle = mode === 'review' ? '수령 경험 평가' : '신고하기';
  const modeDescription = useMemo(
    () =>
      mode === 'review'
        ? '수령 QR 인증이 완료된 나눔만 평가할 수 있어요.'
        : '신고는 운영자 검토가 필요한 경우에만 남겨주세요.',
    [mode],
  );

  const handleSubmitReview = () => {
    if (!canSubmitReview) {
      return;
    }

    submitReview({
      requestId,
      postId,
      providerId,
      positiveTagIds,
      issueTagIds,
    });
    Alert.alert('평가 완료', '수령 경험이 공급자 신뢰에 반영되었습니다.');
    navigation.goBack();
  };

  const handleSubmitReport = () => {
    if (!canSubmitReport) {
      return;
    }

    submitReport({
      requestId,
      postId,
      providerId,
      reasonIds: reportReasonIds,
    });
    Alert.alert('신고 접수', '운영자 검토가 필요한 항목으로 기록했습니다.');
    navigation.goBack();
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
                {POSITIVE_FEEDBACK_TAGS.map(tag => (
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
                {ISSUE_FEEDBACK_TAGS.map(tag => (
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
              disabled={!canSubmitReview}
              onPress={handleSubmitReview}
              style={styles.submitButton}
            />
          </>
        ) : (
          <>
            <View style={styles.section}>
              <DSText variant="bodyBold" style={styles.sectionTitle}>
                신고 사유
              </DSText>
              <View style={styles.tagWrap}>
                {REPORT_REASON_TAGS.map(reason => (
                  <DSChip
                    key={reason.id}
                    label={reason.label}
                    selected={reportReasonIds.includes(reason.id)}
                    tone="error"
                    variant="outlined"
                    onPress={() =>
                      setReportReasonIds(current => toggleId(current, reason.id))
                    }
                  />
                ))}
              </View>
            </View>

            <DSButton
              label="신고 제출"
              color="danger"
              disabled={!canSubmitReport}
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
  submitButton: {
    marginTop: 8,
  },
});

export default ShareFeedbackScreen;
