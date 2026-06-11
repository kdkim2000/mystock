'use client'
import { useRefreshAll } from '@/hooks/use-refresh-all'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props { code: string }

export function RefreshSection({ code }: Props) {
  const { mutate, isPending, data } = useRefreshAll(code)
  const { toast } = useToast()

  const handleRefresh = () => {
    mutate(undefined, {
      onSuccess: (result) => toast({
        title: '데이터 갱신 완료',
        description: `${result.refreshedSections.length}개 섹션 갱신 (${(result.elapsedMs / 1000).toFixed(1)}초)`,
      }),
      onError: () => toast({ title: '갱신 실패', variant: 'destructive' }),
    })
  }

  return (
    <Card id="sec-refresh">
      <CardHeader><CardTitle className="text-sm">데이터 갱신</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-4">
        <Button onClick={handleRefresh} disabled={isPending} data-testid="refresh-button">
          <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? '갱신 중...' : '전체 데이터 갱신'}
        </Button>
        {data && <span className="text-sm text-muted-foreground">{data.refreshedSections.length}개 완료 · {(data.elapsedMs / 1000).toFixed(1)}초</span>}
      </CardContent>
    </Card>
  )
}
