import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import {useAuthStore} from '@/store/authStore';

const mockParentNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    getParent: jest.fn(() => ({navigate: mockParentNavigate})),
  })),
}));

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
      findTouchableByText(
        renderer!,
        '냉장고 운영자 콘솔 (실험)',
      ).props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('FridgeOperatorConsole');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('hides the operator console entry for regular users', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    expect(
      renderer!.root.findAllByProps({
        children: '냉장고 운영자 콘솔 (실험)',
      }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('opens the inventory QR prototype from profile', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(
        renderer!,
        '냉장고 QR 흐름 테스트',
      ).props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('InventoryQrPrototype');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
