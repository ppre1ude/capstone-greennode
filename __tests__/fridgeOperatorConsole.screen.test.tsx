import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  disposeOperatorItem,
  getOperatorInventoryItems,
  getOperatorInventorySummary,
} from '@/api/operator';
import FridgeOperatorConsoleScreen from '@/screens/operator/FridgeOperatorConsoleScreen';

jest.mock('@/api/operator', () => ({
  disposeOperatorItem: jest.fn(),
  getOperatorInventoryItems: jest.fn(),
  getOperatorInventorySummary: jest.fn(),
}));

const mockedDisposeOperatorItem = disposeOperatorItem as jest.MockedFunction<
  typeof disposeOperatorItem
>;
const mockedGetOperatorInventoryItems =
  getOperatorInventoryItems as jest.MockedFunction<
    typeof getOperatorInventoryItems
  >;
const mockedGetOperatorInventorySummary =
  getOperatorInventorySummary as jest.MockedFunction<
    typeof getOperatorInventorySummary
  >;

const findTouchableByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) => {
  const touchable = renderer.root.findAll(
    node =>
      node.type === TouchableOpacity &&
      node.findAllByProps({children: text}).length > 0,
  )[0];

  if (!touchable) {
    throw new Error(`Touchable with text "${text}" not found`);
  }

  return touchable;
};

