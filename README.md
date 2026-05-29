# FoodLink

FoodLink는 사용자가 남는 식재료를 AI로 확인하고, 가까운 공유 냉장고를 통해 이웃에게 나눔 식재료로 연결하는 React Native 앱입니다. 패키지명은 `greennode`입니다.

핵심 가치는 남는 식재료 처리의 귀찮음과 죄책감을 줄이는 것입니다. 환경 성취 지표는 보조 레이어로 두고, MVP에서는 "처리가 끝났다"는 안도감과 "근처 이웃에게 알림이 갔다"는 완료감을 먼저 검증합니다.

## MVP 범위

현재 MVP는 아래 흐름을 기준으로 개발하고 검증합니다.

### 공급자 흐름

```text
남는 식재료 촬영/갤러리 선택
  -> AI 분석
  -> 나눔 가능 기준 확인
  -> 나눔 식재료 등록 정보 확인
  -> 등록 가능 공유 냉장고 선택
  -> 등록 완료
  -> 근처 사용자에게 푸시 알림
```

### 수요자 흐름

```text
홈에서 근처 available 나눔 식재료 발견
  -> 상세 화면 진입
  -> 보관 공유 냉장고 확인
  -> 나눔 신청하기
  -> status: available -> requested
  -> 공급자에게 신청 알림
```

`requested`는 신청 접수 상태이며 예약 확정이나 수령 완료가 아닙니다. MVP는 `available -> requested` 전환까지를 기준 흐름으로 둡니다.

## 주요 기능

- 이메일 회원가입/로그인과 JWT 기반 인증
- 동네 위치 등록, 위치 미설정 사용자 보호
- 홈의 근처 available 나눔 식재료 목록
- 카메라 촬영/갤러리 선택 후 AI 분석
- AI 분석 결과 기반 나눔 식재료 등록
- 등록 가능 공유 냉장고 선택
- 지도에서 주변 공유 냉장고와 냉장고별 나눔 식재료 탐색
- 나눔 식재료 상세 조회와 나눔 신청
- FCM payload 검증, 로컬 알림함, 알림 클릭 라우팅

## 현재 구현 상태

2026-05-29 기준으로 핵심 앱 흐름은 실제 Android 기기와 VM API에서 재검증했고, 백엔드 주간 회신의 신규 계약, Post-MVP blocker 회신, 이후 runtime QA 결과를 문서에 반영했습니다.

- `generate -> create -> home/detail/map -> request -> requested 제외` 흐름 통과
- 백엔드 AI 메타데이터 sidecar 저장/복원 수정 반영
- `POST /posts/{id}/requests` 신청 API 연동 완료
- `GET /fridges/{id}/posts?status=available` 냉장고별 목록 연동 완료
- Firebase 설정 파일이 없는 빌드에서도 앱 시작과 위치 등록이 크래시하지 않도록 guard 처리
- FCM debug/release, physical 2계정, Android 14/15 matrix에서 notification tap routing 확인
- operator inventory summary/items/dispose API는 2026-05-25 VM에서 운영자/비운영자/빈 목록/available·expired dispose/requested 409까지 검증
- MVP `detections[]` 단일 객체 래핑 계약은 2026-05-23 백엔드 회신으로 확정

자세한 검증 결과와 남은 백로그는 [docs/VALIDATION_AND_BACKLOG.md](./docs/VALIDATION_AND_BACKLOG.md)를 기준으로 확인합니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 앱 | React Native 0.85, React 19, TypeScript |
| 네비게이션 | React Navigation |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 카메라 | react-native-vision-camera |
| 이미지 선택 | react-native-image-picker |
| 지도 | react-native-maps |
| 위치 | react-native-geolocation-service |
| 푸시 알림 | @react-native-firebase/messaging |
| 폼/검증 | react-hook-form, zod |
| 테스트 | Jest, React Test Renderer |

## 프로젝트 구조

```text
src/
  api/          API client와 인증 이벤트
  design-system/ Montage식 API를 GreenNode 토큰 위에 얹은 DS 프리미티브
  components/   도메인 데이터를 DS 프리미티브로 조합하는 제품 컴포넌트
  config/       API base URL 등 실행 설정
  navigation/   Auth/Main/Root 네비게이션
  screens/      화면 단위 구현
  services/     FCM, 디바이스 등록, 알림 처리
  store/        Zustand store
  theme/        컬러, 타이포그래피, spacing, radius, layout 토큰
  types/        API/도메인 타입
  utils/        정책, validation, storage helper
docs/           제품/도메인/API/검증 문서
scripts/        mock API, QA fixture 검증 스크립트
__tests__/      단위/화면/API 계약 테스트
```

## 시작하기

### 1. 요구 사항

- Node.js `>= 22.11.0`
- npm
- React Native 개발 환경
- Android Studio 또는 Xcode
- iOS 실행 시 CocoaPods와 Ruby Bundler

React Native 공통 개발 환경은 공식 문서의 [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment)를 따릅니다.

### 2. 의존성 설치

```sh
npm install
```

iOS에서 실행할 때는 CocoaPods 의존성을 설치합니다.

