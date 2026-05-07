# 백엔드 AI fixture QA 전달 문서

날짜: 2026-05-07
작성: 프론트엔드 QA
범위: 프론트가 관리하는 fixture 이미지 기준 `/api/v1/posts/generate` smoke QA

## 요약

프론트 응답 흐름 테스트는 통과했습니다. 다만 live VM AI/API smoke QA에서
false-positive 3건이 남아 있습니다. 현재 서버가 `Fresh`와 `imageToken`을
함께 반환하면 프론트는 계약상 등록 가능 흐름으로 보낼 수밖에 없습니다.

## 환경

- API: NHN Cloud VM through `localhost:8080`
- 실행 명령:

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures
```

- fixture 출처: `docs/qa-fixtures/SOURCES.md`

## 결과

| Fixture | 기대 결과 | 실제 결과 | 프론트 판단 |
| --- | --- | --- | --- |
| `fresh-single` | 등록 가능 | `바나나`, `Fresh`, confidence `1` | 통과 |
| `not-food` | 거부 또는 검토 필요 | generate 400 | 통과 |
| `multi-object` | 대표 객체 1개 또는 검토/거부 | generate 400 | 현 MVP 정책상 통과 |
| `stale-or-rotten` | 거부 | `바나나`, `Fresh`, confidence `0.79` | AI false-positive |
| `screenshot-or-ui` | 거부 또는 검토 필요 | `바나나`, `Fresh`, confidence `1` | AI false-positive |
| `low-quality` | 검토 필요 또는 낮은 confidence | `바나나`, `Fresh`, confidence `0.9794` | AI confidence/policy issue |

`large-image`는 업로드 크기 guard용 local-only fixture라 의도적으로
skipped 처리합니다. 대용량 원본은 git에 커밋하지 않습니다.

## 백엔드/AI 필수 신호

나눔 기준 미충족 또는 검토 필요 이미지에 대해서는 프론트가 아래 신호 중
하나를 받아야 안전하게 등록 흐름을 막거나 약화할 수 있습니다.

- 사용자가 읽을 수 있는 `message` 또는 `detail`이 포함된 HTTP 400
- `isFresh=false`
- `rejectionReason` or `reviewReason`
- 프론트가 `확인 필요`로 표시할 만큼 낮은 confidence

API가 `Fresh`와 `imageToken`을 함께 반환하면, 현재 계약상 프론트는 해당
이미지를 나눔 등록 가능 상태로 취급합니다.

## 재검증 명령

백엔드/AI 수정 후 acceptance gate는 strict mode로 실행합니다.

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures
```

false-positive가 아직 열려 있는 동안에는 report-only mode로 관찰/기록합니다.

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures -- --report-only
```
