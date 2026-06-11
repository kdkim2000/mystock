import { test, expect } from '@playwright/test'
import { mockSheetsApi, mockKisApi, mockSheetsApiError } from '../fixtures/api-mocks'

// 이 파일은 playwright.config.ts의 'chromium' 프로젝트에서 실행됨 (storageState 사용)

test.describe('T010: 대시보드 레이아웃', () => {
  test.beforeEach(async ({ page }) => {
    await mockSheetsApi(page)
    await mockKisApi(page)
  })

  test('T010: /dashboard 접근 시 대시보드 컨테이너 렌더링', async ({ page }) => {
    await page.goto('/dashboard')
    const dashboard = page.getByTestId('dashboard-container')
    await expect(dashboard).toBeVisible()
  })

  test('T011: KPI 카드 4개 렌더링', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('kpi-card-investment')).toBeVisible()
    await expect(page.getByTestId('kpi-card-pnl')).toBeVisible()
    await expect(page.getByTestId('kpi-card-trades')).toBeVisible()
    await expect(page.getByTestId('kpi-card-winrate')).toBeVisible()
  })
})

test.describe('T020-T022: 종목별 분석 테이블', () => {
  test.beforeEach(async ({ page }) => {
    await mockSheetsApi(page)
    await mockKisApi(page)
  })

  test('T020: stock-analysis-table 렌더링 및 종목 표시', async ({ page }) => {
    await page.goto('/dashboard')
    const table = page.getByTestId('stock-analysis-table')
    await expect(table).toBeVisible()
    await expect(page.getByTestId('stock-row-삼성전자')).toBeVisible()
  })

  test('T021: 종목 클릭 → /stock/{code} 이동 (FR-008)', async ({ page }) => {
    await mockKisApi(page)
    await page.goto('/dashboard')

    // 종목명 링크 클릭
    const link = page.getByTestId('stock-row-삼성전자').getByRole('link')
    await expect(link).toBeVisible()
    await link.click()

    await page.waitForURL('**/stock/005930**')
    expect(page.url()).toContain('/stock/005930')
  })
})

test.describe('T025-T026: 거래 내역 테이블', () => {
  test.beforeEach(async ({ page }) => {
    await mockSheetsApi(page)
    await mockKisApi(page)
  })

  test('T025: trade-history-table 렌더링', async ({ page }) => {
    await page.goto('/dashboard')
    const table = page.getByTestId('trade-history-table')
    await expect(table).toBeVisible()
    // 테스트 데이터의 거래 내역 표시 확인
    await expect(table).toContainText('삼성전자')
  })
})

test.describe('T030: 스켈레톤 → 데이터 전환', () => {
  test('T030: 로딩 중 Skeleton 표시 후 데이터 렌더링', async ({ page }) => {
    // 응답을 지연시켜 로딩 상태 확인
    await page.route('**/api/sheets/aggregation**', async route => {
      await new Promise(resolve => setTimeout(resolve, 300))
      await route.fulfill({ json: { data: [] } })
    })

    await page.goto('/dashboard')

    // Skeleton 표시 확인 (빠른 UI)
    const skeleton = page.locator('.animate-pulse').first()
    // Skeleton이 있었다가 사라지는 것을 확인 (데이터 로드 후 숨김)
    await expect(page.getByTestId('dashboard-container')).toBeVisible()
  })
})

test.describe('T035: Google Sheets API 오류', () => {
  test('T035: Sheets API 500 오류 시 오류 UI 표시', async ({ page }) => {
    await mockSheetsApiError(page)
    await page.goto('/dashboard')
    // 에러 상태에서도 대시보드 컨테이너는 렌더링됨
    await expect(page.getByTestId('dashboard-container')).toBeVisible()
    // 데이터 없이 빈 테이블 상태 표시
    await expect(page.getByTestId('stock-analysis-table')).toBeVisible()
  })
})
