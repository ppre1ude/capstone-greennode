import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { useAuthStore } from '@/store/authStore';

const mockParentNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    getParent: jest.fn(() => ({ navigate: mockParentNavigate })),
  })),
}));

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

const expectOperatorConsoleVisible = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  visible: boolean,
) => {
  const matches = renderer.root.findAllByProps({
    children: '냉장고 운영자 콘솔',
  });
  expect(matches.length > 0).toBe(visible);
};

describe('ProfileScreen operator console entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        email: 'operator-test@example.com',
        nickname: '테스터',
        profileImageUrl: null,
        latitude: 35.1595,
        longitude: 126.9136,
        fcmToken: null,
        isActive: true,
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-05-15T00:00:00Z',
      },
      isLoggedIn: true,
      hasLocation: true,
    });
  });

  it('opens the temporary fridge operator console from profile', async () => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        operatorRole: 'operator',
        operatorFridgeIds: [1],
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '냉장고 운영자 콘솔').props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('FridgeOperatorConsole');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it.each([
    ['isOperator true', { isOperator: true }],
    ['operatorRole admin', { operatorRole: 'admin' }],
    ['operatorRole fridge_operator', { operatorRole: 'fridge_operator' }],
    ['operatorFridgeIds present', { operatorFridgeIds: [1] }],
    ['roles include fridge_operator', { roles: ['member', 'fridge_operator'] }],
  ])('shows the operator entry for %s metadata', async (_label, metadata) => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        ...(metadata as object),
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectOperatorConsoleVisible(renderer!, true);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it.each([
    ['empty operator fridge ids', { operatorFridgeIds: [] }],
    ['regular roles only', { roles: ['member'] }],
    ['unknown operator role', { operatorRole: 'viewer' }],
  ])('hides the operator entry for %s metadata', async (_label, metadata) => {
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        ...(metadata as object),
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectOperatorConsoleVisible(renderer!, false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('hides the operator console entry for regular users', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expectOperatorConsoleVisible(renderer!, false);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('opens QR verification from profile without prototype copy', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '냉장고 QR 인증').props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('InventoryQrPrototype');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('explains contract-needed profile menus instead of showing a generic placeholder', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '내 나눔 내역').props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '내 나눔 내역 준비 중',
      expect.stringContaining('서버 API'),
    );

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '받은 나눔 내역').props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '받은 나눔 내역 준비 중',
      expect.stringContaining('나눔 목록 API'),
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('explains that profile editing needs a backend save contract', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '프로필 수정').props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '프로필 수정 준비 중',
      expect.stringContaining('프로필 이미지를 저장하는 서버 API'),
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
