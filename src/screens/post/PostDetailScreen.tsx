/**
 * PostDetailScreen — 게시글 상세 조회 화면
 *
 * 홈 화면의 피드(NearbyPostCard)에서 특정 게시글을 터치했을 때 진입.
 * 게시글의 이미지, 제목, 카테고리, 상태(신선도 등), 상세 설명 등을 보여줌.
 * 본인이 작성한 게시글일 경우 삭제(나눔 취소) 버튼 표시.
 *
 * @wireframe (별도 와이어프레임은 없으나, 피드 상세 기능을 위해 필요)
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {getPostDetail, deletePost, getImageUrl} from '@/api/posts';
import {useAuthStore} from '@/store/authStore';
import type {Post} from '@/types';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

const PostDetailScreen = ({route, navigation}: Props) => {
  const {postId} = route.params;
  const user = useAuthStore(state => state.user);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const fetchPostDetail = async () => {
    try {
      const response = await getPostDetail(postId);
      if (response.success && response.data) {
        setPost(response.data);
      } else {
        Alert.alert('오류', response.message || '게시글을 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.warn('Failed to fetch post detail', error);
      Alert.alert('오류', '게시글을 불러오는 중 문제가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '나눔 취소',
      '정말로 이 나눔을 취소(삭제)하시겠습니까?',
      [
        {text: '아니오', style: 'cancel'},
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
            } catch (error) {
              Alert.alert('오류', '서버에 연결할 수 없습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
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

  const isMyPost = user?.id === post.userId;
  const daysLeft = Math.ceil(
    (new Date(post.expirationDate).getTime() - new Date().getTime()) /
      (1000 * 3600 * 24),
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

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
            source={{uri: getImageUrl(post.imageUrl)}}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* 본문 영역 */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryBadge}>{post.category || '식재료'}</Text>
            <Text style={styles.timeText}>
              {new Date(post.createdAt).toLocaleDateString()} 등록
            </Text>
          </View>

          <Text style={styles.title}>{post.title}</Text>

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
              <Text style={styles.infoIcon}>🏢</Text>
              <View>
                <Text style={styles.infoLabel}>보관 장소</Text>
                <Text style={styles.infoValue}>공유 냉장고</Text>
              </View>
            </View>
          </View>

          {/* 상세 설명 */}
          <Text style={styles.sectionTitle}>상세 설명</Text>
          <Text style={styles.description}>{post.description}</Text>
        </View>
      </ScrollView>

      {/* 하단 CTA (내가 쓴 글이 아닐 경우 채팅하기 등) */}
      {!isMyPost && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.chatButton}>
            <Text style={styles.chatButtonText}>나눔 신청하기 (준비중)</Text>
          </TouchableOpacity>
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
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  headerDeleteIcon: {
    fontSize: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 360,
    width: '100%',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    marginTop: -24, // 이미지 위로 살짝 올라오게
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 24,
    lineHeight: 30,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  chatButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PostDetailScreen;
