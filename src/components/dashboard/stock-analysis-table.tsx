'use client'
import Link from 'next/link'
import { useAggregation } from '@/hooks/use-aggregation'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeBadge } from '@/components/ui/change-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function StockAnalysisTable() {
  const { data: agg, isLoading } = useAggregation()

  if (isLoading) return <Skeleton className="h-48" />

  return (
    <div className="rounded-md border" data-testid="stock-analysis-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>종목명</TableHead>
            <TableHead className="text-right">보유수량</TableHead>
            <TableHead className="text-right">평균단가</TableHead>
            <TableHead className="text-right">실현손익</TableHead>
            <TableHead className="text-right">승률</TableHead>
            <TableHead className="text-right">거래횟수</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(agg ?? []).map(row => (
            <TableRow key={row.Ticker} data-testid={`stock-row-${row.Ticker}`}>
              <TableCell className="font-medium">
                {row.Code
                  ? <Link href={`/stock/${row.Code}`} className="hover:underline">{row.Ticker}</Link>
                  : row.Ticker}
              </TableCell>
              <TableCell className="text-right">{row.Holdings.toLocaleString('ko-KR')}</TableCell>
              <TableCell className="text-right">{row.AvgPrice.toLocaleString('ko-KR')}원</TableCell>
              <TableCell className="text-right">
                <ChangeBadge value={row.RealizedPnL} suffix="원" />
              </TableCell>
              <TableCell className="text-right">
                {row.TradeCount > 0 ? `${(row.WinCount / row.TradeCount * 100).toFixed(0)}%` : '-'}
              </TableCell>
              <TableCell className="text-right">{row.TradeCount}회</TableCell>
            </TableRow>
          ))}
          {(agg ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                거래 데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
