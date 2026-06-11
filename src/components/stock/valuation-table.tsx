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
  // null/undefined + suffix 문자열 연산 방지: val != null && !isNaN(val) 체크 후 포맷
  const pct = (val: number | null | undefined, digits = 2) =>
    val != null && !isNaN(val) ? val.toFixed(digits) + '%' : undefined
  const krw = (val: number | null | undefined) =>
    val != null && !isNaN(val) ? val.toLocaleString('ko-KR') + '원' : undefined
  const num = (val: number | null | undefined, digits = 2) =>
    val != null && !isNaN(val) ? val.toFixed(digits) : undefined

  return (
    <Card id="sec-valuation">
      <CardHeader><CardTitle className="text-sm">밸류에이션</CardTitle></CardHeader>
      <CardContent>
        {!v ? (
          <p className="text-sm text-muted-foreground">데이터를 가져올 수 없습니다.</p>
        ) : (
          <Table><TableBody>
            {[
              ['PER', num(v.per)],
              ['PBR', num(v.pbr)],
              ['EPS', krw(v.eps)],
              ['ROE', pct(v.roe)],
              ['ROA', pct(v.roa)],
              ['부채비율', pct(v.debtRatio, 1)],
            ].map(([k, val]) => (
              <TableRow key={k}><TableCell className="text-muted-foreground">{k}</TableCell><TableCell className="text-right font-medium">{val ?? '-'}</TableCell></TableRow>
            ))}
          </TableBody></Table>
        )}
      </CardContent>
    </Card>
  )
}
