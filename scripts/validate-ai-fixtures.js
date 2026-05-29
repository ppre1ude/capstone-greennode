#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(
  repoRoot,
  'docs',
  'qa-fixtures',
  'manifest.json',
);
const baseUrl = process.env.FOODLINK_API_BASE_URL || 'http://localhost:8080';
const token = process.env.FOODLINK_ACCESS_TOKEN;
const reportOnly = process.argv.includes('--report-only');
const shapeOnly = process.argv.includes('--shape-only');
const maxUploadImageBytes = 8 * 1024 * 1024;
const confidenceReviewThreshold = 0.9;
const reasonRequiredOutcomes = new Set([
  'rejected',
  'rejected_or_review',
  'single_representative_or_review',
]);

const readManifest = () =>
  JSON.parse(fs.readFileSync(manifestPath, { encoding: 'utf8' }));

const isShareableCategory = category =>
  ['fresh', 'good', 'normal', 'mid', 'medium'].includes(
    String(category || '').toLowerCase(),
  );

const isRejectedCategory = category =>
  [
    'rotten',
    'stale',
    'bad',
    'not_food',
    'non_food',
    'not-food',
    'non-food',
    'low_quality',
    'low-quality',
    'screenshot',
    'ui_screenshot',
    'ui-screenshot',
  ].includes(String(category || '').toLowerCase());

const isReviewCategory = category =>
  [
    'uncertain',
    'review_required',
    'review-required',
    'multi_object_review',
    'multi-object-review',
  ].includes(String(category || '').toLowerCase());

const getServerMessage = body =>
  body?.message ||
  body?.detail ||
  body?.data?.message ||
  body?.data?.detail ||
  body?.data?.analysisMessage ||
  'no server message';

const getCanonicalRejectionReason = body =>
  body?.data?.rejectionReason ||
  body?.data?.aiAnalysis?.rejectionReason ||
  body?.error?.rejectionReason ||
  body?.rejectionReason;

const getCanonicalReviewReason = body =>
  body?.data?.reviewReason ||
  body?.data?.aiAnalysis?.reviewReason ||
  body?.error?.reviewReason ||
  body?.reviewReason;

