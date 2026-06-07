# API 호출 패턴 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | API 호출 패턴 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock의 외부 API 호출 패턴을 정의한다. Next.js 15 App Router 환경에서 **서버사이드 native fetch**를 기본으로 사용한다. KIS Open API의 400ms 스로틀 구현, Google Sheets 클라이언트, DART·OpenAI 패턴을 포함한다.

> axios는 사용하지 않는다. Next.js 15 App Router는 native `fetch`를 확장하여 캐싱·재검증 기능을 제공한다.

---

## 2. 공통 API 응답 유틸 (`src/lib/api-response.ts`)

```typescript
import { NextResponse } from 'next/server'

export function ok<T>(data: T, cachedAt?: string) {
  return NextResponse.json({
    data,
    ...(cachedAt && { cachedAt }),
  })
}

export function err(message: string, code: string, status: number) {
  return NextResponse.json(
    { error: message, code },
    { status }
  )
}
```

사용 예:
```typescript
// API Route Handler에서
return ok(stockPrice, cacheEntry.cachedAt)
return err('KIS Rate Limit exceeded', 'KIS_RATE_LIMIT', 429)
return err('Unauthorized', 'NO_SESSION', 401)
```

---

## 3. KIS Open API 클라이언트 (`src/lib/kis.ts`)

### 3.1 기본 설정

```typescript
const KIS_BASE_URL =
  process.env.KIS_APP_SVR === 'vps'
    ? 'https://openapivts.koreainvestment.com:29443'  // 모의투자
    : 'https://openapi.koreainvestment.com:9443'       // 실전투자
```

### 3.2 400ms 스로틀 구현 (BR-005)

```typescript
// 서버리스 인스턴스 내 공유 (globalThis 활용)
declare global {
  var _kisLastCallTime: number | undefined
}

async function throttledKisFetch(url: string, options: RequestInit): Promise<Response> {
  const throttleMs = Number(process.env.KIS_THROTTLE_MS ?? 400)
  const lastCallTime = globalThis._kisLastCallTime ?? 0
  const elapsed = Date.now() - lastCallTime

  if (elapsed < throttleMs) {
    await new Promise(r => setTimeout(r, throttleMs - elapsed))
  }

  globalThis._kisLastCallTime = Date.now()
  return fetch(url, options)
}
```

### 3.3 KIS 토큰 관리

```typescript
import fs from 'fs'
import path from 'path'
import type { KisToken } from '@/types/kis'

declare global {
  var _kisToken: KisToken | undefined
}

const TOKEN_FILE = process.env.VERCEL
  ? '/tmp/kis-token.json'
  : path.join(process.cwd(), '.next/cache/kis-token.json')

async function getKisToken(): Promise<KisToken> {
  // 1. globalThis 확인
  if (globalThis._kisToken && new Date(globalThis._kisToken.expiresAt) > new Date()) {
    return globalThis._kisToken
  }

  // 2. 파일 캐시 확인 (/tmp/ 또는 .next/cache/)
  try {
    const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'))
    if (new Date(cached.expiresAt) > new Date()) {
      globalThis._kisToken = cached
      return cached
    }
  } catch {}

  // 3. 신규 발급 (1일 1회 제한)
  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  })
  const data = await res.json()
  const token: KisToken = {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }

  // 저장
  globalThis._kisToken = token
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true })
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token))

  return token
}

// 만료 1시간 전 소프트 갱신 (레이스 컨디션 방지)
export function softExpireKisToken(): void {
  if (globalThis._kisToken) {
    const softExpiry = new Date(globalThis._kisToken.expiresAt)
    softExpiry.setHours(softExpiry.getHours() - 1)
    globalThis._kisToken.expiresAt = softExpiry
  }
}
```

### 3.4 kisRequest 공통 함수

```typescript
export async function kisRequest<T>(
  path: string,
  params: Record<string, string>,
  trId: string
): Promise<T> {
  const token = await getKisToken()
  const url = `${KIS_BASE_URL}${path}?${new URLSearchParams(params)}`

  const res = await throttledKisFetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token.accessToken}`,
      'appkey': process.env.KIS_APP_KEY!,
      'appsecret': process.env.KIS_APP_SECRET!,
      'tr_id': trId,
    },
    cache: 'no-store',  // KIS 응답은 캐시하지 않음 (Sheets 캐시로 관리)
  })

  if (!res.ok) {
    const body = await res.json()
    if (body.msg_cd === 'EGW00133') {
      throw Object.assign(new Error('KIS Rate Limit'), { code: 'KIS_RATE_LIMIT' })
    }
    if (body.msg_cd === 'EGW00201') {
      softExpireKisToken()  // 토큰 무효화 후 재발급 유도
      throw Object.assign(new Error('KIS Token Invalid'), { code: 'KIS_TOKEN_INVALID' })
    }
    throw new Error(`KIS_ERROR: ${body.msg1 ?? res.status}`)
  }

  return res.json()
}
```

---

## 4. Google Sheets API 클라이언트 (`src/lib/sheets.ts`)

```typescript
import { google } from 'googleapis'
import type { sheets_v4 } from 'googleapis'

