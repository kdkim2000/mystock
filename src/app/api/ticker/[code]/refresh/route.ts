export const maxDuration = 60 // Vercel Pro 필수

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { clearCacheByCode, setCached } from '@/lib/cache'
import { kisRequest } from '@/lib/kis'
import { getCorpCode, dartRequest } from '@/lib/dart'
import type { StockPrice, Valuation, FinancialSummary, DailyPrice, TradingTrend, AnalystOpinion } from '@/types/kis'
import type { DartFinancial, DartDisclosure } from '@/types/dart'

// ---------------------------------------------------------------------------
// 날짜 유틸 (DART 공시 조회용)
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
// DART 재무제표 파싱 헬퍼
// ---------------------------------------------------------------------------

interface DartAccountItem {
  account_nm: string
  thstrm_amount: string
  frmtrm_amount?: string
}

function parseAmount(val: string | undefined): number {
  if (!val) return 0
  return Number(val.replace(/,/g, '')) || 0
}

function buildDartFinancial(list: DartAccountItem[], code: string): DartFinancial {
  const find = (nm: string) => list.find((item) => item.account_nm === nm)
  const currentYear = getCurrentYear()
  const currentYearNum = Number(currentYear)

  const revenue = find('매출액') ?? find('수익(매출액)')
  const operatingProfit = find('영업이익')
  const netProfit = find('당기순이익')
  const cashFlow = find('영업활동으로 인한 현금흐름') ?? find('영업활동현금흐름')

  return {
    code,
    years: [
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
    ],
  }
}

