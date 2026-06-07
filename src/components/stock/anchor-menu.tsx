'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'sec-price', label: '주가 정보' },
  { id: 'sec-valuation', label: '밸류에이션' },
  { id: 'sec-financial', label: '재무 현황' },
  { id: 'sec-radar', label: '재무 레이더' },
  { id: 'sec-estimate', label: '추정 실적' },
  { id: 'sec-investor', label: '수급 추이' },
  { id: 'sec-opinion', label: '애널리스트' },
  { id: 'sec-dart', label: 'DART 공시' },
  { id: 'sec-portfolio', label: '보유 현황' },
  { id: 'sec-technical', label: '기술적 지표' },
  { id: 'sec-ai', label: 'AI 분석' },
  { id: 'sec-journal', label: '매매 일지' },
  { id: 'sec-refresh', label: '데이터 갱신' },
]

export function AnchorMenu() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-20% 0px -70% 0px' }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    <nav className="hidden xl:block sticky top-6 w-48 shrink-0">
      <div className="space-y-1">
        {SECTIONS.map(({ id, label }) => (
          <a key={id} href={`#${id}`}
            className={cn('block px-3 py-1.5 text-sm rounded transition-colors', active === id ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}
