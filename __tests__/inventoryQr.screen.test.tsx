import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { confirmPickup, confirmStore } from '@/api/inventory';
import InventoryQrScreen from '@/screens/inventory/InventoryQrScreen';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';

let mockOnObjectsScanned:
  | ((objects: Array<{ type: string; value?: string }>) => void)
  | undefined;

jest.mock('react-native-vision-camera', () => {
  const ReactForMock = require('react');
  const { View: MockView } = require('react-native');

  return {
    Camera: ReactForMock.forwardRef((props: unknown, ref: React.Ref<unknown>) =>
      ReactForMock.createElement(MockView, { ...(props as object), ref }),
    ),
    isScannedCode: (object: { value?: unknown }) => 'value' in object,
    useCameraDevice: jest.fn(() => ({ id: 'back' })),
    useCameraPermission: jest.fn(() => ({
      hasPermission: true,
      requestPermission: jest.fn(),
    })),
    useObjectOutput: jest.fn(
      ({
        onObjectsScanned,
      }: {
        onObjectsScanned?: (
          objects: Array<{ type: string; value?: string }>,
        ) => void;
      }) => {
        mockOnObjectsScanned = onObjectsScanned;
        return { testID: 'mock-object-output' };
      },
    ),
  };
});

jest.mock('@/api/inventory', () => ({
  confirmPickup: jest.fn(),
  confirmStore: jest.fn(),
}));

const mockedConfirmStore = confirmStore as jest.MockedFunction<
  typeof confirmStore
>;
const mockedConfirmPickup = confirmPickup as jest.MockedFunction<
  typeof confirmPickup
>;

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(flattenText).join('');
  }

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
};

const getTextContent = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map(node => flattenText(node.props.children));

const findTouchableByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) => {
  const touchable = renderer.root.findAll(
    node =>
      node.type === TouchableOpacity &&
      node.findAllByProps({ children: text }).length > 0,
  )[0];

  if (!touchable) {
    throw new Error(`Touchable with text "${text}" not found`);
  }

  return touchable;
};

const apiError = (status: number) => ({
  response: {
    status,
  },
});

