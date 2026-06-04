import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import PostDetailScreen from '@/screens/post/PostDetailScreen';
import { getPostDetail, requestShare } from '@/api/posts';
import { getUserTrustSummary } from '@/api/trust';
import { useAuthStore } from '@/store/authStore';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import type { Post } from '@/types';
import { renderWithSafeArea } from '../test-utils/renderWithSafeArea';

jest.mock('@/api/posts', () => ({
  getImageUrl: jest.fn(
    (relativeUrl: string) => `http://localhost${relativeUrl}`,
  ),
  getPostDetail: jest.fn(),
  deletePost: jest.fn(),
  requestShare: jest.fn(),
}));

jest.mock('@/api/trust', () => ({
  getUserTrustSummary: jest.fn(),
}));

const mockedGetPostDetail = getPostDetail as jest.MockedFunction<
  typeof getPostDetail
>;
const mockedRequestShare = requestShare as jest.MockedFunction<
  typeof requestShare
>;
const mockedGetUserTrustSummary = getUserTrustSummary as jest.MockedFunction<
  typeof getUserTrustSummary
>;

const basePost: Post = {
  id: 10,
  fridgeId: 1,
  authorId: 1,
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

const createScreen = async (
  navigation: {goBack: jest.Mock; navigate?: jest.Mock} = {
    goBack: jest.fn(),
  },
) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      renderWithSafeArea(
        <PostDetailScreen
          navigation={navigation as any}
          route={{ params: { postId: 10 } } as any}
        />,
      ),
    );
    await Promise.resolve();
  });

  if (!renderer) {
    throw new Error('renderer was not created');
  }

  return renderer;
};

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

const findPickupQrButtons = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const button = findButtonByText(renderer, '수령 QR 인증');
  return button ? [button] : [];
};

const findExpiredHoldNotices = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByProps({
    children: '수령 제한 시간이 지났어요. 목록을 새로고침하면 상태가 갱신됩니다.',
  });

