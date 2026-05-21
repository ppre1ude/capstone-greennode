import { selectHomeRecommendations } from '@/utils/homeRecommendations';
import type { PostNearbyRead } from '@/types';

const makePost = (
  overrides: Partial<PostNearbyRead> & Pick<PostNearbyRead, 'id'>,
): PostNearbyRead => {
  const { id, ...rest } = overrides;

  return {
    id,
    fridgeId: 1,
    fridgeName: '테스트 공유 냉장고',
    detectedFruit: 'apple',
    detectedFruitKo: '사과',
    freshnessLabel: 'Fresh',
    imageUrl: `/static/posts/${id}.jpg`,
    expirationDate: '2026-05-22',
    status: 'available',
    createdAt: '2026-05-20T00:00:00Z',
    ...rest,
  };
};

describe('selectHomeRecommendations', () => {
  it('keeps only available posts with valid today-or-future expiration dates', () => {
    const recommendations = selectHomeRecommendations(
      [
        makePost({ id: 1, expirationDate: '2026-05-21' }),
        makePost({ id: 2, expirationDate: '2026-05-20' }),
        makePost({ id: 3, expirationDate: 'not-a-date' }),
        makePost({ id: 4, status: 'requested', expirationDate: '2026-05-21' }),
      ],
      '2026-05-21',
    );

    expect(recommendations.map(post => post.id)).toEqual([1]);
  });

  it('sorts by nearest expiration, newest creation time, then lower id and limits to three', () => {
    const recommendations = selectHomeRecommendations(
      [
        makePost({
          id: 5,
          expirationDate: '2026-05-24',
          createdAt: '2026-05-21T01:00:00Z',
        }),
        makePost({
          id: 2,
          expirationDate: '2026-05-22',
          createdAt: '2026-05-20T01:00:00Z',
        }),
        makePost({
          id: 3,
          expirationDate: '2026-05-22',
          createdAt: '2026-05-21T01:00:00Z',
        }),
        makePost({
          id: 1,
          expirationDate: '2026-05-21',
          createdAt: '2026-05-20T01:00:00Z',
        }),
        makePost({
          id: 4,
          expirationDate: '2026-05-22',
          createdAt: '2026-05-21T01:00:00Z',
        }),
      ],
      '2026-05-21',
    );

    expect(recommendations.map(post => post.id)).toEqual([1, 3, 4]);
  });

  it('returns an empty list when no post has a valid today-or-future expiration date', () => {
    const recommendations = selectHomeRecommendations(
      [
        makePost({ id: 1, expirationDate: '2026-05-20' }),
        makePost({ id: 2, expirationDate: '' }),
      ],
      '2026-05-21',
    );

    expect(recommendations).toEqual([]);
  });
});
