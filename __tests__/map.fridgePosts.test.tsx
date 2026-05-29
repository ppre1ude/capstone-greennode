import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import MapScreen from '@/screens/map/MapScreen';
import { getFridgePosts, getNearbyFridges } from '@/api/fridges';
import { useAuthStore } from '@/store/authStore';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import type { ApiResponse, Fridge, PostNearbyRead } from '@/types';

const mockRootNavigate = jest.fn();

jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const ReactForMock = require('react');
  const { View } = jest.requireActual('react-native');

  const MockFlatList = ReactForMock.forwardRef(
    (
      {
        data = [],
        renderItem,
        keyExtractor,
        ...props
      }: {
        data?: unknown[];
        renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
        keyExtractor?: (item: unknown, index: number) => string;
      },
      ref: React.Ref<unknown>,
    ) => {
      ReactForMock.useImperativeHandle(ref, () => ({
        scrollToIndex: jest.fn(),
      }));

      return ReactForMock.createElement(
        View,
        props,
        data.map((item, index) =>
          ReactForMock.createElement(
            View,
            { key: keyExtractor?.(item, index) ?? String(index) },
            renderItem({ item, index }),
          ),
        ),
      );
    },
  );

  return {
    __esModule: true,
    default: MockFlatList,
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    getParent: jest.fn(() => ({ navigate: mockRootNavigate })),
  })),
}));

jest.mock('@/api/fridges', () => ({
  getNearbyFridges: jest.fn(),
  getFridgePosts: jest.fn(),
}));

jest.mock('@/api/posts', () => ({
  getImageUrl: jest.fn(
    (relativeUrl: string) => `http://localhost${relativeUrl}`,
  ),
}));

const mockedGetNearbyFridges = getNearbyFridges as jest.MockedFunction<
  typeof getNearbyFridges
>;
const mockedGetFridgePosts = getFridgePosts as jest.MockedFunction<
  typeof getFridgePosts
>;

const post: PostNearbyRead = {
  id: 10,
  fridgeId: 7,
  fridgeName: '전남대 공유 냉장고',
  detectedFruit: 'apple',
  detectedFruitKo: '사과',
  freshnessLabel: 'Fresh',
  imageUrl: '/static/posts/10.jpg',
  expirationDate: '2026-05-08',
  status: 'available',
  createdAt: '2026-05-06T00:00:00Z',
};

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

const findHostByTestId = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  testID: string,
) =>
  renderer.root.findAll(
    node => node.props.testID === testID && typeof node.type === 'string',
  );