describe('FridgeOperatorConsoleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOperatorInventorySummary.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        totalItems: 2,
        availableItems: 1,
        requestedItems: 0,
        expiringSoonItems: 1,
        expiredItems: 1,
        needsReviewItems: 0,
        ethyleneSeparatedItems: 1,
        lastSyncedAt: '2026-05-20T00:00:00Z',
      },
    });
    mockedGetOperatorInventoryItems.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          postId: 120,
          labelCode: '#07',
          itemName: '사과',
          status: 'expired',
          freshnessLabel: 'Mid',
          confidenceScore: 0.88,
          storageZone: 'ETHYLENE_SEPARATED',
          storageDeadlineAt: '2026-05-19T00:00:00Z',
        },
      ],
    });
  });

  it('renders the temporary fridge operator verification sections', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <FridgeOperatorConsoleScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
      await Promise.resolve();
    });

    expect(mockedGetOperatorInventorySummary).toHaveBeenCalledWith(1);
    expect(mockedGetOperatorInventoryItems).toHaveBeenCalledWith(1);
    expect(
      renderer!.root.findAllByProps({children: '냉장고 운영자 콘솔'}),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({children: '실제 운영자 API 연결'}),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children:
          '폐기 후보 항목은 운영자 API로 바로 처분 요청을 보냅니다. 백엔드가 아직 배포되지 않았다면 실패 메시지가 표시됩니다.',
      }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({children: '냉장고 상태'})).not.toHaveLength(
      0,
    );
    expect(renderer!.root.findAllByProps({children: '바구니 후보'})).not.toHaveLength(
      0,
    );
    expect(
      renderer!.root.findAllByProps({children: '개별 나눔 식재료 점검'}),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({children: '상태 검증 규칙'})).not.toHaveLength(
      0,
    );
    expect(renderer!.root.findAllByProps({children: '#07'})).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({children: '사과'})).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({children: '에틸렌 분리 구역'}),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({children: '폐기 후보'})).not.toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('blocks the operator console when the backend rejects operator permission', async () => {
    mockedGetOperatorInventorySummary.mockRejectedValue({
      response: {
        status: 403,
        data: {message: '운영자 권한이 없습니다.'},
      },
    });
    mockedGetOperatorInventoryItems.mockRejectedValue({
      response: {
        status: 403,
        data: {message: '운영자 권한이 없습니다.'},
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <FridgeOperatorConsoleScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({children: '운영자 권한이 필요합니다'}),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({children: '냉장고 상태'})).toHaveLength(
      0,
    );
    expect(
      renderer!.root.findAllByProps({children: '폐기 처분 완료'}),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('disposes a discard candidate through the operator API', async () => {
    mockedDisposeOperatorItem.mockResolvedValue({
      success: true,
      message: '폐기 처분 완료',
      data: {
        postId: 120,
        status: 'disposed',
        disposedAt: '2026-05-20T09:00:00Z',
      },
    });
    mockedGetOperatorInventoryItems.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: [
        {
          postId: 120,
          labelCode: '#07',
          itemName: '사과',
          status: 'expired',
          freshnessLabel: 'Mid',
          confidenceScore: 0.88,
          storageZone: 'ETHYLENE_SEPARATED',
          storageDeadlineAt: '2026-05-19T00:00:00Z',
        },
      ],
    });
    mockedGetOperatorInventoryItems.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: [
        {
          postId: 120,
          labelCode: '#07',
          itemName: '사과',
          status: 'disposed',
          freshnessLabel: 'Mid',
          confidenceScore: 0.88,
          storageZone: 'ETHYLENE_SEPARATED',
          storageDeadlineAt: '2026-05-19T00:00:00Z',
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <FridgeOperatorConsoleScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '폐기 처분 완료').props.onPress();
      await Promise.resolve();
    });

    expect(mockedDisposeOperatorItem).toHaveBeenCalledWith(120);
    expect(renderer!.root.findAllByProps({children: '폐기 완료'})).not.toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('re-syncs operator inventory after a successful dispose', async () => {
    mockedGetOperatorInventorySummary
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: {
          totalItems: 2,
          availableItems: 1,
          requestedItems: 0,
          expiringSoonItems: 1,
          expiredItems: 1,
          needsReviewItems: 0,
          ethyleneSeparatedItems: 1,
          lastSyncedAt: '2026-05-20T00:00:00Z',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: {
          totalItems: 2,
          availableItems: 1,
          requestedItems: 0,
          expiringSoonItems: 0,
          expiredItems: 0,
          needsReviewItems: 0,
          ethyleneSeparatedItems: 1,
          lastSyncedAt: '2026-05-20T00:10:00Z',
        },
      });
    mockedGetOperatorInventoryItems
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [
          {
            postId: 120,
            labelCode: '#07',
            itemName: '사과',
            status: 'expired',
            freshnessLabel: 'Mid',
            confidenceScore: 0.88,
            storageZone: 'ETHYLENE_SEPARATED',
            storageDeadlineAt: '2026-05-19T00:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [
          {
            postId: 120,
            labelCode: '#07',
            itemName: '사과',
            status: 'disposed',
            freshnessLabel: 'Mid',
            confidenceScore: 0.88,
            storageZone: 'ETHYLENE_SEPARATED',
            storageDeadlineAt: '2026-05-19T00:00:00Z',
          },
        ],
      });
    mockedDisposeOperatorItem.mockResolvedValue({
      success: true,
      message: '폐기 처분 완료',
      data: {
        postId: 120,
        status: 'disposed',
        disposedAt: '2026-05-20T09:00:00Z',
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <FridgeOperatorConsoleScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '폐기 처분 완료').props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedDisposeOperatorItem).toHaveBeenCalledWith(120);
    expect(mockedGetOperatorInventorySummary).toHaveBeenCalledTimes(2);
    expect(mockedGetOperatorInventoryItems).toHaveBeenCalledTimes(2);
    expect(renderer!.root.findAllByProps({children: '폐기 완료'})).not.toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('shows an explicit empty state when operator inventory has no items', async () => {
    mockedGetOperatorInventorySummary.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        totalItems: 0,
        availableItems: 0,
        requestedItems: 0,
        expiringSoonItems: 0,
        expiredItems: 0,
        needsReviewItems: 0,
        ethyleneSeparatedItems: 0,
        lastSyncedAt: '2026-05-20T00:00:00Z',
      },
    });
    mockedGetOperatorInventoryItems.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <FridgeOperatorConsoleScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({children: '점검할 식재료가 없습니다'}),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children:
          '백엔드 inventory API가 빈 목록을 반환했습니다. 새 나눔이 보관되면 이 영역에 표시됩니다.',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
