# 전역 상태 관리 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | 전역 상태 관리 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 단일 사용자·단순 UI 앱으로 **전역 상태를 최소화**한다. Zustand·Redux·Jotai 등 별도 상태 라이브러리 없이 다음 메커니즘으로 모든 상태를 관리한다.

---

## 2. 상태 유형별 관리 전략

| 상태 유형 | 관리 메커니즘 | 패키지 |
|:---|:---|:---|
| 다크/라이트 테마 | `ThemeProvider` (CSS class) | `next-themes` |
| 로그인 세션 | `SessionProvider` + `useSession()` | `next-auth/react` |
| 서버 데이터 (KIS·Sheets 등) | TanStack Query 캐시 | `@tanstack/react-query` |
| URL 기반 상태 (종목 코드·필터) | `useParams()` / `useSearchParams()` | Next.js 내장 |
| UI 로컬 상태 (정렬·모달·로딩) | `useState` | React 내장 |
| 섹션 앵커 활성 상태 | `useState` + `IntersectionObserver` | React 내장 |

> **원칙**: 서버 데이터는 TanStack Query, UI 상태는 컴포넌트 로컬, URL 공유가 필요한 상태는 URL 파라미터로 관리.

---

## 3. 테마 상태 (next-themes)

### 3.1 설정

```typescript
// src/app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 3.2 사용

```typescript
'use client'
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  // resolvedTheme: 'system' 선택 시 실제 적용된 테마 ('light' | 'dark')
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      테마 전환
    </button>
  )
}
```

### 3.3 Recharts 다크모드 적용

```typescript
'use client'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

function PositionBarChart({ data }) {
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
      <Bar dataKey="value" />
    </BarChart>
  )
}
```

---

## 4. 세션 상태 (next-auth)

### 4.1 설정

```typescript
// src/components/providers/session-provider.tsx
'use client'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

export function SessionProvider({ children, session }: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
```

### 4.2 클라이언트 컴포넌트에서 세션 사용

```typescript
'use client'
import { useSession } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'

function UserInfo() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <Skeleton className="h-8 w-32" />
  if (status === 'unauthenticated') return null  // middleware가 보호

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
    </div>
  )
}
```

### 4.3 서버 컴포넌트에서 세션 사용

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Header() {
  const session = await getServerSession(authOptions)
  return <UserInfo email={session?.user?.email} />
}
```

---

## 5. URL 기반 상태

### 5.1 종목 코드 (동적 라우트)

```typescript
// src/app/stock/[code]/page.tsx
interface PageProps {
  params: { code: string }
}

export default function StockDetailPage({ params }: PageProps) {
  const { code } = params  // URL에서 종목 코드 추출
  return <StockDetailClient code={code} />
}
```

### 5.2 대시보드 필터 상태 (URL 파라미터)

```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'

function StockAnalysisTable() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // 보유 여부 필터 — URL 공유 가능, 새로고침 유지
  const holdingsOnly = searchParams.get('holdings') === 'true'

  function toggleHoldings() {
    const params = new URLSearchParams(searchParams)
    if (holdingsOnly) {
      params.delete('holdings')
    } else {
      params.set('holdings', 'true')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div>
      <button onClick={toggleHoldings}>
        {holdingsOnly ? '전체 보기' : '보유 종목만'}
      </button>
      {/* 테이블 */}
    </div>
  )
}
```

---

## 6. 로컬 UI 상태

### 6.1 테이블 정렬

```typescript
'use client'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table'

function DataTable({ columns, data }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // ...
}
```

### 6.2 섹션 앵커 활성 상태

```typescript
'use client'
import { useState, useEffect, useRef } from 'react'

const SECTIONS = [
  { id: 'sec-01', label: '시세 요약' },
  { id: 'sec-02', label: '가치평가' },
  // ...
]

function AnchorMenu() {
  const [activeId, setActiveId] = useState<string>('sec-01')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px' }  // 뷰포트 상단 20% 지점에서 활성화
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="sticky top-6 space-y-1">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={activeId === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
```

---

## 7. 전체 Provider 래핑 순서

```typescript
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider session={session}>
            <Providers>        {/* TanStack Query */}
              {children}
              <Toaster />
              <SessionExpiredPrompt />
            </Providers>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Provider 래핑 순서:
1. `ThemeProvider` — 최외곽 (CSS class 적용)
2. `SessionProvider` — 인증 컨텍스트
3. `Providers` (QueryClientProvider) — 데이터 패칭
4. `Toaster` + `SessionExpiredPrompt` — 전역 UI

---

## 8. 상태 관리 원칙 요약

| 원칙 | 내용 |
|:---|:---|
| 서버 데이터는 TanStack Query | KIS·Sheets·DART·AI 데이터는 모두 useQuery/useMutation |
| UI 상태는 로컬 | 정렬, 필터, 모달 open/close는 `useState` |
| 공유 가능한 UI 상태는 URL | 보유 여부 필터, 탭 선택 등 |
| Zustand/Redux 사용 안 함 | 전역 상태 라이브러리 추가 의존성 불필요 |
| 세션은 next-auth 위임 | 직접 토큰 관리 금지 |
