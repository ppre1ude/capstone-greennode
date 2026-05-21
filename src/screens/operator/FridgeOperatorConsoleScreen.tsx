import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  disposeOperatorItem,
  getOperatorInventoryItems,
  getOperatorInventorySummary,
  type OperatorInventoryItem,
  type OperatorInventorySummary,
} from '@/api/operator';
import type {RootStackParamList} from '@/navigation/types';
import {colors} from '@/theme';
import {getApiErrorMessage} from '@/utils/apiError';
import {
  deriveBasketStatus,
  getOperatorItemStatusLabel,
  getOperatorItemStatusTone,
  type OperatorItemStatus,
  type OperatorStatusTone,
} from '@/utils/fridgeOperatorInventory';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'FridgeOperatorConsole'
>;

const DEFAULT_OPERATOR_FRIDGE = {
  id: 1,
  name: '전남대학교 공유냉장고',
};

const fallbackSummary: OperatorInventorySummary = {
  totalItems: 12,
  availableItems: 7,
  requestedItems: 3,
  expiringSoonItems: 2,
  expiredItems: 1,
  needsReviewItems: 3,
  ethyleneSeparatedItems: 0,
  lastSyncedAt: '2026-05-15T14:20:00+09:00',
};

const makeSummaryCards = (summary: OperatorInventorySummary) => [
  {
    label: '현재 보관 항목',
    value: String(summary.totalItems),
    note: '개별 나눔 식재료 기준',
  },
  {label: '신청 가능', value: String(summary.availableItems), note: 'available'},
  {label: '신청 접수', value: String(summary.requestedItems), note: 'requested'},
  {
    label: '권장 기한 임박',
    value: String(summary.expiringSoonItems),
    note: '24시간 이내',
  },
  {
    label: '에틸렌 분리',
    value: String(summary.ethyleneSeparatedItems ?? 0),
    note: '별도 구역',
  },
  {label: '폐기 후보', value: String(summary.expiredItems), note: '권장 기한 초과'},
];

type BasketCandidate = {
  id: string;
  source: string;
  items: {name: string; status: OperatorItemStatus}[];
  decision: string;
};

const basketCandidates: BasketCandidate[] = [
  {
    id: 'BASKET-CAND-001',
    source: '공급자 24',
    items: [
      {name: '바나나', status: 'available'},
      {name: '토마토', status: 'available'},
      {name: '상추', status: 'needsReview'},
    ],
    decision: '바구니로 묶으면 현장 점검이 쉬움',
  },
  {
    id: 'BASKET-CAND-002',
    source: '공급자 31',
    items: [
      {name: '사과', status: 'requested'},
      {name: '감자', status: 'requested'},
    ],
    decision: '개별 항목 상태만으로도 충분할 수 있음',
  },
  {
    id: 'NO-BASKET',
    source: '기존 단일 등록',
    items: [{name: '오이', status: 'discardCandidate'}],
    decision: '바구니 없이도 폐기 판단 가능',
  },
];

type InspectionItem = {
  name: string;
  postId: string;
  labelCode?: string;
  storageZone?: string;
  ai: string;
  recommendedUntil: string;
  status: OperatorItemStatus;
};

const initialInspectionItems: InspectionItem[] = [
  {
    name: '토마토',
    postId: '108',
    labelCode: '#01',
    storageZone: '일반 구역',
    ai: 'Fresh, 0.94',
    recommendedUntil: '2026-05-17 18:00',
    status: 'available',
  },
  {
    name: '상추',
    postId: '109',
    labelCode: '#02',
    storageZone: '일반 구역',
    ai: 'Mid, 0.72',
    recommendedUntil: '2026-05-16 12:00',
    status: 'needsReview',
  },
  {
    name: '바나나',
    postId: '110',
    labelCode: '#03',
    storageZone: '일반 구역',
    ai: 'Fresh, 0.98',
    recommendedUntil: '2026-05-18 09:00',
    status: 'requested',
  },
  {
    name: '오이',
    postId: '111',
    labelCode: '#04',
    storageZone: '일반 구역',
    ai: 'Mid, 0.61',
    recommendedUntil: '2026-05-15 09:00',
    status: 'discardCandidate',
  },
];

const validationRules = [
  'requested인데 신청 기록이 없음',
  '운영자가 폐기했지만 홈/지도에 노출됨',
  '바구니 안 항목은 전부 처리됐지만 묶음이 active처럼 보임',
  '감지 영역과 생성된 나눔 식재료 연결이 끊김',
];

const statusTone = (tone: OperatorStatusTone) => {
  if (tone === 'good') {
    return styles.goodPill;
  }

  if (tone === 'info') {
    return styles.infoPill;
  }

  if (tone === 'danger') {
    return styles.dangerPill;
  }

  return styles.warningPill;
};

const itemStatusTone = (status: OperatorItemStatus) =>
  statusTone(getOperatorItemStatusTone(status));

const formatConfidence = (confidenceScore?: number | null): string | null => {
  if (typeof confidenceScore !== 'number') {
    return null;
  }

  return confidenceScore <= 1
    ? confidenceScore.toFixed(2)
    : (confidenceScore / 100).toFixed(2);
};

