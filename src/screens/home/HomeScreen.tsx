/**
 * HomeScreen — 홈 화면
 *
 * - 위치 헤더 (현재 동네 + 알림)
 * - AI 스캔 히어로 배너
 * - 통계 카드 (오늘의 나눔, 탄소 절감)
 * - 근처 실시간 나눔 피드
 * - Pull-to-refresh
 *
 * @wireframe wireframe-foodlink/homescreen.html + temp/screen-home.html
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { PostNearbyRead } from '@/types';
import { getNearbyPosts } from '@/api/posts';
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
import { DSIcon } from '@/design-system';
import { colors } from '@/theme';

const HomeScreen = () => {
  const [posts, setPosts] = useState<PostNearbyRead[]>([]);
  const [feedQuery, setFeedQuery] = useState('');
  const [feedState, setFeedState] = useState<
    'loading' | 'ready' | 'empty' | 'error'
  >('loading');
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore(state => state.user);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainTabParamList, 'Home'>>();
  const nearbyPostsRefreshToken = route.params?.nearbyPostsRefreshToken;
  const feedRefreshToken = useFeedRefreshStore(
    state => state.nearbyPostsRefreshToken,
  );
  const requestedPostId = useFeedRefreshStore(state => state.requestedPostId);
  const hasLocation = hasRegisteredLocation(user);
  const normalizedFeedQuery = feedQuery.trim().toLowerCase();
  const isFilteringFeed = normalizedFeedQuery.length > 0;
  const filteredPosts = useMemo(() => {
    if (!isFilteringFeed) {
      return posts;
    }

    return posts.filter(post =>
      [post.detectedFruitKo, post.detectedFruit, post.fridgeName].some(value =>
        (value ?? '').toLowerCase().includes(normalizedFeedQuery),
      ),
    );
  }, [isFilteringFeed, normalizedFeedQuery, posts]);

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
    const location = getRegisteredLocation(user);
    if (!location) {
      setPosts([]);
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
      if (response.success && response.data) {
        setPosts(response.data);
        setFeedState(response.data.length > 0 ? 'ready' : 'empty');
      } else {
        setPosts([]);
        setFeedState('error');
        setFeedError(response.message || '주변 나눔을 불러오지 못했습니다.');
      }
    } catch (error) {
      console.warn('Failed to fetch posts:', error);
      setPosts([]);
      setFeedState('error');
      setFeedError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      // Keep the token in this closure so post completion can force a focus refetch.
      void nearbyPostsRefreshToken;
      void feedRefreshToken;
      void fetchPosts();
    }, [feedRefreshToken, fetchPosts, nearbyPostsRefreshToken]),
  );

  useEffect(() => {
    if (requestedPostId == null) {
      return;
    }

    setPosts(currentPosts =>
      currentPosts.filter(post => post.id !== requestedPostId),
    );
  }, [requestedPostId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

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

        {/* 통계 카드 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>주변 나눔</Text>
            <Text style={styles.statValue}>
              {posts.length > 0 ? `${posts.length}건` : '—'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>탄소 절감</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              준비 중
            </Text>
          </View>
        </View>

        {/* 근처 나눔 피드 */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>내 주변 실시간 나눔</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map')}>
              <Text style={styles.feedMore}>지도에서 보기</Text>
            </TouchableOpacity>
          </View>
          {posts.length > 0 && feedState === 'ready' ? (
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
                onChangeText={setFeedQuery}
                placeholder="나눔 식재료 검색"
                placeholderTextColor={colors.textPlaceholder}
              />
              {isFilteringFeed ? (
                <TouchableOpacity
                  style={styles.feedSearchClear}
                  onPress={() => setFeedQuery('')}>
                  <Text style={styles.feedSearchClearText}>×</Text>
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
                  onPress={() =>
                    navigation.getParent()?.navigate('PostDetail', {
                      postId: post.id,
                    })
                  }
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
                onPress={() => setFeedQuery('')}>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
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
  feedSearchClearText: {
    fontSize: 18,
    lineHeight: 20,
    color: colors.textSecondary,
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