const scanNativeQrValue = async (value: string, type = 'qr') => {
  if (!mockOnObjectsScanned) {
    throw new Error('Native QR scanner callback was not registered');
  }

  await ReactTestRenderer.act(async () => {
    mockOnObjectsScanned?.([{ type, value }]);
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('InventoryQrScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnObjectsScanned = undefined;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    useFeedRefreshStore.setState({
      nearbyPostsRefreshToken: 0,
      requestedPostId: null,
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders the QR and inventory verification surface without internal QA language', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={{ params: undefined } as any}
        />,
      );
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).toContain('냉장고 QR 인증');
    expect(textContent).toContain('광주역 앞 공유냉장고');
    expect(textContent).toContain('05:00');
    expect(textContent).toContain('등록 대기');
    expect(textContent).toContain('라벨은 보관 인증 후 표시');
    expect(textContent).toContain('보관 QR 스캔');
    expect(textContent).toContain('수령 QR 스캔');
    expect(textContent).toContain('다른 냉장고 스캔');
    expect(textContent).toContain('다시 시작');
    expect(textContent).not.toContain('냉장고 QR 흐름 테스트');
    expect(textContent).not.toContain('\uD504\uB85C\uD1A0\uD0C0\uC785');
    expect(textContent).not.toContain('보관 QR 테스트');
    expect(textContent).not.toContain('수령 QR 테스트');
    expect(textContent).not.toContain('초기화');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('does not expose simulation actions on a post-backed QR scan route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).not.toContain('보관 QR 스캔');
    expect(textContent).not.toContain('수령 QR 스캔');
    expect(textContent).not.toContain('다른 냉장고 스캔');
    expect(textContent).not.toContain('다시 시작');
    expect(textContent).not.toContain('다시 스캔');
    expect(
      renderer!.root.findAllByProps({
        testID: 'inventory-qr-wrong-fridge-action',
      }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('lets the user retry the same store QR after a failed confirmation', async () => {
    mockedConfirmStore
      .mockRejectedValueOnce(apiError(410))
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: {
          postId: 10,
          status: 'available',
          labelCode: '#03',
          storageZone: 'GENERAL',
          storageDeadlineAt: '2026-06-18T05:30:00Z',
          storedAt: '2026-05-19T05:30:00Z',
        },
      });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmStore).toHaveBeenCalledTimes(1);
    expect(getTextContent(renderer!)).toContain('다시 스캔');

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다시 스캔').props.onPress();
      await Promise.resolve();
    });

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmStore).toHaveBeenCalledTimes(2);
    expect(mockedConfirmStore).toHaveBeenLastCalledWith({
      postId: 10,
      fridgePublicCode: 'GJ-STATION-001',
    });
    expect(getTextContent(renderer!)).toContain('#03');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('simulates a valid store QR scan and reveals label instructions', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={{ params: undefined } as any}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '보관 QR 스캔').props.onPress();
      await Promise.resolve();
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).toContain(
      '보관 인증 완료. 라벨 코드를 식재료에 붙여주세요.',
    );
    expect(textContent).toContain('#0042');
    expect(textContent).toContain('토마토');
    expect(textContent).toContain('일반 구역');
    expect(textContent).toContain('보관 정책 안내');
    expect(textContent).toContain(
      '일반 구역에 배치하고 서버의 품질 판정에 따른 회수 기준을 씁니다.',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('blocks a mismatched fridge QR scan', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={{ params: undefined } as any}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다른 냉장고 스캔').props.onPress();
      await Promise.resolve();
    });

    expect(getTextContent(renderer!)).toContain(
      '선택한 냉장고 QR이 아닙니다. 다시 확인해주세요.',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('calls confirm-store when a post-backed store QR scan succeeds', async () => {
    mockedConfirmStore.mockResolvedValue({
      success: true,
      message: '입고 인증이 완료되었습니다. 등록번호 #03을 라벨에 적어주세요.',
      data: {
        postId: 10,
        status: 'available',
        labelCode: '#03',
        storageZone: 'ETHYLENE_SEPARATED',
        storageDeadlineAt: '2026-06-18T05:30:00Z',
        storedAt: '2026-05-19T05:30:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
                fridgeName: '광주역 앞 공유냉장고',
                fridgeLocation: '광주 북구 중흥동',
              },
            } as any
          }
        />,
      );
    });

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmStore).toHaveBeenCalledWith({
      postId: 10,
      fridgePublicCode: 'GJ-STATION-001',
    });
    expect(getTextContent(renderer!)).toContain('#03');
    expect(getTextContent(renderer!)).toContain('에틸렌 분리 구역');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('requests a nearby feed refresh without a removal id when store confirmation succeeds', async () => {
    mockedConfirmStore.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        postId: 42,
        status: 'available',
        labelCode: '#42',
        storageZone: 'GENERAL',
        storageDeadlineAt: '2026-06-18T05:30:00Z',
        storedAt: '2026-05-19T05:30:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const previousToken =
      useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      previousToken + 1,
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('requests a nearby feed refresh with the confirmed pickup response post id', async () => {
    mockedConfirmPickup.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        postId: 43,
        status: 'completed',
        labelCode: '#43',
        storageZone: 'GENERAL',
        pickedUpAt: '2026-05-19T05:30:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'pickup',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const previousToken =
      useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(useFeedRefreshStore.getState().requestedPostId).toBe(43);
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      previousToken + 1,
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps the pending-store state when confirm-store rejects', async () => {
    mockedConfirmStore.mockRejectedValue(apiError(410));

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const previousToken =
      useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmStore).toHaveBeenCalledWith({
      postId: 10,
      fridgePublicCode: 'GJ-STATION-001',
    });
    expect(getTextContent(renderer!)).toContain(
      '보관 기한이 만료된 식재료입니다.',
    );
    expect(getTextContent(renderer!)).toContain('라벨은 보관 인증 후 표시');
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      previousToken,
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'QR 인증 실패',
      '보관 기한이 만료된 식재료입니다.',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps the pending-store state when confirm-store returns a failed ApiResponse', async () => {
    mockedConfirmStore.mockResolvedValue({
      success: false,
      message: '입고 인증에 실패했습니다.',
      data: null,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const previousToken =
      useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(getTextContent(renderer!)).toContain('입고 인증에 실패했습니다.');
    expect(getTextContent(renderer!)).toContain('라벨은 보관 인증 후 표시');
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      previousToken,
    );
    expect(alertSpy).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps pickup unconfirmed when confirm-pickup rejects', async () => {
    mockedConfirmPickup.mockRejectedValue(apiError(409));

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'pickup',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const previousToken =
      useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmPickup).toHaveBeenCalledWith({
      postId: 10,
      fridgePublicCode: 'GJ-STATION-001',
    });
    expect(getTextContent(renderer!)).toContain(
      '이미 수거 완료된 식재료입니다.',
    );
    expect(getTextContent(renderer!)).not.toContain(
      '수령 인증이 완료되었습니다.',
    );
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      previousToken,
    );
    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();
    expect(alertSpy).toHaveBeenCalledWith(
      'QR 인증 실패',
      '이미 수거 완료된 식재료입니다.',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps pickup unconfirmed when confirm-pickup returns a failed ApiResponse', async () => {
    mockedConfirmPickup.mockResolvedValue({
      success: false,
      message: '수령 인증에 실패했습니다.',
      data: null,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'pickup',
                postId: 10,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const previousToken =
      useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(getTextContent(renderer!)).toContain('수령 인증에 실패했습니다.');
    expect(getTextContent(renderer!)).not.toContain(
      '수령 인증이 완료되었습니다.',
    );
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      previousToken,
    );
    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();
    expect(alertSpy).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('runs a full API-backed store then pickup lifecycle', async () => {
    mockedConfirmStore.mockResolvedValue({
      success: true,
      message: '입고 인증이 완료되었습니다.',
      data: {
        postId: 44,
        status: 'available',
        labelCode: '#44',
        storageZone: 'GENERAL',
        storageDeadlineAt: '2026-06-18T05:30:00Z',
        storedAt: '2026-05-19T05:30:00Z',
      },
    });
    mockedConfirmPickup.mockResolvedValue({
      success: true,
      message: '수령 인증이 완료되었습니다.',
      data: {
        postId: 44,
        status: 'completed',
        labelCode: '#44',
        storageZone: 'GENERAL',
        pickedUpAt: '2026-05-20T05:30:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 44,
                fridgePublicCode: 'GJ-STATION-001',
              },
            } as any
          }
        />,
      );
    });

    const initialToken = useFeedRefreshStore.getState().nearbyPostsRefreshToken;

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmStore).toHaveBeenCalledWith({
      postId: 44,
      fridgePublicCode: 'GJ-STATION-001',
    });
    expect(getTextContent(renderer!)).toContain('입고 인증이 완료되었습니다.');
    expect(getTextContent(renderer!)).toContain('#44');
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      initialToken + 1,
    );
    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '수령 인증').props.onPress();
      await Promise.resolve();
    });

    await scanNativeQrValue('foodlink://fridges/GJ-STATION-001/verify');

    expect(mockedConfirmPickup).toHaveBeenCalledWith({
      postId: 44,
      fridgePublicCode: 'GJ-STATION-001',
    });
    expect(getTextContent(renderer!)).toContain('수령 인증이 완료되었습니다.');
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(
      initialToken + 2,
    );
    expect(useFeedRefreshStore.getState().requestedPostId).toBe(44);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders an API-backed countdown from the route expiry and current time', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-20T00:00:00Z').getTime());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                pendingExpiresAt: '2026-05-20T00:07:30Z',
              },
            } as any
          }
        />,
      );
    });

    expect(getTextContent(renderer!)).toContain('07:30');
    expect(getTextContent(renderer!)).not.toContain('05:00');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });

    dateNowSpy.mockRestore();
  });

  it('falls back to an API expiry when route pendingExpiresAt is invalid', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-20T00:00:00Z').getTime());

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                pendingExpiresAt: 'not-a-date',
              },
            } as any
          }
        />,
      );
    });

    const textContent = getTextContent(renderer!);
    expect(textContent).toContain('10:00');
    expect(textContent).not.toContain('NaN:NaN');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });

    dateNowSpy.mockRestore();
  });

  it('lets the backend validate a post-backed store scan when no expected fridge public code is provided', async () => {
    mockedConfirmStore.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        postId: 10,
        status: 'available',
        labelCode: '#03',
        storageZone: 'GENERAL',
        storageDeadlineAt: '2026-06-18T05:30:00Z',
        storedAt: '2026-05-19T05:30:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'store',
                postId: 10,
                pendingExpiresAt: '2030-01-01T00:05:00Z',
              },
            } as any
          }
        />,
      );
    });

    await scanNativeQrValue('foodlink://fridges/GJ-WRONG-999/verify', 'micro-qr');

    expect(mockedConfirmStore).toHaveBeenCalledWith({
      postId: 10,
      fridgePublicCode: 'GJ-WRONG-999',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('lets the backend validate a post-backed pickup scan when no expected fridge public code is provided', async () => {
    mockedConfirmPickup.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        postId: 10,
        status: 'completed',
        labelCode: '#03',
        storageZone: 'GENERAL',
        pickedUpAt: '2026-05-19T05:30:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrScreen
          navigation={{ goBack: jest.fn() } as any}
          route={
            {
              params: {
                mode: 'pickup',
                postId: 10,
                pendingExpiresAt: '2030-01-01T00:30:00Z',
              },
            } as any
          }
        />,
      );
    });

    await scanNativeQrValue('foodlink://fridges/GJ-WRONG-999/verify');

    expect(mockedConfirmPickup).toHaveBeenCalledWith({
      postId: 10,
      fridgePublicCode: 'GJ-WRONG-999',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
