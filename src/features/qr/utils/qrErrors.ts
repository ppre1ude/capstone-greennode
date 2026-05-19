const QR_VERIFICATION_ERROR_MESSAGES: Record<number, string> = {
  400: '유효하지 않은 QR 코드입니다.',
  403: '이 식재료의 신청자가 아닙니다.',
  404: '해당 냉장고를 찾을 수 없습니다.',
  409: '이미 수거 완료된 식재료입니다.',
  410: '보관 기한이 만료된 식재료입니다.',
};

export const getQrVerificationErrorMessage = (
  status?: number | null,
): string =>
  status && QR_VERIFICATION_ERROR_MESSAGES[status]
    ? QR_VERIFICATION_ERROR_MESSAGES[status]
    : 'QR 인증에 실패했습니다. 잠시 후 다시 시도해주세요.';
