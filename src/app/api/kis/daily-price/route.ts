import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { kisRequest } from '@/lib/kis'
import type { DailyPrice } from '@/types/kis'
import { z } from 'zod'

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '종목코드는 6자리 숫자여야 합니다'),
})

function getTodayDate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

function getStartDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  const { searchParams } = new URL(request.url)
  const parsed = codeSchema.safeParse({ code: searchParams.get('code') })
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code } = parsed.data

  try {
    const cached = await getCached<DailyPrice[]>(`${code}_daily_price`, 1800)
    if (cached) return ok(cached, cached.cachedAt)

    const raw = await kisRequest<Record<string, string>[]>(
      '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
      {
        fid_cond_mrkt_div_code: 'J',
        fid_input_iscd: code,
        fid_input_date_1: getStartDate(),
        fid_input_date_2: getTodayDate(),
        fid_period_div_code: 'D',
        fid_org_adj_prc: '1',
      },
      'FHKST03010100',
    )

    const data: DailyPrice[] = (raw as Record<string, string>[]).map((item) => ({
      date: item.stck_bsop_date,
      open: Number(item.stck_oprc),
      high: Number(item.stck_hgpr),
      low: Number(item.stck_lwpr),
      close: Number(item.stck_clpr),
      volume: Number(item.acml_vol),
    }))

    await setCached(`${code}_daily_price`, data)
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
