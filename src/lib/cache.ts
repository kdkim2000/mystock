import 'server-only'
import { readSheet, writeSheet, appendToSheet } from './sheets'

// globalThis 타입 확장
declare global {
  var _tickerCache:
    | Map<string, { value: unknown; cachedAt: string }>
    | undefined
}

function getMemoryCache(): Map<string, { value: unknown; cachedAt: string }> {
  if (!globalThis._tickerCache) {
    globalThis._tickerCache = new Map()
  }
  return globalThis._tickerCache
}

function isWithinTtl(cachedAt: string, ttlSeconds: number): boolean {
  return (Date.now() - new Date(cachedAt).getTime()) / 1000 < ttlSeconds
}

// ---------------------------------------------------------------------------
// getCached<T>
// ---------------------------------------------------------------------------

/**
 * 3계층 캐시에서 값을 조회한다.
 * 1. globalThis 인메모리 캐시
 * 2. Google Sheets _TICKER_CACHE_ 탭
 * 3. 캐시 미스 → null 반환
 */
export async function getCached<T>(
  key: string,
  ttlSeconds: number,
): Promise<(T & { cachedAt: string }) | null> {
  // 1. globalThis 인메모리 캐시 확인
  const mem = getMemoryCache()
  const memEntry = mem.get(key)
  if (memEntry && isWithinTtl(memEntry.cachedAt, ttlSeconds)) {
    return { ...(memEntry.value as T), cachedAt: memEntry.cachedAt }
  }

  // 2. Google Sheets _TICKER_CACHE_ 탭 확인
  // 행 구조: [key, valueJson, cachedAt]
  // 헤더 행이 없다고 가정 (rows[i] → Sheets rowIndex i+1)
  let rows: string[][]
  try {
    rows = await readSheet('_TICKER_CACHE_!A:C')
  } catch {
    return null
  }

  for (let i = 0; i < rows.length; i++) {
    const [rowKey, rowValue, rowCachedAt] = rows[i]
    if (rowKey !== key) continue
    if (!rowValue || !rowCachedAt) continue
    if (!isWithinTtl(rowCachedAt, ttlSeconds)) break

    // Sheets 히트 → globalThis 갱신
    let parsed: T
    try {
      parsed = JSON.parse(rowValue) as T
    } catch {
      return null
    }
    mem.set(key, { value: parsed, cachedAt: rowCachedAt })
    return { ...parsed, cachedAt: rowCachedAt }
  }

  // 3. 캐시 미스
  return null
}

// ---------------------------------------------------------------------------
// setCached<T>
// ---------------------------------------------------------------------------

/**
 * globalThis와 Google Sheets _TICKER_CACHE_ 탭에 값을 저장(upsert)한다.
 */
export async function setCached<T>(key: string, value: T): Promise<void> {
  const now = new Date().toISOString()

  // 1. globalThis 갱신
  getMemoryCache().set(key, { value, cachedAt: now })

  // 2. Sheets upsert
  // 행 구조: [key, valueJson, cachedAt]
  // rows[i] → Sheets rowIndex i+1 (1-based, 헤더 없음)
  let rows: string[][]
  try {
    rows = await readSheet('_TICKER_CACHE_!A:C')
  } catch {
    rows = []
  }

  const valueJson = JSON.stringify(value)
  const existingIndex = rows.findIndex((row) => row[0] === key)

  if (existingIndex !== -1) {
    // 기존 행 업데이트 (Sheets 행 번호: existingIndex + 1, 1-based)
    const rowNum = existingIndex + 1
    await writeSheet(`_TICKER_CACHE_!A${rowNum}:C${rowNum}`, [
      [key, valueJson, now],
    ])
  } else {
    // 새 행 추가
    await appendToSheet('_TICKER_CACHE_!A:C', [[key, valueJson, now]])
  }
}

// ---------------------------------------------------------------------------
// getAiCached
// ---------------------------------------------------------------------------

const AI_CACHE_TTL_SECONDS = 604800 // 7일

/**
 * AI 분석 결과를 Google Sheets _AI_CACHE_ 탭에서 조회한다.
 * 행 구조: [code, content, cachedAt]
 */
export async function getAiCached(code: string): Promise<string | null> {
  let rows: string[][]
  try {
    rows = await readSheet('_AI_CACHE_!A:C')
  } catch {
    return null
  }

  for (let i = 0; i < rows.length; i++) {
    const [rowCode, rowContent, rowCachedAt] = rows[i]
    if (rowCode !== code) continue
    if (!rowContent || !rowCachedAt) continue
    if (!isWithinTtl(rowCachedAt, AI_CACHE_TTL_SECONDS)) return null
    return rowContent
  }

  return null
}

// ---------------------------------------------------------------------------
// setAiCached
// ---------------------------------------------------------------------------

/**
 * AI 분석 결과를 Google Sheets _AI_CACHE_ 탭에 저장(upsert)한다.
 * 행 구조: [code, content, cachedAt]
 */
export async function setAiCached(code: string, content: string): Promise<void> {
  const now = new Date().toISOString()

  let rows: string[][]
  try {
    rows = await readSheet('_AI_CACHE_!A:C')
  } catch {
    rows = []
  }

  const existingIndex = rows.findIndex((row) => row[0] === code)

  if (existingIndex !== -1) {
    const rowNum = existingIndex + 1
    await writeSheet(`_AI_CACHE_!A${rowNum}:C${rowNum}`, [
      [code, content, now],
    ])
  } else {
    await appendToSheet('_AI_CACHE_!A:C', [[code, content, now]])
  }
}

// ---------------------------------------------------------------------------
// clearCacheByCode
// ---------------------------------------------------------------------------

/**
 * 특정 종목 코드(code)로 시작하는 _TICKER_CACHE_ 행을 무효화한다.
 * Sheets API 행 삭제 대신 빈 문자열로 초기화한다.
 * globalThis 캐시에서도 해당 키를 제거한다.
 */
export async function clearCacheByCode(code: string): Promise<void> {
  // 1. globalThis 인메모리 캐시에서 삭제
  const mem = getMemoryCache()
  for (const k of mem.keys()) {
    if (k.startsWith(code)) {
      mem.delete(k)
    }
  }

  // 2. Sheets _TICKER_CACHE_ 에서 해당 행을 빈 문자열로 초기화
  let rows: string[][]
  try {
    rows = await readSheet('_TICKER_CACHE_!A:C')
  } catch {
    return
  }

  const updates: Promise<void>[] = []
  for (let i = 0; i < rows.length; i++) {
    const rowKey = rows[i][0]
    if (rowKey && rowKey.startsWith(code)) {
      const rowNum = i + 1
      updates.push(
        writeSheet(`_TICKER_CACHE_!A${rowNum}:C${rowNum}`, [['', '', '']]),
      )
    }
  }

  await Promise.all(updates)
}
