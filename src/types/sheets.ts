export interface SheetTransactionRow {
  Date: string
  Ticker: string
  Type: '매수' | '매도'
  Quantity: number
  Price: number
  Journal: string
  Tags: string
}

export interface TickerCacheEntry {
  key: string
  value: string
  cachedAt: string
}

export interface AiCacheEntry {
  code: string
  content: string
  cachedAt: string
}

export interface TickerMasterRow {
  Ticker: string
  Code: string
}

export interface AggregationRow {
  Ticker: string
  Code: string
  Holdings: number
  AvgPrice: number
  TotalBuy: number
  RealizedPnL: number
  TradeCount: number
  WinCount: number
}
