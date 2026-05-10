/**
 * 홈 주변 나눔 식재료 목록 갱신 신호.
 */
import { create } from 'zustand';

type FeedRefreshState = {
  nearbyPostsRefreshToken: number;
  requestedPostId: number | null;
  requestNearbyPostsRefresh: (requestedPostId?: number) => void;
};

export const useFeedRefreshStore = create<FeedRefreshState>(set => ({
  nearbyPostsRefreshToken: 0,
  requestedPostId: null,
  requestNearbyPostsRefresh: requestedPostId => {
    set({
      nearbyPostsRefreshToken: Date.now(),
      requestedPostId: requestedPostId ?? null,
    });
  },
}));
