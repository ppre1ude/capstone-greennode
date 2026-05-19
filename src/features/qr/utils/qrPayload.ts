import type { QrPayloadParseResult, QrPayloadSource } from '../types';

const FOODLINK_DEEP_LINK_PROTOCOL = 'foodlink:';
const FOODLINK_DEEP_LINK_HOST = 'fridges';
const FOODLINK_HTTPS_HOST = 'foodlink.app';
const MAX_PUBLIC_CODE_LENGTH = 80;
const PUBLIC_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export const isValidFridgePublicCode = (publicCode: string): boolean => {
  const normalizedCode = publicCode.trim();

  return (
    normalizedCode.length > 0 &&
    normalizedCode.length <= MAX_PUBLIC_CODE_LENGTH &&
    PUBLIC_CODE_PATTERN.test(normalizedCode)
  );
};

const makeTarget = (
  fridgePublicCode: string,
  source: QrPayloadSource,
): QrPayloadParseResult => {
  if (!isValidFridgePublicCode(fridgePublicCode)) {
    return { valid: false, reason: 'invalid-public-code' };
  }

  return {
    valid: true,
    target: {
      type: 'fridge-verification',
      fridgePublicCode,
      source,
    },
  };
};

const pathSegments = (pathname: string): string[] =>
  pathname.split('/').filter(Boolean);

export const parseFoodLinkQrPayload = (
  payload: string,
): QrPayloadParseResult => {
  const normalizedPayload = payload.trim();

  if (!normalizedPayload) {
    return { valid: false, reason: 'empty' };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedPayload);
  } catch {
    return { valid: false, reason: 'unsupported-url' };
  }

  const segments = pathSegments(parsedUrl.pathname);

  if (
    parsedUrl.protocol === FOODLINK_DEEP_LINK_PROTOCOL &&
    parsedUrl.hostname.toLowerCase() === FOODLINK_DEEP_LINK_HOST &&
    segments.length === 2 &&
    segments[1] === 'verify'
  ) {
    return makeTarget(segments[0], 'deep-link');
  }

  if (
    parsedUrl.protocol === 'https:' &&
    parsedUrl.hostname.toLowerCase() === FOODLINK_HTTPS_HOST &&
    segments.length === 3 &&
    segments[0] === 'q' &&
    segments[1] === 'fridges'
  ) {
    return makeTarget(segments[2], 'https');
  }

  return { valid: false, reason: 'unsupported-url' };
};

export const buildFridgeQrVerificationUrl = (
  baseUrl: string,
  fridgePublicCode: string,
): string => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPublicCode = fridgePublicCode.trim();

  if (!normalizedBaseUrl) {
    throw new Error('baseUrl is required');
  }

  if (!isValidFridgePublicCode(normalizedPublicCode)) {
    throw new Error('fridgePublicCode is invalid');
  }

  return `${normalizedBaseUrl}/q/fridges/${encodeURIComponent(
    normalizedPublicCode,
  )}`;
};
