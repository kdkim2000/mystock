'use client'
import { useAggregation } from '@/hooks/use-aggregation'
import { useStockPrice } from '@/hooks/use-stock-price'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeBadge } from '@/components/ui/change-badge'

interface Props { code: string }

export function PortfolioCard({ code }: Props) {
  const { data: agg } = useAggregation()
  const { data: price, isLoading } = useStockPrice(code)

  const holding = agg?.find(r => r.Code === code)
  if (!holding || holding.Holdings === 0) return null
  if (isLoading) return <Card id="sec-portfolio"><CardContent className="h-32 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  const marketValue = price ? price.currentPrice * holding.Holdings : 0
  const pnl = marketValue - (holding.AvgPrice * holding.Holdings)
  const pnlRate = (holding.AvgPrice > 0) ? (pnl / (holding.AvgPrice * holding.Holdings)) * 100 : 0

  return (
    <Card id="sec-portfolio">
      <CardHeader><CardTitle className="text-sm">보유 현황</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-muted-foreground">보유수량</div><div className="font-bold">{holding.Holdings.toLocaleString('ko-KR')}주</div></div>
          <div><div className="text-muted-foreground">평균단가</div><div className="font-bold">{holding.AvgPrice.toLocaleString('ko-KR')}원</div></div>
          <div><div className="text-muted-foreground">평가금액</div><div className="font-bold">{marketValue.toLocaleString('ko-KR')}원</div></div>
          <div><div className="text-muted-foreground">평가손익</div><div className="font-bold"><ChangeBadge value={pnl} suffix="원" /></div></div>
          <div className="col-span-2"><div className="text-muted-foreground">수익률</div><div className="text-xl font-bold"><ChangeBadge value={pnlRate} /></div></div>
        </div>
      </CardContent>
    </Card>
  )
}
