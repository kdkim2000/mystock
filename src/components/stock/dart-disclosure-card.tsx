'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink } from 'lucide-react'

interface DartData {
  financial: { code: string; years: { year: string; revenue: number; operatingProfit: number; netProfit: number; cashFlow: number }[] }
  disclosures: { rcpNo: string; rceptDt: string; reportNm: string; url: string }[]
}
interface Props { code: string; ticker: string }

export function DartDisclosureCard({ code, ticker }: Props) {
  const { data, isLoading } = useQuery<DartData>({
    queryKey: ['dart', 'financial', code],
    queryFn: async () => { const r = await fetch(`/api/dart/financial?code=${code}&ticker=${encodeURIComponent(ticker)}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code && !!ticker, staleTime: 60 * 60 * 1000,
  })

  if (isLoading) return <Card id="sec-dart"><CardContent className="h-48 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  return (
    <Card id="sec-dart">
      <CardHeader><CardTitle className="text-sm">DART 공시</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(data?.disclosures ?? []).slice(0, 10).map(d => (
            <a key={d.rcpNo} href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rcpNo}`} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded hover:bg-muted text-sm">
              <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <div className="font-medium line-clamp-1">{d.reportNm}</div>
                <div className="text-xs text-muted-foreground">{d.rceptDt}</div>
              </div>
            </a>
          ))}
          {(data?.disclosures ?? []).length === 0 && <p className="text-sm text-muted-foreground">공시 없음</p>}
        </div>
      </CardContent>
    </Card>
  )
}
