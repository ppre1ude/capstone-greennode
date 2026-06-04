import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/navigation/types';
import {
  InventoryCountdownBadge,
  InventoryLabelInstructionCard,
  InventoryProgressStepper,
  parseServerLifecycleTimestampMs,
  resolveStoragePolicy,
  type InventoryDisplayStatus,
} from '@/features/inventory';
import {
  QrScannerShell,
  getQrVerificationErrorMessage,
  type FridgeQrVerificationTarget,
} from '@/features/qr';
import { confirmPickup, confirmStore } from '@/api/inventory';
import type { ConfirmPickupResult, ConfirmStoreResult } from '@/api/inventory';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryQr'>;
type InventoryQrRouteParams = RootStackParamList['InventoryQr'];

type ScanMode = 'store' | 'pickup';

const LABEL_SAMPLE = {
  labelCode: '#0042',
  itemName: '토마토',
  quality: 'Mid' as const,
};

const HOLD_STARTED_AT = new Date('2026-05-19T00:00:00.000Z');
const SAMPLE_STORAGE_POLICY = resolveStoragePolicy({
  itemName: LABEL_SAMPLE.itemName,
  quality: LABEL_SAMPLE.quality,
  storedAt: HOLD_STARTED_AT,
});

const PENDING_STORE_TIMEOUT_MS = 10 * 60 * 1000;
const REQUEST_HOLD_TIMEOUT_MS = 30 * 60 * 1000;
const ANDROID_NAVIGATION_BAR_FALLBACK_INSET = 48;
const SCROLL_CONTENT_MIN_BOTTOM_PADDING = 36;
const SCROLL_CONTENT_BOTTOM_INSET_GAP = 16;
const UNKNOWN_FRIDGE_CODE_LABEL = 'QR 스캔 후 확인';

const getErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : null;
};

const isValidDateInput = (value?: string): value is string => {
  if (!value) {
    return false;
  }

  return Number.isFinite(parseServerLifecycleTimestampMs(value));
};

const isInventoryQrRouteParams = (
  params: InventoryQrRouteParams | undefined,
): params is InventoryQrRouteParams =>
  !!params &&
  typeof params.postId === 'number' &&
  (params.mode === 'store' || params.mode === 'pickup');

const InventoryQrScreen = ({ navigation, route }: Props) => {
  const params = route.params as InventoryQrRouteParams | undefined;

  if (!isInventoryQrRouteParams(params)) {
    return <MissingInventoryQrRoute navigation={navigation} />;
  }

  return <InventoryQrContent navigation={navigation} params={params} />;
};

type MissingInventoryQrRouteProps = {
  navigation: Props['navigation'];
};

const MissingInventoryQrRoute = ({ navigation }: MissingInventoryQrRouteProps) => (
  <View style={styles.container} testID="inventory-qr-missing-route">
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={styles.title}>냉장고 QR 인증</Text>
        <Text style={styles.subtitle}>보관과 수령을 냉장고 QR로 확인합니다</Text>
      </View>
    </View>

    <View style={styles.missingRouteContent}>
      <Text style={styles.missingRouteTitle}>
        QR 인증 정보를 찾을 수 없습니다
      </Text>
      <Text style={styles.missingRouteText}>
        내 나눔이나 진행 중인 나눔에서 다시 열어주세요.
      </Text>
      <TouchableOpacity
        style={styles.missingRouteButton}
        onPress={navigation.goBack}>
        <Text style={styles.missingRouteButtonText}>돌아가기</Text>
      </TouchableOpacity>
    </View>
  </View>
);

type InventoryQrContentProps = {
  navigation: Props['navigation'];
  params: InventoryQrRouteParams;
};

