# Next.js 구현 계획서

| 항목 | 내용 |
|:---|:---|
| 문서명 | Next.js App Router 기반 구현 계획서 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

### 구현 철학

```
types → lib → api routes → layout → pages → components
```

각 레이어가 완료된 후 다음 레이어로 진행한다. 레이어 간 의존성이 명확하므로 이 순서를 지키면 컴파일 오류와 런타임 오류를 최소화할 수 있다.

**실제 코딩 전 필수 사전 준비**:
- 환경변수 `.env.local` 전체 설정 완료
- Google Sheets 5개 탭 수동 생성 (매매내역, _TICKER_CACHE_, _AI_CACHE_, 종목코드마스터, 종목별집계)
- KIS Open API 앱키·시크릿 발급 완료

---

## 2. Phase별 구현 계획

### Phase 1 — 기반 레이어 (1~2일)

타입 정의와 서버 유틸리티를 먼저 완성한다. 이 단계 후 `npm run build`가 타입 오류 없이 통과해야 한다.

#### 타입 파일 (src/types/)

| 파일 | 포함 타입 |
|:---|:---|
| `sheets.ts` | `SheetTransactionRow`, `TickerCacheEntry`, `AiCacheEntry`, `TickerMasterRow`, `AggregationRow` |
| `kis.ts` | `StockPrice`, `Valuation`, `FinancialSummary`, `DailyPrice`, `TradingTrend`, `AnalystOpinion`, `KisToken` |
| `dart.ts` | `DartFinancial`, `DartDisclosure` |
| `ai.ts` | `AiAnalysisResult` |
| `business.ts` | `PortfolioHolding`, `TradeStats`, `TechnicalIndicators` |

#### 서버 유틸 파일 (src/lib/)

```typescript
// src/lib/env.ts — Zod 환경변수 검증 (서버 시작 시 즉시 검증)
import 'server-only'
import { z } from 'zod'
const envSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_SPREADSHEET_ID: z.string().min(1),
  GOOGLE_SHEET_NAME: z.string().default('매매내역'),
  DART_API_KEY: z.string().min(1),
  KIS_APP_KEY: z.string().min(1),
  KIS_APP_SECRET: z.string().min(1),
  KIS_THROTTLE_MS: z.coerce.number().default(400),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  ALLOWED_EMAIL: z.string().email().optional(),
})
export const env = envSchema.parse(process.env)
```

```typescript
// src/lib/api-response.ts — 공통 응답 유틸
import { NextResponse } from 'next/server'
export function ok<T>(data: T, cachedAt?: string) {
  return NextResponse.json({ data, ...(cachedAt && { cachedAt }) })
}
export function err(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}
```

```typescript
// src/lib/indicators.ts — 클라이언트사이드 기술적 지표 (FR-019)
// RSI-14: dailyPrice 배열 → 0~100 값
export function calculateRSI(prices: number[], period = 14): number[]

// MACD(12,26,9): dailyPrice → { macd, signal, histogram } 배열
export function calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9):
  { macd: number; signal: number; histogram: number }[]
```

**검증**: `npm test` → indicators.test.ts RSI·MACD 계산 정확도 확인

---

### Phase 2 — 외부 API 클라이언트 (3일)

#### src/lib/sheets.ts — Google Sheets API

```typescript
import 'server-only'
import { google } from 'googleapis'

function getAuth() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Vercel: 환경변수에서 JSON 파싱
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    return new google.auth.GoogleAuth({ credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
  }
  // 로컬: 서비스 계정 파일 경로
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
}

export async function readSheet(range: string): Promise<string[][]>
export async function writeSheet(range: string, values: string[][]): Promise<void>
export async function appendRow(range: string, row: string[]): Promise<void>
```

#### src/lib/cache.ts — 3계층 캐시

```typescript
// 계층 1: globalThis._tickerCache (인메모리, 인스턴스 내 공유)
// 계층 2: _TICKER_CACHE_ Sheets 탭 (영구, 인스턴스 간 공유)
// TTL: 30분 (KIS), 1시간 (DART), 7일 (AI는 _AI_CACHE_ 별도)

export async function getCached<T>(key: string, ttlSeconds: number): Promise<T | null>
export async function setCached<T>(key: string, value: T): Promise<void>
export async function clearCache(keyPattern: string): Promise<void>
```

#### src/lib/kis.ts — KIS Open API 클라이언트

