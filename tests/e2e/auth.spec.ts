import { test, expect } from '@playwright/test'
import { injectAuthCookie } from '../fixtures/auth'

// 이 파일은 playwright.config.ts의 'no-auth' 프로젝트에서 실행됨 (storageState 없음)

test.describe('T001-T003: 미인증 접근 보호', () => {
  test('T001: 미인증 /dashboard → /auth/signin 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin**')
    expect(page.url()).toContain('/auth/signin')
  })

  test('T002: 미인증 /stock/005930 → /auth/signin 리다이렉트', async ({ page }) => {
    await page.goto('/stock/005930')
    await page.waitForURL('**/auth/signin**')
    expect(page.url()).toContain('/auth/signin')
  })

  test('T003: /auth/signin 페이지 Google 로그인 버튼 렌더링', async ({ page }) => {
    await page.goto('/auth/signin')
    const signinButton = page.getByTestId('google-signin-button')
    await expect(signinButton).toBeVisible()
  })
})

test.describe('T004-T005: 인증 상태 리다이렉트', () => {
  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context)
  })

  test('T004: 유효하지 않은 종목 코드 /stock/abc123 → /dashboard 리다이렉트', async ({ page }) => {
    await page.goto('/stock/abc123')
    await page.waitForURL('**/dashboard**')
    expect(page.url()).toContain('/dashboard')
  })

  test('T005: 인증 상태에서 /auth/signin 접근 → /dashboard 리다이렉트', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/dashboard**')
    expect(page.url()).toContain('/dashboard')
  })
})
