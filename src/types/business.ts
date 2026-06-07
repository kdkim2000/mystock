export interface PortfolioHolding {
  ticker: string
  code: string
  holdings: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  pnl: number
  pnlRate: number
}

export interface TradeStats {
  ticker: string
  code: string
  totalBuy: number
  realizedPnl: number
  winRate: number
  tradeCount: number
}

export interface TechnicalIndicators {
  rsi14: number
  macd: number
  macdSignal: number
  macdHistogram: number
  calculatedAt: string
}
