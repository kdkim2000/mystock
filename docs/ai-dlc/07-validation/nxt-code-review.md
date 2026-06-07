# Next.js 코드 품질 검토

| 항목 | 내용 |
|:---|:---|
| 검토일 | 2026-06-07 |
| 검토 범위 | `src/app/`, `src/lib/actions.ts`, `middleware.ts` |
| Next.js 버전 | 15.5 (App Router) |
| 검토자 | Claude Sonnet 4.6 (AI-DLC Phase 7) |

---

## 검토 결과 요약

| 코드 | 항목 | 건수 | 심각도 |
|:---|:---|:---:|:---:|
| NX-001 | `'use client'` 과다/불필요 사용 | 0 | - |
| NX-002 | Client Component에서 DB·서버 로직 직접 호출 | 0 | - |
| NX-003 | `<img>` 태그 (next/image 미사용) | 0 | - |
| NX-004 | `<a href>` (next/link 미사용) | 0 | - |
| NX-005 | Route Handler 인증 체크 누락 | 0 | - |
| NX-006 | Server Action Zod 유효성 검사 누락 | 1 | 낮음 |
| NX-007 | fetch() 캐시 설정 누락 | 0 | - |
| NX-008 | NEXT_PUBLIC_ 없는 env var CC 접근 | 0 | - |
| NX-009 | Server Action 후 revalidatePath 누락 | 0 | - |
| NX-010 | error.tsx / loading.tsx 미정의 | 2 | 중간 |
| NX-011 | params 타입 (Next.js 15 Promise 미적용) | 1 | 중간 |
| NX-012 | Route Handler 간 로직 중복 | 2 | 낮음 |

**종합 판정**: 조건부통과

> 인증·보안·데이터 흐름에서 심각한 결함은 발견되지 않았다. 지적된 이슈는 오류 경험 개선(NX-010), Next.js 15 타입 호환성(NX-011), 코드 유지보수성(NX-012)에 해당하며 런타임 보안 위험은 없다. 아래 권고 사항 적용 후 통과 판정이 가능하다.

---

## 이슈 목록

| NI-ID | 코드 | 파일 | 설명 | 우선순위 | 수정 방향 |
|:---|:---|:---|:---|:---:|:---|
| NI-001 | NX-011 | `src/app/api/ticker/[code]/refresh/route.ts` (L82) | `{ params }: { params: { code: string } }` — Next.js 15에서 Dynamic Route params는 `Promise<{ code: string }>`로 받아야 한다. 현재 동기 접근(`params.code`)은 타입 불일치로 빌드 경고를 유발하며 향후 동작이 보장되지 않는다. | 중간 | `{ params }: { params: Promise<{ code: string }> }`로 변경하고 `const { code } = await params` 로 비동기 추출 |
| NI-002 | NX-011 | `src/app/stock/[code]/page.tsx` (L6-8) | `interface Props { params: { code: string } }` — 페이지 컴포넌트의 params도 `Promise<{ code: string }>`여야 한다. `generateMetadata`와 `StockDetailPage` 양쪽 모두 영향 | 중간 | `params: Promise<{ code: string }>` 로 타입 수정 후 `const { code } = await params` 추출 |
| NI-003 | NX-010 | `src/app/dashboard/` | `error.tsx` 파일 없음 — 대시보드 페이지에서 Sheet API·KIS API 오류 발생 시 전체 앱이 흰 화면으로 크래시된다 | 중간 | `src/app/dashboard/error.tsx` 생성. `'use client'` 선언 필수(Error Boundary는 CC여야 함) |
| NI-004 | NX-010 | `src/app/stock/[code]/` | `error.tsx` 파일 없음 — 종목 상세 페이지에서 비정상 종목코드·API 장애 시 사용자에게 의미 없는 화면이 표시된다 | 중간 | `src/app/stock/[code]/error.tsx` 생성 |
| NI-005 | NX-010 | `src/app/dashboard/` | `loading.tsx` 파일 없음 — SSR prefetch 중 스피너·스켈레톤이 없어 대시보드 첫 진입이 빈 화면으로 보인다 | 낮음 | `src/app/dashboard/loading.tsx` 생성. shadcn Skeleton 컴포넌트 활용 권장 |
| NI-006 | NX-010 | `src/app/stock/[code]/` | `loading.tsx` 파일 없음 — 종목 상세 페이지 진입 시 스켈레톤 없음 | 낮음 | `src/app/stock/[code]/loading.tsx` 생성 |
| NI-007 | NX-006 | `src/lib/actions.ts` (L4-10) | Server Action `revalidateDashboard()`, `revalidateStock(code)` 에 Zod 입력 검증이 없다. 특히 `revalidateStock`은 `code` 파라미터를 외부에서 받으므로 6자리 숫자 형식 검증이 필요하다 | 낮음 | `code` 파라미터에 `z.string().regex(/^\d{6}$/)` 적용 후 검증 실패 시 early return |
| NI-008 | NX-012 | `src/app/api/kis/valuation/route.ts` (L41) | `estimatedRevenue` 조건 분기가 `kis/price/route.ts`의 동일 로직과 다르다 — `kis/valuation`은 `raw.stac_yymm`을 조건으로 사용하지만 `fundamental/route.ts`(L59)와 `refresh/route.ts`(L137)는 `raw.est_sale_amnt`를 조건으로 사용한다. 데이터 일관성 불일치 | 낮음 | 모든 경로에서 `raw.est_sale_amnt ? Number(raw.est_sale_amnt) : undefined` 로 통일 |
| NI-009 | NX-012 | `src/app/api/dart/financial/route.ts`, `src/app/api/ticker/[code]/refresh/route.ts` | 날짜 유틸 함수 `getToday()`, `getOneYearAgo()`, `getCurrentYear()`가 두 파일에 각각 정의되어 있다. `buildDartFinancial`/`buildFinancialYears` 함수도 실질적으로 동일한 로직의 중복 | 낮음 | `src/lib/date-utils.ts` 및 `src/lib/dart-helpers.ts` 로 추출하여 공통화 |

