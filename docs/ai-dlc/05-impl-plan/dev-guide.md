# 개발 가이드

| 항목 | 내용 |
|:---|:---|
| 문서명 | 개발 가이드 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개발 환경 설정

### 1.1 사전 요구사항

| 도구 | 버전 | 확인 명령 |
|:---|:---|:---|
| Node.js | ≥ 20.x | `node --version` |
| npm | ≥ 10.x | `npm --version` |
| Git | 최신 | `git --version` |

**외부 서비스 준비 사항**:
- Google Cloud Console 프로젝트 + 서비스 계정 (Sheets API v4 활성화)
- Google OAuth 2.0 웹 클라이언트 (승인된 리다이렉션 URI 설정)
- KIS Open API 앱키·시크릿 발급 (https://apiportal.kbs.or.kr)
- DART Open API 인증키 발급 (https://opendart.fss.or.kr)
- OpenAI API 키 발급 (https://platform.openai.com)

### 1.2 초기 설정 단계

```bash
# 1. 저장소 클론 및 의존성 설치
git clone <repo-url>
cd mystock
npm install

# 2. 환경변수 파일 생성
cp env.example .env.local
# .env.local 파일을 편집하여 아래 변수 입력
```

**.env.local 필수 변수**:
```bash
# NextAuth
AUTH_SECRET=<openssl rand -base64 32 출력값>
GOOGLE_CLIENT_ID=<OAuth 클라이언트 ID>
GOOGLE_CLIENT_SECRET=<OAuth 클라이언트 시크릿>
ALLOWED_EMAIL=<본인 Google 이메일> # 단일 사용자 접근 제어

# Google Sheets
GOOGLE_SPREADSHEET_ID=<스프레드시트 ID (URL에서 추출)>
GOOGLE_SHEET_NAME=매매내역
GOOGLE_APPLICATION_CREDENTIALS=<서비스 계정 JSON 파일 경로>
# (Vercel 배포 시) GOOGLE_SERVICE_ACCOUNT_JSON=<JSON 전체를 한 줄로>

# 외부 API
DART_API_KEY=<DART 인증키>
KIS_APP_KEY=<KIS 앱키>
KIS_APP_SECRET=<KIS 앱시크릿>
OPENAI_API_KEY=sk-...
```

### 1.3 Google Sheets 초기 설정

스프레드시트에 다음 5개 탭을 수동으로 생성한다:

| 탭명 | 용도 | 헤더 행 |
|:---|:---|:---|
| `매매내역` | 거래 데이터 저장 | Date, Ticker, Type, Quantity, Price, Journal, Tags |
| `_TICKER_CACHE_` | KIS/DART 캐시 (30분/1시간 TTL) | key, value, cachedAt |
| `_AI_CACHE_` | AI 분석 캐시 (7일 TTL) | code, content, cachedAt |
| `종목코드마스터` | 종목명↔코드 매핑 | Ticker, Code |
| `종목별집계` | 보유·손익 집계 | Ticker, Code, Holdings, AvgPrice, TotalBuy, RealizedPnL, TradeCount, WinCount |

### 1.4 개발 서버 실행

```bash
npm run dev   # http://localhost:3000 에서 실행
```

Google OAuth 콘솔에 로컬 URI 추가 필요:
- 승인된 JavaScript 원본: `http://localhost:3000`
- 승인된 리다이렉션 URI: `http://localhost:3000/api/auth/callback/google`

---

## 2. 파일 네이밍 규칙

| 대상 | 규칙 | 예시 |
|:---|:---|:---|
| 컴포넌트 파일 | `kebab-case.tsx` | `price-card.tsx` |
| 컴포넌트 export | PascalCase named export | `export function PriceCard()` |
| 페이지 파일 | Next.js 규약 (`page.tsx`) | `app/stock/[code]/page.tsx` |
| API Route 파일 | Next.js 규약 (`route.ts`) | `app/api/kis/price/route.ts` |
| 훅 파일 | `use-[name].ts` | `use-stock-price.ts` |
| 훅 export | camelCase | `export function useStockPrice()` |
| 타입 파일 | `kebab-case.ts` | `src/types/sheets.ts` |
| 유틸/lib 파일 | `kebab-case.ts` | `src/lib/kis.ts` |
| Zod 스키마 파일 | `kebab-case.ts` | `src/types/schemas/kis.ts` |
| 테스트 파일 | `[name].test.ts` | `indicators.test.ts` |
| 상수 파일 | `kebab-case.ts` | `src/constants/sections.ts` |

**폴더 네이밍**: 항상 `kebab-case` (Next.js App Router 규약 따름)

---

## 3. TypeScript 컨벤션

### 3.1 엄격 타입 규칙

- `strict: true` — `any` 사용 금지
  - 불가피한 경우: `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + 이유 주석
- `!` non-null assertion: 사용 이유 주석 필수
  - 예: `session.user!.email // middleware guarantees session.user exists here`
- API 응답 타입: Zod schema `z.infer<typeof XxxSchema>` 사용 (별도 interface 정의 금지)

### 3.2 환경변수 접근 규칙

```typescript
// ❌ 잘못된 예: process.env 직접 접근
const apiKey = process.env.KIS_APP_KEY

// ✅ 올바른 예: src/lib/env.ts 경유
import { env } from '@/lib/env'
const apiKey = env.KIS_APP_KEY
```

`env.ts`는 서버 전용 (`import 'server-only'`). 클라이언트 컴포넌트 import 금지.

### 3.3 Props 타입 정의

```typescript
// ❌ 인라인 타입
function PriceCard({ code, price }: { code: string; price: number }) {}

// ✅ 명시적 interface
interface PriceCardProps {
  code: string
  price: number
}
function PriceCard({ code, price }: PriceCardProps) {}
```

### 3.4 Import 정렬 (IDE 설정 권장)

```typescript
// 1. 외부 패키지 (next, react, 라이브러리)
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

// 2. 내부 절대 경로 (@/* alias)
import { env } from '@/lib/env'
import type { StockPrice } from '@/types/kis'

// 3. 상대 경로 (동일 폴더 내)
import { formatPrice } from './utils'
```

---

## 4. 컴포넌트 작성 규칙

### 4.1 Server vs Client Component 판단

`'use client'` 추가 기준 (하나라도 해당하면 반드시 추가):

| 사용 기능 | 예시 |
|:---|:---|
| React 훅 | `useState`, `useEffect`, `useRef`, `useReducer` |
| 이벤트 핸들러 | `onClick`, `onChange`, `onSubmit` |
| TanStack Query | `useQuery`, `useMutation`, `useQueryClient` |
| Next-auth | `useSession`, `signIn`, `signOut` |
| Next-themes | `useTheme` |
| Next.js 클라이언트 훅 | `useRouter`, `useSearchParams`, `useParams` |
| Recharts 컴포넌트 | `BarChart`, `LineChart`, `RadarChart`, `ComposedChart` |
| 브라우저 API | `IntersectionObserver`, `localStorage`, `window` |

Server Component에서 **절대 금지**:
- `GOOGLE_*`, `KIS_*`, `OPENAI_*`, `DART_*` 환경변수 직접 참조
- `useState`, `useEffect` (컴파일 에러 발생)
- Recharts 컴포넌트 직접 렌더링

### 4.2 export 방식

```typescript
// ✅ named export 권장
export function PriceCard({ code }: PriceCardProps) { ... }

// ❌ default export 지양 (트리 쉐이킹, 이름 일관성)
export default function PriceCard() { ... }
```

예외: `page.tsx`, `layout.tsx`, `route.ts`는 Next.js 규약상 default export

### 4.3 비동기 컴포넌트 3-상태 패턴

```tsx
function AsyncSection({ code }: { code: string }) {
  const { data, isLoading, error } = useStockPrice(code)

  if (isLoading) return <Skeleton className="h-32 w-full rounded-lg" />
  if (error) return <ErrorCard message="데이터 조회 실패" />

  return <div>{/* 실제 콘텐츠 */}</div>
}
```

---

## 5. API Route Handler 작성 규칙

### 5.1 공통 패턴 (모든 Route Handler에 적용)

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'
import { getCached, setCached } from '@/lib/cache'
import { z } from 'zod'

const querySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'code must be 6-digit number'),
})

