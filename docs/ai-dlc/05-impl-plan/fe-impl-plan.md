# 프론트엔드 구현 계획서

| 항목 | 내용 |
|:---|:---|
| 문서명 | 프론트엔드 컴포넌트 구현 계획서 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

본 문서는 my-stock의 프론트엔드 컴포넌트 구현 순서, 우선순위, 공통 컴포넌트 재사용 전략을 정의한다. 대상 화면은 SCR-001(로그인), SCR-002(대시보드), SCR-003(종목상세 13섹션) 총 15개 화면이다.

**구현 원칙**:
- 공통 기반(Provider·Layout·훅) → 단순 화면(로그인) → 대시보드 → 종목상세 순
- 모든 비동기 컴포넌트는 3-상태(로딩·데이터·에러) 처리 필수
- Server/Client Component 경계: `'use client'` 없으면 Server Component 기본값

---

## 2. 컴포넌트 구현 우선순위 표

| 우선순위 | 화면 ID | 컴포넌트 | Server/Client | 의존성 |
|:---:|:---|:---|:---:|:---|
| P0 | 공통 | `providers.tsx` | Client | QueryClientProvider |
| P0 | 공통 | `layout.tsx` | Server | ThemeProvider, SessionProvider, Providers |
| P0 | 공통 | `theme-toggle.tsx` | Client | useTheme |
| P0 | 공통 | `session-expired-prompt.tsx` | Client | useSession (SR-005) |
| P0 | 공통 | `hooks/use-transactions.ts` | Client | /api/sheets/transactions |
| P0 | 공통 | `hooks/use-aggregation.ts` | Client | /api/sheets/aggregation |
| P0 | 공통 | `hooks/use-stock-price.ts` | Client | /api/kis/price |
| P0 | 공통 | `hooks/use-ai-analysis.ts` | Client | /api/ai/analysis |
| P0 | 공통 | `hooks/use-refresh-ai-analysis.ts` | Client | POST /api/ai/analysis |
| P0 | 공통 | `hooks/use-refresh-all.ts` | Client | POST /api/ticker/[code]/refresh |
| P1 | SCR-001 | `login-card.tsx` | Client | signIn('google') |
| P1 | SCR-001 | `google-sign-in-button.tsx` | Client | next-auth/react |
| P1 | SCR-002 | `kpi-card.tsx` | Client | useAggregation |
| P1 | SCR-002 | `stock-analysis-table.tsx` | Client | useAggregation, useStockPrice |
| P1 | SCR-002 | `trade-history-table.tsx` | Client | useTransactions |
| P2 | SCR-002 | `position-bar-chart.tsx` | Client | useAggregation, Recharts |
| P2 | SCR-002 | `profit-bar-chart.tsx` | Client | useAggregation, Recharts |
| P2 | SCR-002 | `cumulative-profit-chart.tsx` | Client | useTransactions, Recharts |
| P2 | SCR-002 | `strategy-table.tsx` | Client | useTransactions |
| P2 | SCR-003-01 | `price-card.tsx` | Client | useStockPrice, ChangeBadge |
| P2 | SCR-003-02 | `valuation-table.tsx` | Client | /api/fundamental |
| P2 | SCR-003-03 | `financial-table.tsx` | Client | /api/fundamental |
| P2 | SCR-003-04 | `financial-radar-chart.tsx` | Client | Recharts RadarChart |
| P2 | SCR-003-06 | `candlestick-chart.tsx` | Client | /api/kis/daily-price, Recharts |
| P2 | SCR-003-06 | `investor-trend-chart.tsx` | Client | /api/kis/trading-trend, Recharts |
| P3 | SCR-003-05 | `estimate-table.tsx` | Client | /api/kis/valuation |
| P3 | SCR-003-07 | `opinion-table.tsx` | Client | /api/kis/opinion, TanStack Table |
| P3 | SCR-003-08 | `dart-financial-chart.tsx` | Client | /api/dart/financial, Recharts |
| P3 | SCR-003-08 | `disclosure-list.tsx` | Client | /api/dart/financial |
| P3 | SCR-003-09 | `portfolio-card.tsx` | Client | useAggregation, useStockPrice |
| P3 | SCR-003-10 | `rsi-card.tsx` | Client | indicators.calculateRSI(dailyPrice) |
| P3 | SCR-003-10 | `macd-card.tsx` | Client | indicators.calculateMACD(dailyPrice) |
| P3 | SCR-003-11 | `ai-analysis-card.tsx` | Client | useAiAnalysis, useRefreshAiAnalysis |
| P3 | SCR-003-12 | `journal-table.tsx` | Client | useTransactions (code 필터) |
| P3 | SCR-003-13 | `refresh-all-button.tsx` | Client | useRefreshAll |
| P3 | SCR-003-13 | `progress-indicator.tsx` | Client | mutation.isPending |
| P3 | SCR-003 | `anchor-menu.tsx` | Client | IntersectionObserver |

