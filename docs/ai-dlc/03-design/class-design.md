# 클래스·타입 설계서 (Class & Type Design)

| 항목 | 내용 |
|:---|:---|
| 문서명 | 클래스·타입 설계서 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 TypeScript를 사용하며 클래스 대신 **인터페이스(interface)**와 **타입 별칭(type alias)**으로 데이터 구조를 정의한다. 총 18개 타입이 4개 레이어로 분류된다.

### 레이어 아키텍처

```
[UI Layer — React 컴포넌트]
      │ props / React state
      ▼
[Business Logic Layer — Custom Hooks / Utils]
      │ fetch calls
      ▼
[API Layer — Next.js Route Handlers]
      │ HTTP 호출
      ▼
[External — KIS / DART / OpenAI / Google Sheets]
```

---

## 2. 패키지 구조 (예정)

```
src/
├── types/
│   ├── sheets.ts        ← 데이터 레이어 (5개)
│   ├── kis.ts           ← KIS API 응답 (7개)
│   ├── dart.ts          ← DART API 응답 (2개)
│   ├── ai.ts            ← AI 분석 (1개)
│   └── business.ts      ← 비즈니스 로직 (3개)
├── lib/
│   ├── kis.ts           ← KIS API 클라이언트 + 400ms 스로틀
│   ├── dart.ts          ← DART API 클라이언트
│   ├── sheets.ts        ← Google Sheets 클라이언트
│   ├── cache.ts         ← 3계층 캐시 로직
│   ├── ai.ts            ← OpenAI 분석 로직
│   └── indicators.ts    ← RSI·MACD 클라이언트 계산
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← /dashboard
│   ├── auth/signin/page.tsx
│   ├── stock/[code]/page.tsx
│   └── api/
│       ├── sheets/
│       │   ├── transactions/route.ts
│       │   ├── ticker-master/route.ts
│       │   └── aggregation/route.ts
│       ├── kis/
│       │   ├── price/route.ts
│       │   ├── valuation/route.ts
│       │   ├── financial/route.ts
│       │   ├── daily-price/route.ts
│       │   ├── trading-trend/route.ts
│       │   └── opinion/route.ts
│       ├── dart/
│       │   └── financial/route.ts
│       ├── fundamental/route.ts
│       ├── ai/
│       │   └── analysis/route.ts
│       └── ticker/[code]/refresh/route.ts
└── components/
    ├── ui/              ← shadcn/ui 기본 컴포넌트
    ├── dashboard/       ← 대시보드 전용 컴포넌트
    └── stock/           ← 종목상세 전용 컴포넌트
```

---

## 3. 데이터 레이어 타입 (`src/types/sheets.ts`)

Google Sheets 5개 탭과 1:1로 대응하는 타입이다.

### 3.1 SheetTransactionRow

```typescript
/** 매매내역 탭 행 */
export interface SheetTransactionRow {
  Date: string;           // 'YYYY-MM-DD'
  Ticker: string;         // 한국어 종목명
  Type: '매수' | '매도';
  Quantity: number;
  Price: number;          // 단가 (원)
  Journal: string;        // 매매 메모
  Tags: string;           // 콤마 구분 태그 문자열
}
```

### 3.2 TickerCacheEntry

```typescript
/** _TICKER_CACHE_ 탭 행 */
export interface TickerCacheEntry {
  key: string;       // '{code}_{section}' 형식
  value: string;     // JSON.stringify(API 응답)
  cachedAt: string;  // ISO 8601
}
```

### 3.3 AiCacheEntry

```typescript
/** _AI_CACHE_ 탭 행 */
export interface AiCacheEntry {
  code: string;      // 종목 코드
  content: string;   // AI 분석 텍스트
  cachedAt: string;  // ISO 8601
}
```

### 3.4 TickerMasterRow

```typescript
/** 종목코드마스터 탭 행 */
export interface TickerMasterRow {
  Ticker: string;  // 한국어 종목명
  Code: string;    // KIS 6자리 코드 (예: '005930')
}
```

### 3.5 AggregationRow

```typescript
/** 종목별집계 탭 행 */
export interface AggregationRow {
  Ticker: string;
  Code: string;
  Holdings: number;      // 현재 보유 수량
  AvgPrice: number;      // 평균 매수 단가
  TotalBuy: number;      // 총 매수 금액
  RealizedPnL: number;   // 실현 손익
  TradeCount: number;    // 총 거래 횟수
  WinCount: number;      // 수익 거래 횟수
}
```

