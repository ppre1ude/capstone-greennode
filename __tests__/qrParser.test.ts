import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  buildFridgeQrVerificationUrl,
  parseFoodLinkQrPayload,
  QrScannerShell,
} from '@/features/qr';

describe('parseFoodLinkQrPayload', () => {
  it('accepts FoodLink deep link QR payloads with surrounding whitespace and query/hash', () => {
    expect(
      parseFoodLinkQrPayload(
        '  foodlink://fridges/GJ-BUKGU_001/verify?camera=1#scan  ',
      ),
    ).toEqual({
      valid: true,
      target: {
        type: 'fridge-verification',
        fridgePublicCode: 'GJ-BUKGU_001',
        source: 'deep-link',
      },
    });
  });

  it('accepts HTTPS fallback QR payloads with query/hash', () => {
    expect(
      parseFoodLinkQrPayload('https://foodlink.app/q/fridges/gj-bukgu-001#top'),
    ).toEqual({
      valid: true,
      target: {
        type: 'fridge-verification',
        fridgePublicCode: 'gj-bukgu-001',
        source: 'https',
      },
    });
  });

  it('accepts backend JSON QR payloads', () => {
    expect(
      parseFoodLinkQrPayload('{"fridgePublicCode":"GJ-STATION-001"}'),
    ).toEqual({
      valid: true,
      target: {
        type: 'fridge-verification',
        fridgePublicCode: 'GJ-STATION-001',
        source: 'json',
      },
    });
  });

  it('accepts a plain fridge public code payload', () => {
    expect(parseFoodLinkQrPayload('  GJ-STATION-001  ')).toEqual({
      valid: true,
      target: {
        type: 'fridge-verification',
        fridgePublicCode: 'GJ-STATION-001',
        source: 'plain-code',
      },
    });
  });

  it('rejects empty, unrelated, and invalid public code payloads', () => {
    expect(parseFoodLinkQrPayload('   ')).toEqual({
      valid: false,
      reason: 'empty',
    });
    expect(
      parseFoodLinkQrPayload('https://example.com/q/fridges/GJ-001'),
    ).toEqual({
      valid: false,
      reason: 'unsupported-url',
    });
    expect(parseFoodLinkQrPayload('not a FoodLink QR')).toEqual({
      valid: false,
      reason: 'unsupported-url',
    });
    expect(parseFoodLinkQrPayload('{"fridgePublicCode":"bad code"}')).toEqual({
      valid: false,
      reason: 'invalid-public-code',
    });
    expect(
      parseFoodLinkQrPayload('foodlink://fridges/bad code/verify'),
    ).toEqual({
      valid: false,
      reason: 'invalid-public-code',
    });
  });
});

describe('buildFridgeQrVerificationUrl', () => {
  it('builds an HTTPS fridge verification QR URL from a base URL and public code', () => {
    expect(
      buildFridgeQrVerificationUrl(' https://foodlink.app/ ', 'GJ-BUKGU_001'),
    ).toBe('https://foodlink.app/q/fridges/GJ-BUKGU_001');
  });

  it('rejects invalid input before building a QR URL', () => {
    expect(() => buildFridgeQrVerificationUrl('', 'GJ-BUKGU_001')).toThrow(
      'baseUrl',
    );
    expect(() =>
      buildFridgeQrVerificationUrl('https://foodlink.app', 'bad code'),
    ).toThrow('fridgePublicCode');
  });
});

describe('QrScannerShell', () => {
  it('calls onValidScan with a parsed fridge target when rawValue is valid', async () => {
    const onValidScan = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(QrScannerShell, {
          testID: 'qr-shell',
          rawValue: 'foodlink://fridges/GJ-BUKGU_001/verify',
          onValidScan,
        }),
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findByProps({ testID: 'qr-shell' })).toBeTruthy();
    expect(onValidScan).toHaveBeenCalledTimes(1);
    expect(onValidScan).toHaveBeenCalledWith({
      type: 'fridge-verification',
      fridgePublicCode: 'GJ-BUKGU_001',
      source: 'deep-link',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('ignores invalid lastScannedValue payloads', async () => {
    const onValidScan = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(QrScannerShell, {
          testID: 'qr-shell',
          lastScannedValue: 'not a FoodLink QR',
          onValidScan,
        }),
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findByProps({ testID: 'qr-shell' })).toBeTruthy();
    expect(onValidScan).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
