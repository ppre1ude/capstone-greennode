/**
 * NearbyPostCard — 근처 나눔 식재료 카드 컴포넌트
 *
 * 홈 화면 피드에서 사용하는 재사용 카드
 * 이미지 + 상태 뱃지 + 제목 + 위치 + 시간
 */
import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import type { PostNearbyRead } from '@/types';
import { getImageUrl } from '@/api/posts';
import { colors } from '@/theme';
import {DSCard, DSChip, DSIcon, DSText} from '@/design-system';
import {
  getPostDisplayName,
  getPostRelativeTimeLabel,
  getPostStatusLabel,
  getQualityMeta,
} from '@/utils/postPolicy';

interface Props {
  post: PostNearbyRead;
  onPress: () => void;
}

const NearbyPostCard = ({ post, onPress }: Props) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const displayName = getPostDisplayName(post);
  const quality = getQualityMeta(post.freshnessLabel);

  React.useEffect(() => {
    setImageFailed(false);
  }, [post.imageUrl]);

  return (
    <DSCard
      variant="outlined"
      padded={false}
      onPress={onPress}
      style={styles.card}>
      {/* 이미지 */}
      <View
        style={[styles.imageContainer, imageFailed && styles.imageFallback]}>
        {imageFailed ? (
          <View
            testID="nearby-post-thumbnail-fallback"
            style={styles.imageFallbackContent}>
            <DSIcon name="image" size="large" color="primary" />
          </View>
        ) : (
          <Image
            source={{ uri: getImageUrl(post.imageUrl) }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        )}
        {/* 상태 뱃지 */}
        <DSChip
          label={getPostStatusLabel(post.status)}
          size="xsmall"
          variant="solid"
          leading={<View style={styles.freshDot} />}
          style={styles.freshBadge}
        />
      </View>

      {/* 텍스트 정보 */}
      <View style={styles.info}>
        <View style={styles.infoTop}>
          <DSChip
            label={quality.label}
            size="xsmall"
            variant="outlined"
            tone="primary"
            style={styles.category}
          />
          <DSText variant="small" color="textTertiary">
            {getPostRelativeTimeLabel(post.createdAt)}
          </DSText>
        </View>
        <DSText variant="bodyBold" color="textPrimary" numberOfLines={1}>
          {displayName}
        </DSText>
        <DSText variant="small" color="textTertiary" numberOfLines={1}>
          {post.fridgeName || '근처 공유 냉장고'}
        </DSText>
      </View>
    </DSCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
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
  imageFallback: {
    backgroundColor: colors.primaryLight,
  },
  imageFallbackContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.72,
  },
  freshBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.glassBg,
    borderColor: 'transparent',
  },
  freshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
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
    borderRadius: 6,
  },
});

export default NearbyPostCard;
