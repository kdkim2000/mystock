# Next.js 성능 최적화 가이드

| 항목 | 내용 |
|:---|:---|
| 생성일 | 2026-06-07 |
| 스킬 | `/ai-dlc-nxt-perf-guide` |
| 대상 | Vercel Pro 배포 기준, Next.js 15 App Router |

---

## 1. 성능 목표 (PR-001 ~ PR-004)

| ID | 시나리오 | 목표 | 달성 방법 |
|:---:|:---|:---:|:---|
| PR-001 | Stock detail page (cache HIT) | ≤ 3초 | 3계층 캐시 + React Query staleTime |
| PR-002 | Dashboard load (cache HIT) | ≤ 5초 | SSR prefetch + dynamic import |
| PR-003 | Data refresh (KIS+DART 전체) | ≤ 60초 | maxDuration=60 + Promise.allSettled |
| PR-004 | KIS API 호출 간격 | ≥ 400ms | throttledFetch (KIS_THROTTLE_MS) |

---

## 2. Vercel 번들 크기 관리

### 2.1 250MB 제한 준수 전략

**문제**: `googleapis`(~3MB), `openai`(~500KB) 등 무거운 서버 전용 패키지가 serverless 번들에 포함될 위험

**해결**: `next.config.mjs`의 `serverExternalPackages` 설정

```js
// next.config.mjs
const nextConfig = {
  serverExternalPackages: ['googleapis', 'openai'],  // ✅ 적용됨
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        '**/@swc/core*',        // SWC 네이티브 바이너리
        '**/node_modules/sharp/**',   // 이미지 처리 (Vercel에서 불필요)
        '**/node_modules/canvas/**',  // 캔버스 렌더링
      ]
    }
  }
}
```

**동작 원리**:
- `serverExternalPackages`: 해당 패키지를 serverless 번들에 포함하지 않고 Node.js `require()`로 런타임 로드
- `outputFileTracingExcludes`: 번들 추적에서 지정 파일 제외 → 번들 크기 직접 절감
- `googleapis`와 `openai`는 `import 'server-only'`로 보호된 `src/lib/` 파일에서만 사용 → 클라이언트 번들 노출 없음

**검증**:
```bash
VERCEL_ANALYZE_BUILD_OUTPUT=1 npm run build
# server bundle에서 googleapis, openai가 external로 표시됨을 확인
```

### 2.2 번들 크기 영향 큰 패키지 현황

| 패키지 | 크기 | 사용 위치 | 번들 처리 |
|:---|:---:|:---|:---:|
| `googleapis` | ~3MB | `src/lib/sheets.ts` (server-only) | external ✅ |
| `openai` | ~500KB | `src/lib/ai.ts` (server-only) | external ✅ |
| `recharts` | ~40-50KB | 클라이언트 차트 컴포넌트 | dynamic import ✅ |
| `next-auth` | ~300KB | middleware + lib/auth.ts | 기본 처리 |
| `@tanstack/react-query` | ~50KB | 클라이언트 hooks | 기본 처리 |

---

## 3. serverless 함수 타임아웃 설정

### 3.1 maxDuration (Vercel Pro 필수)

```typescript
// src/app/api/ticker/[code]/refresh/route.ts
export const maxDuration = 60  // 초 단위, Vercel Pro 플랜 필요
```

**필요 이유**: KIS API 7개 섹션 + DART API 2개를 병렬로 호출하더라도 KIS 스로틀(400ms × 요청 수) + 각 API 응답 시간으로 기본 10초 타임아웃 초과 가능

**주의**: `maxDuration = 60`은 Vercel Pro 플랜에서만 지원. 기본 플랜은 10초 제한.

### 3.2 병렬 갱신 패턴

```typescript
// Promise.allSettled로 부분 실패 허용
const results = await Promise.allSettled([
  fetchPrice(code),          // KIS FHKST01010100
  fetchValuation(code),      // KIS FHKST66430200
  fetchFinancial(code),      // KIS FHKST66430300
  fetchDailyPrice(code),     // KIS FHKST03010100 (60일)
  fetchTradingTrend(code),   // KIS FHKST01010900 (30일)
  fetchOpinion(code),        // KIS FHKST01011600
  fetchDart(code),           // DART 재무 + 공시 (내부 병렬)
])
// 실패 섹션은 건너뛰고, 성공한 섹션만 캐시에 저장
```