---

## 긍정적 패턴 (잘된 점)

### 1. 일관된 인증 가드 (NX-005 전량 통과)
14개 Route Handler 전체에 `getServerSession(authOptions)` 체크가 존재하며, 미인증 시 `err('Unauthorized', 'AUTH_ERROR', 401)` 로 표준 응답을 반환한다. `/api/auth/[...nextauth]` 는 NextAuth 내부 처리이므로 정상이다.

### 2. Zod 입력 검증 (Route Handler 전량 적용)
`/api/kis/*`, `/api/dart/*`, `/api/fundamental/*`, `/api/ai/analysis` 에서 `codeSchema.safeParse()`가 일관되게 적용되어 있다. 잘못된 종목코드(6자리 숫자 외)는 400으로 거부된다.

### 3. RSC/CC 역할 분리 준수 (NX-001, NX-002 통과)
- 페이지 컴포넌트(`dashboard/page.tsx`, `stock/[code]/page.tsx`)는 RSC로 유지하며 서버 데이터 접근을 수행한다.
- `providers.tsx`는 `QueryClientProvider`라는 클라이언트 전용 컨텍스트만 다루고 `'use client'` 선언이 올바르게 적용되어 있다.
- `src/lib/actions.ts` 는 `'use server'` 선언으로 Server Action 경계가 명확하다.

### 4. HydrationBoundary를 이용한 SSR Prefetch 패턴
`dashboard/page.tsx`에서 `QueryClient.prefetchQuery`로 서버에서 데이터를 미리 패치하고 `HydrationBoundary`로 클라이언트에 전달하는 패턴은 React Query + App Router 공식 권장 방식이다.

### 5. 미들웨어 matcher 최적화
`middleware.ts`의 matcher 패턴이 `_next/static`, `_next/image`, `favicon.ico`를 제외하여 정적 자산에 대한 불필요한 세션 검증이 없다.

### 6. Promise.allSettled 활용
`refresh/route.ts`에서 KIS 7개 섹션 병렬 요청에 `Promise.allSettled`를 사용하여 일부 API 실패 시에도 성공한 섹션의 결과를 반환한다. 부분 성공 허용 패턴이 올바르게 구현되어 있다.

### 7. maxDuration 설정
`refresh/route.ts` 상단에 `export const maxDuration = 60` 이 선언되어 있어 Vercel Pro의 60초 제한이 올바르게 적용된다.

### 8. 세션 만료 UX (SR-005 준수)
`providers.tsx` 내 React Query retry 로직에서 401 오류 시 재시도 차단 (`return false`)이 구현되어 있으며, `layout.tsx`에서 `SessionExpiredPrompt` 컴포넌트가 전역으로 배치되어 있다.

