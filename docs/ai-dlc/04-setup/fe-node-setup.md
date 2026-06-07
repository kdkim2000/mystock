# Node.js 의존성 정의 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | Node.js 의존성 정의 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock의 `package.json` 의존성을 정의한다. Next.js 15 App Router 기반으로 KIS Open API·DART API·OpenAI·Google Sheets와 연동하는 단일 사용자 주식 대시보드에 필요한 모든 패키지를 명세한다.

---

## 2. 전체 package.json

```json
{
  "name": "my-stock",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest --run"
  },
  "dependencies": {
    "next": "^15.5.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^4.24.0",
    "next-themes": "^0.4.0",
    "recharts": "^3.7.0",
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-table": "^8.20.0",
    "zod": "^3.23.0",
    "googleapis": "^144.0.0",
    "openai": "^4.68.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@tailwindcss/typography": "^0.5.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.5.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^25.0.0"
  }
}
```

---

## 3. 핵심 의존성 상세 설명

### 3.1 프레임워크

| 패키지 | 버전 | 역할 |
|:---|:---|:---|
| `next` | ^15.5.0 | App Router SSR/CSR, Route Handler, 미들웨어 |
| `react` | ^18.3.0 | UI 렌더링 |
| `react-dom` | ^18.3.0 | DOM 렌더링 |

### 3.2 인증

| 패키지 | 버전 | 역할 | 비고 |
|:---|:---|:---|:---|
| `next-auth` | ^4.24.0 | Google OAuth 2.0 + JWT 세션 | v5 베타 제외, v4 고정 |

`next-auth@4` 고정 이유: v5는 API가 불안정하고 `pages/` 라우터에서 `app/` 라우터로의 이관이 아직 완전하지 않음.

### 3.3 UI / 스타일링

| 패키지 | 버전 | 역할 |
|:---|:---|:---|
| `next-themes` | ^0.4.0 | 다크/라이트 테마 토글 (CSS class 기반) |
| `lucide-react` | ^0.460.0 | 아이콘 (shadcn/ui 의존성) |
| `class-variance-authority` | ^0.7.0 | shadcn/ui 컴포넌트 variant 시스템 |
| `clsx` | ^2.1.0 | 조건부 className 병합 |
| `tailwind-merge` | ^2.5.0 | Tailwind 클래스 충돌 해결 |

### 3.4 차트

| 패키지 | 버전 | 사용 차트 |
|:---|:---|:---|
| `recharts` | ^3.7.0 | BarChart (포지션·손익), AreaChart (누적수익), RadarChart (재무), ComposedChart (캔들+볼륨), LineChart (DART 추이) |

### 3.5 데이터 관리

| 패키지 | 버전 | 역할 |
|:---|:---|:---|
| `@tanstack/react-query` | ^5.59.0 | 클라이언트 데이터 패칭·캐싱 (staleTime 정책) |
| `@tanstack/react-table` | ^8.20.0 | DataTable 정렬·필터·페이지네이션 |
| `zod` | ^3.23.0 | API 응답 + 환경변수 런타임 검증 |

### 3.6 외부 API 클라이언트

| 패키지 | 버전 | 역할 |
|:---|:---|:---|
| `googleapis` | ^144.0.0 | Google Sheets API v4 (서비스 계정 JWT 인증) |
| `openai` | ^4.68.0 | OpenAI gpt-4o-mini (AI 종목 분석) |

> KIS Open API와 DART API는 표준 `fetch` API로 호출 (별도 SDK 없음).

### 3.7 개발 도구

| 패키지 | 역할 |
|:---|:---|
| `typescript@^5.6.0` | TypeScript 컴파일러 |
| `tailwindcss@^3.4.0` | Utility-first CSS |
| `@tailwindcss/typography` | prose 클래스 (AI 분석 텍스트 렌더링) |
| `vitest@^2.1.0` | 단위 테스트 러너 |
| `@vitejs/plugin-react` | Vitest React 지원 |
| `@testing-library/react` | 컴포넌트 테스트 |
| `jsdom` | Vitest 브라우저 환경 시뮬레이션 |

---

## 4. shadcn/ui 설치

shadcn/ui는 `package.json`에 직접 등록되지 않고 CLI로 컴포넌트별 설치한다.

```bash
# 초기화 (Style: Default, Base color: Neutral, CSS variables: Yes)
npx shadcn@latest init

# my-stock 사용 컴포넌트 설치
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add pagination
npx shadcn@latest add separator
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

설치 후 `src/components/ui/` 아래 컴포넌트 소스 파일이 생성됨.

---

## 5. 설치 절차

```bash
# 1. Node.js 버전 확인 (≥20 필수)
node -v

# 2. 의존성 설치
npm install

# 3. shadcn/ui 초기화
npx shadcn@latest init

# 4. 개발 서버 시작
npm run dev
```

---

## 6. 의존성 버전 고정 원칙

- `next-auth`: **v4 고정** (v5는 API 불안정)
- `recharts`: **^3.7** (v4는 API 변경 가능성)
- `googleapis`: **^144** (메이저 버전 변경 시 Sheets API 인터페이스 검토 필요)
- 나머지: 마이너 버전 자동 업데이트 허용 (`^`)

---

## 7. 패키지 크기 고려사항

Vercel 서버리스 번들 ≤250MB 제약 (CLAUDE.md):

| 패키지 | 크기 | 주의사항 |
|:---|:---|:---|
| `googleapis` | ~10MB | 서버 전용 — 클라이언트 번들에 포함되지 않도록 |
| `openai` | ~2MB | 서버 전용 |
| `recharts` | ~3MB | 클라이언트 전용 — `'use client'` 컴포넌트에서만 import |

`next.config.mjs`의 `outputFileTracingExcludes`로 `@swc/core`, `sharp` 등 불필요한 바이너리 제외.
