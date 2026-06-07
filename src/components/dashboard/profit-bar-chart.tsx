'use client'
import { useAggregation } from '@/hooks/use-aggregation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function ProfitBarChart() {
  const { data, isLoading } = useAggregation()

  if (isLoading) return (
    <Card>
      <CardContent className="h-64 pt-6">
        <Skeleton className="h-full" />
      </CardContent>
    </Card>
  )

  const chartData = (data ?? [])
    .filter(r => r.RealizedPnL !== 0)
    .map(r => ({ name: r.Ticker, value: r.RealizedPnL }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">실현손익</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${(v / 1e4).toFixed(0)}만`} width={50} />
            <Tooltip formatter={(v: number) => `${(v / 1e4).toFixed(1)}만원`} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? 'hsl(var(--color-price-up))' : 'hsl(var(--color-price-down))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
