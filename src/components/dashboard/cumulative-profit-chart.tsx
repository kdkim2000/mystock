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

    const sorted = [...data].sort((a, b) => a.Date.localeCompare(b.Date))

    // 종목별 이동평균 단가 추적
    const posMap: Record<string, { qty: number; cost: number }> = {}
    let cumulative = 0
    const points: { date: string; value: number }[] = []

    for (const r of sorted) {
      const pos = posMap[r.Ticker] ?? { qty: 0, cost: 0 }
      if (r.Type === '매수') {
        pos.cost += r.Price * r.Quantity + r.Fee
        pos.qty  += r.Quantity
      } else {
        const avgCost = pos.qty > 0 ? pos.cost / pos.qty : 0
        const realized = r.Price * r.Quantity - r.Fee - r.Tax - avgCost * r.Quantity
        cumulative += realized
        pos.cost = Math.max(0, pos.cost - avgCost * r.Quantity)
        pos.qty  = Math.max(0, pos.qty - r.Quantity)
      }
      posMap[r.Ticker] = pos
      points.push({ date: r.Date, value: Math.round(cumulative) })
    }

    // 날짜별 마지막 누적값만 유지
    const byDate = new Map<string, number>()
    for (const p of points) byDate.set(p.date, p.value)
    const all = Array.from(byDate, ([date, value]) => ({ date, value }))

    const cutoff = period === '6m' ? 6 : period === '3m' ? 3 : 0
    if (cutoff === 0) return all
    const since = new Date()
    since.setMonth(since.getMonth() - cutoff)
    return all.filter(p => new Date(p.date) >= since)
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
            <Tooltip formatter={(v) => v != null ? `${(Number(v) / 1e4).toFixed(1)}만원` : ''} />
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
