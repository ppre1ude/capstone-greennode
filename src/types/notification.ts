export type NotificationSource =
  | 'foreground'
  | 'background'
  | 'opened'
  | 'server';

export type FoodLinkNotificationType = 'share_created' | 'share_requested';

export type FcmStringDataPayload = Record<string, string>;

export interface ShareCreatedFcmPayload extends FcmStringDataPayload {
  type: 'share_created';
  postId: string;
  fruitName: string;
  fridgeName: string;
}

export interface ShareRequestedFcmPayload extends FcmStringDataPayload {
  type: 'share_requested';
  postId: string;
  requestId: string;
  fruitName: string;
  fridgeName: string;
}

export type FoodLinkFcmPayload =
  | ShareCreatedFcmPayload
  | ShareRequestedFcmPayload;

export interface NotificationRecord {
  id: string;
  type: FoodLinkNotificationType;
  postId: string;
  requestId?: string;
  fruitName: string;
  fridgeName: string;
  title: string;
  body: string;
  receivedAt: string;
  readAt?: string | null;
  source: NotificationSource;
}

export type ServerNotificationRecord = Omit<
  Partial<NotificationRecord>,
  'postId' | 'requestId' | 'source'
> & {
  id: string;
  type: FoodLinkNotificationType;
  postId?: string | number | null;
  requestId?: string | number | null;
  receivedAt?: string | null;
  createdAt?: string | null;
};
