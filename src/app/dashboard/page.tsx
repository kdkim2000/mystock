import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { authOptions } from '@/lib/auth'
import { readSheet } from '@/lib/sheets'
import { env } from '@/lib/env'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import type { SheetTransactionRow, AggregationRow } from '@/types/sheets'

export const metadata = { title: '대시보드 | my-stock' }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const queryClient = new QueryClient()

  // SSR prefetch: 거래내역
  await queryClient.prefetchQuery({
    queryKey: ['sheets', 'transactions'],
    queryFn: async () => {
      const rows = await readSheet(`${env.GOOGLE_SHEET_NAME}!A:J`)
      return rows.slice(1)
        .filter(r => r[0] && r[1])
        .map(r => ({
          Date:     r[0],
          Ticker:   r[1],
          Type:     (r[2] === '매수' || r[2] === '매도') ? r[2] : '매수' as '매수' | '매도',
          Quantity: Number(r[3]) || 0,
          Price:    Number(r[4]) || 0,
          Fee:      Number(r[5]) || 0,
          Tax:      Number(r[6]) || 0,
          Journal:  r[7] ?? '',
          Tags:     r[8] ?? '',
          Amount:   Number(r[9]) || 0,
        } satisfies SheetTransactionRow))
    },
  })

  // SSR prefetch: 종목별집계 (optional)
  if (env.GOOGLE_SHEET_AGGREGATION) {
    await queryClient.prefetchQuery({
      queryKey: ['sheets', 'aggregation'],
      queryFn: async () => {
        const rows = await readSheet(`${env.GOOGLE_SHEET_AGGREGATION}!A:H`)
        return rows.slice(1)
          .filter(r => r[0] && r[1])
          .map(r => ({
            Ticker: r[0],
            Code: r[1],
            Holdings: Number(r[2]),
            AvgPrice: Number(r[3]),
            TotalBuy: Number(r[4]),
            RealizedPnL: Number(r[5]),
            TradeCount: Number(r[6]),
            WinCount: Number(r[7]),
          } satisfies AggregationRow))
      },
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
