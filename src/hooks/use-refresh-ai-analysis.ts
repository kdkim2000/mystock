'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AiAnalysisResult } from '@/types/ai'

export function useRefreshAiAnalysis(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as AiAnalysisResult
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ai', 'analysis', code], data)
    },
  })
}