---

## 4. 3계층 캐시 전략 (`src/lib/cache.ts`)

### 4.1 캐시 계층 구조

```
요청 도착
    │
    ▼
[1] globalThis._tickerCache (in-memory Map)
    ├── HIT + 유효 TTL → 즉시 반환
    └── MISS/만료
         │
         ▼
[2] Google Sheets _TICKER_CACHE_ 탭
    ├── HIT + 유효 TTL → 반환 + globalThis 갱신
    └── MISS/만료
         │
         ▼
[3] 외부 API (KIS / DART / OpenAI)
    └── 응답 → Sheets 저장 → globalThis 갱신 → 반환
```

### 4.2 TTL 설정

| 데이터 유형 | 저장소 | TTL | 이유 |
|:---|:---|:---:|:---|
| KIS 가격·밸류에이션·재무 | Sheets | 30분 | 장 마감 후 데이터 최신성 유지 |
| DART 재무·공시 | Sheets | 1시간 | 공시 빈도 낮음 |
| AI 분석 결과 | Sheets(_AI_CACHE_) | 7일 | 생성 비용 높음, 변동 느림 |
| KIS 토큰 | /tmp + globalThis | 24시간 | KIS 1일 1회 발급 제한 |

### 4.3 캐시 무효화

```typescript
// 강제 갱신 시 캐시 무효화 → 재조회
await clearCacheByCode(code)  // globalThis + Sheets 모두 초기화
// 이후 Promise.allSettled 병렬 API 호출
```

---

## 5. KIS API 스로틀링

### 5.1 throttledFetch 구현 (`src/lib/kis.ts`)

```typescript
async function throttledFetch(url: string, options: RequestInit) {
  const elapsed = Date.now() - (globalThis._kisLastCallTime ?? 0)
  if (elapsed < env.KIS_THROTTLE_MS) {
    await new Promise<void>(r => setTimeout(r, env.KIS_THROTTLE_MS - elapsed))
  }
  globalThis._kisLastCallTime = Date.now()
  return fetch(url, options)
}
```

**설정**: `KIS_THROTTLE_MS` env (기본 400ms). `EGW00133` 오류 방지.

**갱신 시 소요 시간 계산**:
- 7개 섹션 순차 시: 400ms × 7 = 2.8초 (최소)
- 병렬 처리 시: 스로틀이 globalThis로 전역 관리되어 실제로는 순차적으로 400ms 간격 유지

---

## 6. SSR Prefetch 패턴

### 6.1 Dashboard 페이지 (`src/app/dashboard/page.tsx`)

```typescript
// 서버에서 aggregation + transactions를 prefetch
// → HydrationBoundary로 클라이언트에 전달
// → 클라이언트 초기 렌더링 시 즉시 데이터 사용 가능
const queryClient = new QueryClient()
await Promise.all([
  queryClient.prefetchQuery({ queryKey: ['aggregation'], queryFn: ... }),
  queryClient.prefetchQuery({ queryKey: ['transactions'], queryFn: ... }),
])
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <DashboardClient />
  </HydrationBoundary>
)
```

**효과**: Dashboard 최초 로드 시 KPI 카드·테이블이 즉시 렌더링 (waterfall 없음)

### 6.2 Stock Detail 페이지

Stock detail은 13개 섹션이 각자 독립적인 API를 호출. SSR prefetch를 적용하면 서버 응답 지연이 발생하므로, 각 섹션의 독립 Skeleton → 데이터 전환 패턴이 더 적합.

---

## 7. API 라우트 Cache-Control 정책

모든 API 라우트는 인증 세션 기반 개인 데이터를 반환:
- Next.js 기본: `Cache-Control: no-store, must-revalidate`
- 추가 설정 불필요 (CDN 캐시 부적합)
- 서버 사이드 캐시(3계층)가 중복 API 호출 방지를 담당

---

## 8. 검증 체크리스트

| 항목 | 확인 방법 | 기준 |
|:---|:---|:---:|
| 번들 크기 | `npm run build` 출력 | ≤ 250MB |
| googleapis 외부화 | 빌드 로그 `serverExternalPackages` | external |
| maxDuration | Vercel 배포 설정 | 60초 |
| 캐시 HIT 성능 | Chrome DevTools Network | 3초/5초 이내 |
| KIS 스로틀 | API 호출 간격 로그 | ≥ 400ms |
