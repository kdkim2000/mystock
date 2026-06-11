# 의존성 분석서 (Dependency Analysis)

| 항목 | 내용 |
|:---|:---|
| 문서명 | 의존성 분석서 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

`src/` 디렉터리가 아직 존재하지 않으므로, 본 문서는 Phase 3 설계 문서(api-design.md, class-design.md)와 Phase 4 환경설정 가이드를 기반으로 한 **계획적 의존성 분석**이다. 목적은 구현 시작 전 빌드 순서를 결정하고 순환 의존성을 예방하는 것이다.

---

## 2. 외부 패키지 의존성 목록

| 패키지명 | 버전 | 용도 | 레이어 | 위험도 |
|:---|:---|:---|:---|:---:|
| `next` | 15.5 | App Router SSR/CSR 프레임워크 | 공용 | 낮음 |
| `react` / `react-dom` | 18.3 | UI 렌더링 | 공용 | 낮음 |
| `typescript` | 5.6 | 타입 시스템 | 공용 (dev) | 낮음 |
| `next-auth` | **4.x** | Google OAuth + JWT 세션 | 서버/공용 | **중간** |
| `next-themes` | 0.4 | 다크/라이트 모드 CSS class | 클라이언트 전용 | 낮음 |
| `recharts` | 3.7 | 차트 렌더링 (BarChart, AreaChart, RadarChart, ComposedChart, LineChart) | 클라이언트 전용 | 낮음 |
| `@tanstack/react-query` | 5.x | 서버 상태 관리·캐시 | 공용 | 낮음 |
| `@tanstack/react-table` | 8.x | 테이블 정렬·필터·페이지네이션 | 클라이언트 전용 | 낮음 |
| `zod` | 3.x | 환경변수 + API 입력 런타임 검증 | 공용 | 낮음 |
| `googleapis` | **144.x** | Google Sheets API v4 (서비스 계정 JWT) | **서버 전용** | **높음** |
| `openai` | 4.x | gpt-4o-mini AI 분석 호출 | 서버 전용 | **중간** |
| `vitest` | 2.x | 단위 테스트 | dev | 낮음 |
| `tailwindcss` | 3.x | 유틸리티 CSS | 공용 | 낮음 |
| `clsx` + `tailwind-merge` | latest | 조건부 클래스 결합 | 공용 | 낮음 |
| `lucide-react` | latest | 아이콘 라이브러리 | 공용 | 낮음 |
| `server-only` | latest | 서버 전용 모듈 강제 (빌드 에러로 클라이언트 import 차단) | 서버 전용 | 낮음 |

### 2.1 위험도 근거

**googleapis v144 (높음)**
- 번들 크기가 크기 때문에 `next.config.mjs`의 `outputFileTracingExcludes`에 반드시 추가해야 한다 (Vercel 250MB 제약).
- 서버 전용 모듈: 클라이언트 컴포넌트에서 import하면 빌드 실패 또는 API 키 노출.
- 대응: `import 'server-only'`를 `src/lib/sheets.ts` 파일 상단에 추가.

**next-auth v4 (중간)**
- v5(Auth.js)로 migration 시 `authOptions` export 패턴이 완전히 달라짐.
- v4 고정 사유: v5는 현재(2026-06) 베타 상태로 production 안정성 미검증.
- `src/lib/auth.ts`에 `authOptions` 집중 관리, 경로 변경 시 단일 파일만 수정.

**openai v4 (중간)**
- gpt-4o-mini 응답 지연(수 초) → 반드시 AI 캐시 7일 TTL 적용 (`_AI_CACHE_` Sheets 탭).
- 비용 제어: 캐시 HIT 시 API 미호출, 강제 갱신(POST)만 API 호출.

---

## 3. 내부 모듈 의존성 그래프

