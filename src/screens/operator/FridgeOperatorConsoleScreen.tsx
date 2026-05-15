import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'FridgeOperatorConsole'
>;

const summary = [
  {label: '현재 보관 항목', value: '12', note: '개별 나눔 식재료 기준'},
  {label: '신청 가능', value: '7', note: 'available'},
  {label: '신청 접수', value: '3', note: 'requested'},
  {label: '권장 기한 임박', value: '2', note: '24시간 이내'},
  {label: '확인 필요', value: '3', note: '낮은 confidence 또는 현장 점검'},
  {label: '폐기 후보', value: '1', note: '권장 기한 초과'},
];

const basketCandidates = [
  {
    id: 'BASKET-CAND-001',
    source: '공급자 24',
    items: ['바나나', '토마토', '상추'],
    status: '3개 중 1개 확인 필요',
    decision: '바구니로 묶으면 현장 점검이 쉬움',
  },
  {
    id: 'BASKET-CAND-002',
    source: '공급자 31',
    items: ['사과', '감자'],
    status: '2개 모두 신청 접수',
    decision: '개별 항목 상태만으로도 충분할 수 있음',
  },
  {
    id: 'NO-BASKET',
    source: '기존 단일 등록',
    items: ['오이'],
    status: '권장 기한 초과',
    decision: '바구니 없이도 폐기 판단 가능',
  },
];

const inspectionItems = [
  {
    name: '토마토',
    postId: '108',
    ai: 'Fresh, 0.94',
    recommendedUntil: '2026-05-17 18:00',
    status: 'available',
  },
  {
    name: '상추',
    postId: '109',
    ai: 'Mid, 0.72',
    recommendedUntil: '2026-05-16 12:00',
    status: 'needsReview',
  },
  {
    name: '바나나',
    postId: '110',
    ai: 'Fresh, 0.98',
    recommendedUntil: '2026-05-18 09:00',
    status: 'requested',
  },
];

const validationRules = [
  'requested인데 신청 기록이 없음',
  '운영자가 폐기했지만 홈/지도에 노출됨',
  '바구니 안 항목은 전부 처리됐지만 묶음이 active처럼 보임',
  '감지 영역과 생성된 나눔 식재료 연결이 끊김',
];

const statusTone = (status: string) => {
  if (status === 'available') {
    return styles.goodPill;
  }

  if (status === 'requested') {
    return styles.infoPill;
  }

  return styles.warningPill;
};

const FridgeOperatorConsoleScreen = ({navigation}: Props) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={styles.title}>냉장고 운영자 콘솔</Text>
        <Text style={styles.subtitle}>전남대학교 공유냉장고 현장 점검</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>냉장고 상태</Text>
        <Text style={styles.sectionNote}>마지막 동기화 2026-05-15 14:20</Text>
        <View style={styles.summaryGrid}>
          {summary.map(item => (
            <View key={item.label} style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryNote}>{item.note}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>바구니 후보</Text>
        <Text style={styles.sectionNote}>
          정식 채택 전이며 같은 촬영/보관 흐름에서 나온 묶음 후보
        </Text>
        {basketCandidates.map(candidate => (
          <View key={candidate.id} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{candidate.id}</Text>
              <Text style={styles.rowMeta}>{candidate.source}</Text>
            </View>
            <View style={styles.pillRow}>
              {candidate.items.map(item => (
                <Text key={item} style={styles.neutralPill}>
                  {item}
                </Text>
              ))}
            </View>
            <Text style={styles.rowText}>{candidate.status}</Text>
            <Text style={styles.rowText}>{candidate.decision}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>개별 나눔 식재료 점검</Text>
        <Text style={styles.sectionNote}>
          사용자 등록/신청 단위는 개별 나눔 식재료로 유지
        </Text>
        {inspectionItems.map(item => (
          <View key={item.postId} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>postId {item.postId}</Text>
              </View>
              <Text style={[styles.statusPill, statusTone(item.status)]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.rowText}>AI 상태: {item.ai}</Text>
            <Text style={styles.rowText}>
              권장 나눔 기한: {item.recommendedUntil}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>상태 검증 규칙</Text>
        {validationRules.map(rule => (
          <Text key={rule} style={styles.ruleText}>
            - {rule}
          </Text>
        ))}
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  backButtonText: {
    fontSize: 28,
    color: colors.textPrimary,
    marginTop: -2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 36,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionNote: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCell: {
    width: '48%',
    minHeight: 94,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryNote: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textTertiary,
  },
  rowCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  neutralPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
  },
  goodPill: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  infoPill: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  warningPill: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  ruleText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default FridgeOperatorConsoleScreen;
