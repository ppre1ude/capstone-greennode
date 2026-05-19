import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native';
import {colors, textStyles} from '@/theme';
import type {ColorToken, TextStyleToken} from '@/theme';

export type DSTextVariant = TextStyleToken;

export interface DSTextProps extends RNTextProps {
  variant?: DSTextVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

export const DSText = ({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  children,
  ...props
}: DSTextProps) => (
  <RNText
    {...props}
    style={[
      textStyles[variant],
      {color: colors[color]},
      align ? {textAlign: align} : null,
      style,
    ]}>
    {children}
  </RNText>
);