```typescript
import 'server-only'

// 토큰 관리: globalThis.kisToken → /tmp/kis-token.json → 신규 발급
export async function getKisToken(): Promise<KisToken>

// 만료 1시간 전 갱신 예약 (레이스 컨디션 방지, 하루 1회 발급 제한 준수)
export function softExpireKisToken(): void

// 400ms 스로틀 (KIS_THROTTLE_MS, BR-005)
async function throttledFetch(url: string, options: RequestInit): Promise<Response>

// KIS API 공통 호출 (EGW00133: rate limit, EGW00201: 토큰 만료 감지)
export async function kisRequest<T>(
  path: string,
  params: Record<string, string>,
  trId: string
): Promise<T>
```

#### src/lib/dart.ts — DART API 클라이언트

```typescript
import 'server-only'
// CORPCODE.xml 내부 캐시 (반복 다운로드 방지, BR-016)
export async function getCorpCode(tickerName: string): Promise<string>
export async function dartRequest<T>(endpoint: string, params: Record<string, string>): Promise<T>
```

#### src/lib/ai.ts — OpenAI gpt-4o-mini

```typescript
import 'server-only'
import OpenAI from 'openai'
// 매매일지 + 종목 정보를 컨텍스트로 gpt-4o-mini 호출
export async function generateAiAnalysis(
  code: string,
  stockInfo: StockPrice & Valuation,
  recentTrades: SheetTransactionRow[]
): Promise<AiAnalysisResult>
```

---

### Phase 3 — API Route Handlers (3일)

#### 인증 Route + 미들웨어 (최우선)

```typescript
// src/lib/auth.ts — authOptions 집중 관리
export const authOptions: AuthOptions = {
  providers: [GoogleProvider({ ... })],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      const allowedEmail = env.ALLOWED_EMAIL
      if (allowedEmail && user.email !== allowedEmail) return false
      return true
    },
  },
  pages: { signIn: '/auth/signin', error: '/auth/signin' },
  secret: env.AUTH_SECRET,
}

// src/app/api/auth/[...nextauth]/route.ts
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// src/middleware.ts (프로젝트 루트)
export { default } from 'next-auth/middleware'
export const config = {
  matcher: ['/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Google Sheets Route Handlers

| 파일 | 메서드 | 캐시 TTL |
|:---|:---:|:---:|
| `api/sheets/transactions/route.ts` | GET | 5분 |
| `api/sheets/ticker-master/route.ts` | GET | 60분 |
| `api/sheets/aggregation/route.ts` | GET | 5분 |

#### KIS API Route Handlers (400ms 스로틀 적용)

| 파일 | 메서드 | KIS tr_id | 캐시 TTL |
|:---|:---:|:---:|:---:|
| `api/kis/price/route.ts` | GET ?code= | FHKST01010100 | 30분 |
| `api/kis/valuation/route.ts` | GET ?code= | FHKST66430200 | 30분 |
| `api/kis/financial/route.ts` | GET ?code= | FHKST66430300 | 30분 |
| `api/kis/daily-price/route.ts` | GET ?code=&period=30 | FHKST03010100 | 30분 |
| `api/kis/trading-trend/route.ts` | GET ?code= | FHKST01010900 | 30분 |
| `api/kis/opinion/route.ts` | GET ?code= | FHKST03010600 | 30분 |

#### 복합 Route Handlers

```typescript
// src/app/api/fundamental/route.ts — 병렬 호출 (UC-008, UC-009)
const [valuation, financial] = await Promise.all([
  kisRequest(...),  // FHKST66430200
  kisRequest(...),  // FHKST66430300
])

// src/app/api/ai/analysis/route.ts — GET (캐시) / POST (강제 갱신)
// _AI_CACHE_ 탭 TTL 7일

// src/app/api/ticker/[code]/refresh/route.ts — 통합 갱신 (UC-015)
export const maxDuration = 60  // Vercel Pro 필수
const results = await Promise.allSettled([
  refreshSection(code, 'price'),
  refreshSection(code, 'valuation'),
  refreshSection(code, 'financial'),
  refreshSection(code, 'daily-price'),
  refreshSection(code, 'trading-trend'),
  refreshSection(code, 'opinion'),
  refreshSection(code, 'dart-financial'),
  refreshAiAnalysis(code),
])
```

#### Route Handler 공통 패턴 (모든 Handler에 적용)

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { z } from 'zod'

const querySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Invalid stock code'),
})

export async function GET(request: Request) {
  // Step 1: 인증 확인 (SR-005: 401 → 리다이렉트 없음, UI 알림)
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  // Step 2: 입력 검증 (Zod)
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code } = parsed.data

  // Step 3: 캐시 조회 (3계층)
  const cacheKey = `${code}_section`
  const cached = await getCached<SectionData>(cacheKey, 30 * 60)
  if (cached) return ok(cached, cached.cachedAt)

  // Step 4: 외부 API 호출
  const raw = await kisRequest<RawData>(path, params, trId)
  const data = transform(raw)

  // Step 5: 캐시 저장 + 응답
  await setCached(cacheKey, data)
  return ok(data)
}
```

