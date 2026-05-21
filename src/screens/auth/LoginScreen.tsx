/**
 * LoginScreen — 로그인 방식 선택
 *
 * MVP에서는 이메일 로그인을 유일한 진입점으로 제공한다.
 *
 * @wireframe wireframe-foodlink/login.html
 */
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { DSButton, DSIcon, DSText } from '@/design-system';
import { colors } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
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
        {/* 이메일 */}
        <DSButton
          label="이메일로 계속하기"
          variant="outlined"
          color="assistive"
          leading={
            <DSIcon
              name="envelope"
              variant="regular"
              size="small"
              color="textSecondary"
            />
          }
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
            <DSIcon name="check" size="xsmall" color="#CBD5E1" />
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
