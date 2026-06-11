'use client'
import { useQuery } from '@tanstack/react-query'
import type { AggregationRow } from '@/types/sheets'

export function useAggregation() {
  return useQuery<AggregationRow[]>({
    queryKey: ['sheets', 'aggregation'],
    queryFn: async () => {
      const res = await fetch('/api/sheets/aggregation')
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as AggregationRow[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
