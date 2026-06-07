'use client'
import { useQuery } from '@tanstack/react-query'
import type { SheetTransactionRow } from '@/types/sheets'

export function useTransactions() {
  return useQuery<SheetTransactionRow[]>({
    queryKey: ['sheets', 'transactions'],
    queryFn: async () => {
      const res = await fetch('/api/sheets/transactions')
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as SheetTransactionRow[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
