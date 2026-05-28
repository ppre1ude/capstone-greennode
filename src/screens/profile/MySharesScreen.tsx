import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DSButton, DSCard, DSChip, DSIcon, DSText } from '@/design-system';
import type { RootStackParamList } from '@/navigation/types';
import {
  cancelPost,
  cancelShareRequest,
  completePost,
} from '@/api/posts';
import { getMyPosts, getMyShareRequests } from '@/api/users';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import type { Post, UserShareRequestItem } from '@/types';
import {
  canCancelPost,
  canCompletePost,
  getPostDisplayName,
  getPostLifecycleDeadlineLabel,
  getPostStatusLabel,
  getShareRequestStatusLabel,
  isPostAwaitingStoreQr,
  isPostInLifecycleSummary,
  isShareRequestAwaitingPickup,
  MY_POST_LIFECYCLE_STATUSES,
  MY_SHARE_REQUEST_LIFECYCLE_STATUSES,
} from '@/utils/postPolicy';
import { getApiErrorMessage } from '@/utils/apiError';
import { getHeaderTopPadding } from '@/utils/safeArea';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MyShares'>;
type TabKey = 'posted' | 'received';

const MySharesScreen = ({ route, navigation }: Props) => {
  const initialTab = route.params?.initialTab ?? 'posted';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [postedItems, setPostedItems] = useState<Post[]>([]);
  const [receivedItems, setReceivedItems] = useState<UserShareRequestItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const requestNearbyPostsRefresh = useFeedRefreshStore(
    state => state.requestNearbyPostsRefresh,
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadLifecycle = useCallback(async () => {
    setErrorMessage(null);
    try {
      const [postsResponse, requestsResponse] = await Promise.all([
        getMyPosts([...MY_POST_LIFECYCLE_STATUSES], 0, 50),
        getMyShareRequests([...MY_SHARE_REQUEST_LIFECYCLE_STATUSES], 0, 50),
      ]);

      setPostedItems(postsResponse.data ?? []);
      setReceivedItems(requestsResponse.data ?? []);

      if (!postsResponse.success || !requestsResponse.success) {
        setErrorMessage(
          postsResponse.message ||
            requestsResponse.message ||
            '내 나눔 정보를 일부 불러오지 못했습니다.',
        );
      }
    } catch (error) {
      console.warn('Failed to load user share lifecycle:', error);
      setPostedItems([]);
      setReceivedItems([]);
      setErrorMessage(
        '서버에서 내 나눔 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLifecycle();
    }, [loadLifecycle]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadLifecycle();
    setIsRefreshing(false);
  }, [loadLifecycle]);

  const runLifecycleAction = useCallback(
    async (
      actionKey: string,
      successMessage: string,
      action: () => Promise<unknown>,
    ) => {
      setPendingActionKey(actionKey);
      try {
        await action();
        requestNearbyPostsRefresh();
        await loadLifecycle();
        Alert.alert('처리 완료', successMessage);
      } catch (error) {
        Alert.alert(
          '처리 실패',
          getApiErrorMessage(error, '요청을 처리하지 못했습니다.'),
        );
      } finally {
        setPendingActionKey(null);
      }
    },
    [loadLifecycle, requestNearbyPostsRefresh],
  );

  const confirmLifecycleAction = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      Alert.alert(title, message, [
        { text: '취소', style: 'cancel' },
        { text: '진행', style: 'destructive', onPress: onConfirm },
      ]);
    },
    [],
  );

  const postedCount = postedItems.length;
  const receivedCount = receivedItems.length;
  const visibleEmpty =
    activeTab === 'posted' ? postedCount === 0 : receivedCount === 0;

  const summaryCopy = useMemo(() => {
    const activePosted = postedItems.filter(isPostInLifecycleSummary).length;
    const activeReceived = receivedItems.filter(
      isShareRequestAwaitingPickup,
    ).length;

    return `진행 중 ${
      activePosted + activeReceived
    }건 · 등록 ${postedCount}건 · 받은 나눔 ${receivedCount}건`;
  }, [postedItems, postedCount, receivedItems, receivedCount]);

  const renderPostCard = (post: Post) => {
    const actionKeyPrefix = `post-${post.id}`;
    const canCancel = canCancelPost(post);
    const canComplete = canCompletePost(post);
    const fridgeLabel = post.fridgeName || `냉장고 #${post.fridgeId}`;

    return (
      <DSCard
        key={post.id}
        variant="outlined"
        style={styles.lifecycleCard}
        onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <DSText variant="bodyBold" numberOfLines={1}>
              {getPostDisplayName(post)}
            </DSText>
            <DSText variant="small" color="textSecondary">
              {`${fridgeLabel} · ${getPostLifecycleDeadlineLabel(post)}`}
            </DSText>
          </View>
          <DSChip label={getPostStatusLabel(post.status)} size="small" />
        </View>

        <View style={styles.actionRow}>
          <DSButton
            label="상세"
            variant="outlined"
            color="assistive"
            size="small"
            onPress={() =>
              navigation.navigate('PostDetail', { postId: post.id })
            }
          />
          {isPostAwaitingStoreQr(post) ? (
            <DSButton
              label="입고 QR"
              size="small"
              onPress={() =>
                navigation.navigate('InventoryQr', {
                  mode: 'store',
                  postId: post.id,
                })
              }
            />
          ) : null}
          {canCancel ? (
            <DSButton
              label="나눔 취소"
              variant="outlined"
              color="danger"
              size="small"
              loading={pendingActionKey === `${actionKeyPrefix}-cancel`}
              onPress={() =>
                confirmLifecycleAction(
                  '나눔을 취소할까요?',
                  '취소한 나눔은 주변 목록에서 내려갑니다.',
                  () =>
                    runLifecycleAction(
                      `${actionKeyPrefix}-cancel`,
                      '나눔을 취소했습니다.',
                      () => cancelPost(post.id),
                    ),
                )
              }
            />
          ) : null}
          {canComplete ? (
            <DSButton
              label="완료 처리"
              variant="outlined"
              size="small"
              loading={pendingActionKey === `${actionKeyPrefix}-complete`}
              onPress={() =>
                confirmLifecycleAction(
                  '나눔을 완료할까요?',
                  'QR 수령 없이 수동 완료 처리합니다.',
                  () =>
                    runLifecycleAction(
                      `${actionKeyPrefix}-complete`,
                      '나눔을 완료했습니다.',
                      () => completePost(post.id),
                    ),
                )
              }
            />
          ) : null}
        </View>
      </DSCard>
    );
  };

  const renderReceivedCard = (item: UserShareRequestItem) => {
    const { post, request } = item;
    const actionKeyPrefix = `request-${request.id}`;
    const canPickup = isShareRequestAwaitingPickup(item);
    const fridgeLabel =
      post.fridgeName || item.fridge?.name || `냉장고 #${post.fridgeId}`;

    return (
      <DSCard
        key={request.id}
        variant="outlined"
        style={styles.lifecycleCard}
        onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <DSText variant="bodyBold" numberOfLines={1}>
              {getPostDisplayName(post)}
            </DSText>
            <DSText variant="small" color="textSecondary">
              {`${fridgeLabel} · ${getShareRequestStatusLabel(
                request.status,
              )} · ${getPostLifecycleDeadlineLabel(post)}`}
            </DSText>
          </View>
          <DSChip
            label={getShareRequestStatusLabel(request.status)}
            size="small"
          />
        </View>

        <View style={styles.actionRow}>
          <DSButton
            label="상세"
            variant="outlined"
            color="assistive"
            size="small"
            onPress={() =>
              navigation.navigate('PostDetail', { postId: post.id })
            }
          />
          {canPickup ? (
            <>
              <DSButton
                label="수령 QR"
                size="small"
                onPress={() =>
                  navigation.navigate('InventoryQr', {
                    mode: 'pickup',
                    postId: post.id,
                    pendingExpiresAt: post.requestExpiresAt ?? undefined,
                  })
                }
              />
              <DSButton
                label="신청 취소"
                variant="outlined"
                color="danger"
                size="small"
                loading={pendingActionKey === `${actionKeyPrefix}-cancel`}
                onPress={() =>
                  confirmLifecycleAction(
                    '신청을 취소할까요?',
                    '취소하면 다른 사용자가 이 나눔을 신청할 수 있습니다.',
                    () =>
                      runLifecycleAction(
                        `${actionKeyPrefix}-cancel`,
                        '신청을 취소했습니다.',
                        () => cancelShareRequest(request.id),
                      ),
                  )
                }
              />
            </>
          ) : null}
        </View>
      </DSCard>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <DSIcon name="angle-left" size="large" color="textPrimary" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <DSText variant="heading2">나눔 관리</DSText>
          <DSText variant="small" color="textSecondary">
            {summaryCopy}
          </DSText>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'posted' }}
          onPress={() => setActiveTab('posted')}
          style={[styles.tab, activeTab === 'posted' && styles.tabActive]}>
          <DSText
            variant="bodyBold"
            color={activeTab === 'posted' ? 'primary' : 'textSecondary'}>
            내 나눔
          </DSText>
          <DSText variant="small" color="textTertiary">
            {postedCount}
          </DSText>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'received' }}
          onPress={() => setActiveTab('received')}
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}>
          <DSText
            variant="bodyBold"
            color={activeTab === 'received' ? 'primary' : 'textSecondary'}>
            받은 나눔
          </DSText>
          <DSText variant="small" color="textTertiary">
            {receivedCount}
          </DSText>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} />
          <DSText
            variant="small"
            color="textSecondary"
            style={styles.centerText}>
            내 나눔 상태를 불러오는 중입니다.
          </DSText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }>
          {errorMessage ? (
            <DSCard variant="outlined" style={styles.noticeCard}>
              <DSText variant="bodyBold">동기화가 필요합니다</DSText>
              <DSText
                variant="small"
                color="textSecondary"
                style={styles.noticeText}>
                {errorMessage}
              </DSText>
              <DSButton
                label="다시 시도"
                size="small"
                style={styles.retryButton}
                onPress={loadLifecycle}
              />
            </DSCard>
          ) : null}

          {visibleEmpty ? (
            <View style={styles.emptyBox}>
              <DSIcon
                name={activeTab === 'posted' ? 'clipboard-list' : 'gift'}
                size="xlarge"
                color="accent"
              />
              <DSText variant="bodyBold" style={styles.emptyTitle}>
                {activeTab === 'posted'
                  ? '진행 중인 내 나눔이 없습니다'
                  : '받은 나눔 내역이 없습니다'}
              </DSText>
              <DSText variant="small" color="textSecondary" align="center">
                {activeTab === 'posted'
                  ? 'AI 스캔으로 등록한 나눔이 이곳에서 관리됩니다.'
                  : '신청한 나눔의 수령 QR과 상태가 이곳에 표시됩니다.'}
              </DSText>
            </View>
          ) : activeTab === 'posted' ? (
            postedItems.map(renderPostCard)
          ) : (
            receivedItems.map(renderReceivedCard)
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: getHeaderTopPadding(),
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  headerTitleBlock: {
    flex: 1,
    gap: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerText: {
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  noticeCard: {
    gap: 8,
    borderColor: colors.warning,
  },
  noticeText: {
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  lifecycleCard: {
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyBox: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    marginTop: 4,
  },
});

export default MySharesScreen;
