import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HomeScreen from '@/screens/home/HomeScreen';
import { getNearbyPosts } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';

let mockRouteParams:
  | { nearbyPostsRefreshToken?: number; completedPostId?: number }
  | undefined;
const mockNavigate = jest.fn();
const mockParentNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactForMock = require('react');

  return {
    useFocusEffect: jest.fn((callback: () => void) => {
      ReactForMock.useEffect(callback, [callback]);
    }),
    useNavigation: jest.fn(() => ({
      getParent: jest.fn(() => ({ navigate: mockParentNavigate })),
      navigate: mockNavigate,
    })),
    useRoute: jest.fn(() => ({ params: mockRouteParams })),
  };
});

jest.mock('@/api/posts', () => ({
  getImageUrl: jest.fn(
    (relativeUrl: string) => `http://localhost${relativeUrl}`,
  ),
  getNearbyPosts: jest.fn(),
}));

const mockedGetNearbyPosts = getNearbyPosts as jest.MockedFunction<
  typeof getNearbyPosts
>;

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root.findAllByType(TouchableOpacity).find(button =>
    button.findAllByType(Text).some(textNode => textNode.props.children === label),
  );

describe('HomeScreen nearby post refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = undefined;
    mockedGetNearbyPosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });
    useAuthStore.setState({
      token: 'access-token',
      user: {
        id: 1,
        email: 'user@example.com',
        nickname: '테스터',
        profileImageUrl: null,
        latitude: 35.1595,
        longitude: 126.9132,
        fcmToken: null,
        isActive: true,
        createdAt: '2026-05-06T00:00:00Z',
        updatedAt: '2026-05-06T00:00:00Z',
      },
      isLoading: false,
      isLoggedIn: true,
      hasLocation: true,
    });
    useFeedRefreshStore.setState({
      nearbyPostsRefreshToken: 0,
      requestedPostId: null,
    });
  });

  it('re-fetches /posts/nearby when post completion sends a refresh token', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(mockedGetNearbyPosts).toHaveBeenCalledTimes(1);
    expect(mockedGetNearbyPosts).toHaveBeenLastCalledWith(35.1595, 126.9132);

    mockRouteParams = {
      completedPostId: 42,
      nearbyPostsRefreshToken: 2026050601,
    };

    await ReactTestRenderer.act(async () => {
      renderer?.update(<HomeScreen />);
    });

    expect(mockedGetNearbyPosts).toHaveBeenCalledTimes(2);
    expect(mockedGetNearbyPosts).toHaveBeenLastCalledWith(35.1595, 126.9132);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('removes a requested post and re-fetches /posts/nearby when share request succeeds', async () => {
    mockedGetNearbyPosts
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [
          {
            id: 10,
            fridgeId: 1,
            fridgeName: '전남대 공유 냉장고',
            detectedFruit: 'apple',
            detectedFruitKo: '사과',
            freshnessLabel: 'Fresh',
            imageUrl: '/static/posts/10.jpg',
            expirationDate: '2026-05-08',
            status: 'available',
            createdAt: '2026-05-06T00:00:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [],
      });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(
      renderer?.root.findAllByProps({ children: '사과' }).length,
    ).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      useFeedRefreshStore.getState().requestNearbyPostsRefresh(10);
      await Promise.resolve();
    });

    expect(mockedGetNearbyPosts).toHaveBeenCalledTimes(2);
    expect(renderer?.root.findAllByProps({ children: '사과' })).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('uses the feed header action to open the map tab', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const mapButton = findButtonByText(renderer!, '지도에서 보기');

    await ReactTestRenderer.act(async () => {
      mapButton?.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Map');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
