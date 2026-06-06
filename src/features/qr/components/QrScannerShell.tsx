import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  isScannedCode,
  type ScannedCode,
  type ScannedObject,
  type ScannedObjectType,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
} from 'react-native-vision-camera';
import { colors, spacing } from '@/theme';
import { parseFoodLinkQrPayload } from '../utils/qrPayload';
import type { FridgeQrVerificationTarget } from '../types';

const QR_OBJECT_TYPES: ScannedObjectType[] = ['qr', 'micro-qr'];

const isQrScannedCode = (object: ScannedObject): object is ScannedCode =>
  QR_OBJECT_TYPES.includes(object.type) && isScannedCode(object);

type QrScannerShellProps = {
  testID?: string;
  rawValue?: string | null;
  lastScannedValue?: string | null;
  enableNativeScanner?: boolean;
  onValidScan: (target: FridgeQrVerificationTarget) => void;
};

export const QrScannerShell = ({
  testID = 'qr-scanner-shell',
  rawValue,
  lastScannedValue,
  enableNativeScanner = false,
  onValidScan,
}: QrScannerShellProps) => {
  const deliveredRawValueRef = useRef<string | null>(null);
  const [nativeRawValue, setNativeRawValue] = useState<string | null>(null);
  const [manualFridgeCode, setManualFridgeCode] = useState('');
  const [isNativeScannerOpen, setIsNativeScannerOpen] = useState(false);
  const scanValue = rawValue ?? lastScannedValue ?? nativeRawValue ?? null;
  const visibleLastScannedValue = lastScannedValue ?? rawValue ?? null;
  const normalizedManualFridgeCode = manualFridgeCode.trim();
  const canSubmitManualFridgeCode = normalizedManualFridgeCode.length > 0;
  const nativeQrObjectOutputSupported = Platform.OS !== 'android';

  const handleSubmitManualFridgeCode = useCallback(() => {
    if (!canSubmitManualFridgeCode) {
      return;
    }

    setNativeRawValue(normalizedManualFridgeCode);
  }, [canSubmitManualFridgeCode, normalizedManualFridgeCode]);

  const handleOpenNativeScanner = useCallback(() => {
    setIsNativeScannerOpen(true);
  }, []);

  useEffect(() => {
    if (typeof scanValue !== 'string') {
      return;
    }

    const normalizedScanValue = scanValue.trim();

    if (
      !normalizedScanValue ||
      deliveredRawValueRef.current === normalizedScanValue
    ) {
      return;
    }

    deliveredRawValueRef.current = normalizedScanValue;
    const parsedPayload = parseFoodLinkQrPayload(normalizedScanValue);

    if (parsedPayload.valid) {
      onValidScan(parsedPayload.target);
    }
  }, [onValidScan, scanValue]);

  return (
    <View testID={testID} style={styles.container}>
      <View style={styles.scanFrame}>
        {enableNativeScanner && isNativeScannerOpen ? (
          <>
            <View style={styles.nativeCameraSurface}>
              {nativeQrObjectOutputSupported ? (
                <NativeQrScanner
                  onRawValue={setNativeRawValue}
                  testID={`${testID}-native-camera`}
                />
              ) : (
                <NativeCameraPreview testID={`${testID}-native-camera`} />
              )}
              <View pointerEvents="none" style={styles.cameraGuide}>
                <View style={styles.cameraGuideCorner} />
              </View>
            </View>
            <Text style={styles.activeTitle}>냉장고 QR 스캔 중</Text>
            <Text style={styles.activeDescription}>
              QR을 화면 중앙에 맞춰주세요. 스캔이 어렵다면 아래 FoodLink
              코드를 입력할 수 있어요.
            </Text>
          </>
        ) : enableNativeScanner ? (
          <View style={styles.scannerStartPanel}>
            <Text style={styles.title}>냉장고 QR 스캔</Text>
            <Text style={styles.description}>
              공유 냉장고 앞에서 카메라를 열고 QR을 화면 중앙에 맞춰주세요.
            </Text>
            <TouchableOpacity
              onPress={handleOpenNativeScanner}
              style={styles.openCameraButton}>
              <Text style={styles.openCameraButtonText}>
                카메라로 QR 스캔
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>냉장고 QR 스캔</Text>
            <Text style={styles.description}>
              공유 냉장고에 붙은 FoodLink QR을 카메라에 맞춰주세요.
            </Text>
          </>
        )}
      </View>
      {visibleLastScannedValue ? (
        <Text testID={`${testID}-last-value`} style={styles.lastValue}>
          {visibleLastScannedValue}
        </Text>
      ) : null}
      {enableNativeScanner ? (
        <View style={styles.manualCodePanel}>
          <Text style={styles.manualCodeTitle}>냉장고 코드로 인증</Text>
          <Text style={styles.manualCodeText}>
            QR 스캔이 어렵다면 냉장고에 적힌 FoodLink 코드를 입력해주세요.
          </Text>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={setManualFridgeCode}
            onSubmitEditing={handleSubmitManualFridgeCode}
            placeholder="예: FL-DRAGON-01"
            placeholderTextColor="#999999"
            returnKeyType="done"
            style={styles.manualCodeInput}
            value={manualFridgeCode}
          />
          <TouchableOpacity
            disabled={!canSubmitManualFridgeCode}
            onPress={handleSubmitManualFridgeCode}
            style={[
              styles.manualCodeButton,
              !canSubmitManualFridgeCode && styles.manualCodeButtonDisabled,
            ]}>
            <Text
              style={[
                styles.manualCodeButtonText,
                !canSubmitManualFridgeCode &&
                  styles.manualCodeButtonTextDisabled,
              ]}>
              코드로 인증
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

type NativeQrScannerProps = {
  onRawValue: (rawValue: string) => void;
  testID: string;
};

const NativeQrScanner = ({ onRawValue, testID }: NativeQrScannerProps) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleObjectsScanned = useCallback(
    (objects: ScannedObject[]) => {
      const scannedCode = objects.filter(isQrScannedCode).find(
        code =>
          typeof code.value === 'string' && code.value.trim().length > 0,
      );

      if (scannedCode?.value) {
        onRawValue(scannedCode.value);
      }
    },
    [onRawValue],
  );

  const objectOutput = useObjectOutput({
    types: QR_OBJECT_TYPES,
    onObjectsScanned: handleObjectsScanned,
  });

  if (!hasPermission) {
    return (
      <View style={styles.nativeFallback}>
        <Text style={styles.nativeFallbackTitle}>
          카메라 권한이 필요합니다
        </Text>
        <Text style={styles.nativeFallbackText}>
          권한을 허용한 뒤 냉장고 QR을 다시 스캔해주세요.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>권한 다시 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.nativeFallback}>
        <Text style={styles.nativeFallbackTitle}>
          후면 카메라를 찾을 수 없습니다
        </Text>
        <Text style={styles.nativeFallbackText}>
          기기의 카메라 상태를 확인한 뒤 다시 시도해주세요.
        </Text>
      </View>
    );
  }

  return (
    <Camera
      device={device}
      isActive={hasPermission}
      nativeID={testID}
      outputs={[objectOutput]}
      style={StyleSheet.absoluteFill}
    />
  );
};

type NativeCameraPreviewProps = {
  testID: string;
};

const NativeCameraPreview = ({ testID }: NativeCameraPreviewProps) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.nativeFallback}>
        <Text style={styles.nativeFallbackTitle}>
          카메라 권한이 필요합니다
        </Text>
        <Text style={styles.nativeFallbackText}>
          권한을 허용한 뒤 냉장고 QR을 다시 확인해주세요.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>권한 다시 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.nativeFallback}>
        <Text style={styles.nativeFallbackTitle}>
          후면 카메라를 찾을 수 없습니다
        </Text>
        <Text style={styles.nativeFallbackText}>
          기기의 카메라 상태를 확인한 뒤 다시 시도해주세요.
        </Text>
      </View>
    );
  }

  return (
    <Camera
      device={device}
      isActive={hasPermission}
      nativeID={testID}
      style={StyleSheet.absoluteFill}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },
  scanFrame: {
    alignItems: 'center',
    backgroundColor: '#F8FCF4',
    borderColor: '#DDEBD9',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 160,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: spacing.md,
    width: '100%',
  },
  nativeCameraSurface: {
    alignItems: 'center',
    backgroundColor: '#102618',
    borderRadius: 8,
    height: 210,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  cameraGuide: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 12,
    borderWidth: 2,
    height: 132,
    justifyContent: 'center',
    position: 'absolute',
    width: 132,
  },
  cameraGuideCorner: {
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 10,
    borderWidth: 1,
    height: 104,
    width: 104,
  },
  nativeFallback: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
    padding: 12,
    width: '100%',
  },
  nativeFallbackTitle: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  nativeFallbackText: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  scannerStartPanel: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    width: '100%',
  },
  openCameraButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1E623B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  openCameraButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  manualCodePanel: {
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DD',
    borderWidth: 1,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  manualCodeTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'left',
  },
  manualCodeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
  },
  manualCodeInput: {
    minHeight: 44,
    borderColor: '#DDE5DD',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  manualCodeButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1E623B',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  manualCodeButtonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  manualCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  manualCodeButtonTextDisabled: {
    color: '#999999',
  },
  permissionButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E623B',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  permissionButtonText: {
    color: '#1E623B',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  activeTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  activeDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  description: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  lastValue: {
    color: '#666666',
    fontSize: 12,
    marginTop: 12,
  },
});
