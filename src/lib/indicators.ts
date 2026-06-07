/**
 * indicators.ts
 *
 * 클라이언트 사이드 기술적 지표 계산 유틸리티.
 * KIS dailyPrice(DailyPrice[]) 의 close 배열을 받아 RSI·MACD를 반환한다.
 * server-only import 없음 — 클라이언트 컴포넌트에서 직접 사용 가능.
 */

// ---------------------------------------------------------------------------
// RSI (Relative Strength Index)
// ---------------------------------------------------------------------------

/**
 * RSI(14) 를 계산한다.
 *
 * @param closes - 날짜 오름차순(오래된 것부터) 종가 배열
 * @param period - 기본값 14
 * @returns closes 와 동일한 길이의 RSI 배열.
 *          인덱스 0 ~ period-1 은 NaN (데이터 부족).
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const n = closes.length
  const result: number[] = new Array(n).fill(NaN)

  if (n <= period) {
    return result
  }

  // 첫 번째 period 구간으로 초기 평균 손익 계산
  let avgGain = 0
  let avgLoss = 0

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) avgGain += diff
    else avgLoss += Math.abs(diff)
  }

  avgGain /= period
  avgLoss /= period

  // period 번째 인덱스에 첫 RSI 기록
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  // Wilder smoothed average
  for (let i = period + 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? Math.abs(diff) : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }

  return result
}

// ---------------------------------------------------------------------------
// MACD (Moving Average Convergence Divergence)
// ---------------------------------------------------------------------------

export interface MacdResult {
  macd: number
  signal: number
  histogram: number
}

/**
 * 단순 EMA(Exponential Moving Average) 계산.
 * EMA[0] = data[0], EMA[i] = data[i] * k + EMA[i-1] * (1-k)
 * where k = 2 / (period + 1)
 */
function computeEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = new Array(data.length).fill(NaN)

  // 유효한 첫 번째 값 찾기
  let startIdx = -1
  for (let i = 0; i < data.length; i++) {
    if (!Number.isNaN(data[i])) {
      startIdx = i
      break
    }
  }

  if (startIdx === -1) return ema

  ema[startIdx] = data[startIdx]
  for (let i = startIdx + 1; i < data.length; i++) {
    if (Number.isNaN(data[i])) {
      ema[i] = NaN
    } else {
      ema[i] = data[i] * k + ema[i - 1] * (1 - k)
    }
  }

  return ema
}

/**
 * MACD(12, 26, 9) 를 계산한다.
 *
 * @param closes      - 날짜 오름차순 종가 배열
 * @param fastPeriod  - 단기 EMA 기간 (기본 12)
 * @param slowPeriod  - 장기 EMA 기간 (기본 26)
 * @param signalPeriod - 시그널 EMA 기간 (기본 9)
 * @returns closes 와 동일한 길이의 MacdResult 배열.
 *          slowPeriod 미달 인덱스는 { macd: NaN, signal: NaN, histogram: NaN }.
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MacdResult[] {
  const n = closes.length
  const nanResult: MacdResult = { macd: NaN, signal: NaN, histogram: NaN }

  if (n < slowPeriod) {
    return new Array(n).fill(nanResult)
  }

  const fastEMA = computeEMA(closes, fastPeriod)
  const slowEMA = computeEMA(closes, slowPeriod)

  // MACD 라인: fast - slow (slow EMA 가 유효해지는 인덱스부터 의미 있음)
  const macdLine: number[] = closes.map((_, i) => {
    const f = fastEMA[i]
    const s = slowEMA[i]
    return Number.isNaN(f) || Number.isNaN(s) ? NaN : f - s
  })

  // Signal 라인: MACD 배열에 대해 EMA(signalPeriod) 재계산
  const signalLine = computeEMA(macdLine, signalPeriod)

  return closes.map((_, i) => {
    const macd = macdLine[i]
    const signal = signalLine[i]
    if (Number.isNaN(macd) || Number.isNaN(signal)) {
      return { macd: NaN, signal: NaN, histogram: NaN }
    }
    return { macd, signal, histogram: macd - signal }
  })
}
