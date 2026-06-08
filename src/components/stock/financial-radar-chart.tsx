'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import type { Valuation, FinancialSummary } from '@/types/kis'

interface FundamentalData { valuation: Valuation; financial: FinancialSummary }
interface Props { code: string }

function normalize(val: number, min: number, max: number) {
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))
}

export function FinancialRadarChart({ code }: Props) {
  const { resolvedTheme } = useTheme()
  const { data, isLoading } = useQuery<FundamentalData>({
    queryKey: ['fundamental', code],
    queryFn: async () => { const r = await fetch(`/api/fundamental?code=${code}`); if (!r.ok) throw new Error(''); return (await r.json()).data },
    enabled: !!code, staleTime: 30 * 60 * 1000,
  })

  const v = data?.valuation
  const f = data?.financial

  const gridColor = useMemo(
    () => resolvedTheme === 'dark' ? '#334155' : '#e2e8f0',
    [resolvedTheme],
  )

  const radarData = useMemo(() => [
    { subject: '수익성', value: v ? normalize(v.roe, 0, 30) : 0 },
    { subject: '안정성', value: v ? normalize(100 - Math.min(v.debtRatio, 200), 0, 100) : 0 },
    { subject: '밸류', value: v ? normalize(1 / Math.max(v.pbr, 0.1), 0, 5) * 20 : 0 },
    { subject: '수익률', value: v ? normalize(v.roe, 0, 30) : 0 },
    { subject: '성장성', value: f && f.revenue > 0 ? normalize((f.operatingProfit / f.revenue) * 100, 0, 30) : 0 },
  ], [v, f])

  if (isLoading) return <Card id="sec-radar"><CardContent className="h-64 pt-6"><Skeleton className="h-full" /></CardContent></Card>

  return (
    <Card id="sec-radar">
      <CardHeader><CardTitle className="text-sm">재무 레이더</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <Radar dataKey="value" stroke="hsl(220, 70%, 50%)" fill="hsl(220, 70%, 50%)" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
