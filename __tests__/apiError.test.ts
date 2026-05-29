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

  it('can prefer FastAPI detail for generate errors', () => {
    expect(
      getApiErrorMessage(
        {
          message: 'Request failed with status code 400',
          response: {
            data: {
              message: 'legacy generate error',
              detail:
                '게시할 수 없는 식재료입니다. 사유: 식재료가 부패한 상태입니다. 게시할 수 없습니다.',
            },
          },
        },
        'AI 분석에 실패했습니다.',
        {preferDetail: true},
      ),
    ).toBe('나눔 기준에 맞지 않아요. 다시 촬영해주세요.');
  });

  it('translates unsafe FastAPI detail into user-facing copy', () => {
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
    ).toBe('나눔 기준에 맞지 않아요. 다시 촬영해주세요.');
  });

  it('prefers structured AI rejection reasons over generic messages', () => {
    expect(
      getApiErrorMessage(
        {
          message: 'Request failed with status code 400',
          response: {
            data: {
              success: false,
              message: 'AI 분석에 실패했습니다.',
              error: {
                code: 'AI_REJECTED',
                rejectionReason: 'not_food',
              },
            },
          },
        },
        'AI 분석에 실패했습니다.',
      ),
    ).toBe('식재료 사진으로 확인되지 않았어요. 다시 촬영해주세요.');
  });

  it('prefers canonical AI rejection reasons over FastAPI detail for generate errors', () => {
    expect(
      getApiErrorMessage(
        {
          message: 'Request failed with status code 400',
          response: {
            data: {
              message: 'AI 분석에 실패했습니다.',
              detail:
                '게시할 수 없는 식재료입니다. 사유: 식재료가 부패한 상태입니다. 게시할 수 없습니다.',
              error: {
                code: 'AI_REJECTED',
                rejectionReason: 'not_food',
              },
            },
          },
        },
        'AI 분석에 실패했습니다.',
        {preferDetail: true},
      ),
    ).toBe('식재료 사진으로 확인되지 않았어요. 다시 촬영해주세요.');
  });

  it.each([
    ['stale', '나눔 기준에 맞지 않아요. 다시 촬영해주세요.'],
    ['low_quality', '사진으로 상태를 확인하기 어려워요. 다시 촬영해주세요.'],
    ['ui_screenshot', '식재료 사진으로 확인되지 않았어요. 다시 촬영해주세요.'],
  ])('maps AI rejection reason %s to safe copy', (reason, expected) => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            error: {
              code: 'AI_REJECTED',
              rejectionReason: reason,
            },
          },
        },
      }),
    ).toBe(expected);
  });

  it('keeps ordinary API messages ahead of non-blocking review reasons', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            message: '업로드 제한을 확인해주세요.',
            data: {
              reviewReason: 'low_quality',
            },
          },
        },
      }),
    ).toBe('업로드 제한을 확인해주세요.');
  });

  it('keeps ordinary API messages ahead of unscoped rejection reason fields', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            message: '요청 값을 확인해주세요.',
            rejectionReason: 'not_food',
            data: {
              aiAnalysis: {
                rejectionReason: 'low_quality',
              },
            },
          },
        },
      }),
    ).toBe('요청 값을 확인해주세요.');
  });

  it('falls back to server message for unknown structured AI rejection reasons', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            message: '이미지를 다시 확인해주세요.',
            error: {
              code: 'AI_REJECTED',
              rejectionReason: 'new_reason',
            },
          },
        },
      }),
    ).toBe('이미지를 다시 확인해주세요.');
  });

  it('does not translate unrelated messages that contain enum-like words', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            message: 'stale token',
          },
        },
      }),
    ).toBe('stale token');
    expect(
      getApiErrorMessage({
        response: {
          data: {
            message: 'not_food token',
          },
        },
      }),
    ).toBe('not_food token');
    expect(
      getApiErrorMessage({
        response: {
          data: {
            message: 'low_quality metric failed',
          },
        },
      }),
    ).toBe('low_quality metric failed');
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