```
Layer 0  src/types/                         (의존성 없음 — 순수 타입 선언)
│         sheets.ts   → SheetTransactionRow, TickerCacheEntry, AiCacheEntry, TickerMasterRow, AggregationRow
│         kis.ts      → StockPrice, Valuation, FinancialSummary, DailyPrice, TradingTrend, AnalystOpinion, KisToken
│         dart.ts     → DartFinancial, DartDisclosure
│         ai.ts       → AiAnalysisResult
│         business.ts → PortfolioHolding, TradeStats, TechnicalIndicators
│
▼
Layer 1  src/lib/                           (types/* 참조, 외부 패키지 사용)
│         env.ts           ← zod만 사용 (types 미참조)
│         api-response.ts  ← next/server만 사용
│         indicators.ts    ← types/business.ts (TechnicalIndicators)
│         sheets.ts        ← types/sheets.ts, googleapis
│         cache.ts         ← types/sheets.ts, lib/sheets.ts
│         kis.ts           ← types/kis.ts, lib/cache.ts, lib/env.ts
│         dart.ts          ← types/dart.ts, lib/cache.ts, lib/env.ts
│         ai.ts            ← types/ai.ts, lib/cache.ts, lib/env.ts, openai
│         auth.ts          ← next-auth, lib/env.ts
│
▼
Layer 2  src/app/api/                       (lib/* 참조, 외부 직접 호출 없음)
│         auth/[...nextauth]/route.ts        ← lib/auth.ts
│         sheets/transactions/route.ts       ← lib/sheets.ts, lib/api-response.ts
│         sheets/ticker-master/route.ts      ← lib/sheets.ts, lib/api-response.ts
│         sheets/aggregation/route.ts        ← lib/sheets.ts, lib/api-response.ts
│         kis/price/route.ts                 ← lib/kis.ts, lib/api-response.ts
│         kis/valuation/route.ts             ← lib/kis.ts, lib/api-response.ts
│         kis/financial/route.ts             ← lib/kis.ts, lib/api-response.ts
│         kis/daily-price/route.ts           ← lib/kis.ts, lib/api-response.ts
│         kis/trading-trend/route.ts         ← lib/kis.ts, lib/api-response.ts
│         kis/opinion/route.ts               ← lib/kis.ts, lib/api-response.ts
│         dart/financial/route.ts            ← lib/dart.ts, lib/api-response.ts
│         fundamental/route.ts               ← lib/kis.ts (병렬), lib/api-response.ts
│         ai/analysis/route.ts               ← lib/ai.ts, lib/cache.ts, lib/api-response.ts
│         ticker/[code]/refresh/route.ts     ← 모든 lib/* (병렬 호출), maxDuration=60
│
▼
Layer 3  src/hooks/                         (app/api/* 경유 — 서버 직접 호출 없음)
│         use-transactions.ts     ← fetch('/api/sheets/transactions')
│         use-aggregation.ts      ← fetch('/api/sheets/aggregation')
│         use-stock-price.ts      ← fetch('/api/kis/price')
│         use-ai-analysis.ts      ← fetch('/api/ai/analysis')
│         use-refresh-ai.ts       ← POST fetch('/api/ai/analysis')
│         use-refresh-all.ts      ← POST fetch('/api/ticker/[code]/refresh'), 60s timeout
│
▼
Layer 4  src/components/ + src/app/(pages)  (hooks/, types/* 참조)
          components/ui/*          ← shadcn/ui (외부 deps만)
          components/auth/*        ← next-auth/react (useSession, signIn)
          components/dashboard/*   ← hooks/, types/business.ts
          components/stock/*       ← hooks/, types/kis.ts, dart.ts, ai.ts
          components/global/*      ← next-auth/react (SessionExpiredPrompt)
          app/dashboard/page.tsx   ← lib/sheets.ts (SSR prefetch), components/dashboard/*
          app/stock/[code]/page.tsx ← types/*, components/stock/*
          app/auth/signin/page.tsx  ← next-auth/react
          src/middleware.ts         ← next-auth/middleware (Edge Runtime)
```

### 3.1 금지 의존성 (순환 방지 규칙)

| 금지 방향 | 이유 |
|:---|:---|
| `lib/*` → `app/api/*` | 단방향 원칙: lib은 app을 알면 안 됨 |
| `types/*` → `lib/*` | 타입은 순수 선언만, 구현 참조 금지 |
| `components/*` → `lib/*` 직접 | API 키 클라이언트 번들 노출 방지 (API Route 경유 필수) |
| `lib/env.ts` → 클라이언트 컴포넌트 | 서버 전용 환경변수 노출 방지 |
| `hooks/*` → `lib/*` 직접 | hooks는 fetch()로 API Route만 호출 |

---

## 4. 구현 빌드 순서 (의존성 기반)