export async function GET(request: Request) {
  // 1. 인증 — 401은 리다이렉트 없이 JSON 응답 (SR-005)
  const session = await getServerSession(authOptions)
  if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)

  // 2. 입력 검증 (Zod safeParse)
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR', 400)

  // 3. 캐시 조회
  const cacheKey = `${parsed.data.code}_section`
  const cached = await getCached<SectionType>(cacheKey, 30 * 60)
  if (cached) return ok(cached, cached.cachedAt)

  // 4. 외부 API 호출 (try-catch로 에러 처리)
  try {
    const data = await externalApiCall(parsed.data.code)
    await setCached(cacheKey, data)
    return ok(data)
  } catch (e) {
    if (e instanceof Error && e.message === 'KIS_RATE_LIMIT') {
      return err('KIS rate limit exceeded. Retry after 400ms.', 'RATE_LIMIT', 429)
    }
    return err('External API error', 'EXTERNAL_API_ERROR', 500)
  }
}
```

### 5.2 maxDuration 설정 — refresh 전용

```typescript
// src/app/api/ticker/[code]/refresh/route.ts에만 적용
export const maxDuration = 60  // Vercel Pro plan 필수
```

다른 Route Handler에는 적용하지 않는다 (기본 10초로 충분).

---

## 6. Git 전략

### 6.1 브랜치 네이밍

```
main              → 배포 브랜치 (Vercel 자동 배포)
01-planning       → Phase 1 기획 산출물
02-analysis       → Phase 2 분석 산출물
03-design         → Phase 3 설계 산출물
04-setup          → Phase 4 환경설정 가이드
05-impl-plan      → Phase 5 구현계획 (현재)
06-impl-types     → Phase 6: 타입 정의 구현
06-impl-lib       → Phase 6: lib 레이어 구현
06-impl-api       → Phase 6: API Route Handler 구현
06-impl-dashboard → Phase 6: 대시보드 구현
06-impl-stock     → Phase 6: 종목상세 구현
07-validation     → Phase 7 코드 검증
```

### 6.2 커밋 타입

| type | 사용 기준 | 예시 |
|:---|:---|:---|
| `feat` | 새 기능 구현 (Route Handler, 컴포넌트, 훅) | `feat: KIS 실시간 시세 조회 API Route Handler` |
| `fix` | 버그 수정 | `fix: KIS 토큰 만료 후 재발급 미작동 수정` |
| `refactor` | 기능 변경 없는 구조 개선 | `refactor: cache.ts 3계층 로직 분리` |
| `docs` | 문서, AI-DLC 산출물, 주석 | `docs: Phase 5-4 개발 가이드 생성` |
| `chore` | 패키지, 환경설정, CI | `chore: vitest 설정 추가` |
| `test` | 테스트 코드 | `test: indicators RSI-14 계산 단위 테스트` |

### 6.3 커밋 메시지 형식

```
<type>: <한국어 요약> (50자 이내)