---

## 3. 공통 컴포넌트 재사용 목록

| 컴포넌트 | 출처 | 사용 화면 |
|:---|:---|:---|
| `<Skeleton>` | shadcn/ui | 모든 비동기 섹션 로딩 상태 |
| `<Card>` | shadcn/ui | KpiCard, AiAnalysisCard, PortfolioCard, LoginCard |
| `<Badge>` | shadcn/ui | ChangeBadge, 전략 태그 |
| `<Button>` | shadcn/ui | GoogleSignInButton, RefreshAiButton, RefreshAllButton |
| `<DataTable>` | 커스텀 (@tanstack/react-table 래핑) | StockAnalysisTable, TradeHistoryTable, OpinionTable |
| `<Pagination>` | shadcn/ui | TradeHistoryTable |
| `<Toast>` | shadcn/ui Toaster | 갱신 성공·실패·에러 알림 |
| `<Dialog>` | shadcn/ui | SessionExpiredPrompt |
| `<Separator>` | shadcn/ui | 섹션 구분선 |
| `<ErrorCard>` | 커스텀 | 모든 비동기 섹션 에러 상태 |
| `<ChangeBadge>` | 커스텀 | PriceCard, StockAnalysisTable |

---

## 4. Phase별 구현 순서

### Phase 1 — 공통 기반 컴포넌트 (1일)

```
src/app/providers.tsx
  → 'use client'
  → QueryClient (staleTime 5min, retry 1회, 401/429 retry 안 함)
  → QueryClientProvider + ReactQueryDevtools

src/app/layout.tsx
  → Server Component
  → ThemeProvider > SessionProvider > Providers > children
  → Toaster, SessionExpiredPrompt 포함

src/components/ui/theme-toggle.tsx
  → 'use client', useTheme
  → Sun/Moon 토글 (QR-001)

src/components/global/session-expired-prompt.tsx
  → 'use client', useSession
  → 401 감지 → Dialog 표시 → signIn('google') (SR-005)
  → window.fetch 인터셉터로 API 401 전역 감지

src/hooks/use-transactions.ts
  → queryKey: ['sheets', 'transactions']
  → staleTime: 5 * 60 * 1000

src/hooks/use-aggregation.ts
  → queryKey: ['sheets', 'aggregation']
  → staleTime: 5 * 60 * 1000

src/hooks/use-stock-price.ts
  → queryKey: ['kis', 'price', code]
  → staleTime: 30 * 60 * 1000
  → enabled: !!code

src/hooks/use-ai-analysis.ts
  → queryKey: ['ai', 'analysis', code]
  → staleTime: 7 * 24 * 60 * 60 * 1000

src/hooks/use-refresh-ai-analysis.ts
  → useMutation: POST /api/ai/analysis
  → onSuccess: queryClient.invalidateQueries(['ai', 'analysis', code])

src/hooks/use-refresh-all.ts
  → useMutation: POST /api/ticker/[code]/refresh
  → timeout 고려: 60초 이내 응답 (maxDuration=60)
  → onSuccess: invalidate all ['kis', *, code] + ['ai', 'analysis', code]
```

### Phase 2 — 로그인 화면 (0.5일, SCR-001)

```
src/app/auth/signin/page.tsx
  → 'use client', useSearchParams
  → ?error= 파라미터 → ErrorMessage 렌더링
  → signIn('google', { callbackUrl: '/dashboard' })

src/components/auth/login-card.tsx
  → Card 컴포넌트 기반
  → my-stock 로고·설명 + GoogleSignInButton

src/components/auth/google-sign-in-button.tsx
  → Button (variant="outline")
  → 클릭 시 signIn('google') 호출

src/components/auth/error-message.tsx
  → ?error=AccessDenied → "접근이 허용되지 않은 계정입니다"
  → ?error=OAuthCallback → "로그인 중 오류가 발생했습니다"
```

### Phase 3 — 대시보드 (3일, SCR-002)

구현 의존 순서 (의존성 없는 것부터):

