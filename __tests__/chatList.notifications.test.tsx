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
import type {NotificationRecord} from '@/types';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
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

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const localNotification = (
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord => ({
  id: 'local-message-1',
  type: 'share_created',
  postId: '10',
  fruitName: 'Apples',
  fridgeName: 'Community fridge',
  title: 'Local notification',
  body: 'A local FCM notification',
  receivedAt: '2026-05-06T00:00:00.000Z',
  source: 'foreground',
  ...overrides,
});

const serverNotification = (
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord => ({
  id: 'server-message-1',
  type: 'share_requested',
  postId: '20',
  requestId: '200',
  fruitName: 'Bananas',
  fridgeName: 'Synced fridge',
  title: 'Server notification',
  body: 'A server-backed notification',
  receivedAt: '2026-05-06T00:10:00.000Z',
  readAt: null,
  source: 'server',
  ...overrides,
});

const renderScreen = async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<ChatListScreen />);
    await flushPromises();
  });

  return renderer!;
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

  it('fetches server notification records on focus', async () => {
    renderer = await renderScreen();

    expect(mockedGetNotifications).toHaveBeenCalledWith(false, 0, 50);
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('renders empty notification guidance with expected event types', async () => {
    renderer = await renderScreen();

    expect(
      renderer.root.findAllByProps({children: '아직 알림이 없습니다'}),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({
        children:
          '근처 나눔 등록과 신청 접수처럼 확인할 일이 생기면 이곳에 모입니다.',
      }),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({children: '근처 나눔 등록'}),
    ).not.toHaveLength(0);
    expect(
      renderer.root.findAllByProps({children: '나눔 신청 접수'}),
    ).not.toHaveLength(0);
  });

  it('syncs and displays server notification records from focus fetch', async () => {
    mockedGetNotifications.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: [serverNotification()],
    });

    renderer = await renderScreen();

    expect(
      renderer.root.findAllByProps({children: 'Server notification'}),
    ).not.toHaveLength(0);
    expect(useNotificationStore.getState().notifications).toEqual([
      expect.objectContaining({id: 'server-message-1', source: 'server'}),
    ]);
  });

  it('keeps local notification records visible when server fetch fails', async () => {
    mockedGetNotifications.mockRejectedValueOnce(new Error('offline'));
    useNotificationStore.setState({
      notifications: [localNotification()],
    });

    renderer = await renderScreen();

    expect(mockedGetNotifications).toHaveBeenCalledWith(false, 0, 50);
    expect(
      renderer.root.findAllByProps({children: 'Local notification'}),
    ).not.toHaveLength(0);
    expect(useNotificationStore.getState().notifications).toEqual([
      expect.objectContaining({id: 'local-message-1'}),
    ]);
  });

  it('opens local notification records without calling server read', async () => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValueOnce('2026-05-06T00:05:00.000Z');
    useNotificationStore.setState({
      notifications: [localNotification()],
    });

    renderer = await renderScreen();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, 'Local notification').props.onPress();
      await flushPromises();
    });

    expect(useNotificationStore.getState().notifications[0].readAt).toBe(
      '2026-05-06T00:05:00.000Z',
    );
    expect(mockedOpenNotificationTarget).toHaveBeenCalledWith(
      expect.objectContaining({id: 'local-message-1', postId: '10'}),
    );
    expect(mockedMarkServerNotificationRead).not.toHaveBeenCalled();
  });

  it('marks server-source notifications read on open', async () => {
    jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValueOnce('2026-05-06T00:06:00.000Z');
    useNotificationStore.setState({
      notifications: [serverNotification()],
    });

    renderer = await renderScreen();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, 'Server notification').props.onPress();
      await flushPromises();
    });

    expect(useNotificationStore.getState().notifications[0].readAt).toBe(
      '2026-05-06T00:06:00.000Z',
    );
    expect(mockedMarkServerNotificationRead).toHaveBeenCalledWith(
      'server-message-1',
    );
    expect(mockedOpenNotificationTarget).toHaveBeenCalledWith(
      expect.objectContaining({id: 'server-message-1', postId: '20'}),
    );
  });

  it('marks every notification read and calls server read-all when unread server records exist', async () => {
    useNotificationStore.setState({
      notifications: [
        localNotification({id: 'local-message-2'}),
        serverNotification({id: 'server-message-2'}),
      ],
    });

    renderer = await renderScreen();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '모두 읽음').props.onPress();
      await flushPromises();
    });

    expect(
      useNotificationStore
        .getState()
        .notifications.every(notification => Boolean(notification.readAt)),
    ).toBe(true);
    expect(mockedMarkAllServerNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it('does not call server read-all when only local unread records exist', async () => {
    useNotificationStore.setState({
      notifications: [localNotification()],
    });

    renderer = await renderScreen();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '모두 읽음').props.onPress();
      await flushPromises();
    });

    expect(
      useNotificationStore
        .getState()
        .notifications.every(notification => Boolean(notification.readAt)),
    ).toBe(true);
    expect(mockedMarkAllServerNotificationsRead).not.toHaveBeenCalled();
  });

  it('clears local inbox and best-effort deletes server-source records', async () => {
    useNotificationStore.setState({
      notifications: [
        localNotification({id: 'message-local'}),
        serverNotification({id: 'message-server'}),
      ],
    });

    renderer = await renderScreen();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '비우기').props.onPress();
      await flushPromises();
    });

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(mockedDeleteServerNotification).toHaveBeenCalledWith(
      'message-server',
    );
    expect(mockedDeleteServerNotification).toHaveBeenCalledTimes(1);
  });

  it('clears local inbox even when server delete fails', async () => {
    mockedDeleteServerNotification.mockRejectedValueOnce(new Error('offline'));
    useNotificationStore.setState({
      notifications: [serverNotification({id: 'message-server-failing'})],
    });

    renderer = await renderScreen();

    await ReactTestRenderer.act(async () => {
      findTouchableByText(renderer!, '비우기').props.onPress();
      await flushPromises();
    });

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(mockedDeleteServerNotification).toHaveBeenCalledWith(
      'message-server-failing',
    );
  });
});
