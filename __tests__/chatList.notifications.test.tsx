import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ChatListScreen from '@/screens/chat/ChatListScreen';
import {openNotificationTarget} from '@/services/notifications';
import {useNotificationStore} from '@/store/notificationStore';
import {
  deleteServerNotification,
  getNotifications,
  markAllServerNotificationsRead,
  markServerNotificationRead,
} from '@/api/notifications';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void) => {
    const ReactForMock = require('react');
    ReactForMock.useEffect(callback, [callback]);
  }),
}));

jest.mock('@/services/notifications', () => ({
  openNotificationTarget: jest.fn(),
}));

jest.mock('@/api/notifications', () => ({
  deleteServerNotification: jest.fn(),
  getNotifications: jest.fn(),
  markServerNotificationRead: jest.fn(),
  markAllServerNotificationsRead: jest.fn(),
}));

const mockedOpenNotificationTarget =
  openNotificationTarget as jest.MockedFunction<typeof openNotificationTarget>;
const mockedGetNotifications = getNotifications as jest.MockedFunction<
  typeof getNotifications
>;
const mockedDeleteServerNotification =
  deleteServerNotification as jest.MockedFunction<
    typeof deleteServerNotification
  >;
const mockedMarkServerNotificationRead =
  markServerNotificationRead as jest.MockedFunction<
    typeof markServerNotificationRead
  >;
const mockedMarkAllServerNotificationsRead =
  markAllServerNotificationsRead as jest.MockedFunction<
    typeof markAllServerNotificationsRead
  >;

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

