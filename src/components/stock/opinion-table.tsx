'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { AnalystOpinion } from '@/types/kis'

interface Props { code: string }

export function OpinionTable({ code }: Props) {
  const { data, isLoading } = useQuery<AnalystOpinion[]>({
    queryKey: ['kis', 'opinion', code],
    queryFn: async () => { const r = await fetch(`/api/kis/opinion?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code, staleTime: 30 * 60 * 1000,
  })

  if (isLoading) return <Card id="sec-opinion"><CardContent className="h-40 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  return (
    <Card id="sec-opinion">
      <CardHeader><CardTitle className="text-sm">애널리스트 의견</CardTitle></CardHeader>
      <CardContent>
        <Table><TableHeader><TableRow><TableHead>증권사</TableHead><TableHead>의견</TableHead><TableHead className="text-right">목표가</TableHead><TableHead>날짜</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).slice(0, 10).map((op, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-sm">{op.firm}</TableCell>
                <TableCell><Badge variant="outline">{op.opinion}</Badge></TableCell>
                <TableCell className="text-right">{op.targetPrice.toLocaleString('ko-KR')}원</TableCell>
                <TableCell className="text-sm text-muted-foreground">{op.date}</TableCell>
              </TableRow>
            ))}
            {(data ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">의견 없음</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