```sh
bundle install
pushd ios
bundle exec pod install
popd
```

### 3. API 터널 열기

NHN Cloud API는 SSH 터널을 통해 접근합니다. 앱에서 실제 API를 사용하려면 별도 터미널에서 아래 명령을 실행하고 열어둡니다.

```sh
ssh -L 8080:localhost:80 NHN-Cloud-Server
```

환경별 base URL은 [src/config/api.ts](./src/config/api.ts)에 정의되어 있습니다.

- Android 에뮬레이터: `http://10.0.2.2:8080`
- iOS 시뮬레이터: `http://localhost:8080`
- Android 실기기: [src/config/api.ts](./src/config/api.ts)의 `ANDROID_DEVICE_HOST`에 SSH 터널을 연 PC의 LAN IP를 설정

상세 API 계약은 [docs/API_INTEGRATION_CONTRACT.md](./docs/API_INTEGRATION_CONTRACT.md)를 확인합니다.

### 4. Metro 실행

```sh
npm start
```

### 5. 앱 실행

Android:

```sh
npm run android
```

iOS:

```sh
npm run ios
```

## 개발 명령

```sh
npm run lint
npm test -- --runInBand
node ./node_modules/typescript/bin/tsc --noEmit
npm run qa:ai-fixtures
npm run qa:ai-fixtures -- --shape-only
npm run mock:api
```

## AI/나눔 정책 요약

- 백엔드 AI label은 `Fresh`, `Mid`, `Stale`, `unknown`입니다.
- `Fresh`와 `Mid`는 사용자에게 `상태가 좋아 보여요`, `나눔 가능`으로 통합 표시합니다.
- `Stale`은 `나눔 기준에 맞지 않아요`로 안내하고 등록하지 않습니다.
- `confidenceScore`는 신선도 분류 모델의 softmax max 확률이며, 단독 등록 차단 기준이 아닙니다.
- `confidenceScore < 0.9`는 `확인 필요` UX로 표시합니다.
- screenshot/UI, 비식재료, 저품질, multi-object 실제 판별은 현재 백엔드 AI 모델 범위 밖입니다. 2026-05-29 기준 Post-MVP에서는 먼저 `rejectionReason`/`reviewReason` 응답 shape를 맞추고, 실제 정확도는 Phase 4 모델 고도화 항목으로 분리합니다.
- API/code의 `Post`는 도메인 문서와 사용자-facing 문구에서 **나눔 식재료**로 번역합니다.

## 다음 작업 후보

현재 검증 문서 기준 남은 주요 작업은 아래와 같습니다.

- 최신 VM E2E 재검증: `/auth/me` 운영자 힌트와 프로필 운영자 콘솔 진입 제어는 연결됐으므로, 실제 운영자 계정으로 진입 정책을 다시 확인합니다.
- Android 13 실기기 또는 추가 OEM 참고 매트릭스: 기기가 확보되면 Firebase 설정 포함 빌드와 2계정으로 background/terminated 수신을 보강합니다.
- Post-MVP AI response shape live VM 검증과 모델 고도화 acceptance 분리
- 주변 공유 냉장고 없음 상태를 위한 백엔드 필터 또는 fixture 검증
- 백엔드가 구현 완료로 회신한 서버 알림/검색과 상태가 상충한 impact summary의 live VM/OpenAPI 재검증
- Inventory/QR PRD v0 기반 최신 VM/실기기 QR 보관·수령 회귀 재검증

## 문서 지도

| 문서 | 역할 |
| --- | --- |
| [docs/PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md) | 제품 비전, MVP 경계, 사용자 흐름 |
| [docs/DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md) | FoodLink 도메인 용어와 상태 모델 |
| [docs/API_INTEGRATION_CONTRACT.md](./docs/API_INTEGRATION_CONTRACT.md) | API 접속, 요청/응답 계약, FCM 계약 |
| [docs/VALIDATION_AND_BACKLOG.md](./docs/VALIDATION_AND_BACKLOG.md) | 실제 검증 결과와 다음 백로그 |
| [docs/IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md) | 구현 상태 요약 |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | 디자인 토큰, DS 컴포넌트 레이어, UI 마이그레이션 규칙 |
| [docs/INVENTORY_QR_PRD_V0.md](./docs/INVENTORY_QR_PRD_V0.md) | Post-MVP QR 인증, 30분 임시 선점, 냉장고 재고 운영 PRD |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | 디자인 토큰과 UI 가이드 |
| [docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md) | AI fixture와 카메라 QA 체크리스트 |
| [docs/BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md](./docs/BACKEND_RESPONSE_TO_POST_MVP_BLOCKERS_2026-05-29.md) | 2026-05-29 백엔드 Post-MVP blocker 회신 검토 |

## 용어 원칙

- 사용자-facing 문구에는 `post`, `게시글`, `product` 대신 `나눔 식재료`를 사용합니다.
- `default_location` 대신 `동네 위치`를 사용합니다.
- AI 결과를 `부패`, `상함`, `썩음`처럼 확정적으로 표현하지 않습니다.
- `requested`는 `신청 접수`이며 `예약 확정`이 아닙니다.