```
1. src/components/dashboard/kpi-card.tsx
   → Card 기반, useAggregation
   → 표시 항목: 총평가금액, 실현손익, 거래횟수, 승률
   → ChangeBadge로 수익/손실 색상 표시

2. src/components/dashboard/position-bar-chart.tsx
   → Recharts BarChart (수평)
   → useAggregation → 보유 종목별 현재가 * 보유수량
   → 한국 증시 색상: 수익=text-price-up, 손실=text-price-down

3. src/components/dashboard/profit-bar-chart.tsx
   → Recharts BarChart (수직)
   → useAggregation → 종목별 실현손익

4. src/components/dashboard/cumulative-profit-chart.tsx
   → Recharts AreaChart
   → useTransactions → 날짜별 누적 실현손익 계산
   → 탭: 전체 / 최근 6개월 / 최근 3개월

5. src/components/dashboard/stock-analysis-table.tsx
   → TanStack Table (정렬 가능)
   → 컬럼: 종목명, 현재가, 등락률, 보유수량, 평균단가, 평가손익, 수익률
   → URL 필터: ?holdings=true (보유 종목만)
   → useAggregation + useStockPrice(per row, enabled: code !== undefined)

6. src/components/dashboard/strategy-table.tsx
   → useTransactions → Tags 컬럼 파싱 → 전략별 통계
   → 컬럼: 전략태그, 거래횟수, 승률, 평균수익률

7. src/components/dashboard/trade-history-table.tsx
   → TanStack Table + Pagination (shadcn)
   → useTransactions
   → 컬럼: 날짜, 종목명, 구분(매수/매도), 수량, 단가, 메모

8. src/app/dashboard/page.tsx (Server)
   → HydrationBoundary + prefetchQuery (transactions, aggregation)
   → DashboardClient 렌더링
```

### Phase 4 — 종목상세 13섹션 (5일, SCR-003-01~13)

각 섹션은 독립적이므로 병렬 구현 가능. 의존성 기준 순서:

```
sec-01 PriceCard (src/components/stock/price-card.tsx)
   → 'use client', useStockPrice(code)
   → 현재가, 등락률(ChangeBadge), 52주 고/저, 시가총액, 거래대금
   → Skeleton: h-32 while loading

sec-02 ValuationTable (src/components/stock/valuation-table.tsx)
   → useQuery(['kis', 'fundamental', code], /api/fundamental)
   → 컬럼: PER, PBR, EPS, BPS, ROE, ROA, 부채비율
   → 업종 평균 대비 하이라이트 (선택)

sec-03 FinancialTable (src/components/stock/financial-table.tsx)
   → useQuery(['kis', 'fundamental', code]) — 같은 쿼리 재사용
   → 컬럼: 자산총계, 부채총계, 자본총계, 매출액, 영업이익, 순이익

sec-04 FinancialRadarChart (src/components/stock/financial-radar-chart.tsx)
   → 'use client', Recharts RadarChart
   → 5개 축: 수익성(ROE), 안정성(부채비율 역수), 성장성(매출 성장률),
             가치(PBR 역수), 모멘텀(등락률)
   → 다크모드 대응: useTheme → resolvedTheme

sec-05 EstimateTable (src/components/stock/estimate-table.tsx)
   → useQuery(['kis', 'valuation', code], /api/kis/valuation)
   → 컬럼: 예상 매출액, 예상 영업이익, 예상 순이익 (컨센서스)

sec-06 CandlestickChart (src/components/stock/candlestick-chart.tsx)
   → 'use client', Recharts ComposedChart
   → useQuery(['kis', 'daily-price', code], /api/kis/daily-price?period=30)
   → Bar (음봉/양봉), errorBar (고저)
   src/components/stock/volume-bar-chart.tsx
   → 거래량 BarChart (dailyPrice.volume)
   src/components/stock/investor-trend-chart.tsx
   → useQuery(['kis', 'trading-trend', code])
   → Recharts LineChart (개인/외국인/기관 3선)

sec-07 OpinionTable (src/components/stock/opinion-table.tsx)
   → TanStack Table
   → useQuery(['kis', 'opinion', code], /api/kis/opinion)
   → 컬럼: 증권사, 투자의견, 목표주가, 현재가 대비

sec-08 DartFinancialChart (src/components/stock/dart-financial-chart.tsx)
   → 'use client', Recharts LineChart
   → useQuery(['dart', 'financial', code], /api/dart/financial)
   → 5년 매출/영업이익/순이익 추이
   src/components/stock/disclosure-list.tsx
   → 공시 목록 (날짜, 제목, 링크)

sec-09 PortfolioCard (src/components/stock/portfolio-card.tsx)
   → useAggregation (보유수량, 평균단가)
   → useStockPrice(code) (현재가)
   → 계산: 평가금액, 평가손익, 수익률 %
   → 한국 증시 색상 적용

sec-10 RsiCard (src/components/stock/rsi-card.tsx)
   → useQuery(['kis', 'daily-price', code]) (dailyPrice 재사용)
   → indicators.calculateRSI(closePrices, 14)
   → 30 이하: 과매도(파랑), 70 이상: 과매수(빨강)
   src/components/stock/macd-card.tsx
   → indicators.calculateMACD(closePrices, 12, 26, 9)
   → Recharts ComposedChart (MACD, Signal 선 + Histogram 바)

sec-11 AiAnalysisCard (src/components/stock/ai-analysis-card.tsx)
   → useAiAnalysis(code)
   → prose 스타일 (@tailwindcss/typography)
   → cachedAt 표시 + RefreshAiButton
   → useRefreshAiAnalysis: 강제 갱신 + invalidateQueries
   → 로딩 중: "AI 분석 중..." 메시지 + Spinner

sec-12 JournalTable (src/components/stock/journal-table.tsx)
   → useTransactions filtered by Ticker (code → Ticker 매핑 via ticker-master)
   → 컬럼: 날짜, 구분, 수량, 단가, 메모, 태그

sec-13 RefreshAllButton (src/components/stock/refresh-all-button.tsx)
   → useRefreshAll(code)
   → 클릭 → mutation.mutate(code) → 60초 대기
   → progress-indicator.tsx: isPending 동안 진행 메시지
   → onSuccess: Toast("갱신 완료") + 전체 쿼리 무효화

AnchorMenu (src/components/stock/anchor-menu.tsx)
   → 'use client', IntersectionObserver
   → 13개 섹션 ID (sec-01 ~ sec-13) 감지
   → sticky top-6, hidden xl:block (xl 이상에서만 표시)
   → 활성 섹션: bg-primary text-primary-foreground

src/app/stock/[code]/page.tsx (Server)
   → params.code 추출
   → StockDetailClient 렌더링

src/app/stock/[code]/stock-detail-client.tsx
   → 'use client'
   → AnchorMenu + 13개 섹션 배치 (flex gap-6 레이아웃)
```

