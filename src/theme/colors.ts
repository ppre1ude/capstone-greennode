/**
 * FoodLink 디자인 시스템 — 컬러 토큰
 *
 * 메인 컬러: #1E623B
 * 서브 컬러: #628E4E, #ABB863, #FCE181
 * 배경: 흰색(#FFFFFF) 또는 소프트 그레이(#F5F5F5)
 *
 * @see docs/DESIGN_SYSTEM.md
 */

export const colors = {
  // ── Primary (브랜드 메인) ──────────────────────
  primary: '#1E623B',
  primaryDark: '#164A2C',
  primaryLight: '#E8F5E9',

  // ── Secondary (서브 컬러) ──────────────────────
  secondary: '#628E4E',
  accent: '#ABB863',
  highlight: '#FCE181',

  // ── Neutral (배경 / 표면) ──────────────────────
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E9ECEF',
  borderLight: '#F0F0F0',

  // ── Text ───────────────────────────────────────
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textPlaceholder: '#CCCCCC',
  textOnPrimary: '#FFFFFF',

  // ── Semantic ───────────────────────────────────
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Special (소셜 로그인 등) ───────────────────
  kakao: '#FEE500',
  kakaoText: '#191919',

  // ── Overlay / Transparency ────────────────────
  overlay: 'rgba(0, 0, 0, 0.20)',
  glassBg: 'rgba(255, 255, 255, 0.90)',
  primaryShadow: 'rgba(30, 98, 59, 0.30)',
  highlightGlow: 'rgba(252, 225, 129, 0.50)',
} as const;

export type ColorToken = keyof typeof colors;
