/**
 * HomeScreen — 홈 화면
 *
 * - 위치 헤더 (현재 동네 + 알림)
 * - AI 스캔 히어로 배너
 * - 통계 카드 (주변 나눔, 진행 중인 나눔)
 * - 근처 실시간 나눔 피드
 * - Pull-to-refresh
 *
 * @wireframe wireframe-foodlink/homescreen.html + temp/screen-home.html
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { Post, PostNearbyRead, UserShareRequestItem } from '@/types';
import { getNearbyPosts } from '@/api/posts';
import { getMyPosts, getMyShareRequests } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import type { MainTabParamList } from '@/navigation/types';
import NearbyPostCard from '@/components/home/NearbyPostCard';
import {
  getRegisteredLocation,
  hasRegisteredLocation,
  LOCATION_REQUIRED_CTA,
  LOCATION_REQUIRED_MESSAGE,
  LOCATION_REQUIRED_TITLE,
} from '@/utils/locationGuard';
import { selectHomeRecommendations } from '@/utils/homeRecommendations';
import { DSIcon, type DSIconName } from '@/design-system';
import {
  formatPostLifecycleDate,
  HOME_POST_LIFECYCLE_STATUSES,
  HOME_SHARE_REQUEST_LIFECYCLE_STATUSES,
  isPostAwaitingPickupConfirmation,
  isPostAwaitingStoreQr,
  isShareRequestAwaitingPickup,
} from '@/utils/postPolicy';
import { colors } from '@/theme';
import { getHeaderTopPadding } from '@/utils/safeArea';

type HomeAction = {
  key: string;
  title: string;
  statusLabels?: string[];
  description: string;
  buttonLabel: string | null;
  icon: DSIconName;
  onPress?: () => void;
};

const filterPostsByQuery = (
  items: PostNearbyRead[],
  query: string,
): PostNearbyRead[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter(post =>
    [post.detectedFruitKo, post.detectedFruit, post.fridgeName].some(value =>
      (value ?? '').toLowerCase().includes(normalizedQuery),
    ),
  );
};

const HomeScreen = () => {
  const [posts, setPosts] = useState<PostNearbyRead[]>([]);
  const [feedQuery, setFeedQuery] = useState('');
  const [serverFilteredFeedQuery, setServerFilteredFeedQuery] = useState<
    string | null
  >(null);
  const [feedState, setFeedState] = useState<
    'loading' | 'ready' | 'empty' | 'error'
  >('loading');
  const [feedError, setFeedError] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myShareRequests, setMyShareRequests] = useState<
    UserShareRequestItem[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore(state => state.user);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainTabParamList, 'Home'>>();
  const nearbyPostsRefreshToken = route.params?.nearbyPostsRefreshToken;
  const completedPostId = route.params?.completedPostId;
  const feedRefreshToken = useFeedRefreshStore(
    state => state.nearbyPostsRefreshToken,
  );
  const refreshSignalRef = useRef({
    nearbyPostsRefreshToken,
    feedRefreshToken,
  });
  const feedSearchRequestId = useRef(0);
  const didMountFeedSearch = useRef(false);
  const feedQueryRef = useRef('');
  const unfilteredPostsRef = useRef<PostNearbyRead[]>([]);
  const hasLoadedUnfilteredPostsRef = useRef(false);
  const requestedPostId = useFeedRefreshStore(state => state.requestedPostId);
  const hasLocation = hasRegisteredLocation(user);
  const normalizedFeedQuery = feedQuery.trim().toLowerCase();
  const isFilteringFeed = normalizedFeedQuery.length > 0;
  const isServerFilteredFeed =
    isFilteringFeed && serverFilteredFeedQuery === normalizedFeedQuery;
  const filteredPosts = useMemo(() => {
    if (!isFilteringFeed || isServerFilteredFeed) {
      return posts;
    }

    return filterPostsByQuery(posts, normalizedFeedQuery);
  }, [isFilteringFeed, isServerFilteredFeed, normalizedFeedQuery, posts]);
  const recommendedPosts = useMemo(
    () => selectHomeRecommendations(posts),
    [posts],
  );
  const shouldShowRecommendations =
    feedState === 'ready' && !isFilteringFeed && recommendedPosts.length > 0;
  const shouldShowFeedSearch =
    isFilteringFeed || (posts.length > 0 && feedState === 'ready');

  const updateFeedQuery = useCallback((query: string) => {
    feedQueryRef.current = query;
    setFeedQuery(query);
  }, []);

  const openLocationSetup = useCallback(() => {
    navigation.getParent()?.navigate('LocationSetup', { allowBack: true });
  }, [navigation]);

  const openCameraScan = useCallback(() => {
    if (!hasLocation) {
      openLocationSetup();
      return;
    }

    navigation.getParent()?.navigate('CameraScan');
  }, [hasLocation, navigation, openLocationSetup]);

  const fetchPosts = useCallback(async () => {
    const requestId = feedSearchRequestId.current + 1;
    feedSearchRequestId.current = requestId;
    const location = getRegisteredLocation(user);
    if (!location) {
      setPosts([]);
      setServerFilteredFeedQuery(null);
      unfilteredPostsRef.current = [];
      hasLoadedUnfilteredPostsRef.current = false;
      setFeedState('error');
      setFeedError(LOCATION_REQUIRED_MESSAGE);
      return;
    }

    setFeedState('loading');
    setFeedError(null);
    try {
      const response = await getNearbyPosts(
        location.latitude,
        location.longitude,
      );
      if (feedSearchRequestId.current !== requestId) {
        return;
      }
      if (response.success && response.data) {
        setPosts(response.data);
        setServerFilteredFeedQuery(null);
        unfilteredPostsRef.current = response.data;
        hasLoadedUnfilteredPostsRef.current = true;
        setFeedState(response.data.length > 0 ? 'ready' : 'empty');
      } else {
        setPosts([]);
        setServerFilteredFeedQuery(null);
        unfilteredPostsRef.current = [];
        hasLoadedUnfilteredPostsRef.current = false;
        setFeedState('error');
        setFeedError(response.message || '주변 나눔을 불러오지 못했습니다.');
      }
    } catch (error) {
      if (feedSearchRequestId.current !== requestId) {
        return;
      }
      console.warn('Failed to fetch posts:', error);
      setPosts([]);
      setServerFilteredFeedQuery(null);
      unfilteredPostsRef.current = [];
      hasLoadedUnfilteredPostsRef.current = false;
      setFeedState('error');
      setFeedError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [user]);

  const searchPosts = useCallback(
    async (query: string) => {
      const location = getRegisteredLocation(user);
      if (!location) {
        return;
      }

      const requestId = feedSearchRequestId.current + 1;
      feedSearchRequestId.current = requestId;
      setFeedState('loading');
      setFeedError(null);

      try {
        const response = await getNearbyPosts(
          location.latitude,
          location.longitude,
          2.0,
          0,
          20,
          query,
        );
        if (feedSearchRequestId.current !== requestId) {
          return;
        }

        if (response.success && response.data) {
          setPosts(response.data);
          setServerFilteredFeedQuery(query.trim().toLowerCase());
          setFeedState(response.data.length > 0 ? 'ready' : 'empty');
        } else {
          throw new Error(response.message || 'search failed');
        }
      } catch (error) {
        if (feedSearchRequestId.current !== requestId) {
          return;
        }

        console.warn('Failed to search posts:', error);
        if (hasLoadedUnfilteredPostsRef.current) {
          const fallbackPosts = filterPostsByQuery(
            unfilteredPostsRef.current,
            query,
          );
          setPosts(fallbackPosts);
          setServerFilteredFeedQuery(null);
          setFeedState(fallbackPosts.length > 0 ? 'ready' : 'empty');
          setFeedError(null);
          return;
        }

        setPosts([]);
        setServerFilteredFeedQuery(null);
        setFeedState('error');
        setFeedError(
          '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        );
      }
    },
    [user],
  );

  const fetchVisiblePosts = useCallback(async () => {
    const query = feedQueryRef.current.trim();
    if (query) {
      await searchPosts(query);
      return;
    }

    await fetchPosts();
  }, [fetchPosts, searchPosts]);

  const fetchLifecycleActions = useCallback(async () => {
    if (!user) {
      setMyPosts([]);
      setMyShareRequests([]);
      return;
    }

    try {
      const [postsResponse, requestsResponse] = await Promise.all([
        getMyPosts([...HOME_POST_LIFECYCLE_STATUSES], 0, 20),
        getMyShareRequests([...HOME_SHARE_REQUEST_LIFECYCLE_STATUSES], 0, 20),
      ]);

      setMyPosts(postsResponse.data ?? []);
      setMyShareRequests(requestsResponse.data ?? []);
    } catch (error) {
      console.warn('Failed to fetch lifecycle actions:', error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchVisiblePosts().catch(() => undefined);
      fetchLifecycleActions();
    }, [fetchLifecycleActions, fetchVisiblePosts]),
  );

  useEffect(() => {
    const previous = refreshSignalRef.current;
    if (
      previous.nearbyPostsRefreshToken === nearbyPostsRefreshToken &&
      previous.feedRefreshToken === feedRefreshToken
    ) {
      return;
    }

    refreshSignalRef.current = {
      nearbyPostsRefreshToken,
      feedRefreshToken,
    };
    fetchVisiblePosts().catch(() => undefined);
    fetchLifecycleActions();
  }, [
    feedRefreshToken,
    fetchVisiblePosts,
    fetchLifecycleActions,
    nearbyPostsRefreshToken,
  ]);

  useEffect(() => {
    if (requestedPostId == null) {
      return;
    }

    setPosts(currentPosts =>
      currentPosts.filter(post => post.id !== requestedPostId),
    );
    unfilteredPostsRef.current = unfilteredPostsRef.current.filter(
      post => post.id !== requestedPostId,
    );
  }, [requestedPostId]);

  useEffect(() => {
    if (!didMountFeedSearch.current) {
      didMountFeedSearch.current = true;
      return;
    }

    const query = feedQuery.trim();
    const timeout = setTimeout(() => {
      if (query) {
        searchPosts(query).catch(() => undefined);
      } else {
        fetchPosts().catch(() => undefined);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [feedQuery, fetchPosts, searchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchVisiblePosts(), fetchLifecycleActions()]);
    setRefreshing(false);
  }, [fetchLifecycleActions, fetchVisiblePosts]);

  const openPostDetail = useCallback(
    (postId: number) => {
      navigation.getParent()?.navigate('PostDetail', {
        postId,
      });
    },
    [navigation],
  );
  const currentActions = useMemo<HomeAction[]>(() => {
    const actions: HomeAction[] = [];

    myShareRequests.filter(isShareRequestAwaitingPickup).forEach(item => {
      actions.push({
        key: `pickup-${item.request.id}`,
        title: '수령 QR 필요',
        statusLabels: ['수령 QR 필요', '수령 제한 시간'],
        description: `${
          item.post.detectedFruitKo ?? '나눔 식재료'
        } 수령 QR이 열려 있습니다. 수령 제한 시간 ${formatPostLifecycleDate(
          item.post.requestExpiresAt,
          '마감 시간 확인 필요',
        )} 전까지 인증을 완료하세요.`,
        buttonLabel: '수령 QR 열기',
        icon: 'qrcode',
        onPress: () =>
          navigation.getParent()?.navigate('InventoryQr', {
            mode: 'pickup',
            postId: item.post.id,
            pendingExpiresAt: item.post.requestExpiresAt ?? undefined,
          }),
      });
    });

    myPosts.filter(isPostAwaitingStoreQr).forEach(post => {
      actions.push({
        key: `store-${post.id}`,
        title: '입고 QR 필요',
        statusLabels: ['입고 QR 필요'],
        description: `${
          post.detectedFruitKo ?? '나눔 식재료'
        }는 입고 QR 인증 전이라 주변 목록에 노출되지 않습니다. ${formatPostLifecycleDate(
          post.storeExpiresAt,
          '마감 시간 확인 필요',
        )} 전까지 입고를 완료하세요.`,
        buttonLabel: '입고 QR 열기',
        icon: 'qrcode',
        onPress: () =>
          navigation.getParent()?.navigate('InventoryQr', {
            mode: 'store',
            postId: post.id,
          }),
      });
    });

    myPosts.filter(isPostAwaitingPickupConfirmation).forEach(post => {
      actions.push({
        key: `posted-requested-${post.id}`,
        title: '신청 접수',
        statusLabels: [
          '신청 접수',
          ...(post.requestExpiresAt ? ['수령 제한 시간'] : []),
        ],
        description: `${
          post.detectedFruitKo ?? '나눔 식재료'
        } 신청이 접수됐습니다. 수령 제한 시간 ${formatPostLifecycleDate(
          post.requestExpiresAt,
          '마감 시간 확인 필요',
        )} 전까지 수령 상태를 확인하세요.`,
        buttonLabel: '내 나눔 관리',
        icon: 'clipboard-list',
        onPress: () =>
          navigation.getParent()?.navigate('MyShares', {
            initialTab: 'posted',
          }),
      });
    });

    if (actions.length > 0) {
      return actions.slice(0, 3);
    }

    if (requestedPostId != null) {
      return [
        {
          key: `requested-${requestedPostId}`,
          title: '수령 QR 확인 필요',
          description:
            '방금 신청한 나눔은 상세 화면에서 남은 시간과 수령 QR 인증을 확인할 수 있어요.',
          buttonLabel: '상세에서 확인',
          icon: 'qrcode',
          onPress: () => openPostDetail(requestedPostId),
        },
      ];
    }

    if (completedPostId != null) {
      return [
        {
          key: `completed-${completedPostId}`,
          title: '등록한 나눔 확인 중',
          description:
            '주변 이웃에게 알림을 보냈어요. 지도와 알림에서 신청 상태를 확인하세요.',
          buttonLabel: '지도에서 보기',
          icon: 'clipboard-list',
          onPress: () => navigation.navigate('Map'),
        },
      ];
    }

    return [
      {
        key: 'empty',
        title: '진행 중인 나눔 없음',
        description:
          '입고 QR, 수령 QR, 신청 상태처럼 지금 해야 할 일이 생기면 여기에 모입니다.',
        buttonLabel: null,
        icon: 'circle-check',
        onPress: undefined,
      },
    ];
  }, [
    completedPostId,
    myPosts,
    myShareRequests,
    navigation,
    openPostDetail,
    requestedPostId,
  ]);

  const activeActionCount = useMemo(() => {
    const accountActionCount =
      myShareRequests.filter(isShareRequestAwaitingPickup).length +
      myPosts.filter(isPostAwaitingStoreQr).length +
      myPosts.filter(isPostAwaitingPickupConfirmation).length;

    if (accountActionCount > 0) {
      return accountActionCount;
    }

    return requestedPostId != null || completedPostId != null ? 1 : 0;
  }, [completedPostId, myPosts, myShareRequests, requestedPostId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 헤더 ────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationHeader}
          onPress={openLocationSetup}>
          <Text style={styles.locationName}>
            {hasLocation ? '내 동네' : '위치 미설정'}
          </Text>
          <DSIcon name="angle-right" size="small" color="textTertiary" />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            accessibilityLabel="지도 열기"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Map')}>
            <DSIcon
              name="map-location-dot"
              size="large"
              color="textSecondary"
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="알림 열기"
            accessibilityRole="button"
            style={styles.bellWrapper}
            onPress={() => navigation.navigate('Chat')}>
            <DSIcon
              name="bell"
              size="large"
              color="textSecondary"
              style={styles.headerIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 스크롤 콘텐츠 ─────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* AI 스캔 히어로 */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>AI 신선도 스캔</Text>
            <Text style={styles.heroSubtitle}>
              사진 한 장으로 나눔 가능 여부 확인
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={openCameraScan}>
              <Text style={styles.heroButtonText}>지금 시작하기</Text>
            </TouchableOpacity>
          </View>
          <DSIcon
            name="camera"
            size={64}
            color="textOnPrimary"
            style={styles.heroIcon}
          />
        </View>

        <View style={styles.actionHub}>
          <View style={styles.actionHubHeader}>
            <Text style={styles.actionHubEyebrow}>진행 중인 나눔</Text>
            <Text style={styles.actionHubCount}>
              {activeActionCount > 0 ? `${activeActionCount}건` : '없음'}
            </Text>
          </View>
          <View style={styles.actionHubList}>
            {currentActions.map((action, index) => (
              <View
                key={action.key}
                style={[
                  styles.actionHubItem,
                  index < currentActions.length - 1 &&
                    styles.actionHubItemDivider,
                ]}>
                <View style={styles.actionHubItemIcon}>
                  <DSIcon name={action.icon} size="small" color="primary" />
                </View>
                <View style={styles.actionHubItemBody}>
                  <Text style={styles.actionHubTitle}>{action.title}</Text>
                  {action.statusLabels?.length ? (
                    <View style={styles.actionHubStatusRow}>
                      {action.statusLabels.map((label, labelIndex) => (
                        <Text
                          key={`${action.key}-${label}-${labelIndex}`}
                          style={styles.actionHubStatusLabel}>
                          {label}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <Text style={styles.actionHubDescription}>
                    {action.description}
                  </Text>
                  {action.buttonLabel && action.onPress ? (
                    <TouchableOpacity
                      style={styles.actionHubButton}
                      onPress={action.onPress}>
                      <Text style={styles.actionHubButtonText}>
                        {action.buttonLabel}
                      </Text>
                      <DSIcon
                        name="angle-right"
                        size="xsmall"
                        color="primary"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>주변 나눔</Text>
            <Text style={styles.statValue}>
              {posts.length > 0 ? `${posts.length}건` : '—'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>진행 중인 나눔</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {activeActionCount > 0 ? `${activeActionCount}건` : '없음'}
            </Text>
          </View>
        </View>

        {/* 근처 나눔 피드 */}
        {shouldShowRecommendations ? (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationTitle}>
                오늘 가져가기 좋은 재료
              </Text>
              <Text style={styles.recommendationSubtitle}>
                권장 수령일이 가까운 나눔을 먼저 보여드려요.
              </Text>
            </View>
            <View style={styles.feedList}>
              {recommendedPosts.map(post => (
                <NearbyPostCard
                  key={`recommended-${post.id}`}
                  post={post}
                  onPress={() => openPostDetail(post.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>내 주변 실시간 나눔</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map')}>
              <Text style={styles.feedMore}>지도에서 보기</Text>
            </TouchableOpacity>
          </View>
          {shouldShowFeedSearch ? (
            <View style={styles.feedSearchBox}>
              <DSIcon
                name="magnifying-glass"
                size="small"
                color="textTertiary"
                style={styles.feedSearchIcon}
              />
              <TextInput
                style={styles.feedSearchInput}
                value={feedQuery}
                onChangeText={updateFeedQuery}
                placeholder="나눔 식재료 검색"
                placeholderTextColor={colors.textPlaceholder}
              />
              {isFilteringFeed ? (
                <TouchableOpacity
                  style={styles.feedSearchClear}
                  onPress={() => updateFeedQuery('')}>
                  <DSIcon name="xmark" size="small" color="textSecondary" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {isFilteringFeed && feedState === 'ready' ? (
            <Text style={styles.feedSearchMeta}>
              {`검색 결과 ${filteredPosts.length}건`}
            </Text>
          ) : null}

          {feedState === 'loading' ? (
            <View style={styles.emptyFeed}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyTitle}>
                주변 나눔을 불러오는 중입니다
              </Text>
            </View>
          ) : feedState === 'error' ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyTitle}>
                {hasLocation
                  ? '목록을 불러오지 못했습니다'
                  : LOCATION_REQUIRED_TITLE}
              </Text>
              <Text style={styles.emptySubtitle}>{feedError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={hasLocation ? fetchPosts : openLocationSetup}>
                <Text style={styles.retryButtonText}>
                  {hasLocation ? '다시 시도' : LOCATION_REQUIRED_CTA}
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredPosts.length > 0 ? (
            <View style={styles.feedList}>
              {filteredPosts.map(post => (
                <NearbyPostCard
                  key={post.id}
                  post={post}
                  onPress={() => openPostDetail(post.id)}
                />
              ))}
            </View>
          ) : isFilteringFeed ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
              <Text style={styles.emptySubtitle}>
                다른 식재료명이나 냉장고명으로 검색해보세요.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => updateFeedQuery('')}>
                <Text style={styles.retryButtonText}>검색 초기화</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyFeed}>
              <DSIcon
                name="seedling"
                size="xlarge"
                color="accent"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>아직 근처에 나눔이 없어요</Text>
              <Text style={styles.emptySubtitle}>
                첫 번째 나눔을 시작해보세요!{'\n'}AI 스캔으로 신선도를 확인하고
                등록할 수 있어요.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: getHeaderTopPadding(),
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    lineHeight: 24,
  },
  bellWrapper: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // 스크롤
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // 히어로
  heroBanner: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  heroIcon: {
    opacity: 0.3,
    position: 'absolute',
    right: -8,
    bottom: -8,
  },
  // 통계
  actionHub: {
    marginHorizontal: 24,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  actionHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionHubEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  actionHubCount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  actionHubList: {
    gap: 0,
  },
  actionHubItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  actionHubItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  actionHubItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  actionHubItemBody: {
    flex: 1,
  },
  actionHubTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  actionHubStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  actionHubStatusLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  actionHubDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  actionHubButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  actionHubButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // 피드
  recommendationSection: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  recommendationHeader: {
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  recommendationSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  feedSection: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  feedMore: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
  },
  feedSearchBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  feedSearchIcon: {
    marginRight: 8,
  },
  feedSearchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  feedSearchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  feedSearchMeta: {
    marginBottom: 10,
    fontSize: 12,
    color: colors.textSecondary,
  },
  feedList: {
    gap: 12,
  },
  // 빈 상태
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
