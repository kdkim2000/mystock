'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { Valuation, FinancialSummary } from '@/types/kis'

interface FundamentalData { valuation: Valuation; financial: FinancialSummary }
interface Props { code: string }

export function ValuationTable({ code }: Props) {
  const { data, isLoading } = useQuery<FundamentalData>({
    queryKey: ['fundamental', code],
    queryFn: async () => { const r = await fetch(`/api/fundamental?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
  })

  if (isLoading) return <Card id="sec-valuation"><CardContent className="h-40 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  const v = data?.valuation
  return (
    <Card id="sec-valuation">
      <CardHeader><CardTitle className="text-sm">밸류에이션</CardTitle></CardHeader>
      <CardContent>
        <Table><TableBody>
          {[['PER', v?.per?.toFixed(2)], ['PBR', v?.pbr?.toFixed(2)], ['EPS', v?.eps?.toLocaleString('ko-KR')+'원'], ['ROE', v?.roe?.toFixed(2)+'%'], ['ROA', v?.roa?.toFixed(2)+'%'], ['부채비율', v?.debtRatio?.toFixed(1)+'%']].map(([k, val]) => (
            <TableRow key={k}><TableCell className="text-muted-foreground">{k}</TableCell><TableCell className="text-right font-medium">{val ?? '-'}</TableCell></TableRow>
          ))}
        </TableBody></Table>
      </CardContent>
    </Card>
  )
}
