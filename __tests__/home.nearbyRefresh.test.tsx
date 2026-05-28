import React from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HomeScreen from '@/screens/home/HomeScreen';
import { getNearbyPosts } from '@/api/posts';
import { getMyPosts, getMyShareRequests } from '@/api/users';
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

jest.mock('@/api/users', () => ({
  getMyPosts: jest.fn(),
  getMyShareRequests: jest.fn(),
}));

const mockedGetNearbyPosts = getNearbyPosts as jest.MockedFunction<
  typeof getNearbyPosts
>;
const mockedGetMyPosts = getMyPosts as jest.MockedFunction<typeof getMyPosts>;
const mockedGetMyShareRequests = getMyShareRequests as jest.MockedFunction<
  typeof getMyShareRequests
>;

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) =>
  renderer.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(textNode => textNode.props.children === label),
    );

describe('HomeScreen nearby post refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-21T12:00:00Z'));
    mockRouteParams = undefined;
    mockedGetNearbyPosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });
    mockedGetMyPosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });
    mockedGetMyShareRequests.mockResolvedValue({
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

  it('renders an empty nearby feed separately from load failures', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(
      renderer!.root.findAllByProps({ children: '아직 근처에 나눔이 없어요' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '목록을 불러오지 못했습니다' }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders a retryable error when nearby feed loading fails', async () => {
    mockedGetNearbyPosts.mockRejectedValueOnce(new Error('network down'));
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(
      renderer!.root.findAllByProps({ children: '목록을 불러오지 못했습니다' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '다시 시도')?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedGetNearbyPosts).toHaveBeenCalledTimes(2);
    expect(
      renderer!.root.findAllByProps({ children: '아직 근처에 나눔이 없어요' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('guards nearby feed loading when the account has no registered location', async () => {
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
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(mockedGetNearbyPosts).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAllByProps({ children: '동네 위치를 설정해주세요' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '위치 설정하기')?.props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('LocationSetup', {
      allowBack: true,
    });

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
    expect(
      renderer!.root.findAllByProps({ children: '진행 중인 나눔' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '수령 QR 확인 필요' }),
    ).not.toHaveLength(0);

    const requestedActionButton = findButtonByText(renderer!, '상세에서 확인');
    await ReactTestRenderer.act(async () => {
      requestedActionButton?.props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('PostDetail', {
      postId: 10,
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders multiple account lifecycle actions in the home hub', async () => {
    mockedGetMyPosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          id: 21,
          fridgeId: 1,
          authorId: 1,
          detectedFruit: 'banana',
          detectedFruitKo: '바나나',
          freshnessLabel: 'Fresh',
          confidenceScore: 0.9,
          imageUrl: '/static/posts/21.jpg',
          expirationDate: '2026-05-27',
          status: 'pending_store',
          storeExpiresAt: '2026-05-21T12:30:00Z',
          createdAt: '2026-05-21T12:00:00Z',
          updatedAt: '2026-05-21T12:00:00Z',
        },
        {
          id: 22,
          fridgeId: 1,
          authorId: 1,
          detectedFruit: 'tomato',
          detectedFruitKo: '토마토',
          freshnessLabel: 'Fresh',
          confidenceScore: 0.9,
          imageUrl: '/static/posts/22.jpg',
          expirationDate: '2026-05-27',
          status: 'requested',
          requestExpiresAt: '2026-05-21T12:45:00Z',
          createdAt: '2026-05-21T12:00:00Z',
          updatedAt: '2026-05-21T12:00:00Z',
        },
      ],
    });
    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          request: {
            id: 91,
            postId: 31,
            requesterId: 1,
            status: 'requested',
            createdAt: '2026-05-21T12:00:00Z',
          },
          post: {
            id: 31,
            fridgeId: 2,
            authorId: 2,
            detectedFruit: 'apple',
            detectedFruitKo: '사과',
            freshnessLabel: 'Fresh',
            confidenceScore: 0.9,
            imageUrl: '/static/posts/31.jpg',
            expirationDate: '2026-05-27',
            status: 'requested',
            requestExpiresAt: '2026-05-21T12:20:00Z',
            createdAt: '2026-05-21T12:00:00Z',
            updatedAt: '2026-05-21T12:00:00Z',
          },
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({ children: '수령 QR 확인 필요' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '입고 QR 인증 필요' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '신청된 나눔 확인 필요' }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: '3건' })).not.toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '수령 QR 열기')?.props.onPress();
    });
    expect(mockParentNavigate).toHaveBeenCalledWith('InventoryQr', {
      mode: 'pickup',
      postId: 31,
      pendingExpiresAt: '2026-05-21T12:20:00Z',
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '입고 QR 열기')?.props.onPress();
    });
    expect(mockParentNavigate).toHaveBeenCalledWith('InventoryQr', {
      mode: 'store',
      postId: 21,
    });

    await ReactTestRenderer.act(async () => {
      findButtonByText(renderer!, '내 나눔 관리')?.props.onPress();
    });
    expect(mockParentNavigate).toHaveBeenCalledWith('MyShares', {
      initialTab: 'posted',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('filters nearby posts locally by crop or fridge name', async () => {
    mockedGetNearbyPosts.mockResolvedValue({
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
        {
          id: 11,
          fridgeId: 2,
          fridgeName: '충장로 공유 냉장고',
          detectedFruit: 'banana',
          detectedFruitKo: '바나나',
          freshnessLabel: 'Mid',
          imageUrl: '/static/posts/11.jpg',
          expirationDate: '2026-05-08',
          status: 'available',
          createdAt: '2026-05-06T00:00:00Z',
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const searchInput = renderer!.root.findByProps({
      placeholder: '나눔 식재료 검색',
    });

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('바나나');
    });

    expect(
      renderer!.root.findAllByProps({ children: '바나나' }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: '사과' })).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '검색 결과 1건' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('없는재료');
    });

    expect(
      renderer!.root.findAllByProps({ children: '검색 결과가 없습니다' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders today pickup recommendations from loaded nearby posts and hides them while searching', async () => {
    mockedGetNearbyPosts.mockResolvedValue({
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
          expirationDate: '2026-05-22',
          status: 'available',
          createdAt: '2026-05-20T00:00:00Z',
        },
        {
          id: 11,
          fridgeId: 2,
          fridgeName: '충장로 공유 냉장고',
          detectedFruit: 'banana',
          detectedFruitKo: '바나나',
          freshnessLabel: 'Mid',
          imageUrl: '/static/posts/11.jpg',
          expirationDate: '2026-05-21',
          status: 'available',
          createdAt: '2026-05-21T00:00:00Z',
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(
      renderer!.root.findAllByProps({
        children: '오늘 가져가기 좋은 재료',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children: '권장 수령일이 가까운 나눔을 먼저 보여드려요.',
      }),
    ).not.toHaveLength(0);

    const recommendationButton = renderer!.root
      .findAllByType(TouchableOpacity)
      .find(button =>
        button.findAllByType(Text).some(textNode => {
          const children = textNode.props.children;
          return children === '바나나';
        }),
      );

    await ReactTestRenderer.act(async () => {
      recommendationButton?.props.onPress();
    });

    expect(mockParentNavigate).toHaveBeenCalledWith('PostDetail', {
      postId: 11,
    });

    const searchInput = renderer!.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('사과');
    });

    expect(
      renderer!.root.findAllByProps({
        children: '오늘 가져가기 좋은 재료',
      }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
