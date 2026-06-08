'use client'
import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
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
import type { StockPrice } from '@/types/kis'

export function StockAnalysisTable() {
  const { data: agg, isLoading } = useAggregation()
  const [showAll, setShowAll] = useState(false)

  // 보유 종목 코드 목록 — 현재가 조회용
  const holdingCodes = useMemo(
    () => (agg ?? []).filter(r => r.Holdings > 0 && r.Code).map(r => r.Code),
    [agg],
  )

  // 현재가 병렬 조회
  const priceQueries = useQueries({
    queries: holdingCodes.map(code => ({
      queryKey: ['kis', 'price', code],
      queryFn: async () => {
        const res = await fetch(`/api/kis/price?code=${code}`)
        if (!res.ok) throw new Error(`${res.status}`)
        return (await res.json()).data as StockPrice
      },
      staleTime: 30 * 60 * 1000,
    })),
  })

  // code → 현재가 맵
  const priceMap = useMemo(() => {
    const map: Record<string, number> = {}
    priceQueries.forEach((q, i) => {
      if (q.data) map[holdingCodes[i]] = q.data.currentPrice
    })
    return map
  }, [priceQueries, holdingCodes])

  // 필터 + 평가금액 내림차순 정렬
  const rows = useMemo(() => {
    const filtered = (agg ?? []).filter(r => showAll || r.Holdings > 0)
    return [...filtered].sort((a, b) => {
      const evalA = a.Holdings * (priceMap[a.Code] ?? a.AvgPrice)
      const evalB = b.Holdings * (priceMap[b.Code] ?? b.AvgPrice)
      return evalB - evalA
    })
  }, [agg, showAll, priceMap])

  if (isLoading) return <Skeleton className="h-48" />

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAll(v => !v)}
          className={`text-xs px-3 py-1 rounded border ${showAll ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border'}`}
        >
          {showAll ? '보유중만' : '전체 조회'}
        </button>
      </div>
      <div className="rounded-md border" data-testid="stock-analysis-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종목명</TableHead>
              <TableHead className="text-right">보유수량</TableHead>
              <TableHead className="text-right">평균단가</TableHead>
              <TableHead className="text-right">실현손익</TableHead>
              <TableHead className="text-right">평가금액 ↓</TableHead>
              <TableHead className="text-right">평가손익</TableHead>
              <TableHead className="text-right">승률</TableHead>
              <TableHead className="text-right">거래횟수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => {
              const currentPrice = row.Code ? priceMap[row.Code] : undefined
              const evalAmount = row.Holdings > 0
                ? row.Holdings * (currentPrice ?? row.AvgPrice)
                : null
              const evalPnL = evalAmount != null
                ? evalAmount - row.Holdings * row.AvgPrice
                : null
              const isPriceLoading = row.Holdings > 0 && row.Code && currentPrice === undefined

              return (
                <TableRow key={row.Ticker} data-testid={`stock-row-${row.Ticker}`}>
                  <TableCell className="font-medium">
                    {row.Code
                      ? <Link href={`/stock/${row.Code}`} className="hover:underline">{row.Ticker}</Link>
                      : row.Ticker}
                  </TableCell>
                  <TableCell className="text-right">{row.Holdings.toLocaleString('ko-KR')}</TableCell>
                  <TableCell className="text-right">{row.AvgPrice.toLocaleString('ko-KR')}원</TableCell>
                  <TableCell className="text-right">
                    <ChangeBadge value={Math.round(row.RealizedPnL)} suffix="원" decimals={0} />
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {evalAmount != null
                      ? <span className={isPriceLoading ? 'text-muted-foreground' : ''}>
                          {Math.round(evalAmount).toLocaleString('ko-KR')}원
                          {isPriceLoading && <span className="text-xs ml-1">(추정)</span>}
                        </span>
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {evalPnL != null
                      ? <ChangeBadge value={Math.round(evalPnL)} suffix="원" decimals={0} />
                      : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.TradeCount > 0 ? `${(row.WinCount / row.TradeCount * 100).toFixed(0)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">{row.TradeCount}회</TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {showAll ? '거래 데이터가 없습니다.' : '보유 중인 종목이 없습니다.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
