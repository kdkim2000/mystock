# Zod 유효성 검사 스키마 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | Zod 유효성 검사 스키마 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 **Zod**를 사용하여 환경변수와 API 응답을 런타임에 검증한다. TypeScript 타입과 Zod 스키마를 함께 정의하여 컴파일 타임과 런타임 타입 안전성을 모두 확보한다.

### 적용 범위

| 검증 대상 | 적용 위치 | 목적 |
|:---|:---|:---|
| 환경변수 | 서버 시작 시 | 누락 변수 조기 발견 |
| API 요청 바디 | API Route Handler | 잘못된 입력 거부 |
| KIS API 응답 | `src/lib/kis.ts` | 예상치 못한 KIS 응답 구조 감지 |
| Sheets 데이터 | `src/lib/sheets.ts` | 스프레드시트 데이터 형식 검증 |

---

## 2. 환경변수 검증 스키마 (`src/lib/env.ts`)

```typescript
import { z } from 'zod'

const envSchema = z.object({
  // NextAuth
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  ALLOWED_EMAIL: z.string().email().optional(),

  // Google Sheets
  GOOGLE_SPREADSHEET_ID: z.string().min(1),
  GOOGLE_SHEET_NAME: z.string().default('매매내역'),
  GOOGLE_SHEET_TICKER_MASTER: z.string().optional(),
  GOOGLE_SHEET_AGGREGATION: z.string().optional(),

  // 서비스 계정 인증 (둘 중 하나 필수)
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),

  // DART API
  DART_API_KEY: z.string().min(1),

  // KIS Open API
  KIS_APP_KEY: z.string().min(1),
  KIS_APP_SECRET: z.string().min(1),
  KIS_APP_SVR: z.enum(['prod', 'vps']).default('prod'),
  KIS_THROTTLE_MS: z.coerce.number().min(100).max(2000).default(400),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),
}).refine(
  data => data.GOOGLE_APPLICATION_CREDENTIALS || data.GOOGLE_SERVICE_ACCOUNT_JSON,
  { message: 'Either GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON is required' }
)

// 서버 시작 시 즉시 검증 — 클라이언트 컴포넌트에서 import 금지
export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
```

**사용 방법**:
```typescript
// src/lib/kis.ts
import { env } from '@/lib/env'

const KIS_BASE_URL = env.KIS_APP_SVR === 'vps'
  ? 'https://openapivts.koreainvestment.com:29443'
  : 'https://openapi.koreainvestment.com:9443'
```

> `env.ts`는 서버 전용 모듈. 클라이언트 컴포넌트에서 import하면 API 키 노출 위험.

---

## 3. API 요청 바디 검증

### 3.1 POST /api/ai/analysis

```typescript
// src/app/api/ai/analysis/route.ts
import { z } from 'zod'
import { err } from '@/lib/api-response'

const requestSchema = z.object({
  code: z.string()
    .min(1, 'code is required')
    .max(10, 'code must be 10 characters or less')
    .regex(/^\d{6}$/, 'code must be a 6-digit number'),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return err(
      parsed.error.errors[0].message,
      'VALIDATION_ERROR',
      400
    )
  }

  const { code } = parsed.data
  // 비즈니스 로직
}
```

### 3.2 GET /api/kis/* 쿼리 파라미터 검증

```typescript
// 공통 code 파라미터 검증 유틸
const codeSchema = z.string().regex(/^\d{6}$/, 'Invalid stock code format')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codeParsed = codeSchema.safeParse(searchParams.get('code'))

  if (!codeParsed.success) {
    return err('Invalid or missing code parameter', 'INVALID_CODE', 400)
  }

  const code = codeParsed.data
  // API 호출
}
```

---

## 4. Google Sheets 데이터 검증 스키마

