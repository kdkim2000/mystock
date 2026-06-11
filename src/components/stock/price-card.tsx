'use client'
import { useStockPrice } from '@/hooks/use-stock-price'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeBadge } from '@/components/ui/change-badge'

interface Props { code: string }

export function PriceCard({ code }: Props) {
  const { data, isLoading } = useStockPrice(code)
  if (isLoading) return <Card><CardContent className="h-32 pt-6"><Skeleton className="h-full" /></CardContent></Card>
  if (!data) return null

  return (
    <Card id="sec-price">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{data.name} <span className="text-muted-foreground text-sm font-normal">{code}</span></span>
          <ChangeBadge value={data.changeRate} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{data.currentPrice.toLocaleString('ko-KR')}원</div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div><div className="text-muted-foreground">52주 최고</div><div className="font-medium">{data.high52w.toLocaleString('ko-KR')}</div></div>
          <div><div className="text-muted-foreground">52주 최저</div><div className="font-medium">{data.low52w.toLocaleString('ko-KR')}</div></div>
          <div><div className="text-muted-foreground">시가총액</div><div className="font-medium">{(data.marketCap / 1e8).toFixed(0)}억</div></div>
        </div>
      </CardContent>
    </Card>
  )
}
