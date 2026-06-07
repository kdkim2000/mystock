'use client'
import { useQuery } from '@tanstack/react-query'
import type { StockPrice } from '@/types/kis'

export function useStockPrice(code: string) {
  return useQuery<StockPrice>({
    queryKey: ['kis', 'price', code],
    queryFn: async () => {
      const res = await fetch(`/api/kis/price?code=${code}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as StockPrice
    },
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
  })
}
