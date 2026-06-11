'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface RefreshResult {
  refreshedSections: string[]
  elapsedMs: number
}

export function useRefreshAll(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ticker/${code}/refresh`, { method: 'POST' })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as RefreshResult
    },
    onSuccess: () => {
      // 해당 종목 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['kis', 'price', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'valuation', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'financial', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'daily-price', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'trading-trend', code] })
      queryClient.invalidateQueries({ queryKey: ['kis', 'opinion', code] })
      queryClient.invalidateQueries({ queryKey: ['dart', 'financial', code] })
      queryClient.invalidateQueries({ queryKey: ['ai', 'analysis', code] })
    },
  })
}
