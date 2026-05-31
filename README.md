# FoodLink

FoodLink는 남는 식재료를 AI로 확인한 뒤 가까운 공유 냉장고를 통해 이웃에게 연결하는 로컬 식재료 나눔 앱입니다. 이 저장소는 `greennode` 패키지명의 React Native Android/iOS 앱입니다.

서비스의 1차 목표는 사용자가 남는 식재료를 버리기 전 빠르게 처리하도록 돕는 것입니다. 환경 성취 지표는 핵심 보상이 아니라, 사용자가 좋은 행동을 했다는 사실을 확인하는 보조 정보로 둡니다.

## 서비스 설명

혼자 사는 사람이나 소규모 가구는 식재료가 조금씩 남아도 판매 글을 쓰거나 직접 전달 일정을 맞추기 번거롭습니다. FoodLink는 이 과정을 사진 촬영, AI 확인, 공유 냉장고 선택, 주변 사용자 알림으로 줄입니다.

공급자는 남는 식재료를 촬영하거나 갤러리에서 선택합니다. 앱은 AI 분석 결과로 나눔 가능 여부를 보여주고, 공급자는 보관할 공유 냉장고를 선택해 나눔 식재료를 등록합니다.

수요자는 홈에서 가까운 나눔 식재료를 먼저 발견합니다. 지도에서는 주변 공유 냉장고와 각 냉장고에 있는 나눔 식재료를 확인하고, 상세 화면에서 나눔 신청을 보냅니다.

## 사용자와 역할

| 역할 | 설명 |
| --- | --- |
| 공급자 | 남는 식재료를 등록하고 가까운 공유 냉장고에 맡기려는 사용자 |
| 수요자 | 주변 공유 냉장고에 등록된 나눔 식재료를 신청하려는 사용자 |
| 냉장고 운영자 | 공유 냉장고의 현장 재고, 폐기, 수령 확인을 관리하는 운영 역할 |

## 핵심 흐름

### 남는 식재료 등록

```text
남는 식재료 촬영/갤러리 선택
  -> AI 분석
  -> 나눔 가능 기준 확인
  -> 나눔 식재료 등록 정보 확인
  -> 등록 가능 공유 냉장고 선택
  -> 등록 완료
  -> 근처 사용자에게 푸시 알림
```

### 근처 나눔 신청

```text
홈에서 근처 나눔 식재료 발견
  -> 상세 화면 진입
  -> 보관 공유 냉장고 확인
  -> 나눔 신청하기
  -> status: available -> requested
  -> 공급자에게 신청 알림
```

`requested`는 신청 접수 상태입니다. 예약 확정이나 수령 완료가 아니며, 기본 흐름은 `available -> requested` 전환까지입니다.

## 주요 기능

### 인증과 동네 위치

이메일 회원가입/로그인과 JWT 기반 인증을 제공합니다. 사용자는 주변 나눔 식재료와 공유 냉장고를 찾기 위해 동네 위치를 등록해야 하며, 위치가 없으면 주요 흐름 진입 전에 위치 설정으로 안내합니다.

### AI 기반 식재료 확인

카메라 촬영 또는 갤러리 선택으로 식재료 사진을 보내면 백엔드 AI가 대표 식재료, 신선도 등급, confidence를 반환합니다. 앱은 `Fresh`와 `Mid`를 나눔 가능으로 표시하고 `Stale`은 등록하지 않습니다.

### 나눔 식재료 등록

AI 분석 결과를 확인한 뒤 등록 가능한 공유 냉장고를 선택해 나눔 식재료를 등록합니다. 등록이 완료되면 근처 사용자에게 알림이 발송되고, 홈과 지도에서 해당 나눔 식재료를 발견할 수 있습니다.

### 홈 발견 화면

홈은 냉장고 목록보다 가까운 나눔 식재료를 먼저 보여주는 화면입니다. 사용자는 거리, 등록 시간, 나눔 가능 기간을 바탕으로 지금 신청할 수 있는 식재료를 빠르게 확인합니다.

### 지도와 공유 냉장고 탐색

지도에서는 주변 공유 냉장고 위치를 확인하고, 선택한 냉장고에 보관 중인 신청 가능한(`available`) 나눔 식재료 목록을 볼 수 있습니다. 목록 항목은 상세 화면과 나눔 신청 흐름으로 이어집니다.

### 나눔 신청과 알림

수요자가 상세 화면에서 나눔 신청을 하면 서버는 상태를 `available`에서 `requested`로 바꿉니다. 앱은 중복 신청, 작성자 본인 신청, 신청 접수 상태를 사용자 문구로 처리합니다.

### 내 나눔과 받은 나눔

프로필에서는 내가 등록한 나눔 식재료와 내가 신청한 나눔 식재료를 확인합니다. 진행 중인 나눔, 신청 접수, QR 필요, 완료/취소/만료 같은 상태를 사용자에게 보이는 문구로 보여줍니다.

### QR과 냉장고 운영

공유 냉장고 QR 인증과 수령 QR 인증은 사용자가 실제 냉장고 앞에 왔는지 확인하기 위한 기능입니다. 냉장고 운영자는 재고 요약, 수령 확인, 폐기 처리 같은 현장 운영 작업을 관리합니다.

### 알림함과 알림 라우팅

FCM payload를 검증하고 로컬 알림함에 수신 기록을 저장합니다. 알림을 누르면 관련 나눔 식재료 상세 화면으로 이동합니다.

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
npm run qa:post-mvp-contracts
npm run mock:api
```

## 문서 지도

| 문서 | 역할 |
| --- | --- |
| [docs/PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md) | 제품 비전, MVP 경계, 사용자 흐름 |
| [docs/DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md) | FoodLink 도메인 용어와 상태 모델 |
| [docs/API_INTEGRATION_CONTRACT.md](./docs/API_INTEGRATION_CONTRACT.md) | API 접속, 요청/응답 계약, FCM 계약 |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | 디자인 토큰, DS 컴포넌트 레이어, UI 마이그레이션 규칙 |
| [docs/INVENTORY_QR_PRD_V0.md](./docs/INVENTORY_QR_PRD_V0.md) | QR 인증, 30분 임시 선점, 냉장고 재고 운영 PRD |
| [docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./docs/AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md) | AI fixture와 카메라 QA 체크리스트 |

## 용어 원칙

- 사용자-facing 문구에는 `post`, `게시글`, `product` 대신 `나눔 식재료`를 사용합니다.
- `default_location` 대신 `동네 위치`를 사용합니다.
- AI 결과를 `부패`, `상함`, `썩음`처럼 확정적으로 표현하지 않습니다.
- `requested`는 `신청 접수`이며 `예약 확정`이 아닙니다.
