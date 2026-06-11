'use client'
import { useQuery } from '@tanstack/react-query'
import type { AiAnalysisResult } from '@/types/ai'

export function useAiAnalysis(code: string) {
  return useQuery<AiAnalysisResult | null>({
    queryKey: ['ai', 'analysis', code],
    queryFn: async () => {
      const res = await fetch(`/api/ai/analysis?code=${code}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return (json.data as AiAnalysisResult | null)
    },
    enabled: !!code,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })
}
