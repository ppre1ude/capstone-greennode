import type { PostNearbyRead } from '@/types';

const RECOMMENDATION_LIMIT = 3;

const toDateKey = (value: string | Date): string | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

const toTime = (value: string): number => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const selectHomeRecommendations = (
  posts: PostNearbyRead[],
  today: string | Date = new Date(),
): PostNearbyRead[] => {
  const todayKey = toDateKey(today);
  if (!todayKey) {
    return [];
  }

  return posts
    .filter(post => {
      const expirationKey = toDateKey(post.expirationDate);
      return (
        post.status === 'available' &&
        expirationKey !== null &&
        expirationKey >= todayKey
      );
    })
    .sort((left, right) => {
      const leftExpiration = toDateKey(left.expirationDate) ?? '';
      const rightExpiration = toDateKey(right.expirationDate) ?? '';

      if (leftExpiration !== rightExpiration) {
        return leftExpiration.localeCompare(rightExpiration);
      }

      const createdDiff = toTime(right.createdAt) - toTime(left.createdAt);
      if (createdDiff !== 0) {
        return createdDiff;
      }

      return left.id - right.id;
    })
    .slice(0, RECOMMENDATION_LIMIT);
};
