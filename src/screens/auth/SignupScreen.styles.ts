import { StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    marginTop: Platform.OS === 'ios' ? 44 : 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: { width: 40 },
  // 인트로
  intro: {
    marginTop: 32,
    marginBottom: 40,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 34,
  },
  introHighlight: {
    color: colors.primary,
  },
  // 폼
  form: {
    gap: 24,
  },
  fieldGroup: {},
  input: {
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  eyeButton: {
    minHeight: 40,
    minWidth: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  // 약관
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    paddingHorizontal: 4,
  },
  termsCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsCheckIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.textTertiary,
  },
  termsBold: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // CTA
  submitButton: {
    minHeight: 60,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  // 로그인 링크
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  // 장식
  decoBottom: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.highlight,
    opacity: 0.15,
  },
  decoTop: {
    position: 'absolute',
    top: 160,
    left: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.accent,
    opacity: 0.1,
  },
});
