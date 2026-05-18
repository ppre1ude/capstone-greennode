# FoodLink 디자인 시스템

> **최종 수정일**: 2026-05-19
> **코드 토큰 파일**: [`src/theme/`](../src/theme/) 디렉토리 참고
> **컴포넌트 레이어**: [`src/design-system/`](../src/design-system/) 디렉토리 참고

---

## 1. 컬러 팔레트

### Primary (브랜드 메인)

| 토큰명         | HEX       | 용도                                                  |
| -------------- | --------- | ----------------------------------------------------- |
| `primary`      | `#1E623B` | 메인 CTA 버튼, 헤더 액센트, 활성 탭, 주요 텍스트 강조 |
| `primaryDark`  | `#164A2C` | 버튼 pressed 상태, 그림자                             |
| `primaryLight` | `#E8F5E9` | 배경 틴트, 태그 배경                                  |

### Secondary (서브 컬러)

| 토큰명      | HEX       | 용도                                                    |
| ----------- | --------- | ------------------------------------------------------- |
| `secondary` | `#628E4E` | 보조 텍스트 강조, 서브 뱃지, 아이콘                     |
| `accent`    | `#ABB863` | 데코레이션, 보조 아이콘, 배경 블러 장식                 |
| `highlight` | `#FCE181` | AI 바운딩 박스, 오늘 추천/권장 수령일 표시, 포인트 강조 |

### Neutral (중립 / 배경)

| 토큰명        | HEX       | 용도                      |
| ------------- | --------- | ------------------------- |
| `background`  | `#FFFFFF` | 기본 배경, 카드 배경      |
| `surface`     | `#F5F5F5` | 섹션 배경, 입력 필드 배경 |
| `border`      | `#E9ECEF` | 카드 테두리, 구분선       |
| `borderLight` | `#F0F0F0` | 미세한 구분선             |

### Text

| 토큰명            | HEX       | 용도                     |
| ----------------- | --------- | ------------------------ |
| `textPrimary`     | `#1A1A1A` | 본문 텍스트, 제목        |
| `textSecondary`   | `#666666` | 보조 설명 텍스트         |
| `textTertiary`    | `#999999` | 비활성 탭, 힌트 텍스트   |
| `textPlaceholder` | `#CCCCCC` | 입력 필드 placeholder    |
| `textOnPrimary`   | `#FFFFFF` | primary 배경 위의 텍스트 |

### Semantic (시멘틱)

| 토큰명    | HEX       | 용도                              |
| --------- | --------- | --------------------------------- |
| `success` | `#22C55E` | 나눔 가능, 성공 상태              |
| `warning` | `#F59E0B` | 확인 필요, 재촬영 권장 상태       |
| `error`   | `#EF4444` | 나눔 기준 미충족, 에러, 알림 뱃지 |
| `info`    | `#3B82F6` | 내 위치 마커, 정보 안내           |

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

| 토큰         | 값           | 비고                                                 |
| ------------ | ------------ | ---------------------------------------------------- |
| `fontFamily` | `Pretendard` | 한글 최적화 웹폰트. RN에서는 커스텀 폰트로 설치 필요 |

> CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css`  
> React Native에서는 `assets/fonts/` 디렉토리에 `.otf` 파일 배치 후 `react-native.config.js`에서 링크

### 사이즈 스케일

| 토큰명     | Size | Weight          | 용도                                   |
| ---------- | ---- | --------------- | -------------------------------------- |
| `heading1` | 26px | Bold (700)      | 온보딩 메인 타이틀                     |
| `heading2` | 24px | ExtraBold (800) | 분석 결과 타이틀                       |
| `heading3` | 20px | Bold (700)      | 섹션 타이틀 (예: "근처의 신선한 나눔") |
| `heading4` | 18px | Bold (700)      | 페이지 타이틀 (헤더)                   |
| `body`     | 15px | Regular (400)   | 본문 텍스트                            |
| `bodyBold` | 15px | SemiBold (600)  | 강조 본문                              |
| `caption`  | 13px | Bold (700)      | 뱃지 텍스트, 보조 정보                 |
| `small`    | 11px | Medium (500)    | 카메라 인디케이터, 힌트                |
| `tiny`     | 10px | Bold (700)      | 탭바 레이블, 신선도 퍼센트             |
| `micro`    | 9px  | Bold (700)      | 마커 거리 표시                         |

### Line Height

| 텍스트 유형     | Line Height     |
| --------------- | --------------- |
| Heading         | `tight` (1.2)   |
| Body            | `relaxed` (1.6) |
| Caption / Small | `normal` (1.4)  |

---

## 3. 스페이싱 & 레이아웃

### 간격 스케일

| 토큰명 | 값   | 용도                           |
| ------ | ---- | ------------------------------ |
| `xs`   | 4px  | 아이콘과 텍스트 사이 미세 간격 |
| `sm`   | 8px  | 뱃지 내부 패딩, 작은 gap       |
| `md`   | 12px | 카드 내부 간격                 |
| `lg`   | 16px | 컴포넌트 간 간격               |
| `xl`   | 20px | 페이지 좌우 패딩 (px-5)        |
| `2xl`  | 24px | 섹션 간 간격                   |
| `3xl`  | 32px | 큰 섹션 분리                   |
| `4xl`  | 48px | 온보딩 상단 여백               |

### 화면 패딩

| 영역                       | 값            |
| -------------------------- | ------------- |
| 페이지 좌우 패딩           | 20px (`xl`)   |
| 페이지 하단 여백 (탭바 위) | 32px (`3xl`)  |
| SafeArea 상단              | 시스템 기본값 |

### 카드 & 컨테이너

| 속성                      | 값              |
| ------------------------- | --------------- |
| 카드 border-radius        | 20px            |
| 버튼 border-radius        | 16px (2xl)      |
| 입력 필드 border-radius   | 16px (2xl)      |
| 히어로 카드 border-radius | 24px            |
| 하단 시트 border-radius   | 32px (top only) |
| FAB border-radius         | 50% (원형)      |
| 뱃지 border-radius        | 9999px (full)   |

---

## 4. 그림자 (Elevation)

| 레벨             | 값                              | 용도                  |
| ---------------- | ------------------------------- | --------------------- |
| `shadow-sm`      | `0 1px 2px rgba(0,0,0,0.05)`    | 카드 기본             |
| `shadow-md`      | `0 4px 6px rgba(0,0,0,0.07)`    | 마커 뱃지             |
| `shadow-lg`      | `0 10px 15px rgba(0,0,0,0.1)`   | 히어로 카드, CTA 버튼 |
| `shadow-xl`      | `0 20px 25px rgba(0,0,0,0.1)`   | 온보딩 일러스트 카드  |
| `shadow-sheet`   | `0 -10px 40px rgba(0,0,0,0.1)`  | 하단 시트             |
| `shadow-primary` | `0 8px 30px rgba(30,98,59,0.4)` | 메인 FAB 버튼         |

---

## 5. 아이콘

| 라이브러리                       | 버전  |
| -------------------------------- | ----- |
| Font Awesome 6 (Solid + Regular) | 6.7.2 |

### 주요 아이콘 매핑

| 용도           | 아이콘                            | 스타일  |
| -------------- | --------------------------------- | ------- |
| 앱 로고        | `fa-solid fa-leaf`                | primary |
| 홈             | `fa-solid fa-house`               | —       |
| 지도           | `fa-solid fa-map-location-dot`    | —       |
| 카메라/AI 스캔 | `fa-solid fa-camera`              | —       |
| 채팅           | `fa-solid fa-message`             | —       |
| 내 정보        | `fa-solid fa-user`                | —       |
| 위치           | `fa-solid fa-location-dot`        | primary |
| 알림           | `fa-regular fa-bell`              | —       |
| AI 분석        | `fa-solid fa-wand-magic-sparkles` | primary |
| 닫기           | `fa-solid fa-xmark`               | white   |
| 뒤로가기       | `fa-solid fa-chevron-left`        | —       |
| 좋아요         | `fa-regular fa-heart`             | —       |
| 공유           | `fa-solid fa-share-nodes`         | —       |

---

## 6. 컴포넌트 스타일 가이드

이 섹션의 표는 시각 기준값이다. 새 화면이나 기존 화면 수정에서는 화면별 `StyleSheet`에 버튼/칩/입력/카드 스타일을 다시 만들기보다, 먼저 `src/design-system`의 DS 프리미티브를 사용한다. 화면별 스타일은 배치, 화면 고유 간격, 도메인 레이아웃에 한정한다.

### 버튼

| 종류          | 배경        | 텍스트                | 높이    | radius |
| ------------- | ----------- | --------------------- | ------- | ------ |
| Primary CTA   | `primary`   | white, Bold           | 56~60px | 16px   |
| Secondary     | `surface`   | `textSecondary`, Bold | 48~56px | 16px   |
| Outline       | transparent | `primary`, Bold       | 48px    | 16px   |
| FAB (원형)    | `primary`   | white                 | 56px    | 50%    |
| 소셜 (카카오) | `#FEE500`   | `#191919`, Bold       | 56px    | 16px   |

### 입력 필드

