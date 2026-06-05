import React from 'react';
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

let mockHasCameraPermission = true;
let mockCameraDevice: unknown = { id: 'back' };
const mockRequestCameraPermission = jest.fn();
const mockUseObjectOutput = jest.fn((_options?: unknown) => ({
  testID: 'mock-object-output',
}));

jest.mock('react-native-vision-camera', () => {
  const ReactForMock = require('react');
  const { View: MockView } = require('react-native');

  return {
    Camera: ReactForMock.forwardRef((props: unknown, ref: React.Ref<unknown>) =>
      ReactForMock.createElement(MockView, { ...(props as object), ref }),
    ),
    isScannedCode: (object: { value?: unknown }) => 'value' in object,
    useCameraDevice: jest.fn(() => mockCameraDevice),
    useCameraPermission: jest.fn(() => ({
      hasPermission: mockHasCameraPermission,
      requestPermission: mockRequestCameraPermission,
    })),
    useObjectOutput: (options: unknown) => mockUseObjectOutput(options),
  };
});

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
  const originalPlatformOS = Platform.OS;

  const setPlatformOS = (os: typeof Platform.OS) => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: os,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasCameraPermission = true;
    mockCameraDevice = { id: 'back' };
    mockUseObjectOutput.mockImplementation(() => ({
      testID: 'mock-object-output',
    }));
    setPlatformOS(originalPlatformOS);
  });

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

  it('shows a permission recovery action when native scanning lacks camera permission', async () => {
    mockHasCameraPermission = false;
    const onValidScan = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(QrScannerShell, {
          testID: 'qr-shell',
          enableNativeScanner: true,
          onValidScan,
        }),
      );
      await Promise.resolve();
    });

    expect(
      renderer!.root
        .findAllByType(Text)
        .map(node => node.props.children)
        .join(''),
    ).toContain('카메라 권한이 필요합니다');

    await ReactTestRenderer.act(async () => {
      renderer!.root.findByType(TouchableOpacity).props.onPress();
      await Promise.resolve();
    });

    expect(mockRequestCameraPermission).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('shows a no-camera fallback when native scanning cannot find a back camera', async () => {
    mockCameraDevice = null;
    const onValidScan = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(QrScannerShell, {
          testID: 'qr-shell',
          enableNativeScanner: true,
          onValidScan,
        }),
      );
      await Promise.resolve();
    });

    expect(
      renderer!.root
        .findAllByType(Text)
        .map(node => node.props.children)
        .join(''),
    ).toContain('후면 카메라를 찾을 수 없습니다');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('allows Android users to submit a fridge code when native object output is unavailable', async () => {
    setPlatformOS('android');
    mockUseObjectOutput.mockImplementation(() => {
      throw new Error('CameraObjectOutput is not available on Android');
    });
    const onValidScan = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(QrScannerShell, {
          testID: 'qr-shell',
          enableNativeScanner: true,
          onValidScan,
        }),
      );
      await Promise.resolve();
    });

    const visibleText = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .join('');

    expect(visibleText).toContain('냉장고 코드로 인증');
    expect(mockUseObjectOutput).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByType(TextInput)
        .props.onChangeText('FL-DRAGON-01');
      await Promise.resolve();
    });

    const submitButton = renderer!.root.findAllByType(TouchableOpacity).find(
      node =>
        node
          .findAllByType(Text)
          .some(textNode => textNode.props.children === '코드로 인증'),
    );

    expect(submitButton).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      submitButton!.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onValidScan).toHaveBeenCalledWith({
      type: 'fridge-verification',
      fridgePublicCode: 'FL-DRAGON-01',
      source: 'plain-code',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
