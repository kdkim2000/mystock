'use client'
import { useAiAnalysis } from '@/hooks/use-ai-analysis'
import { useRefreshAiAnalysis } from '@/hooks/use-refresh-ai-analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Bot } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props { code: string }

export function AiAnalysisCard({ code }: Props) {
  const { data, isLoading } = useAiAnalysis(code)
  const { mutate, isPending } = useRefreshAiAnalysis(code)
  const { toast } = useToast()

  const handleRefresh = () => {
    mutate(undefined, {
      onSuccess: () => toast({ title: 'AI 분석 완료', description: '새로운 분석이 생성되었습니다.' }),
      onError: () => toast({ title: '오류', description: 'AI 분석 생성에 실패했습니다.', variant: 'destructive' }),
    })
  }

  return (
    <Card id="sec-ai">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4" />AI 분석</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isPending}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
          {data ? '갱신' : '생성'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading || isPending ? <Skeleton className="h-48" /> : data ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">{data.content}</div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">AI 분석을 생성하려면 위 버튼을 클릭하세요.</p>
          </div>
        )}
        {data && <div className="mt-3 text-xs text-muted-foreground">생성: {new Date(data.generatedAt).toLocaleString('ko-KR')} · {data.model}</div>}
      </CardContent>
    </Card>
  )
}
