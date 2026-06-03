import { create } from 'zustand';
import type {
  ShareFeedbackIssueTagId,
  ShareFeedbackPositiveTagId,
  ShareReportReasonId,
  ShareReportStatus,
} from '@/features/trust/feedback';

export type ShareReviewRecord = {
  requestId: number;
  postId: number;
  providerId: number;
  positiveTagIds: ShareFeedbackPositiveTagId[];
  issueTagIds: ShareFeedbackIssueTagId[];
  createdAt: string;
};

export type ShareReportRecord = {
  requestId: number;
  postId: number;
  providerId: number;
  reasonId: ShareReportReasonId;
  status: ShareReportStatus;
  createdAt: string;
};

type SubmitReviewInput = Omit<ShareReviewRecord, 'createdAt'>;
type SubmitReportInput = Omit<ShareReportRecord, 'createdAt' | 'status'>;

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
          createdAt: new Date().toISOString(),
        },
      },
    }));
  },
  resetTrustFeedback: () => set({ reviews: {}, reports: {} }),
}));
