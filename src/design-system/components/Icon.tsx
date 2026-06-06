import React from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import FontAwesome6Icon, {
  FontAwesome6IconProps,
} from 'react-native-vector-icons/FontAwesome6';
import { colors } from '@/theme';
import type { ColorToken } from '@/theme';

export type DSIconName =
  | 'angle-left'
  | 'angle-right'
  | 'apple'
  | 'arrows-rotate'
  | 'bell'
  | 'bolt'
  | 'building'
  | 'camera'
  | 'check'
  | 'circle-check'
  | 'circle-exclamation'
  | 'circle'
  | 'clock'
  | 'clipboard-list'
  | 'comment'
  | 'envelope'
  | 'eye'
  | 'eye-slash'
  | 'flask'
  | 'gear'
  | 'gift'
  | 'gifts'
  | 'google'
  | 'headset'
  | 'heart'
  | 'house'
  | 'house-chimney'
  | 'image'
  | 'leaf'
  | 'location-crosshairs'
  | 'location-dot'
  | 'map-location-dot'
  | 'magnifying-glass'
  | 'qrcode'
  | 'rotate-right'
  | 'seedling'
  | 'temperature-half'
  | 'trash-can'
  | 'user'
  | 'wand-magic-sparkles'
  | 'xmark';

export type DSIconSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type DSIconVariant = 'regular' | 'solid' | 'brand';

export interface DSIconProps
  extends Omit<FontAwesome6IconProps, 'name' | 'size' | 'color' | 'style'> {
  name: DSIconName;
  size?: DSIconSize | number;
  color?: ColorToken | string;
  variant?: DSIconVariant;
  style?: StyleProp<TextStyle>;
}

const iconSizes: Record<DSIconSize, number> = {
  xsmall: 12,
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 36,
};

const resolveSize = (size: DSIconProps['size']) =>
  typeof size === 'number' ? size : iconSizes[size ?? 'medium'];

const resolveColor = (color: NonNullable<DSIconProps['color']>) =>
  color in colors ? colors[color as ColorToken] : color;

const getVariantProps = (
  variant: DSIconVariant,
): Partial<FontAwesome6IconProps> => {
  switch (variant) {
    case 'brand':
      return { brand: true };
    case 'solid':
      return { solid: true };
    case 'regular':
    default:
      return {};
  }
};

export const DSIcon = ({
  name,
  size = 'medium',
  color = 'textPrimary',
  variant = 'solid',
  style,
  accessibilityElementsHidden = true,
  importantForAccessibility = 'no',
  ...props
}: DSIconProps) => (
  <FontAwesome6Icon
    {...getVariantProps(variant)}
    {...props}
    accessibilityElementsHidden={accessibilityElementsHidden}
    color={resolveColor(color)}
    importantForAccessibility={importantForAccessibility}
    name={name}
    size={resolveSize(size)}
    style={[styles.icon, style]}
  />
);

const styles = StyleSheet.create({
  icon: {
    includeFontPadding: false,
    textAlign: 'center',
  },
});
