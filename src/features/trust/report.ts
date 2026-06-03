export type ShareReportReasonId =
  | 'different_from_photo'
  | 'condition_needs_check'
  | 'label_or_zone_mismatch'
  | 'missing_or_not_found'
  | 'inappropriate_listing';

export type ShareReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type ShareReportReasonOption = {
  id: ShareReportReasonId;
  label: string;
};

export const SHARE_REPORT_REASON_OPTIONS: ShareReportReasonOption[] = [
  {id: 'different_from_photo', label: '등록 사진과 실제 식재료가 달라요'},
  {id: 'condition_needs_check', label: '수령한 식재료 상태 확인이 필요해요'},
  {id: 'label_or_zone_mismatch', label: '라벨/보관 위치가 맞지 않았어요'},
  {id: 'missing_or_not_found', label: '이미 없거나 찾을 수 없었어요'},
  {id: 'inappropriate_listing', label: '부적절한 등록이에요'},
];

export const isOpenShareReportStatus = (status: ShareReportStatus): boolean =>
  status === 'open' || status === 'reviewing';
