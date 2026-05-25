import {
  buildNotificationNavigationAction,
  flushPendingNotificationNavigation,
  handleInitialNotificationPayload,
  handleRemoteNotification,
  isFcmStringDataPayload,
  openNotificationTarget,
  parseFoodLinkFcmPayload,
  consumePendingNativeNotificationPayload,
  registerNativeNotificationOpenHandler,
} from '@/services/notifications';
import {rootNavigationRef} from '@/navigation/rootNavigation';
import {useAuthStore} from '@/store/authStore';
import {useNotificationStore} from '@/store/notificationStore';
import type {NotificationRecord} from '@/types';
import {DeviceEventEmitter, NativeModules} from 'react-native';

describe('notification service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({
      isLoggedIn: true,
      token: 'test-token',
      user: null,
      hasLocation: true,
      isLoading: false,
    });
    useNotificationStore.setState({notifications: []});
  });

  it('accepts only string camelCase FCM data payloads', () => {
    expect(
      isFcmStringDataPayload({
        type: 'share_created',
        postId: '10',
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
      }),
    ).toBe(true);

    expect(
      isFcmStringDataPayload({
        type: 'share_created',
        post_id: '10',
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
      }),
    ).toBe(false);

    expect(
      isFcmStringDataPayload({
        type: 'share_created',
        'post-id': '10',
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
      }),
    ).toBe(false);

    expect(
      isFcmStringDataPayload({
        type: 'share_created',
        postId: 10,
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
      } as never),
    ).toBe(false);
  });

  it('parses share_created and share_requested payload contracts', () => {
    expect(
      parseFoodLinkFcmPayload({
        type: 'share_created',
        postId: '10',
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
      }),
    ).toEqual({
      type: 'share_created',
      postId: '10',
      fruitName: '사과',
      fridgeName: '전남대 공유 냉장고',
    });

    expect(
      parseFoodLinkFcmPayload({
        type: 'share_requested',
        postId: '10',
        requestId: '3',
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
      }),
    ).toEqual({
      type: 'share_requested',
      postId: '10',
      requestId: '3',
      fruitName: '사과',
      fridgeName: '전남대 공유 냉장고',
    });
  });

  it('records foreground notifications without navigating immediately', async () => {
    await handleRemoteNotification(
      {
        messageId: 'message-1',
        data: {
          type: 'share_created',
          postId: '10',
          fruitName: '사과',
          fridgeName: '전남대 공유 냉장고',
        },
      } as never,
      'foreground',
    );

    expect(useNotificationStore.getState().notifications).toMatchObject([
      {
        id: 'message-1',
        type: 'share_created',
        postId: '10',
        fruitName: '사과',
        fridgeName: '전남대 공유 냉장고',
        source: 'foreground',
      },
    ]);
  });

  it('routes share_requested notifications to PostDetail as MVP fallback', () => {
    const notification: NotificationRecord = {
      id: 'message-2',
      type: 'share_requested',
      postId: '10',
      requestId: '3',
      fruitName: '사과',
      fridgeName: '전남대 공유 냉장고',
      title: '나눔 신청이 도착했어요',
      body: '사과 나눔에 신청이 들어왔어요.',
      receivedAt: '2026-05-06T00:00:00.000Z',
      source: 'opened',
    };

    expect(
      buildNotificationNavigationAction({
        type: 'share_requested',
        postId: notification.postId,
        requestId: notification.requestId!,
        fruitName: notification.fruitName,
        fridgeName: notification.fridgeName,
      }),
    ).toEqual({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 10}},
    });
  });

  it('defers opened notification navigation while auth restoration is active', () => {
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);
    const getCurrentRoute = jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Auth', key: 'Auth'} as never);

    openNotificationTarget({
      type: 'share_created',
      postId: '12',
      fruitName: 'banana',
      fridgeName: 'test fridge',
    });

    expect(dispatch).not.toHaveBeenCalled();

    getCurrentRoute.mockReturnValue({name: 'Main', key: 'Main'} as never);
    flushPendingNotificationNavigation();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 12}},
    });
  });

  it('defers opened notification navigation while nested auth splash is active', () => {
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);
    const getCurrentRoute = jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Splash', key: 'Splash'} as never);

    openNotificationTarget({
      type: 'share_created',
      postId: '17',
      fruitName: 'banana',
      fridgeName: 'test fridge',
    });

    expect(dispatch).not.toHaveBeenCalled();

    getCurrentRoute.mockReturnValue({name: 'Main', key: 'Main'} as never);
    flushPendingNotificationNavigation();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 17}},
    });
  });

  it('keeps pending navigation deferred when the container becomes ready on Auth', () => {
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    const isReady = jest
      .spyOn(rootNavigationRef, 'isReady')
      .mockReturnValue(false);
    const getCurrentRoute = jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Auth', key: 'Auth'} as never);

    openNotificationTarget({
      type: 'share_created',
      postId: '14',
      fruitName: 'banana',
      fridgeName: 'test fridge',
    });

    isReady.mockReturnValue(true);
    flushPendingNotificationNavigation();

    expect(dispatch).not.toHaveBeenCalled();

    getCurrentRoute.mockReturnValue({name: 'Main', key: 'Main'} as never);
    flushPendingNotificationNavigation();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 14}},
    });
  });

  it('keeps opened notification navigation deferred until login finishes', () => {
    useAuthStore.setState({isLoggedIn: false, token: null});
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);
    jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Main', key: 'Main'} as never);

    openNotificationTarget({
      type: 'share_created',
      postId: '18',
      fruitName: 'banana',
      fridgeName: 'test fridge',
    });
    flushPendingNotificationNavigation();

    expect(dispatch).not.toHaveBeenCalled();

    useAuthStore.setState({isLoggedIn: true, token: 'fresh-token'});
    flushPendingNotificationNavigation();

    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 18}},
    });
  });

  it('handles native initial notification payloads once by message id', async () => {
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);
    jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Main', key: 'Main'} as never);

    await handleInitialNotificationPayload({
      type: 'share_created',
      postId: '13',
      fruitName: 'banana',
      fridgeName: 'test fridge',
      messageId: 'native-message-13',
    });
    await handleInitialNotificationPayload({
      type: 'share_created',
      postId: '13',
      fruitName: 'banana',
      fridgeName: 'test fridge',
      messageId: 'native-message-13',
    });

    expect(useNotificationStore.getState().notifications).toMatchObject([
      {
        id: 'native-message-13',
        source: 'opened',
        postId: '13',
      },
    ]);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 13}},
    });
  });

  it('handles native notification open events from an existing Android task', async () => {
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);
    jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Main', key: 'Main'} as never);

    const remove = jest.fn();
    const listeners: Array<(payload: Record<string, string>) => void> = [];
    const addListener = jest
      .spyOn(DeviceEventEmitter, 'addListener')
      .mockImplementation((eventType, listener) => {
        expect(eventType).toBe('greennodeNotificationOpened');
        listeners.push(listener as (payload: Record<string, string>) => void);
        return {remove} as never;
      });

    const unregister = registerNativeNotificationOpenHandler();
    listeners[0]({
      type: 'share_created',
      postId: '15',
      fruitName: 'banana',
      fridgeName: 'test fridge',
      messageId: 'native-open-message-15',
    });
    await Promise.resolve();

    expect(useNotificationStore.getState().notifications).toMatchObject([
      {
        id: 'native-open-message-15',
        source: 'opened',
        postId: '15',
      },
    ]);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 15}},
    });

    unregister();

    expect(remove).toHaveBeenCalledTimes(1);
    addListener.mockRestore();
  });

  it('consumes pending native notification payloads after cold start', async () => {
    const dispatch = jest
      .spyOn(rootNavigationRef, 'dispatch')
      .mockImplementation(jest.fn());
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);
    jest
      .spyOn(rootNavigationRef, 'getCurrentRoute')
      .mockReturnValue({name: 'Main', key: 'Main'} as never);

    const originalModule = NativeModules.GreennodeNotification;
    NativeModules.GreennodeNotification = {
      consumeInitialNotificationPayload: jest.fn().mockResolvedValue({
        type: 'share_created',
        postId: '16',
        fruitName: 'banana',
        fridgeName: 'test fridge',
        messageId: 'native-pending-message-16',
      }),
    };

    await consumePendingNativeNotificationPayload();

    expect(useNotificationStore.getState().notifications).toMatchObject([
      {
        id: 'native-pending-message-16',
        source: 'opened',
        postId: '16',
      },
    ]);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId: 16}},
    });

    NativeModules.GreennodeNotification = originalModule;
  });
});
