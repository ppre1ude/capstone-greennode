# QA Fixture Index

This directory stores small, commit-safe AI QA fixture images and the expected
outcomes used by `scripts/validate-ai-fixtures.js`.

No real fixture images are committed yet. Add small, non-private samples with
the filenames listed in `manifest.json`. Large originals or images containing
private information must stay outside git; record only the filename and QA
result in `docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`.

| Fixture ID | Required file | Status |
| --- | --- | --- |
| `fresh-single` | `fresh-single-fresh-20260505.jpg` | needed |
| `stale-or-rotten` | `stale-or-rotten-rejected-20260505.jpg` | needed |
| `not-food` | `not-food-rejected-20260505.jpg` | needed |
| `screenshot-or-ui` | `screenshot-or-ui-rejected-20260505.jpg` | needed |
| `low-quality` | `low-quality-review-20260505.jpg` | needed |
| `large-image` | `large-image-local-only-20260505.jpg` | local only |
| `multi-object` | `multi-object-review-20260505.jpg` | needed |

Run the repeated validation once fixture files and a token are available:

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures
```
