import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { readSheet } from '@/lib/sheets'
import { env } from '@/lib/env'
import type { SheetTransactionRow } from '@/types/sheets'

export async function GET(_request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  try {
    const rows = await readSheet(`${env.GOOGLE_SHEET_NAME}!A:G`)
    const data: SheetTransactionRow[] = rows
      .slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        Date: r[0] ?? '',
        Ticker: r[1] ?? '',
        Type: r[2] as '매수' | '매도',
        Quantity: Number(r[3]),
        Price: Number(r[4]),
        Journal: r[5] ?? '',
        Tags: r[6] ?? '',
      }))
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
