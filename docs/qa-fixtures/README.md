# QA Fixture Index

이 디렉터리는 커밋 가능한 AI QA 샘플 이미지와 결과 기록을 두는 위치다.

현재 실제 이미지는 아직 추가하지 않았다. 먼저 아래 파일 세트를 확보한다.

| Fixture ID | Required file | Status |
| --- | --- | --- |
| `fresh-single` | `fresh-single-fresh-YYYYMMDD.jpg` | 필요 |
| `stale-or-rotten` | `stale-or-rotten-rejected-YYYYMMDD.jpg` | 필요 |
| `not-food` | `not-food-rejected-YYYYMMDD.jpg` | 필요 |
| `screenshot-or-ui` | `screenshot-or-ui-rejected-YYYYMMDD.png` | 필요 |
| `low-quality` | `low-quality-review-YYYYMMDD.jpg` | 필요 |
| `large-image` | 로컬/공유 드라이브에만 보관 | 필요 |
| `multi-object` | `multi-object-review-YYYYMMDD.jpg` | 필요 |

대용량 원본이나 개인정보가 포함될 수 있는 사진은 이 디렉터리에 커밋하지 않는다. 결과만 `docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md`에 기록한다.
