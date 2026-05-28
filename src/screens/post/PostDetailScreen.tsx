/**
 * PostDetailScreen — 나눔 식재료 상세 조회 화면
 *
 * 홈 화면의 피드(NearbyPostCard)에서 특정 나눔 식재료를 터치했을 때 진입.
 * 나눔 식재료의 이미지, 제목, 카테고리, 상태, 상세 설명 등을 보여줌.
 * 본인이 작성한 나눔 식재료일 경우 삭제(나눔 취소) 버튼 표시.
 *
 * @wireframe (별도 와이어프레임은 없으나, 피드 상세 기능을 위해 필요)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSScreenFooter,
  DSText,
} from '@/design-system';
import {
  getPostDetail,
  deletePost,
  getImageUrl,
  requestShare,
} from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import type { Post } from '@/types';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  formatInventoryHoldRemaining,
  getInventoryHoldRemainingMs,
  isInventoryHoldExpired,
  parseServerLifecycleTimestampMs,
} from '@/features/inventory/holdPolicy';
import {
  getConfidencePercent,
  getPostDisplayName,
  getPostStatusLabel,
  getQualityMeta,
  isPostAuthoredByUser,
} from '@/utils/postPolicy';
import { colors } from '@/theme';
import { styles } from './PostDetailScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

const getErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : null;
};

const isValidDateInput = (value?: string | null): value is string =>
  Boolean(value && Number.isFinite(parseServerLifecycleTimestampMs(value)));

const PostDetailScreen = ({ route, navigation }: Props) => {
  const { postId } = route.params;
  const user = useAuthStore(state => state.user);
  const requestNearbyPostsRefresh = useFeedRefreshStore(
    state => state.requestNearbyPostsRefresh,
  );

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const expiredHoldRefreshKeysRef = useRef<Set<string>>(new Set());

  const fetchPostDetail = useCallback(async () => {
    try {
      const response = await getPostDetail(postId);
      if (response.success && response.data) {
        setPost(response.data);
      } else {
        Alert.alert(
          '오류',
          response.message || '나눔 식재료를 불러올 수 없습니다.',
        );
        navigation.goBack();
      }
    } catch (error) {
      console.warn('Failed to fetch post detail', error);
      Alert.alert('오류', '나눔 식재료를 불러오는 중 문제가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [navigation, postId]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  useEffect(() => {
    if (post?.status !== 'requested' || !post.requestExpiresAt) {
      return;
    }

    setCurrentTimeMs(Date.now());
    const timerId = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, [post?.requestExpiresAt, post?.status]);

  useEffect(() => {
    if (
      post?.status !== 'requested' ||
      !isValidDateInput(post.requestExpiresAt) ||
      !isInventoryHoldExpired(post.requestExpiresAt, currentTimeMs)
    ) {
      return;
    }

    const refreshKey = `${post.id}:${post.requestExpiresAt}`;
    if (expiredHoldRefreshKeysRef.current.has(refreshKey)) {
      return;
    }

    expiredHoldRefreshKeysRef.current.add(refreshKey);
    requestNearbyPostsRefresh();
  }, [
    currentTimeMs,
    post?.id,
    post?.requestExpiresAt,
    post?.status,
    requestNearbyPostsRefresh,
  ]);

  const handleDelete = () => {
    Alert.alert('나눔 취소', '정말로 이 나눔을 취소(삭제)하시겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '예',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            const response = await deletePost(postId);
            if (response.success) {
              Alert.alert('완료', '나눔이 취소되었습니다.');
              navigation.goBack(); // 또는 홈으로 리셋
            } else {
              Alert.alert('오류', response.message || '삭제에 실패했습니다.');
            }
          } catch {
            Alert.alert('오류', '서버에 연결할 수 없습니다.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleRequestShare = async () => {
    if (!post || post.status !== 'available' || isRequesting) {
      return;
    }

    if (isPostAuthoredByUser(post, user?.id)) {
      Alert.alert('신청 불가', '내가 등록한 나눔 식재료예요.');
      return;
    }

    setIsRequesting(true);
    try {
      const response = await requestShare(post.id);
      if (response.success && response.data) {
        setPost(response.data.post);
        requestNearbyPostsRefresh(response.data.post.id);
        Alert.alert('신청 완료', '나눔 신청이 접수되었습니다.');
        return;
      }

      Alert.alert('신청 실패', response.message || '나눔 신청에 실패했습니다.');
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 403) {
        Alert.alert('신청 불가', '내가 등록한 나눔 식재료예요.');
      } else if (status === 409) {
        setPost(currentPost =>
          currentPost ? { ...currentPost, status: 'requested' } : currentPost,
        );
        requestNearbyPostsRefresh(post.id);
        Alert.alert('신청 마감', '다른 사용자가 먼저 신청했어요.');
      } else {
        Alert.alert(
          '신청 실패',
          getApiErrorMessage(error, '나눔 신청에 실패했습니다.'),
        );
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return null;
  }

  const isMyPost = isPostAuthoredByUser(post, user?.id);
  const displayName = getPostDisplayName(post);
  const quality = getQualityMeta(post.freshnessLabel);
  const confidencePercent = getConfidencePercent(post.confidenceScore);
  const statusLabel = getPostStatusLabel(post.status);
  const canRequestShare = !isMyPost && post.status === 'available';
  const requestButtonLabel = isRequesting
    ? '신청 중...'
    : canRequestShare
    ? '나눔 신청하기'
    : statusLabel;
  const requestNotice =
    post.status === 'available'
      ? '신청 접수는 예약 확정이 아니에요.'
      : post.status === 'requested'
      ? '신청이 접수된 상태이며 예약 확정은 아니에요.'
      : null;
  const requestExpiresAt =
    post.status === 'requested' && isValidDateInput(post.requestExpiresAt)
      ? post.requestExpiresAt
      : null;
  const isRequestHoldExpired = requestExpiresAt
    ? isInventoryHoldExpired(requestExpiresAt, currentTimeMs)
    : false;
  const requestHoldNotice = requestExpiresAt
    ? isRequestHoldExpired
      ? '수령 제한 시간이 지났어요. 목록을 새로고침하면 상태가 갱신됩니다.'
      : `수령까지 남은 시간 ${formatInventoryHoldRemaining(
          getInventoryHoldRemainingMs(requestExpiresAt, currentTimeMs),
        )}`
    : null;
  const canConfirmPickup =
    !isMyPost && post.status === 'requested' && !isRequestHoldExpired;
  const daysLeft = Math.ceil(
    (new Date(post.expirationDate).getTime() - new Date().getTime()) /
      (1000 * 3600 * 24),
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* 헤더 (이미지 위 오버레이) */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}>
            <DSIcon name="angle-left" size="large" color="textOnPrimary" />
          </TouchableOpacity>
          {isMyPost && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              style={styles.headerButton}>
              <DSIcon name="trash-can" size="medium" color="textOnPrimary" />
            </TouchableOpacity>
          )}
        </View>

        {/* 상단 이미지 */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(post.imageUrl) }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* 본문 영역 */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <DSChip
              label={statusLabel}
              tone="primary"
              size="small"
              style={styles.categoryBadge}
            />
            <Text style={styles.timeText}>
              {new Date(post.createdAt).toLocaleDateString()} 등록
            </Text>
          </View>

          <Text style={styles.title}>{displayName}</Text>

          {/* 주요 정보 박스 */}
          <DSCard variant="plain" padded={false} style={styles.infoBox}>
            <View style={styles.infoItem}>
              <DSIcon
                name="clock"
                size="large"
                color="primary"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>남은 기한</Text>
                <Text style={styles.infoValue}>
                  {daysLeft > 0 ? `약 ${daysLeft}일` : '권장일 지남'}
                </Text>
              </View>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.infoItem}>
              <DSIcon
                name="circle-check"
                size="large"
                color="primary"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>상태 안내</Text>
                <Text style={styles.infoValue}>{quality.label}</Text>
              </View>
            </View>
          </DSCard>

          <Text style={styles.sectionTitle}>AI 분석 정보</Text>
          <Text style={styles.description}>
            {confidencePercent != null
              ? `AI 참고 신호는 ${confidencePercent}%이며, 실제 상태는 수령 전 확인이 필요해요.`
              : 'AI 분석은 참고용이며, 실제 상태는 수령 전 확인이 필요해요.'}
          </Text>
        </View>
      </ScrollView>

      {/* 하단 CTA (내가 쓴 글이 아닐 경우 채팅하기 등) */}
      {!isMyPost && (
        <DSScreenFooter style={styles.footer}>
          {requestNotice && (
            <Text style={styles.requestNotice}>{requestNotice}</Text>
          )}
          {requestHoldNotice ? (
            <DSText
              variant="caption"
              color={isRequestHoldExpired ? 'error' : 'textSecondary'}
              style={[
                styles.requestHoldNotice,
                isRequestHoldExpired && styles.requestHoldNoticeExpired,
              ]}>
              {requestHoldNotice}
            </DSText>
          ) : null}

          <DSButton
            label={isRequesting ? '' : requestButtonLabel}
            accessibilityLabel={requestButtonLabel}
            loading={isRequesting}
            loadingLabel="처리 중"
            onPress={handleRequestShare}
            disabled={!canRequestShare || isRequesting}
            style={styles.chatButton}
            textStyle={styles.chatButtonText}
          />

          {canConfirmPickup ? (
            <DSButton
              label="수령 QR 인증"
              variant="outlined"
              fullWidth
              onPress={() =>
                navigation.navigate('InventoryQr', {
                  mode: 'pickup',
                  postId: post.id,
                  pendingExpiresAt: requestExpiresAt ?? undefined,
                })
              }
              style={styles.pickupQrButton}
              textStyle={styles.pickupQrButtonText}
            />
          ) : null}
        </DSScreenFooter>
      )}
    </View>
  );
};

export default PostDetailScreen;
