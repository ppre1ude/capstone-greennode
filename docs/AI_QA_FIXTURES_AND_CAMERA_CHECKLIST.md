# AI QA Fixtures and Camera Checklist

> 기준일: 2026-05-06
> 목적: AI 분석 실패 UX, false-positive 정책, 실제 기기 카메라 검증을 반복 가능하게 만든다.

## Fixture Set

| ID                 | 케이스           | 필요한 이미지                                 | 기대 결과                                                       | 판정 기준                                                                      |
| ------------------ | ---------------- | --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `fresh-single`     | 신선 성공        | 외관이 잘 보이는 단일 과일/채소 사진          | `Fresh` 또는 `Mid`, `canShare=true`, 나눔 식재료 등록 진입 가능 | 분석 결과와 작성 화면에 식재료명/상태/신뢰도가 표시된다.                       |
| `stale-or-rotten`  | 나눔 기준 미충족 | 무름, 곰팡이, 변색이 보이는 과일/채소 사진    | `Stale` 또는 generate 400                                       | 앱은 등록 화면으로 보내지 않고 `나눔 기준에 맞지 않아요` 계열 문구를 보여준다. |
| `not-food`         | 비식재료         | 책상, 방, 전자기기 등 식재료가 아닌 사진      | generate 400 또는 `확인 필요`                                   | 식재료 나눔으로 바로 등록되지 않는다.                                          |
| `screenshot-or-ui` | 스크린샷/아이콘  | 앱 화면 캡처, 런처 아이콘, 지도 캡처          | generate 400 또는 `확인 필요`                                   | 실제 식재료 사진이 아닌데 `Fresh`로 통과하면 false-positive 버그로 기록한다.   |
| `low-quality`      | 흐림/어두움/가림 | 흔들림, 저조도, 부분 가림 사진                | 낮은 confidence 또는 실패                                       | `확인 필요` 또는 재촬영 안내가 표시된다.                                       |
| `large-image`      | 대용량 이미지    | 8MB 이상 또는 고해상도 원본                   | 8MB 초과는 업로드 전 차단                                       | 앱이 멈추지 않고 명확한 오류 문구를 제공한다.                                  |
| `multi-object`     | 여러 식재료      | 한 장에 서로 다른 식재료가 2개 이상 있는 사진 | 현재는 대표 객체 1개 처리                                       | multi-object는 `detections[]` 계약 전까지 정책 검증용으로만 쓴다.              |

## Fixture Storage Rule

- 실제 식재료 사진은 저작권/개인정보가 없는 파일만 사용한다.
- 커밋 가능한 작은 샘플은 `docs/qa-fixtures/`에 둔다.
- fixture 목록과 기대 결과는 `docs/qa-fixtures/manifest.json`에 둔다.
- 원본 대용량 이미지는 git에 넣지 말고 로컬 또는 공유 드라이브에 보관한 뒤 파일명과 결과만 문서에 기록한다.
- 권장 파일명: `{id}-{expected}-{YYYYMMDD}.jpg`
  - 예: `fresh-single-fresh-20260505.jpg`
  - 예: `stale-or-rotten-rejected-20260505.jpg`

## Repeated Validation Command

실제 fixture 이미지를 `manifest.json`의 `localPath`에 맞게 추가한 뒤 아래 명령으로 `/posts/generate`를 반복 검증한다.

```bash
FOODLINK_API_BASE_URL=http://localhost:8080 FOODLINK_ACCESS_TOKEN=<token> npm run qa:ai-fixtures
```

- fixture 파일이 없으면 해당 항목은 `skipped`로 기록된다.
- 실패/검토 케이스는 generate 400, 나눔 기준 미충족 category, 낮은 confidence, 또는 검토 사유 enum 중 하나를 기대한다.
- 백엔드 Phase 1.5 기준 신선도 label은 `Fresh/Mid/Stale`이다. 기존 `Normal`은 `Mid` 그룹으로 번역하고, `Bad/Rotten`은 현재 서버 label이 아닌 방어 호환 label로만 본다.
- 백엔드 AI는 `unknown`도 반환할 수 있다. `unknown`은 바로 등록 가능한 성공 상태로 보지 않고 `확인 필요` 또는 실패 UX로 기록한다.
- confidence 테스트는 `0.4`, `0.7`, `1.0`을 포함한다. 제품 기준은 백엔드 활용 가이드를 따라 `0.9` 미만을 `확인 필요` UX로 본다. 따라서 `0.4`와 `0.7`은 확인 필요, `1.0`은 바로 나눔 가능 표시가 기대값이다. 단, 낮은 confidence만으로 등록을 차단하지 않는다.
- 8MB 초과 대용량 이미지는 앱의 업로드 전 차단 정책과 동일하게 클라이언트 검증 대상으로 본다.

## False-positive Policy

현재 앱은 이미지 내용을 직접 판별하지 않고 서버의 AI 결과를 신뢰한다. 따라서 비식재료/스크린샷을 막는 1차 책임은 서버/AI 파이프라인에 둔다.

앱 책임:

