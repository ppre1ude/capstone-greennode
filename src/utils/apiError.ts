type ErrorWithResponse = {
  message?: unknown;
  response?: {
    data?: unknown;
  };
};

type ApiErrorMessageOptions = {
  preferDetail?: boolean;
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

const extractStringField = (
  value: unknown,
  field: string,
): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const fieldValue = value[field];
  return typeof fieldValue === 'string' && fieldValue.trim()
    ? fieldValue
    : null;
};

const extractStructuredAiRejectionReason = (data: unknown): string | null => {
  if (!isRecord(data)) {
    return null;
  }

  if (!isRecord(data.error) || data.error.code !== 'AI_REJECTED') {
    return null;
  }

  return extractStringField(data.error, 'rejectionReason');
};

const getAiRejectionReasonMessage = (reason: string): string | null => {
  switch (reason.toLowerCase()) {
    case 'stale':
      return '나눔 기준에 맞지 않아요. 다시 촬영해주세요.';
    case 'not_food':
    case 'non_food':
    case 'not-food':
    case 'non-food':
    case 'screenshot':
    case 'ui_screenshot':
    case 'ui-screenshot':
      return '식재료 사진으로 확인되지 않았어요. 다시 촬영해주세요.';
    case 'low_quality':
    case 'low-quality':
      return '사진으로 상태를 확인하기 어려워요. 다시 촬영해주세요.';
    default:
      return null;
  }
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

const extractDetailFromData = (data: unknown): string | null => {
  if (!isRecord(data)) {
    return null;
  }

  return extractDetailMessage(data.detail);
};

const normalizeDomainErrorMessage = (message: string): string => {
  const aiReasonMessage = getAiRejectionReasonMessage(message.trim());
  if (aiReasonMessage) {
    return aiReasonMessage;
  }

  if (/부패|상함|썩음|썩은|게시할 수 없는 식재료/.test(message)) {
    return '나눔 기준에 맞지 않아요. 다시 촬영해주세요.';
  }

  if (/식재료가 아닌/.test(message)) {
    return '식재료 사진으로 확인되지 않았어요. 다시 촬영해주세요.';
  }

  return message;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string = '서버 오류가 발생했습니다.',
  options: ApiErrorMessageOptions = {},
): string => {
  if (typeof error === 'string' && error.trim()) {
    return normalizeDomainErrorMessage(error);
  }

  const errorLike = isRecord(error) ? (error as ErrorWithResponse) : {};
  const structuredAiMessage = getAiRejectionReasonMessage(
    extractStructuredAiRejectionReason(errorLike.response?.data) ?? '',
  );
  if (structuredAiMessage) {
    return structuredAiMessage;
  }

  const responseMessage = options.preferDetail
    ? extractDetailFromData(errorLike.response?.data) ??
      extractMessageFromData(errorLike.response?.data)
    : extractMessageFromData(errorLike.response?.data);

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