const getStorageZoneLabel = (
  storageZone?: OperatorInventoryItem['storageZone'],
): string => {
  if (storageZone === 'ETHYLENE_SEPARATED') {
    return '에틸렌 분리 구역';
  }

  return '일반 구역';
};

type ErrorWithResponseStatus = {
  response?: {
    status?: number;
  };
};

const isOperatorAuthorizationError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const status = (error as ErrorWithResponseStatus).response?.status;
  return status === 401 || status === 403;
};

const mapOperatorItemStatus = (
  status: OperatorInventoryItem['status'],
): OperatorItemStatus => {
  if (status === 'expired') {
    return 'discardCandidate';
  }

  if (status === 'disposed') {
    return 'discarded';
  }

  if (status === 'needs_review') {
    return 'needsReview';
  }

  if (
    status === 'available' ||
    status === 'requested' ||
    status === 'completed' ||
    status === 'missing'
  ) {
    return status;
  }

  return 'needsReview';
};

const mapOperatorInventoryItem = (
  item: OperatorInventoryItem,
): InspectionItem => {
  const confidence = formatConfidence(item.confidenceScore);
  const freshness = item.freshnessLabel ?? 'unknown';

  return {
    name:
      item.itemName ??
      item.detectedFruitKo ??
      item.detectedFruit ??
      '나눔 식재료',
    postId: String(item.postId),
    labelCode: item.labelCode ?? undefined,
    storageZone: getStorageZoneLabel(item.storageZone),
    ai: confidence ? `${freshness}, ${confidence}` : String(freshness),
    recommendedUntil:
      item.storageDeadlineAt ?? item.expirationDate ?? item.updatedAt ?? '-',
    status: mapOperatorItemStatus(item.status),
  };
};

