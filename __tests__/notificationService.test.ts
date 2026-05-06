import {
  buildNotificationNavigationAction,
  handleRemoteNotification,
  isFcmStringDataPayload,
  parseFoodLinkFcmPayload,
} from '@/services/notifications';
import {useNotificationStore} from '@/store/notificationStore';
import type {NotificationRecord} from '@/types';

describe('notification service', () => {
  beforeEach(() => {
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
});
