# 프론트엔드 성능 최적화 가이드

| 항목 | 내용 |
|:---|:---|
| 생성일 | 2026-06-07 |
| 스킬 | `/ai-dlc-fe-perf-guide` |
| 대상 | React 18.3, Next.js 15 App Router, Recharts 3.7, React Query v5 |

---

## 1. Recharts 동적 import (코드 분할)

### 1.1 적용 대상 및 근거

Recharts(~40-50KB)는 `window`, `ResizeObserver` 등 브라우저 전용 API에 의존 → SSR 불가, `ssr: false` 필수.

| 컴포넌트 | 적용 여부 | 근거 |
|:---|:---:|:---|
| `position-bar-chart.tsx` | ✅ dynamic | Dashboard 하단 (above-the-fold 아님), KpiCards 우선 렌더링 |
| `profit-bar-chart.tsx` | ✅ dynamic | 동일 |
| `cumulative-profit-chart.tsx` | ✅ dynamic | 동일 |
| `rsi-macd-card.tsx` | — (정적) | Stock detail 하단, useMemo 이미 적용, API 응답이 병목 |
| `financial-radar-chart.tsx` | — (정적) | 동일, useMemo 추가로 렌더링 최적화 |
| `investor-trend-chart.tsx` | — (정적) | 동일 |

### 1.2 구현 패턴 (`src/components/dashboard/dashboard-client.tsx`)

```tsx
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// named export를 default export로 래핑하는 패턴
const PositionBarChart = dynamic(
  () => import('./position-bar-chart').then(m => ({ default: m.PositionBarChart })),
  { loading: () => <Skeleton className="h-64 w-full rounded-xl" />, ssr: false },
)
const ProfitBarChart = dynamic(
  () => import('./profit-bar-chart').then(m => ({ default: m.ProfitBarChart })),
  { loading: () => <Skeleton className="h-64 w-full rounded-xl" />, ssr: false },
)
const CumulativeProfitChart = dynamic(
  () => import('./cumulative-profit-chart').then(m => ({ default: m.CumulativeProfitChart })),
  { loading: () => <Skeleton className="h-64 w-full rounded-xl" />, ssr: false },
)
```

**`loading` prop**: JS 청크를 다운로드하는 동안만 표시 (보통 수백ms). 데이터 로딩 중 Skeleton은 각 컴포넌트 내부의 `isLoading` 처리가 담당.

**`ssr: false`**: 브라우저 API 의존성 때문에 서버 렌더링 비활성화. 기존 컴포넌트들이 이미 `isLoading → Skeleton` 패턴으로 서버/클라이언트 초기 상태를 처리하므로 안전.

### 1.3 동적 import 적용 기준

| 적용 O | 적용 X |
|:---|:---|
| 브라우저 전용 API 의존 (window, document) | SSR에서 렌더링 필요 |
| Above-the-fold 아님 (첫 화면 밖) | 데이터 없이도 UI 구조 표시 필요 |
| 초기 로드에 필수가 아닌 인터랙션 | 테이블/텍스트 등 경량 컴포넌트 |
| 큰 라이브러리를 사용하는 컴포넌트 | 이미 API 응답이 병목인 컴포넌트 |

---

## 2. useMemo 최적화

### 2.1 적용 기준

**useMemo가 효과적인 경우:**
- `reduce`, `map`, `filter` 등 배열 연산이 포함된 파생 값
- 렌더링 중 조건부 계산이 여러 번 발생하는 경우
- 부모 컴포넌트 리렌더링으로 자주 재실행되는 계산

**useMemo가 불필요한 경우:**
- 단순 프로퍼티 접근 (`data?.name`)
- 이미 React Query가 캐시하는 값
- 1-2개 원소의 경량 연산

### 2.2 KpiCards (`src/components/dashboard/kpi-card.tsx`)

**변경 전** (5회 reduce):
```tsx
const totals = data ? {
  totalMarketValue: data.reduce(...),
  realizedPnL: data.reduce(...),
  tradeCount: data.reduce(...),
  winRate: data.reduce(winCount) / Math.max(data.reduce(tradeCount), 1) * 100,
} : null
```

**변경 후** (3회 reduce + useMemo):
```tsx
const totals = useMemo(() => {
  if (!data) return null
  const tradeCount = data.reduce((sum, r) => sum + r.TradeCount, 0)
  const winCount = data.reduce((s, r) => s + r.WinCount, 0)
  return {
    totalMarketValue: data.reduce((sum, r) => sum + r.Holdings * r.AvgPrice, 0),
    realizedPnL: data.reduce((sum, r) => sum + r.RealizedPnL, 0),
    tradeCount,
    winRate: winCount / Math.max(tradeCount, 1) * 100,
  }
}, [data])
```

`data` 변경(React Query 재조회) 시에만 재계산. 부모 컴포넌트 리렌더링 시 불필요한 reduce 실행 방지.

### 2.3 FinancialRadarChart (`src/components/stock/financial-radar-chart.tsx`)

**변경 전**: `normalize`, `radarData`, `gridColor` 모두 컴포넌트 내부에서 매 렌더마다 재생성