| 순서 | 대상 파일 | 예상 공수 | 레이어 | 검증 방법 |
|:---:|:---|:---:|:---:|:---|
| 1 | `src/types/*.ts` (5개) | 0.5일 | L0 | `npx tsc --noEmit` 오류 없음 |
| 2 | `src/lib/env.ts` | 0.25일 | L1 | `npm run dev` 시 env 검증 통과 |
| 3 | `src/lib/api-response.ts` | 0.25일 | L1 | TypeScript 타입 체크 |
| 4 | `src/lib/indicators.ts` + vitest | 0.5일 | L1 | `npm test` RSI·MACD 계산 정확도 |
| 5 | `src/lib/sheets.ts` | 0.5일 | L1 | Sheets read/write 수동 확인 |
| 6 | `src/lib/cache.ts` | 0.5일 | L1 | getCached TTL 만료 단위 테스트 |
| 7 | `src/lib/kis.ts` (토큰·스로틀) | 1일 | L1 | KIS 가격 조회, 400ms 간격 확인 |
| 8 | `src/lib/dart.ts` | 0.5일 | L1 | DART 재무 조회 수동 확인 |
| 9 | `src/lib/ai.ts` | 0.5일 | L1 | gpt-4o-mini 응답 수동 확인 |
| 10 | `src/lib/auth.ts` + middleware.ts | 0.5일 | L1/미들웨어 | 로그인·ALLOWED_EMAIL 동작 확인 |
| 11 | `/api/auth/[...nextauth]` | 0.25일 | L2 | Google OAuth 콜백 정상 처리 |
| 12 | `/api/sheets/*` (3개) | 0.5일 | L2 | `curl /api/sheets/transactions` 200 |
| 13 | `/api/kis/*` (6개) | 1일 | L2 | 400ms 스로틀 + 캐시 HIT/MISS |
| 14 | `/api/dart/financial`, `/api/fundamental` | 0.5일 | L2 | 응답 구조 + 병렬 호출 확인 |
| 15 | `/api/ai/analysis` (GET·POST) | 0.5일 | L2 | 7일 캐시 동작, 강제갱신 확인 |
| 16 | `/api/ticker/[code]/refresh` | 0.5일 | L2 | 60초 이내 8섹션 갱신 완료 |
| 17 | layout.tsx + providers + 공통 컴포넌트 | 0.5일 | L4 | 다크/라이트 테마 전환 확인 |
| 18 | SCR-001 로그인 화면 | 0.25일 | L4 | Google OAuth 로그인 성공 |
| 19 | SCR-002 대시보드 (7개 컴포넌트) | 2일 | L4 | KPI 4개 + 차트 + 테이블 렌더링 |
| 20 | SCR-003 종목상세 13섹션 | 3일 | L4 | 각 섹션 데이터 정상 렌더링 |
| **합계** | | **≈ 10일** | | |

---

## 5. 순환 의존성 위험 체크

구현 전 아래 패턴을 IDE 정적 분석 또는 `madge` 도구로 확인한다.

```bash
# madge로 순환 의존성 검사 (선택)
npx madge --circular src/
```

**예상 위험 지점**:

| 위험 시나리오 | 예방 방법 |
|:---|:---|
| `cache.ts`가 `kis.ts`를 import하는 순환 | cache.ts는 Sheets만 사용, KIS 로직 포함 금지 |
| `dashboard/page.tsx`가 `lib/sheets.ts`를 직접 import | Server Component에서만 허용 (클라이언트 번들 제외) |
| `components/stock/*`가 `lib/kis.ts`를 직접 import | fetch('/api/kis/*') 경유 필수 |
| `hooks/*`가 `lib/*`를 import | hooks는 fetch만 사용, lib 직접 참조 금지 |

---

## 6. Vercel 번들 크기 제약 대응

| 패키지 | 조치 |
|:---|:---|
| `googleapis` | `outputFileTracingExcludes`에 `'**/@google-cloud/**'` 추가 (next.config.mjs) |
| `@swc/core` | `outputFileTracingExcludes`에 `'**/@swc/core*'` 추가 |
| `sharp` | `outputFileTracingExcludes`에 `'**/node_modules/sharp/**'` 추가 |
| `openai` | 서버 전용 — 클라이언트 번들 미포함 확인 |

빌드 후 확인:
```bash
VERCEL_ANALYZE_BUILD_OUTPUT=1 npm run build
```
