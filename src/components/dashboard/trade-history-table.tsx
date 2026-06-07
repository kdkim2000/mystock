'use client'
import { useState } from 'react'
import { useTransactions } from '@/hooks/use-transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 20

export function TradeHistoryTable() {
  const { data, isLoading } = useTransactions()
  const [page, setPage] = useState(1)

  if (isLoading) return <Skeleton className="h-64" />

  const sorted = [...(data ?? [])].reverse()
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="rounded-md border" data-testid="trade-history-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead>종목</TableHead>
              <TableHead>구분</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">단가</TableHead>
              <TableHead className="hidden sm:table-cell">메모</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm text-muted-foreground">{r.Date}</TableCell>
                <TableCell className="font-medium">{r.Ticker}</TableCell>
                <TableCell>
                  <Badge variant={r.Type === '매수' ? 'default' : 'secondary'}>
                    {r.Type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{r.Quantity.toLocaleString('ko-KR')}</TableCell>
                <TableCell className="text-right">{r.Price.toLocaleString('ko-KR')}원</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                  {r.Journal}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            data-testid="pagination-prev"
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            data-testid="pagination-next"
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
