'use client'
import { useAggregation } from '@/hooks/use-aggregation'
import { PriceCard } from './price-card'
import { ValuationTable } from './valuation-table'
import { FinancialTable } from './financial-table'
import { FinancialRadarChart } from './financial-radar-chart'
import { EstimateTable } from './estimate-table'
import { InvestorTrendChart } from './investor-trend-chart'
import { OpinionTable } from './opinion-table'
import { DartDisclosureCard } from './dart-disclosure-card'
import { PortfolioCard } from './portfolio-card'
import { RsiMacdCard } from './rsi-macd-card'
import { AiAnalysisCard } from './ai-analysis-card'
import { JournalTable } from './journal-table'
import { RefreshSection } from './refresh-section'
import { AnchorMenu } from './anchor-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Props { code: string }

export function StockDetailClient({ code }: Props) {
  const { data: agg } = useAggregation()
  const ticker = agg?.find(r => r.Code === code)?.Ticker ?? code

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</a>
        <ThemeToggle />
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <PriceCard code={code} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValuationTable code={code} />
            <FinancialTable code={code} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FinancialRadarChart code={code} />
            <EstimateTable code={code} />
          </div>
          <InvestorTrendChart code={code} />
          <OpinionTable code={code} />
          <DartDisclosureCard code={code} ticker={ticker} />
          <PortfolioCard code={code} />
          <RsiMacdCard code={code} />
          <AiAnalysisCard code={code} />
          <JournalTable code={code} />
          <RefreshSection code={code} />
        </div>
        <AnchorMenu />
      </div>
    </div>
  )
}
