# Tailwind CSS 반응형 레이아웃 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | Tailwind CSS 반응형 레이아웃 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock의 Tailwind CSS 설정과 반응형 레이아웃 패턴을 정의한다. 대시보드·종목상세 페이지의 반응형 그리드, 다크모드, 한국 증시 색상 커스텀 변수를 다룬다.

---

## 2. tailwind.config.ts 설정

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],  // next-themes class 기반 다크모드
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // shadcn/ui CSS 변수 연동
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // my-stock 주가 색상 (한국 증시 컨벤션)
        'price-up': 'hsl(var(--color-price-up))',
        'price-down': 'hsl(var(--color-price-down))',
        'price-neutral': 'hsl(var(--color-price-neutral))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

---

## 3. 반응형 브레이크포인트 규칙

| 브레이크포인트 | 픽셀 | 적용 변화 |
|:---|:---:|:---|
| `sm:` | 640px | 테이블 핵심 컬럼만 표시 (모바일 최적화) |
| `md:` | 768px | KPI 카드 2열 → 4열 전환 |
| `lg:` | 1024px | 차트 1열 → 2열 전환 |
| `xl:` | 1280px | 종목상세 앵커메뉴 표시 |

---

## 4. 대시보드 레이아웃 패턴

### 4.1 KPI 카드 그리드 (2열 → 4열)

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <!-- KpiCard × 4 -->
</div>
```

### 4.2 차트 2열 그리드

```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
  <!-- PositionBarChart -->
  <!-- ProfitBarChart -->
</div>
```

### 4.3 전폭 차트 및 테이블

```html
<div class="w-full mb-6">
  <!-- CumulativeProfitChart -->
</div>

<div class="w-full overflow-x-auto mb-6">
  <!-- StockAnalysisTable -->
</div>
```

### 4.4 하단 2열 테이블

```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <!-- StrategyTable -->
  <!-- TradeHistoryTable -->
</div>
```

### 4.5 전체 대시보드 레이아웃

```typescript
// src/app/dashboard/page.tsx 기본 구조
export default function DashboardPage() {
  return (
    <main className="container py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 투자 현황</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KpiCard × 4 */}
      </div>

      {/* 차트 행 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PositionBarChart, ProfitBarChart */}
      </div>

      {/* 누적 수익 차트 */}
      <div className="w-full">
        {/* CumulativeProfitChart */}
      </div>

      {/* 종목 분석 테이블 */}
      <div className="w-full overflow-x-auto">
        {/* StockAnalysisTable */}
      </div>

      {/* 하단 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* StrategyTable, TradeHistoryTable */}
      </div>
    </main>
  )
}
```

---

## 5. 종목상세 레이아웃 패턴

### 5.1 앵커 메뉴 사이드바 (xl 이상)

```html
<div class="container py-6">
  <!-- 헤더: 종목명 + 현재가 -->
  <div class="mb-6">...</div>

  <div class="flex gap-6">
    <!-- 메인 콘텐츠 (80%) -->
    <main class="flex-1 min-w-0 space-y-8">
      <!-- 13개 섹션 수직 스택 -->
      <section id="sec-01">...</section>
      <section id="sec-02">...</section>
      <!-- ... -->
    </main>

    <!-- 앵커 메뉴 (xl 이상만 표시) -->
    <aside class="hidden xl:block w-48 shrink-0">
      <nav class="sticky top-6 space-y-1">
        <a href="#sec-01" class="...">01 시세 요약</a>
        <!-- ... -->
      </nav>
    </aside>
  </div>
</div>
```

### 5.2 섹션 카드 기본 구조

```typescript
// 각 섹션 공통 래퍼
function SectionCard({ id, title, children }: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  )
}
```

---

## 6. 테이블 반응형 패턴

### 6.1 모바일에서 컬럼 숨김

```typescript
// TanStack Table 컬럼 정의에 적용
const columns = [
  { accessorKey: 'ticker', header: '종목', },
  { accessorKey: 'holdings', header: '보유', },
  {
    accessorKey: 'avgPrice',
    header: '평균단가',
    // sm 미만에서 숨김
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    accessorKey: 'marketValue',
    header: '평가금액',
    meta: { className: 'hidden md:table-cell' },
  },
]
```

---

## 7. 자주 쓰는 유틸리티 클래스 패턴

### 7.1 카드 컴포넌트
```
rounded-lg border bg-card text-card-foreground shadow-sm
```

### 7.2 섹션 제목
```
text-lg font-semibold mb-4
```

### 7.3 Skeleton (로딩 상태)
```
animate-pulse rounded bg-muted h-4 w-full
animate-pulse rounded bg-muted h-32 w-full  ← 차트 플레이스홀더
```

### 7.4 주가 색상 적용
```typescript
// price-up / price-down 커스텀 색상 사용
<span className={cn(
  'font-semibold tabular-nums',
  change > 0 && 'text-price-up',
  change < 0 && 'text-price-down',
  change === 0 && 'text-price-neutral',
)}>
```

### 7.5 앵커 메뉴 활성 상태
```typescript
<a
  href={`#${id}`}
  className={cn(
    'block text-sm px-3 py-1.5 rounded-md transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
  )}
>
```

---

## 8. 추가 플러그인

```bash
npm install tailwindcss-animate @tailwindcss/typography
```

| 플러그인 | 용도 |
|:---|:---|
| `tailwindcss-animate` | shadcn/ui 애니메이션 (accordion, dialog 등) |
| `@tailwindcss/typography` | AI 분석 텍스트 `prose` 클래스 (마크다운 스타일링) |
