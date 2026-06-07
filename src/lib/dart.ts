import 'server-only'
import { env } from './env'

const DART_BASE = 'https://opendart.fss.or.kr/api'

declare global {
  var _dartCorpCodes: Map<string, string> | undefined
}

/**
 * DART 기업코드 조회.
 * ticker: 한국어 종목명 (예: "삼성전자")
 *
 * 1. globalThis._dartCorpCodes 에 캐싱된 값이 있으면 즉시 반환.
 * 2. 없으면 DART company.json 검색 API로 corp_code를 가져와 Map에 저장 후 반환.
 */
export async function getCorpCode(ticker: string): Promise<string> {
  globalThis._dartCorpCodes = globalThis._dartCorpCodes ?? new Map()

  const cached = globalThis._dartCorpCodes.get(ticker)
  if (cached !== undefined) {
    return cached
  }

  const url = `${DART_BASE}/company.json?crtfc_key=${env.DART_API_KEY}&corp_name=${encodeURIComponent(ticker)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`DART_ERROR: company.json HTTP ${res.status}`)
  }

  const data = (await res.json()) as {
    status: string
    message: string
    corp_code?: string
  }

  if (data.status !== '000' || !data.corp_code) {
    throw new Error(`DART_ERROR: ${data.message ?? `corp_code not found for "${ticker}"`}`)
  }

  globalThis._dartCorpCodes.set(ticker, data.corp_code)

  return data.corp_code
}

/**
 * DART API 범용 요청 함수.
 * endpoint: API 경로 (예: "fnlttSinglAcntAll.json")
 * params:   crtfc_key 를 제외한 나머지 쿼리 파라미터
 */
export async function dartRequest<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T> {
  const query = new URLSearchParams({
    ...params,
    crtfc_key: env.DART_API_KEY,
  }).toString()

  const url = `${DART_BASE}/${endpoint}?${query}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`DART_ERROR: ${endpoint} HTTP ${res.status}`)
  }

  const data = (await res.json()) as { status: string; message: string } & T

  if (data.status !== '000') {
    throw new Error(`DART_ERROR: ${data.message}`)
  }

  return data as T
}
