# 프론트엔드 코드 리뷰 보고서

| 항목 | 내용 |
|:---|:---|
| 검토일 | 2026-06-07 |
| 검토 범위 | `src/components/`, `src/hooks/` |
| 검토 대상 파일 수 | 32개 (Hooks 6개, Dashboard 8개, Stock 15개, Auth/Global/UI 9개) |
| 검토자 | Claude Sonnet 4.6 (AI-DLC Phase 7) |
| 연관 보고서 | `07-validation/lint-check.md`, `07-validation/code-complexity.md` |

---

## 1. 검토 결과 요약

| 항목 | 값 |
|:---|:---|
| **종합 판정** | **조건부통과** |
| 총 이슈 건수 | 11건 (P1: 2건, P2: 4건, P3: 5건) |
| 우수 사례 수 | 8건 |

### 판정 근거

P1 이슈 2건이 존재하나 모두 단일 컴포넌트에 국한된 국소적 문제이며, 전체 코드베이스의 구조적 설계는 양호하다.
TanStack Query 도입, Skeleton 로딩 처리, 한국 주식 색상 시스템(상승=빨강, 하락=파랑)의 CSS 변수 활용 등 핵심 패턴이 일관되게 적용되어 있어 유지보수성이 높다.
P1 이슈 수정 후 합격 판정 가능하다.

---

## 2. 이슈 목록

| FI-ID | 카테고리 | 파일 | 라인 | 설명 | 심각도 | 수정방향 |
|:---|:---|:---|:---:|:---|:---:|:---|
| FI-001 | 로직오류 | `dashboard/cumulative-profit-chart.tsx` | 26 | 누적 손익을 `r.Price * r.Quantity * 0.05`로 5% 수익 가정하여 계산 — 실제 매수 단가 없이 임의 가정 값으로 차트 렌더링, 사용자에게 오해를 줄 수 있음 | P1 | `useAggregation`의 `AvgPrice`와 매도가를 결합하여 실제 PnL을 계산하거나, 데이터 미비 시 차트 미노출 + 안내 메시지 표시 |
| FI-002 | 접근성(A11Y) | `global/session-expired-prompt.tsx` | 18–28 | `window.fetch` 전역 패치(monkey-patching): 동일 컴포넌트가 두 번 마운트되거나 HMR 새로고침 시 원본 `fetch`가 이미 패치된 버전으로 교체되어 누적 패치 발생 가능 | P1 | 패치 여부 플래그 체크 (`if (window.__fetchPatched) return`) 또는 단일 인스턴스 보장 처리 추가 |
| FI-003 | 컴포넌트구조 | `stock/stock-detail-client.tsx` | 22–23 | `useAggregation()` 호출 후 종목 Ticker 조회 — 해당 code가 집계 데이터에 없으면 `ticker`가 `code`(종목코드)로 폴백되어 `DartDisclosureCard`, `JournalTable`에서 종목을 못 찾을 수 있음 | P2 | ticker 미확인 상태를 props로 명시적으로 전달하고, `DartDisclosureCard`·`JournalTable`에서 `ticker`가 `undefined`인 경우 처리 추가 |
| FI-004 | 컴포넌트구조 | `stock/rsi-macd-card.tsx` | 13–16 | `useQuery`를 컴포넌트 내부에서 직접 선언 — 다른 훅들(`useStockPrice`, `useAiAnalysis` 등)은 `src/hooks/`에 분리되어 있어 패턴 불일치 | P2 | `use-daily-price.ts` 훅으로 추출하여 `src/hooks/` 일관성 유지 |
| FI-005 | 타입안전성 | `dashboard/trade-history-table.tsx` | 43 | `rows.map((r, i) => <TableRow key={i}>` — 배열 인덱스를 key로 사용, 정렬·필터링 시 리렌더링 버그 및 React Reconciliation 비효율 | P2 | `key={`${r.Date}-${r.Ticker}-${i}`}`처럼 Date+Ticker 복합 키 사용 |
| FI-006 | 타입안전성 | `stock/journal-table.tsx` | 27 | `filtered.map((r, i) => <TableRow key={i}>` — 동일: 인덱스 기반 key | P2 | `key={`${r.Date}-${r.Ticker}-${r.Type}-${i}`}` 복합 키 사용 |
| FI-007 | 접근성(A11Y) | `dashboard/trade-history-table.tsx` | 63–78 | 페이지네이션 `<button>` 태그에 `aria-label` 누락, 스크린 리더에서 "이전"/"다음" 의도가 전달되지 않음 | P3 | `aria-label="이전 페이지"`, `aria-label="다음 페이지"` 추가 |
| FI-008 | 접근성(A11Y) | `stock/anchor-menu.tsx` | 40 | `<nav>` 태그에 `aria-label` 누락 — 동일 페이지에 다수의 nav 존재 시 스크린 리더 구분 불가 | P3 | `<nav aria-label="섹션 네비게이션" ...>` 추가 |
| FI-009 | 성능 | `dashboard/cumulative-profit-chart.tsx` | 8 | `Period` 타입이 `'all' \| '6m' \| '3m'`으로 정의되어 있으나 탭 레이블은 `'전체'`, `'6개월'`, `'3개월'`로 CLAUDE.md 명세의 `1M/6M/1Y` 탭과 불일치 | P3 | 요구사항 확인 후 탭 옵션을 명세(1M/6M/1Y)에 맞게 조정하거나, 설계 문서 업데이트 |
| FI-010 | 성능 | `stock/price-card.tsx` | 11 | 로딩 중 `null` 반환 없이 Skeleton 사용하나, `!data` 조건(로딩 완료 후 데이터 없음)에서 `null` 반환으로 UI 공백 발생 — `isError` 미처리 | P3 | `isError` 상태에서 `<ErrorCard />` 렌더링 추가 |
| FI-011 | 성능 | `dashboard/position-bar-chart.tsx` | 36–38 | `chartData.map((_, i) => <Cell key={i} fill="..." />)` — 모든 Cell이 동일한 색상 `hsl(220, 70%, 50%)`이므로 Cell 컴포넌트 반복 생성 불필요 | P3 | `<Bar fill="hsl(220, 70%, 50%)" ...>` 단일 속성으로 통합, Cell 제거 |

