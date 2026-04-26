/**
 * ChatListScreen — 채팅 탭 (Phase 6)
 *
 * 나눔 관련 메시지나 푸시 알림 내역을 보여주는 더미 리스트.
 * MVP에서는 단순 UI만 제공.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import {colors} from '@/theme';

interface ChatRoom {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isAlert: boolean;
}

const MOCK_CHATS: ChatRoom[] = [
  {
    id: '1',
    title: 'FoodLink 알림',
    lastMessage: '근처 공유 냉장고에 사과 나눔이 등록되었습니다.',
    time: '방금 전',
    unreadCount: 1,
    isAlert: true,
  },
  {
    id: '2',
    title: '동네 이웃',
    lastMessage: '네, 제가 냉장고에 잘 넣어두었습니다! 맛있게 드세요.',
    time: '어제',
    unreadCount: 0,
    isAlert: false,
  },
];

const ChatListScreen = () => {
  const renderItem = ({item}: {item: ChatRoom}) => (
    <TouchableOpacity style={styles.chatRow}>
      <View style={[styles.avatar, item.isAlert && styles.avatarAlert]}>
        <Text style={styles.avatarIcon}>{item.isAlert ? '🔔' : '👤'}</Text>
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>{item.title}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatMessageRow}>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅 및 알림</Text>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>아직 채팅 내역이 없습니다.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listContainer: {
    paddingBottom: 100,
  },
  chatRow: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarAlert: {
    backgroundColor: colors.primaryLight,
  },
  avatarIcon: {
    fontSize: 24,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 16,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: colors.surface,
    marginLeft: 88, // 아바타 넓이(52) + 여백(16) + 패딩(20)
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textTertiary,
  },
});

export default ChatListScreen;
