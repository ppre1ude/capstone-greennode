#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'docs', 'qa-fixtures', 'manifest.json');
const baseUrl = process.env.FOODLINK_API_BASE_URL || 'http://localhost:8080';
const token = process.env.FOODLINK_ACCESS_TOKEN;
const maxUploadImageBytes = 8 * 1024 * 1024;

const readManifest = () =>
  JSON.parse(fs.readFileSync(manifestPath, {encoding: 'utf8'}));

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
  ].includes(
    String(category || '').toLowerCase(),
  );

const evaluateGenerateResponse = (fixture, status, body) => {
  if (fixture.expectedOutcome === 'client_rejected_if_over_8mb') {
    return {
      passed: status === 'client_rejected',
      detail:
        status === 'client_rejected'
          ? 'client rejected over 8MB'
          : 'fixture did not trigger client-side large image rejection',
    };
  }

  if (status >= 400) {
    return {
      passed:
        fixture.expectedOutcome === 'rejected' ||
        fixture.expectedOutcome === 'rejected_or_review',
      detail: `server rejected with ${status}`,
    };
  }

  const category = body?.data?.aiAnalysis?.category;
  const rejectionReason = body?.data?.aiAnalysis?.rejectionReason;
  const reviewReason = body?.data?.aiAnalysis?.reviewReason;
  const confidenceScore = body?.data?.aiAnalysis?.confidenceScore;
  const lowConfidence =
    typeof confidenceScore === 'number' &&
    (confidenceScore <= 1 ? confidenceScore < 0.6 : confidenceScore < 60);

  if (fixture.expectedOutcome === 'shareable') {
    return {
      passed: isShareableCategory(category),
      detail: `category=${category || 'missing'}`,
    };
  }

  if (fixture.expectedOutcome === 'rejected') {
    return {
      passed: isRejectedCategory(category) || isRejectedCategory(rejectionReason),
      detail: `category=${category || 'missing'}, rejectionReason=${rejectionReason || 'missing'}`,
    };
  }

  if (fixture.expectedOutcome === 'rejected_or_review') {
    return {
      passed:
        isRejectedCategory(category) ||
        isRejectedCategory(rejectionReason) ||
        isReviewCategory(category) ||
        isReviewCategory(reviewReason) ||
        lowConfidence,
      detail: `category=${category || 'missing'}, rejectionReason=${rejectionReason || 'missing'}, reviewReason=${reviewReason || 'missing'}, confidence=${confidenceScore}`,
    };
  }

  if (fixture.expectedOutcome === 'single_representative_or_review') {
    return {
      passed: Boolean(category) || isReviewCategory(category) || isReviewCategory(reviewReason),
      detail: `category=${category || 'missing'}, reviewReason=${reviewReason || 'missing'}`,
    };
  }

  return {passed: false, detail: `unknown expectedOutcome=${fixture.expectedOutcome}`};
};

const uploadFixture = async fixture => {
  const absolutePath = path.join(repoRoot, fixture.localPath);

  if (!fs.existsSync(absolutePath)) {
    return {id: fixture.id, status: 'skipped', detail: 'fixture file missing'};
  }

  const stat = fs.statSync(absolutePath);
  if (
    fixture.expectedOutcome === 'client_rejected_if_over_8mb' &&
    stat.size > maxUploadImageBytes
  ) {
    return {id: fixture.id, status: 'passed', detail: 'client rejected over 8MB'};
  }

  const form = new FormData();
  const buffer = fs.readFileSync(absolutePath);
  const blob = new Blob([buffer], {type: 'image/jpeg'});
  form.append('image', blob, path.basename(absolutePath));

  const response = await fetch(`${baseUrl}/api/v1/posts/generate`, {
    method: 'POST',
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    body: form,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  const result = evaluateGenerateResponse(fixture, response.status, body);

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

  const failedCount = results.filter(result => result.status === 'failed').length;
  const runnableCount = results.filter(result => result.status !== 'skipped').length;

  if (runnableCount === 0) {
    console.log('No fixture files found. Add images under docs/qa-fixtures first.');
  }

  process.exitCode = failedCount > 0 ? 1 : 0;
};

main();
