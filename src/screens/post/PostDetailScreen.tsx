/**
 * PostDetailScreen — 나눔 식재료 상세 조회 화면
 *
 * 홈 화면의 피드(NearbyPostCard)에서 특정 나눔 식재료를 터치했을 때 진입.
 * 나눔 식재료의 이미지, 제목, 카테고리, 상태, 상세 설명 등을 보여줌.
 * 본인이 작성한 나눔 식재료일 경우 삭제(나눔 취소) 버튼 표시.
 *
 * @wireframe (별도 와이어프레임은 없으나, 피드 상세 기능을 위해 필요)
 */
import React, { useCallback, useEffect, useState } from 'react';
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
import { getPostDetail, deletePost, getImageUrl } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import type { Post } from '@/types';
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

const PostDetailScreen = ({ route, navigation }: Props) => {
  const { postId } = route.params;
  const user = useAuthStore(state => state.user);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>
          {isMyPost && (
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
              <Text style={styles.headerDeleteIcon}>🗑️</Text>
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
            <Text style={styles.categoryBadge}>{statusLabel}</Text>
            <Text style={styles.timeText}>
              {new Date(post.createdAt).toLocaleDateString()} 등록
            </Text>
          </View>

          <Text style={styles.title}>{displayName}</Text>

          {/* 주요 정보 박스 */}
          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <View>
                <Text style={styles.infoLabel}>남은 기한</Text>
                <Text style={styles.infoValue}>
                  {daysLeft > 0 ? `약 ${daysLeft}일` : '기한 만료'}
                </Text>
              </View>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>✓</Text>
              <View>
                <Text style={styles.infoLabel}>상태 안내</Text>
                <Text style={styles.infoValue}>{quality.label}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>AI 분석 정보</Text>
          <Text style={styles.description}>
            {confidencePercent != null
              ? `AI 신뢰도 ${confidencePercent}%로 ${quality.label} 상태로 확인됐어요.`
              : `${quality.label} 상태로 확인됐어요.`}
          </Text>
        </View>
      </ScrollView>

      {/* 하단 CTA (내가 쓴 글이 아닐 경우 채팅하기 등) */}
      {!isMyPost && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.chatButton,
              post.status !== 'available' && styles.chatButtonDisabled,
            ]}
            disabled={post.status !== 'available'}>
            <Text style={styles.chatButtonText}>
              {post.status === 'available'
                ? '나눔 신청하기 (준비중)'
                : statusLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default PostDetailScreen;
