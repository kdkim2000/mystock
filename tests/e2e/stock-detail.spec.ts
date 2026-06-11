import { test, expect } from '@playwright/test'
import { mockKisApi, mockRefreshApi, mockSheetsApi } from '../fixtures/api-mocks'

// 이 파일은 playwright.config.ts의 'chromium' 프로젝트에서 실행됨 (storageState 사용)

test.describe('T040: 종목 상세 페이지 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await mockSheetsApi(page)
    await mockKisApi(page)
  })

  test('T040: /stock/005930 접근 시 가격 카드 렌더링', async ({ page }) => {
    await page.goto('/stock/005930')

    // 가격 카드 섹션 확인 (id="sec-price")
    const priceSection = page.locator('#sec-price')
    await expect(priceSection).toBeVisible()

    // 종목명 및 현재가 표시 확인
    await expect(priceSection).toContainText('삼성전자')
    await expect(priceSection).toContainText('73,000')
  })
})

test.describe('T060-T062: 데이터 갱신 버튼', () => {
  test.beforeEach(async ({ page }) => {
    await mockSheetsApi(page)
    await mockKisApi(page)
  })

  test('T060: 갱신 버튼 클릭 → 성공 Toast 표시', async ({ page }) => {
    await mockRefreshApi(page)
    await page.goto('/stock/005930')

    const refreshButton = page.getByTestId('refresh-button')
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    // 로딩 상태 확인 (버튼 텍스트 변경)
    await expect(refreshButton).toContainText('갱신 중...')

    // 성공 Toast 확인
    const toast = page.getByRole('region', { name: /notification|toast/i }).first()
    await expect(page.getByText('데이터 갱신 완료')).toBeVisible({ timeout: 15_000 })
  })

  test('T062: 갱신 실패 시 destructive Toast 표시', async ({ page }) => {
    await mockRefreshApi(page, { fail: true })
    await page.goto('/stock/005930')

    const refreshButton = page.getByTestId('refresh-button')
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    // 실패 Toast 확인
    await expect(page.getByText('갱신 실패')).toBeVisible({ timeout: 15_000 })
  })
})
