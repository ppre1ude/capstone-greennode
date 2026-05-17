import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import PostCompleteScreen from '@/screens/post/PostCompleteScreen';

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(flattenText).join('');
  }

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
};

describe('PostCompleteScreen notification copy', () => {
  it('does not claim push delivery before FCM receipt QA is complete', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PostCompleteScreen
          navigation={{reset: jest.fn()} as any}
          route={{params: {postId: 10}} as any}
        />,
      );
    });

    const textContent = renderer!.root
      .findAllByType(Text)
      .map(node => flattenText(node.props.children));

    expect(textContent).toContain(
      '선택하신 냉장고 주변 이웃들에게\n나눔 알림을 보낼 준비를 했어요.',
    );
    expect(textContent).not.toContain(
      '선택하신 냉장고 주변 이웃들에게\n나눔 알림(푸시)이 전송되었습니다.',
    );
    expect(textContent).toContain('등록 직후');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