describe('ChatListScreen notifications', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetNotifications.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
    });
    mockedMarkServerNotificationRead.mockResolvedValue({
      success: true,
      message: 'ok',
      data: null,
    });
    mockedDeleteServerNotification.mockResolvedValue({
      success: true,
      message: 'ok',
      data: null,
    });
    mockedMarkAllServerNotificationsRead.mockResolvedValue({
      success: true,
      message: 'ok',
      data: null,
    });
    useNotificationStore.setState({notifications: []});
  });

  afterEach(async () => {
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
      renderer = undefined;
    });
    jest.restoreAllMocks();
  });

  it('shows empty notification inbox', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    expect(
      renderer!.root.findAllByProps({children: '아직 알림이 없습니다'}),
    ).not.toHaveLength(0);
  });

  it('shows received notification records and opens the selected target', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'message-1',
          type: 'share_created',
          postId: '10',
          fruitName: '사과',
          fridgeName: '전남대 공유 냉장고',
          title: '근처에 나눔이 등록됐어요',
          body: '전남대 공유 냉장고에 사과 나눔이 등록됐어요.',
          receivedAt: '2026-05-06T00:00:00.000Z',
          source: 'foreground',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    expect(
      renderer!.root.findAllByProps({children: '근처에 나눔이 등록됐어요'}),
    ).not.toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children: '전남대 공유 냉장고에 사과 나눔이 등록됐어요.',
      }),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '근처에 나눔이 등록됐어요').props.onPress();
    });

    expect(mockedOpenNotificationTarget).toHaveBeenCalledWith(
      expect.objectContaining({id: 'message-1', postId: '10'}),
    );
  });

  it('marks a notification as read when the user opens it', async () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce(
      '2026-05-06T00:05:00.000Z',
    );
    useNotificationStore.setState({
      notifications: [
        {
          id: 'message-2',
          type: 'share_requested',
          postId: '11',
          requestId: '99',
          fruitName: '바나나',
          fridgeName: '광주역 공유 냉장고',
          title: '나눔 신청이 도착했어요',
          body: '바나나 나눔에 신청이 들어왔어요.',
          receivedAt: '2026-05-06T00:00:00.000Z',
          source: 'foreground',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    expect(renderer!.root.findAllByProps({children: '새 알림'})).not.toHaveLength(
      0,
    );

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '나눔 신청이 도착했어요').props.onPress();
    });

    expect(useNotificationStore.getState().notifications[0].readAt).toBe(
      '2026-05-06T00:05:00.000Z',
    );
    expect(renderer!.root.findAllByProps({children: '읽음'})).not.toHaveLength(0);
    expect(mockedOpenNotificationTarget).toHaveBeenCalledWith(
      expect.objectContaining({id: 'message-2', postId: '11'}),
    );
    expect(mockedMarkServerNotificationRead).not.toHaveBeenCalled();
  });

  it('marks server notifications read on the server when opened', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'server-message-2',
          type: 'share_requested',
          postId: '11',
          requestId: '99',
          fruitName: '바나나',
          fridgeName: '광주역 공유 냉장고',
          title: '서버 나눔 신청 알림',
          body: '바나나 나눔에 신청이 들어왔어요.',
          receivedAt: '2026-05-06T00:00:00.000Z',
          source: 'server',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '서버 나눔 신청 알림').props.onPress();
      await Promise.resolve();
    });

    expect(mockedMarkServerNotificationRead).toHaveBeenCalledWith(
      'server-message-2',
    );
  });

  it('marks every local notification as read without clearing the inbox', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'message-3',
          type: 'share_created',
          postId: '12',
          fruitName: '사과',
          fridgeName: '전남대 공유 냉장고',
          title: '근처에 나눔이 등록됐어요',
          body: '전남대 공유 냉장고에 사과 나눔이 등록됐어요.',
          receivedAt: '2026-05-06T00:00:00.000Z',
          source: 'foreground',
        },
        {
          id: 'message-4',
          type: 'share_requested',
          postId: '13',
          requestId: '100',
          fruitName: '바나나',
          fridgeName: '광주역 공유 냉장고',
          title: '나눔 신청이 도착했어요',
          body: '바나나 나눔에 신청이 들어왔어요.',
          receivedAt: '2026-05-06T00:01:00.000Z',
          source: 'background',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    expect(
      renderer!.root.findAllByProps({children: '새 알림 2개가 있습니다'}),
    ).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '모두 읽음').props.onPress();
    });

    expect(
      useNotificationStore
        .getState()
        .notifications.every(notification => Boolean(notification.readAt)),
    ).toBe(true);
    expect(renderer!.root.findAllByProps({children: '새 알림'})).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({children: '나눔 신청이 도착했어요'}),
    ).not.toHaveLength(0);
    expect(mockedMarkAllServerNotificationsRead).not.toHaveBeenCalled();
  });

  it('marks server notifications read on the server when using read all', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'server-message-3',
          type: 'share_created',
          postId: '12',
          fruitName: '사과',
          fridgeName: '전남대 공유 냉장고',
          title: '서버 근처 나눔 알림',
          body: '전남대 공유 냉장고에 사과 나눔이 등록됐어요.',
          receivedAt: '2026-05-06T00:00:00.000Z',
          source: 'server',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '모두 읽음').props.onPress();
      await Promise.resolve();
    });

    expect(mockedMarkAllServerNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it('merges server notification records into the local inbox on focus', async () => {
    mockedGetNotifications.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'server-message-1',
          type: 'share_created',
          postId: '14',
          fruitName: '토마토',
          fridgeName: '중앙 공유 냉장고',
          title: '서버 알림',
          body: '서버에서 동기화된 알림입니다.',
          receivedAt: '2026-05-06T00:10:00.000Z',
          readAt: null,
          source: 'server',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
      await Promise.resolve();
    });

    expect(mockedGetNotifications).toHaveBeenCalledWith(false, 0, 50);
    expect(
      renderer!.root.findAllByProps({children: '서버 알림'}),
    ).not.toHaveLength(0);
    expect(useNotificationStore.getState().notifications[0].source).toBe(
      'server',
    );
  });

  it('deletes only server-backed notifications when clearing the inbox', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'message-local',
          type: 'share_created',
          postId: '20',
          fruitName: '사과',
          fridgeName: '전남대 공유 냉장고',
          title: '로컬 알림',
          body: '기기에만 저장된 알림입니다.',
          receivedAt: '2026-05-06T00:00:00.000Z',
          source: 'foreground',
        },
        {
          id: 'message-server',
          type: 'share_requested',
          postId: '21',
          requestId: '101',
          fruitName: '바나나',
          fridgeName: '광주역 공유 냉장고',
          title: '서버 알림',
          body: '서버에 저장된 알림입니다.',
          receivedAt: '2026-05-06T00:01:00.000Z',
          source: 'server',
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ChatListScreen />);
    });

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '비우기').props.onPress();
      await Promise.resolve();
    });

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(mockedDeleteServerNotification).toHaveBeenCalledTimes(1);
    expect(mockedDeleteServerNotification).toHaveBeenCalledWith(
      'message-server',
    );
  });
});
