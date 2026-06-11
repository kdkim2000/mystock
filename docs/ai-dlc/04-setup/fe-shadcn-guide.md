# shadcn/ui 컴포넌트·테마 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | shadcn/ui 컴포넌트·테마 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 **shadcn/ui**를 UI 기반 라이브러리로 사용한다. shadcn/ui는 컴포넌트 소스를 직접 프로젝트에 복사하는 방식으로, 커스터마이징이 자유롭다. `next-themes`와 연동하여 다크/라이트 모드를 지원한다.

---

## 2. 초기화

```bash
npx shadcn@latest init
```

### 2.1 초기화 선택 옵션

| 항목 | 선택값 |
|:---|:---|
| Style | Default |
| Base color | Neutral |
| CSS variables | Yes |
| Tailwind config | `tailwind.config.ts` |
| Components path | `@/components` |
| Utils path | `@/lib/utils` |

초기화 후 생성되는 파일:
- `src/lib/utils.ts` — `cn()` 함수 (clsx + tailwind-merge)
- `src/app/globals.css` — CSS 변수 (--background, --foreground 등)
- `components.json` — shadcn/ui 설정

---

## 3. my-stock 사용 컴포넌트 설치

```bash
# 기본 UI 컴포넌트
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add separator

# 피드백 컴포넌트
npx shadcn@latest add toast
npx shadcn@latest add dialog

# 네비게이션
npx shadcn@latest add pagination
npx shadcn@latest add dropdown-menu

# 테이블
npx shadcn@latest add table
```

설치 위치: `src/components/ui/`

---

## 4. my-stock 컴포넌트 매핑

| shadcn 컴포넌트 | 사용 위치 | 비고 |
|:---|:---|:---|
| `Button` | GoogleSignInButton, RefreshButton, RefreshAllButton | variant: default, outline, ghost |
| `Card` + `CardHeader` + `CardContent` | KpiCard, LoginCard, AiAnalysisCard, PortfolioCard | |
| `Badge` | ChangeBadge (등락률), 전략 태그 | 상승=red, 하락=blue (한국 증시) |
| `Skeleton` | 모든 비동기 섹션 로딩 상태 | `animate-pulse` |
| `Toast` + `Toaster` | 데이터 갱신 성공/실패 알림 | |
| `Dialog` | SessionExpiredPrompt (세션 만료 모달) | |
| `Pagination` | TradeHistoryTable 페이지 이동 | |
| `DropdownMenu` | 헤더 사용자 메뉴 (로그아웃) | |
| `Table` | OpinionTable, JournalTable (기본 테이블) | DataTable은 TanStack Table 별도 구현 |
| `Separator` | 섹션 구분선 | |

---

## 5. 다크/라이트 테마 설정

### 5.1 ThemeProvider 설정 (`src/app/layout.tsx`)

```typescript
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

> `suppressHydrationWarning`: 서버/클라이언트 테마 불일치 경고 억제 (next-themes 필수 설정)

### 5.2 ThemeToggle 컴포넌트

```typescript
// src/components/ui/theme-toggle.tsx
'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="테마 전환"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## 6. CSS 변수 커스터마이징 (`src/app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui 기본 변수 (Neutral 팔레트) */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --border: 240 5.9% 90%;
    --radius: 0.5rem;

    /* my-stock 커스텀: 한국 증시 색상 컨벤션 */
    --color-price-up: 220 90% 45%;     /* 상승 = 파랑 (한국 관례) */
    --color-price-down: 0 72% 51%;     /* 하락 = 빨강 */
    --color-price-neutral: 240 5% 65%; /* 보합 = 회색 */
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --border: 240 3.7% 15.9%;

    /* 다크모드 가격 색상 (밝기 조정) */
    --color-price-up: 220 80% 60%;
    --color-price-down: 0 65% 60%;
  }
}
```

> 한국 증시는 **상승=파랑, 하락=빨강**이 관례. 글로벌 표준(상승=초록)과 반대임에 주의.

---

## 7. `cn()` 유틸 함수

shadcn/ui가 자동 생성하는 `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

사용 예시:

```typescript
// 조건부 클래스 적용
<span className={cn(
  'font-semibold tabular-nums',
  change > 0 && 'text-[hsl(var(--color-price-up))]',
  change < 0 && 'text-[hsl(var(--color-price-down))]',
  change === 0 && 'text-[hsl(var(--color-price-neutral))]',
)}>
  {change > 0 ? '+' : ''}{change}%
</span>
```

---

## 8. KpiCard 구현 예시

```typescript
// src/components/dashboard/kpi-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  unit?: string
  trend?: number  // 양수: 상승, 음수: 하락
}

export function KpiCard({ label, value, unit, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {trend !== undefined && (
          <p className={cn(
            'text-xs mt-1',
            trend > 0 && 'text-[hsl(var(--color-price-up))]',
            trend < 0 && 'text-[hsl(var(--color-price-down))]',
          )}>
            {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}%
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 9. Toaster 전역 등록

```typescript
// src/app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

사용 예시:

```typescript
'use client'
import { useToast } from '@/components/ui/use-toast'

function RefreshButton({ code }: { code: string }) {
  const { toast } = useToast()

  async function handleRefresh() {
    const res = await fetch(`/api/ticker/${code}/refresh`, { method: 'POST' })
    if (res.ok) {
      toast({ title: '갱신 완료', description: '모든 섹션이 업데이트되었습니다.' })
    } else {
      toast({ title: '갱신 실패', variant: 'destructive' })
    }
  }

  return <Button onClick={handleRefresh}>데이터 갱신</Button>
}
```