const FridgeOperatorConsoleScreen = ({navigation, route}: Props) => {
  const fridgeId = route.params?.fridgeId ?? DEFAULT_OPERATOR_FRIDGE.id;
  const fridgeName = route.params?.fridgeName ?? DEFAULT_OPERATOR_FRIDGE.name;
  const [inventorySummary, setInventorySummary] =
    useState<OperatorInventorySummary>(fallbackSummary);
  const [inspectionItems, setInspectionItems] = useState(initialInspectionItems);
  const [disposingPostId, setDisposingPostId] = useState<string | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [isOperatorAccessDenied, setIsOperatorAccessDenied] = useState(false);

  const summaryCards = useMemo(
    () => makeSummaryCards(inventorySummary),
    [inventorySummary],
  );

  const fetchOperatorInventory = useCallback(async () => {
    setIsLoadingInventory(true);
    setInventoryError(null);

    try {
      const [summaryResponse, itemsResponse] = await Promise.all([
        getOperatorInventorySummary(fridgeId),
        getOperatorInventoryItems(fridgeId),
      ]);

      setIsOperatorAccessDenied(false);

      if (summaryResponse.success && summaryResponse.data) {
        setInventorySummary(summaryResponse.data);
      }

      if (itemsResponse.success && itemsResponse.data) {
        setInspectionItems(itemsResponse.data.map(mapOperatorInventoryItem));
      }

      if (!summaryResponse.success || !itemsResponse.success) {
        setInventoryError(
          summaryResponse.message ||
            itemsResponse.message ||
            '운영자 inventory API를 불러오지 못했습니다.',
        );
      }
    } catch (error) {
      if (isOperatorAuthorizationError(error)) {
        setIsOperatorAccessDenied(true);
        setInventoryError(
          getApiErrorMessage(error, '운영자 권한이 없습니다.'),
        );
        return;
      }

      setInventoryError(
        getApiErrorMessage(
          error,
          '운영자 inventory API를 불러오지 못했습니다. 샘플 데이터를 표시합니다.',
        ),
      );
    } finally {
      setIsLoadingInventory(false);
    }
  }, [fridgeId]);

  useEffect(() => {
    fetchOperatorInventory();
  }, [fetchOperatorInventory]);

  const handleDispose = async (item: InspectionItem) => {
    const postId = Number(item.postId);

    if (!Number.isFinite(postId)) {
      Alert.alert('폐기 요청 실패', '식재료 번호를 확인할 수 없습니다.');
      return;
    }

    setDisposingPostId(item.postId);

    try {
      const response = await disposeOperatorItem(postId);

      if (response.success) {
        setInspectionItems(currentItems =>
          currentItems.map(currentItem =>
            currentItem.postId === item.postId
              ? {...currentItem, status: 'discarded'}
              : currentItem,
          ),
        );
        await fetchOperatorInventory();
        Alert.alert(
          '폐기 처분 완료',
          response.message || '운영자 폐기 처분이 완료되었습니다.',
        );
        return;
      }

      Alert.alert(
        '폐기 요청 실패',
        response.message || '폐기 처분 요청에 실패했습니다.',
      );
    } catch (error) {
      Alert.alert(
        '폐기 요청 실패',
        getApiErrorMessage(error, '폐기 처분 요청에 실패했습니다.'),
      );
    } finally {
      setDisposingPostId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>냉장고 운영자 콘솔</Text>
          <Text style={styles.subtitle}>{fridgeName} 현장 점검</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.prototypeBanner}>
          <Text style={styles.prototypeBadge}>실제 운영자 API 연결</Text>
          <Text style={styles.prototypeText}>
            폐기 후보 항목은 운영자 API로 바로 처분 요청을 보냅니다. 백엔드가 아직 배포되지 않았다면 실패 메시지가 표시됩니다.
          </Text>
          {isLoadingInventory ? (
            <View style={styles.syncRow}>
              <ActivityIndicator color="#9A3412" />
              <Text style={styles.syncText}>운영자 재고 동기화 중</Text>
            </View>
          ) : null}
          {inventoryError ? (
            <>
              <Text style={styles.syncErrorText}>{inventoryError}</Text>
              <TouchableOpacity
                disabled={isLoadingInventory}
                style={[
                  styles.retryButton,
                  isLoadingInventory && styles.retryButtonDisabled,
                ]}
                onPress={fetchOperatorInventory}>
                <Text style={styles.retryButtonText}>
                  {isOperatorAccessDenied
                    ? '권한 확인 다시 시도'
                    : '다시 불러오기'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {isOperatorAccessDenied ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>운영자 권한이 필요합니다</Text>
            <Text style={styles.sectionNote}>
              이 냉장고의 운영자로 등록된 계정만 재고를 확인하고 폐기 처리할 수 있습니다.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>냉장고 상태</Text>
              <Text style={styles.sectionNote}>
                마지막 동기화 {inventorySummary.lastSyncedAt ?? '확인 중'}
              </Text>
              <View style={styles.summaryGrid}>
                {summaryCards.map(item => (
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
              {basketCandidates.map(candidate => {
                const candidateStatus = deriveBasketStatus(candidate.items);

                return (
                  <View key={candidate.id} style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <Text style={styles.rowTitle}>{candidate.id}</Text>
                      <Text style={styles.rowMeta}>{candidate.source}</Text>
                    </View>
                    <View style={styles.pillRow}>
                      {candidate.items.map(item => (
                        <Text key={item.name} style={styles.neutralPill}>
                          {item.name}
                        </Text>
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.statusPill,
                        statusTone(candidateStatus.tone),
                      ]}>
                      {candidateStatus.label}
                    </Text>
                    <Text style={styles.rowText}>{candidate.decision}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>개별 나눔 식재료 점검</Text>
              <Text style={styles.sectionNote}>
                사용자 등록/신청 단위는 개별 나눔 식재료로 유지
              </Text>
              {inspectionItems.length > 0 ? (
                inspectionItems.map(item => (
                  <View key={item.postId} style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <View>
                        <Text style={styles.rowTitle}>{item.name}</Text>
                        <Text style={styles.rowMeta}>
                          postId {item.postId}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statusPill,
                          itemStatusTone(item.status),
                        ]}>
                        {getOperatorItemStatusLabel(item.status)}
                      </Text>
                    </View>
                    <View style={styles.itemMetaRow}>
                      {item.labelCode ? (
                        <Text style={styles.itemMetaPill}>
                          {item.labelCode}
                        </Text>
                      ) : null}
                      {item.storageZone ? (
                        <Text style={styles.itemMetaPill}>
                          {item.storageZone}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.rowText}>AI 상태: {item.ai}</Text>
                    <Text style={styles.rowText}>
                      권장 나눔 기한: {item.recommendedUntil}
                    </Text>
                    {item.status === 'discardCandidate' ? (
                      <TouchableOpacity
                        disabled={disposingPostId === item.postId}
                        onPress={() => handleDispose(item)}
                        style={[
                          styles.disposeButton,
                          disposingPostId === item.postId &&
                            styles.disposeButtonDisabled,
                        ]}>
                        <Text style={styles.disposeButtonText}>
                          {disposingPostId === item.postId
                            ? '폐기 요청 중'
                            : '폐기 처분 완료'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>점검할 식재료가 없습니다</Text>
                  <Text style={styles.emptyText}>
                    백엔드 inventory API가 빈 목록을 반환했습니다. 새 나눔이 보관되면 이 영역에 표시됩니다.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchOperatorInventory}>
                    <Text style={styles.retryButtonText}>다시 불러오기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>상태 검증 규칙</Text>
              {validationRules.map(rule => (
                <Text key={rule} style={styles.ruleText}>
                  - {rule}
                </Text>
              ))}
            </View>
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
  prototypeBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  prototypeBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  prototypeText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  syncText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '700',
  },
  syncErrorText: {
    marginTop: 10,
    color: '#9A3412',
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9A3412',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonDisabled: {
    opacity: 0.55,
  },
  retryButtonText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '800',
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
  emptyState: {
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
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
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  itemMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
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
  dangerPill: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  disposeButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#DC2626',
  },
  disposeButtonDisabled: {
    opacity: 0.55,
  },
  disposeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  ruleText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default FridgeOperatorConsoleScreen;
