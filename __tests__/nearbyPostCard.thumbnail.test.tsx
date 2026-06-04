import React from 'react';
import {Image} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import NearbyPostCard from '@/components/home/NearbyPostCard';
import type {PostNearbyRead} from '@/types';

jest.mock('@/api/posts', () => ({
  getImageUrl: (relativeUrl: string) => `http://mock.local${relativeUrl}`,
}));

const post: PostNearbyRead = {
  id: 1,
  detectedFruit: 'apple',
  detectedFruitKo: '사과',
  freshnessLabel: 'Fresh',
  imageUrl: '/static/mock/apple.jpg',
  expirationDate: '2026-06-30',
  status: 'available',
  fridgeId: 1,
  fridgeName: '용봉동 공유 냉장고',
  createdAt: '2026-06-05T12:00:00Z',
};

describe('NearbyPostCard thumbnail', () => {
  it('renders the nearby post image URL as a thumbnail', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NearbyPostCard post={post} onPress={jest.fn()} />,
      );
    });

    expect(renderer!.root.findByType(Image).props.source).toEqual({
      uri: 'http://mock.local/static/mock/apple.jpg',
    });

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps a visible thumbnail slot when the remote image fails', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NearbyPostCard post={post} onPress={jest.fn()} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.root.findByType(Image).props.onError();
    });

    expect(
      renderer!.root.findByProps({
        testID: 'nearby-post-thumbnail-fallback',
      }),
    ).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
