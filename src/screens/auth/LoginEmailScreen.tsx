/**
 * LoginEmailScreen — 이메일/비밀번호 로그인 입력 폼
 *
 * login.html → "이메일로 계속하기" 터치 후 진입
 * react-hook-form + zod 유효성 검증
 *
 * NOTE: 로그인 API: application/x-www-form-urlencoded, 필드명 'username'
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { loginSchema, type LoginFormData } from '@/utils/validation';
import { login, getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';
import { DSButton, DSIcon, DSTextField } from '@/design-system';

type Props = NativeStackScreenProps<AuthStackParamList, 'LoginEmail'>;

const LoginEmailScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setToken = useAuthStore(state => state.setToken);
  const setUser = useAuthStore(state => state.setUser);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await login(data.email, data.password);

      if (response.success && response.data) {
        await setToken(response.data.accessToken);

        // 유저 정보 가져오기
        const meResponse = await getMe();
        if (meResponse.success && meResponse.data) {
          setUser(meResponse.data);

          // 위치 유무에 따라 분기
          const rootNav = navigation.getParent();
          if (rootNav) {
            if (meResponse.data.latitude !== null) {
              rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
            } else {
              rootNav.reset({ index: 0, routes: [{ name: 'LocationSetup' }] });
            }
          }
        }

        // TODO: Phase 2에서 LocationSetup / Main 분기
      } else {
        Alert.alert(
          '로그인 실패',
          response.message || '이메일 또는 비밀번호를 확인해주세요.',
        );
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            onPress={() => navigation.goBack()}>
            <DSIcon name="angle-left" size="large" color="primary" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>로그인</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* 인트로 */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            다시 만나서 반가워요!{'\n'}
            <Text style={styles.introHighlight}>이메일</Text>로 로그인해 주세요.
          </Text>
        </View>

        {/* 폼 */}
        <View style={styles.form}>
          {/* 이메일 */}
          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <DSTextField
                  label="이메일 주소"
                  status={errors.email ? 'error' : 'normal'}
                  caption={errors.email?.message}
                  inputContainerStyle={styles.input}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <DSTextField
                  label="비밀번호"
                  status={errors.password ? 'error' : 'normal'}
                  caption={errors.password?.message}
                  inputContainerStyle={styles.input}
                  placeholder="비밀번호를 입력해주세요"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  trailing={
                    <TouchableOpacity
                      style={styles.eyeButton}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                      }
                      onPress={() => setShowPassword(!showPassword)}>
                      <DSIcon
                        name={showPassword ? 'eye-slash' : 'eye'}
                        size="medium"
                        color="textTertiary"
                        style={styles.eyeIcon}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />
          </View>
        </View>

        {/* CTA */}
        <DSButton
          label={isLoading ? '' : '로그인'}
          accessibilityLabel="로그인"
          loading={isLoading}
          loadingLabel=""
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />

        {/* 회원가입 링크 */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 장식 요소 */}
      <View style={styles.decoBottom} />
      <View style={styles.decoTop} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
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
  // 회원가입 링크
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 40,
  },
  signupText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signupLink: {
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

export default LoginEmailScreen;