```typescript
// src/types/schemas/sheets.ts
import { z } from 'zod'

/** 매매내역 탭 행 */
export const SheetTransactionRowSchema = z.object({
  Date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  Ticker: z.string().min(1, 'Ticker cannot be empty'),
  Type: z.enum(['매수', '매도'], { errorMap: () => ({ message: "Type must be '매수' or '매도'" }) }),
  Quantity: z.coerce.number().positive().int(),
  Price: z.coerce.number().positive(),
  Journal: z.string().default(''),
  Tags: z.string().default(''),
})
export type SheetTransactionRow = z.infer<typeof SheetTransactionRowSchema>

/** _TICKER_CACHE_ 탭 행 */
export const TickerCacheEntrySchema = z.object({
  key: z.string().regex(/^.+_.+$/, 'key must be {code}_{section} format'),
  value: z.string().min(1),
  cachedAt: z.string().datetime(),
})
export type TickerCacheEntry = z.infer<typeof TickerCacheEntrySchema>

/** _AI_CACHE_ 탭 행 */
export const AiCacheEntrySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  content: z.string().min(1),
  cachedAt: z.string().datetime(),
})
export type AiCacheEntry = z.infer<typeof AiCacheEntrySchema>

/** 종목코드마스터 탭 행 */
export const TickerMasterRowSchema = z.object({
  Ticker: z.string().min(1),
  Code: z.string().regex(/^\d{6}$/, 'Code must be 6-digit number'),
})
export type TickerMasterRow = z.infer<typeof TickerMasterRowSchema>

/** 종목별집계 탭 행 */
export const AggregationRowSchema = z.object({
  Ticker: z.string().min(1),
  Code: z.string().regex(/^\d{6}$/),
  Holdings: z.coerce.number().int().min(0),
  AvgPrice: z.coerce.number().min(0),
  TotalBuy: z.coerce.number().min(0),
  RealizedPnL: z.coerce.number(),
  TradeCount: z.coerce.number().int().min(0),
  WinCount: z.coerce.number().int().min(0),
})
export type AggregationRow = z.infer<typeof AggregationRowSchema>
```

---

## 5. KIS API 응답 검증 스키마

```typescript
// src/types/schemas/kis.ts
import { z } from 'zod'

export const StockPriceSchema = z.object({
  code: z.string(),
  name: z.string(),
  currentPrice: z.number(),
  changeRate: z.number(),
  changeAmount: z.number(),
  high52w: z.number(),
  low52w: z.number(),
  marketCap: z.number(),
  volume: z.number(),
  tradingValue: z.number(),
})
export type StockPrice = z.infer<typeof StockPriceSchema>

export const ValuationSchema = z.object({
  code: z.string(),
  per: z.number(),
  pbr: z.number(),
  eps: z.number(),
  bps: z.number(),
  roe: z.number(),
  roa: z.number(),
  debtRatio: z.number(),
  estimatedRevenue: z.number().optional(),
  estimatedOperatingProfit: z.number().optional(),
  estimatedNetProfit: z.number().optional(),
})
export type Valuation = z.infer<typeof ValuationSchema>

export const DailyPriceSchema = z.object({
  date: z.string().regex(/^\d{8}$/),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
})
export type DailyPrice = z.infer<typeof DailyPriceSchema>
```

---

## 6. Zod 사용 패턴

### 6.1 `parse` vs `safeParse`

```typescript
// parse: 실패 시 ZodError throw (내부 로직에서 사용)
const data = StockPriceSchema.parse(rawApiResponse)

// safeParse: 실패 시 success: false 반환 (API Route에서 사용)
const result = requestSchema.safeParse(body)
if (!result.success) {
  return err(result.error.errors[0].message, 'VALIDATION_ERROR', 400)
}
```

### 6.2 Sheets 배열 데이터 파싱

```typescript
// Sheets에서 읽은 string[][] → 타입 객체 배열로 변환
function parseSheetRows<T>(
  rows: string[][],
  headers: string[],
  schema: z.ZodType<T>
): T[] {
  return rows
    .slice(1)  // 헤더 행 제거
    .map(row => {
      const obj = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
      const parsed = schema.safeParse(obj)
      return parsed.success ? parsed.data : null
    })
    .filter((row): row is T => row !== null)
}

// 사용 예
const headers = ['Date', 'Ticker', 'Type', 'Quantity', 'Price', 'Journal', 'Tags']
const transactions = parseSheetRows(rows, headers, SheetTransactionRowSchema)
```

### 6.3 타입 재사용 (`z.infer`)

```typescript
// Zod 스키마에서 TypeScript 타입 자동 추론 — 별도 interface 정의 불필요
type SheetTransactionRow = z.infer<typeof SheetTransactionRowSchema>
```

---

## 7. 클라이언트에서 Zod 활용 제한

| 모듈 | 클라이언트 사용 | 이유 |
|:---|:---:|:---|
| `src/lib/env.ts` | ❌ 금지 | API 키 노출 위험 |
| `src/types/schemas/sheets.ts` | ✅ 가능 | 데이터 구조만 포함 |
| `src/types/schemas/kis.ts` | ✅ 가능 | 데이터 구조만 포함 |

> **원칙**: 환경변수 접근이 포함된 모듈(`env.ts`)은 절대 클라이언트 번들에 포함되지 않도록 한다. `'server-only'` 패키지로 강제 가능:
> ```typescript
> import 'server-only'  // 클라이언트 import 시 빌드 에러 발생
> ```
