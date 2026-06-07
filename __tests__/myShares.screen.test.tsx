import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import MySharesScreen from '@/screens/profile/MySharesScreen';
import {
  cancelPost,
  cancelShareRequest,
} from '@/api/posts';
import { getMyPosts, getMyShareRequests } from '@/api/users';
import { useTrustFeedbackStore } from '@/store/trustFeedbackStore';
import { colors } from '@/theme';
import type { Post, UserShareRequestItem } from '@/types';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void) => {
    const ReactForMock = require('react');
    ReactForMock.useEffect(callback, [callback]);
  }),
}));

jest.mock('@/api/users', () => ({
  getMyPosts: jest.fn(),
  getMyShareRequests: jest.fn(),
}));

jest.mock('@/api/posts', () => ({
  cancelPost: jest.fn(),
  cancelShareRequest: jest.fn(),
}));

const mockedGetMyPosts = getMyPosts as jest.MockedFunction<typeof getMyPosts>;
const mockedGetMyShareRequests =
  getMyShareRequests as jest.MockedFunction<typeof getMyShareRequests>;
const mockedCancelPost = cancelPost as jest.MockedFunction<typeof cancelPost>;
const mockedCancelShareRequest =
  cancelShareRequest as jest.MockedFunction<typeof cancelShareRequest>;

const basePost: Post = {
  id: 31,
  fridgeId: 1,
  fridgeName: '광주역 공유냉장고',
  authorId: 2,
  detectedFruit: 'banana',
  detectedFruitKo: '바나나',
  freshnessLabel: 'Fresh',
  confidenceScore: 0.91,
  imageUrl: '/static/posts/31.jpg',
  expirationDate: '2026-05-27',
  status: 'pending_store',
  storeExpiresAt: '2026-05-26T01:00:00Z',
  createdAt: '2026-05-26T00:00:00Z',
  updatedAt: '2026-05-26T00:00:00Z',
};

const receivedItem: UserShareRequestItem = {
  request: {
    id: 55,
    postId: 41,
    requesterId: 3,
    status: 'requested',
    createdAt: '2026-05-26T00:10:00Z',
  },
  post: {
    ...basePost,
    id: 41,
    authorId: 4,
    detectedFruit: 'apple',
    detectedFruitKo: '사과',
    status: 'requested',
    requestExpiresAt: '2026-05-26T00:40:00Z',
    fridgeName: '중앙 공유 냉장고',
  },
};

const findTouchableByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) => {
  const labelMatch = renderer.root.findAll(
    node => node.type === TouchableOpacity && node.props.accessibilityLabel === text,
  )[0];

  if (labelMatch) {
    return labelMatch;
  }

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

const findTouchablesByAccessibilityLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) =>
  renderer.root.findAll(
    node =>
      node.type === TouchableOpacity && node.props.accessibilityLabel === text,
  );