---

## 3. 우수 사례 (Good Practices)

| GP-ID | 파일 | 패턴 | 설명 |
|:---|:---|:---|:---|
| GP-001 | `ui/change-badge.tsx` | CSS 변수 기반 한국 주식 색상 | `hsl(var(--color-price-up/down/neutral))`으로 테마 토글 시 색상 자동 전환 — 하드코딩 없이 다크/라이트 모드 대응 |
| GP-002 | `hooks/use-stock-price.ts` 외 모든 훅 | TanStack Query staleTime 명시 | 각 훅별로 데이터 특성에 맞는 staleTime 설정 (가격 30분, 거래내역 5분, AI 분석 7일) — 불필요한 API 재요청 방지 |
| GP-003 | `stock/rsi-macd-card.tsx` | `useMemo` 클라이언트 계산 | RSI·MACD를 외부 API 없이 클라이언트에서 계산하며 `useMemo`로 메모이제이션 — 리렌더링 시 재계산 방지 |
| GP-004 | `global/session-expired-prompt.tsx` | SR-005 준수 | 401 응답 시 강제 리다이렉트 대신 Dialog UI로 안내 — 설계 요구사항(SR-005) 정확히 구현 |
| GP-005 | `stock/anchor-menu.tsx` | IntersectionObserver 정리 | `useEffect` cleanup에서 `observers.forEach(o => o.disconnect())` — 메모리 누수 방지 패턴 |
| GP-006 | `ui/theme-toggle.tsx` | 접근성 aria-label | `aria-label="테마 전환"` 명시 — 아이콘 전용 버튼에 접근성 레이블 제공 |
| GP-007 | `auth/auth-error-message.tsx` | Error 코드 매핑 테이블 | NextAuth 오류 코드별 한국어 메시지를 `Record<string, string>`으로 관리 — 확장성과 가독성 우수 |
| GP-008 | `hooks/use-refresh-all.ts` | 뮤테이션 성공 시 캐시 무효화 | `onSuccess`에서 8개 관련 queryKey를 모두 `invalidateQueries` 처리 — 데이터 일관성 유지 |

---

## 4. 상세 분석

