# FoodLink — 프로젝트 개요

> **최종 수정일**: 2026-04-26  
> **프로젝트명**: FoodLink (패키지명: greennode)  
> **플랫폼**: React Native (Android / iOS)

---

## 서비스 정의

**Vision AI + GIS 기반 친환경 로컬 식재료 나눔 플랫폼**

사용자가 잉여 농산물 사진을 한 장만 촬영하면 Vision AI(YOLOv8 + ResNet-50)가 즉시 신선도를 판별하고, GIS 기반 매칭 알고리즘이 반경 2km 내 최적의 이웃에게 푸시 알림을 전송합니다.

---

## 핵심 기능

### 1. Vision AI 신선도 판별
- 사진 한 장으로 식재료의 종류와 신선도를 즉시 분석
- **YOLOv8**: 식재료 객체 탐지 (Object Detection)
- **ResNet-50**: 신선도 분류 (Fresh / Stale)
- 신선도가 "보통" 이하이면 나눔 등록 불가 → 음식물 쓰레기 사전 차단

### 2. GIS 기반 로컬 매칭
- 사용자 위치를 기반으로 **반경 2km 이내** 이웃과 매칭
- 공유 냉장고 위치를 지도에 표시
- 거리 정보 실시간 계산 (예: "400m 이내", "1.2km 이내")

### 3. 공유 냉장고 시스템
- 오프라인 공유 냉장고에 식재료를 보관
- 냉장고별 가용 상태(available) 실시간 확인
- 등록 시 냉장고를 선택하여 연결

### 4. 실시간 푸시 알림 (FCM)
- 새 식재료 등록 시 2km 내 사용자에게 자동 알림
- Firebase Cloud Messaging 기반

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
      │     → [부패] 등록 불가 안내
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
