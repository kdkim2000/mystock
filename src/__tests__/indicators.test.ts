import { describe, it, expect } from 'vitest'
import { calculateRSI, calculateMACD } from '@/lib/indicators'

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

/** n 개의 종가를 생성한다. delta > 0 이면 상승, < 0 이면 하락. */
function makePrices(n: number, start: number, delta: number): number[] {
  return Array.from({ length: n }, (_, i) => start + i * delta)
}

// ---------------------------------------------------------------------------
// RSI 테스트
// ---------------------------------------------------------------------------

describe('calculateRSI', () => {
  it('20개 데이터로 RSI 를 계산하면 값이 0~100 범위여야 한다', () => {
    // 상승/하락이 섞인 현실적인 종가 시퀀스
    const closes = [
      100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
      110, 108, 107, 109, 111, 110, 112, 113, 111, 114,
    ]
    const rsi = calculateRSI(closes)

    expect(rsi).toHaveLength(closes.length)

    // period(14) 이후 인덱스는 유효한 숫자여야 한다
    for (let i = 14; i < closes.length; i++) {
      expect(rsi[i]).not.toBeNaN()
      expect(rsi[i]).toBeGreaterThanOrEqual(0)
      expect(rsi[i]).toBeLessThanOrEqual(100)
    }
  })

  it('period 미달 인덱스는 NaN 을 반환해야 한다', () => {
    const closes = makePrices(20, 100, 1) // 20개, period=14
    const rsi = calculateRSI(closes, 14)

    // 인덱스 0 ~ 13 은 NaN
    for (let i = 0; i < 14; i++) {
      expect(rsi[i]).toBeNaN()
    }
  })

  it('배열 길이가 period 이하이면 전부 NaN 을 반환해야 한다', () => {
    const closes = makePrices(10, 100, 1) // 10개 < period(14)
    const rsi = calculateRSI(closes, 14)

    expect(rsi).toHaveLength(10)
    rsi.forEach((v) => expect(v).toBeNaN())
  })

  it('모든 데이터가 상승하면 RSI 가 100에 수렴해야 한다', () => {
    // 100 개 데이터, 매일 +1 → 손실 없음 → RSI = 100
    const closes = makePrices(100, 100, 1)
    const rsi = calculateRSI(closes, 14)

    const lastRsi = rsi[rsi.length - 1]
    expect(lastRsi).not.toBeNaN()
    // avgLoss 가 0 이 되므로 정확히 100
    expect(lastRsi).toBe(100)
  })

  it('모든 데이터가 하락하면 RSI 가 0에 수렴해야 한다', () => {
    // 100 개 데이터, 매일 -1 → 이익 없음 → RSI = 0
    const closes = makePrices(100, 200, -1)
    const rsi = calculateRSI(closes, 14)

    const lastRsi = rsi[rsi.length - 1]
    expect(lastRsi).not.toBeNaN()
    // avgGain 이 0 이 되므로 정확히 0
    expect(lastRsi).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// MACD 테스트
// ---------------------------------------------------------------------------

describe('calculateMACD', () => {
  it('결과 배열 길이가 입력 배열 길이와 동일해야 한다', () => {
    const closes = makePrices(50, 100, 0.5)
    const result = calculateMACD(closes)

    expect(result).toHaveLength(closes.length)
  })

  it('slowPeriod(26) 이상의 충분한 데이터가 있을 때 finite 한 값을 반환해야 한다', () => {
    // 상승/하락이 섞인 60개 종가
    const closes = [
      100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
      110, 108, 107, 109, 111, 110, 112, 113, 111, 114,
      115, 113, 116, 118, 117, 119, 120, 118, 121, 123,
      122, 124, 126, 125, 127, 128, 126, 129, 131, 130,
      132, 133, 131, 134, 136, 135, 137, 138, 136, 139,
      140, 138, 141, 143, 142, 144, 145, 143, 146, 148,
    ]
    const result = calculateMACD(closes)

    // 인덱스 0~25 (slowPeriod-1) 는 NaN, 그 이후는 finite
    for (let i = 26; i < closes.length; i++) {
      const { macd, signal, histogram } = result[i]
      // signal 은 macd 배열에서 다시 EMA 를 구하므로 조금 더 뒤에 수렴
      // macd 는 slowPeriod 이후 유효
      expect(Number.isFinite(macd)).toBe(true)
      // signal 은 macd 배열에 EMA(9) 적용 → 26 인덱스부터 값이 있는 첫 지점이 signal 시드
      // 따라서 signal 이 NaN 이 아닌 경우만 histogram 검증
      if (Number.isFinite(signal)) {
        expect(Number.isFinite(histogram)).toBe(true)
      }
    }
  })

  it('데이터가 slowPeriod 보다 적으면 전부 NaN 을 반환해야 한다', () => {
    const closes = makePrices(20, 100, 1) // 20개 < slowPeriod(26)
    const result = calculateMACD(closes)

    result.forEach(({ macd, signal, histogram }) => {
      expect(macd).toBeNaN()
      expect(signal).toBeNaN()
      expect(histogram).toBeNaN()
    })
  })

  it('histogram = macd - signal 이어야 한다', () => {
    const closes = [
      100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
      110, 108, 107, 109, 111, 110, 112, 113, 111, 114,
      115, 113, 116, 118, 117, 119, 120, 118, 121, 123,
      122, 124, 126, 125, 127, 128, 126, 129, 131, 130,
      132, 133, 131, 134, 136, 135, 137, 138, 136, 139,
    ]
    const result = calculateMACD(closes)

    for (const { macd, signal, histogram } of result) {
      if (Number.isFinite(macd) && Number.isFinite(signal)) {
        // 부동소수점 오차 허용
        expect(histogram).toBeCloseTo(macd - signal, 10)
      }
    }
  })
})