### 4.1 Hooks (`src/hooks/`)

#### 4.1.1 use-transactions.ts / use-aggregation.ts

두 훅 모두 동일한 구조(`useQuery` + fetch + staleTime)로 작성되어 일관성이 높다. `staleTime: 5 * 60 * 1000`(5분)은 Google Sheets 특성상 적절한 설정이다.

```typescript
// 정상 패턴 — 두 훅 동일 구조
return useQuery<T>({
  queryKey: [...],
  queryFn: async () => { ... },
  staleTime: 5 * 60 * 1000,
})
```

**개선 가능 사항**: 공통 fetch 패턴 (`if (!res.ok) throw new Error(...)`)을 유틸 함수로 추출하면 DRY 원칙 강화 가능.

#### 4.1.2 use-stock-price.ts

`enabled: !!code` 가드가 적용되어 빈 code 전달 시 불필요한 API 호출을 방지한다. 30분 staleTime은 KIS API 캐시 TTL(30분)과 정렬되어 있어 설계 일관성이 우수하다.

#### 4.1.3 use-ai-analysis.ts

`staleTime: 7 * 24 * 60 * 60 * 1000`(7일)이 `_AI_CACHE_` TTL(7일)과 일치한다. 서버 캐시와 클라이언트 캐시의 TTL 정렬이 잘 되어 있다.

#### 4.1.4 use-refresh-ai-analysis.ts

`onSuccess`에서 `queryClient.setQueryData`로 직접 캐시 업데이트를 수행해 불필요한 재요청 없이 UI가 즉시 갱신된다. 올바른 낙관적 업데이트 패턴.

#### 4.1.5 use-refresh-all.ts

`onSuccess`에서 8개 queryKey를 모두 무효화하는 구조는 명시적이고 안전하다. 다만 `['kis', 'estimate', code]`, `['dart', 'disclosure', code]` 등 refresh endpoint가 갱신하는 섹션 중 일부 queryKey가 목록에서 누락되어 있을 가능성이 있어 refresh route와 대조 확인이 필요하다.

---

### 4.2 Dashboard Components

#### 4.2.1 dashboard-client.tsx

오케스트레이터 역할에 충실하다. 레이아웃 그리드(`grid-cols-1 lg:grid-cols-2`, `grid-cols-1 lg:grid-cols-3`)를 활용해 반응형 구조를 구현했다. 데이터 페칭 로직이 없어 컴포넌트 계층이 명확하게 분리되어 있다.

**지적 사항 없음.**

#### 4.2.2 kpi-card.tsx

`isLoading` 상태에서 Skeleton 4개를 grid로 표시하고, 데이터 로드 후 카드 4개로 전환하는 처리가 자연스럽다.

`totals` 계산에서 `Math.max(denominator, 1)` 패턴으로 0 나누기를 방어하고 있다:
```typescript
winRate: data.reduce((s, r) => s + r.WinCount, 0) / Math.max(data.reduce((s, r) => s + r.TradeCount, 0), 1) * 100
```

**개선 가능 사항**: CLAUDE.md 명세의 KPI 항목은 "실현손익, 평가손익, 승률, 총자산"이나, 현재 구현은 "총 투자금액, 실현손익, 거래횟수, 승률"로 명세와 차이가 있다. 평가손익(현재가 - 매수가)은 `useStockPrice` 실시간 데이터가 필요하므로 구현 편의상 생략된 것으로 보인다. 스펙 차이를 명시적으로 문서화할 것을 권고.

#### 4.2.3 cumulative-profit-chart.tsx (FI-001)

**P1 이슈**: 누적 실현손익 계산에 하드코딩된 `* 0.05` 가정이 사용되고 있다.

```typescript
// 현재 — 잘못된 계산
cumulative += (r.Price * r.Quantity * 0.05) // 간략화: 5% 수익 가정 (실제는 매수 단가 필요)

// 개선안 — AggregationRow의 AvgPrice와 결합
const holding = agg?.find(h => h.Ticker === r.Ticker)
const realizedPnL = holding ? (r.Price - holding.AvgPrice) * r.Quantity : 0
cumulative += realizedPnL
```

주석에도 "간략화"로 명시되어 있으나, 차트가 실제 UI에서 노출되는 지표이므로 정확한 값이 필요하다.

