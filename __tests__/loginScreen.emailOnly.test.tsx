import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import LoginScreen from '@/screens/auth/LoginScreen';
import { fontFamily } from '@/theme';

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

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(flattenText).join('');
  }

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
};

describe('LoginScreen email-only MVP entry', () => {
  it('offers email login without unsupported social login options', async () => {
    const navigation = { navigate: jest.fn() };
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <LoginScreen navigation={navigation as any} route={{} as any} />,
      );
    });

    expect(
      renderer!.root.findAllByProps({ children: '카카오로 계속하기' }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Apple로 계속하기' }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '구글로 계속하기' }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '이메일로 계속하기').props.onPress();
    });

    expect(navigation.navigate).not.toHaveBeenCalled();

    expect(
      renderer!.root.findByProps({ accessibilityRole: 'checkbox' }).props
        .accessibilityState,
    ).toEqual({ checked: false });

    const termsText = renderer!.root
      .findAllByType(Text)
      .find(node =>
        flattenText(node.props.children).includes(
          '이용약관, 개인정보 처리방침, 위치기반 서비스 이용약관',
        ),
      );
    expect(StyleSheet.flatten(termsText?.props.style)).toMatchObject({
      fontFamily: fontFamily.regular,
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({ accessibilityRole: 'checkbox' })
        .props.onPress();
    });

    expect(
      renderer!.root.findByProps({ accessibilityRole: 'checkbox' }).props
        .accessibilityState,
    ).toEqual({ checked: true });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '이메일로 계속하기').props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('LoginEmail');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
