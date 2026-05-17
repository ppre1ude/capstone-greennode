import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import FridgeOperatorConsoleScreen from '@/screens/operator/FridgeOperatorConsoleScreen';

describe('FridgeOperatorConsoleScreen', () => {
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
      renderer!.root.findAllByProps({children: '읽기 전용 프로토타입'}),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children:
          '실제 inventory API와 상태 변경 저장은 아직 연결되지 않았어요.',
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
});
