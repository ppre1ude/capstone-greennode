import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import LoginScreen from '@/screens/auth/LoginScreen';

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

describe('LoginScreen email-only MVP entry', () => {
  it('offers email login without unsupported social login options', async () => {
    const navigation = {navigate: jest.fn()};
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <LoginScreen navigation={navigation as any} route={{} as any} />,
      );
    });

    expect(
      renderer!.root.findAllByProps({children: '카카오로 계속하기'}),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({children: 'Apple로 계속하기'}),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({children: '구글로 계속하기'}),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '이메일로 계속하기').props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('LoginEmail');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