function getGoogleAuth() {
  // Vercel 배포: 환경변수에 JSON 문자열로 저장
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }

  // 로컬 개발: 파일 경로
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = getGoogleAuth()
  return google.sheets({ version: 'v4', auth })
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

/** 시트 범위 읽기 */
export async function readSheet(range: string): Promise<string[][]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  })
  return res.data.values ?? []
}

/** 행 추가 */
export async function appendRow(sheetName: string, values: string[]): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

/** 특정 행 업데이트 */
export async function updateRow(
  range: string,
  values: string[]
): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}
```

---

## 5. 3계층 캐시 로직 (`src/lib/cache.ts`)

```typescript
import { readSheet, appendRow, updateRow } from '@/lib/sheets'
import type { TickerCacheEntry } from '@/types/sheets'

const CACHE_SHEET = '_TICKER_CACHE_'
const DEFAULT_TTL_MINUTES = 30

export async function getCached<T>(
  code: string,
  section: string,
  fetcher: () => Promise<T>,
  ttlMinutes = DEFAULT_TTL_MINUTES
): Promise<{ data: T; cachedAt?: string }> {
  const key = `${code}_${section}`

  // Sheets 캐시 조회
  const rows = await readSheet(`${CACHE_SHEET}!A:C`)
  const rowIndex = rows.findIndex(r => r[0] === key)

  if (rowIndex > 0) {
    const [, value, cachedAt] = rows[rowIndex]
    const ageMs = Date.now() - new Date(cachedAt).getTime()

    if (ageMs < ttlMinutes * 60 * 1000) {
      return { data: JSON.parse(value) as T, cachedAt }
    }
  }

  // 캐시 MISS: 외부 API 호출
  const data = await fetcher()
  const cachedAt = new Date().toISOString()
  const valueStr = JSON.stringify(data)

  // Sheets 저장 (갱신 또는 추가)
  if (rowIndex > 0) {
    const range = `${CACHE_SHEET}!B${rowIndex + 1}:C${rowIndex + 1}`
    await updateRow(range, [valueStr, cachedAt])
  } else {
    await appendRow(CACHE_SHEET, [key, valueStr, cachedAt])
  }

  return { data }
}
```

---

## 6. DART API 클라이언트 (`src/lib/dart.ts`)

```typescript
const DART_BASE = 'https://opendart.fss.or.kr/api'

export async function dartRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = `${DART_BASE}/${endpoint}?${new URLSearchParams({
    crtfc_key: process.env.DART_API_KEY!,
    ...params,
  })}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`DART_ERROR: ${res.status}`)
  return res.json()
}
```

CORPCODE.xml 캐시 (`/tmp/corpcode.xml`): 반복 다운로드 방지 (BR-016).

---

## 7. OpenAI API 클라이언트 (`src/lib/ai.ts`)

```typescript
import OpenAI from 'openai'
import type { SheetTransactionRow } from '@/types/sheets'
import type { AiAnalysisResult } from '@/types/ai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateAiAnalysis(
  code: string,
  stockName: string,
  trades: SheetTransactionRow[]
): Promise<AiAnalysisResult> {
  const tradeContext = trades
    .filter(t => t.Ticker === stockName)
    .map(t => `${t.Date} ${t.Type} ${t.Quantity}주 @${t.Price.toLocaleString()}원 메모: ${t.Journal}`)
    .join('\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 한국 주식 투자 분석 전문가입니다. 투자자의 매매 내역을 분석하여 객관적인 투자 조언을 제공합니다.',
      },
      {
        role: 'user',
        content: `종목: ${stockName} (${code})\n\n매매 내역:\n${tradeContext}\n\n위 매매 내역을 분석하여 투자 패턴, 리스크, 개선점을 설명해주세요.`,
      },
    ],
    max_tokens: 1000,
  })

  return {
    code,
    content: completion.choices[0].message.content ?? '',
    generatedAt: new Date().toISOString(),
    model: 'gpt-4o-mini',
  }
}
```

---

## 8. 에러 처리 표준

| 에러 코드 | HTTP 상태 | 처리 방법 |
|:---|:---:|:---|
| `KIS_RATE_LIMIT` (EGW00133) | 429 | 클라이언트 Toast: "잠시 후 다시 시도" |
| `KIS_TOKEN_INVALID` (EGW00201) | 500 | softExpireKisToken() → 자동 재발급 |
| `NO_SESSION` | 401 | SessionExpiredPrompt 표시 |
| `DART_ERROR` | 500 | ErrorCard 표시 + 재시도 버튼 |
| `TIMEOUT` | 504 | Toast: "갱신 시간 초과 (60초)" |
