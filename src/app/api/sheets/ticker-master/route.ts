import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { readSheet } from '@/lib/sheets'
import { env } from '@/lib/env'
import type { TickerMasterRow } from '@/types/sheets'

export async function GET(_request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  if (!env.GOOGLE_SHEET_TICKER_MASTER) return ok([])

  try {
    const rows = await readSheet(`${env.GOOGLE_SHEET_TICKER_MASTER}!A:B`)
    const data: TickerMasterRow[] = rows
      .slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        Ticker: r[0] ?? '',
        Code: r[1] ?? '',
      }))
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
