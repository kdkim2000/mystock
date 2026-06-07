'use client'
import { KpiCards } from './kpi-card'
import { PositionBarChart } from './position-bar-chart'
import { ProfitBarChart } from './profit-bar-chart'
import { CumulativeProfitChart } from './cumulative-profit-chart'
import { StockAnalysisTable } from './stock-analysis-table'
import { TradeHistoryTable } from './trade-history-table'
import { StrategyTable } from './strategy-table'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function DashboardClient() {
  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="dashboard-container">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">포트폴리오 대시보드</h1>
        <ThemeToggle />
      </div>

      <KpiCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PositionBarChart />
        <ProfitBarChart />
      </div>

      <CumulativeProfitChart />

      <div>
        <h2 className="text-lg font-semibold mb-3">종목별 분석</h2>
        <StockAnalysisTable />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">거래 내역</h2>
          <TradeHistoryTable />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">전략별 통계</h2>
          <StrategyTable />
        </div>
      </div>
    </div>
  )
}