const normalizeReason = reason =>
  String(reason || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');

const getExpectedReasons = fixture =>
  Array.from(
    new Set([
      ...(fixture.expectedRejectionReasons || []),
      ...(fixture.expectedReviewReasons || []),
    ]),
  );

const hasExpectedReason = (fixture, body) => {
  const expectedReasons = getExpectedReasons(fixture).map(normalizeReason);
  if (expectedReasons.length === 0) {
    return true;
  }

  const actualReasons = [
    getCanonicalRejectionReason(body),
    getCanonicalReviewReason(body),
  ].map(normalizeReason);

  return expectedReasons.some(expectedReason =>
    actualReasons.includes(expectedReason),
  );
};

const hasCanonicalReason = body =>
  Boolean(getCanonicalRejectionReason(body) || getCanonicalReviewReason(body));

const hasExplicitExpectedReason = fixture =>
  getExpectedReasons(fixture).length > 0;

const getExpectedReasonDetail = fixture => {
  const expectedReasons = getExpectedReasons(fixture);
  return expectedReasons.length > 0
    ? `, expectedReason=${expectedReasons.join('|')}`
    : '';
};

const getAiSummary = body => {
  const analysis = body?.data?.aiAnalysis;
  const detectedFruitKo =
    body?.data?.detectedFruitKo ||
    body?.data?.detectedFruit ||
    analysis?.detectedFruitKo ||
    analysis?.detectedFruit ||
    'missing';
  const category = analysis?.category || 'missing';
  const confidenceScore = analysis?.confidenceScore;
  const rejectionReason = getCanonicalRejectionReason(body) || 'missing';
  const reviewReason = getCanonicalReviewReason(body) || 'missing';

  return `detected=${detectedFruitKo}, category=${category}, confidence=${confidenceScore}, rejectionReason=${rejectionReason}, reviewReason=${reviewReason}`;
};

const evaluateGenerateResponse = (fixture, status, body, options = {}) => {
  const evaluateShapeOnly = Boolean(options.shapeOnly);

  if (fixture.expectedOutcome === 'client_rejected_if_over_8mb') {
    return {
      passed: status === 'client_rejected',
      detail:
        status === 'client_rejected'
          ? 'client rejected over 8MB'
          : 'fixture did not trigger client-side large image rejection',
    };
  }

  if (status === 401 || status === 403) {
    return {
      passed: false,
      detail: `auth failed with ${status}: ${getServerMessage(body)}`,
    };
  }

  if (status >= 500) {
    return {
      passed: false,
      detail: `server error with ${status}: ${getServerMessage(body)}`,
    };
  }

  if (status >= 400) {
    const acceptsRejection =
      fixture.expectedOutcome === 'rejected' ||
      fixture.expectedOutcome === 'rejected_or_review' ||
      (evaluateShapeOnly &&
        fixture.expectedOutcome === 'single_representative_or_review');
    const reasonMatched = hasExpectedReason(fixture, body);
    const hasRequiredExpectedReason =
      !evaluateShapeOnly ||
      !reasonRequiredOutcomes.has(fixture.expectedOutcome) ||
      hasExplicitExpectedReason(fixture);

    return {
      passed: acceptsRejection && hasRequiredExpectedReason && reasonMatched,
      detail: `server rejected with ${status}: ${getServerMessage(
        body,
      )}${getExpectedReasonDetail(fixture)}`,
    };
  }

  const category = body?.data?.aiAnalysis?.category;
  const rejectionReason = getCanonicalRejectionReason(body);
  const reviewReason = getCanonicalReviewReason(body);
  const confidenceScore = body?.data?.aiAnalysis?.confidenceScore;
  const lowConfidence =
    typeof confidenceScore === 'number' &&
    (confidenceScore <= 1
      ? confidenceScore < confidenceReviewThreshold
      : confidenceScore < confidenceReviewThreshold * 100);

  if (
    evaluateShapeOnly &&
    reasonRequiredOutcomes.has(fixture.expectedOutcome)
  ) {
    if (hasCanonicalReason(body)) {
      return {
        passed:
          hasExplicitExpectedReason(fixture) &&
          hasExpectedReason(fixture, body),
        detail: getAiSummary(body),
      };
    }

    if (isShareableCategory(category)) {
      return {
        passed: true,
        detail: `${getAiSummary(body)}, model accuracy deferred: expected ${
          fixture.expectedOutcome
        } without explicit reason`,
      };
    }
  }

  if (fixture.expectedOutcome === 'shareable') {
    return {
      passed: isShareableCategory(category) && !rejectionReason,
      detail: getAiSummary(body),
    };
  }

  if (fixture.expectedOutcome === 'rejected') {
    return {
      passed:
        hasExpectedReason(fixture, body) &&
        (isRejectedCategory(category) ||
          Boolean(rejectionReason) ||
          isRejectedCategory(rejectionReason)),
      detail: getAiSummary(body),
    };
  }

  if (fixture.expectedOutcome === 'rejected_or_review') {
    return {
      passed:
        hasExpectedReason(fixture, body) &&
        (isRejectedCategory(category) ||
          hasCanonicalReason(body) ||
          Boolean(rejectionReason) ||
          isRejectedCategory(rejectionReason) ||
          isReviewCategory(category) ||
          isReviewCategory(rejectionReason) ||
          isReviewCategory(reviewReason) ||
          lowConfidence),
      detail: getAiSummary(body),
    };
  }

  if (fixture.expectedOutcome === 'single_representative_or_review') {
    return {
      passed:
        hasExpectedReason(fixture, body) &&
        (isReviewCategory(category) ||
          isReviewCategory(reviewReason) ||
          hasCanonicalReason(body)),
      detail: getAiSummary(body),
    };
  }

  return {
    passed: false,
    detail: `unknown expectedOutcome=${fixture.expectedOutcome}`,
  };
};

const uploadFixture = async fixture => {
  const absolutePath = path.join(repoRoot, fixture.localPath);

  if (!fs.existsSync(absolutePath)) {
    return {
      id: fixture.id,
      status: 'skipped',
      detail: 'fixture file missing',
    };
  }

  const stat = fs.statSync(absolutePath);
  if (
    fixture.expectedOutcome === 'client_rejected_if_over_8mb' &&
    stat.size > maxUploadImageBytes
  ) {
    return {
      id: fixture.id,
      status: 'passed',
      detail: 'client rejected over 8MB',
    };
  }

  const form = new FormData();
  const buffer = fs.readFileSync(absolutePath);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  form.append('image', blob, path.basename(absolutePath));

  const response = await fetch(`${baseUrl}/api/v1/posts/generate`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  const result = evaluateGenerateResponse(fixture, response.status, body, {
    shapeOnly,
  });

  return {
    id: fixture.id,
    status: result.passed ? 'passed' : 'failed',
    detail: result.detail,
  };
};

const main = async () => {
  const manifest = readManifest();
  const results = [];

  for (const fixture of manifest.fixtures) {
    try {
      results.push(await uploadFixture(fixture));
    } catch (error) {
      results.push({
        id: fixture.id,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const result of results) {
    console.log(`[${result.status}] ${result.id}: ${result.detail}`);
  }

  const failedCount = results.filter(
    result => result.status === 'failed',
  ).length;
  const runnableCount = results.filter(
    result => result.status !== 'skipped',
  ).length;

  if (runnableCount === 0) {
    console.log(
      'No fixture files found. Add images under docs/qa-fixtures first.',
    );
  }

  if (reportOnly && failedCount > 0) {
    console.log(
      `Report-only mode: observed ${failedCount} failed fixture(s), exiting with code 0.`,
    );
  }

  process.exitCode = failedCount > 0 && !reportOnly ? 1 : 0;
};

if (require.main === module) {
  main();
}

module.exports = {
  evaluateGenerateResponse,
  getCanonicalRejectionReason,
  getCanonicalReviewReason,
  hasExpectedReason,
};
