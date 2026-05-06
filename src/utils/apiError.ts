type ErrorWithResponse = {
  message?: unknown;
  response?: {
    data?: unknown;
  };
};

const GENERIC_REQUEST_FAILURE = /^Request failed with status code \d+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractDetailMessage = (detail: unknown): string | null => {
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (isRecord(item) && typeof item.msg === 'string') {
          return item.msg;
        }
        return null;
      })
      .filter((message): message is string => Boolean(message?.trim()));

    return messages.length > 0 ? messages.join('\n') : null;
  }

  if (isRecord(detail) && typeof detail.message === 'string') {
    return detail.message;
  }

  return null;
};

const extractMessageFromData = (data: unknown): string | null => {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (!isRecord(data)) {
    return null;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return extractDetailMessage(data.detail);
};

const normalizeDomainErrorMessage = (message: string): string => {
  if (/부패|상함|썩음|썩은|게시할 수 없는 식재료/.test(message)) {
    return '나눔 기준에 맞지 않아요. 다시 촬영해주세요.';
  }

  if (/식재료가 아닌|not_food|non_food/.test(message)) {
    return '식재료 사진으로 확인되지 않았어요. 다시 촬영해주세요.';
  }

  if (/low_quality|low-quality/.test(message)) {
    return '사진으로 상태를 확인하기 어려워요. 다시 촬영해주세요.';
  }

  return message;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string = '서버 오류가 발생했습니다.',
): string => {
  if (typeof error === 'string' && error.trim()) {
    return normalizeDomainErrorMessage(error);
  }

  const errorLike = isRecord(error) ? (error as ErrorWithResponse) : {};
  const responseMessage = extractMessageFromData(errorLike.response?.data);

  if (responseMessage) {
    return normalizeDomainErrorMessage(responseMessage);
  }

  if (
    typeof errorLike.message === 'string' &&
    errorLike.message.trim() &&
    !GENERIC_REQUEST_FAILURE.test(errorLike.message)
  ) {
    return normalizeDomainErrorMessage(errorLike.message);
  }

  return fallback;
};
