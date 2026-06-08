import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { authOptions } from '@/lib/auth'
import { readSheet } from '@/lib/sheets'
import { env } from '@/lib/env'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { computeAggregation } from '@/lib/compute-aggregation'
import type { SheetTransactionRow } from '@/types/sheets'

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

  // SSR prefetch: 종목별집계 (매매내역에서 직접 계산)
  await queryClient.prefetchQuery({
    queryKey: ['sheets', 'aggregation'],
    queryFn: computeAggregation,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
