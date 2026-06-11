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
    const rows = await readSheet(`${env.GOOGLE_SHEET_NAME}!A:J`)
    const data: SheetTransactionRow[] = rows
      .slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        Date:     r[0] ?? '',
        Ticker:   r[1] ?? '',
        Type:     (r[2] === '매수' || r[2] === '매도') ? r[2] : '매수',
        Quantity: Number(r[3]) || 0,
        Price:    Number(r[4]) || 0,
        Fee:      Number(r[5]) || 0,
        Tax:      Number(r[6]) || 0,
        Journal:  r[7] ?? '',
        Tags:     r[8] ?? '',
        Amount:   Number(r[9]) || 0,
      }))
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
