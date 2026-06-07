# FoodLink

FoodLink는 남는 식재료를 Vision AI로 확인하고, 가까운 공유 냉장고의 QR 인증을 통해 실제 보관과 수령까지 연결하는 로컬 식재료 나눔 앱입니다. 이 저장소는 `greennode` 패키지명의 React Native Android/iOS 앱입니다.

핵심 가치는 사용자가 남는 식재료를 버리기 전에 빠르게 처리하도록 돕는 것입니다. 환경 성취 지표는 핵심 보상이 아니라, 수령까지 완료된 나눔을 바탕으로 사용자가 좋은 행동을 했다는 사실을 확인하는 보조 레이어로 둡니다.

## 현재 기준선

- 정식 제품 흐름은 `농산물 등록 흐름 -> 보관 QR 인증 -> available -> 신청 접수/임시 선점 -> 수령 QR 인증 -> 완료`입니다.
- `POST /posts`는 사용자-facing 목록에 바로 노출되는 항목이 아니라 `pending_store` 등록 대기를 만듭니다.
- 보관 QR 인증이 끝나야 홈, 지도, 냉장고별 목록, `share_created` 알림에 노출됩니다.
- `requested`는 예약 확정이 아니라 신청 접수와 30분 임시 선점입니다.
- 다중 감지 응답은 `detections[].shareable` 기준으로 등록 대상과 제외 대상을 나누며, `selectedDetectionId`는 전송하지 않습니다.
- 서버 저장형 알림, 서버 검색, impact summary는 프론트 연결 경로와 검증 하네스가 준비되어 있지만 최신 live VM/OpenAPI 재검증이 남아 있습니다.

## 사용자와 역할

| 역할 | 설명 |
| --- | --- |
| 공급자 | 남는 식재료를 촬영/선택하고, AI 확인 후 공유 냉장고에 보관하려는 사용자 |
| 수요자 | 주변 공유 냉장고에 보관된 나눔 식재료를 신청하고 수령하려는 사용자 |
| 냉장고 운영자 | 공유 냉장고의 현장 재고, 수령 확인, 폐기 처리를 관리하는 운영 역할 |

## 핵심 흐름

### 농산물 등록 흐름

```text
식재료 촬영 또는 갤러리 선택
  -> AI 분석
  -> 나눔 가능/확인 필요/제외 대상 확인
  -> 등록 가능 공유 냉장고 선택
  -> POST /posts
  -> status: pending_store
  -> 10분 안에 공유 냉장고 QR 인증
  -> status: available
  -> 근처 사용자에게 나눔 알림
```

한 이미지에서 여러 품목이 감지되면 앱은 `shareable=true` 품목만 등록 대상으로 보여줍니다. 최종 등록 payload는 `imageToken`, `fridgeId`, `flow`, 선택 `expirationDate`만 보내고, 서버가 품목별 `PostRead[]`를 반환합니다. 여러 `pending_store` 품목은 QR 화면에서 `1/N` 진행률로 순차 보관 인증합니다.

### 나눔 신청과 수령

```text
홈/지도/알림에서 available 나눔 식재료 발견
  -> 상세 화면 진입
  -> 나눔 신청하기
  -> status: available -> requested
  -> 30분 임시 선점
  -> 공유 냉장고 앞에서 수령 QR 인증
  -> status: completed
```

`requested`는 신청이 접수되어 잠시 잡혀 있는 상태입니다. 수요자가 제한 시간 안에 수령 QR 인증을 완료해야 실제 나눔 완료가 됩니다.

### 냉장고 운영

```text
운영자 콘솔 진입
  -> 담당 공유 냉장고 재고 요약 확인
  -> 보관 품목 목록 확인
  -> 만료/폐기 대상 처리
  -> disposed 상태 반영
```

운영자 콘솔 진입은 `/auth/me`의 `isOperator`, `operatorRole`, `operatorFridgeIds`를 기준으로 제어합니다. 소비자 앱 안에서 운영자 권한을 부여하거나 변경하지 않습니다.

## 주요 기능

### 인증과 동네 위치

이메일 회원가입/로그인과 JWT 기반 인증을 제공합니다. 사용자는 주변 나눔 식재료와 공유 냉장고를 찾기 위해 동네 위치를 등록해야 합니다. 위치가 없으면 홈, 지도, 등록 흐름 진입 전에 위치 설정으로 안내합니다.

### Vision AI 나눔 가능 기준 확인

카메라 촬영 또는 갤러리 선택 이미지로 `POST /posts/generate`를 호출합니다. 백엔드는 대표 식재료, 신선도 등급, `imageToken`, `detections[]`, 선택적 `rejectionReason`/`reviewReason`을 반환합니다.

