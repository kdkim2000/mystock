'use client'
import { useAggregation } from '@/hooks/use-aggregation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeBadge } from '@/components/ui/change-badge'

export function KpiCards() {
  const { data, isLoading } = useAggregation()

  const totals = data ? {
    totalMarketValue: data.reduce((sum, r) => sum + r.Holdings * r.AvgPrice, 0),
    realizedPnL: data.reduce((sum, r) => sum + r.RealizedPnL, 0),
    tradeCount: data.reduce((sum, r) => sum + r.TradeCount, 0),
    winRate: data.reduce((s, r) => s + r.WinCount, 0) / Math.max(data.reduce((s, r) => s + r.TradeCount, 0), 1) * 100,
  } : null

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">총 투자금액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals ? `${(totals.totalMarketValue / 1e6).toFixed(1)}M` : '-'}
            <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">실현손익</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals ? <ChangeBadge value={totals.realizedPnL} suffix="원" showSign /> : '-'}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">거래횟수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals ? `${totals.tradeCount}` : '-'}
            <span className="text-sm font-normal text-muted-foreground ml-1">회</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">승률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals ? `${totals.winRate.toFixed(1)}%` : '-'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
