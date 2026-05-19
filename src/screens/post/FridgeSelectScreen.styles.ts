import {StyleSheet, Platform} from 'react-native';
import {colors} from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 44 : 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerIcon: {
    fontSize: 22,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {width: 40},
  content: {
    flex: 1,
    paddingTop: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 32,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  highlight: {
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 15,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorSubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 20,
  },
  fridgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fridgeCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  fridgeInfo: {
    flex: 1,
  },
  fridgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fridgeAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fridgeDistance: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  textSelected: {
    color: '#FFFFFF',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  radioSelected: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  submitButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  qrSubmitButton: {
    height: 52,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSubmitButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
});
