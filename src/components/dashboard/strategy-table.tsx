'use client'
import { useMemo } from 'react'
import { useTransactions } from '@/hooks/use-transactions'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function StrategyTable() {
  const { data, isLoading } = useTransactions()

  const strategyStats = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { count: number }>()
    data.forEach(r => {
      r.Tags.split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .forEach(tag => {
          const s = map.get(tag) ?? { count: 0 }
          s.count++
          map.set(tag, s)
        })
    })
    return Array.from(map.entries())
      .map(([tag, s]) => ({ tag, ...s }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  if (isLoading) return <Skeleton className="h-32" />

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>전략 태그</TableHead>
            <TableHead className="text-right">거래횟수</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategyStats.map(s => (
            <TableRow key={s.tag}>
              <TableCell>{s.tag}</TableCell>
              <TableCell className="text-right">{s.count}회</TableCell>
            </TableRow>
          ))}
          {strategyStats.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                태그 없음
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