**탭 옵션 불일치(FI-009)**: 현재 구현(`all/6m/3m`)이 CLAUDE.md 명세(`1M/6M/1Y`)와 다르다. 요구사항 기준 문서(`docs/ai-dlc/요구사항정의서_my-stock_20260606.md`) 확인 후 일치 여부를 검토해야 한다.

#### 4.2.4 trade-history-table.tsx (FI-005, FI-007)

페이지네이션 로직이 컴포넌트 내부에 `PAGE_SIZE = 20` 상수로 처리된다. 정렬을 `.reverse()`로 처리하는 것은 원본 배열을 직접 변경하지 않도록 `[...(data ?? [])].reverse()`로 스프레드 복사 후 적용하고 있어 안전하다.

`key={i}` 사용(FI-005)과 페이지네이션 버튼 `aria-label` 누락(FI-007)이 개선 대상이다.

---

### 4.3 Stock Detail Components

#### 4.3.1 stock-detail-client.tsx (FI-003)

`useAggregation`으로 ticker를 조회하는 패턴이 자연스럽지만, `agg` 데이터가 로드되기 전 또는 code가 집계 목록에 없을 때의 처리가 명시적이지 않다.

```typescript
const ticker = agg?.find(r => r.Code === code)?.Ticker ?? code
```

`code`로 폴백 시 `DartDisclosureCard`와 `JournalTable`이 종목을 찾지 못할 수 있다. 특히 `JournalTable`은 `r.Ticker === ticker`로 필터링하므로 `ticker`가 code(숫자 형식)로 설정되면 빈 결과가 노출된다.

`<a href="/dashboard">` 는 Next.js 환경에서 `<Link href="/dashboard">`로 변경하여 클라이언트 사이드 네비게이션을 활용하는 것이 적절하다.

#### 4.3.2 anchor-menu.tsx (FI-008)

SECTIONS 배열이 컴포넌트 외부 상수로 정의되어 불필요한 재생성이 없다. `IntersectionObserver` cleanup이 올바르게 처리된다(GP-005).

`rootMargin: '-20% 0px -70% 0px'` 설정으로 화면 상단 20%~하단 30% 영역에 진입한 섹션만 active로 처리하는 정교한 스크롤 추적이 구현되어 있다.

`xl:` 브레이크포인트 기준 숨김(`hidden xl:block`)으로 모바일/태블릿 대응이 되어 있다.

**개선**: `<nav aria-label="섹션 네비게이션">` 추가 필요(FI-008).

#### 4.3.3 rsi-macd-card.tsx (FI-004)

RSI·MACD 클라이언트 계산은 `useMemo`로 최적화되어 있으며, 데이터가 26개 미만일 때 조기 반환 처리가 되어 있다. 지표 색상(과매수=빨강, 과매도=파랑)이 한국 주식 관행을 따른다.

`data.length < 26` 체크는 MACD의 26일 장기 EMA 계산을 고려한 적절한 가드이다.

**구조 이슈(FI-004)**: `useQuery`를 컴포넌트 내부에 직접 인라인 선언하여 `src/hooks/` 디렉토리의 훅 분리 패턴과 불일치한다. `use-daily-price.ts`로 추출 권고.

#### 4.3.4 ai-analysis-card.tsx

`isLoading || isPending` 조합으로 초기 로딩과 갱신 중 모두 Skeleton을 표시하는 UX가 자연스럽다. `data ? '갱신' : '생성'` 버튼 텍스트 분기가 직관적이다.

`data.content`를 `whitespace-pre-wrap`으로 렌더링하여 개행 보존 — GPT 응답 마크다운을 `prose` 클래스로 스타일링하는 것은 적절하나, XSS 관점에서 `dangerouslySetInnerHTML`을 사용하지 않으므로 안전하다.

#### 4.3.5 portfolio-card.tsx

`holding.Holdings === 0` 조건으로 미보유 종목 시 `null` 반환 — 종목 상세 페이지에서 불필요한 카드 미노출 처리가 적절하다.

`isLoading` 체크보다 `holding` 체크를 먼저 수행하여, `agg` 로딩 전에는 holding이 `undefined`라 컴포넌트가 `null`을 반환할 수 있다. `agg`의 `isLoading` 상태도 함께 처리하면 더 안전하다.