// ---------------------------------------------------------------------------
// POST /api/ticker/[code]/refresh
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  const { code } = await params
  if (!/^\d{6}$/.test(code)) return err('종목코드는 6자리 숫자여야 합니다', 'VALIDATION_ERROR', 400)

  try {
    // 1. 기존 캐시 무효화
    await clearCacheByCode(code)

    const startTime = Date.now()

    // 2. KIS 6개 섹션 + DART 1개 병렬 요청 (allSettled: 일부 실패해도 계속)
    const results = await Promise.allSettled([
      // --- price ---
      (async () => {
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
        return 'price'
      })(),

      // --- valuation ---
      (async () => {
        const rawResult = await kisRequest<unknown>(
          '/uapi/domestic-stock/v1/finance/financial-ratio',
          { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code, fid_period_div_code: 'A' },
          'FHKST66430200',
        )
        const raw = (Array.isArray(rawResult) ? (rawResult[0] ?? {}) : (rawResult ?? {})) as Record<string, string>
        const data: Valuation = {
          code,
          per: Number(raw.per),
          pbr: Number(raw.pbr),
          eps: Number(raw.eps),
          bps: Number(raw.bps),
          roe: Number(raw.roe),
          roa: Number(raw.roa),
          debtRatio: Number(raw.lblt_rate),
          estimatedRevenue: raw.est_sale_amnt ? Number(raw.est_sale_amnt) : undefined,
          estimatedOperatingProfit: raw.est_oper_prfi ? Number(raw.est_oper_prfi) : undefined,
          estimatedNetProfit: raw.est_thtr_ntis ? Number(raw.est_thtr_ntis) : undefined,
        }
        await setCached(`${code}_valuation`, data)
        return 'valuation'
      })(),

      // --- financial (balance-sheet) ---
      (async () => {
        const rawResult = await kisRequest<unknown>(
          '/uapi/domestic-stock/v1/finance/balance-sheet',
          { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code, fid_period_div_code: 'A' },
          'FHKST66430300',
        )
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
        return 'financial'
      })(),

      // --- dailyPrice ---
      (async () => {
        const today = getToday()
        const raw = await kisRequest<{ output2?: Record<string, string>[] }>(
          '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
          {
            fid_cond_mrkt_div_code: 'J',
            fid_input_iscd: code,
            fid_input_date_1: (() => {
              const d = new Date()
              d.setDate(d.getDate() - 60) // 여유 있게 60일 요청
              return d.toISOString().slice(0, 10).replace(/-/g, '')
            })(),
            fid_input_date_2: today,
            fid_period_div_code: 'D',
            fid_org_adj_prc: '0',
          },
          'FHKST03010100',
        )
        const data: DailyPrice[] = (raw.output2 ?? [])
          .slice(0, 30)
          .map((item) => ({
            date: item.stck_bsop_date ?? '',
            open: Number(item.stck_oprc),
            high: Number(item.stck_hgpr),
            low: Number(item.stck_lwpr),
            close: Number(item.stck_clpr),
            volume: Number(item.acml_vol),
          }))
        await setCached(`${code}_dailyPrice`, data)
        return 'dailyPrice'
      })(),

      // --- tradingTrend ---
      (async () => {
        const today = getToday()
        const raw = await kisRequest<{ output1?: Record<string, string>[] }>(
          '/uapi/domestic-stock/v1/quotations/inquire-investor',
          {
            fid_cond_mrkt_div_code: 'J',
            fid_input_iscd: code,
            fid_input_date_1: (() => {
              const d = new Date()
              d.setDate(d.getDate() - 30)
              return d.toISOString().slice(0, 10).replace(/-/g, '')
            })(),
            fid_input_date_2: today,
            fid_period_div_code: 'D',
          },
          'FHKST01010900',
        )
        const data: TradingTrend[] = (raw.output1 ?? []).map((item) => ({
          date: item.stck_bsop_date ?? '',
          individual: Number(item.prsn_ntby_qty),
          foreign: Number(item.frgn_ntby_qty),
          institution: Number(item.orgn_ntby_qty),
        }))
        await setCached(`${code}_tradingTrend`, data)
        return 'tradingTrend'
      })(),

      // --- opinion ---
      (async () => {
        const raw = await kisRequest<{ output?: Record<string, string>[] }>(
          '/uapi/domestic-stock/v1/quotations/inquire-invest-opbysec',
          {
            fid_cond_mrkt_div_code: 'J',
            fid_input_iscd: code,
          },
          'FHKST01011600',
        )
        const data: AnalystOpinion[] = (raw.output ?? []).map((item) => ({
          firm: item.mbcr_name ?? '',
          opinion: item.invt_opnn ?? '',
          targetPrice: Number(item.tgpr),
          date: item.invt_opnn_rgdt ?? '',
        }))
        await setCached(`${code}_opinion`, data)
        return 'opinion'
      })(),

      // --- dart (재무·공시) ---
      (async () => {
        // ticker 정보가 없으므로 code로 DART company 검색
        // getCorpCode는 ticker(종목명)를 받으므로, refresh에서는 code 기반으로 처리
        // _TICKER_CACHE_에서 종목명을 읽거나, price 결과에서 name을 활용
        // 단순화: code를 그대로 DART dart_code로 zero-pad (8자리)
        const dartCorpCode = code.padStart(8, '0')
        const currentYear = getCurrentYear()
        const today = getToday()
        const oneYearAgo = getOneYearAgo()

        const [financialData, disclosureData] = await Promise.all([
          dartRequest<{ status: string; message: string; list?: DartAccountItem[] }>(
            'fnlttSinglAcnt.json',
            {
              corp_code: dartCorpCode,
              bsns_year: currentYear,
              reprt_code: '11011',
              fs_div: 'CFS',
            },
          ),
          dartRequest<{
            status: string
            message: string
            list?: { rcp_no: string; rcept_dt: string; report_nm: string }[]
          }>('list.json', {
            corp_code: dartCorpCode,
            bgn_de: oneYearAgo,
            end_de: today,
            pblntf_ty: 'A',
            page_count: '10',
          }),
        ])

        const financial = buildDartFinancial(financialData.list ?? [], code)
        const disclosures: DartDisclosure[] = (disclosureData.list ?? []).map((item) => ({
          rcpNo: item.rcp_no,
          rceptDt: item.rcept_dt,
          reportNm: item.report_nm,
          url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcp_no}`,
        }))

        await setCached(`${code}_dart_financial`, { financial, disclosures })
        return 'dart'
      })(),
    ])

    // 3. 성공한 섹션 수집
    const refreshedSections = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value)

    return ok({ refreshedSections, elapsedMs: Date.now() - startTime })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