---

## 권고 사항

### P1 (중간 우선순위 — 다음 스프린트 내 적용 권장)

**R-001: Next.js 15 params 타입 수정 (NI-001, NI-002)**

`refresh/route.ts`:
```typescript
// Before
export async function POST(
  request: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code

// After
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
```

`stock/[code]/page.tsx`:
```typescript
// Before
interface Props {
  params: { code: string }
}

// After
interface Props {
  params: Promise<{ code: string }>
}
export async function generateMetadata({ params }: Props) {
  const { code } = await params
  // ...
}
export default async function StockDetailPage({ params }: Props) {
  const { code } = await params
  // ...
}
```

**R-002: error.tsx 파일 생성 (NI-003, NI-004)**

`src/app/dashboard/error.tsx` 및 `src/app/stock/[code]/error.tsx` 를 생성한다. Error Boundary는 반드시 Client Component여야 한다.

```typescript
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-destructive">오류가 발생했습니다: {error.message}</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  )
}
```

### P2 (낮은 우선순위 — 기술 부채 해소 차원)

**R-003: loading.tsx 스켈레톤 추가 (NI-005, NI-006)**

대시보드 및 종목 상세 페이지에 Suspense fallback용 `loading.tsx`를 추가하여 첫 로드 UX를 개선한다. shadcn `Skeleton` 컴포넌트 활용 권장.

**R-004: Server Action 입력 검증 강화 (NI-007)**

`src/lib/actions.ts`의 `revalidateStock`에 코드 형식 검증 추가:
```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const codeSchema = z.string().regex(/^\d{6}$/)

export async function revalidateStock(code: string) {
  const result = codeSchema.safeParse(code)
  if (!result.success) return
  revalidatePath(`/stock/${result.data}`)
}
```

**R-005: estimatedRevenue 조건 분기 통일 (NI-008)**

`src/app/api/kis/valuation/route.ts` L41의 조건을 `raw.est_sale_amnt`로 수정하여 `fundamental/route.ts` 및 `refresh/route.ts`와 일치시킨다.

**R-006: 공통 유틸 추출 (NI-009)**

날짜 유틸과 DART 재무 파싱 로직을 공통 모듈로 추출하여 중복을 제거한다:
- `src/lib/date-utils.ts`: `getToday()`, `getOneYearAgo()`, `getCurrentYear()`
- `src/lib/dart-helpers.ts`: `buildDartFinancial()`, `parseAmount()`, `DartAccountItem` 타입

---

## 검토 범위 파일 목록

| 파일 | 유형 | 판정 |
|:---|:---|:---:|
| `src/app/api/ticker/[code]/refresh/route.ts` | Route Handler | 조건부통과 (NI-001) |
| `src/app/api/sheets/transactions/route.ts` | Route Handler | 통과 |
| `src/app/api/sheets/aggregation/route.ts` | Route Handler | 통과 |
| `src/app/api/sheets/ticker-master/route.ts` | Route Handler | 통과 |
| `src/app/api/kis/price/route.ts` | Route Handler | 통과 |
| `src/app/api/kis/valuation/route.ts` | Route Handler | 조건부통과 (NI-008) |
| `src/app/api/kis/financial/route.ts` | Route Handler | 통과 |
| `src/app/api/kis/daily-price/route.ts` | Route Handler | 통과 |
| `src/app/api/kis/trading-trend/route.ts` | Route Handler | 통과 |
| `src/app/api/kis/opinion/route.ts` | Route Handler | 통과 |
| `src/app/api/dart/financial/route.ts` | Route Handler | 조건부통과 (NI-009) |
| `src/app/api/fundamental/route.ts` | Route Handler | 통과 |
| `src/app/api/ai/analysis/route.ts` | Route Handler | 통과 |
| `src/app/dashboard/page.tsx` | RSC Page | 조건부통과 (NI-003, NI-005) |
| `src/app/stock/[code]/page.tsx` | RSC Page | 조건부통과 (NI-002, NI-004, NI-006) |
| `src/app/layout.tsx` | RSC Layout | 통과 |
| `src/app/page.tsx` | RSC Page | 통과 |
| `src/app/providers.tsx` | CC | 통과 |
| `src/app/auth/signin/page.tsx` | RSC Page | 통과 |
| `src/lib/actions.ts` | Server Action | 조건부통과 (NI-007) |
| `middleware.ts` | Edge Middleware | 통과 |
