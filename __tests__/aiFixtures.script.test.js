const { evaluateGenerateResponse } = require('../scripts/validate-ai-fixtures');

const generateBody = ({
  category = 'Fresh',
  confidenceScore = 0.98,
  reviewReason,
  rejectionReason,
}) => ({
  data: {
    aiAnalysis: {
      category,
      confidenceScore,
      reviewReason,
      rejectionReason,
    },
  },
});

describe('validate-ai-fixtures response evaluation', () => {
  it('accepts explicit soft review reasons for rejected_or_review fixtures', () => {
    const result = evaluateGenerateResponse(
      {
        expectedOutcome: 'rejected_or_review',
        expectedReviewReasons: ['low_quality'],
      },
      200,
      generateBody({ reviewReason: 'low_quality' }),
    );

    expect(result.passed).toBe(true);
  });

  it('accepts explicit screenshot review reasons even when category is shareable', () => {
    const result = evaluateGenerateResponse(
      {
        expectedOutcome: 'rejected_or_review',
        expectedReviewReasons: ['screenshot', 'ui_screenshot'],
      },
      200,
      generateBody({ reviewReason: 'ui_screenshot' }),
    );

    expect(result.passed).toBe(true);
  });

  it('fails generic 400 responses when a fixture expects an explicit reason', () => {
    const result = evaluateGenerateResponse(
      {
        expectedOutcome: 'rejected_or_review',
        expectedRejectionReasons: ['not_food'],
      },
      400,
      { success: false, message: '나눔 기준에 맞지 않아요.', data: null },
    );

    expect(result.passed).toBe(false);
  });

  it('accepts 400 responses with the expected error rejection reason', () => {
    const result = evaluateGenerateResponse(
      {
        expectedOutcome: 'rejected_or_review',
        expectedRejectionReasons: ['not_food'],
      },
      400,
      {
        success: false,
        message: '식재료 사진으로 확인되지 않았어요.',
        data: null,
        error: { rejectionReason: 'not_food' },
      },
    );

    expect(result.passed).toBe(true);
  });

  it('keeps generic multi-object 400 responses as contract failures', () => {
    const result = evaluateGenerateResponse(
      {
        expectedOutcome: 'single_representative_or_review',
        expectedReviewReasons: ['multi_object_review'],
      },
      400,
      { success: false, message: '나눔 기준에 맞지 않아요.', data: null },
    );

    expect(result.passed).toBe(false);
  });
});
