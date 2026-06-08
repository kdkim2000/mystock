import type { AggregationRow, SheetTransactionRow } from '@/types/sheets'

export const mockAggregation: AggregationRow[] = [
  {
    Ticker: '삼성전자',
    Code: '005930',
    Holdings: 10,
    AvgPrice: 70000,
    TotalBuy: 700000,
    RealizedPnL: 50000,
    TradeCount: 5,
    WinCount: 3,
  },
  {
    Ticker: 'SK하이닉스',
    Code: '000660',
    Holdings: 5,
    AvgPrice: 180000,
    TotalBuy: 900000,
    RealizedPnL: -20000,
    TradeCount: 3,
    WinCount: 1,
  },
]

export const mockTransactions: SheetTransactionRow[] = [
  {
    Date: '2026-06-01',
    Ticker: '삼성전자',
    Type: '매수',
    Quantity: 10,
    Price: 70000,
    Fee: 525,
    Tax: 0,
    Journal: '저점 매수',
    Tags: '가치투자',
    Amount: 700000,
  },
  {
    Date: '2026-06-05',
    Ticker: 'SK하이닉스',
    Type: '매도',
    Quantity: 5,
    Price: 185000,
    Fee: 693,
    Tax: 1110,
    Journal: '목표가 도달',
    Tags: '단기매매',
    Amount: 925000,
  },
]

export const mockKisPrice = {
  code: '005930',
  name: '삼성전자',
  currentPrice: 73000,
  changeRate: 1.39,
  changeAmount: 1000,
  high52w: 88800,
  low52w: 62000,
  marketCap: 4356789,
  volume: 12345678,
  tradingValue: 901234567890,
}

export const mockAiAnalysis = {
  code: '005930',
  content: '삼성전자는 반도체 업황 회복과 AI 투자 수요 증가로 긍정적 전망입니다.',
  generatedAt: '2026-06-07T10:00:00.000Z',
  model: 'gpt-4o-mini',
}
