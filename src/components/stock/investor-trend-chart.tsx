'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { TradingTrend } from '@/types/kis'

interface Props { code: string }

export function InvestorTrendChart({ code }: Props) {
  const { data, isLoading } = useQuery<TradingTrend[]>({
    queryKey: ['kis', 'trading-trend', code],
    queryFn: async () => { const r = await fetch(`/api/kis/trading-trend?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code, staleTime: 30 * 60 * 1000,
  })

  if (isLoading) return <Card id="sec-investor"><CardContent className="h-64 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  const chartData = (data ?? []).slice(0, 20).reverse()

  return (
    <Card id="sec-investor">
      <CardHeader><CardTitle className="text-sm">수급 추이</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="individual" name="개인" stroke="hsl(0, 72%, 51%)" dot={false} />
            <Line type="monotone" dataKey="foreign" name="외국인" stroke="hsl(220, 90%, 45%)" dot={false} />
            <Line type="monotone" dataKey="institution" name="기관" stroke="hsl(280, 60%, 50%)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
