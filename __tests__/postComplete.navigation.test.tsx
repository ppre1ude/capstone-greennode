import React from 'react';
import {TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {DSIcon, DSScreenFooter} from '@/design-system';
import PostCompleteScreen from '@/screens/post/PostCompleteScreen';
import {renderWithSafeArea} from '../test-utils/renderWithSafeArea';

describe('PostCompleteScreen navigation', () => {
  it('returns home with a nearby post refresh token', async () => {
    const reset = jest.fn();
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(2026050601);
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        renderWithSafeArea(
          <PostCompleteScreen
            navigation={{reset} as any}
            route={{params: {postId: 42}} as any}
          />,
        ),
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

  it('uses the shared footer spacing without presentation-only padding', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        renderWithSafeArea(
          <PostCompleteScreen
            navigation={{reset: jest.fn()} as any}
            route={{params: {postId: 42}} as any}
          />,
        ),
      );
    });

    const footer = renderer!.root.findByType(DSScreenFooter);

    expect(footer.props.bottomInsetGap).toBeUndefined();
    expect(footer.props.minBottomPadding).toBeUndefined();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('uses a celebration mark instead of a generic completion icon', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        renderWithSafeArea(
          <PostCompleteScreen
            navigation={{reset: jest.fn()} as any}
            route={{params: {postId: 42}} as any}
          />,
        ),
      );
    });

    const iconNames = renderer!.root
      .findAllByType(DSIcon)
      .map(node => node.props.name);

    expect(iconNames).toContain('gifts');
    expect(iconNames).not.toContain('seedling');
    expect(iconNames).not.toContain('circle-check');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
