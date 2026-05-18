import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import {colors, layout, radius, spacing} from '@/theme';
import {DSText} from './Text';

export type DSButtonVariant = 'solid' | 'outlined' | 'text';
export type DSButtonColor = 'primary' | 'assistive' | 'danger' | 'kakao';
export type DSButtonSize = 'large' | 'medium' | 'small';

export interface DSButtonProps
  extends Omit<TouchableOpacityProps, 'disabled' | 'style'> {
  label: string;
  variant?: DSButtonVariant;
  color?: DSButtonColor;
  size?: DSButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

type ButtonTone = {
  backgroundColor: string;
  borderColor: string;
  contentColor: keyof typeof colors;
  indicatorColor: string;
};

const solidTone = (color: DSButtonColor, disabled: boolean): ButtonTone => {
  if (disabled) {
    return {
      backgroundColor: colors.border,
      borderColor: colors.border,
      contentColor: 'textTertiary',
      indicatorColor: colors.textTertiary,
    };
  }

  switch (color) {
    case 'assistive':
      return {
        backgroundColor: colors.surface,
        borderColor: colors.surface,
        contentColor: 'textSecondary',
        indicatorColor: colors.textSecondary,
      };
    case 'danger':
      return {
        backgroundColor: colors.error,
        borderColor: colors.error,
        contentColor: 'textOnPrimary',
        indicatorColor: colors.textOnPrimary,
      };
    case 'kakao':
      return {
        backgroundColor: colors.kakao,
        borderColor: colors.kakao,
        contentColor: 'kakaoText',
        indicatorColor: colors.kakaoText,
      };
    case 'primary':
    default:
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        contentColor: 'textOnPrimary',
        indicatorColor: colors.textOnPrimary,
      };
  }
};

const outlinedTone = (color: DSButtonColor, disabled: boolean): ButtonTone => {
  if (disabled) {
    return {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      contentColor: 'textTertiary',
      indicatorColor: colors.textTertiary,
    };
  }

  if (color === 'danger') {
    return {
      backgroundColor: 'transparent',
      borderColor: colors.error,
      contentColor: 'error',
      indicatorColor: colors.error,
    };
  }

  return {
    backgroundColor: 'transparent',
    borderColor: color === 'assistive' ? colors.border : colors.primary,
    contentColor: color === 'assistive' ? 'textSecondary' : 'primary',
    indicatorColor: color === 'assistive' ? colors.textSecondary : colors.primary,
  };
};

const textTone = (color: DSButtonColor, disabled: boolean): ButtonTone => {
  const outlined = outlinedTone(color, disabled);
  return {
    ...outlined,
    borderColor: 'transparent',
  };
};

const getTone = (
  variant: DSButtonVariant,
  color: DSButtonColor,
  disabled: boolean,
) => {
  switch (variant) {
    case 'outlined':
      return outlinedTone(color, disabled);
    case 'text':
      return textTone(color, disabled);
    case 'solid':
    default:
      return solidTone(color, disabled);
  }
};

const sizeStyle = (size: DSButtonSize, variant: DSButtonVariant) => {
  if (variant === 'text') {
    return styles.textButtonSize;
  }

  switch (size) {
    case 'small':
      return styles.small;
    case 'medium':
      return styles.medium;
    case 'large':
    default:
      return styles.large;
  }
};

const textVariant = (size: DSButtonSize) =>
  size === 'small' ? 'caption' : 'bodyBold';

export const DSButton = ({
  label,
  variant = 'solid',
  color = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  loadingLabel = '처리 중',
  leading,
  trailing,
  fullWidth = false,
  onPress,
  style,
  contentStyle,
  textStyle,
  accessibilityLabel,
  ...props
}: DSButtonProps) => {
  const isDisabled = disabled || loading;
  const tone = getTone(variant, color, isDisabled);

  const handlePress: TouchableOpacityProps['onPress'] = event => {
    if (isDisabled) {
      return;
    }
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      activeOpacity={0.82}
      disabled={isDisabled}
      onPress={handlePress}
      style={[
        styles.base,
        sizeStyle(size, variant),
        fullWidth ? styles.fullWidth : null,
        {
          backgroundColor: tone.backgroundColor,
          borderColor: tone.borderColor,
        },
        style,
      ]}>
      <View style={[styles.content, contentStyle]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={tone.indicatorColor}
            style={styles.leading}
          />
        ) : (
          leading && <View style={styles.leading}>{leading}</View>
        )}
        <DSText
          variant={textVariant(size)}
          color={tone.contentColor}
          style={[styles.label, textStyle]}>
          {label}
        </DSText>
        {loading ? (
          <DSText variant="small" color={tone.contentColor} style={styles.loading}>
            {loadingLabel}
          </DSText>
        ) : (
          trailing && <View style={styles.trailing}>{trailing}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  large: {
    minHeight: layout.buttonHeightLg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
  },
  medium: {
    minHeight: layout.buttonHeightMd,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  small: {
    minHeight: 36,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  textButtonSize: {
    minHeight: 32,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  label: {
    includeFontPadding: false,
  },
  leading: {
    marginRight: spacing.xs,
  },
  trailing: {
    marginLeft: spacing.xs,
  },
  loading: {
    marginLeft: spacing.xs,
  },
});
