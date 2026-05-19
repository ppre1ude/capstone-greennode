import {getQrVerificationErrorMessage} from '@/features/qr';

describe('getQrVerificationErrorMessage', () => {
  it('maps backend QR verification HTTP statuses to UX copy', () => {
    expect(getQrVerificationErrorMessage(400)).toBe(
      '유효하지 않은 QR 코드입니다.',
    );
    expect(getQrVerificationErrorMessage(403)).toBe(
      '이 식재료의 신청자가 아닙니다.',
    );
    expect(getQrVerificationErrorMessage(404)).toBe(
      '해당 냉장고를 찾을 수 없습니다.',
    );
    expect(getQrVerificationErrorMessage(409)).toBe(
      '이미 수거 완료된 식재료입니다.',
    );
    expect(getQrVerificationErrorMessage(410)).toBe(
      '보관 기한이 만료된 식재료입니다.',
    );
  });

  it('falls back for unknown QR verification failures', () => {
    expect(getQrVerificationErrorMessage(500)).toBe(
      'QR 인증에 실패했습니다. 잠시 후 다시 시도해주세요.',
    );
    expect(getQrVerificationErrorMessage(null)).toBe(
      'QR 인증에 실패했습니다. 잠시 후 다시 시도해주세요.',
    );
  });
});