---

## 4. KIS API 응답 타입 (`src/types/kis.ts`)

### 4.1 StockPrice

```typescript
/** GET /api/kis/price 응답 */
export interface StockPrice {
  code: string;         // 종목 코드
  name: string;         // 종목명
  currentPrice: number; // 현재가
  changeRate: number;   // 전일 대비 등락률 (%)
  changeAmount: number; // 전일 대비 등락 금액
  high52w: number;      // 52주 최고가
  low52w: number;       // 52주 최저가
  marketCap: number;    // 시가총액 (억 원)
  volume: number;       // 거래량
  tradingValue: number; // 거래대금
}
```

### 4.2 Valuation

```typescript
/** GET /api/kis/valuation 응답 */
export interface Valuation {
  code: string;
  per: number;    // 주가수익비율
  pbr: number;    // 주가순자산비율
  eps: number;    // 주당순이익
  bps: number;    // 주당순자산
  roe: number;    // 자기자본이익률 (%)
  roa: number;    // 총자산이익률 (%)
  debtRatio: number;  // 부채비율 (%)
  /** 추정실적 (컨센서스) */
  estimatedRevenue?: number;
  estimatedOperatingProfit?: number;
  estimatedNetProfit?: number;
}
```

### 4.3 FinancialSummary

```typescript
/** GET /api/kis/financial 응답 */
export interface FinancialSummary {
  code: string;
  totalAssets: number;       // 총자산 (억 원)
  totalLiabilities: number;  // 총부채
  totalEquity: number;       // 자기자본
  revenue: number;           // 매출액
  operatingProfit: number;   // 영업이익
  netProfit: number;         // 당기순이익
  fiscalYear: string;        // 기준 회계연도 (예: '2023')
}
```

### 4.4 DailyPrice

```typescript
/** GET /api/kis/daily-price 응답 항목 */
export interface DailyPrice {
  date: string;    // 'YYYYMMDD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### 4.5 TradingTrend

```typescript
/** GET /api/kis/trading-trend 응답 항목 */
export interface TradingTrend {
  date: string;          // 'YYYYMMDD'
  individual: number;    // 개인 순매수 (주)
  foreign: number;       // 외국인 순매수
  institution: number;   // 기관 순매수
}
```

### 4.6 AnalystOpinion

```typescript
/** GET /api/kis/opinion 응답 항목 */
export interface AnalystOpinion {
  firm: string;           // 증권사명
  opinion: string;        // 투자의견 (매수/중립/매도)
  targetPrice: number;    // 목표주가
  date: string;           // 의견 날짜 'YYYYMMDD'
}
```

### 4.7 KisToken

```typescript
/** KIS 액세스 토큰 (globalThis + /tmp/ 캐시) */
export interface KisToken {
  accessToken: string;
  tokenType: string;
  expiresAt: Date;     // 만료 시각
}
```

---

## 5. DART API 응답 타입 (`src/types/dart.ts`)

### 5.1 DartFinancial

```typescript
/** GET /api/dart/financial 응답 */
export interface DartFinancial {
  code: string;
  years: DartFinancialYear[];   // 최근 5개년
}

