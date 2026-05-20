import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ChatListScreen from '@/screens/chat/ChatListScreen';
import {openNotificationTarget} from '@/services/notifications';
import {useNotificationStore} from '@/store/notificationStore';

jest.mock('@/services/notifications', () => ({
  openNotificationTarget: jest.fn(),
}));

const mockedOpenNotificationTarget =
  openNotificationTarget as jest.MockedFunction<typeof openNotificationTarget>;

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
  });
});
