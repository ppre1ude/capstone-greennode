/**
 * FoodLink 디자인 시스템 — 스페이싱 & 레이아웃 토큰
 * @see docs/DESIGN_SYSTEM.md
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const layout = {
  pagePaddingH: spacing.xl,    // 좌우 20px
  tabBarHeight: 84,
  fabSize: 56,
  buttonHeightLg: 60,
  buttonHeightMd: 48,
  inputHeight: 52,
  headerHeight: 56,
} as const;
