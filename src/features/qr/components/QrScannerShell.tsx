import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const scanValue = rawValue ?? lastScannedValue ?? nativeRawValue ?? null;
  const visibleLastScannedValue = lastScannedValue ?? rawValue ?? null;

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
        {enableNativeScanner ? (
          <NativeQrScanner
            onRawValue={setNativeRawValue}
            testID={`${testID}-native-camera`}
          />
        ) : null}
        <Text style={styles.title}>냉장고 QR 스캔</Text>
        <Text style={styles.description}>
          공유 냉장고에 붙은 FoodLink QR을 카메라에 맞춰주세요.
        </Text>
      </View>
      {visibleLastScannedValue ? (
        <Text testID={`${testID}-last-value`} style={styles.lastValue}>
          {visibleLastScannedValue}
        </Text>
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9ECEF',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  scanFrame: {
    alignItems: 'center',
    borderColor: '#1E623B',
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 160,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 16,
    width: '100%',
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