앱은 `Fresh`와 `Mid`를 사용자 흐름에서 `상태가 좋아 보여요`와 `나눔 가능`으로 통합합니다. `Stale` 또는 hard block `rejectionReason`은 등록을 막고, 낮은 confidence나 soft review는 숫자 없이 `확인 필요`로 안내합니다.

### 나눔 식재료 등록과 QR 보관

등록은 `pending_store`에서 시작합니다. 공급자는 선택한 공유 냉장고 앞에서 10분 안에 냉장고 QR을 스캔해야 하고, 보관 인증이 성공해야 `available`로 전환됩니다.

QR은 냉장고에 고정된 식별자입니다. 인증 자체는 서버가 로그인 사용자, 진행 중인 action, 냉장고, 제한 시간을 검증해 처리합니다.

### 홈 발견과 진행 중인 나눔

홈은 냉장고 목록보다 가까운 `available` 나눔 식재료를 먼저 보여줍니다. 동시에 입고 QR 필요, 수령 QR 필요, 신청 접수, 남은 제한 시간 같은 진행 중인 action을 보여줍니다.

검색은 홈/지도에서 서버 `q` 검색을 우선 시도하고, endpoint 미배포나 실패 시 마지막 unfiltered 목록의 로컬 필터로 fallback합니다.

### 지도와 공유 냉장고 탐색

지도는 주변 공유 냉장고와 각 냉장고 안의 `available` 나눔 식재료를 탐색하는 화면입니다. 냉장고 선택 시 하단 primary surface에서 냉장고 정보, 빈 상태, 내부 목록, 상세 이동 흐름을 제공합니다.

### 내 나눔과 받은 나눔

프로필에서는 내가 등록한 나눔 식재료와 내가 신청/수령한 나눔 식재료를 확인합니다. `pending_store`, `available`, `requested`, `completed`, `cancelled`, `expired`, `disposed` 상태를 사용자-facing 문구로 번역해 보여줍니다.

### 알림함과 알림 라우팅

FCM payload는 문자열 + camelCase 형식으로 검증하고 로컬 알림함에 기록합니다. 알림을 누르면 관련 나눔 식재료 상세 화면으로 이동합니다.

서버 저장형 알림 API는 Post-MVP source of truth로 채택했습니다. 앱은 서버 record를 우선하고, 로컬 FCM 기록은 offline/foreground fallback cache로 유지합니다.

### 수령 경험 평가와 나눔 신고

수령 QR 인증으로 완료된 받은 나눔에만 평가와 신고를 허용합니다. 평가는 태그 기반 경험 피드백이고, 신고는 단일 사유를 가진 운영자 검토 큐입니다.

공개 화면의 `나눔 신뢰 지표`는 QR 보관 인증, 수령 완료, 긍정 평가처럼 공개 가능한 긍정/검증 신호만 요약합니다. 신고 건수, 위반 여부, 제재 이력은 공개 뱃지에 노출하지 않습니다.

### 냉장고 운영자 재고 관리

운영자는 담당 공유 냉장고의 요약과 보관 품목을 확인하고, `available` 또는 `expired` 품목을 폐기 처리할 수 있습니다. `requested`, `completed`, `pending_store`, `cancelled`, `disposed` 폐기는 서버가 409로 거절합니다.

## 나눔 상태 모델

| 상태 | 사용자-facing 의미 | 제품 규칙 |
| --- | --- | --- |
| `pending_store` | 입고 대기 | 보관 QR 인증 전이며 public 목록에 노출하지 않습니다. |
| `available` | 신청 가능 | 보관 QR 인증 후 홈/지도/냉장고 목록에 노출됩니다. |
| `requested` | 신청 접수/임시 선점 | 30분 동안 추가 신청을 막고 수령 QR 인증을 기다립니다. |
| `completed` / `picked_up` | 수령 완료 | 수령 QR 인증 또는 예외 운영 처리로 완료됩니다. |
| `cancelled` | 취소 | 등록자, 신청자, 정책에 따라 종료된 상태입니다. |
| `expired` | 기한 만료 | 나눔 가능 기간 또는 QR 제한 시간이 지난 상태입니다. |
| `disposed` | 폐기 완료 | 냉장고 운영자가 현장 폐기 처리한 상태입니다. |

`reserved`는 정식 QR 흐름에서 사용하지 않습니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 앱 | React Native 0.85.0, React 19.2.3, TypeScript |
| 네비게이션 | React Navigation |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 카메라 | react-native-vision-camera |
| 이미지 선택 | react-native-image-picker |
| 지도/위치 | react-native-maps, react-native-geolocation-service |
| 푸시 알림 | @react-native-firebase/messaging |
| UI 기반 | `src/theme`, `src/design-system`, react-native-vector-icons |
| 폼/검증 | react-hook-form, zod |
| 테스트 | Jest, React Test Renderer |