#### 4.3.6 refresh-section.tsx

버튼 disabled 상태, spinner 애니메이션(`animate-spin`), 완료 후 결과 표시가 모두 적절하게 처리된다.

---

### 4.4 Auth/Global/UI Components

#### 4.4.1 session-expired-prompt.tsx (FI-002)

`window.fetch` monkey-patching 패턴은 SR-005(401 UI 프롬프트)를 구현하는 현실적인 방법이다. 다만 컴포넌트가 두 번 마운트되거나 React StrictMode(개발 모드 이중 실행)에서 fetch가 이중 패치될 수 있다.

```typescript
// 개선 제안 — 이중 패치 방지
useEffect(() => {
  if ((window as any).__sessionFetchPatched) return
  ;(window as any).__sessionFetchPatched = true
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const res = await originalFetch(...args)
    if (res.status === 401) setOpen(true)
    return res
  }
  return () => {
    window.fetch = originalFetch
    ;(window as any).__sessionFetchPatched = false
  }
}, []) // eslint-disable-next-line react-hooks/exhaustive-deps
```

#### 4.4.2 auth/login-card.tsx

Google SVG 아이콘이 인라인으로 포함되어 있다. 접근성 관점에서 SVG에 `aria-hidden="true"`를 추가하고 버튼 텍스트("Google로 로그인")로 의미를 전달하는 현재 구조는 적절하다.

#### 4.4.3 ui/change-badge.tsx

`value.toFixed(2)` 호출에서 `showSign && isUp`의 연산자 우선순위가 의도대로 동작한다:
```typescript
{showSign && isUp ? '+' : ''}{value.toFixed(2)}{suffix}
```
단, `value`가 `NaN`인 경우 `isUp`(false), `isDown`(false)이 모두 false로 평가되어 neutral 색상으로 `NaN%` 텍스트가 노출된다. NaN 가드 추가 권고.

#### 4.4.4 ui/error-card.tsx

`retry` prop이 없으면 "다시 시도" 버튼이 렌더링되지 않는 조건부 처리가 올바르다. 다만 `<button>`에 `type="button"` 속성이 누락되어 있다 (폼 내부 배치 시 submit 트리거 가능성).

---

## 5. 권고 사항

### 5.1 즉시 수정 (P1)

#### FI-001: 누적 손익 계산 오류 수정

**대상**: `src/components/dashboard/cumulative-profit-chart.tsx`

```typescript
// 변경 전
cumulative += (r.Price * r.Quantity * 0.05) // 간략화: 5% 수익 가정

// 변경 후 — AggregationRow AvgPrice 활용
// useTransactions + useAggregation 조합으로 실제 PnL 계산
const holding = agg?.find(h => h.Ticker === r.Ticker)
if (holding && holding.AvgPrice > 0) {
  cumulative += (r.Price - holding.AvgPrice) * r.Quantity
}
```

또는 Google Sheets `_TICKER_CACHE_`에 실현손익이 이미 집계되어 있다면 해당 데이터를 활용.

#### FI-002: window.fetch 이중 패치 방지

**대상**: `src/components/global/session-expired-prompt.tsx`

플래그 변수(`window.__sessionFetchPatched`)로 이중 패치를 방지하거나, React StrictMode에서의 이중 실행 문제를 문서화한다.

---

### 5.2 설계 개선 (P2)

#### FI-003: ticker 폴백 처리 명확화

**대상**: `src/components/stock/stock-detail-client.tsx`

```typescript
// ticker가 code와 동일한 경우(집계 미확인) 자식 컴포넌트에 명시적으로 전달
const ticker = agg?.find(r => r.Code === code)?.Ticker
// DartDisclosureCard, JournalTable에서 ticker가 undefined인 경우 처리
```

`<a href="/dashboard">` → `<Link href="/dashboard">` 변경 병행.

#### FI-004: useQuery 훅 분리

**대상**: `src/components/stock/rsi-macd-card.tsx`

```typescript
// src/hooks/use-daily-price.ts 파일 신규 생성
export function useDailyPrice(code: string) {
  return useQuery<DailyPrice[]>({
    queryKey: ['kis', 'daily-price', code],
    queryFn: async () => { ... },
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
  })
}
```

