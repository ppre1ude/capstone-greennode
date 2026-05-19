export { QrScannerShell } from './components/QrScannerShell';
export {
  buildFridgeQrVerificationUrl,
  isValidFridgePublicCode,
  parseFoodLinkQrPayload,
} from './utils/qrPayload';
export type {
  FridgeQrVerificationTarget,
  QrPayloadParseResult,
  QrPayloadSource,
} from './types';
