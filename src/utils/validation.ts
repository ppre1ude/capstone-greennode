/**
 * 폼 유효성 검증 스키마 (zod)
 */
import {z} from 'zod';

/** 로그인 폼 스키마 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

/** 회원가입 폼 스키마 */
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email('올바른 이메일 형식이 아닙니다.'),
    nickname: z
      .string()
      .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
      .max(10, '닉네임은 최대 10자까지 가능합니다.'),
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)/,
        '비밀번호는 영문과 숫자를 포함해야 합니다.',
      ),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
