import 'server-only'
import OpenAI from 'openai'
import type { AiAnalysisResult } from '@/types/ai'
import type { StockPrice, Valuation } from '@/types/kis'
import type { SheetTransactionRow } from '@/types/sheets'
import { env } from './env'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const systemPrompt = `당신은 한국 주식 전문 분석가입니다. 주어진 종목 정보와 매매 일지를 바탕으로 간결하고 실용적인 투자 분석을 제공하세요.
분석은 3~5개 단락으로 구성하고, 각 단락은 핵심 관점(밸류에이션, 실적 추이, 매매 패턴, 리스크, 결론)을 다루세요.
한국어로 작성하며, 투자는 본인 판단 하에 이루어져야 함을 언급하세요.`

export async function generateAiAnalysis(
  code: string,
  stockInfo: Pick<StockPrice, 'name' | 'currentPrice' | 'changeRate'> & Partial<Valuation>,
  recentTrades: SheetTransactionRow[]
): Promise<AiAnalysisResult> {
  const tradeLines =
    recentTrades.length > 0
      ? recentTrades
          .slice(-5)
          .map((t) => `${t.Date} ${t.Type} ${t.Quantity}주 @${t.Price}원 - ${t.Journal}`)
          .join('\n')
      : '매매 내역 없음'

  const userMessage = `종목코드: ${code}
종목명: ${stockInfo.name}
현재가: ${stockInfo.currentPrice}원 (${stockInfo.changeRate}%)
PER: ${stockInfo.per ?? 'N/A'}
PBR: ${stockInfo.pbr ?? 'N/A'}
ROE: ${stockInfo.roe ?? 'N/A'}%
부채비율: ${stockInfo.debtRatio ?? 'N/A'}%

최근 매매 내역 (최신 5건):
${tradeLines}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  })

  return {
    code,
    content: completion.choices[0]?.message?.content ?? '',
    generatedAt: new Date().toISOString(),
    model: 'gpt-4o-mini',
  }
}
