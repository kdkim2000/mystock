import { cn } from '@/lib/utils'

interface ChangeBadgeProps {
  value: number      // 등락률 또는 등락금액
  suffix?: string    // '%' 또는 '원'
  showSign?: boolean // 기본 true
  className?: string
}

export function ChangeBadge({
  value,
  suffix = '%',
  showSign = true,
  className,
}: ChangeBadgeProps) {
  const isUp = value > 0
  const isDown = value < 0

  return (
    <span
      className={cn(
        'text-sm font-semibold tabular-nums',
        isUp && 'text-[hsl(var(--color-price-up))]',     // 빨강 (상승)
        isDown && 'text-[hsl(var(--color-price-down))]', // 파랑 (하락)
        !isUp && !isDown && 'text-[hsl(var(--color-price-neutral))]',
        className
      )}
    >
      {showSign && isUp ? '+' : ''}{value.toFixed(2)}{suffix}
    </span>
  )
}
