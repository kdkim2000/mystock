export interface StockPrice {
  code: string
  name: string
  currentPrice: number
  changeRate: number
  changeAmount: number
  high52w: number
  low52w: number
  marketCap: number
  volume: number
  tradingValue: number
}

export interface Valuation {
  code: string
  per: number
  pbr: number
  eps: number
  bps: number
  roe: number
  roa: number
  debtRatio: number
  estimatedRevenue?: number
  estimatedOperatingProfit?: number
  estimatedNetProfit?: number
}

export interface FinancialSummary {
  code: string
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  revenue: number
  operatingProfit: number
  netProfit: number
  fiscalYear: string
}

export interface DailyPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TradingTrend {
  date: string
  individual: number
  foreign: number
  institution: number
}

export interface AnalystOpinion {
  firm: string
  opinion: string
  targetPrice: number
  date: string
}

export interface KisToken {
  accessToken: string
  tokenType: string
  expiresAt: string
}