- generate 실패의 `message` 또는 `detail`을 사용자에게 그대로 이해 가능한 문구로 표시한다.
- `canShare=false`, generate 400, `not_food/non_food/low_quality/screenshot/ui_screenshot` category 또는 `rejectionReason`은 나눔 식재료 작성/최종 등록으로 진행하지 않는다.
- 낮은 confidence는 즉시 등록 차단이 아니라 `확인 필요`로 보여주고 재촬영/갤러리/수동 확인을 유도한다. 현재 제품 기준은 `confidenceScore < 0.9`다.

서버/AI 책임:

- 비식재료, 스크린샷, 앱 아이콘, 실내 배경은 `Fresh` 식재료로 반환하지 않는다.
- 식재료 여부가 불확실하면 `confidence`를 낮게 반환하거나 generate 400으로 거부한다.
- 실패/검토 사유 enum은 Post-MVP 백엔드 항목이다. 도입 시 `not_food`, `non_food`, `low_quality`, `screenshot`, `ui_screenshot`, `multi_object_review`, `review_required`를 우선 사용한다.
- 200 응답으로 검토 상태를 돌려보낼 때는 `aiAnalysis.rejectionReason` 또는 `aiAnalysis.reviewReason`을 포함한다. 서버가 400을 반환하는 경우에는 `message` 또는 FastAPI `detail`에 같은 사유를 사람이 읽을 수 있는 문구로 담는다.

## Actual Android Device Camera Checklist

사전 조건:

- 실제 Android 기기가 USB 디버깅으로 연결되어 있어야 한다.
- `adb devices -l`에 `emulator`가 아닌 물리 기기가 `device` 상태로 보여야 한다.
- SSH 터널 또는 동일 네트워크 API base URL이 실제 기기에서 접근 가능해야 한다.

검증 절차:

1. release APK를 설치한다.
2. 앱을 실행하고 검증 계정으로 로그인한다.
3. 동네 위치가 등록되어 있는지 확인한다.
4. AI 스캔 화면에 진입한다.
5. 실제 카메라로 `fresh-single` 사진을 촬영한다.
6. logcat에서 `VisionCamera_*.jpg` 파일 URI 생성과 `/posts/generate` 호출을 확인한다.
7. 분석 결과 화면에서 식재료명, 신선도 등급, confidence, `나눔 가능/확인 필요/나눔 기준 미충족` 상태를 확인한다.
8. `stale-or-rotten`, `not-food`, `low-quality` 케이스를 반복한다.
9. 실패 케이스에서 앱이 멈추지 않고 재촬영/갤러리 선택 대안을 제공하는지 확인한다.

기록할 증거:

- 기기 모델, Android 버전, 앱 빌드 종류
- fixture 파일명 또는 촬영 대상 설명
- 분석 결과 화면 스크린샷
- 실패 Alert 스크린샷
- logcat의 `Generate post failed` 또는 성공 응답 요약

현재 상태:

- 2026-05-05 확인 시 연결 장치는 `emulator-5554`뿐이었다.
- `docs/qa-fixtures/manifest.json`과 `npm run qa:ai-fixtures` 반복 검증 스크립트를 추가했다. 2026-05-06 manifest JSON 파싱과 스크립트 실행을 재검증했고, 이미지가 없어 모든 케이스는 `skipped`로 종료됐다.
- 실제 fixture 이미지는 아직 추가하지 않았다.
- 2026-05-06 실제 Android 기기 `SM-S928N` Android 15(API 35, serial `R3CX203CV8X`)에서 카메라 권한 허용, 프리뷰, 셔터 촬영, `/posts/generate` 분석 결과 표시, 등록 화면 진입, 냉장고 선택, 최종 등록 완료, 홈 목록 재조회, 상세 진입을 확인했다.
- QA 빌드는 release APK + `adb reverse tcp:8080 tcp:8080` + SSH tunnel `localhost:8080 -> NHN-Cloud-Server:80` 조건으로 실행했다. `src/config/api.ts`의 `ANDROID_DEVICE_HOST`는 빌드 시점에만 `localhost`로 임시 변경했고 소스는 되돌렸다.
- 증거 스크린샷은 `temp/real-device-camera-screen.png`, `temp/real-device-share-form.png`, `temp/real-device-after-share-create.png`, `temp/real-device-home-after-share-create.png`, `temp/real-device-detail-after-share-create.png`에 있다. `temp/` 파일은 커밋 대상이 아니다.
- 발견한 충돌: 등록 직전 분석 결과는 `바나나 / 상태가 좋아 보여요 / 91%`였지만, 등록 후 홈/상세는 `나눔 식재료 / 분석 중` fallback을 표시했다. 이는 VM/API QA에서 발견한 Post AI 메타데이터 저장 불일치가 실제 앱에서도 재현된 결과다.
- false-positive 증거: 실제 촬영 대상은 화면상 토마토 이미지였으나 AI가 `바나나`로 판별했다. 이 케이스는 `screenshot-or-ui` 또는 `fresh-single`이 아니라 AI 분류 품질/스크린 촬영 false-positive 증거로 기록한다.
- 아직 남은 실제 기기 QA: `Stale`, `not-food`, `low-quality`, 실제 FCM foreground/background/terminated 수신.
