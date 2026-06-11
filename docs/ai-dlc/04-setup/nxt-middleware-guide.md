# middleware.ts 전역 인증 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | middleware.ts 전역 인증 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

`middleware.ts`는 Next.js Edge Runtime에서 모든 요청을 인터셉트하여 **JWT 세션 유효성을 전역 검증**한다. NextAuth v4의 `withAuth` 미들웨어를 사용하며, 로그인 페이지와 NextAuth 내부 경로는 보호에서 제외한다.

---

## 2. middleware.ts 구현

```typescript
// middleware.ts (프로젝트 루트 — src/ 외부)
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    /*
     * 아래 경로 제외하고 모든 요청에 JWT 검증 적용:
     * - /api/auth/* (NextAuth 내부 엔드포인트)
     * - /auth/signin (로그인 페이지)
     * - /_next/static (정적 에셋)
     * - /_next/image (이미지 최적화)
     * - /favicon.ico
     */
    '/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico).*)',
  ]
}
```

### 2.1 middleware.ts 위치

```
my-stock/
├── middleware.ts    ← 프로젝트 루트 (src/ 내부 아님)
├── src/
│   └── app/
└── next.config.mjs
```

> Next.js는 `src/` 디렉터리 사용 시 `src/middleware.ts`도 인식하지만, **프로젝트 루트**에 두는 것이 권장 위치다.

---

## 3. matcher 패턴 상세

| 경로 패턴 | 보호 여부 | 이유 |
|:---|:---:|:---|
| `/api/auth/*` | ❌ 제외 | NextAuth 콜백·로그인 처리 경로 |
| `/auth/signin` | ❌ 제외 | 로그인 페이지 (미인증 사용자 진입 허용) |
| `/_next/static/*` | ❌ 제외 | JS·CSS 정적 번들 |
| `/_next/image/*` | ❌ 제외 | 이미지 최적화 API |
| `/favicon.ico` | ❌ 제외 | 파비콘 |
| `/dashboard` | ✅ 보호 | 대시보드 페이지 |
| `/stock/*` | ✅ 보호 | 종목상세 페이지 |
| `/api/sheets/*` | ✅ 보호 | Sheets API Route |
| `/api/kis/*` | ✅ 보호 | KIS API Route |
| `/api/dart/*` | ✅ 보호 | DART API Route |
| `/api/ai/*` | ✅ 보호 | AI 분석 API Route |
| `/api/ticker/*` | ✅ 보호 | 통합 갱신 API Route |

---

## 4. 미들웨어 동작 흐름

```mermaid
flowchart TD
    A[요청 진입] --> B{matcher 패턴 일치?}
    B -- 아니오 --> C[미들웨어 통과 — 제외 경로]
    B -- 예 --> D{JWT 쿠키 유효?}
    D -- 유효 --> E[요청 진행]
    D -- 무효/없음 --> F{API 경로?}
    F -- 예 /api/* --> G[401 JSON 응답]
    F -- 아니오 페이지 --> H[/auth/signin 리다이렉트]
```

---

## 5. API Route 401 처리 전략 (SR-005)

미들웨어는 페이지 경로에서는 `/auth/signin`으로 리다이렉트하지만, **API Route Handler에서는 세션 만료를 UI로 알려야 한다** (리다이렉트 없음, SR-005).

### 5.1 API Route에서 추가 세션 검증

```typescript
// 모든 API Route Handler에 적용
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'SESSION_EXPIRED' },
      { status: 401 }
    )
  }
  // 이후 비즈니스 로직
}
```

### 5.2 클라이언트 SessionExpiredPrompt

```typescript
// src/components/global/session-expired-prompt.tsx
'use client'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function SessionExpiredPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // 전역 fetch 인터셉터: 401 응답 감지
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401) {
        // 클론하여 소비 방지
        const cloned = response.clone()
        const body = await cloned.json().catch(() => ({}))
        if (body.code === 'SESSION_EXPIRED') setShow(true)
      }
      return response
    }
    return () => { window.fetch = originalFetch }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full text-center space-y-4">
        <p className="font-medium">세션이 만료되었습니다</p>
        <p className="text-sm text-muted-foreground">다시 로그인해 주세요.</p>
        <button
          className="w-full bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
          onClick={() => signIn('google')}
        >
          다시 로그인
        </button>
      </div>
    </div>
  )
}
```

### 5.3 레이아웃에 SessionExpiredPrompt 추가

```typescript
// src/app/layout.tsx
import { SessionExpiredPrompt } from '@/components/global/session-expired-prompt'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <SessionExpiredPrompt />  {/* 전역 401 처리 */}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 6. React Query와 401 연동

TanStack Query에서 401 응답을 처리하는 추가 패턴:

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // 401은 재시도 안 함 (SessionExpiredPrompt가 처리)
          if (error?.status === 401) return false
          return failureCount < 1
        },
      }
    }
  })
}
```

---

## 7. 검증 체크리스트

- [ ] `middleware.ts`가 프로젝트 루트에 위치 확인
- [ ] `/auth/signin` 미인증으로 접근 가능 확인
- [ ] `/api/auth/*` 미인증으로 접근 가능 확인
- [ ] `/dashboard` 미인증 접근 시 `/auth/signin` 리다이렉트 확인
- [ ] API Route 401 응답 시 SessionExpiredPrompt 표시 확인 (리다이렉트 없음)
- [ ] ALLOWED_EMAIL 설정 후 다른 계정 접근 거부 확인
