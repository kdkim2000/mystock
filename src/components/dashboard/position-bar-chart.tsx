'use client'
import { useAggregation } from '@/hooks/use-aggregation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function PositionBarChart() {
  const { data, isLoading } = useAggregation()

  if (isLoading) return (
    <Card>
      <CardContent className="h-64 pt-6">
        <Skeleton className="h-full" />
      </CardContent>
    </Card>
  )

  const chartData = (data ?? [])
    .filter(r => r.Holdings > 0)
    .map(r => ({ name: r.Ticker, value: r.Holdings * r.AvgPrice }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">보유 포지션</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${(v / 1e4).toFixed(0)}만원`} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="hsl(220, 70%, 50%)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
