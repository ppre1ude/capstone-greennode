import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {rootNavigationRef} from '@/navigation/rootNavigation';
import {getMessagingOrNull} from '@/services/firebaseMessaging';
import {useNotificationStore} from '@/store/notificationStore';
import type {
  FcmStringDataPayload,
  FoodLinkFcmPayload,
  NotificationRecord,
  NotificationSource,
} from '@/types';

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

let foregroundUnsubscribe: (() => void) | null = null;
let openedUnsubscribe: (() => void) | null = null;
let backgroundHandlerRegistered = false;
let pendingNavigationPayload: FoodLinkFcmPayload | null = null;

const KNOWN_TYPES = new Set(['share_created', 'share_requested']);
const CAMEL_CASE_KEY_PATTERN = /^[a-z][A-Za-z0-9]*$/;

const isCamelCaseKey = (key: string) => CAMEL_CASE_KEY_PATTERN.test(key);

export const isFcmStringDataPayload = (
  data: RemoteMessage['data'],
): data is FcmStringDataPayload => {
  if (!data) {
    return false;
  }

  return Object.entries(data).every(
    ([key, value]) => isCamelCaseKey(key) && typeof value === 'string',
  );
};

export const parseFoodLinkFcmPayload = (
  data: RemoteMessage['data'],
): FoodLinkFcmPayload | null => {
  if (!isFcmStringDataPayload(data) || !KNOWN_TYPES.has(data.type)) {
    return null;
  }

  if (
    data.type === 'share_created' &&
    data.postId &&
    data.fruitName &&
    data.fridgeName
  ) {
    return {
      type: 'share_created',
      postId: data.postId,
      fruitName: data.fruitName,
      fridgeName: data.fridgeName,
    };
  }

  if (
    data.type === 'share_requested' &&
    data.postId &&
    data.requestId &&
    data.fruitName &&
    data.fridgeName
  ) {
    return {
      type: 'share_requested',
      postId: data.postId,
      requestId: data.requestId,
      fruitName: data.fruitName,
      fridgeName: data.fridgeName,
    };
  }

  return null;
};

export const createNotificationRecord = (
  payload: FoodLinkFcmPayload,
  source: NotificationSource,
  messageId?: string,
): NotificationRecord => {
  const isShareRequest = payload.type === 'share_requested';
  const title = isShareRequest
    ? '나눔 신청이 도착했어요'
    : '근처에 나눔이 등록됐어요';
  const body = isShareRequest
    ? `${payload.fruitName} 나눔에 신청이 들어왔어요.`
    : `${payload.fridgeName}에 ${payload.fruitName} 나눔이 등록됐어요.`;

  return {
    id:
      messageId ||
      `${payload.type}:${payload.postId}:${
        'requestId' in payload ? payload.requestId : ''
      }:${Date.now()}`,
    type: payload.type,
    postId: payload.postId,
    requestId: 'requestId' in payload ? payload.requestId : undefined,
    fruitName: payload.fruitName,
    fridgeName: payload.fridgeName,
    title,
    body,
    receivedAt: new Date().toISOString(),
    source,
  };
};

export const buildNotificationNavigationAction = (
  payload: FoodLinkFcmPayload,
) => {
  const postId = Number(payload.postId);
  if (Number.isFinite(postId) && postId > 0) {
    return {
      type: 'NAVIGATE',
      payload: {name: 'PostDetail', params: {postId}},
    };
  }

  return {
    type: 'NAVIGATE',
    payload: {name: 'Main', params: {screen: 'Home'}},
  };
};

const navigateToPayloadTarget = (payload: FoodLinkFcmPayload) => {
  rootNavigationRef.dispatch(buildNotificationNavigationAction(payload));
};

export const openNotificationTarget = (
  notification: FoodLinkFcmPayload | NotificationRecord,
) => {
  const payload: FoodLinkFcmPayload =
    notification.type === 'share_requested'
      ? {
          type: 'share_requested',
          postId: notification.postId,
          requestId: notification.requestId || '',
          fruitName: notification.fruitName,
          fridgeName: notification.fridgeName,
        }
      : {
          type: 'share_created',
          postId: notification.postId,
          fruitName: notification.fruitName,
          fridgeName: notification.fridgeName,
        };

  if (!rootNavigationRef.isReady()) {
    pendingNavigationPayload = payload;
    return;
  }

  navigateToPayloadTarget(payload);
};

export const flushPendingNotificationNavigation = () => {
  if (!pendingNavigationPayload || !rootNavigationRef.isReady()) {
    return;
  }

  const payload = pendingNavigationPayload;
  pendingNavigationPayload = null;
  navigateToPayloadTarget(payload);
};

export const handleRemoteNotification = async (
  message: RemoteMessage,
  source: NotificationSource,
  openTarget: boolean = false,
): Promise<NotificationRecord | null> => {
  const payload = parseFoodLinkFcmPayload(message.data);
  if (!payload) {
    return null;
  }

  const record = createNotificationRecord(payload, source, message.messageId);
  useNotificationStore.getState().addNotification(record);

  if (openTarget) {
    openNotificationTarget(payload);
  }

  return record;
};

export const registerBackgroundNotificationHandler = () => {
  if (backgroundHandlerRegistered) {
    return;
  }

  const messagingInstance = getMessagingOrNull();
  if (!messagingInstance) {
    return;
  }

  backgroundHandlerRegistered = true;
  messagingInstance.setBackgroundMessageHandler(async message => {
    await handleRemoteNotification(message, 'background');
  });
};

export const registerForegroundNotificationHandlers = () => {
  if (foregroundUnsubscribe || openedUnsubscribe) {
    return () => undefined;
  }

  const messagingInstance = getMessagingOrNull();
  if (!messagingInstance) {
    return () => undefined;
  }

  foregroundUnsubscribe = messagingInstance.onMessage(message =>
    handleRemoteNotification(message, 'foreground'),
  );

  openedUnsubscribe = messagingInstance.onNotificationOpenedApp(message =>
    handleRemoteNotification(message, 'opened', true),
  );

  messagingInstance
    .getInitialNotification()
    .then(message => {
      if (message) {
        void handleRemoteNotification(message, 'opened', true);
      }
    })
    .catch(error => {
      console.warn('Initial notification handling failed:', error);
    });

  return () => {
    foregroundUnsubscribe?.();
    openedUnsubscribe?.();
    foregroundUnsubscribe = null;
    openedUnsubscribe = null;
  };
};
