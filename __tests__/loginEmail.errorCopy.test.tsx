import React from 'react';
import { Alert, TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import LoginEmailScreen from '@/screens/auth/LoginEmailScreen';
import { login, getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

jest.mock('@/api/auth', () => ({
  login: jest.fn(),
  getMe: jest.fn(),
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;

const createNavigation = (rootNav?: { reset: jest.Mock }) => ({
  goBack: jest.fn(),
  navigate: jest.fn(),
  getParent: jest.fn(() => rootNav),
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'user@example.com',
  nickname: 'tester',
  profileImageUrl: null,
  latitude: 35.1595,
  longitude: 126.9132,
  fcmToken: null,
  emailVerifiedAt: null,
  isActive: true,
  createdAt: '2026-05-20T00:00:00Z',
  updatedAt: '2026-05-20T00:00:00Z',
  ...overrides,
});

const renderScreen = async (
  navigation: ReturnType<typeof createNavigation>,
) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <LoginEmailScreen navigation={navigation as never} route={{} as never} />,
    );
  });

  return renderer!;
};

const findSubmitButton = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const submitButton = renderer.root
    .findAllByType(TouchableOpacity)
    .find(node => node.props.accessibilityState?.busy !== undefined);

  if (!submitButton) {
    throw new Error('Login submit button not found');
  }

  return submitButton;
};

const fillAndSubmit = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const [emailInput, passwordInput] = renderer.root.findAllByType(TextInput);

  await ReactTestRenderer.act(async () => {
    emailInput.props.onChangeText('user@example.com');
    passwordInput.props.onChangeText('password123');
  });

  await ReactTestRenderer.act(async () => {
    findSubmitButton(renderer).props.onPress();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('LoginEmailScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    useAuthStore.setState({
      token: null,
      user: null,
      isLoading: false,
      isLoggedIn: false,
      hasLocation: false,
    });
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
    const renderer = await renderScreen(createNavigation());

    await fillAndSubmit(renderer);

    expect(alertSpy).toHaveBeenCalledWith(
      '오류',
      '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
    expect(alertSpy).not.toHaveBeenCalledWith(
      '오류',
      expect.stringContaining('SSH 터널'),
    );
    expect(mockedGetMe).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('resets the root navigator to Main when the profile has a location', async () => {
    const rootNav = { reset: jest.fn() };
    const renderer = await renderScreen(createNavigation(rootNav));

    mockedLogin.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { accessToken: 'access-token', tokenType: 'bearer' },
    });
    mockedGetMe.mockResolvedValue({
      success: true,
      message: 'ok',
      data: makeUser(),
    });

    await fillAndSubmit(renderer);

    expect(mockedLogin).toHaveBeenCalledWith(
      'user@example.com',
      'password123',
    );
    expect(mockedGetMe).toHaveBeenCalledTimes(1);
    expect(rootNav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Main' }],
    });
    expect(useAuthStore.getState()).toMatchObject({
      token: 'access-token',
      isLoggedIn: true,
      hasLocation: true,
    });
    expect(useAuthStore.getState().user?.email).toBe('user@example.com');

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('resets the root navigator to LocationSetup when the profile has no location', async () => {
    const rootNav = { reset: jest.fn() };
    const renderer = await renderScreen(createNavigation(rootNav));

    mockedLogin.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { accessToken: 'access-token', tokenType: 'bearer' },
    });
    mockedGetMe.mockResolvedValue({
      success: true,
      message: 'ok',
      data: makeUser({ latitude: null, longitude: null }),
    });

    await fillAndSubmit(renderer);

    expect(rootNav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'LocationSetup' }],
    });
    expect(useAuthStore.getState()).toMatchObject({
      token: 'access-token',
      isLoggedIn: true,
      hasLocation: false,
    });

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
