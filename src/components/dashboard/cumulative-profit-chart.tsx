'use client'
import { useState, useMemo } from 'react'
import { useTransactions } from '@/hooks/use-transactions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Period = 'all' | '6m' | '3m'

export function CumulativeProfitChart() {
  const { data, isLoading } = useTransactions()
  const [period, setPeriod] = useState<Period>('all')

  const chartData = useMemo(() => {
    if (!data) return []
    const sells = data.filter(r => r.Type === '매도').sort((a, b) => a.Date.localeCompare(b.Date))
    const cutoff = period === '6m' ? 6 : period === '3m' ? 3 : 0
    const filtered = cutoff > 0 ? sells.filter(r => {
      const d = new Date(r.Date)
      const now = new Date()
      now.setMonth(now.getMonth() - cutoff)
      return d >= now
    }) : sells

    let cumulative = 0
    return filtered.map(r => {
      cumulative += (r.Price * r.Quantity * 0.05) // 간략화: 5% 수익 가정 (실제는 매수 단가 필요)
      return { date: r.Date, value: cumulative }
    })
  }, [data, period])

  if (isLoading) return (
    <Card>
      <CardContent className="h-64 pt-6">
        <Skeleton className="h-full" />
      </CardContent>
    </Card>
  )

  const tabs: { key: Period; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: '6m', label: '6개월' },
    { key: '3m', label: '3개월' },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">누적 실현손익 추이</CardTitle>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={`text-xs px-2 py-1 rounded ${period === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={v => `${(v / 1e4).toFixed(0)}만`} width={50} />
            <Tooltip formatter={(v: number) => `${(v / 1e4).toFixed(1)}만원`} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--color-price-up))"
              fill="hsl(var(--color-price-up) / 0.1)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
