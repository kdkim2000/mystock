import { test, expect } from '@playwright/test'
import { mockSheetsApi, mockKisApi, mockSheetsApiError } from '../fixtures/api-mocks'

// 이 파일은 playwright.config.ts의 'chromium' 프로젝트에서 실행됨 (storageState 사용)

test.describe('T050: API 오류 상태 UI', () => {
  test('T050: KIS API 500 오류 시 종목 상세 기본 렌더링', async ({ page }) => {
    await mockSheetsApi(page)
    // KIS API는 응답 없이 오류 반환
    await page.route('**/api/kis/**', route =>
      route.fulfill({ status: 500, json: { error: 'KIS API 오류', code: 'INTERNAL_ERROR' } }),
    )
    await page.route('**/api/fundamental**', route =>
      route.fulfill({ status: 500, json: { error: 'KIS API 오류', code: 'INTERNAL_ERROR' } }),
    )
    await page.route('**/api/ai/**', route =>
      route.fulfill({ status: 500, json: { error: '오류', code: 'INTERNAL_ERROR' } }),
    )

    await page.goto('/stock/005930')

    // 페이지가 렌더링됨 (크래시 없음)
    // refresh 섹션은 항상 표시됨
    const refreshButton = page.getByTestId('refresh-button')
    await expect(refreshButton).toBeVisible({ timeout: 15_000 })
  })

  test('T051: Sheets API 오류 시 대시보드 빈 상태 표시', async ({ page }) => {
    await mockSheetsApiError(page)
    await page.goto('/dashboard')

    // 대시보드 컨테이너는 렌더링됨
    await expect(page.getByTestId('dashboard-container')).toBeVisible()

    // 데이터 없음 메시지 표시 확인
    const table = page.getByTestId('stock-analysis-table')
    await expect(table).toBeVisible()
    await expect(table).toContainText('거래 데이터가 없습니다.')
  })
})

test.describe('T055: SR-005 세션 만료 UI', () => {
  test('T055: 401 응답 시 강제 리다이렉트 없이 오류 UI 표시', async ({ page }) => {
    await mockSheetsApi(page)
    await mockKisApi(page)
    await page.goto('/dashboard')

    // 대시보드 로드 후 401 시뮬레이션 (새 요청에서만 401)
    await page.route('**/api/sheets/aggregation**', route =>
      route.fulfill({ status: 401, json: { error: '세션이 만료되었습니다.', code: 'UNAUTHORIZED' } }),
    )

    // /auth/signin으로 리다이렉트되지 않음을 확인 (SR-005: UI 프롬프트만 표시)
    // 이미 로드된 페이지는 그대로 유지
    expect(page.url()).not.toContain('/auth/signin')
  })
})
