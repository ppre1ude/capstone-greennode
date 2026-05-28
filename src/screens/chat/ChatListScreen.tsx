/**
 * ChatListScreen — 알림 탭 (Phase 6)
 *
 * 실시간 채팅은 MVP 범위에서 보류하고, 나눔 이벤트 알림함으로 축소한다.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/theme';
import { DSIcon } from '@/design-system';
import { useNotificationStore } from '@/store/notificationStore';
import { openNotificationTarget } from '@/services/notifications';
import type { NotificationRecord } from '@/types';
import { getHeaderTopPadding } from '@/utils/safeArea';

const formatNotificationTime = (receivedAt: string) => {
  const date = new Date(receivedAt);
  if (Number.isNaN(date.getTime())) {
    return '수신 시간 확인 필요';
  }

  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSourceLabel = (source: NotificationRecord['source']) => {
  switch (source) {
    case 'foreground':
      return '앱 사용 중 수신';
    case 'background':
      return '백그라운드 수신';
    case 'opened':
      return '알림 열기';
    case 'server':
      return '계정 동기화';
    default:
      return '수신 기록';
  }
};

const ChatListScreen = () => {
  const notifications = useNotificationStore(state => state.notifications);
  const clearNotifications = useNotificationStore(
    state => state.clearNotifications,
  );
  const markNotificationRead = useNotificationStore(
    state => state.markNotificationRead,
  );
  const markAllNotificationsRead = useNotificationStore(
    state => state.markAllNotificationsRead,
  );
  const unreadCount = notifications.filter(
    notification => !notification.readAt,
  ).length;

  const handleOpenNotification = (item: NotificationRecord) => {
    markNotificationRead(item.id);
    openNotificationTarget(item);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleClearNotifications = () => {
    clearNotifications();
  };

  const renderNotification = ({ item }: { item: NotificationRecord }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      activeOpacity={0.82}
      onPress={() => handleOpenNotification(item)}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.notificationTime}>
          {formatNotificationTime(item.receivedAt)}
        </Text>
      </View>
      <Text style={styles.notificationBody} numberOfLines={2}>
        {item.body}
      </Text>
      <View style={styles.notificationMetaRow}>
        <Text style={styles.notificationMeta}>
          {item.readAt ? '읽음' : '새 알림'}
        </Text>
        <Text style={styles.notificationMeta}>
          {getSourceLabel(item.source)}
        </Text>
        <Text style={styles.notificationMeta}>
          {item.fridgeName || '공유 냉장고'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>알림</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `새 알림 ${unreadCount}개가 있습니다`
              : '나눔 등록과 신청 수신 기록을 확인합니다'}
          </Text>
        </View>
        {notifications.length > 0 ? (
          <View style={styles.headerActions}>
            {unreadCount > 0 ? (
              <TouchableOpacity
                style={styles.markAllReadButton}
                onPress={handleMarkAllRead}>
                <Text style={styles.markAllReadButtonText}>모두 읽음</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearNotifications}>
              <Text style={styles.clearButtonText}>비우기</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {notifications.length > 0 ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {notifications.map(notification => (
            <View key={notification.id}>
              {renderNotification({ item: notification })}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <DSIcon
            name="bell"
            size={48}
            color="accent"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>아직 알림이 없습니다</Text>
          <Text style={styles.emptyText}>
            근처 나눔 등록과 나눔 신청 알림이 이곳에 기록됩니다.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: getHeaderTopPadding(),
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textTertiary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  markAllReadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  notificationBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  notificationMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  notificationMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textTertiary,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default ChatListScreen;
