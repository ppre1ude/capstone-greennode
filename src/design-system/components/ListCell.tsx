import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '@/theme';
import { DSIcon } from './Icon';
import { DSText } from './Text';

export type DSListCellPadding = 'none' | 'small' | 'medium' | 'large';

export interface DSListCellProps
  extends Omit<TouchableOpacityProps, 'disabled' | 'style'> {
  title: string;
  caption?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  selected?: boolean;
  disabled?: boolean;
  divider?: boolean;
  verticalPadding?: DSListCellPadding;
  titleNumberOfLines?: number;
  captionNumberOfLines?: number;
  style?: StyleProp<ViewStyle>;
}

const verticalPadding = {
  none: 0,
  small: spacing.sm,
  medium: spacing.md,
  large: spacing.lg,
};

export const DSListCell = ({
  title,
  caption,
  leading,
  trailing,
  chevron = false,
  selected = false,
  disabled = false,
  divider = false,
  verticalPadding: padding = 'medium',
  titleNumberOfLines = 2,
  captionNumberOfLines = 2,
  onPress,
  style,
  accessibilityLabel,
  ...props
}: DSListCellProps) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }
    onPress?.(event);
  };

  const content = (
    <>
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.body}>
        <DSText
          variant="body"
          color={selected ? 'primary' : 'textPrimary'}
          numberOfLines={titleNumberOfLines}>
          {title}
        </DSText>
        {caption ? (
          <DSText
            variant="small"
            color="textSecondary"
            numberOfLines={captionNumberOfLines}>
            {caption}
          </DSText>
        ) : null}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
      {chevron && (
        <DSIcon
          name="angle-right"
          size="small"
          color="textTertiary"
          style={styles.chevron}
        />
      )}
    </>
  );

  const containerStyle = [
    styles.container,
    divider ? styles.divider : null,
    disabled ? styles.disabled : null,
    { paddingVertical: verticalPadding[padding] },
    style,
  ];

  if (!onPress) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <TouchableOpacity
      {...props}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      activeOpacity={0.86}
      disabled={disabled}
      onPress={handlePress}
      style={containerStyle}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  divider: {
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    lineHeight: 24,
  },
});
