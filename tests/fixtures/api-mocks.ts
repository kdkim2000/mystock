import type { Page } from '@playwright/test'
import {
  mockAggregation,
  mockTransactions,
  mockKisPrice,
  mockAiAnalysis,
} from './mock-data'

export async function mockSheetsApi(page: Page) {
  await page.route('**/api/sheets/aggregation**', route =>
    route.fulfill({ json: { data: mockAggregation } }),
  )
  await page.route('**/api/sheets/transactions**', route =>
    route.fulfill({ json: { data: mockTransactions } }),
  )
  await page.route('**/api/sheets/ticker-master**', route =>
    route.fulfill({ json: { data: [] } }),
  )
}

export async function mockKisApi(page: Page) {
  await page.route('**/api/kis/price**', route =>
    route.fulfill({ json: { data: mockKisPrice } }),
  )
  await page.route('**/api/fundamental**', route =>
    route.fulfill({
      json: {
        data: {
          price: mockKisPrice,
          valuation: { code: '005930', per: 15.2, pbr: 1.1, eps: 4800, bps: 66000, roe: 7.2, roa: 3.5, debtRatio: 32.1 },
          financial: { code: '005930', totalAssets: 500000, totalLiabilities: 160000, totalEquity: 340000, revenue: 300000, operatingProfit: 30000, netProfit: 22000, fiscalYear: '202312' },
          dartFinancial: { code: '005930', years: [] },
          disclosures: [],
        },
      },
    }),
  )
  await page.route('**/api/kis/daily-price**', route =>
    route.fulfill({ json: { data: [] } }),
  )
  await page.route('**/api/kis/trading-trend**', route =>
    route.fulfill({ json: { data: [] } }),
  )
  await page.route('**/api/kis/opinion**', route =>
    route.fulfill({ json: { data: [] } }),
  )
}

export async function mockAiApi(page: Page) {
  await page.route('**/api/ai/analysis**', route =>
    route.fulfill({ json: { data: mockAiAnalysis } }),
  )
}

export async function mockRefreshApi(page: Page, { fail = false } = {}) {
  await page.route('**/api/ticker/*/refresh**', route => {
    if (fail) {
      return route.fulfill({ status: 500, json: { error: '갱신 실패', code: 'INTERNAL_ERROR' } })
    }
    return route.fulfill({
      json: { data: { refreshedSections: ['price', 'valuation', 'financial', 'dailyPrice', 'tradingTrend', 'opinion', 'dart'], elapsedMs: 3200 } },
    })
  })
}

export async function mockSheetsApiError(page: Page) {
  await page.route('**/api/sheets/**', route =>
    route.fulfill({ status: 500, json: { error: 'Google Sheets API 오류', code: 'INTERNAL_ERROR' } }),
  )
}
