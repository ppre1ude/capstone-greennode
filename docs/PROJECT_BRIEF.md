# FoodLink — 프로젝트 개요

> **최종 수정일**: 2026-05-05
> **프로젝트명**: FoodLink (패키지명: greennode)  
> **플랫폼**: React Native (Android / iOS)

---

## 서비스 정의

**Vision AI + GIS 기반 친환경 로컬 식재료 나눔 플랫폼**

사용자가 잉여 농산물 사진을 한 장만 촬영하면 Vision AI(YOLOv8 + ResNet-50)가 즉시 신선도를 판별하고, GIS 기반 매칭 알고리즘이 반경 2km 내 최적의 이웃에게 푸시 알림을 전송합니다.

### 현재 MVP 검증 기준

2026-05-05 검증 기준으로 앱은 이메일 로그인, 위치 등록, 갤러리 이미지 기반 실제 AI 분석, 실제 게시글 생성, 냉장고 선택, 홈/지도 기본 조회까지 동작한다. 다만 아래 항목은 아직 목표 상태와 차이가 있다.

- 도메인 용어 기준은 [CONTEXT.md](../CONTEXT.md)를 따른다. 특히 `default_location`은 쓰지 않고, 사용자 위치는 **동네 위치**와 **위치 미설정 사용자**로 구분한다.
- 카메라 셔터 촬영은 `react-native-vision-camera@5` API에 맞춰 수정됐고, 에뮬레이터에서 촬영 파일 생성 및 실제 `/posts/generate` 호출까지 재검증됐다. 실제 기기 촬영은 별도 확인이 남았다.
- AI 응답은 현재 단일 대표 객체(`detectedFruit`) 중심으로 처리한다. multi-object detection은 다음 스프린트 연구/계약 설계 항목이다.
- `Stale/Bad/Rotten` 또는 `canShare=false` 상태는 분석 결과, 게시글 작성, 최종 등록 단계에서 등록을 차단한다.
- 비식재료/스크린샷 false-positive는 서버/AI 계약에서 우선 차단하고, 앱은 실패 사유를 표시하는 방향으로 정리했다. fixture 기준은 [AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md](./AI_QA_FIXTURES_AND_CAMERA_CHECKLIST.md)를 따른다.
- FCM은 토큰 등록까지만 앱에서 구현됐고, foreground/background 수신 처리와 알림함은 미구현이다.
- 채팅, 유저 통계, 탄소 절감액, 소셜 로그인, 이메일 verification은 목업 또는 미구현 상태다.

---

## 핵심 기능

### 1. Vision AI 신선도 판별
- 사진 한 장으로 식재료의 종류와 신선도를 즉시 분석
- **기획/백엔드 목표**: YOLOv8 기반 객체 탐지, ResNet-50 기반 신선도 분류
- **현재 앱 계약**: `POST /api/v1/posts/generate`가 `PostGenerateResult`를 반환하고, 앱은 단일 대표 객체와 `Fresh/Normal/Stale/Bad/Rotten` 계열 **신선도 등급** 문자열을 매핑한다.
- **현재 앱 정책**: 부패 의심 상태는 등록 차단, 낮은 confidence는 `확인 필요` 상태로 표시한다.

### 2. GIS 기반 로컬 매칭
- 사용자 위치를 기반으로 **반경 2km 이내** 이웃과 매칭
- 공유 냉장고 위치를 지도에 표시
- 거리 정보 실시간 계산 (예: "400m 이내", "1.2km 이내")
- **현재 검증 결과**: 광주 전남대 인근 좌표에서 냉장고 목록은 실제 API로 조회됐다. 단, 주변 냉장고 없음 상태는 임의 좌표에서도 서버가 3건을 반환해 별도 서버 필터 검증이 필요하다.

### 3. 공유 냉장고 시스템
- 오프라인 공유 냉장고에 식재료를 보관
- 등록 가능한 공유 냉장고 목록 확인
- 등록 시 냉장고를 선택하여 연결

### 4. 실시간 푸시 알림 (FCM)
- 새 식재료 등록 시 2km 내 사용자에게 자동 알림을 보내는 것이 목표
- **현재 앱 구현**: Firebase Messaging 의존성, Android 알림 권한, FCM 토큰 등록
- **미구현**: 실제 알림 수신 handler, 알림 목록, 읽음 상태, 알림 탭 데이터 연동

---

## 사용자 플로우

```
앱 실행
  → 스플래시 (토큰 검증)
  → 온보딩 워크스루 (최초 1회)
  → 로그인 / 회원가입 (이메일 + 비밀번호)
  → 위치 등록 (GPS 권한 + FCM 토큰)
  → 홈 화면
      ├── 근처 나눔 식재료 목록
      ├── 근처 공유 냉장고 현황
      ├── AI 스캔 (카메라)
      │     → 촬영 → AI 분석 → 결과 확인
      │     → [신선] 게시글 등록 → 냉장고 선택 → 완료
      │     → [부패/불확실] 재촬영 또는 수동 확인 필요
      ├── 지도 (냉장고 위치)
      └── 내 정보 (프로필, 로그아웃)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React Native (TypeScript) |
| 네비게이션 | React Navigation (Stack + Bottom Tabs) |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 카메라 | react-native-vision-camera |
| 지도 | react-native-maps (Google Maps) |
| 위치 | react-native-geolocation-service |
| 푸시 알림 | @react-native-firebase/messaging |
| 폼 검증 | react-hook-form + zod |
| 인증 | JWT Bearer Token (AsyncStorage) |

---

## 백엔드 연동

- **서버**: NHN Cloud (SSH 터널 경유)
- **Base URL**: `http://10.0.2.2:8080` (Android 에뮬레이터 기준)
- **API 명세**: [FRONTEND_INTEGRATION_GUIDE.md](../FRONTEND_INTEGRATION_GUIDE.md) 참고
- **Swagger UI**: `http://localhost:8080/docs` (SSH 터널 연결 후)
- **Firebase 프로젝트**: `foodlink-cf8e7`
- **MVP 검증 문서**: [MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md](./MVP_VALIDATION_AND_NEXT_SPRINT_TODO.md)

---

## 팀 구성

- **프론트엔드**: React Native 앱 개발, UI/UX 구현
- **백엔드**: FastAPI 서버, DB 관리, AI 모델 연동
- **AI/ML**: YOLOv8 + ResNet-50 모델 학습 및 서빙

---

## 관련 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| API 연동 가이드 | [FRONTEND_INTEGRATION_GUIDE.md](../FRONTEND_INTEGRATION_GUIDE.md) | 백엔드 API 명세 및 연동 방법 |
| 디자인 시스템 | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 컬러, 타이포그래피, 스페이싱 토큰 |
