import { cn } from '@/lib/utils'

interface ChangeBadgeProps {
  value: number      // 등락률 또는 등락금액
  suffix?: string    // '%' 또는 '원'
  showSign?: boolean // 기본 true
  decimals?: number  // 소수점 자릿수 (기본 2)
  className?: string
}

export function ChangeBadge({
  value,
  suffix = '%',
  showSign = true,
  decimals = 2,
  className,
}: ChangeBadgeProps) {
  const isUp = value > 0
  const isDown = value < 0
  const formatted = value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span
      className={cn(
        'text-sm font-semibold tabular-nums',
        isUp && 'text-[hsl(var(--color-price-up))]',
        isDown && 'text-[hsl(var(--color-price-down))]',
        !isUp && !isDown && 'text-[hsl(var(--color-price-neutral))]',
        className
      )}
    >
      {showSign && isUp ? '+' : ''}{formatted}{suffix}
    </span>
  )
}
