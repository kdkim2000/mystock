import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { getCorpCode, dartRequest } from '@/lib/dart'
import type { DartFinancial, DartDisclosure } from '@/types/dart'
import { z } from 'zod'

// query: ?code=005930&ticker=삼성전자
// code: 6자리 종목코드, ticker: 한국어 종목명
const querySchema = z.object({
  code: z.string().regex(/^\d{6}$/, '종목코드는 6자리 숫자여야 합니다'),
  ticker: z.string().min(1, '종목명은 필수입니다'),
})

// ---------------------------------------------------------------------------
// 날짜 유틸
// ---------------------------------------------------------------------------

function getToday(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

function getOneYearAgo(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function getCurrentYear(): string {
  return String(new Date().getFullYear())
}

// ---------------------------------------------------------------------------
// DART 재무제표 list 항목 타입
// ---------------------------------------------------------------------------

interface DartAccountItem {
  account_nm: string
  thstrm_amount: string
  frmtrm_amount?: string
  bfefrmtrm_amount?: string
  thstrm_add_amount?: string
}

interface DartFinancialResponse {
  status: string
  message: string
  list?: DartAccountItem[]
}

interface DartDisclosureItem {
  rcp_no: string
  rcept_dt: string
  report_nm: string
  corp_code: string
}

interface DartDisclosureResponse {
  status: string
  message: string
  list?: DartDisclosureItem[]
}

// ---------------------------------------------------------------------------
// 재무제표 list 파싱 헬퍼
// ---------------------------------------------------------------------------

function parseAmount(val: string | undefined): number {
  if (!val) return 0
  return Number(val.replace(/,/g, '')) || 0
}

function buildFinancialYears(
  list: DartAccountItem[],
  code: string,
  currentYear: string,
): DartFinancial {
  // 당기(thstrm) / 전기(frmtrm) 2개 연도 구성
  const find = (nm: string): DartAccountItem | undefined =>
    list.find((item) => item.account_nm === nm)

  const revenue = find('매출액') ?? find('수익(매출액)')
  const operatingProfit = find('영업이익')
  const netProfit = find('당기순이익')
  const cashFlow = find('영업활동으로 인한 현금흐름') ?? find('영업활동현금흐름')

  const currentYearNum = Number(currentYear)

  const years = [
    {
      year: String(currentYearNum - 1),
      revenue: parseAmount(revenue?.frmtrm_amount),
      operatingProfit: parseAmount(operatingProfit?.frmtrm_amount),
      netProfit: parseAmount(netProfit?.frmtrm_amount),
      cashFlow: parseAmount(cashFlow?.frmtrm_amount),
    },
    {
      year: currentYear,
      revenue: parseAmount(revenue?.thstrm_amount),
      operatingProfit: parseAmount(operatingProfit?.thstrm_amount),
      netProfit: parseAmount(netProfit?.thstrm_amount),
      cashFlow: parseAmount(cashFlow?.thstrm_amount),
    },
  ]

  return { code, years }
}

// ---------------------------------------------------------------------------
// GET /api/dart/financial?code=005930&ticker=삼성전자
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    code: searchParams.get('code'),
    ticker: searchParams.get('ticker'),
  })
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code, ticker } = parsed.data

  try {
    // 1. 캐시 확인 (TTL 1시간)
    const cacheKey = `${code}_dart_financial`
    const cached = await getCached<{ financial: DartFinancial; disclosures: DartDisclosure[] }>(
      cacheKey,
      3600,
    )
    if (cached) return ok(cached, cached.cachedAt)

    // 2. DART 기업코드 조회
    const corpCode = await getCorpCode(ticker)
    const currentYear = getCurrentYear()
    const today = getToday()
    const oneYearAgo = getOneYearAgo()

    // 3. 재무제표 + 공시 병렬 요청
    // 사업보고서는 전년도(currentYear-1)가 가장 최신 확정치 → 당해연도 빈 결과 시 전년도 재시도
    const fetchFinancial = async () => {
      const years = [currentYear, String(Number(currentYear) - 1)]
      for (const year of years) {
        const data = await dartRequest<DartFinancialResponse>('fnlttSinglAcnt.json', {
          corp_code: corpCode,
          bsns_year: year,
          reprt_code: '11011', // 사업보고서
          fs_div: 'CFS',       // 연결재무제표
        })
        if (data.list?.length) return { data, year }
      }
      return { data: { status: '020', message: 'no data', list: [] as DartAccountItem[] }, year: currentYear }
    }

    const [financialResult, disclosureData] = await Promise.all([
      fetchFinancial(),
      dartRequest<DartDisclosureResponse>('list.json', {
        corp_code: corpCode,
        bgn_de: oneYearAgo,
        end_de: today,
        pblntf_ty: 'A', // 정기공시
        page_count: '10',
      }),
    ])

    // 4. DartFinancial 변환
    const financial = buildFinancialYears(financialResult.data.list ?? [], code, financialResult.year)

    // 5. DartDisclosure[] 변환
    const disclosures: DartDisclosure[] = (disclosureData.list ?? []).map((item) => ({
      rcpNo: item.rcp_no,
      rceptDt: item.rcept_dt,
      reportNm: item.report_nm,
      url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcp_no}`,
    }))

    const result = { financial, disclosures }

    // 6. 캐시 저장
    await setCached(cacheKey, result)

    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