const flushDebouncedSearch = async () => {
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(350);
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('MapScreen fridge posts', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNearbyFridges.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          id: 7,
          name: '전남대 공유 냉장고',
          address: '광주 북구 용봉동',
          latitude: 35.1595,
          longitude: 126.9132,
          isActive: true,
          distance: 0.4,
        },
      ],
    });
    mockedGetFridgePosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [post],
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

  afterEach(async () => {
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
      renderer = undefined;
    });
    jest.useRealTimers();
  });

  it('shows the fridge carousel as the only bottom surface mode before selection', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    expect(
      findHostByTestId(renderer!, 'map-bottom-surface'),
    ).toHaveLength(1);
    expect(
      findHostByTestId(renderer!, 'map-fridge-carousel'),
    ).toHaveLength(1);
    expect(
      findHostByTestId(renderer!, 'map-selected-fridge-sheet'),
    ).toHaveLength(0);
  });

  it('replaces the fridge carousel with the selected fridge sheet', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, post.fridgeName).props.onPress();
    });

    expect(
      findHostByTestId(renderer!, 'map-bottom-surface'),
    ).toHaveLength(1);
    expect(
      findHostByTestId(renderer!, 'map-fridge-carousel'),
    ).toHaveLength(0);
    expect(
      findHostByTestId(renderer!, 'map-selected-fridge-sheet'),
    ).toHaveLength(1);
  });

  it('returns from the selected fridge sheet to the fridge carousel', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, post.fridgeName).props.onPress();
    });

    expect(
      findHostByTestId(renderer!, 'map-selected-fridge-sheet'),
    ).toHaveLength(1);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다른 냉장고 보기').props.onPress();
    });

    expect(
      findHostByTestId(renderer!, 'map-fridge-carousel'),
    ).toHaveLength(1);
    expect(
      findHostByTestId(renderer!, 'map-selected-fridge-sheet'),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: post.detectedFruitKo }),
    ).toHaveLength(0);
  });

  it('loads available posts when a fridge is selected and opens post detail', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '전남대 공유 냉장고').props.onPress();
    });

    expect(mockedGetFridgePosts).toHaveBeenCalledWith(7, 'available');
    expect(
      renderer!.root.findAllByProps({ children: '다른 냉장고 보기' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '목록 확인 중' }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '사과' }).length,
    ).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '사과').props.onPress();
    });

    expect(mockRootNavigate).toHaveBeenCalledWith('PostDetail', { postId: 10 });
  });

  it('renders an empty nearby fridge list separately from API errors', async () => {
    mockedGetNearbyFridges.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    expect(
      renderer!.root.findAllByProps({ children: '근처에 냉장고가 없습니다' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children: '냉장고를 불러오지 못했습니다',
      }),
    ).toHaveLength(0);
    expect(mockedGetFridgePosts).not.toHaveBeenCalled();
  });

  it('renders a retryable top-level fridge list error', async () => {
    mockedGetNearbyFridges
      .mockResolvedValueOnce({
        success: false,
        message: '냉장고 목록 오류',
        data: null,
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [
          {
            id: 7,
            name: '전남대 공유 냉장고',
            address: '광주 북구 용봉동',
            latitude: 35.1595,
            longitude: 126.9132,
            isActive: true,
            distance: 0.4,
          },
        ],
      });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    expect(
      renderer!.root.findAllByProps({
        children: '냉장고를 불러오지 못했습니다',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '냉장고 목록 오류' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '다시 시도').props.onPress();
      await Promise.resolve();
    });

    expect(mockedGetNearbyFridges).toHaveBeenCalledTimes(2);
    expect(
      renderer!.root.findAllByProps({ children: '전남대 공유 냉장고' }),
    ).not.toHaveLength(0);
  });

  it('searches nearby fridges on the server with a trimmed query', async () => {
    jest.useFakeTimers();
    const alphaFridge = {
      id: 7,
      name: 'Alpha Fridge',
      address: 'North Market',
      latitude: 35.1595,
      longitude: 126.9132,
      isActive: true,
      distance: 0.4,
    } as const;
    const betaFridge = {
      id: 8,
      name: 'Beta Fridge',
      address: 'South Market',
      latitude: 35.16,
      longitude: 126.914,
      isActive: true,
      distance: 0.6,
    } as const;
    mockedGetNearbyFridges
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [alphaFridge, betaFridge],
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [betaFridge],
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [alphaFridge, betaFridge],
      });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    const searchInput = renderer!.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('  beta  ');
    });
    await flushDebouncedSearch();

    expect(mockedGetNearbyFridges).toHaveBeenCalledTimes(2);
    expect(mockedGetNearbyFridges).toHaveBeenLastCalledWith(
      35.1595,
      126.9132,
      2.0,
      'beta',
      0,
      20,
    );
    expect(
      renderer!.root.findAllByProps({ children: 'Beta Fridge' }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Alpha Fridge' })).toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('   ');
    });
    await flushDebouncedSearch();

    expect(mockedGetNearbyFridges).toHaveBeenCalledTimes(3);
    expect(mockedGetNearbyFridges).toHaveBeenLastCalledWith(
      35.1595,
      126.9132,
      2.0,
    );
    expect(
      renderer!.root.findAllByProps({ children: 'Alpha Fridge' }),
    ).not.toHaveLength(0);
  });

  it('falls back to local fridge filtering when server search fails', async () => {
    jest.useFakeTimers();
    const alphaFridge = {
      id: 7,
      name: 'Alpha Fridge',
      address: 'North Market',
      latitude: 35.1595,
      longitude: 126.9132,
      isActive: true,
      distance: 0.4,
    } as const;
    const betaFridge = {
      id: 8,
      name: 'Beta Fridge',
      address: 'South Market',
      latitude: 35.16,
      longitude: 126.914,
      isActive: true,
      distance: 0.6,
    } as const;
    mockedGetNearbyFridges
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [alphaFridge, betaFridge],
      })
      .mockRejectedValueOnce(new Error('server search unavailable'));

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    const searchInput = renderer!.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('beta');
    });
    await flushDebouncedSearch();

    expect(mockedGetNearbyFridges).toHaveBeenCalledTimes(2);
    expect(mockedGetNearbyFridges).toHaveBeenLastCalledWith(
      35.1595,
      126.9132,
      2.0,
      'beta',
      0,
      20,
    );
    expect(findHostByTestId(renderer!, 'map-fridge-carousel')).toHaveLength(1);
    expect(
      renderer!.root.findAllByProps({ children: 'Beta Fridge' }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Alpha Fridge' })).toHaveLength(
      0,
    );
  });

  it('keeps blank unfiltered fridges when a stale server search resolves late', async () => {
    jest.useFakeTimers();
    const alphaFridge = {
      id: 7,
      name: 'Alpha Fridge',
      address: 'North Market',
      latitude: 35.1595,
      longitude: 126.9132,
      isActive: true,
      distance: 0.4,
    } as const;
    const betaFridge = {
      id: 8,
      name: 'Beta Fridge',
      address: 'South Market',
      latitude: 35.16,
      longitude: 126.914,
      isActive: true,
      distance: 0.6,
    } as const;
    let resolveSearch!: (value: ApiResponse<Fridge[]>) => void;
    mockedGetNearbyFridges
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [alphaFridge, betaFridge],
      })
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveSearch = resolve;
        }) as ReturnType<typeof getNearbyFridges>,
      )
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [alphaFridge, betaFridge],
      });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    const searchInput = renderer!.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('beta');
    });
    await flushDebouncedSearch();

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('');
    });
    await flushDebouncedSearch();

    await ReactTestRenderer.act(async () => {
      resolveSearch({
        success: true,
        message: 'ok',
        data: [betaFridge],
      });
      await Promise.resolve();
    });

    expect(mockedGetNearbyFridges).toHaveBeenCalledTimes(3);
    expect(
      renderer!.root.findAllByProps({ children: 'Alpha Fridge' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Beta Fridge' }),
    ).not.toHaveLength(0);
  });

  it('keeps server search results when the initial unfiltered fetch resolves late', async () => {
    jest.useFakeTimers();
    const alphaFridge = {
      id: 7,
      name: 'Alpha Fridge',
      address: 'North Market',
      latitude: 35.1595,
      longitude: 126.9132,
      isActive: true,
      distance: 0.4,
    } as const;
    const betaFridge = {
      id: 8,
      name: 'Beta Fridge',
      address: 'South Market',
      latitude: 35.16,
      longitude: 126.914,
      isActive: true,
      distance: 0.6,
    } as const;
    let resolveInitial!: (value: ApiResponse<Fridge[]>) => void;
    mockedGetNearbyFridges
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveInitial = resolve;
        }) as ReturnType<typeof getNearbyFridges>,
      )
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [betaFridge],
      });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    const searchInput = renderer!.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('beta');
    });
    await flushDebouncedSearch();

    await ReactTestRenderer.act(async () => {
      resolveInitial({
        success: true,
        message: 'ok',
        data: [alphaFridge, betaFridge],
      });
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({ children: 'Beta Fridge' }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'Alpha Fridge' })).toHaveLength(
      0,
    );
  });

  it('labels empty server fridge search results as search-empty state', async () => {
    jest.useFakeTimers();
    const alphaFridge = {
      id: 7,
      name: 'Alpha Fridge',
      address: 'North Market',
      latitude: 35.1595,
      longitude: 126.9132,
      isActive: true,
      distance: 0.4,
    } as const;
    mockedGetNearbyFridges
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [alphaFridge],
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'ok',
        data: [],
      });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    const searchInput = renderer!.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      searchInput.props.onChangeText('missing');
    });
    await flushDebouncedSearch();

    expect(
      renderer!.root.findAllByProps({ children: '검색 결과가 없습니다' }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '근처에 냉장고가 없습니다' }),
    ).toHaveLength(0);
  });

  it('guards the map when the account has no registered location', async () => {
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

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    expect(mockedGetNearbyFridges).not.toHaveBeenCalled();
    expect(
      renderer!.root.findAllByProps({ children: '동네 위치를 설정해주세요' }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '위치 설정하기').props.onPress();
    });

    expect(mockRootNavigate).toHaveBeenCalledWith('LocationSetup', {
      allowBack: true,
    });
  });

  it('separates loading and empty states for selected fridge posts', async () => {
    let resolvePosts!: (value: ApiResponse<PostNearbyRead[]>) => void;
    mockedGetFridgePosts.mockReturnValue(
      new Promise(resolve => {
        resolvePosts = resolve;
      }),
    );
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '전남대 공유 냉장고').props.onPress();
    });

    expect(
      renderer!.root.findAllByProps({
        children: '냉장고 안 나눔을 불러오는 중입니다',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      resolvePosts({ success: true, message: 'ok', data: [] });
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({
        children: '지금 가능한 나눔 식재료가 없습니다',
      }),
    ).not.toHaveLength(0);
  });

  it('separates error state for selected fridge posts', async () => {
    mockedGetFridgePosts.mockResolvedValue({
      success: false,
      message: '냉장고 내부 목록 오류',
      data: null,
    });
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '전남대 공유 냉장고').props.onPress();
    });

    expect(
      renderer!.root.findAllByProps({
        children: '내부 목록을 불러오지 못했습니다',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: '냉장고 내부 목록 오류' }),
    ).not.toHaveLength(0);
  });

  it('removes a requested post from the selected fridge list', async () => {
    const remainingPost: PostNearbyRead = {
      ...post,
      id: 11,
      detectedFruit: 'banana',
      detectedFruitKo: 'banana-qa',
      imageUrl: '/static/posts/11.jpg',
    };
    mockedGetFridgePosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [post, remainingPost],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '전남대 공유 냉장고').props.onPress();
    });

    expect(
      renderer!.root.findAllByProps({ children: post.detectedFruitKo }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: remainingPost.detectedFruitKo })
        .length,
    ).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      useFeedRefreshStore.getState().requestNearbyPostsRefresh(post.id);
    });

    expect(
      renderer!.root.findAllByProps({ children: post.detectedFruitKo }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({ children: remainingPost.detectedFruitKo })
        .length,
    ).toBeGreaterThan(0);
  });

  it('keeps selected fridge posts when a generic nearby refresh has no removal id', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MapScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, post.fridgeName).props.onPress();
    });

    expect(
      renderer!.root.findAllByProps({ children: post.detectedFruitKo }).length,
    ).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      useFeedRefreshStore.setState({
        nearbyPostsRefreshToken: 1,
        requestedPostId: post.id,
      });
      useFeedRefreshStore.getState().requestNearbyPostsRefresh();
    });

    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();
    expect(
      renderer!.root.findAllByProps({ children: post.detectedFruitKo }).length,
    ).toBeGreaterThan(0);
  });
});
