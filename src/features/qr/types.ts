export type QrPayloadSource = 'deep-link' | 'https';

export type FridgeQrVerificationTarget = {
  type: 'fridge-verification';
  fridgePublicCode: string;
  source: QrPayloadSource;
};

export type QrPayloadParseResult =
  | {
      valid: true;
      target: FridgeQrVerificationTarget;
    }
  | {
      valid: false;
      reason: 'empty' | 'unsupported-url' | 'invalid-public-code';
    };
