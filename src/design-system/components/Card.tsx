import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import {colors, radius, spacing} from '@/theme';

export type DSCardVariant = 'elevated' | 'outlined' | 'plain';

export interface DSCardProps
  extends Omit<TouchableOpacityProps, 'disabled' | 'style' | 'onPress'> {
  variant?: DSCardVariant;
  padded?: boolean;
  onPress?: TouchableOpacityProps['onPress'];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const variantStyle = (variant: DSCardVariant) => {
  switch (variant) {
    case 'plain':
      return styles.plain;
    case 'outlined':
      return styles.outlined;
    case 'elevated':
    default:
      return styles.elevated;
  }
};

export const DSCard = ({
  variant = 'elevated',
  padded = true,
  onPress,
  disabled = false,
  style,
  children,
  ...props
}: DSCardProps) => {
  const contentStyle = [
    styles.base,
    variantStyle(variant),
    padded ? styles.padded : null,
    disabled ? styles.disabled : null,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        {...props}
        accessibilityRole="button"
        accessibilityState={{disabled}}
        activeOpacity={0.86}
        disabled={disabled}
        onPress={onPress}
        style={contentStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View {...(props as ViewProps)} style={contentStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.md,
  },
  elevated: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  outlined: {
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  plain: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
