'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { Valuation } from '@/types/kis'

interface Props { code: string }

export function EstimateTable({ code }: Props) {
  const { data, isLoading } = useQuery<{ valuation: Valuation }>({
    queryKey: ['fundamental', code],
    queryFn: async () => { const r = await fetch(`/api/fundamental?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code, staleTime: 30 * 60 * 1000,
  })

  if (isLoading) return <Card id="sec-estimate"><CardContent className="h-32 pt-6"><Skeleton className="h-full" /></CardContent></Card>
  const v = data?.valuation
  const hasEstimate = v?.estimatedRevenue || v?.estimatedOperatingProfit || v?.estimatedNetProfit

  return (
    <Card id="sec-estimate">
      <CardHeader><CardTitle className="text-sm">추정 실적</CardTitle></CardHeader>
      <CardContent>
        {!hasEstimate ? <p className="text-sm text-muted-foreground">추정 데이터 없음</p> : (
          <Table><TableBody>
            {[['추정 매출', v?.estimatedRevenue], ['추정 영업이익', v?.estimatedOperatingProfit], ['추정 순이익', v?.estimatedNetProfit]].map(([k, val]) => (
              <TableRow key={k as string}><TableCell className="text-muted-foreground">{k}</TableCell><TableCell className="text-right font-medium">{val ? `${((val as number) / 1e8).toFixed(0)}억원` : '-'}</TableCell></TableRow>
            ))}
          </TableBody></Table>
        )}
      </CardContent>
    </Card>
  )
}
