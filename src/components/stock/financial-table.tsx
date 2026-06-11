'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { Valuation, FinancialSummary } from '@/types/kis'

interface FundamentalData { valuation: Valuation; financial: FinancialSummary }
interface Props { code: string }

export function FinancialTable({ code }: Props) {
  const { data, isLoading } = useQuery<FundamentalData>({
    queryKey: ['fundamental', code],
    queryFn: async () => { const r = await fetch(`/api/fundamental?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
  })

  if (isLoading) return <Card id="sec-financial"><CardContent className="h-40 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  const f = data?.financial
  return (
    <Card id="sec-financial">
      <CardHeader><CardTitle className="text-sm">재무 현황 {f?.fiscalYear ? `(${f.fiscalYear})` : ''}</CardTitle></CardHeader>
      <CardContent>
        <Table><TableBody>
          {[['총자산', f?.totalAssets], ['총부채', f?.totalLiabilities], ['자기자본', f?.totalEquity], ['매출액', f?.revenue], ['영업이익', f?.operatingProfit], ['순이익', f?.netProfit]].map(([k, val]) => (
            <TableRow key={k as string}><TableCell className="text-muted-foreground">{k}</TableCell><TableCell className="text-right font-medium">{val ? `${((val as number) / 1e8).toFixed(0)}억원` : '-'}</TableCell></TableRow>
          ))}
        </TableBody></Table>
      </CardContent>
    </Card>
  )
}