export interface DartFinancialYear {
  year: string;             // 회계연도 (예: '2023')
  revenue: number;          // 매출액 (억 원)
  operatingProfit: number;  // 영업이익
  netProfit: number;        // 당기순이익
  cashFlow: number;         // 영업활동 현금흐름
}
```

### 5.2 DartDisclosure

```typescript
/** DART 잠정실적 공시 항목 */
export interface DartDisclosure {
  rcpNo: string;       // 접수번호
  rceptDt: string;     // 접수일자 'YYYYMMDD'
  reportNm: string;    // 보고서명
  url: string;         // DART 원문 링크
}
```

---

## 6. AI 분석 타입 (`src/types/ai.ts`)

### 6.1 AiAnalysisResult

```typescript
/** GET /api/ai/analysis 응답 */
export interface AiAnalysisResult {
  code: string;
  content: string;       // gpt-4o-mini 분석 텍스트
  generatedAt: string;   // ISO 8601 (생성 시각)
  model: string;         // 사용 모델 (예: 'gpt-4o-mini')
}
```

---

## 7. 비즈니스 로직 타입 (`src/types/business.ts`)

### 7.1 PortfolioHolding

```typescript
/** 종목별 보유 현황 (대시보드·포트폴리오 섹션) */
export interface PortfolioHolding {
  ticker: string;
  code: string;
  holdings: number;      // 보유 수량
  avgPrice: number;      // 평균 단가
  currentPrice: number;  // 현재가 (KIS 실시간)
  marketValue: number;   // 평가금액
  pnl: number;           // 평가손익
  pnlRate: number;       // 수익률 (%)
}
```

### 7.2 TradeStats

```typescript
/** 종목별 거래 통계 (대시보드 분석 테이블) */
export interface TradeStats {
  ticker: string;
  code: string;
  totalBuy: number;       // 총 매수 금액
  realizedPnl: number;    // 실현 손익
  winRate: number;        // 승률 (%) = WinCount / TradeCount * 100
  tradeCount: number;     // 거래 횟수
}
```

### 7.3 TechnicalIndicators

```typescript
/** RSI·MACD 클라이언트 계산 결과 (FR-019) */
export interface TechnicalIndicators {
  rsi14: number;          // RSI(14)
  macd: number;           // MACD (12,26,9)
  macdSignal: number;     // Signal Line
  macdHistogram: number;  // Histogram
  calculatedAt: string;   // 계산 시각 ISO 8601
}
```

---

## 8. 타입 커버리지 매핑

| 타입 | 파일 | 연계 API / 탭 | 연계 컴포넌트 |
|:---|:---|:---|:---|
| `SheetTransactionRow` | sheets.ts | 매매내역 탭 | `TradeHistoryTable`, `JournalTable` |
| `TickerCacheEntry` | sheets.ts | _TICKER_CACHE_ | (내부 cache.ts) |
| `AiCacheEntry` | sheets.ts | _AI_CACHE_ | (내부 ai.ts) |
| `TickerMasterRow` | sheets.ts | 종목코드마스터 | (내부 변환) |
| `AggregationRow` | sheets.ts | 종목별집계 | `PortfolioCard` |
| `StockPrice` | kis.ts | `/api/kis/price` | `PriceCard` |
| `Valuation` | kis.ts | `/api/kis/valuation` | `ValuationTable`, `EstimateTable`, `FinancialRadarChart` |
| `FinancialSummary` | kis.ts | `/api/kis/financial` | `FinancialTable`, `FinancialRadarChart` |
| `DailyPrice` | kis.ts | `/api/kis/daily-price` | `CandlestickChart`, `VolumeBarChart` |
| `TradingTrend` | kis.ts | `/api/kis/trading-trend` | `InvestorTrendChart` |
| `AnalystOpinion` | kis.ts | `/api/kis/opinion` | `OpinionTable` |
| `KisToken` | kis.ts | (내부 토큰 관리) | — |
| `DartFinancial` | dart.ts | `/api/dart/financial` | `DartFinancialChart` |
| `DartDisclosure` | dart.ts | `/api/dart/financial` | `DisclosureList` |
| `AiAnalysisResult` | ai.ts | `GET/POST /api/ai/analysis` | `AiAnalysisCard` |
| `PortfolioHolding` | business.ts | 집계 계산 | `PositionBarChart`, `PortfolioCard` |
| `TradeStats` | business.ts | 집계 계산 | `StockAnalysisTable`, `ProfitBarChart` |
| `TechnicalIndicators` | business.ts | DailyPrice 계산 | `RsiCard`, `MacdCard` |

**18개 타입 전체 정의 완료**

---

## 9. 핵심 라이브러리 함수 시그니처

### 9.1 `src/lib/cache.ts`

```typescript
// 3계층 캐시 조회: globalThis → Sheets → 외부 API
async function getCached<T>(
  code: string,
  section: string,
  fetcher: () => Promise<T>,
  ttlMinutes?: number   // 기본 30분
): Promise<T>
```

### 9.2 `src/lib/kis.ts`

```typescript
// KIS API 단일 호출 (400ms 스로틀 내장)
async function kisRequest<T>(
  path: string,
  params: Record<string, string>,
  trId: string
): Promise<T>

// 토큰 소프트 만료 처리
function softExpireKisToken(): void
```

### 9.3 `src/lib/indicators.ts`

```typescript
// 클라이언트 RSI 계산 (FR-019)
function calculateRsi(closes: number[], period?: number): number

// 클라이언트 MACD 계산 (FR-019)
function calculateMacd(
  closes: number[],
  fast?: number,   // 기본 12
  slow?: number,   // 기본 26
  signal?: number  // 기본 9
): { macd: number; signal: number; histogram: number }
```
