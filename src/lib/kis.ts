import 'server-only'
import fs from 'fs'
import path from 'path'
import type { KisToken } from '@/types/kis'
import { env } from './env'

// ---------------------------------------------------------------------------
// globalThis 선언
// ---------------------------------------------------------------------------

declare global {
  var _kisToken: KisToken | undefined
  var _kisLastCallTime: number | undefined
}

// ---------------------------------------------------------------------------
// KIS Base URL
// ---------------------------------------------------------------------------

const KIS_BASE =
  env.KIS_APP_SVR === 'vps'
    ? 'https://openapivts.koreainvestment.com:29443'
    : 'https://openapi.koreainvestment.com:9443'

// ---------------------------------------------------------------------------
// Token file path (Vercel /tmp, local .next/cache)
// ---------------------------------------------------------------------------

const TOKEN_FILE_PATH = path.join('/tmp', 'kis-token.json')

// ---------------------------------------------------------------------------
// softExpireKisToken
// ---------------------------------------------------------------------------

/**
 * globalThis._kisToken 의 expiresAt 을 현재 시각 + 1초로 설정하여 즉시 만료 처리한다.
 * 다음 getKisToken() 호출 시 새 토큰을 발급받는다.
 */
export function softExpireKisToken(): void {
  if (globalThis._kisToken) {
    const expireAt = new Date(Date.now() + 1000).toISOString()
    globalThis._kisToken = { ...globalThis._kisToken, expiresAt: expireAt }
  }
}

// ---------------------------------------------------------------------------
// getKisToken
// ---------------------------------------------------------------------------

/**
 * 3계층 순서로 KIS 액세스 토큰을 조회한다.
 * 1. globalThis 인메모리 → expiresAt 유효 시 반환
 * 2. /tmp/kis-token.json 파일 → expiresAt 유효 시 globalThis 갱신 후 반환
 * 3. KIS OAuth 신규 발급 → globalThis + 파일 저장 후 반환
 */
export async function getKisToken(): Promise<KisToken> {
  // 1. globalThis 캐시 확인
  if (
    globalThis._kisToken &&
    new Date(globalThis._kisToken.expiresAt) > new Date()
  ) {
    return globalThis._kisToken
  }

  // 2. 파일 캐시 확인
  try {
    const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8')
    const token = JSON.parse(raw) as KisToken
    if (new Date(token.expiresAt) > new Date()) {
      globalThis._kisToken = token
      return token
    }
  } catch {
    // 파일 없거나 파싱 실패 → 무시하고 신규 발급
  }

  // 3. KIS OAuth 토큰 신규 발급
  const res = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`KIS token fetch failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as {
    access_token: string
    token_type: string
    access_token_token_expired: string
  }

  const token: KisToken = {
    accessToken: data.access_token,
    tokenType: 'Bearer',
    expiresAt: data.access_token_token_expired,
  }

  // globalThis 갱신
  globalThis._kisToken = token

  // 파일 저장 (실패해도 무시)
  try {
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(token), 'utf-8')
  } catch {
    // /tmp 접근 불가 환경(로컬 등)에서는 무시
  }

  return token
}

// ---------------------------------------------------------------------------
// throttledFetch
// ---------------------------------------------------------------------------

/**
 * KIS API Rate Limit(기본 400ms 간격)을 준수하는 fetch 래퍼.
 */
async function throttledFetch(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const now = Date.now()
  const elapsed = now - (globalThis._kisLastCallTime ?? 0)
  if (elapsed < env.KIS_THROTTLE_MS) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, env.KIS_THROTTLE_MS - elapsed),
    )
  }
  globalThis._kisLastCallTime = Date.now()
  return fetch(url, options)
}

// ---------------------------------------------------------------------------
// kisRequest
// ---------------------------------------------------------------------------

/**
 * KIS Open API GET 요청 공통 함수.
 *
 * @param apiPath   - API 경로 (예: '/uapi/domestic-stock/v1/quotations/inquire-price')
 * @param params    - 쿼리 파라미터
 * @param trId      - KIS TR ID (예: 'FHKST01010100')
 * @param outputKey - 응답에서 꺼낼 키: 단건은 'output', 목록 배열은 'output2' (기본: 'output')
 * @returns         - 응답 output 객체 (T 타입)
 */
export async function kisRequest<T>(
  apiPath: string,
  params: Record<string, string>,
  trId: string,
  outputKey: 'output' | 'output2' = 'output',
): Promise<T> {
  const token = await getKisToken()
  const url = `${KIS_BASE}${apiPath}?${new URLSearchParams(params).toString()}`

  const res = await throttledFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
      tr_id: trId,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

  const data = (await res.json()) as {
    rt_cd?: string
    msg_cd?: string
    msg1?: string
    [key: string]: unknown
  }

  // Rate Limit 오류
  if (data.rt_cd !== '0' || data.msg_cd === 'EGW00133') {
    throw new Error('KIS_RATE_LIMIT')
  }

  // 토큰 만료 오류
  if (data.msg_cd === 'EGW00201') {
    softExpireKisToken()
    throw new Error('KIS_TOKEN_EXPIRED')
  }

  // output / output2 키가 있으면 해당 값 반환, 없으면 data 전체 반환
  return (data[outputKey] ?? data) as T
}
