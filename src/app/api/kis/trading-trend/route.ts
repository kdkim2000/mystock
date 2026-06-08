import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { kisRequest } from '@/lib/kis'
import type { TradingTrend } from '@/types/kis'
import { z } from 'zod'

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '종목코드는 6자리 숫자여야 합니다'),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  const { searchParams } = new URL(request.url)
  const parsed = codeSchema.safeParse({ code: searchParams.get('code') })
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code } = parsed.data

  try {
    const cached = await getCached<TradingTrend[]>(`${code}_trading_trend`, 1800)
    if (cached) return ok(cached, cached.cachedAt)

    const raw = await kisRequest<Record<string, string>[]>(
      '/uapi/domestic-stock/v1/quotations/inquire-investor',
      { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
      'FHKST01010900',
      'output2',  // 일별 수급 배열은 output2에 담김
    )

    const data: TradingTrend[] = (raw as Record<string, string>[]).map((item) => ({
      date: item.stck_bsop_date,
      individual: Number(item.prsn_ntby_qty),
      foreign: Number(item.frgn_ntby_qty),
      institution: Number(item.orgn_ntby_qty),
    }))

    await setCached(`${code}_trading_trend`, data)
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
