# NextAuth Google OAuth 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | NextAuth Google OAuth 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 **NextAuth v4 + Google OAuth 2.0**으로 인증을 처리한다. 단일 사용자 앱으로 `ALLOWED_EMAIL` 환경변수로 특정 Google 계정만 접근을 허용할 수 있다.

---

## 2. 환경변수 요구사항

| 변수명 | 설명 | 필수 |
|:---|:---|:---:|
| `AUTH_SECRET` | JWT 서명 시크릿 | Y |
| `GOOGLE_CLIENT_ID` | Google OAuth 웹 클라이언트 ID | Y |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 | Y |
| `ALLOWED_EMAIL` | 단일 허용 이메일 (미설정 시 모든 계정 허용) | N |

### AUTH_SECRET 생성

```bash
openssl rand -base64 32
```

---

## 3. Google Cloud Console 설정

### 3.1 OAuth 2.0 클라이언트 ID 생성

1. [Google Cloud Console](https://console.cloud.google.com) → API 및 서비스 → 사용자 인증 정보
2. **OAuth 클라이언트 ID 만들기** → 유형: 웹 애플리케이션

### 3.2 승인된 URI 설정

| 항목 | 값 |
|:---|:---|
| 승인된 JavaScript 원본 | `http://localhost:3000` |
| 승인된 JavaScript 원본 | `https://{vercel-domain}.vercel.app` |
| 승인된 리디렉션 URI | `http://localhost:3000/api/auth/callback/google` |
| 승인된 리디렉션 URI | `https://{vercel-domain}.vercel.app/api/auth/callback/google` |

---

## 4. NextAuth 설정 파일

### 4.1 authOptions (`src/lib/auth.ts`)

```typescript
import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      // ALLOWED_EMAIL 미설정 시 모든 Google 계정 허용
      const allowedEmail = process.env.ALLOWED_EMAIL
      if (allowedEmail && user.email !== allowedEmail) return false
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  secret: process.env.AUTH_SECRET,
}
```

### 4.2 Route Handler (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

---

## 5. 로그인 페이지 (`src/app/auth/signin/page.tsx`)

```typescript
'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">my-stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center">
              {error === 'AccessDenied'
                ? '접근이 허용되지 않은 계정입니다.'
                : '로그인 중 오류가 발생했습니다.'}
            </p>
          )}
          <Button
            className="w-full"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            Google로 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 6. SessionProvider 설정 (`src/app/layout.tsx`)

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/session-provider'

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

```typescript
// src/components/providers/session-provider.tsx
'use client'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
```

---

## 7. ALLOWED_EMAIL 동작 명세

| 환경변수 상태 | 동작 |
|:---|:---|
| 미설정 | 모든 Google 계정 로그인 허용 |
| 설정 + 일치 | 로그인 성공 → JWT 발급 → `/dashboard` |
| 설정 + 불일치 | `signIn` 콜백 `false` 반환 → `/auth/signin?error=AccessDenied` |

---

## 8. 서버 컴포넌트에서 세션 조회

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  // middleware.ts가 미인증 요청을 차단하므로 session은 항상 존재
  return <div>환영합니다, {session?.user?.email}</div>
}
```

---

## 9. API Route에서 세션 검증

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'NO_SESSION' }, { status: 401 })
  }
  // 인증된 요청 처리
}
```

> `middleware.ts`가 페이지 라우트를 보호하지만, API Route Handler는 추가로 `getServerSession()`으로 독립 검증 (SR-005: UI 알림, 리다이렉트 없음).

---

## 10. 로그아웃

```typescript
'use client'
import { signOut } from 'next-auth/react'

<Button variant="outline" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
  로그아웃
</Button>
```