const InventoryQrContent = ({ navigation, params }: InventoryQrContentProps) => {
  const insets = useSafeAreaInsets();
  const postId = params.postId;
  const expectedFridgePublicCode = params.fridgePublicCode;
  const displayFridgePublicCode =
    expectedFridgePublicCode ?? UNKNOWN_FRIDGE_CODE_LABEL;
  const fridgeName = params.fridgeName ?? UNKNOWN_FRIDGE_CODE_LABEL;
  const fridgeLocation =
    params.fridgeLocation ?? '냉장고 앞에서 QR을 스캔하면 서버가 확인합니다.';
  const [scanMode, setScanMode] = useState<ScanMode>(params.mode);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const [storeConfirmed, setStoreConfirmed] = useState(false);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scanRetryAvailable, setScanRetryAvailable] = useState(false);
  const [scannerSession, setScannerSession] = useState(0);
  const [confirmedStoreResult, setConfirmedStoreResult] =
    useState<ConfirmStoreResult | null>(null);
  const [confirmedPickupResult, setConfirmedPickupResult] =
    useState<ConfirmPickupResult | null>(null);
  const requestNearbyPostsRefresh = useFeedRefreshStore(
    state => state.requestNearbyPostsRefresh,
  );
  const [scanMessage, setScanMessage] = useState(
    '선택한 냉장고 앞에서 QR을 스캔해주세요.',
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const apiFallbackExpiresAt = useMemo(
    () =>
      new Date(
        Date.now() +
          (scanMode === 'pickup'
            ? REQUEST_HOLD_TIMEOUT_MS
            : PENDING_STORE_TIMEOUT_MS),
      ),
    [scanMode],
  );

  const countdownExpiresAt = useMemo(() => {
    if (isValidDateInput(params.pendingExpiresAt)) {
      return params.pendingExpiresAt;
    }

    return apiFallbackExpiresAt;
  }, [apiFallbackExpiresAt, params.pendingExpiresAt]);

  const countdownNow = currentTime;

  const inventoryStatus: InventoryDisplayStatus = useMemo(() => {
    if (pickupConfirmed) {
      return 'picked_up';
    }

    if (scanMode === 'pickup' && storeConfirmed) {
      return 'pickup_hold';
    }

    if (storeConfirmed) {
      return 'available';
    }

    return 'pending_store';
  }, [pickupConfirmed, scanMode, storeConfirmed]);

  const handleValidScan = useCallback(
    async (target: FridgeQrVerificationTarget) => {
      setScanRetryAvailable(false);

      if (
        expectedFridgePublicCode &&
        target.fridgePublicCode !== expectedFridgePublicCode
      ) {
        setScanMessage('선택한 냉장고 QR이 아닙니다. 다시 확인해주세요.');
        setScanRetryAvailable(true);
        return;
      }

      if (scanMode === 'store') {
        setIsConfirming(true);
        try {
          const response = await confirmStore({
            postId,
            fridgePublicCode: target.fridgePublicCode,
          });

          if (response.success && response.data) {
            setConfirmedStoreResult(response.data);
            setStoreConfirmed(true);
            setPickupConfirmed(false);
            requestNearbyPostsRefresh();
            setScanMessage(
              response.message ||
                '입고 인증 완료. 라벨 코드를 식재료에 붙여주세요.',
            );
            return;
          }

          setScanMessage(response.message || '입고 인증에 실패했습니다.');
          setScanRetryAvailable(true);
        } catch (error) {
          const message = getQrVerificationErrorMessage(getErrorStatus(error));
          setScanMessage(message);
          setScanRetryAvailable(true);
          Alert.alert('QR 인증 실패', message);
        } finally {
          setIsConfirming(false);
        }
        return;
      }

      setIsConfirming(true);
      try {
        const response = await confirmPickup({
          postId,
          fridgePublicCode: target.fridgePublicCode,
        });

        if (response.success && response.data) {
          setConfirmedPickupResult(response.data);
          setPickupConfirmed(true);
          requestNearbyPostsRefresh(response.data.postId ?? postId);
          setScanMessage(response.message || '수령 인증이 완료되었습니다.');
          return;
        }

        setScanMessage(response.message || '수령 인증에 실패했습니다.');
        setScanRetryAvailable(true);
      } catch (error) {
        const message = getQrVerificationErrorMessage(getErrorStatus(error));
        setScanMessage(message);
        setScanRetryAvailable(true);
        Alert.alert('QR 인증 실패', message);
      } finally {
        setIsConfirming(false);
      }
    },
    [
      expectedFridgePublicCode,
      postId,
      requestNearbyPostsRefresh,
      scanMode,
    ],
  );

  const handleRetryScan = useCallback(() => {
    setScanRetryAvailable(false);
    setScannerSession(session => session + 1);
    setScanMessage('냉장고 QR을 다시 스캔해주세요.');
  }, []);

  const labelCode =
    confirmedStoreResult?.labelCode ??
    confirmedPickupResult?.labelCode ??
    LABEL_SAMPLE.labelCode;
  const storageZoneLabel =
    confirmedStoreResult?.storageZone === 'ETHYLENE_SEPARATED' ||
    confirmedPickupResult?.storageZone === 'ETHYLENE_SEPARATED'
      ? '에틸렌 분리 구역'
      : SAMPLE_STORAGE_POLICY.zoneLabel;
  const deadlineLabel = confirmedStoreResult?.storageDeadlineAt
    ? new Date(confirmedStoreResult.storageDeadlineAt).toLocaleString()
    : SAMPLE_STORAGE_POLICY.deadlineLabel;
  const contentBottomPadding =
    Platform.OS === 'android'
      ? SCROLL_CONTENT_MIN_BOTTOM_PADDING
      : Math.max(
          insets.bottom + SCROLL_CONTENT_BOTTOM_INSET_GAP,
          SCROLL_CONTENT_MIN_BOTTOM_PADDING,
        );
  const viewportBottomInset =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, ANDROID_NAVIGATION_BAR_FALLBACK_INSET)
      : 0;

  return (
    <View style={styles.container} testID="inventory-qr-screen">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>냉장고 QR 인증</Text>
          <Text style={styles.subtitle}>
            보관과 수령을 냉장고 QR로 확인합니다
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ marginBottom: viewportBottomInset }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentBottomPadding },
        ]}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>QR 인증 준비</Text>
          <Text style={styles.noticeText}>
            선택한 냉장고의 QR을 스캔하면 보관 또는 수령 상태가
            업데이트됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{fridgeName}</Text>
            <Text style={styles.fridgeCode}>{displayFridgePublicCode}</Text>
          </View>
          <Text style={styles.sectionNote}>{fridgeLocation}</Text>
          <InventoryCountdownBadge
            expiresAt={countdownExpiresAt}
            now={countdownNow}
            testID="inventory-qr-countdown"
          />
        </View>

        <InventoryProgressStepper
          status={inventoryStatus}
          testID="inventory-qr-progress"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR 인증 모드</Text>
          <View style={styles.segmentRow}>
            <ModeButton
              active={scanMode === 'store'}
              label="보관 인증"
              onPress={() => setScanMode('store')}
            />
            <ModeButton
              active={scanMode === 'pickup'}
              label="수령 인증"
              onPress={() => setScanMode('pickup')}
            />
          </View>

          <QrScannerShell
            enableNativeScanner
            key={`${scanMode}-${scannerSession}`}
            lastScannedValue={lastScannedValue}
            onValidScan={handleValidScan}
            testID="inventory-qr-scanner"
          />

          <Text style={styles.scanMessage}>{scanMessage}</Text>
          {isConfirming ? (
            <View style={styles.confirmingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.confirmingText}>QR 인증 요청 중...</Text>
            </View>
          ) : null}

          {scanRetryAvailable && !isConfirming ? (
            <TouchableOpacity
              testID="inventory-qr-retry-scan-action"
              onPress={handleRetryScan}
              style={styles.retryScanButton}>
              <Text style={styles.retryScanButtonText}>다시 스캔</Text>
            </TouchableOpacity>
          ) : null}

        </View>

        {storeConfirmed ? (
          <>
            <InventoryLabelInstructionCard
              deadlineLabel={deadlineLabel}
              itemName={LABEL_SAMPLE.itemName}
              labelCode={labelCode}
              storageZone={storageZoneLabel}
              testID="inventory-qr-label"
            />
            <View style={styles.policyPanel}>
              <Text style={styles.policyTitle}>보관 정책 안내</Text>
              <Text style={styles.policyText}>
                {SAMPLE_STORAGE_POLICY.guidance}
              </Text>
              {SAMPLE_STORAGE_POLICY.needsReview ? (
                <Text style={styles.policyReviewText}>
                  운영자 확인 대상입니다. 이 기준은 서비스 노출과 회수
                  판단용입니다.
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.emptyLabelPanel}>
            <Text style={styles.emptyLabelTitle}>라벨은 보관 인증 후 표시</Text>
            <Text style={styles.emptyLabelText}>
              공급자가 냉장고 QR을 스캔하면 라벨 코드와 보관 구역 안내가
              표시됩니다.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

type ModeButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

const ModeButton = ({ active, label, onPress }: ModeButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modeButton, active && styles.modeButtonActive]}>
    <Text
      style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
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
    backgroundColor: colors.background,
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
    fontSize: 30,
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
    gap: 12,
    padding: 16,
    paddingBottom: SCROLL_CONTENT_MIN_BOTTOM_PADDING,
  },
  missingRouteContent: {
    margin: 16,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  missingRouteTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  missingRouteText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  missingRouteButton: {
    minHeight: 44,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  missingRouteButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  notice: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  noticeText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#9A3412',
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  fridgeCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionNote: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    color: colors.textSecondary,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.primary,
  },
  scanMessage: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  confirmingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  confirmingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  retryScanButton: {
    minHeight: 44,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryScanButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyLabelPanel: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  },
  emptyLabelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyLabelText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  policyPanel: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  policyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  policyReviewText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#92400E',
  },
});

export default InventoryQrScreen;
