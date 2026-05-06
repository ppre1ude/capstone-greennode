import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import PostCompleteScreen from '@/screens/post/PostCompleteScreen';

describe('PostCompleteScreen navigation', () => {
  it('returns home with a nearby post refresh token', async () => {
    const reset = jest.fn();
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(2026050601);
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <PostCompleteScreen
          navigation={{reset} as any}
          route={{params: {postId: 42}} as any}
        />,
      );
    });

    const homeButton = renderer?.root.findByType(TouchableOpacity);

    await ReactTestRenderer.act(async () => {
      homeButton?.props.onPress();
    });

    expect(reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: 'Main',
          params: {
            screen: 'Home',
            params: {
              completedPostId: 42,
              nearbyPostsRefreshToken: 2026050601,
            },
          },
        },
      ],
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
    dateNow.mockRestore();
  });
});