---

### Phase 4 — 레이아웃·인증 페이지 (1일)

```typescript
// src/app/layout.tsx — Provider 래핑 순서
export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider session={session}>
            <Providers>
              {children}
              <Toaster />
              <SessionExpiredPrompt />  {/* SR-005 */}
            </Providers>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// src/app/providers.tsx — TanStack Query
'use client'
export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          if (error?.status === 401 || error?.status === 429) return false
          return count < 1
        },
      },
    },
  }))
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

---

### Phase 5 — 페이지 구현 (→ fe-impl-plan 참조)

```typescript
// src/app/page.tsx — 루트 → 대시보드 리다이렉트
import { redirect } from 'next/navigation'
export default function RootPage() { redirect('/dashboard') }

// src/app/dashboard/page.tsx — SSR 프리페치
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
export default async function DashboardPage() {
  const queryClient = new QueryClient()
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ['sheets', 'transactions'], queryFn: ... }),
    queryClient.prefetchQuery({ queryKey: ['sheets', 'aggregation'], queryFn: ... }),
  ])
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}

// src/app/stock/[code]/page.tsx
export default async function StockDetailPage({ params }: { params: { code: string } }) {
  return <StockDetailClient code={params.code} />
}
```

---

## 3. 파일 생성 순서 요약

```
Phase 1 (기반):
  src/types/sheets.ts kis.ts dart.ts ai.ts business.ts
  src/lib/env.ts api-response.ts indicators.ts
  src/__tests__/indicators.test.ts

Phase 2 (외부 API):
  src/lib/sheets.ts cache.ts kis.ts dart.ts ai.ts auth.ts

Phase 3 (API Routes):
  src/middleware.ts
  src/app/api/auth/[...nextauth]/route.ts
  src/app/api/sheets/{transactions,ticker-master,aggregation}/route.ts
  src/app/api/kis/{price,valuation,financial,daily-price,trading-trend,opinion}/route.ts
  src/app/api/dart/financial/route.ts
  src/app/api/fundamental/route.ts
  src/app/api/ai/analysis/route.ts
  src/app/api/ticker/[code]/refresh/route.ts  ← export const maxDuration = 60

Phase 4 (레이아웃·인증):
  src/app/providers.tsx
  src/app/layout.tsx
  src/components/ui/theme-toggle.tsx
  src/components/global/session-expired-prompt.tsx
  src/app/auth/signin/page.tsx

Phase 5 (페이지):
  src/app/page.tsx
  src/app/dashboard/page.tsx
  src/app/stock/[code]/page.tsx
  → 컴포넌트는 fe-impl-plan.md 참조
```

---

## 4. 검증 기준

| Phase | 검증 방법 | 성공 기준 |
|:---:|:---|:---|
| 1 | `npx tsc --noEmit` + `npm test` | 타입 오류 없음, RSI·MACD 테스트 통과 |
| 2 | `npm run dev` 후 직접 함수 호출 | KIS token 발급, Sheets read/write, DART 응답 확인 |
| 3 | `curl http://localhost:3000/api/kis/price?code=005930` | 200 + `{ data: { currentPrice: ... }, cachedAt: ... }` |
| 3 | `/api/ticker/[code]/refresh` POST | 60초 이내 8섹션 갱신 완료 |
| 4 | 브라우저 `/auth/signin` | Google OAuth 로그인 성공 → `/dashboard` 리다이렉트 |
| 5 | 브라우저 `/dashboard` + `/stock/005930` | 전체 화면 렌더링, 데이터 정상 표시 |

---

## 5. 성능 목표

| 시나리오 | 목표 | 구현 포인트 |
|:---|:---:|:---|
| 대시보드 로드 (캐시 HIT) | ≤ 5초 | SSR prefetch + HydrationBoundary |
| 종목상세 로드 (캐시 HIT) | ≤ 3초 | 섹션별 독립 useQuery, Skeleton 표시 |
| 전체 새로고침 | ≤ 60초 | Promise.allSettled 병렬 + maxDuration=60 |
| KIS API 간격 | ≥ 400ms | throttledFetch, KIS_THROTTLE_MS |
