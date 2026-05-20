import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import type {RootStackParamList} from '@/navigation/types';
import {
  InventoryCountdownBadge,
  InventoryLabelInstructionCard,
  InventoryProgressStepper,
  createPendingStoreExpiresAt,
  resolveStoragePolicy,
  type InventoryDisplayStatus,
} from '@/features/inventory';
import {
  QrScannerShell,
  buildFridgeQrVerificationUrl,
  getQrVerificationErrorMessage,
  type FridgeQrVerificationTarget,
} from '@/features/qr';
import {confirmPickup, confirmStore} from '@/api/inventory';
import type {
  ConfirmPickupResult,
  ConfirmStoreResult,
} from '@/api/inventory';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryQrPrototype'>;

type ScanMode = 'store' | 'pickup';

const SELECTED_FRIDGE = {
  name: '광주역 앞 공유냉장고',
  publicCode: 'GJ-BUKGU_001',
  location: '광주 북구 중흥동',
};

const LABEL_SAMPLE = {
  labelCode: '#0042',
  itemName: '토마토',
  quality: 'Mid' as const,
};

const PROTOTYPE_NOW = new Date('2026-05-19T00:05:00.000Z');
const HOLD_STARTED_AT = new Date('2026-05-19T00:00:00.000Z');
const HOLD_EXPIRES_AT = createPendingStoreExpiresAt(HOLD_STARTED_AT);
const SAMPLE_STORAGE_POLICY = resolveStoragePolicy({
  itemName: LABEL_SAMPLE.itemName,
  quality: LABEL_SAMPLE.quality,
  storedAt: HOLD_STARTED_AT,
});

const PENDING_STORE_TIMEOUT_MS = 10 * 60 * 1000;
const REQUEST_HOLD_TIMEOUT_MS = 30 * 60 * 1000;
const UNKNOWN_FRIDGE_CODE_LABEL = 'QR 스캔 후 확인';

const wrongFridgePayload = 'foodlink://fridges/GJ-WRONG-999/verify';

const addScanNonce = (payload: string, nonce: number): string => {
  const separator = payload.includes('?') ? '&' : '?';

  return `${payload}${separator}scan=${nonce}`;
};

const getErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const response = (error as {response?: {status?: unknown}}).response;
  return typeof response?.status === 'number' ? response.status : null;
};

const isValidDateInput = (value?: string): value is string => {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
};

