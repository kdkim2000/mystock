import 'server-only'
import { readSheet } from './sheets'
import { env } from './env'
import type { AggregationRow } from '@/types/sheets'

/**
 * 매매내역 시트에서 종목별 집계를 직접 계산한다.
 * 이동평균법(Moving Average) 적용:
 *   - 매수: 보유수량·원가 누적
 *   - 매도: 보유분 내에서만 실현손익 계산 (매수이력 없는 수량 제외)
 */
export async function computeAggregation(): Promise<AggregationRow[]> {
  // 1. 매매내역 읽기
  const rows = await readSheet(`${env.GOOGLE_SHEET_NAME}!A:J`)
  const transactions = rows
    .slice(1)
    .filter(r => r[0] && r[1])
    .map(r => ({
      Date:     r[0] ?? '',
      Ticker:   r[1] ?? '',
      Type:     (r[2] === '매수' || r[2] === '매도') ? r[2] as '매수' | '매도' : '매수' as const,
      Quantity: Number(r[3]) || 0,
      Price:    Number(r[4]) || 0,
      Fee:      Number(r[5]) || 0,
      Tax:      Number(r[6]) || 0,
    }))

  // 2. 종목코드 맵 (GOOGLE_SHEET_TICKER_MASTER가 있으면 조회)
  const codeMap: Record<string, string> = {}
  if (env.GOOGLE_SHEET_TICKER_MASTER) {
    try {
      const masterRows = await readSheet(`${env.GOOGLE_SHEET_TICKER_MASTER}!A:B`)
      for (const r of masterRows.slice(1)) {
        if (r[0] && r[1]) codeMap[r[0]] = r[1]
      }
    } catch {
      // 마스터 시트 오류 무시 — Code는 빈 문자열로 처리
    }
  }

  // 3. 종목별 그룹화
  const byTicker = new Map<string, typeof transactions>()
  for (const tx of transactions) {
    const list = byTicker.get(tx.Ticker)
    if (list) list.push(tx)
    else byTicker.set(tx.Ticker, [tx])
  }

  // 4. 종목별 이동평균 계산
  const result: AggregationRow[] = []
  for (const [ticker, txList] of byTicker) {
    // 날짜 오름차순 정렬 (과거 → 현재)
    const sorted = [...txList].sort((a, b) => a.Date.localeCompare(b.Date))

    let qty = 0
    let cost = 0       // 현재 보유분 원가 합계 (수수료 포함)
    let totalBuy = 0   // 누적 매수 원가
    let realizedPnL = 0
    let tradeCount = 0
    let winCount = 0

    for (const tx of sorted) {
      if (tx.Type === '매수') {
        const buyCost = tx.Price * tx.Quantity + tx.Fee
        qty  += tx.Quantity
        cost += buyCost
        totalBuy += buyCost
      } else if (qty > 0) {
        // 보유 수량 내에서만 실현손익 계산
        const soldQty  = Math.min(tx.Quantity, qty)
        const avgCost  = cost / qty
        const feeRatio = tx.Quantity > 0 ? soldQty / tx.Quantity : 1
        const pnl = tx.Price * soldQty - (tx.Fee + tx.Tax) * feeRatio - avgCost * soldQty
        realizedPnL += pnl
        tradeCount++
        if (pnl > 0) winCount++
        cost = Math.max(0, cost - avgCost * soldQty)
        qty  = Math.max(0, qty  - soldQty)
      }
    }

    result.push({
      Ticker:      ticker,
      Code:        codeMap[ticker] ?? '',
      Holdings:    qty,
      AvgPrice:    qty > 0 ? Math.round(cost / qty) : 0,
      TotalBuy:    Math.round(totalBuy),
      RealizedPnL: Math.round(realizedPnL),
      TradeCount:  tradeCount,
      WinCount:    winCount,
    })
  }

  // 보유 포지션 우선, 동률이면 실현손익 내림차순
  result.sort((a, b) => {
    if ((a.Holdings > 0) !== (b.Holdings > 0)) return a.Holdings > 0 ? -1 : 1
    return b.RealizedPnL - a.RealizedPnL
  })

  return result
}