const confirmLastAlert = async () => {
  const alertMock = Alert.alert as jest.Mock;
  const lastCall = alertMock.mock.calls[alertMock.mock.calls.length - 1];
  const buttons = lastCall?.[2] as
    | Array<{ onPress?: () => void }>
    | undefined;
  const confirmButton = buttons?.find(button => button.onPress);

  if (!confirmButton?.onPress) {
    throw new Error('Confirm alert button not found');
  }

  await ReactTestRenderer.act(async () => {
    confirmButton.onPress?.();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('MySharesScreen', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockedGetMyPosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [basePost],
    });
    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [receivedItem],
    });
    mockedCancelPost.mockResolvedValue({
      success: true,
      message: 'ok',
      data: null,
    });
    mockedCancelShareRequest.mockResolvedValue({
      success: true,
      message: 'ok',
      data: null,
    });
    useTrustFeedbackStore.getState().resetTrustFeedback();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows my registered shares and opens store QR for pending-store posts', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'posted' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(mockedGetMyPosts).toHaveBeenCalled();
    expect(renderer!.root.findAllByProps({ children: '바나나' })).not.toHaveLength(0);
    expect(
      renderer!.root.findAll(
        node =>
          typeof node.props.children === 'string' &&
          node.props.children.includes('광주역 공유냉장고'),
      ),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '입고 QR').props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('InventoryQr', {
      mode: 'store',
      postId: 31,
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('cancels a pending-store share after confirmation', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'posted' } } as never}
        />,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '나눔 취소').props.onPress();
    });
    await confirmLastAlert();

    expect(mockedCancelPost).toHaveBeenCalledWith(31);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('cancels requested posted shares without exposing manual complete or expiry', async () => {
    const requestedPost: Post = {
      ...basePost,
      id: 32,
      status: 'requested',
      requestExpiresAt: '2026-05-26T00:40:00Z',
    };
    mockedGetMyPosts.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [requestedPost],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'posted' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(() => findTouchableByText(renderer!, '완료 처리')).toThrow(
      'Touchable with text "완료 처리" not found',
    );
    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '나눔 취소').props.onPress();
    });
    await confirmLastAlert();
    expect(mockedCancelPost).toHaveBeenCalledWith(32);
    expect(() => findTouchableByText(renderer!, '만료 처리')).toThrow(
      'Touchable with text "만료 처리" not found',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('opens received shares with pickup QR as the first action', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(
      renderer!.root.findAllByProps({ children: '받은 나눔' }),
    ).not.toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: '사과' })).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '수령 QR').props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('InventoryQr', {
      mode: 'pickup',
      postId: 41,
      pendingExpiresAt: '2026-05-26T00:40:00Z',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('opens feedback for completed received shares', async () => {
    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          ...receivedItem,
          request: {
            ...receivedItem.request,
            status: 'completed',
          },
          post: {
            ...receivedItem.post,
            status: 'completed',
            pickedUpAt: '2026-05-26T00:35:00Z',
          },
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '평가하기').props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ShareFeedback', {
      requestId: 55,
      postId: 41,
      providerId: 4,
      fruitName: '사과',
      fridgeName: '중앙 공유 냉장고',
      initialMode: 'review',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps report as a compact icon action for completed received shares', async () => {
    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          ...receivedItem,
          request: {
            ...receivedItem.request,
            status: 'completed',
          },
          post: {
            ...receivedItem.post,
            status: 'completed',
            pickedUpAt: '2026-05-26T00:35:00Z',
          },
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    const reportButton = findTouchableByText(renderer!, '신고하기');

    expect(reportButton.findAllByProps({ children: '신고하기' })).toHaveLength(
      0,
    );
    const reportIcon = reportButton.findByProps({
      name: 'alarm-light-outline',
    });
    expect(reportIcon.props.color).toBe(colors.textTertiary);

    await ReactTestRenderer.act(async () => {
      reportButton.props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ShareFeedback', {
      requestId: 55,
      postId: 41,
      providerId: 4,
      fruitName: '사과',
      fridgeName: '중앙 공유 냉장고',
      initialMode: 'report',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('marks completed received shares as reviewed after local feedback submission', async () => {
    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          ...receivedItem,
          request: {
            ...receivedItem.request,
            status: 'completed',
          },
          post: {
            ...receivedItem.post,
            status: 'completed',
            pickedUpAt: '2026-05-26T00:35:00Z',
          },
        },
      ],
    });
    useTrustFeedbackStore.getState().submitReview({
      requestId: 55,
      postId: 41,
      providerId: 4,
      positiveTagIds: ['good_condition'],
      issueTagIds: [],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(renderer!.root.findAllByProps({ children: '평가 완료' })).not.toHaveLength(0);
    expect(() => findTouchableByText(renderer!, '평가하기')).toThrow(
      'Touchable with text "평가하기" not found',
    );

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('cancels a received request after confirmation', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '신청 취소').props.onPress();
    });
    await confirmLastAlert();

    expect(mockedCancelShareRequest).toHaveBeenCalledWith(55);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('hides received actions unless both request and post are requested', async () => {
    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          ...receivedItem,
          request: {
            ...receivedItem.request,
            status: 'cancelled',
          },
        },
      ],
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(renderer!.root.findAllByProps({ children: '신청 취소' })).not.toHaveLength(
      0,
    );
    expect(() => findTouchableByText(renderer!, '수령 QR')).toThrow(
      'Touchable with text "수령 QR" not found',
    );
    expect(
      findTouchablesByAccessibilityLabel(renderer!, '신청 취소'),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });

    mockedGetMyShareRequests.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          ...receivedItem,
          post: {
            ...receivedItem.post,
            status: 'available',
          },
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(() => findTouchableByText(renderer!, '수령 QR')).toThrow(
      'Touchable with text "수령 QR" not found',
    );
    expect(
      findTouchablesByAccessibilityLabel(renderer!, '신청 취소'),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('updates the active tab when route params change on a reused screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'posted' } } as never}
        />,
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <MySharesScreen
          navigation={navigation as never}
          route={{ params: { initialTab: 'received' } } as never}
        />,
      );
      await Promise.resolve();
    });

    expect(findTouchableByText(renderer!, '수령 QR')).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
