import { create } from 'zustand';
import type {
  ShareReportAction,
  ShareReportReasonId,
  ShareReportResolution,
  ShareReportStatus,
} from '@/features/trust/report';
import type {
  ShareReviewIssueTagId,
  ShareReviewPositiveTagId,
} from '@/features/trust/review';

export type ShareReviewRecord = {
  requestId: number;
  postId: number;
  providerId: number;
  positiveTagIds: ShareReviewPositiveTagId[];
  issueTagIds: ShareReviewIssueTagId[];
  createdAt: string;
};

export type ShareReportRecord = {
  requestId: number;
  postId: number;
  providerId: number;
  reasonId: ShareReportReasonId;
  status: ShareReportStatus;
  resolution: ShareReportResolution;
  action: ShareReportAction;
  createdAt: string;
};

type SubmitReviewInput = Omit<ShareReviewRecord, 'createdAt'>;
type SubmitReportInput = Omit<
  ShareReportRecord,
  'action' | 'createdAt' | 'resolution' | 'status'
>;

type TrustFeedbackState = {
  reviews: Record<number, ShareReviewRecord>;
  reports: Record<number, ShareReportRecord>;
  submitReview: (review: SubmitReviewInput) => void;
  submitReport: (report: SubmitReportInput) => void;
  resetTrustFeedback: () => void;
};

export const useTrustFeedbackStore = create<TrustFeedbackState>(set => ({
  reviews: {},
  reports: {},
  submitReview: review => {
    set(state => ({
      reviews: {
        ...state.reviews,
        [review.requestId]: {
          ...review,
          createdAt: new Date().toISOString(),
        },
      },
    }));
  },
  submitReport: report => {
    set(state => ({
      reports: {
        ...state.reports,
        [report.requestId]: {
          ...report,
          status: 'open',
          resolution: 'pending',
          action: 'none',
          createdAt: new Date().toISOString(),
        },
      },
    }));
  },
  resetTrustFeedback: () => set({ reviews: {}, reports: {} }),
}));
