import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import {
  DeviceEventEmitter,
  NativeModules,
  type EmitterSubscription,
} from 'react-native';
import { rootNavigationRef } from '@/navigation/rootNavigation';
import { getMessagingOrNull } from '@/services/firebaseMessaging';
import { useAuthStore } from '@/store/authStore';
import {
  rehydrateNotificationStore,
  useNotificationStore,
} from '@/store/notificationStore';
import {
  buildNotificationNavigationAction,
  createNotificationRecord,
  parseFoodLinkFcmPayload,
  toFoodLinkFcmPayload,
} from '@/utils/notificationPolicy';
import type {
  FcmStringDataPayload,
  FoodLinkFcmPayload,
  NotificationRecord,
  NotificationSource,
} from '@/types';
export {
  buildNotificationNavigationAction,
  createNotificationRecord,
  isFcmStringDataPayload,
  parseFoodLinkFcmPayload,
} from '@/utils/notificationPolicy';

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;
interface GreennodeNotificationNativeModule {
  consumeInitialNotificationPayload?: () => Promise<FcmStringDataPayload | null>;
}

let foregroundUnsubscribe: (() => void) | null = null;
let openedUnsubscribe: (() => void) | null = null;
let nativeOpenSubscription: EmitterSubscription | null = null;
let backgroundHandlerRegistered = false;
let pendingNavigationPayload: FoodLinkFcmPayload | null = null;
const MAX_HANDLED_OPENED_MESSAGE_IDS = 200;
const handledOpenedMessageIds = new Set<string>();

const NOTIFICATION_NAVIGATION_DEFER_ROUTES = new Set([
  'Auth',
  'Splash',
  'Onboarding',
  'Login',
  'Signup',
  'LocationSetup',
]);

const navigateToPayloadTarget = (payload: FoodLinkFcmPayload) => {
  rootNavigationRef.dispatch(buildNotificationNavigationAction(payload));
};

const shouldDeferNotificationNavigation = () => {
  if (!useAuthStore.getState().isLoggedIn) {
    return true;
  }

  if (!rootNavigationRef.isReady()) {
    return true;
  }

  const currentRoute = rootNavigationRef.getCurrentRoute();
  return NOTIFICATION_NAVIGATION_DEFER_ROUTES.has(currentRoute?.name ?? '');
};

export const openNotificationTarget = (
  notification: FoodLinkFcmPayload | NotificationRecord,
) => {
  const payload = toFoodLinkFcmPayload(notification);

  if (shouldDeferNotificationNavigation()) {
    pendingNavigationPayload = payload;
    return;
  }

  navigateToPayloadTarget(payload);
};

export const flushPendingNotificationNavigation = () => {
  if (!pendingNavigationPayload || shouldDeferNotificationNavigation()) {
    return;
  }

  const payload = pendingNavigationPayload;
  pendingNavigationPayload = null;
  navigateToPayloadTarget(payload);
};

const getRemoteMessageId = (message: RemoteMessage) => {
  const dataMessageId = message.data?.messageId;
  return (
    message.messageId ||
    (typeof dataMessageId === 'string' ? dataMessageId : undefined)
  );
};

const rememberHandledOpenedMessageId = (messageId: string) => {
  if (handledOpenedMessageIds.has(messageId)) {
    return;
  }

  if (handledOpenedMessageIds.size >= MAX_HANDLED_OPENED_MESSAGE_IDS) {
    const oldestMessageId = handledOpenedMessageIds.values().next().value;
    if (oldestMessageId) {
      handledOpenedMessageIds.delete(oldestMessageId);
    }
  }

  handledOpenedMessageIds.add(messageId);
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

  const messageId = getRemoteMessageId(message);
  if (
    source === 'opened' &&
    messageId &&
    handledOpenedMessageIds.has(messageId)
  ) {
    return null;
  }

  const record = createNotificationRecord(payload, source, messageId);
  if (source === 'background') {
    await rehydrateNotificationStore();
  }

  useNotificationStore.getState().addNotification(record);
  if (source === 'opened' && messageId) {
    rememberHandledOpenedMessageId(messageId);
  }

  if (openTarget) {
    openNotificationTarget(payload);
  }

  return record;
};

export const handleInitialNotificationPayload = async (
  payload: FcmStringDataPayload | null | undefined,
) => {
  if (!payload) {
    return null;
  }

  const { messageId, ...data } = payload;
  return handleRemoteNotification(
    { messageId, data } as unknown as RemoteMessage,
    'opened',
    true,
  );
};

export const consumePendingNativeNotificationPayload = async () => {
  const module = NativeModules.GreennodeNotification as
    | GreennodeNotificationNativeModule
    | undefined;

  const payload = await module?.consumeInitialNotificationPayload?.();
  return handleInitialNotificationPayload(payload);
};

export const registerNativeNotificationOpenHandler = () => {
  if (nativeOpenSubscription) {
    return () => undefined;
  }

  nativeOpenSubscription = DeviceEventEmitter.addListener(
    'greennodeNotificationOpened',
    (payload: FcmStringDataPayload) => {
      handleInitialNotificationPayload(payload).catch(error => {
        console.warn('Native notification open handling failed:', error);
      });
    },
  );

  return () => {
    nativeOpenSubscription?.remove();
    nativeOpenSubscription = null;
  };
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
        return handleRemoteNotification(message, 'opened', true);
      }

      return null;
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
