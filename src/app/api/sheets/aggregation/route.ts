import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { readSheet } from '@/lib/sheets'
import { env } from '@/lib/env'
import type { AggregationRow } from '@/types/sheets'

export async function GET(_request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  if (!env.GOOGLE_SHEET_AGGREGATION) return ok([])

  try {
    const rows = await readSheet(`${env.GOOGLE_SHEET_AGGREGATION}!A:H`)
    const data: AggregationRow[] = rows
      .slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        Ticker: r[0] ?? '',
        Code: r[1] ?? '',
        Holdings: Number(r[2]),
        AvgPrice: Number(r[3]),
        TotalBuy: Number(r[4]),
        RealizedPnL: Number(r[5]),
        TradeCount: Number(r[6]),
        WinCount: Number(r[7]),
      }))
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