---

## 5. 데이터 로딩 상태 처리 패턴

모든 비동기 컴포넌트는 아래 3-상태 패턴을 따른다:

```tsx
// 표준 패턴
function PriceCard({ code }: { code: string }) {
  const { data, isLoading, error } = useStockPrice(code)

  if (isLoading) return <Skeleton className="h-32 w-full rounded-lg" />
  if (error) return <ErrorCard message="시세 조회에 실패했습니다" />

  return (
    <Card>
      <CardContent>
        <span>{data.data.currentPrice.toLocaleString()}원</span>
        <ChangeBadge rate={data.data.changeRate} amount={data.data.changeAmount} />
      </CardContent>
    </Card>
  )
}
```

**ErrorCard 공통 컴포넌트**:
```tsx
function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-destructive">
      <CardContent className="text-destructive text-sm">{message}</CardContent>
    </Card>
  )
}
```

---

## 6. 한국 주식 색상 컨벤션

> **중요**: 한국 증시 컨벤션은 글로벌과 반대 — **상승=빨강(red), 하락=파랑(blue)**

```tsx
// ChangeBadge 컴포넌트 예시
function ChangeBadge({ rate, amount }: { rate: number; amount: number }) {
  const isUp = rate > 0
  const isDown = rate < 0

  return (
    <Badge className={cn(
      isUp && 'bg-price-up/10 text-price-up',     // CSS var: --color-price-up (red)
      isDown && 'bg-price-down/10 text-price-down', // CSS var: --color-price-down (blue)
      !isUp && !isDown && 'bg-muted text-muted-foreground'
    )}>
      {isUp ? '▲' : isDown ? '▼' : '─'}
      {Math.abs(rate).toFixed(2)}%
      ({isUp ? '+' : ''}{amount.toLocaleString()}원)
    </Badge>
  )
}
```

Tailwind 설정 (`tailwind.config.ts`):
```typescript
colors: {
  'price-up': 'var(--color-price-up)',     // globals.css에 정의
  'price-down': 'var(--color-price-down)', // globals.css에 정의
}
```

---

## 7. Recharts 다크모드 대응

Recharts는 CSS variables를 직접 지원하지 않으므로 `useTheme`으로 색상을 동적 주입한다:

```tsx
'use client'
import { useTheme } from 'next-themes'
import { BarChart, XAxis, YAxis, Tooltip } from 'recharts'

function MyChart({ data }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <BarChart data={data}>
      <XAxis stroke={isDark ? '#9ca3af' : '#4b5563'} />
      <YAxis stroke={isDark ? '#9ca3af' : '#4b5563'} />
      <Tooltip
        contentStyle={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb',
        }}
      />
    </BarChart>
  )
}
```

---

## 8. 검증 기준

| Phase | 화면 | 검증 항목 |
|:---:|:---|:---|
| 1 | 공통 | 다크/라이트 테마 전환, 401 → SessionExpiredPrompt 표시 |
| 2 | SCR-001 | Google 로그인 성공, AccessDenied 에러 메시지 |
| 3 | SCR-002 | KPI 4개 수치, 차트 3개 렌더링, 테이블 정렬·필터·페이지네이션 |
| 4 | SCR-003 | 13섹션 전체 렌더링, 새로고침 60초 이내 완료, 앵커메뉴 스크롤 추적 |
