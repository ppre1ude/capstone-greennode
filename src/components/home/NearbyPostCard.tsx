/**
 * NearbyPostCard — 근처 나눔 식재료 카드 컴포넌트
 *
 * 홈 화면 피드에서 사용하는 재사용 카드
 * 이미지 + 상태 뱃지 + 제목 + 위치 + 시간
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import type { Post } from '@/types';
import { getImageUrl } from '@/api/posts';
import { colors } from '@/theme';
import {
  getConfidencePercent,
  getPostDisplayName,
  getPostStatusLabel,
  getQualityMeta,
} from '@/utils/postPolicy';

interface Props {
  post: Post;
  onPress: () => void;
}

const NearbyPostCard = ({ post, onPress }: Props) => {
  const displayName = getPostDisplayName(post);
  const quality = getQualityMeta(post.freshnessLabel);
  const confidencePercent = getConfidencePercent(post.confidenceScore);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* 이미지 */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl(post.imageUrl) }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* 상태 뱃지 */}
        <View style={styles.freshBadge}>
          <View style={styles.freshDot} />
          <Text style={styles.freshText}>
            {getPostStatusLabel(post.status)}
          </Text>
        </View>
      </View>

      {/* 텍스트 정보 */}
      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={styles.category}>{quality.label}</Text>
          <Text style={styles.time}>방금 전</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {confidencePercent != null
            ? `AI 신뢰도 ${confidencePercent}%`
            : '근처 공유 냉장고'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  freshBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  freshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  freshText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  time: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  location: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default NearbyPostCard;
