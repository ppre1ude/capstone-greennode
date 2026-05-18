/**
 * LoginScreen — 로그인 방식 선택
 *
 * 소셜 로그인 버튼 (카카오, Apple, Google) + 이메일 로그인
 * 현재 MVP에서는 이메일만 동작, 소셜은 "준비 중" Alert
 *
 * @wireframe wireframe-foodlink/login.html
 */
import React from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { DSButton, DSText } from '@/design-system';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const handleSocialLogin = (provider: string) => {
    Alert.alert('준비 중', `${provider} 로그인은 추후 지원 예정입니다.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 인사 헤더 */}
      <View style={styles.header}>
        <DSText variant="heading2" style={styles.greeting}>
          반가워요!{'\n'}푸드링크입니다
        </DSText>
        <DSText variant="body" color="textTertiary" style={styles.subtitle}>
          이웃과 함께하는 신선한 나눔을 시작해보세요.
        </DSText>
      </View>

      {/* 로그인 버튼들 */}
      <View style={styles.buttonGroup}>
        {/* 카카오 */}
        <DSButton
          label="카카오로 계속하기"
          color="kakao"
          leading={<DSText style={styles.kakaoIcon}>💬</DSText>}
          style={styles.kakaoButton}
          contentStyle={styles.buttonContent}
          textStyle={styles.kakaoText}
          onPress={() => handleSocialLogin('카카오')}
        />

        {/* Apple */}
        <DSButton
          label="Apple로 계속하기"
          leading={
            <DSText color="textOnPrimary" style={styles.appleIcon}>
              🍎
            </DSText>
          }
          style={styles.appleButton}
          contentStyle={styles.buttonContent}
          textStyle={styles.appleText}
          onPress={() => handleSocialLogin('Apple')}
        />

        {/* Google */}
        <DSButton
          label="구글로 계속하기"
          variant="outlined"
          color="assistive"
          leading={<DSText style={styles.googleIcon}>G</DSText>}
          style={styles.googleButton}
          contentStyle={styles.buttonContent}
          textStyle={styles.googleText}
          onPress={() => handleSocialLogin('Google')}
        />

        {/* 이메일 */}
        <DSButton
          label="이메일로 계속하기"
          variant="outlined"
          color="assistive"
          leading={<DSText style={styles.emailIcon}>✉️</DSText>}
          style={styles.emailButton}
          contentStyle={styles.buttonContent}
          textStyle={styles.emailText}
          onPress={() => navigation.navigate('LoginEmail')}
        />
      </View>

      {/* 하단 약관 + 지원 */}
      <View style={styles.termsSection}>
        <View style={styles.termsRow}>
          <View style={styles.checkbox}>
            <DSText style={styles.checkIcon}>✓</DSText>
          </View>
          <DSText
            variant="caption"
            color="textTertiary"
            style={styles.termsText}>
            이용약관, 개인정보 처리방침, 위치기반 서비스 이용약관에 모두
            동의합니다.
          </DSText>
        </View>

        <DSButton
          label="로그인에 문제가 있나요?"
          variant="text"
          color="assistive"
          size="small"
          style={styles.supportLink}
          textStyle={styles.supportText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 48,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textTertiary,
    lineHeight: 22,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 40,
  },
  buttonContent: {
    gap: 12,
  },
  // 카카오
  kakaoButton: {
    height: 56,
    backgroundColor: colors.kakao,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  kakaoIcon: { fontSize: 18 },
  kakaoText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.kakaoText,
  },
  // Apple
  appleButton: {
    height: 56,
    backgroundColor: '#000000',
    borderColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  appleIcon: { fontSize: 20 },
  appleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Google
  googleButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  // 이메일
  emailButton: {
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emailIcon: { fontSize: 16 },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  // 약관
  termsSection: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  supportLink: {
    alignItems: 'center',
  },
  supportText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
