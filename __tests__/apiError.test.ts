import {getApiErrorMessage} from '@/utils/apiError';

describe('getApiErrorMessage', () => {
  it('uses API response message first', () => {
    expect(
      getApiErrorMessage({
        message: 'Request failed with status code 400',
        response: {
          data: {
            message: '이미지가 만료되었습니다.',
          },
        },
      }),
    ).toBe('이미지가 만료되었습니다.');
  });

  it('uses FastAPI detail when message is absent', () => {
    expect(
      getApiErrorMessage({
        message: 'Request failed with status code 400',
        response: {
          data: {
            detail:
              '게시할 수 없는 식재료입니다. 사유: 식재료가 부패한 상태입니다. 게시할 수 없습니다.',
          },
        },
      }),
    ).toBe(
      '게시할 수 없는 식재료입니다. 사유: 식재료가 부패한 상태입니다. 게시할 수 없습니다.',
    );
  });

  it('combines validation detail messages', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            detail: [
              {msg: '이미지는 필수입니다.'},
              {msg: '지원하지 않는 파일 형식입니다.'},
            ],
          },
        },
      }),
    ).toBe('이미지는 필수입니다.\n지원하지 않는 파일 형식입니다.');
  });

  it('keeps useful network errors', () => {
    expect(getApiErrorMessage(new Error('Network Error'))).toBe('Network Error');
  });

  it('handles string errors', () => {
    expect(getApiErrorMessage('업로드할 수 없는 이미지입니다.')).toBe(
      '업로드할 수 없는 이미지입니다.',
    );
  });

  it('does not show generic request failure messages', () => {
    expect(
      getApiErrorMessage(
        new Error('Request failed with status code 500'),
        '잠시 후 다시 시도해주세요.',
      ),
    ).toBe('잠시 후 다시 시도해주세요.');
  });
});
