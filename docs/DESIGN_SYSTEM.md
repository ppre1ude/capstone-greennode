# FoodLink 디자인 시스템

> **최종 수정일**: 2026-04-26  
> **코드 토큰 파일**: [`src/theme/`](../src/theme/) 디렉토리 참고

---

## 1. 컬러 팔레트

### Primary (브랜드 메인)

| 토큰명 | HEX | 용도 |
|--------|-----|------|
| `primary` | `#1E623B` | 메인 CTA 버튼, 헤더 액센트, 활성 탭, 주요 텍스트 강조 |
| `primaryDark` | `#164A2C` | 버튼 pressed 상태, 그림자 |
| `primaryLight` | `#E8F5E9` | 배경 틴트, 태그 배경 |

### Secondary (서브 컬러)

| 토큰명 | HEX | 용도 |
|--------|-----|------|
| `secondary` | `#628E4E` | 보조 텍스트 강조, 서브 뱃지, 아이콘 |
| `accent` | `#ABB863` | 데코레이션, 보조 아이콘, 배경 블러 장식 |
| `highlight` | `#FCE181` | 경고 뱃지, AI 바운딩 박스, 마감임박 표시, 포인트 강조 |

### Neutral (중립 / 배경)

| 토큰명 | HEX | 용도 |
|--------|-----|------|
| `background` | `#FFFFFF` | 기본 배경, 카드 배경 |
| `surface` | `#F5F5F5` | 섹션 배경, 입력 필드 배경 |
| `border` | `#E9ECEF` | 카드 테두리, 구분선 |
| `borderLight` | `#F0F0F0` | 미세한 구분선 |

### Text

| 토큰명 | HEX | 용도 |
|--------|-----|------|
| `textPrimary` | `#1A1A1A` | 본문 텍스트, 제목 |
| `textSecondary` | `#666666` | 보조 설명 텍스트 |
| `textTertiary` | `#999999` | 비활성 탭, 힌트 텍스트 |
| `textPlaceholder` | `#CCCCCC` | 입력 필드 placeholder |
| `textOnPrimary` | `#FFFFFF` | primary 배경 위의 텍스트 |

### Semantic (시멘틱)

| 토큰명 | HEX | 용도 |
|--------|-----|------|
| `success` | `#22C55E` | 신선도 높음, 성공 상태 |
| `warning` | `#F59E0B` | 신선도 보통, 주의 상태 |
| `error` | `#EF4444` | 부패 판정, 에러, 알림 뱃지 |
| `info` | `#3B82F6` | 내 위치 마커, 정보 안내 |

### Opacity 활용 패턴

```
primary/5   → 카드 배경 틴트 (예: GIS 매칭 카드)
primary/10  → 테두리 틴트
primary/20  → 아이콘 배경 (FAB 그림자)
primary/30  → 그림자 (shadow-[#1E623B]/30)
highlight/20 → 장식 블러 배경
highlight/30 → 아이콘 배경
black/20    → 카메라 오버레이 버튼
white/90    → 글래스모피즘 뱃지
```

---

## 2. 타이포그래피

### 폰트 패밀리

| 토큰 | 값 | 비고 |
|------|-----|------|
| `fontFamily` | `Pretendard` | 한글 최적화 웹폰트. RN에서는 커스텀 폰트로 설치 필요 |

> CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css`  
> React Native에서는 `assets/fonts/` 디렉토리에 `.otf` 파일 배치 후 `react-native.config.js`에서 링크

### 사이즈 스케일

| 토큰명 | Size | Weight | 용도 |
|--------|------|--------|------|
| `heading1` | 26px | Bold (700) | 온보딩 메인 타이틀 |
| `heading2` | 24px | ExtraBold (800) | 분석 결과 타이틀 |
| `heading3` | 20px | Bold (700) | 섹션 타이틀 (예: "근처의 신선한 나눔") |
| `heading4` | 18px | Bold (700) | 페이지 타이틀 (헤더) |
| `body` | 15px | Regular (400) | 본문 텍스트 |
| `bodyBold` | 15px | SemiBold (600) | 강조 본문 |
| `caption` | 13px | Bold (700) | 뱃지 텍스트, 보조 정보 |
| `small` | 11px | Medium (500) | 카메라 인디케이터, 힌트 |
| `tiny` | 10px | Bold (700) | 탭바 레이블, 신선도 퍼센트 |
| `micro` | 9px | Bold (700) | 마커 거리 표시 |

### Line Height

| 텍스트 유형 | Line Height |
|------------|-------------|
| Heading | `tight` (1.2) |
| Body | `relaxed` (1.6) |
| Caption / Small | `normal` (1.4) |

---

## 3. 스페이싱 & 레이아웃

### 간격 스케일

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `xs` | 4px | 아이콘과 텍스트 사이 미세 간격 |
| `sm` | 8px | 뱃지 내부 패딩, 작은 gap |
| `md` | 12px | 카드 내부 간격 |
| `lg` | 16px | 컴포넌트 간 간격 |
| `xl` | 20px | 페이지 좌우 패딩 (px-5) |
| `2xl` | 24px | 섹션 간 간격 |
| `3xl` | 32px | 큰 섹션 분리 |
| `4xl` | 48px | 온보딩 상단 여백 |

### 화면 패딩

| 영역 | 값 |
|------|-----|
| 페이지 좌우 패딩 | 20px (`xl`) |
| 페이지 하단 여백 (탭바 위) | 32px (`3xl`) |
| SafeArea 상단 | 시스템 기본값 |

### 카드 & 컨테이너

| 속성 | 값 |
|------|-----|
| 카드 border-radius | 20px |
| 버튼 border-radius | 16px (2xl) |
| 입력 필드 border-radius | 16px (2xl) |
| 히어로 카드 border-radius | 24px |
| 하단 시트 border-radius | 32px (top only) |
| FAB border-radius | 50% (원형) |
| 뱃지 border-radius | 9999px (full) |

---

## 4. 그림자 (Elevation)

| 레벨 | 값 | 용도 |
|------|-----|------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 카드 기본 |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | 마커 뱃지 |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | 히어로 카드, CTA 버튼 |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | 온보딩 일러스트 카드 |
| `shadow-sheet` | `0 -10px 40px rgba(0,0,0,0.1)` | 하단 시트 |
| `shadow-primary` | `0 8px 30px rgba(30,98,59,0.4)` | 메인 FAB 버튼 |

---

## 5. 아이콘

| 라이브러리 | 버전 |
|-----------|------|
| Font Awesome 6 (Solid + Regular) | 6.7.2 |

### 주요 아이콘 매핑

| 용도 | 아이콘 | 스타일 |
|------|--------|--------|
| 앱 로고 | `fa-solid fa-leaf` | primary |
| 홈 | `fa-solid fa-house` | — |
| 지도 | `fa-solid fa-map-location-dot` | — |
| 카메라/AI 스캔 | `fa-solid fa-camera` | — |
| 채팅 | `fa-solid fa-message` | — |
| 내 정보 | `fa-solid fa-user` | — |
| 위치 | `fa-solid fa-location-dot` | primary |
| 알림 | `fa-regular fa-bell` | — |
| AI 분석 | `fa-solid fa-wand-magic-sparkles` | primary |
| 닫기 | `fa-solid fa-xmark` | white |
| 뒤로가기 | `fa-solid fa-chevron-left` | — |
| 좋아요 | `fa-regular fa-heart` | — |
| 공유 | `fa-solid fa-share-nodes` | — |

---

## 6. 컴포넌트 스타일 가이드

### 버튼

| 종류 | 배경 | 텍스트 | 높이 | radius |
|------|------|--------|------|--------|
| Primary CTA | `primary` | white, Bold | 56~60px | 16px |
| Secondary | `surface` | `textSecondary`, Bold | 48~56px | 16px |
| Outline | transparent | `primary`, Bold | 48px | 16px |
| FAB (원형) | `primary` | white | 56px | 50% |
| 소셜 (카카오) | `#FEE500` | `#191919`, Bold | 56px | 16px |

### 입력 필드

| 속성 | 값 |
|------|-----|
| 배경 | `surface` (#F5F5F5) |
| 테두리 | `border` (#E9ECEF), 1px |
| 포커스 테두리 | `primary` |
| 텍스트 | `body` (15px) |
| 패딩 | 16px |
| border-radius | 16px |

### 하단 탭바

| 속성 | 값 |
|------|-----|
| 배경 | white |
| 높이 | 84px (safe area 포함) |
| 상단 테두리 | `border` 1px |
| 활성 탭 색 | `primary` |
| 비활성 탭 색 | `textTertiary` |
| 레이블 크기 | `tiny` (10px) |
| 중앙 FAB | `primary`, 56px 원형, white 테두리 4px |
