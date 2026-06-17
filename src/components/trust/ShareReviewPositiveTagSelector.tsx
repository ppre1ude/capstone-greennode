import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DSChip, DSIcon } from '@/design-system';
import {
  SHARE_REVIEW_POSITIVE_TAGS,
  type ShareReviewPositiveTagId,
} from '@/features/trust/review';
import { colors, fontFamily, radius, spacing } from '@/theme';

type Props = {
  selectedIds: ShareReviewPositiveTagId[];
  onToggle: (tagId: ShareReviewPositiveTagId) => void;
};

const TOUCH_TARGET_HIT_SLOP = {
  bottom: 2,
  left: 2,
  right: 2,
  top: 2,
} as const;

const ShareReviewPositiveTagSelector = ({ selectedIds, onToggle }: Props) => (
  <View style={styles.wrap}>
    {SHARE_REVIEW_POSITIVE_TAGS.map(tag => {
      const selected = selectedIds.includes(tag.id);

      return (
        <DSChip
          key={tag.id}
          label={tag.label}
          selected={selected}
          tone="neutral"
          variant="outlined"
          hitSlop={TOUCH_TARGET_HIT_SLOP}
          leading={
            selected ? (
              <DSIcon name="check" size="xsmall" color="primary" />
            ) : null
          }
          onPress={() => onToggle(tag.id)}
          style={[styles.tag, selected ? styles.tagSelected : null]}
          textStyle={[styles.label, selected ? styles.labelSelected : null]}
        />
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    minHeight: 40,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primaryDark,
  },
});

export default ShareReviewPositiveTagSelector;