const InventoryQrPrototypeScreen = ({navigation, route}: Props) => {
  const params = route.params;
  const postId = params?.postId;
  const isApiBacked = typeof postId === 'number';
  const routeFridgePublicCode = params?.fridgePublicCode;
  const expectedFridgePublicCode =
    routeFridgePublicCode ??
    (isApiBacked ? undefined : SELECTED_FRIDGE.publicCode);
  const displayFridgePublicCode =
    expectedFridgePublicCode ?? UNKNOWN_FRIDGE_CODE_LABEL;
  const fridgeName = params?.fridgeName ?? SELECTED_FRIDGE.name;
  const fridgeLocation = params?.fridgeLocation ?? SELECTED_FRIDGE.location;
  const scanSerial = useRef(0);
  const [scanMode, setScanMode] = useState<ScanMode>(params?.mode ?? 'store');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const [storeConfirmed, setStoreConfirmed] = useState(false);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedStoreResult, setConfirmedStoreResult] =
    useState<ConfirmStoreResult | null>(null);
  const [confirmedPickupResult, setConfirmedPickupResult] =
    useState<ConfirmPickupResult | null>(null);
  const [scanMessage, setScanMessage] = useState(
    isApiBacked
      ? '냉장고 QR을 스캔하면 실제 인증 API를 호출합니다.'
      : '냉장고 QR을 스캔하면 이 화면에서 보관/수령 흐름을 확인할 수 있어요.',
  );

  useEffect(() => {
    if (!isApiBacked) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isApiBacked]);

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
    if (!isApiBacked) {
      return HOLD_EXPIRES_AT;
    }

    if (isValidDateInput(params?.pendingExpiresAt)) {
      return params.pendingExpiresAt;
    }

    return apiFallbackExpiresAt;
  }, [apiFallbackExpiresAt, isApiBacked, params?.pendingExpiresAt]);

  const countdownNow = isApiBacked ? currentTime : PROTOTYPE_NOW;

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

  const simulateScan = useCallback((payload: string) => {
    scanSerial.current += 1;
    setLastScannedValue(addScanNonce(payload, scanSerial.current));
  }, []);

  const simulatedFridgePublicCode =
    expectedFridgePublicCode ?? SELECTED_FRIDGE.publicCode;

  const handleValidScan = useCallback(
    async (target: FridgeQrVerificationTarget) => {
      if (
        expectedFridgePublicCode &&
        target.fridgePublicCode !== expectedFridgePublicCode
      ) {
        setScanMessage('선택한 냉장고 QR이 아닙니다. 다시 확인해주세요.');
        return;
      }

      if (scanMode === 'store') {
        if (isApiBacked) {
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
              setScanMessage(
                response.message ||
                  '입고 인증 완료. 라벨 코드를 식재료에 붙여주세요.',
              );
              return;
            }

            setScanMessage(response.message || '입고 인증에 실패했습니다.');
          } catch (error) {
            const message = getQrVerificationErrorMessage(getErrorStatus(error));
            setScanMessage(message);
            Alert.alert('QR 인증 실패', message);
          } finally {
            setIsConfirming(false);
          }
          return;
        }

        setStoreConfirmed(true);
        setPickupConfirmed(false);
        setScanMessage('보관 인증 완료. 라벨 코드를 식재료에 붙여주세요.');
        return;
      }

      if (!storeConfirmed && !isApiBacked) {
        setScanMessage('수령 테스트 전에 보관 인증을 먼저 완료해주세요.');
        return;
      }

      if (isApiBacked) {
        setIsConfirming(true);
        try {
          const response = await confirmPickup({
            postId,
            fridgePublicCode: target.fridgePublicCode,
          });

          if (response.success && response.data) {
            setConfirmedPickupResult(response.data);
            setPickupConfirmed(true);
            setScanMessage(response.message || '수령 인증이 완료되었습니다.');
            return;
          }

          setScanMessage(response.message || '수령 인증에 실패했습니다.');
        } catch (error) {
          const message = getQrVerificationErrorMessage(getErrorStatus(error));
          setScanMessage(message);
          Alert.alert('QR 인증 실패', message);
        } finally {
          setIsConfirming(false);
        }
        return;
      }

      setPickupConfirmed(true);
      setScanMessage('수령 인증 완료. 임시 선점이 종료됐습니다.');
    },
    [expectedFridgePublicCode, isApiBacked, postId, scanMode, storeConfirmed],
  );

  const resetPrototype = () => {
    setScanMode('store');
    setLastScannedValue(null);
    setStoreConfirmed(false);
    setPickupConfirmed(false);
    setConfirmedStoreResult(null);
    setConfirmedPickupResult(null);
    setScanMessage(
      isApiBacked
        ? '냉장고 QR을 스캔하면 실제 인증 API를 호출합니다.'
        : '냉장고 QR을 스캔하면 이 화면에서 보관/수령 흐름을 확인할 수 있어요.',
    );
  };

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

  return (
    <View style={styles.container} testID="inventory-qr-prototype-screen">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>냉장고 QR 흐름 테스트</Text>
          <Text style={styles.subtitle}>
            백엔드 계약 전 프론트 동작 검증용
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            {isApiBacked ? '실제 API 연결' : '프로토타입'}
          </Text>
          <Text style={styles.noticeText}>
            {isApiBacked
              ? 'QR 스캔 성공 시 백엔드 인증 API를 호출합니다. API가 아직 배포되지 않았다면 실패 Alert가 표시됩니다.'
              : '실제 상태 저장이나 API 호출 없이 QR 파서, 30분 선점, 라벨 안내 UI만 연결합니다.'}
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

          <View style={styles.actionGrid}>
            <ActionButton
              label="보관 QR 테스트"
              onPress={() => {
                setScanMode('store');
                simulateScan(
                  buildFridgeQrVerificationUrl(
                    'https://foodlink.app',
                    simulatedFridgePublicCode,
                  ),
                );
              }}
            />
            <ActionButton
              label="수령 QR 테스트"
              onPress={() => {
                setScanMode('pickup');
                simulateScan(
                  buildFridgeQrVerificationUrl(
                    'https://foodlink.app',
                    simulatedFridgePublicCode,
                  ),
                );
              }}
            />
            <ActionButton
              label="다른 냉장고 QR"
              testID="inventory-qr-wrong-fridge-action"
              tone="warning"
              onPress={() => simulateScan(wrongFridgePayload)}
            />
            <ActionButton
              label="초기화"
              tone="secondary"
              onPress={resetPrototype}
            />
          </View>
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
                  운영자 확인 대상입니다. 이 기준은 서비스 노출과 회수 판단용입니다.
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

const ModeButton = ({active, label, onPress}: ModeButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modeButton, active && styles.modeButtonActive]}>
    <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  testID?: string;
  tone?: 'primary' | 'secondary' | 'warning';
};

const ActionButton = ({
  label,
  onPress,
  testID,
  tone = 'primary',
}: ActionButtonProps) => (
  <TouchableOpacity
    testID={testID}
    onPress={onPress}
    style={[styles.actionButton, actionButtonTone(tone)]}>
    <Text style={[styles.actionButtonText, actionButtonTextTone(tone)]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const actionButtonTone = (tone: ActionButtonProps['tone']) => {
  if (tone === 'secondary') {
    return styles.secondaryActionButton;
  }

  if (tone === 'warning') {
    return styles.warningActionButton;
  }

  return styles.primaryActionButton;
};

const actionButtonTextTone = (tone: ActionButtonProps['tone']) => {
  if (tone === 'secondary') {
    return styles.secondaryActionButtonText;
  }

  if (tone === 'warning') {
    return styles.warningActionButtonText;
  }

  return styles.primaryActionButtonText;
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
    paddingBottom: 36,
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    width: '48%',
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
  },
  secondaryActionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningActionButton: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryActionButtonText: {
    color: colors.textOnPrimary,
  },
  secondaryActionButtonText: {
    color: colors.textPrimary,
  },
  warningActionButtonText: {
    color: '#92400E',
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

export default InventoryQrPrototypeScreen;
