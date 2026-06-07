# QA Fixture Index

This directory stores small, commit-safe AI QA fixture images and the expected
outcomes used by `scripts/validate-ai-fixtures.js`.

Small, non-private fixture images are stored with the filenames listed in
`manifest.json`. Large originals or images containing private information must
stay outside git; record only the filename and QA result in
`docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`.

Source and license details are tracked in [SOURCES.md](./SOURCES.md).

| Fixture ID | Required file | Status |
| --- | --- | --- |
| `fresh-single` | `fresh-single-fresh-20260505.jpg` | ready |
| `stale-or-rotten` | `stale-or-rotten-rejected-20260505.jpg` | ready |
| `not-food` | `not-food-rejected-20260505.jpg` | ready |
| `screenshot-or-ui` | `screenshot-or-ui-rejected-20260505.jpg` | ready |
| `low-quality` | `low-quality-review-20260505.jpg` | ready |
| `shaky-blur` | `shaky-blur-review-20260607.jpg` | ready |
| `too-close` | `too-close-review-20260607.jpg` | ready |
| `too-far` | `too-far-review-20260607.jpg` | ready |
| `packaged-food` | `packaged-food-review-20260607.jpg` | ready |
| `label-expiration` | `label-expiration-review-20260607.jpg` | ready |
| `hidden-interior` | `hidden-interior-review-20260607.jpg` | ready |
| `large-image` | `large-image-local-only-20260505.jpg` | local only |
| `multi-object` | `multi-object-review-20260505.jpg` | ready |

Run strict validation when fixture failures should fail the command:

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures
```

Run report-only validation when known backend/AI false-positives are still open
and you only need an observable QA report. As of the 2026-05-29 backend
response, `not-food`, `screenshot-or-ui`, `low-quality`, supplemental review
fixtures, and `multi-object` accuracy are model-upgrade items, so keep the full
fixture set report-only until that work lands:

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures -- --report-only
```

Run shape-only validation after backend response-shape changes when model
accuracy is still deferred:

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures -- --shape-only
```

Modes:

- Strict mode exits with code `1` when any runnable fixture fails.
- Report-only mode prints the same pass/fail details but exits with code `0`.
- Shape-only mode keeps generic 400 responses as failures, accepts explicit
  `rejectionReason`/`reviewReason`, and records current-model false positives as
  `model accuracy deferred`.
- Use report-only for analysis/current-state recording. Use strict mode as the
  acceptance gate after backend/AI fixes. Keep model-accuracy cases report-only
  until the AI pipeline can actually classify them.
- Post-MVP strict mode requires explicit `rejectionReason` or `reviewReason`
  for blocked/review fixtures. A generic 400 without a reason is recorded as a
  contract failure.
