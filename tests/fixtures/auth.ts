import { encode } from 'next-auth/jwt'
import type { BrowserContext } from '@playwright/test'

export async function injectAuthCookie(context: BrowserContext) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET or AUTH_SECRET env var required for E2E tests')

  const token = await encode({
    token: {
      email: process.env.TEST_USER_EMAIL ?? 'test@example.com',
      name: 'E2E Test User',
      sub: 'e2e-test-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    secret,
    maxAge: 3600,
  })

  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 3600,
    },
  ])
}
