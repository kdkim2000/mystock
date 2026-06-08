import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getAiCached, setAiCached, getCached } from '@/lib/cache'
import { generateAiAnalysis } from '@/lib/ai'
import { kisRequest } from '@/lib/kis'
import { readSheet } from '@/lib/sheets'
import { env } from '@/lib/env'
import type { AiAnalysisResult } from '@/types/ai'
import type { StockPrice, Valuation } from '@/types/kis'
import type { SheetTransactionRow } from '@/types/sheets'
import { z } from 'zod'

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '종목코드는 6자리 숫자여야 합니다'),
})

// ---------------------------------------------------------------------------
// GET /api/ai/analysis?code=005930
// 캐시된 AI 분석 결과 조회. 없으면 null 반환 (클라이언트가 POST로 생성 요청).
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  const { searchParams } = new URL(request.url)
  const parsed = codeSchema.safeParse({ code: searchParams.get('code') })
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code } = parsed.data

  try {
    const content = await getAiCached(code)

    if (content) {
      const result: AiAnalysisResult = {
        code,
        content,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
      }
      return ok(result)
    }

    // 캐시 미스: null 반환 → 클라이언트가 POST로 생성 요청
    return ok(null)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}

// ---------------------------------------------------------------------------
// POST /api/ai/analysis
// 강제 갱신: 종목 정보 수집 → gpt-4o-mini 호출 → _AI_CACHE_ 갱신
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('Invalid JSON body', 'VALIDATION_ERROR', 400)
  }

  const parsed = codeSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)
  const { code } = parsed.data

  try {
    // 1. 주가 정보 조회 (캐시 우선, 없으면 KIS 직접 요청)
    let stockPrice = await getCached<StockPrice>(`${code}_price`, 1800)
    if (!stockPrice) {
      const raw = await kisRequest<Record<string, string>>(
        '/uapi/domestic-stock/v1/quotations/inquire-price',
        { fid_cond_mrkt_div_code: 'J', fid_input_iscd: code },
        'FHKST01010100',
      )
      stockPrice = {
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
        cachedAt: new Date().toISOString(),
      } as StockPrice & { cachedAt: string }
    }

    // 2. 밸류에이션 조회 (캐시 우선)
    const valuation = await getCached<Valuation>(`${code}_valuation`, 1800)

    // 3. 거래내역 조회 (매매 일지 컨텍스트)
    const sheetRange = `${env.GOOGLE_SHEET_NAME}!A:J`
    const rows = await readSheet(sheetRange)

    // 헤더 행(첫 행) 제외 후 SheetTransactionRow[] 변환
    const recentTrades: SheetTransactionRow[] = rows
      .slice(1)
      .filter((row) => row.length >= 5)
      .map((row) => ({
        Date:     row[0] ?? '',
        Ticker:   row[1] ?? '',
        Type:     (row[2] === '매도' ? '매도' : '매수') as '매수' | '매도',
        Quantity: Number(row[3]) || 0,
        Price:    Number(row[4]) || 0,
        Fee:      Number(row[5]) || 0,
        Tax:      Number(row[6]) || 0,
        Journal:  row[7] ?? '',
        Tags:     row[8] ?? '',
        Amount:   Number(row[9]) || 0,
      }))
      // 해당 종목 필터 (종목명은 Ticker 컬럼에 저장)
      .filter((row) => row.Ticker !== '')

    // 4. AI 분석 생성
    const stockInfo: Parameters<typeof generateAiAnalysis>[1] = {
      name: stockPrice.name,
      currentPrice: stockPrice.currentPrice,
      changeRate: stockPrice.changeRate,
      ...(valuation
        ? {
            per: valuation.per,
            pbr: valuation.pbr,
            roe: valuation.roe,
            roa: valuation.roa,
            debtRatio: valuation.debtRatio,
          }
        : {}),
    }

    const result = await generateAiAnalysis(code, stockInfo, recentTrades)

    // 5. _AI_CACHE_ 갱신
    await setAiCached(code, result.content)

    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'INTERNAL_ERROR', 500)
  }
}
