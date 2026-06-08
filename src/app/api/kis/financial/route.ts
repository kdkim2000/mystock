import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { kisRequest } from '@/lib/kis'
import type { FinancialSummary } from '@/types/kis'
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
    const cached = await getCached<FinancialSummary>(`${code}_financial`, 1800)
    if (cached) return ok(cached, cached.cachedAt)

    const rawResult = await kisRequest<unknown>(
      '/uapi/domestic-stock/v1/finance/balance-sheet',
      { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code, fid_period_div_code: 'A' },
      'FHKST66430300',
    )
    // output이 배열로 올 경우 첫 번째 원소 추출
    const raw = (Array.isArray(rawResult) ? (rawResult[0] ?? {}) : (rawResult ?? {})) as Record<string, string>

    const data: FinancialSummary = {
      code,
      totalAssets: Number(raw.total_aset),
      totalLiabilities: Number(raw.total_lblt),
      totalEquity: Number(raw.total_cptl),
      revenue: Number(raw.sale_account),
      operatingProfit: Number(raw.bsop_prti),
      netProfit: Number(raw.thtr_ntis),
      fiscalYear: raw.stac_yymm ?? '',
    }

    await setCached(`${code}_financial`, data)
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
