import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSListCell,
  DSText,
  DSTextField,
} from '@/design-system';
import { colors } from '@/theme';

describe('design system components', () => {
  it('renders vector icons through design-system size and color tokens', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <DSIcon name="bell" size="large" color="primary" />,
      );
    });

    const icon = renderer!.root.findByType(Text);

    expect(icon.props.size).toBe(24);
    expect(icon.props.color).toBe(colors.primary);
    expect(icon.props.children).toBe('bell');
  });

  it('renders button states and blocks presses while loading', async () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <DSButton label="저장" loading onPress={onPress} />,
      );
    });

    const button = renderer!.root.findByType(TouchableOpacity);

    expect(
      renderer!.root.findAllByProps({ children: '저장' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: '처리 중' }).length,
    ).toBeGreaterThan(0);
    expect(button.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });

    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders selected chips with a selected accessibility state', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <DSChip
          label="신선"
          selected
          trailing={<Text>✓</Text>}
          onPress={jest.fn()}
        />,
      );
    });

    const chip = renderer!.root.findByType(TouchableOpacity);

    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
    expect(
      renderer!.root.findAllByProps({ children: '신선' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: '✓' }).length,
    ).toBeGreaterThan(0);
  });

  it('renders non-interactive chips as display views', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <DSChip label="표시용" tone="primary" />,
      );
    });

    expect(renderer!.root.findAllByType(TouchableOpacity)).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '표시용' }).length,
    ).toBeGreaterThan(0);
  });

  it('renders text field label, status caption, and native input props', async () => {
    const onChangeText = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <DSTextField
          label="이메일"
          required
          value="food@example.com"
          placeholder="이메일을 입력하세요"
          status="error"
          caption="올바른 이메일을 입력해주세요"
          onChangeText={onChangeText}
        />,
      );
    });

    const input = renderer!.root.findByType(TextInput);

    expect(
      renderer!.root.findAllByProps({ children: '이메일' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: '*' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({
        children: '올바른 이메일을 입력해주세요',
      }).length,
    ).toBeGreaterThan(0);
    expect(input.props.value).toBe('food@example.com');
    expect(input.props.accessibilityLabel).toBe('이메일');
    expect(input.props.accessibilityHint).toBe('올바른 이메일을 입력해주세요');
    expect(input.props.accessibilityState).toMatchObject({ disabled: false });

    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('next@example.com');
    });

    expect(onChangeText).toHaveBeenCalledWith('next@example.com');
  });

  it('renders card, list cell, and semantic text content', async () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <DSCard testID="card">
          <DSText variant="heading3">근처 나눔</DSText>
          <DSListCell
            title="전남대 공유 냉장고"
            caption="도보 4분"
            selected
            chevron
            onPress={onPress}
          />
        </DSCard>,
      );
    });

    expect(
      renderer!.root
        .findAllByType(View)
        .some(node => node.props.testID === 'card'),
    ).toBe(true);
    expect(
      renderer!.root.findAllByProps({ children: '근처 나눔' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: '전남대 공유 냉장고' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: '도보 4분' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: '›' }).length,
    ).toBeGreaterThan(0);

    const cell = renderer!.root.findAllByType(TouchableOpacity)[0];
    await ReactTestRenderer.act(async () => {
      cell.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
