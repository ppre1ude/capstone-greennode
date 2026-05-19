import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import InventoryQrPrototypeScreen from '@/screens/inventory/InventoryQrPrototypeScreen';

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(flattenText).join('');
  }

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
};

const getTextContent = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => flattenText(node.props.children));

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

describe('InventoryQrPrototypeScreen', () => {
  it('renders the QR and inventory prototype surface', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrPrototypeScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).toContain('냉장고 QR 흐름 테스트');
    expect(textContent).toContain('광주역 앞 공유냉장고');
    expect(textContent).toContain('05:00');
    expect(textContent).toContain('등록 대기');
    expect(textContent).toContain('라벨은 보관 인증 후 표시');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('simulates a valid store QR scan and reveals label instructions', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryQrPrototypeScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '보관 QR 테스트').props.onPress();
      await Promise.resolve();
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).toContain('보관 인증 완료. 라벨 코드를 식재료에 붙여주세요.');
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
        <InventoryQrPrototypeScreen
          navigation={{goBack: jest.fn()} as any}
          route={{params: undefined} as any}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다른 냉장고 QR').props.onPress();
      await Promise.resolve();
    });

    expect(getTextContent(renderer!)).toContain(
      '선택한 냉장고 QR이 아닙니다. 다시 확인해주세요.',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
