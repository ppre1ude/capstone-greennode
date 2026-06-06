import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radius, spacing} from '@/theme';
import {DSText} from './Text';

export type DSChipVariant = 'solid' | 'outlined';
export type DSChipSize = 'xsmall' | 'small' | 'medium' | 'large';
export type DSChipTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

export interface DSChipProps
  extends Omit<TouchableOpacityProps, 'disabled' | 'style'> {
  label: string;
  variant?: DSChipVariant;
  size?: DSChipSize;
  tone?: DSChipTone;
  selected?: boolean;
  disabled?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const sizeConfig = {
  xsmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: 7,
    radius: 6,
    gap: 2,
    textVariant: 'small' as const,
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    radius: radius.sm,
    gap: 2,
    textVariant: 'small' as const,
  },
  medium: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    radius: 10,
    gap: 3,
    textVariant: 'caption' as const,
  },
  large: {
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    radius: 10,
    gap: 3,
    textVariant: 'bodyBold' as const,
  },
};

export const DSChip = ({
  label,
  variant = 'solid',
  size = 'medium',
  tone = 'neutral',
  selected = false,
  disabled = false,
  leading,
  trailing,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  ...props
}: DSChipProps) => {
  const config = sizeConfig[size];
  const solid = variant === 'solid';
  const toneColor =
    tone === 'primary'
      ? colors.primary
      : tone === 'success'
        ? colors.success
        : tone === 'warning'
          ? colors.warning
          : tone === 'error'
            ? colors.error
            : colors.textPrimary;
  const toneBackground =
    tone === 'primary'
      ? colors.primaryLight
      : tone === 'neutral'
        ? colors.surface
        : colors.surface;
  const contentColor = disabled
    ? 'textTertiary'
    : selected
      ? solid
        ? 'textOnPrimary'
        : 'primary'
      : tone === 'neutral'
        ? 'textPrimary'
        : tone;
  const backgroundColor = disabled
    ? solid
      ? colors.borderLight
      : 'transparent'
    : selected
      ? solid
        ? colors.primary
        : colors.primaryLight
      : solid
        ? toneBackground
        : tone === 'neutral'
          ? 'transparent'
          : toneBackground;
  const borderColor = disabled
    ? colors.borderLight
    : selected
      ? colors.primary
      : solid
        ? 'transparent'
        : tone === 'neutral'
          ? colors.border
          : toneColor;

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }
    onPress?.(event);
  };

  const content = (
    <>
      {leading && <View style={styles.side}>{leading}</View>}
      <DSText variant={config.textVariant} color={contentColor} style={textStyle}>
        {label}
      </DSText>
      {trailing && <View style={styles.side}>{trailing}</View>}
    </>
  );

  const containerStyle = [
    styles.base,
    {
      backgroundColor,
      borderColor,
      borderRadius: config.radius,
      gap: config.gap,
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
    },
    style,
  ];

  if (!onPress) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <TouchableOpacity
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{selected, disabled}}
      activeOpacity={0.82}
      disabled={disabled}
      onPress={handlePress}
      style={containerStyle}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  side: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
