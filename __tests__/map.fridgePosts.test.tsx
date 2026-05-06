import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import MapScreen from '@/screens/map/MapScreen';
import {getFridgePosts, getNearbyFridges} from '@/api/fridges';
import {useAuthStore} from '@/store/authStore';
import type {ApiResponse, Post} from '@/types';

const mockRootNavigate = jest.fn();

jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const ReactForMock = require('react');
  const {View} = jest.requireActual('react-native');

  const MockFlatList = ReactForMock.forwardRef(
    (
      {
        data = [],
        renderItem,
        keyExtractor,
        ...props
      }: {
        data?: unknown[];
        renderItem: (info: {item: unknown; index: number}) => React.ReactNode;
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
            {key: keyExtractor?.(item, index) ?? String(index)},
            renderItem({item, index}),
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
    getParent: jest.fn(() => ({navigate: mockRootNavigate})),
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

const post: Post = {
  id: 10,
  fridgeId: 7,
  authorId: 2,
  detectedFruit: 'apple',
  detectedFruitKo: '사과',
  freshnessLabel: 'Fresh',
  confidenceScore: 0.95,
  imageUrl: '/static/posts/10.jpg',
  expirationDate: '2026-05-08',
  status: 'available',
  createdAt: '2026-05-06T00:00:00Z',
  updatedAt: '2026-05-06T00:00:00Z',
};

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
  });

  afterEach(async () => {
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
      renderer = undefined;
    });
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
      renderer!.root.findAllByProps({children: '사과'}).length,
    ).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '사과').props.onPress();
    });

    expect(mockRootNavigate).toHaveBeenCalledWith('PostDetail', {postId: 10});

  });

  it('separates loading and empty states for selected fridge posts', async () => {
    let resolvePosts!: (value: ApiResponse<Post[]>) => void;
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
      resolvePosts({success: true, message: 'ok', data: []});
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
      renderer!.root.findAllByProps({children: '냉장고 내부 목록 오류'}),
    ).not.toHaveLength(0);
  });
});