**변경 후**:
```tsx
// normalize: 컴포넌트 밖으로 이동 (순수 함수, 모듈 로드 시 1회 정의)
function normalize(val: number, min: number, max: number) {
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))
}

export function FinancialRadarChart({ code }: Props) {
  // gridColor: 테마 변경 시에만 재계산
  const gridColor = useMemo(
    () => resolvedTheme === 'dark' ? '#334155' : '#e2e8f0',
    [resolvedTheme],
  )

  // radarData: data 변경 시에만 재계산 (API 응답 주기: 30분)
  const radarData = useMemo(() => [...], [v, f])
}
```

### 2.4 이미 최적화된 컴포넌트 (변경 불필요)

| 컴포넌트 | 최적화 현황 |
|:---|:---|
| `cumulative-profit-chart.tsx` | `useMemo` 이미 적용 (chartData, filteredData) |
| `rsi-macd-card.tsx` | `useMemo` 이미 적용 (rsiData, macdData) |

---

## 3. React Query 캐시 전략

### 3.1 staleTime vs gcTime

```
staleTime (5분): 이 시간 동안 데이터를 "신선"하다고 간주 → 백그라운드 재조회 없음
gcTime (10분):  이 시간 동안 사용하지 않는 캐시를 메모리에 유지 → 재방문 시 즉시 표시
```

**페이지 이동 시나리오**:
1. Dashboard 방문 → `aggregation` 데이터 로드 (staleTime 시작)
2. `/stock/005930` 방문 → `fundamental`, `trading-trend` 등 로드
3. Dashboard 복귀 (5분 이내) → `aggregation` 신선 → API 호출 없음
4. `/stock/005930` 재방문 (10분 이내) → 캐시 HIT → API 호출 없음 + 즉시 표시

### 3.2 전역 설정 (`src/app/providers.tsx`)

```typescript
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,   // 5분: 기본 fresh 기간
    gcTime: 10 * 60 * 1000,     // 10분: 메모리 캐시 보존 기간
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) return false  // 세션 만료 재시도 금지
      if (error instanceof Error && error.message.includes('429')) return false  // Rate limit 재시도 금지
      return failureCount < 2   // 그 외 오류: 최대 2회 재시도
    },
    refetchOnWindowFocus: false, // 탭 전환 시 자동 재조회 비활성화
  },
}
```

### 3.3 컴포넌트별 staleTime 오버라이드

일부 컴포넌트는 서버 캐시 TTL과 맞춰 staleTime을 오버라이드:

| Hook | staleTime | 이유 |
|:---|:---:|:---|
| `useStockPrice` | 30분 | 서버 캐시 30분과 동기화 |
| `useAggregation` | 5분 | 빠른 포트폴리오 변경 반영 |
| `useTransactions` | 5분 | 빠른 거래 내역 반영 |
| `useFundamental` | 30분 | 서버 캐시 30분과 동기화 |
| `useAiAnalysis` | 7일 | 서버 AI 캐시 TTL과 동기화 |

---

## 4. Skeleton 로딩 UI 패턴

### 4.1 구현 원칙

```tsx
// 모든 차트/테이블 컴포넌트에서 적용된 패턴
if (isLoading) return <Card><CardContent className="h-64 pt-6"><Skeleton className="h-full" /></CardContent></Card>
if (!data) return null

// 데이터 로드 완료 후 실제 콘텐츠 렌더링
return <Card>...</Card>
```

**장점**:
- 레이아웃 이동(CLS) 최소화 (고정 높이 Skeleton)
- 각 섹션 독립적 로딩 → 빠른 섹션부터 순차 표시
- SSR에서 Skeleton을 서버 렌더링 → 첫 화면 레이아웃 즉시 확정

### 4.2 Skeleton 높이 기준

| 컴포넌트 | Skeleton 높이 |
|:---|:---:|
| PriceCard | h-32 |
| KpiCards (4개) | h-28 × 4 |
| 차트 컴포넌트 | h-64 |
| 테이블 컴포넌트 | h-40 ~ h-48 |
| RsiMacdCard | h-48 |

### 4.3 dynamic import loading fallback

dynamic import의 `loading` prop은 JS 번들 다운로드 중에만 표시:
```tsx
{ loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
```
번들 로드 완료 후에는 컴포넌트 자체의 `isLoading → Skeleton` 패턴이 담당.

---

## 5. 성능 검증

### 5.1 빌드 검증

```bash
npm run build
# ✅ 오류 없이 빌드 완료
# 차트 컴포넌트가 별도 chunk로 분리됨 (.next/static/chunks/ 확인)
```

### 5.2 런타임 검증

```bash
npm run dev
# Chrome DevTools Network 탭:
# 1. /dashboard 접근 → recharts chunk가 지연 로드됨 확인
# 2. KpiCards → 즉시 렌더링 (SSR prefetch)
# 3. 차트 영역 → Skeleton 후 전환

# React Query DevTools (개발 환경):
# gcTime 카운트다운 확인
# 페이지 이동 후 캐시 보존 확인
```

### 5.3 tsc 검증

```bash
npx tsc --noEmit
# 0 오류 ✅
```
