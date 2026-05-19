import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {disposeOperatorItem} from '@/api/operator';
import FridgeOperatorConsoleScreen from '@/screens/operator/FridgeOperatorConsoleScreen';

jest.mock('@/api/operator', () => ({
  disposeOperatorItem: jest.fn(),
}));

const mockedDisposeOperatorItem = disposeOperatorItem as jest.MockedFunction<
  typeof disposeOperatorItem
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
    });

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

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('disposes a discard candidate through the operator API', async () => {
    mockedDisposeOperatorItem.mockResolvedValue({
      success: true,
      message: '폐기 처분 완료',
      data: {
        postId: 111,
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
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '폐기 처분 완료').props.onPress();
      await Promise.resolve();
    });

    expect(mockedDisposeOperatorItem).toHaveBeenCalledWith(111);
    expect(renderer!.root.findAllByProps({children: 'discarded'})).not.toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
