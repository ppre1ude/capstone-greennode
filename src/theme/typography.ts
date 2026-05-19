/**
 * FoodLink 디자인 시스템 — 타이포그래피 토큰
 * @see docs/DESIGN_SYSTEM.md
 */
import {TextStyle} from 'react-native';

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extraBold: 'Pretendard-ExtraBold',
  black: 'Pretendard-Black',
} as const;

export const fontSize = {
  micro: 9,
  tiny: 10,
  small: 11,
  caption: 13,
  body: 15,
  subtitle: 16,
  heading4: 18,
  heading3: 20,
  heading2: 24,
  heading1: 26,
  display: 30,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const textStyles = {
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.heading1,
    lineHeight: fontSize.heading1 * lineHeight.tight,
  },
  heading2: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.heading2,
    lineHeight: fontSize.heading2 * lineHeight.tight,
  },
  heading3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.heading3,
    lineHeight: fontSize.heading3 * lineHeight.tight,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * lineHeight.relaxed,
  },
  bodyBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * lineHeight.relaxed,
  },
  caption: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * lineHeight.normal,
  },
  small: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * lineHeight.normal,
  },
  tiny: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.tiny,
    lineHeight: fontSize.tiny * lineHeight.normal,
  },
} satisfies Record<string, TextStyle>;

export type TextStyleToken = keyof typeof textStyles;
