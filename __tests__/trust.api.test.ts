import apiClient from '@/api/client';
import {
  createShareReport,
  createShareReview,
  getUserTrustSummary,
} from '@/api/trust';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('trust feedback API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a completed share request review through the backend endpoint', async () => {
    mockedApiClient.post.mockResolvedValue({
      data: {
        success: true,
        message: '수령 경험 평가가 저장되었습니다.',
        data: {
          id: 1,
          requestId: 55,
          postId: 41,
          providerId: 4,
          requesterId: 3,
          positiveTagIds: ['good_condition', 'matched_photo'],
          issueTagIds: ['label_hard_to_find'],
          createdAt: '2026-06-04T12:00:00.000Z',
          updatedAt: '2026-06-04T12:00:00.000Z',
        },
      },
    });

    const response = await createShareReview(55, {
      positiveTagIds: ['good_condition', 'matched_photo'],
      issueTagIds: ['label_hard_to_find'],
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/v1/share-requests/55/review',
      {
        positiveTagIds: ['good_condition', 'matched_photo'],
        issueTagIds: ['label_hard_to_find'],
      },
    );
    expect(response.data?.requestId).toBe(55);
    expect(response.data?.positiveTagIds).toEqual([
      'good_condition',
      'matched_photo',
    ]);
  });

  it('creates an operator review report without mixing it into review tags', async () => {
    mockedApiClient.post.mockResolvedValue({
      data: {
        success: true,
        message: '신고가 접수되었습니다.',
        data: {
          id: 2,
          requestId: 55,
          postId: 41,
          providerId: 4,
          requesterId: 3,
          reasonId: 'missing_or_not_found',
          status: 'open',
          resolution: 'pending',
          action: 'none',
          createdAt: '2026-06-04T12:05:00.000Z',
          updatedAt: '2026-06-04T12:05:00.000Z',
        },
      },
    });

    const response = await createShareReport(55, {
      reasonId: 'missing_or_not_found',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/api/v1/share-requests/55/report',
      {
        reasonId: 'missing_or_not_found',
      },
    );
    expect(response.data).toMatchObject({
      requestId: 55,
      reasonId: 'missing_or_not_found',
      status: 'open',
      resolution: 'pending',
      action: 'none',
    });
  });

  it('fetches backend-computed provider trust summary', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        success: true,
        message: '공급자 신뢰 요약 조회 성공',
        data: {
          userId: 4,
          completedShares: 12,
          positiveReviewCount: 9,
          matchedPhotoCount: 8,
          easyToFindCount: 7,
          badges: [
            'store_qr_verified',
            'completed_pickup',
            'positive_reviews',
          ],
          computedAt: '2026-06-04T12:10:00.000Z',
        },
      },
    });

    const response = await getUserTrustSummary(4);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/api/v1/users/4/trust-summary',
    );
    expect(response.data?.badges).toContain('store_qr_verified');
    expect(response.data?.positiveReviewCount).toBe(9);
  });
});