#### FI-005/FI-006: key 값 개선

**대상**: `trade-history-table.tsx`, `journal-table.tsx`

```typescript
// 변경 전
key={i}

// 변경 후
key={`${r.Date}-${r.Ticker}-${r.Type}-${i}`}
```

---

### 5.3 권고 사항 (P3)

#### FI-007: 페이지네이션 접근성 개선

```tsx
<button aria-label="이전 페이지" ...>이전</button>
<button aria-label="다음 페이지" ...>다음</button>
```

#### FI-008: nav aria-label 추가

```tsx
<nav aria-label="섹션 네비게이션" className="hidden xl:block sticky top-6 w-48 shrink-0">
```

#### FI-009: 탭 옵션 명세 정렬

`cumulative-profit-chart.tsx`의 기간 탭을 요구사항 명세(1M/6M/1Y)와 일치시키거나, 현재 구현(전체/6개월/3개월)을 설계 문서에 반영.

#### FI-010: PriceCard isError 처리

```tsx
const { data, isLoading, isError } = useStockPrice(code)
if (isError) return <ErrorCard message="가격 정보를 불러올 수 없습니다." />
```

#### FI-011: PositionBarChart Cell 단순화

```tsx
// 변경 전
<Bar dataKey="value" radius={[0, 4, 4, 0]}>
  {chartData.map((_, i) => <Cell key={i} fill="hsl(220, 70%, 50%)" />)}
</Bar>

// 변경 후
<Bar dataKey="value" fill="hsl(220, 70%, 50%)" radius={[0, 4, 4, 0]} />
```

---

## 6. 컴포넌트별 판정 요약

| 파일 | 판정 | 주요 이슈 |
|:---|:---:|:---|
| `hooks/use-transactions.ts` | 합격 | — |
| `hooks/use-aggregation.ts` | 합격 | — |
| `hooks/use-stock-price.ts` | 합격 | — |
| `hooks/use-ai-analysis.ts` | 합격 | — |
| `hooks/use-refresh-ai-analysis.ts` | 합격 | — |
| `hooks/use-refresh-all.ts` | 합격 | invalidateQueries 목록 완전성 확인 권고 |
| `dashboard/dashboard-client.tsx` | 합격 | — |
| `dashboard/kpi-card.tsx` | 합격 | KPI 항목 명세 차이 문서화 권고 |
| `dashboard/position-bar-chart.tsx` | 조건부통과 | FI-011 (P3) |
| `dashboard/profit-bar-chart.tsx` | 합격 | — |
| `dashboard/cumulative-profit-chart.tsx` | 수정필요 | FI-001 (P1), FI-009 (P3) |
| `dashboard/stock-analysis-table.tsx` | 합격 | — |
| `dashboard/trade-history-table.tsx` | 조건부통과 | FI-005 (P2), FI-007 (P3) |
| `dashboard/strategy-table.tsx` | 합격 | — |
| `stock/stock-detail-client.tsx` | 조건부통과 | FI-003 (P2) |
| `stock/price-card.tsx` | 조건부통과 | FI-010 (P3) |
| `stock/rsi-macd-card.tsx` | 조건부통과 | FI-004 (P2) |
| `stock/ai-analysis-card.tsx` | 합격 | — |
| `stock/portfolio-card.tsx` | 합격 | agg isLoading 미처리 확인 권고 |
| `stock/anchor-menu.tsx` | 조건부통과 | FI-008 (P3) |
| `stock/refresh-section.tsx` | 합격 | — |
| `stock/journal-table.tsx` | 조건부통과 | FI-006 (P2) |
| `global/session-expired-prompt.tsx` | 수정필요 | FI-002 (P1) |
| `global/session-provider.tsx` | 합격 | — |
| `auth/sign-in-content.tsx` | 합격 | — |
| `auth/login-card.tsx` | 합격 | — |
| `auth/auth-error-message.tsx` | 합격 | — |
| `ui/theme-toggle.tsx` | 합격 | — |
| `ui/change-badge.tsx` | 합격 | NaN 가드 추가 권고 |
| `ui/error-card.tsx` | 합격 | button type="button" 추가 권고 |
