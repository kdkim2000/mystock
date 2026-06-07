import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorCardProps {
  message?: string
  retry?: () => void
}

export function ErrorCard({
  message = '데이터를 불러올 수 없습니다.',
  retry,
}: ErrorCardProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex items-center gap-3 pt-6">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-destructive">{message}</p>
          {retry && (
            <button
              onClick={retry}
              className="text-xs underline text-muted-foreground mt-1"
            >
              다시 시도
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
