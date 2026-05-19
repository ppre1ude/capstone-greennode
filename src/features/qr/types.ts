export type QrPayloadSource = 'deep-link' | 'https' | 'json' | 'plain-code';

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
      reason:
        | 'empty'
        | 'unsupported-payload'
        | 'unsupported-url'
        | 'invalid-public-code';
    };
