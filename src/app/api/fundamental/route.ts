import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { kisRequest } from '@/lib/kis'
import type { Valuation, FinancialSummary } from '@/types/kis'
import { z } from 'zod'

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '종목코드는 6자리 숫자여야 합니다'),
})

// ---------------------------------------------------------------------------
// GET /api/fundamental?code=005930
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  const { searchParams } = new URL(request.url)
  const parsed = codeSchema.safeParse({ code: searchParams.get('code') })
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code } = parsed.data

  try {
    // 1. 통합 캐시 확인 (TTL 30분)
    const cacheKey = `${code}_fundamental`
    const cached = await getCached<{ valuation: Valuation; financial: FinancialSummary }>(
      cacheKey,
      1800,
    )
    if (cached) return ok(cached, cached.cachedAt)

    // KIS output이 배열로 올 경우 첫 번째 원소 추출 (단건 객체도 지원)
    const toRecord = (raw: unknown): Record<string, string> => {
      const obj = Array.isArray(raw) ? (raw[0] ?? {}) : (raw ?? {})
      return obj as Record<string, string>
    }

    // 2. KIS valuation + financial 순차 요청 (병렬 시 Rate Limit 발생)
    const valuationRaw = toRecord(await kisRequest<unknown>(
      '/uapi/domestic-stock/v1/finance/financial-ratio',
      { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code, fid_period_div_code: 'A' },
      'FHKST66430200',
    ))
    const financialRaw = toRecord(await kisRequest<unknown>(
      '/uapi/domestic-stock/v1/finance/balance-sheet',
      { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code, fid_period_div_code: 'A' },
      'FHKST66430300',
    ))

    // 3. Valuation 변환
    const valuation: Valuation = {
      code,
      per: Number(valuationRaw.per),
      pbr: Number(valuationRaw.pbr),
      eps: Number(valuationRaw.eps),
      bps: Number(valuationRaw.bps),
      roe: Number(valuationRaw.roe),
      roa: Number(valuationRaw.roa),
      debtRatio: Number(valuationRaw.lblt_rate),
      estimatedRevenue: valuationRaw.est_sale_amnt
        ? Number(valuationRaw.est_sale_amnt)
        : undefined,
      estimatedOperatingProfit: valuationRaw.est_oper_prfi
        ? Number(valuationRaw.est_oper_prfi)
        : undefined,
      estimatedNetProfit: valuationRaw.est_thtr_ntis
        ? Number(valuationRaw.est_thtr_ntis)
        : undefined,
    }

    // 4. FinancialSummary 변환
    const financial: FinancialSummary = {
      code,
      totalAssets: Number(financialRaw.total_aset),
      totalLiabilities: Number(financialRaw.total_lblt),
      totalEquity: Number(financialRaw.total_cptl),
      revenue: Number(financialRaw.sale_account),
      operatingProfit: Number(financialRaw.bsop_prti),
      netProfit: Number(financialRaw.thtr_ntis),
      fiscalYear: financialRaw.stac_yymm ?? '',
    }

    const result = { valuation, financial }

    // 5. 캐시 저장
    await setCached(cacheKey, result)

    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
