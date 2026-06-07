'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateRSI, calculateMACD } from '@/lib/indicators'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyPrice } from '@/types/kis'

interface Props { code: string }

export function RsiMacdCard({ code }: Props) {
  const { data, isLoading } = useQuery<DailyPrice[]>({
    queryKey: ['kis', 'daily-price', code],
    queryFn: async () => { const r = await fetch(`/api/kis/daily-price?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code, staleTime: 30 * 60 * 1000,
  })

  const { rsiValues, macdData, latestRsi } = useMemo(() => {
    if (!data || data.length < 26) return { rsiValues: [], macdData: [], latestRsi: null }
    const closes = data.map(d => d.close)
    const rsi = calculateRSI(closes)
    const macd = calculateMACD(closes)
    const latest = rsi[rsi.length - 1]
    const chartData = data.slice(-30).map((d, i, arr) => {
      const idx = data.length - arr.length + i
      return { date: d.date, rsi: rsi[idx], macd: macd[idx]?.macd, signal: macd[idx]?.signal, histogram: macd[idx]?.histogram }
    })
    return { rsiValues: chartData, macdData: chartData, latestRsi: latest }
  }, [data])

  if (isLoading) return <Card id="sec-technical"><CardContent className="h-48 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  const rsiColor = latestRsi !== null
    ? latestRsi >= 70 ? 'hsl(0, 72%, 51%)' : latestRsi <= 30 ? 'hsl(220, 90%, 45%)' : 'hsl(240, 5%, 65%)'
    : 'hsl(240, 5%, 65%)'

  return (
    <Card id="sec-technical">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">기술적 지표</CardTitle>
        {latestRsi !== null && (
          <div className="text-sm">
            RSI(14): <span style={{ color: rsiColor }} className="font-bold">{latestRsi.toFixed(1)}</span>
            {latestRsi >= 70 && <span className="ml-2 text-xs text-[hsl(0,72%,51%)]">과매수</span>}
            {latestRsi <= 30 && <span className="ml-2 text-xs text-[hsl(220,90%,45%)]">과매도</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">RSI (14)</div>
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={rsiValues}>
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} width={30} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => v?.toFixed(1)} />
              <Line type="monotone" dataKey="rsi" stroke={rsiColor} dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">MACD (12, 26, 9)</div>
          <ResponsiveContainer width="100%" height={80}>
            <ComposedChart data={macdData}>
              <XAxis dataKey="date" hide />
              <YAxis width={30} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => v?.toFixed(2)} />
              <Bar dataKey="histogram" fill="hsl(240, 5%, 65%)" opacity={0.5} />
              <Line type="monotone" dataKey="macd" stroke="hsl(0, 72%, 51%)" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="signal" stroke="hsl(220, 90%, 45%)" dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