## 프로젝트 구조

```text
src/
  api/            API client와 응답 정규화
  components/     도메인 데이터를 조합하는 제품 컴포넌트
  config/         API base URL 등 실행 설정
  design-system/  GreenNode 토큰 기반 DS 프리미티브
  features/       inventory, QR, trust 같은 도메인 feature module
  navigation/     Auth/Main/Root 네비게이션
  screens/        화면 단위 구현
  services/       FCM, 디바이스 등록, 알림 처리
  store/          Zustand store
  theme/          컬러, 타이포그래피, spacing, radius, layout 토큰
  types/          API/도메인 타입
  utils/          정책, validation, formatting helper
docs/             제품/도메인/API/검증 문서
scripts/          mock API와 QA 계약 검증 스크립트
__tests__/        단위/화면/API 계약 테스트
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

NHN Cloud API는 SSH 터널을 통해 접근합니다. 실제 VM API를 사용하려면 별도 터미널에서 아래 명령을 실행하고 열어둡니다.

```sh
ssh -L 8080:localhost:80 NHN-Cloud-Server
```

환경별 base URL은 [src/config/api.ts](./src/config/api.ts)에 정의되어 있습니다.

- Android 에뮬레이터: `http://10.0.2.2:8080`
- iOS 시뮬레이터: `http://localhost:8080`
- Android 실기기: [src/config/api.ts](./src/config/api.ts)의 `ANDROID_DEVICE_HOST`에 SSH 터널을 연 PC의 LAN IP 설정

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
npm run lint -- --quiet
npm test -- --runInBand
node ./node_modules/typescript/bin/tsc --noEmit
npm run qa:ai-fixtures
npm run qa:ai-fixtures -- --report-only --shape-only
npm run qa:backend-contracts
npm run qa:backend-contracts -- --mutate
npm run qa:post-mvp-contracts
npm run mock:api
```

`qa:backend-contracts -- --mutate`는 실제 VM 또는 격리된 mock API에 대해 상태 변경을 수행합니다. 최신 live VM 증거로 보려면 하네스 report의 `targetIdentity.kind`가 `local-mock`이 아니어야 합니다.

## 문서 지도

| 문서 | 역할 |
| --- | --- |
| [docs/PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md) | 제품 비전, MVP 경계, 사용자 흐름 |
| [docs/DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md) | FoodLink 도메인 용어와 상태 모델 |
| [docs/API_INTEGRATION_CONTRACT.md](./docs/API_INTEGRATION_CONTRACT.md) | API 접속, 요청/응답 계약, FCM 계약 |
| [docs/VALIDATION_AND_BACKLOG.md](./docs/VALIDATION_AND_BACKLOG.md) | 최신 검증 기준선, 활성 blocker, 다음 작업 |
| [docs/IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md) | 구현 상태 요약과 검증 이력 |
| [docs/INVENTORY_QR_PRD_V0.md](./docs/INVENTORY_QR_PRD_V0.md) | QR 인증, 30분 임시 선점, 냉장고 재고 운영 PRD |
| [docs/TRUST_FEEDBACK_OPERATING_MODEL.md](./docs/TRUST_FEEDBACK_OPERATING_MODEL.md) | 수령 경험 평가, 나눔 신고, 나눔 신뢰 지표 운영 모델 |
| [docs/POST_MVP_PRODUCT_CONTRACT_DECISIONS.md](./docs/POST_MVP_PRODUCT_CONTRACT_DECISIONS.md) | Post-MVP 제품/계약 결정과 보류 범위 |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | 디자인 토큰, DS 컴포넌트 레이어, UI 마이그레이션 규칙 |
| [docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md) | AI fixture와 카메라 QA 체크리스트 |
| [docs/AUTH_EXPANSION_PHASE4_CONTRACT.md](./docs/AUTH_EXPANSION_PHASE4_CONTRACT.md) | 이메일 인증, 소셜 로그인, 계정 병합 Phase 4 계약 |

## 용어 원칙

- 사용자-facing 문구에는 `post`, `게시글`, `product`, `inventory item` 대신 `나눔 식재료`를 사용합니다.
- `default_location` 대신 `동네 위치`를 사용합니다.
- AI 결과를 `부패`, `상함`, `썩음`처럼 확정적으로 표현하지 않습니다.
- `requested`는 `신청 접수`와 `임시 선점`이며 `예약 확정`이 아닙니다.
- `pending_store`는 `입고 대기`이며 `등록 완료`나 `신청 가능`이 아닙니다.
- 공개 화면에는 `trust-summary`, `공급자 신뢰`, `신뢰도 점수` 대신 `나눔 신뢰 지표`를 사용합니다.