[선택] 변경 내용 상세 설명

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### 6.4 커밋 금지 사항

| 금지 | 이유 |
|:---|:---|
| `--no-verify` 사용 | pre-commit 훅 우회 (코드 품질 보장 파괴) |
| `--amend` (명시 요청 없이) | 게시된 커밋 히스토리 변조 |
| `git push --force` (main) | 팀 공유 히스토리 파괴 |
| `.env.local` 커밋 | API 키 노출 |
| 바이너리·대용량 파일 커밋 | 저장소 크기 증가 |

### 6.5 PR 전략

- Phase 단위로 main에 merge (각 Phase 브랜치 → PR → main)
- PR 제목: `[Phase N] <Phase 목적 요약>`
- PR 설명: 산출물 목록, 변경 사항, 검증 결과

---

## 7. 테스트 전략

### 7.1 명령어

```bash
npm test                                          # Vitest 전체 실행 (watch 모드)
npm test -- --run                                 # 단회 실행
npm test -- --run src/lib/indicators.test.ts      # 단일 파일
npm run lint                                      # ESLint 검사
npm run build                                     # TypeScript 컴파일 + Next.js 빌드
```

### 7.2 단위 테스트 필수 대상

| 파일 | 테스트 항목 |
|:---|:---|
| `src/lib/indicators.ts` | RSI-14 과매수(≥70)/과매도(≤30) 경계값, MACD 크로스오버 |
| `src/lib/cache.ts` | getCached TTL 만료 시 null 반환, setCached 저장 후 조회 |
| `src/types/schemas/sheets.ts` | SheetTransactionRowSchema 유효·무효 데이터 |
| `src/types/schemas/kis.ts` | StockPriceSchema parse 성공·실패 |
| `src/lib/env.ts` | 필수 변수 누락 시 ZodError, KIS_THROTTLE_MS 기본값 400 |

