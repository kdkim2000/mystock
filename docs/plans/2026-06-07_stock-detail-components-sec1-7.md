# Plan: 종목 상세 컴포넌트 생성 (섹션 1~7)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `src/components/stock/` — 7개 컴포넌트 파일 |
| 목표 | `/stock/[code]` 페이지의 섹션 1~7 클라이언트 컴포넌트 생성 |

## 계획 내용

### 생성 대상 파일

| 파일 | 섹션 | 설명 |
|:---|:---:|:---|
| `price-card.tsx` | 1 | 현재가·52주 고저·시총 카드 |
| `valuation-table.tsx` | 2 | PER/PBR/EPS/ROE/ROA/부채비율 |
| `financial-table.tsx` | 3 | 재무 현황 (총자산·부채·매출 등) |
| `financial-radar-chart.tsx` | 4 | 5축 레이더 차트 |
| `estimate-table.tsx` | 5 | 추정 실적 테이블 |
| `investor-trend-chart.tsx` | 6 | 수급 추이 라인 차트 |
| `opinion-table.tsx` | 7 | 애널리스트 의견 테이블 |

### 공통 규칙

- `'use client'` 선언
- 한국 증시 색상: 상승=`hsl(var(--color-price-up))`, 하락=`hsl(var(--color-price-down))`
- shadcn/ui: Card, Skeleton, Badge, Table 사용
- tanstack-query `staleTime: 30 * 60 * 1000`

### 탐색 결과

- `src/types/kis.ts`: `StockPrice`, `Valuation`, `FinancialSummary`, `TradingTrend`, `AnalystOpinion` 모두 존재 — 타입 완전 일치
- `src/hooks/use-stock-price.ts`: 섹션 1에서 사용 — `queryKey: ['kis', 'price', code]`
- `src/components/ui/change-badge.tsx`: `ChangeBadge` 컴포넌트 존재
- shadcn/ui 컴포넌트: card, skeleton, badge, table 모두 `src/components/ui/`에 존재
- `src/components/stock/` 디렉토리 없음 → 생성 필요

## 실행 결과

- [x] price-card.tsx 생성 — `useStockPrice` 훅 + `ChangeBadge` 사용
- [x] valuation-table.tsx 생성 — `queryKey: ['fundamental', code]` 공유
- [x] financial-table.tsx 생성 — 같은 queryKey로 캐시 공유
- [x] financial-radar-chart.tsx 생성 — `recharts` RadarChart, `next-themes` 다크모드 대응
- [x] estimate-table.tsx 생성 — estimatedRevenue/OperatingProfit/NetProfit 조건부 표시
- [x] investor-trend-chart.tsx 생성 — `/api/kis/trading-trend` 엔드포인트
- [x] opinion-table.tsx 생성 — `/api/kis/opinion` 엔드포인트

모든 파일: `E:/apps/mystock/src/components/stock/`

## Lessons Learned

- 섹션 2·3·4·5는 `queryKey: ['fundamental', code]`를 공유하여 단일 API 호출로 4개 섹션이 동시에 렌더링됨 (캐시 효율)
- `src/types/kis.ts`의 타입이 설계 명세와 완전히 일치하여 타입 임포트 그대로 사용 가능
- `src/components/stock/` 디렉토리가 없어서 먼저 생성 필요했음
