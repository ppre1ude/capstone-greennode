# FoodLink 디자인 시스템

> **최종 수정일**: 2026-06-06
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
| `tiny`     | 10px | Bold (700)      | 탭바 레이블, 보조 배지                 |
| `micro`    | 9px  | Bold (700)      | 마커 거리 표시                         |

### Line Height

| 텍스트 유형     | Line Height     |
| --------------- | --------------- |
| Heading         | `tight` (1.2)   |
| Body            | `relaxed` (1.6) |
| Caption / Small | `normal` (1.4)  |

---

### AI Confidence Display

- `confidenceScore`는 내부 검토/분기 신호이며 사용자와 운영자 화면에 숫자, 소수, 퍼센트로 표시하지 않는다.
- `AI 참고 신호 92%`, `신뢰도 0.94`, `상태가 좋아 보여요 · 94%` 같은 정량 문구는 금지한다.
- 화면에는 `나눔 가능`, `확인 필요`, `상태가 좋아 보여요`, `사진으로 상태를 확인하기 어려워요`처럼 정성 라벨과 실제 확인 안내만 사용한다.

### Product Copy / Trust Labels

- `trust-summary`, `ProviderTrustSummary`, `공급자 신뢰` 같은 계약/내부 도메인 용어를 사용자-facing 제목이나 설명에 그대로 쓰지 않는다.
- 프로필과 나눔 상세의 공개 지표 제목은 `나눔 신뢰 지표`를 사용한다.
- QR 기반 지표를 설명하는 보조 칩은 `QR 기반`처럼 추상적으로 쓰지 말고 `QR 인증`처럼 사용자가 수행한 행동을 드러낸다.
- `positiveReviewCount`의 화면 라벨은 번역투인 `좋은 평가` 대신 `긍정 평가`를 사용한다.
- `QR 생명주기`처럼 구현 흐름을 설명하는 표현은 화면에서 피하고, `나눔 약속과 받은 긍정 평가가 건강한 나눔 커뮤니티를 만듭니다.`처럼 사용자 행동과 커뮤니티 의미를 설명한다.

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

### Safe-Area Fixed Surfaces

- 하단 고정 CTA는 `DSScreenFooter`를 사용하고, 화면별 `paddingBottom`을 직접 고정하지 않는다.
- 하단 안내 카드 안에서 긴 설명과 CTA가 함께 있을 때는 한 줄 `row`로 경쟁시키지 않는다. 설명 그룹을 먼저 배치하고 CTA는 아래 줄에 두어 좁은 화면에서도 글자와 버튼이 겹치지 않게 한다.
- 지도 검색창처럼 상단에 떠 있는 컨트롤은 고정 `top` 값 대신 `getHeaderTopPadding()`을 사용해 Android status bar와 iOS safe area를 피한다.
- 한 화면의 인접한 허브/통계 카드가 같은 상태 라벨과 같은 카운트를 반복하지 않게 한다. 예를 들어 홈의 `진행 중인 나눔`은 action hub가 담당하고, 통계 카드는 `주변 나눔`, `오늘 추천`처럼 다른 의사결정 신호를 요약한다.

### Notice / Notification Panels

- 모달, 팝업, 알림, 하단 안내 카드처럼 사용자의 다음 행동을 돕는 패널은 흰 카드만 반복하지 않는다.
- 기본 조합은 `#F8FCF4` 계열의 아주 연한 surface tint, `secondary` 투명 테두리, `primaryLight` 아이콘 배지, `accent` 상단 라인이다.
- 긴 설명과 CTA는 같은 줄에서 경쟁시키지 않고, 아이콘+텍스트 묶음 다음 줄에 CTA를 둔다.
- 장식은 상태를 구분하는 보조 신호로만 사용한다. 새 문구를 늘리거나 정량 점수, 퍼센트, 내부 신호를 패널에 추가하지 않는다.
- 알림함 빈 상태처럼 화면 중앙에 놓이는 안내도 bare icon + text로 두지 않는다. 현재 알림 유형을 짧게 보여주는 signal row를 함께 배치해 다음에 무엇이 모이는지 알 수 있게 한다.
- QR 인증처럼 상태 전이가 필요한 안내 패널은 `준비 중`, `지원 예정` 같은 막힌 상태만 노출하지 않는다. 카메라 자동 인식이 불가능한 환경에서는 냉장고 공개 코드 입력처럼 동일 인증 계약으로 이어지는 사용자 행동을 함께 제공한다.
- QR 보관/수령 인증 화면은 route의 `mode`에 맞는 단일 행동만 노출한다. 공급자 보관 화면에 `수령 인증` 전환을, 수요자 수령 화면에 `보관 인증` 전환을 두지 않는다.
- QR 카메라 스캔이 지원되는 환경에서는 화면 진입 즉시 카메라를 암묵적으로 켜지 않고 `카메라로 QR 스캔` 같은 명시적 시작 액션을 먼저 둔다.

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

| 라이브러리                                                       | 버전   |
| ---------------------------------------------------------------- | ------ |
| react-native-vector-icons FontAwesome6 (Solid + Regular + Brand) | 10.3.0 |

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
| `DSIcon`      | `Icon`                 | `name`, `size`, `color`, `variant`                                                    | 탭, 버튼 slot, 액션 아이콘    |
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
- 아이콘의 의미와 실제 glyph 선택은 호출 화면이 소유하되, 실제 렌더링은 `DSIcon`과 FontAwesome6 기반 vector icon을 우선한다.
- 리스트 메뉴의 leading 아이콘은 glyph 폭에 따라 텍스트 시작점이 흔들리지 않도록 고정 폭을 지정하고 중앙 정렬한다.
- Android/iOS 이식성을 위해 액션, 내비게이션, 입력, 버튼 slot에는 시스템 emoji를 쓰지 않는다. 화면 고유 일러스트레이션도 새로 추가할 때는 vector icon 또는 asset을 우선한다.
- `DSIcon`이 시스템 fallback glyph로 보이지 않도록 Android는 `android/app/build.gradle`의 `react-native-vector-icons/fonts.gradle`, iOS는 `ios/greennode/Info.plist`의 `UIAppFonts`에 FontAwesome6 폰트를 등록한다.
- slot에 들어가는 아이콘 색은 가능한 DS 컴포넌트의 텍스트/상태 색을 따르게 만든다. 독립 색상이 꼭 필요하면 해당 화면의 도메인 의미를 주석이나 문서에 남긴다.