describe('PostDetailScreen share request', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  let dateNowSpy: jest.SpyInstance<number, []> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: basePost,
    });
    mockedGetUserTrustSummary.mockResolvedValue({
      success: true,
      message: '공급자 신뢰 요약 조회 성공',
      data: {
        userId: 1,
        completedShares: 12,
        positiveReviewCount: 9,
        matchedPhotoCount: 8,
        easyToFindCount: 7,
        badges: [
          'store_qr_verified',
          'completed_pickup',
          'positive_reviews',
        ],
        computedAt: '2026-06-04T12:10:00.000Z',
      },
    });
    useAuthStore.setState({
      user: {
        id: 2,
        email: 'requester@example.com',
        nickname: '신청자',
        profileImageUrl: null,
        latitude: 35.1595,
        longitude: 126.9132,
        fcmToken: null,
        isActive: true,
        createdAt: '2026-05-06T00:00:00Z',
        updatedAt: '2026-05-06T00:00:00Z',
      },
      isLoggedIn: true,
      hasLocation: true,
    });
    useFeedRefreshStore.setState({
      nearbyPostsRefreshToken: 0,
      requestedPostId: null,
    });
  });

  afterEach(() => {
    dateNowSpy?.mockRestore();
    dateNowSpy = undefined;
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('requests an available share and updates detail state to requested', async () => {
    mockedRequestShare.mockResolvedValue({
      success: true,
      message: '나눔 신청이 완료되었습니다.',
      data: {
        request: {
          id: 1,
          postId: 10,
          requesterId: 2,
          status: 'requested',
          createdAt: '2026-05-06T00:00:00Z',
        },
        post: {
          ...basePost,
          status: 'requested',
        },
      },
    });

    const renderer = await createScreen();
    const requestButton = findButtonByText(renderer, '나눔 신청하기');

    expect(requestButton).toBeTruthy();
    expect(
      renderer.root.findAllByProps({
        children: 'AI 참고 신호는 95%이며, 실제 상태는 수령 전 확인이 필요해요.',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({
        children: '신청 접수는 예약 확정이 아니에요.',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      requestButton?.props.onPress();
      await Promise.resolve();
    });

    expect(mockedRequestShare).toHaveBeenCalledWith(10);
    expect(alertSpy).toHaveBeenCalledWith(
      '신청 완료',
      '나눔 신청이 접수되었습니다.',
    );
    expect(useFeedRefreshStore.getState().requestedPostId).toBe(10);
    expect(findButtonByText(renderer, '신청 접수')).toBeTruthy();
    expect(
      renderer.root.findAllByProps({
        children: '신청이 접수된 상태이며 예약 확정은 아니에요.',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('shows provider trust badges on the share detail', async () => {
    const renderer = await createScreen();

    expect(mockedGetUserTrustSummary).toHaveBeenCalledWith(1);
    expect(
      renderer.root.findAllByProps({ children: '공급자 신뢰' }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ children: 'QR 보관 인증' }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ children: '수령 완료 12회' }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ children: '좋은 평가 9회' }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ children: '최근 신고 검토 없음' }),
    ).toHaveLength(0);
    expect(
      renderer.root.findAllByProps({ children: '신고 검토 1건' }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('treats 409 conflict as a normal race result and disables the CTA', async () => {
    mockedRequestShare.mockRejectedValue({
      response: {
        status: 409,
        data: { message: '이미 신청이 접수된 나눔 식재료입니다.' },
      },
    });

    const renderer = await createScreen();
    const requestButton = findButtonByText(renderer, '나눔 신청하기');

    await ReactTestRenderer.act(async () => {
      requestButton?.props.onPress();
      await Promise.resolve();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '신청 마감',
      '다른 사용자가 먼저 신청했어요.',
    );
    expect(useFeedRefreshStore.getState().requestedPostId).toBe(10);
    expect(findButtonByText(renderer, '신청 접수')).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('shows the pickup countdown for a requested post with requestExpiresAt', async () => {
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: '2026-05-06T00:09:30Z',
      },
    });

    const renderer = await createScreen();

    expect(findButtonByText(renderer, '신청 접수')).toBeTruthy();
    expect(
      renderer.root.findAllByProps({
        children: '신청이 접수된 상태이며 예약 확정은 아니에요.',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({
        children: '수령까지 남은 시간 09:30',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('shows the expired pickup limit message for an expired requestExpiresAt', async () => {
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: '2026-05-05T23:59:59Z',
      },
    });

    const renderer = await createScreen();

    expect(findButtonByText(renderer, '신청 접수')).toBeTruthy();
    expect(
      renderer.root.findAllByProps({
        children:
          '수령 제한 시간이 지났어요. 목록을 새로고침하면 상태가 갱신됩니다.',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('ignores an invalid requestExpiresAt instead of showing a broken countdown', async () => {
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: 'not-a-date',
      },
    });

    const renderer = await createScreen();

    expect(findButtonByText(renderer, '신청 접수')).toBeTruthy();
    expect(
      renderer.root.findAllByProps({
        children: '신청이 접수된 상태이며 예약 확정은 아니에요.',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({
        children: '수령까지 남은 시간 NaN:NaN',
      }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('opens the pickup QR flow for a requested post', async () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: '2026-05-06T00:30:00Z',
      },
    });

    const renderer = await createScreen(navigation);
    const pickupButton = findButtonByText(renderer, '수령 QR 인증');

    expect(pickupButton).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      pickupButton?.props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('InventoryQr', {
      mode: 'pickup',
      postId: 10,
      pendingExpiresAt: '2026-05-06T00:30:00Z',
    });

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('blocks pickup QR and requests a generic refresh for an expired requested hold', async () => {
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: '2026-05-05T23:59:59Z',
      },
    });

    const renderer = await createScreen({
      goBack: jest.fn(),
      navigate: jest.fn(),
    });

    expect(findPickupQrButtons(renderer)).toHaveLength(0);
    expect(findExpiredHoldNotices(renderer).length).toBeGreaterThan(0);
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(1);
    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();

    await ReactTestRenderer.act(async () => {
      renderer.update(
        renderWithSafeArea(
          <PostDetailScreen
            navigation={{ goBack: jest.fn(), navigate: jest.fn() } as any}
            route={{ params: { postId: 10 } } as any}
          />,
        ),
      );
      await Promise.resolve();
    });

    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(1);

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('keeps pickup QR available for a non-expired requested hold without refresh', async () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: '2026-05-06T00:30:00Z',
      },
    });

    const renderer = await createScreen(navigation);
    const pickupButton = findPickupQrButtons(renderer)[0];

    expect(pickupButton).toBeTruthy();
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(0);

    await ReactTestRenderer.act(async () => {
      pickupButton?.props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('InventoryQr', {
      mode: 'pickup',
      postId: 10,
      pendingExpiresAt: '2026-05-06T00:30:00Z',
    });
    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(0);
    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('does not request an expired refresh for an invalid requestExpiresAt', async () => {
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-06T00:00:00Z').getTime());
    mockedGetPostDetail.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        ...basePost,
        status: 'requested',
        requestExpiresAt: 'not-a-date',
      },
    });

    const renderer = await createScreen();

    expect(useFeedRefreshStore.getState().nearbyPostsRefreshToken).toBe(0);
    expect(useFeedRefreshStore.getState().requestedPostId).toBeNull();

    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
