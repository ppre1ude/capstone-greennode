import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseFoodLinkQrPayload } from '../utils/qrPayload';
import type { FridgeQrVerificationTarget } from '../types';

type QrScannerShellProps = {
  testID?: string;
  rawValue?: string | null;
  lastScannedValue?: string | null;
  onValidScan: (target: FridgeQrVerificationTarget) => void;
};

export const QrScannerShell = ({
  testID = 'qr-scanner-shell',
  rawValue,
  lastScannedValue,
  onValidScan,
}: QrScannerShellProps) => {
  const deliveredRawValueRef = useRef<string | null>(null);
  const scanValue = rawValue ?? lastScannedValue ?? null;
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
    padding: 16,
    width: '100%',
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