| 속성          | 값                      |
| ------------- | ----------------------- |
| 배경          | `surface` (#F5F5F5)     |
| 테두리        | `border` (#E9ECEF), 1px |
| 포커스 테두리 | `primary`               |
| 텍스트        | `body` (15px)           |
| 패딩          | 16px                    |
| border-radius | 16px                    |

### 하단 탭바

| 속성         | 값                                     |
| ------------ | -------------------------------------- |
| 배경         | white                                  |
| 높이         | 84px (safe area 포함)                  |
| 상단 테두리  | `border` 1px                           |
| 활성 탭 색   | `primary`                              |
| 비활성 탭 색 | `textTertiary`                         |
| 레이블 크기  | `tiny` (10px)                          |
| 중앙 FAB     | `primary`, 56px 원형, white 테두리 4px |

---

## 7. Montage 기반 컴포넌트 레이어

Montage Android/iOS는 GreenNode의 색상 팔레트 대체재가 아니라 **컴포넌트 API와 상태 체계의 참조 모델**로 사용한다. 색상 값은 계속 `src/theme/colors.ts`의 FoodLink/GreenNode 팔레트를 사용한다.

### 코드 위치

| 레이어        | 경로                 | 역할                                                                                                           |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| 토큰          | `src/theme/`         | 기존 색상, 타이포그래피, 스페이싱, radius, layout source of truth                                              |
| 컴포넌트      | `src/design-system/` | Montage식 `variant`, `color`, `tone`, `size`, `status`, `loading`, `disabled`, slot props를 RN 컴포넌트로 제공 |
| 제품 컴포넌트 | `src/components/`    | 도메인 데이터를 디자인 시스템 컴포넌트 조합으로 표현                                                           |

### 첫 프리미티브

| 컴포넌트      | Montage 대응           | 주요 props                                                                            | 사용처                        |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| `DSButton`    | `Button`, `TextButton` | `variant`, `color`, `size`, `loading`, `disabled`, `leading`, `trailing`, `fullWidth` | CTA, 보조 액션, 텍스트 버튼   |
| `DSChip`      | `Chip`, `ContentBadge` | `variant`, `size`, `tone`, `selected`, `disabled`, `leading`, `trailing`              | 상태 뱃지, 필터, 작은 선택 UI |
| `DSTextField` | `TextField`            | `label`, `required`, `status`, `caption`, `leading`, `trailing`                       | 검색, 로그인/가입 입력        |
| `DSCard`      | `Card`                 | `variant`, `padded`, `onPress`, `disabled`                                            | 피드 카드, 정보 카드          |
| `DSListCell`  | `ListCell`             | `title`, `caption`, `leading`, `trailing`, `selected`, `chevron`, `divider`           | 프로필 메뉴, 선택 목록        |
| `DSText`      | `Typography`           | `variant`, `color`, `align`                                                           | 토큰 기반 텍스트              |

### 컴포넌트 카탈로그

`src/design-system/catalog/DesignSystemCatalog.tsx`는 DS 프리미티브의 대표 상태를 한 화면에 렌더링하는 export-only 카탈로그다. 프로덕션 네비게이션에는 연결하지 않으며, 새 variant나 상태를 추가할 때 이 카탈로그와 `__tests__/designSystem.catalog.test.tsx`를 함께 갱신한다.

### 현재 적용 범위

- 홈의 `NearbyPostCard`는 `DSCard`, `DSChip`, `DSText` 조합으로 마이그레이션했다.
- 로그인/회원가입/위치 설정/나눔 등록/나눔 상세의 반복 CTA, 입력, 상태 표시 패턴은 DS 프리미티브로 점진 치환한다.
- 카드의 이미지, 상대 시각, 냉장고명 fallback, 상태 라벨 정책은 기존 제품 로직을 유지한다.
- 새 DS 레이어 적용은 화면 전체 재작성보다 반복되는 버튼/칩/텍스트/입력/카드 패턴을 점진적으로 치환하는 방식으로 진행한다.

### 아이콘 규칙

- DS 컴포넌트는 `leading`/`trailing` slot의 간격, 정렬, disabled opacity 같은 배치 규칙을 담당한다.
- 아이콘의 의미와 실제 glyph 선택은 호출 화면이 소유한다. Font Awesome 연결이 필요한 화면에서는 기존 프로젝트 아이콘 규칙을 우선하고, 아직 emoji/text icon을 쓰는 화면은 화면 고유 장식으로 남긴다.
- slot에 들어가는 아이콘 색은 가능한 DS 컴포넌트의 텍스트/상태 색을 따르게 만든다. 독립 색상이 꼭 필요하면 해당 화면의 도메인 의미를 주석이나 문서에 남긴다.

### 마이그레이션 규칙

- 새 화면이나 수정 화면에서 버튼, 칩/뱃지, 입력 필드, 카드, 리스트 셀, 반복 텍스트 스타일을 추가할 때는 먼저 `src/design-system` 프리미티브를 사용한다.
- 기존 화면별 `StyleSheet`에 색상/폰트/간격을 직접 추가해야 한다면, 컴포넌트화하기 어려운 이유가 명확해야 한다.
- Montage의 `semantic token`, `variant/size/status enum`, `slot-based API`, `loading/disabled/selected state`는 가져오되, Wanted의 blue/neutral 팔레트 값은 가져오지 않는다.
- `DSChip.selected`는 필터/선택 UI처럼 실제 선택 상태일 때만 쓴다. 단순 상태 뱃지나 품질 라벨은 `tone="primary|success|warning|error|neutral"`로 시각 의도를 표현한다.
- `DSChip`, `DSCard`, `DSListCell`은 `onPress`가 없으면 비상호작용 `View`로 렌더링한다. 동작하지 않는 요소에 `button` 접근성 역할을 노출하지 않는다.
- `DSTextField`는 `label`을 기본 접근성 라벨로 사용하고, `status="error"`일 때 `caption`을 오류 힌트로 연결한다.