### 7.3 통합 테스트 (수동)

```bash
# KIS API 응답 확인
curl -b cookies.txt http://localhost:3000/api/kis/price?code=005930

# 캐시 HIT 확인 (2번째 요청에서 cachedAt 포함)
curl http://localhost:3000/api/kis/price?code=005930 | jq '.cachedAt'

# 새로고침 60초 이내 완료 확인
curl -X POST http://localhost:3000/api/ticker/005930/refresh -b cookies.txt

# AI 분석 강제 갱신
curl -X POST http://localhost:3000/api/ai/analysis \
  -H "Content-Type: application/json" \
  -d '{"code":"005930"}' -b cookies.txt
```

---

## 8. 성능 목표 및 측정

| 시나리오 | 목표 | 측정 방법 |
|:---|:---:|:---|
| 대시보드 로드 (캐시 HIT) | ≤ 5초 | 브라우저 DevTools → Network → DOMContentLoaded |
| 종목상세 로드 (캐시 HIT) | ≤ 3초 | 브라우저 DevTools → Network → DOMContentLoaded |
| 전체 새로고침 (KIS+DART) | ≤ 60초 | RefreshAllButton 클릭 → 완료 Toast까지 시간 |
| KIS API 호출 간격 | ≥ 400ms | Network 탭 타임라인 확인 |

**Vercel 번들 크기 확인**:
```bash
VERCEL_ANALYZE_BUILD_OUTPUT=1 npm run build
```
- 목표: 함수 번들 ≤ 250MB (googleapis 제외 적용 시)

---

## 9. 보안 체크리스트

배포 전 필수 확인:

- [ ] `.env.local`이 `.gitignore`에 포함되어 있는가
- [ ] `git log --all -- .env.local`으로 과거 커밋에 .env.local 없음 확인
- [ ] 모든 Route Handler에 `getServerSession(authOptions)` 호출 있는가
- [ ] `src/lib/env.ts` 파일 상단에 `import 'server-only'` 있는가
- [ ] `src/lib/sheets.ts`, `src/lib/kis.ts`, `src/lib/dart.ts`, `src/lib/ai.ts`에 `import 'server-only'` 있는가
- [ ] Recharts 컴포넌트 포함 파일에 `'use client'` 선언 있는가
- [ ] `ALLOWED_EMAIL` 환경변수 설정 완료 (단일 사용자 보호)
- [ ] `npx tsc --noEmit` 타입 오류 없음
- [ ] `npm run lint` ESLint 오류 없음
- [ ] Vercel 빌드 후 클라이언트 번들에 `KIS_APP_KEY` 등 서버 전용 환경변수 노출 없음
