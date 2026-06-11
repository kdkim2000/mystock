# Next.js 프로젝트 초기화 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | Next.js 프로젝트 초기화 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 **Next.js 15.5 App Router** 기반의 단일 사용자 주식 투자 대시보드다. 본 가이드는 프로젝트 초기화, TypeScript 설정, Vercel 배포 설정까지의 환경 구성을 다룬다.

---

## 2. Next.js 15 App Router 초기화

```bash
npx create-next-app@latest my-stock \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 2.1 CLI 선택 옵션

| 항목 | 선택 |
|:---|:---:|
| TypeScript | ✅ |
| ESLint | ✅ |
| Tailwind CSS | ✅ |
| `src/` directory | ✅ |
| App Router | ✅ |
| Import alias (`@/*`) | ✅ |

---

## 3. tsconfig.json 설정

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**핵심 설정 이유:**
- `strict: true` — TypeScript 18개 인터페이스의 타입 안전성 보장
- `moduleResolution: "bundler"` — Next.js 15 권장 설정
- `paths: { "@/*": ["./src/*"] }` — 절대 경로 임포트 (`@/lib/sheets`, `@/types/kis` 등)

---

## 4. next.config.mjs 설정

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      // Vercel 번들 ≤250MB 제약 대응 (CLAUDE.md)
      '*': [
        '**/@swc/core*',
        '**/node_modules/sharp/**',
        '**/node_modules/canvas/**',
      ]
    }
  }
}

export default nextConfig
```

### 4.1 maxDuration 설정 (Vercel Pro 필수)

`/api/ticker/[code]/refresh` Route Handler에 직접 선언:

```typescript
// src/app/api/ticker/[code]/refresh/route.ts
export const maxDuration = 60  // Vercel Pro 필수
```

> ⚠️ Vercel Free 플랜은 기본 10초 제한. Pro 플랜에서만 60초 설정 가능.

---

## 5. 프로젝트 폴더 구조

```
my-stock/
├── src/
│   ├── types/
│   │   ├── sheets.ts        ← SheetTransactionRow, TickerCacheEntry, AiCacheEntry, TickerMasterRow, AggregationRow
│   │   ├── kis.ts           ← StockPrice, Valuation, FinancialSummary, DailyPrice, TradingTrend, AnalystOpinion, KisToken
│   │   ├── dart.ts          ← DartFinancial, DartDisclosure
│   │   ├── ai.ts            ← AiAnalysisResult
│   │   └── business.ts      ← PortfolioHolding, TradeStats, TechnicalIndicators
│   ├── lib/
│   │   ├── kis.ts           ← KIS API 클라이언트 + 400ms 스로틀
│   │   ├── dart.ts          ← DART API 클라이언트
│   │   ├── sheets.ts        ← Google Sheets API v4 클라이언트
│   │   ├── cache.ts         ← 3계층 캐시 (globalThis → /tmp/ → Sheets)
│   │   ├── ai.ts            ← OpenAI gpt-4o-mini 분석
│   │   ├── indicators.ts    ← RSI(14)·MACD(12,26,9) 클라이언트 계산
│   │   └── env.ts           ← Zod 환경변수 검증
│   ├── app/
│   │   ├── layout.tsx                       ← 전역 레이아웃 (ThemeProvider, SessionProvider)
│   │   ├── page.tsx                         ← /dashboard 리다이렉트
│   │   ├── dashboard/
│   │   │   └── page.tsx                     ← 대시보드 메인
│   │   ├── auth/
│   │   │   └── signin/page.tsx              ← Google OAuth 로그인
│   │   ├── stock/
│   │   │   └── [code]/page.tsx              ← 종목 상세 (13개 섹션)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  ← NextAuth 핸들러
│   │       ├── sheets/
│   │       │   ├── transactions/route.ts
│   │       │   ├── ticker-master/route.ts
│   │       │   └── aggregation/route.ts
│   │       ├── kis/
│   │       │   ├── price/route.ts
│   │       │   ├── valuation/route.ts
│   │       │   ├── financial/route.ts
│   │       │   ├── daily-price/route.ts
│   │       │   ├── trading-trend/route.ts
│   │       │   └── opinion/route.ts
│   │       ├── dart/
│   │       │   └── financial/route.ts
│   │       ├── fundamental/route.ts
│   │       ├── ai/
│   │       │   └── analysis/route.ts
│   │       └── ticker/
│   │           └── [code]/
│   │               └── refresh/route.ts     ← maxDuration=60
│   └── components/
│       ├── ui/                              ← shadcn/ui 기본 컴포넌트
│       ├── dashboard/                       ← 대시보드 전용 컴포넌트
│       └── stock/                           ← 종목상세 전용 컴포넌트
├── docs/                                    ← AI-DLC 산출물
├── middleware.ts                            ← 전역 JWT 인증 (프로젝트 루트)
├── .env.local                               ← 로컬 환경변수 (gitignore)
├── env.example                              ← 공개 환경변수 템플릿
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── vitest.config.ts
```

---

## 6. 환경변수 파일 구성

### 6.1 .env.local (로컬 개발, gitignore 대상)

```env
# NextAuth
AUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_EMAIL=

# Google Sheets
GOOGLE_SPREADSHEET_ID=
GOOGLE_SHEET_NAME=매매내역
GOOGLE_SHEET_TICKER_MASTER=종목코드
GOOGLE_SHEET_AGGREGATION=종목별집계
GOOGLE_APPLICATION_CREDENTIALS=./my-stock-service-account.json

# DART API
DART_API_KEY=

# KIS Open API
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_APP_SVR=prod
KIS_THROTTLE_MS=400

# OpenAI
OPENAI_API_KEY=
```

### 6.2 Vercel 환경변수 (Production)

`GOOGLE_APPLICATION_CREDENTIALS` 대신 `GOOGLE_SERVICE_ACCOUNT_JSON`(JSON 한 줄 문자열) 사용:

```bash
# Vercel 대시보드 Environment Variables에 추가
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

---

## 7. vercel.json 설정

```json
{
  "functions": {
    "src/app/api/ticker/[code]/refresh/route.ts": {
      "maxDuration": 60
    }
  }
}
```

---

## 8. vitest.config.ts 설정

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  }
})
```

---

## 9. .nvmrc / engines

```
# .nvmrc
20
```

```json
// package.json engines 필드
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## 10. 초기화 완료 체크리스트

- [ ] `npx create-next-app` 실행 완료
- [ ] `tsconfig.json` strict + paths 설정 확인
- [ ] `next.config.mjs` outputFileTracingExcludes 추가
- [ ] `vercel.json` maxDuration=60 설정
- [ ] `.env.local` 환경변수 입력 완료
- [ ] `env.example` 최신 상태 확인
- [ ] `vitest.config.ts` 설정
- [ ] `npm run dev` — localhost:3000 정상 구동 확인
