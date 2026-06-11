'use client'
import { useTransactions } from '@/hooks/use-transactions'
import { useAggregation } from '@/hooks/use-aggregation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Props { code: string }

export function JournalTable({ code }: Props) {
  const { data: agg } = useAggregation()
  const ticker = agg?.find(r => r.Code === code)?.Ticker
  const { data: transactions, isLoading } = useTransactions()

  if (isLoading) return <Card id="sec-journal"><CardContent className="h-40 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  const filtered = (transactions ?? []).filter(r => r.Ticker === ticker).reverse()

  return (
    <Card id="sec-journal">
      <CardHeader><CardTitle className="text-sm">매매 일지</CardTitle></CardHeader>
      <CardContent>
        <Table><TableHeader><TableRow><TableHead>날짜</TableHead><TableHead>구분</TableHead><TableHead className="text-right">수량</TableHead><TableHead className="text-right">단가</TableHead><TableHead className="hidden sm:table-cell">메모</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm text-muted-foreground">{r.Date}</TableCell>
                <TableCell><Badge variant={r.Type === '매수' ? 'default' : 'secondary'}>{r.Type}</Badge></TableCell>
                <TableCell className="text-right">{r.Quantity.toLocaleString('ko-KR')}</TableCell>
                <TableCell className="text-right">{r.Price.toLocaleString('ko-KR')}원</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{r.Journal}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">거래 내역 없음</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