### 마이그레이션 규칙

- 새 화면이나 수정 화면에서 버튼, 칩/뱃지, 입력 필드, 카드, 리스트 셀, 반복 텍스트 스타일을 추가할 때는 먼저 `src/design-system` 프리미티브를 사용한다.
- 기존 화면별 `StyleSheet`에 색상/폰트/간격을 직접 추가해야 한다면, 컴포넌트화하기 어려운 이유가 명확해야 한다.
- Montage의 `semantic token`, `variant/size/status enum`, `slot-based API`, `loading/disabled/selected state`는 가져오되, Wanted의 blue/neutral 팔레트 값은 가져오지 않는다.
- `DSChip.selected`는 필터/선택 UI처럼 실제 선택 상태일 때만 쓴다. 단순 상태 뱃지나 품질 라벨은 `tone="primary|success|warning|error|neutral"`로 시각 의도를 표현한다.
- `DSChip`, `DSCard`, `DSListCell`은 `onPress`가 없으면 비상호작용 `View`로 렌더링한다. 동작하지 않는 요소에 `button` 접근성 역할을 노출하지 않는다.
- `DSTextField`는 `label`을 기본 접근성 라벨로 사용하고, `status="error"`일 때 `caption`을 오류 힌트로 연결한다.

### 2026-05-19 지도 화면 적용 메모

- 지도 화면의 검색 입력, 냉장고 카드/시트, retry/refresh/detail/sheet 액션은 `DSTextField`, `DSCard`, `DSChip`, `DSButton`, `DSListCell` 조합으로 치환했다.
- 액션 아이콘은 `DSIcon`을 `leading`/`trailing` slot에 넣고, 지도 마커와 현재 위치 버튼처럼 MapView 상호작용에 직접 연결된 화면 고유 glyph도 후속 마이그레이션에서 vector icon 또는 asset으로 치환한다.
- `DSChip.selected`는 실제 선택 UI에만 사용하고, 지도 냉장고의 `운영중` 표시는 static status라 `tone="primary"`를 사용한다.

### 2026-05-26 디자인 리뷰 후속 기준

plan-design-review 기준 현재 앱의 UX/UI 완성도는 약 6/10이다. 원래 MVP 흐름인 등록/발견/신청 접수는 보이지만 반복 사용 제품으로 보이려면 나눔 생명주기 action 노출과 모바일 마감 품질을 먼저 올린다.

디자인 시스템 관점의 우선순위:

1. Fixed footer safe area
   - 하단 CTA는 Android/iOS system navigation 영역과 겹치면 안 된다.
   - `AnalysisResultScreen`, `PostCreateScreen`, `FridgeSelectScreen`, `PostCompleteScreen`, `PostDetailScreen` 계열은 화면별 고정 `paddingBottom` 대신 `useSafeAreaInsets()` 기반 공통 footer 패턴으로 통합한다.
   - 완료 기준은 Android emulator/실기기 screenshot에서 CTA가 잘리지 않고, iOS simulator에서도 home indicator와 적정 간격을 유지하는 것이다.
2. QR productization
   - 실제 사용자 route에서는 `테스트`, `프로토타입`, `초기화`, `보관 QR 테스트`, `수령 QR 테스트` 같은 내부 QA 문구를 노출하지 않는다.
   - API-backed QR 보관/수령은 `냉장고 QR 인증`, `보관 인증`, `수령 인증` 같은 제품 언어로 표시한다.
   - QR 화면 진입은 `mode`와 `postId`가 있는 보관/수령 생명주기 경로에서만 노출하고, 프로필 같은 일반 메뉴에서 무파라미터 QR 샘플 화면으로 직접 보내지 않는다.
   - prototype-only 조작은 개발/QA 전용 route 또는 fixture 화면으로 분리한다.
3. Emoji removal
   - action, navigation, input, button slot에서 emoji를 제거하고 `DSIcon` 또는 image asset으로 치환한다.
   - 대상 예시는 지도 marker/현재 위치, 상세 삭제/상태 아이콘, 알림 empty icon, 완료 화면 celebration icon, 프로필 메뉴 leading icon이다.
   - 장식 목적의 illustration도 신규 추가 시 vector icon 또는 asset을 우선한다.
4. Map bottom surface
   - 냉장고 선택 시 carousel card와 상세 sheet가 동시에 primary surface가 되지 않게 한다.
   - 선택 상태에서는 하나의 bottom sheet가 냉장고 요약, 내부 available 목록, refresh/detail action을 담당한다.
   - 지도는 배경 장식이 아니라 탐색 surface이므로 하단 UI가 지도 가시성을 과도하게 가리지 않아야 한다.
5. Lifecycle-first home/profile
   - 홈 상단 또는 전용 허브에는 `입고 QR 필요`, `수령 QR 필요`, `30분 남음`, `신청 접수` 같은 현재 action을 compact card/list로 노출한다.
   - 프로필은 `준비 중` 메뉴를 늘리는 곳이 아니라 내 나눔, 받은 나눔, 알림/작업 중 최소 하나를 실제 관리 surface로 승격하는 곳이다.
