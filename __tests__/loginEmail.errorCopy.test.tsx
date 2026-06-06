import React from 'react';
import { Alert, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import LoginEmailScreen from '@/screens/auth/LoginEmailScreen';
import { login, getMe } from '@/api/auth';

jest.mock('@/api/auth', () => ({
  login: jest.fn(),
  getMe: jest.fn(),
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;

describe('LoginEmailScreen error copy', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    getParent: jest.fn(),
  };
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    mockedLogin.mockRejectedValue(new Error('network down'));
    mockedGetMe.mockResolvedValue({
      success: false,
      message: 'unused',
      data: null,
    });
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('keeps developer tunnel details out of the connection error message', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <LoginEmailScreen
          navigation={navigation as never}
          route={{} as never}
        />,
      );
    });

    const [emailInput, passwordInput] = renderer!.root.findAllByType(TextInput);

    await ReactTestRenderer.act(async () => {
      emailInput.props.onChangeText('user@example.com');
      passwordInput.props.onChangeText('password123');
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root
        .findByProps({ accessibilityLabel: '로그인' })
        .props.onPress();
      await Promise.resolve();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '오류',
      '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
    expect(alertSpy).not.toHaveBeenCalledWith(
      '오류',
      expect.stringContaining('SSH 터널'),
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
