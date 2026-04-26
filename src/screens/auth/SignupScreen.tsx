/**
 * SignupScreen — 회원가입 폼
 *
 * 이메일 + 닉네임 + 비밀번호 + 비밀번호 확인
 * react-hook-form + zod 유효성 검증
 * 가입 성공 시 자동 로그인 처리
 *
 * @wireframe wireframe-foodlink/login-input.html
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '@/navigation/types';
import {signupSchema, type SignupFormData} from '@/utils/validation';
import {signup, login, getMe} from '@/api/auth';
import {useAuthStore} from '@/store/authStore';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SignupScreen = ({navigation}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setToken = useAuthStore(state => state.setToken);
  const setUser = useAuthStore(state => state.setUser);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // 1. 회원가입
      const signupRes = await signup({
        email: data.email,
        nickname: data.nickname,
        password: data.password,
      });

      if (!signupRes.success) {
        Alert.alert('가입 실패', signupRes.message || '회원가입에 실패했습니다.');
        return;
      }

      // 2. 자동 로그인
      const loginRes = await login(data.email, data.password);
      if (loginRes.success && loginRes.data) {
        await setToken(loginRes.data.accessToken);

        // 3. 유저 정보 가져오기
        const meRes = await getMe();
        if (meRes.success && meRes.data) {
          setUser(meRes.data);
        }

        // 회원가입 직후 → 항상 LocationSetup
        const rootNav = navigation.getParent();
        if (rootNav) {
          rootNav.reset({index: 0, routes: [{name: 'LocationSetup'}]});
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        '서버에 연결할 수 없습니다.';
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>회원가입</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* 인트로 */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            반가워요!{'\n'}
            <Text style={styles.introHighlight}>회원정보</Text>를 입력해 주세요.
          </Text>
        </View>

        {/* 폼 */}
        <View style={styles.form}>
          {/* 이메일 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>이메일 주소</Text>
            <Controller
              control={control}
              name="email"
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* 닉네임 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>닉네임</Text>
            <Controller
              control={control}
              name="nickname"
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  style={[styles.input, errors.nickname && styles.inputError]}
                  placeholder="닉네임을 입력해주세요"
                  placeholderTextColor={colors.textPlaceholder}
                  autoCapitalize="none"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.nickname ? (
              <Text style={styles.errorText}>{errors.nickname.message}</Text>
            ) : (
              <Text style={styles.hintText}>2~10자, 한글/영문/숫자 가능</Text>
            )}
          </View>

          {/* 비밀번호 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordWrapper}>
              <Controller
                control={control}
                name="password"
                render={({field: {onChange, onBlur, value}}) => (
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password && styles.inputError,
                    ]}
                    placeholder="8자 이상 입력해주세요"
                    placeholderTextColor={colors.textPlaceholder}
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <Controller
              control={control}
              name="passwordConfirm"
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.passwordConfirm && styles.inputError,
                  ]}
                  placeholder="비밀번호를 한번 더 입력해주세요"
                  placeholderTextColor={colors.textPlaceholder}
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.passwordConfirm && (
              <Text style={styles.errorText}>
                {errors.passwordConfirm.message}
              </Text>
            )}
          </View>
        </View>

        {/* 약관 동의 */}
        <View style={styles.termsRow}>
          <View style={styles.termsCheck}>
            <Text style={styles.termsCheckIcon}>✓</Text>
          </View>
          <Text style={styles.termsText}>
            <Text style={styles.termsBold}>이용약관 및 개인정보 처리방침</Text>에
            동의합니다.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>가입하기</Text>
          )}
        </TouchableOpacity>

        {/* 로그인 링크 */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LoginEmail')}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 장식 */}
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
  backIcon: {
    fontSize: 22,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {width: 40},
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
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 4,
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
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
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

export default SignupScreen;
