import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { kisRequest } from '@/lib/kis'
import type { StockPrice } from '@/types/kis'
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
    const cached = await getCached<StockPrice>(`${code}_price`, 1800)
    if (cached) return ok(cached, cached.cachedAt)

    const raw = await kisRequest<Record<string, string>>(
      '/uapi/domestic-stock/v1/quotations/inquire-price',
      { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
      'FHKST01010100',
    )

    const data: StockPrice = {
      code,
      name: raw.hts_kor_isnm,
      currentPrice: Number(raw.stck_prpr),
      changeRate: Number(raw.prdy_ctrt),
      changeAmount: Number(raw.prdy_vrss),
      high52w: Number(raw.w52_hgpr),
      low52w: Number(raw.w52_lwpr),
      marketCap: Number(raw.hts_avls),
      volume: Number(raw.acml_vol),
      tradingValue: Number(raw.acml_tr_pbmn),
    }

    await setCached(`${code}_price`, data)
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
