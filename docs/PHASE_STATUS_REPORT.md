# FoodLink — 프론트엔드 페이즈별 구현 현황 리포트

> **작성일**: 2026-04-26  
> **브랜치**: `ui/workflow`

본 문서는 초기 기획된 프론트엔드 개발 플랜(Phase 1 ~ Phase 6)을 기준으로, 현재까지의 **구현 완료 사항**과 **미완성(추후 과제) 사항**을 점검하고, 앞으로 유저가 수행해야 할 **Next Steps(향후 과제)**를 안내하기 위해 작성되었습니다.

---

## 1. 페이즈별 진행 현황 요약 (Phase 1 ~ 6)

초기 계획했던 모든 페이즈의 **UI/UX 및 네비게이션 흐름, 로컬 로직 처리는 100% 구현 완료**되었습니다.

### ✅ Phase 1: 기반 세팅 및 인증 (Auth) — **완료**
- **구현 사항**:
  - `SplashScreen` (자동 로그인 검증 로직)
  - `OnboardingScreen` (기능 소개)
  - `LoginScreen` & `LoginEmailScreen` (소셜 및 이메일 로그인 UI)
  - `SignupScreen` (회원가입, Zod 기반 유효성 검증)
  - **상태/통신**: `Zustand` 기반 `authStore`, `axios` 인터셉터 및 JWT 토큰 관리 로직 연동

### ✅ Phase 2: 위치 설정 및 메인 화면 — **완료**
- **구현 사항**:
  - `LocationSetupScreen` (초기 가입 시 GPS 권한 요청 및 위치 등록)
  - `HomeScreen` (반경 내 나눔 게시글 피드, AI 스캔 배너, Pull-to-refresh)
  - `MainTab` (하단 네비게이션 바, 중앙 FAB 구조)

### ✅ Phase 3: 카메라 촬영 및 AI 분석 — **완료**
- **구현 사항**:
  - `CameraScanScreen` (`react-native-vision-camera` 네이티브 카메라 연동, 갤러리 폴백, 스캔 애니메이션)
  - `AnalysisResultScreen` (AI 신선도 판별 결과, 권장/주의 상태 분기)

### ✅ Phase 4: 게시글 등록 흐름 — **완료**
- **구현 사항**:
  - `PostCreateScreen` (AI 추천 제목/카테고리 폼 자동 완성)
  - `FridgeSelectScreen` (나눔할 근처 공유 냉장고 탐색 및 라디오 버튼 선택)
  - `PostCompleteScreen` (등록 성공 및 이웃 푸시 알림 모의 피드백)
  - `PostDetailScreen` (피드 상세 조회 및 본인 글 나눔 취소(삭제) 기능)

### ✅ Phase 5: 지도 및 냉장고 탐색 — **완료**
- **구현 사항**:
  - `MapScreen` (`react-native-maps` 연동, 반경 2km 원 표시, 냉장고 마커 시각화)
  - 지도 마커와 하단 가로 스크롤 캐러셀(Carousel) 카드 연동

### ✅ Phase 6: 알림 및 내 정보 — **완료**
- **구현 사항**:
  - `ProfileScreen` (유저 닉네임, 신뢰도 온도 🌡️, 포인트 대시보드, 로그아웃 기능)
  - `ChatListScreen` (나눔 메시지 및 푸시 알림 확인용 UI)

---

## 2. 미완성 사항 (향후 구현 과제)

현재 프론트엔드의 화면 단은 모두 완성되었으나, 실제 프로덕션 수준의 서비스를 위해 **백엔드/시스템 통합 측면에서 다음 항목들이 남아 있습니다.**

1. **실제 Push Notification 연동 (FCM)**
   - 알림/채팅 탭(`ChatListScreen`) 및 등록 완료 모의 푸시 화면은 현재 더미 데이터로 동작합니다.
   - `@react-native-firebase/messaging` 라이브러리를 추가하여, 백엔드로부터 실제 기기 푸시를 받는 로직이 필요합니다.
2. **QR 코드 인증 흐름 구현 (MVP 후순위)**
   - 냉장고에 도착해 짐을 넣고 "QR 코드를 스캔"하여 나눔을 최종 확정 짓는 플로우의 UI와 로직은 아직 제작되지 않았습니다. (현재는 앱 상에서만 완료 처리됨)
3. **채팅 (Chat) 시스템 고도화**
   - 1:1 메시징이 필요하다면, WebSocket 통신 또는 채팅 API 연동 작업이 필요합니다.

---

## 3. 유저의 다음 할 일 (Next Steps)

프론트엔드 개발자(유저님)가 이어서 작업해야 할 최우선 순위 항목들입니다.

### 📝 Step 1: 백엔드 API 통합 테스트
- `src/api/` 폴더 아래에 생성된 함수들(`auth.ts`, `posts.ts`, `fridges.ts`)을 실제 백엔드(NHN Cloud FastAPI 서버)와 연결해 봅니다.
- **체크리스트**:
  - [ ] 백엔드 서버 구동 및 엔드포인트 주소(BASE_URL) 확인
  - [ ] 회원가입/로그인 후 토큰이 정상적으로 넘어오고 AsyncStorage에 저장되는지 확인
  - [ ] AI 스캔 (`/api/v1/posts/generate`) 시 Multipart/form-data 이미지가 잘 전송되고 신선도 결과를 받아오는지 확인

### 📝 Step 2: 실기기(Device) 빌드 및 네이티브 모듈 검증
- 카메라(`vision-camera`), 지도(`maps`), GPS(`geolocation`)는 에뮬레이터에서 완벽한 테스트가 어렵습니다.
- 안드로이드 공기계나 iOS 기기(아이폰)에 직접 앱을 빌드해서 카메라 화질과 지도 마커 로딩 속도를 점검해야 합니다.

### 📝 Step 3: 에러 핸들링 및 예외 처리 고도화
- GPS 권한 거부 시, 카메라 권한 거부 시 대체할 UI 플로우(Fallback) 꼼꼼하게 다듬기
- 네트워크 오프라인 상태(Offline) 대비 문구 띄우기

---
**요약:** 껍데기(UI)와 로직의 뼈대(Store, API 함수)는 모두 준비되었습니다! 이제 **"백엔드와의 실제 통신(API 연동)"과 "실기기 테스트"**에 집중하시면 됩니다.
