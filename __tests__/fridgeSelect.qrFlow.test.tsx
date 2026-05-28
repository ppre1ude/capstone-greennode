import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { getAvailableFridges } from '@/api/fridges';
import { createPost } from '@/api/posts';
import FridgeSelectScreen from '@/screens/post/FridgeSelectScreen';
import { useAuthStore } from '@/store/authStore';
import type { Fridge, Post } from '@/types';
import { renderWithSafeArea } from '../test-utils/renderWithSafeArea';

jest.mock('@/api/fridges', () => ({
  getAvailableFridges: jest.fn(),
}));

jest.mock('@/api/posts', () => ({
  createPost: jest.fn(),
}));

const mockedGetAvailableFridges = getAvailableFridges as jest.MockedFunction<
  typeof getAvailableFridges
>;
const mockedCreatePost = createPost as jest.MockedFunction<typeof createPost>;

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root.findAllByType(TouchableOpacity).find(button =>
    button.findAllByType(Text).some(textNode => {
      const children = textNode.props.children;
      return Array.isArray(children)
        ? children.join('') === label
        : children === label;
    }),
  );

const hasText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root.findAllByType(Text).some(textNode => {
    const children = textNode.props.children;
    return Array.isArray(children)
      ? children.join('') === label
      : children === label;
  });

const fridge: Fridge = {
  id: 1,
  name: '광주역 앞 공유냉장고',
  address: '광주 북구 중흥동',
  publicCode: 'GJ-STATION-001',
  latitude: 35.1601,
  longitude: 126.9123,
  isActive: true,
  distance: 0.42,
};

const createdPost: Post = {
  id: 55,
  fridgeId: 1,
  authorId: 2,
  detectedFruit: 'banana',
  detectedFruitKo: '바나나',
  freshnessLabel: 'Fresh',
  confidenceScore: 0.92,
  imageUrl: '/static/posts/55.jpg',
  expirationDate: '2026-05-24',
  status: 'pending_store',
  storeExpiresAt: '2026-05-20T00:08:30Z',
  createdAt: '2026-05-20T00:00:00Z',
  updatedAt: '2026-05-20T00:00:00Z',
};

const renderScreen = async () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    replace: jest.fn(),
  };
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      renderWithSafeArea(
        <FridgeSelectScreen
          navigation={navigation as never}
          route={
            {
              params: {
                postData: {
                  imageToken: 'image-token',
                  expirationDate: '2026-05-24',
                },
                qualityCategory: 'Fresh',
                qualityCanShare: true,
              },
            } as never
          }
        />,
      ),
    );
    await Promise.resolve();
    await Promise.resolve();
  });

  return { navigation, renderer: renderer! };
};

const selectFridgeAndSubmitQr = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
) => {
  await ReactTestRenderer.act(async () => {
    const fridgeButton = findButtonByText(renderer, '광주역 앞 공유냉장고');
    if (!fridgeButton) {
      throw new Error('Fridge option not found');
    }
    fridgeButton.props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({ testID: 'fridge-select-qr-submit' })
      .props.onPress();
    await Promise.resolve();
  });
};

describe('FridgeSelectScreen QR flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 2,
        email: 'supplier@example.com',
        nickname: '공급자',
        profileImageUrl: null,
        latitude: 35.1595,
        longitude: 126.9132,
        fcmToken: null,
        isActive: true,
        createdAt: '2026-05-20T00:00:00Z',
        updatedAt: '2026-05-20T00:00:00Z',
      },
      isLoggedIn: true,
      hasLocation: true,
    });
    mockedGetAvailableFridges.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [fridge],
    });
    mockedCreatePost.mockResolvedValue({
      success: true,
      message: 'ok',
      data: createdPost,
    });
  });

  it('creates a pending-store post and opens store QR confirmation with backend expiry', async () => {
    const { navigation, renderer } = await renderScreen();

    await selectFridgeAndSubmitQr(renderer);

    expect(mockedCreatePost).toHaveBeenCalledWith({
      imageToken: 'image-token',
      expirationDate: '2026-05-24',
      fridgeId: 1,
      flow: 'fridge_qr',
    });
    expect(navigation.replace).toHaveBeenCalledWith('InventoryQr', {
      mode: 'store',
      postId: 55,
      fridgePublicCode: 'GJ-STATION-001',
      fridgeName: '광주역 앞 공유냉장고',
      fridgeLocation: '광주 북구 중흥동',
      pendingExpiresAt: '2026-05-20T00:08:30Z',
    });

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('renders an empty fridge picker separately from load failures', async () => {
    mockedGetAvailableFridges.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });
    const { renderer } = await renderScreen();

    expect(
      renderer.root.findAllByProps({
        children: '냉장고를 불러오지 못했습니다',
      }),
    ).toHaveLength(0);
    expect(
      hasText(renderer, '반경 2km 이내에\n사용 가능한 냉장고가 없습니다.'),
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('renders a retryable fridge picker error', async () => {
    mockedGetAvailableFridges
      .mockResolvedValueOnce({
        success: false,
        message: '등록 가능 냉장고 오류',
        data: null,
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [fridge],
      });
    const { renderer } = await renderScreen();

    expect(
      renderer.root.findAllByProps({
        children: '냉장고를 불러오지 못했습니다',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ children: '등록 가능 냉장고 오류' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, '다시 시도')?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedGetAvailableFridges).toHaveBeenCalledTimes(2);
    expect(
      renderer.root.findAllByProps({ children: '광주역 앞 공유냉장고' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('guards fridge selection when the account has no registered location', async () => {
    useAuthStore.setState(state => ({
      user: state.user
        ? {
            ...state.user,
            latitude: null,
            longitude: null,
          }
        : state.user,
      hasLocation: false,
    }));
    const { navigation, renderer } = await renderScreen();

    expect(mockedGetAvailableFridges).not.toHaveBeenCalled();
    expect(
      renderer.root.findAllByProps({ children: '동네 위치를 설정해주세요' }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ testID: 'fridge-select-qr-submit' }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer, '위치 설정하기')?.props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('LocationSetup', {
      allowBack: true,
    });

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('derives store QR expiry from createdAt when the response omits storeExpiresAt', async () => {
    mockedCreatePost.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...createdPost,
        storeExpiresAt: null,
      },
    });
    const { navigation, renderer } = await renderScreen();

    await selectFridgeAndSubmitQr(renderer);

    expect(navigation.replace).toHaveBeenCalledWith(
      'InventoryQr',
      expect.objectContaining({
        pendingExpiresAt: '2026-05-20T00:10:00.000Z',
      }),
    );

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('derives store QR expiry from createdAt when storeExpiresAt is invalid', async () => {
    mockedCreatePost.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...createdPost,
        storeExpiresAt: 'not-a-date',
      },
    });
    const { navigation, renderer } = await renderScreen();

    await selectFridgeAndSubmitQr(renderer);

    expect(navigation.replace).toHaveBeenCalledWith(
      'InventoryQr',
      expect.objectContaining({
        pendingExpiresAt: '2026-05-20T00:10:00.000Z',
      }),
    );

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('omits store QR expiry when both storeExpiresAt and createdAt are invalid', async () => {
    mockedCreatePost.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...createdPost,
        storeExpiresAt: 'not-a-date',
        createdAt: 'also-not-a-date',
      },
    });
    const { navigation, renderer } = await renderScreen();

    await selectFridgeAndSubmitQr(renderer);

    expect(navigation.replace).toHaveBeenCalledWith(
      'InventoryQr',
      expect.objectContaining({
        pendingExpiresAt: undefined,
      }),
    );

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
