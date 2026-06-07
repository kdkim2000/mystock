# React Query 데이터 패칭·캐싱 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | React Query 데이터 패칭·캐싱 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock의 클라이언트 데이터 패칭에 **TanStack Query (React Query v5)**를 사용한다. 서버사이드 Sheets 캐시(`_TICKER_CACHE_` 30분, `_AI_CACHE_` 7일)와 클라이언트 staleTime을 정합시켜 불필요한 API 재호출을 최소화한다.

---

## 2. QueryClient 설정 (`src/lib/query-client.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,      // 기본 5분
        refetchOnWindowFocus: false,    // 탭 포커스 시 자동 재요청 비활성
        refetchOnMount: true,           // 컴포넌트 마운트 시 stale이면 재요청
        retry: (failureCount, error: any) => {
          if (error?.status === 401) return false  // 세션 만료 — 재시도 안 함
          if (error?.status === 429) return false  // Rate Limit — 재시도 안 함
          return failureCount < 1
        },
      }
    }
  })
}
```

---

## 3. Providers 설정 (`src/app/providers.tsx`)

```typescript
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { makeQueryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

레이아웃에 등록:
```typescript
// src/app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <SessionProvider>
            <Providers>
              {children}
            </Providers>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 4. staleTime 정책 (Sheets 캐시 TTL과 정합)

| 데이터 종류 | staleTime | 근거 |
|:---|:---:|:---|
| 대시보드 매매내역·집계 | 5분 | Sheets 직접 조회 — 자주 변하지 않음 |
| KIS 시세·가치평가·재무 | 30분 | `_TICKER_CACHE_` TTL 30분 (BR-009) |
| KIS 일봉·매매동향·투자의견 | 30분 | `_TICKER_CACHE_` TTL 30분 |
| DART 재무·공시 | 60분 | DART 1시간 TTL |
| AI 분석 | 7일 | `_AI_CACHE_` TTL 7일 (BR-010) |

---

## 5. 주요 Custom Hook 패턴

### 5.1 KIS 시세 조회

```typescript
// src/hooks/use-stock-price.ts
import { useQuery } from '@tanstack/react-query'
import type { StockPrice } from '@/types/kis'

export function useStockPrice(code: string) {
  return useQuery<{ data: StockPrice; cachedAt?: string }>({
    queryKey: ['kis', 'price', code],
    queryFn: async () => {
      const res = await fetch(`/api/kis/price?code=${code}`)
      if (!res.ok) {
        const err = await res.json()
        throw Object.assign(new Error(err.error), { status: res.status, code: err.code })
      }
      return res.json()
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!code,
  })
}
```

### 5.2 대시보드 데이터 조회

```typescript
// src/hooks/use-dashboard-data.ts
import { useQuery } from '@tanstack/react-query'
import type { SheetTransactionRow, AggregationRow } from '@/types/sheets'

export function useTransactions() {
  return useQuery<{ data: SheetTransactionRow[] }>({
    queryKey: ['sheets', 'transactions'],
    queryFn: () => fetch('/api/sheets/transactions').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAggregation() {
  return useQuery<{ data: AggregationRow[] }>({
    queryKey: ['sheets', 'aggregation'],
    queryFn: () => fetch('/api/sheets/aggregation').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
}
```

### 5.3 AI 분석 조회 + 강제 갱신

```typescript
// src/hooks/use-ai-analysis.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AiAnalysisResult } from '@/types/ai'

export function useAiAnalysis(code: string) {
  return useQuery<{ data: AiAnalysisResult; cachedAt?: string }>({
    queryKey: ['ai', 'analysis', code],
    queryFn: () => fetch(`/api/ai/analysis?code=${code}`).then(r => r.json()),
    staleTime: 7 * 24 * 60 * 60 * 1000,  // 7일
    enabled: !!code,
  })
}

export function useRefreshAiAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) =>
      fetch('/api/ai/analysis', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      }).then(r => r.json()),
    onSuccess: (_, code) => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', code] })
    },
  })
}
```

### 5.4 전체 갱신 (60초 타임아웃)

```typescript
// src/hooks/use-refresh-all.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

export function useRefreshAll(code: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: () =>
      fetch(`/api/ticker/${code}/refresh`, { method: 'POST' }).then(r => {
        if (r.status === 504) throw new Error('TIMEOUT')
        return r.json()
      }),
    onSuccess: () => {
      // 해당 종목 모든 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['kis', 'price', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'valuation', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'financial', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'daily-price', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'trading-trend', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'opinion', code] })
      queryClient.invalidateQueries({ queryKey: ['dart', 'financial', code] })
      toast({ title: '갱신 완료', description: '모든 데이터가 업데이트되었습니다.' })
    },
    onError: (error: Error) => {
      toast({
        title: error.message === 'TIMEOUT' ? '갱신 시간 초과' : '갱신 실패',
        description: error.message === 'TIMEOUT' ? '60초 내에 완료되지 않았습니다.' : undefined,
        variant: 'destructive',
      })
    },
  })
}
```

---

## 6. SSR 초기 데이터 (Server → Client Hydration)

```typescript
// Server Component (page.tsx)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function StockDetailPage({ params }) {
  const queryClient = new QueryClient()

  // 서버에서 프리페치
  await queryClient.prefetchQuery({
    queryKey: ['kis', 'price', params.code],
    queryFn: () => fetchStockPrice(params.code),  // 서버 직접 호출
    staleTime: 30 * 60 * 1000,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StockDetailClient code={params.code} />
    </HydrationBoundary>
  )
}
```

---

## 7. 에러 처리 패턴

### 7.1 쿼리 레벨 에러

```typescript
function StockPriceSection({ code }: { code: string }) {
  const { data, isLoading, isError, error } = useStockPrice(code)

  if (isLoading) return <Skeleton className="h-32 w-full" />
  if (isError) return (
    <ErrorCard
      message={(error as any)?.code === 'KIS_RATE_LIMIT'
        ? 'KIS API 요청 한도 초과. 잠시 후 다시 시도해 주세요.'
        : '시세 정보를 불러올 수 없습니다.'}
    />
  )

  return <PriceCard data={data!.data} cachedAt={data!.cachedAt} />
}
```

### 7.2 Suspense + ErrorBoundary 패턴

```typescript
<ErrorBoundary FallbackComponent={ErrorCard}>
  <Suspense fallback={<Skeleton className="h-32 w-full" />}>
    <StockPriceSection code={code} />
  </Suspense>
</ErrorBoundary>
```

---

## 8. QueryKey 네이밍 규칙

| 도메인 | queryKey 패턴 | 예시 |
|:---|:---|:---|
| KIS API | `['kis', section, code]` | `['kis', 'price', '005930']` |
| DART API | `['dart', section, code]` | `['dart', 'financial', '005930']` |
| AI 분석 | `['ai', 'analysis', code]` | `['ai', 'analysis', '005930']` |
| Sheets | `['sheets', sheetName]` | `['sheets', 'transactions']` |
| 통합 | `['fundamental', code]` | `['fundamental', '005930']` |
