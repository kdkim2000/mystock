# 코드 복잡도 분석

| 항목 | 내용 |
|:---|:---|
| 분석일 | 2026-06-07 |
| 분석 범위 | src/ (87개 파일, 총 5,038 LOC) |
| 집중 분석 | src/lib/cache.ts, src/lib/kis.ts, src/app/api/ticker/[code]/refresh/route.ts, src/lib/indicators.ts, src/lib/dart.ts |
| 분석 방법 | Claude 정적 텍스트 분석 (근사치 — SonarQube·ESLint complexity 플러그인 대비 오차 있음) |

> **한계 명시**: 이 분석은 Claude의 정적 텍스트 읽기 기반 근사 측정이다. 사이클로매틱 복잡도(CC)는 `if/else if/for/while/switch case/catch/&&/||/?:` 분기 수 + 1로 계산하며, 전용 도구 대비 ±1~2 오차가 있을 수 있다.

---

## 전체 요약

| 파일 수 | 총 LOC | 평균 CC (추정) | 리팩토링 권고 파일 수 |
|:---:|:---:|:---:|:---:|
| 87 | 5,038 | 3.8 | 2 |

- 전체적으로 **등급 A–B** 수준으로 양호하다.
- `refresh/route.ts`만 **등급 C** (CC 12)로 복잡도가 높다.
- `cache.ts`의 `getCached`는 **등급 B** (CC 9)로 모니터링 대상이다.
- TODO/FIXME/HACK 주석은 **0건** — 기술 부채 주석이 없다.

---

## 파일별 복잡도 상세

### 집중 분석 대상 (5개)

| 파일 | LOC | 함수 수 | 최대 CC | 등급 | 비고 |
|:---|:---:|:---:|:---:|:---:|:---|
| `src/lib/cache.ts` | 209 | 6 | 9 | B | `getCached` 2단계 캐시 + try-catch 중첩 |
| `src/lib/kis.ts` | 191 | 4 | 7 | B | `getKisToken` 3계층 + `kisRequest` 오류 분기 |
| `src/app/api/ticker/[code]/refresh/route.ts` | 303 | 10 | 12 | C | POST 핸들러 내 7개 IIFE 병렬, 중첩 구조 |
| `src/lib/indicators.ts` | 146 | 4 | 7 | B | `calculateRSI` Wilder smoothing 루프 |
| `src/lib/dart.ts` | 75 | 2 | 4 | A | 단순 fetch 래퍼 구조 |

### 주요 API Route (7개)

| 파일 | LOC | 함수 수 | 최대 CC | 등급 | 비고 |
|:---|:---:|:---:|:---:|:---:|:---|
| `src/app/api/ai/analysis/route.ts` | 144 | 2 | 7 | B | POST에서 캐시 미스 시 KIS 직접 요청 분기 |
| `src/app/api/fundamental/route.ts` | 91 | 1 | 4 | A | 캐시→병렬 KIS 요청 패턴, 단순 |
| `src/app/api/kis/*/route.ts` (6개) | 30~50 | 1 | 3 | A | 단일 KIS endpoint 래퍼, 단순 |
| `src/app/api/dart/financial/route.ts` | ~45 | 1 | 3 | A | 단일 DART endpoint 래퍼 |
| `src/app/api/sheets/*/route.ts` (3개) | 20~40 | 1 | 2 | A | 단순 Sheets 읽기 래퍼 |

### 라이브러리 (6개)

| 파일 | LOC | 함수 수 | 최대 CC | 등급 | 비고 |
|:---|:---:|:---:|:---:|:---:|:---|
| `src/lib/sheets.ts` | 52 | 4 | 2 | A | Google Sheets API 래퍼 3개 함수 |
| `src/lib/ai.ts` | 54 | 1 | 2 | A | OpenAI 단일 함수, 템플릿 문자열 조합 |
| `src/lib/auth.ts` | 37 | 1 | 2 | A | NextAuth 설정 객체 |
| `src/lib/env.ts` | 24 | 1 | 1 | A | Zod 스키마 선언 |
| `src/lib/api-response.ts` | 9 | 2 | 1 | A | ok/err 래퍼 2줄 |
| `src/lib/utils.ts` | 6 | 1 | 1 | A | shadcn cn 유틸 |

### UI 컴포넌트 (40개+)

| 파일 | LOC | 함수 수 | 최대 CC | 등급 | 비고 |
|:---|:---:|:---:|:---:|:---:|:---|
| `src/components/stock/rsi-macd-card.tsx` | 78 | 1 | 7 | B | useMemo 내 RSI/MACD 조건 + 색상 분기 |
| `src/components/dashboard/cumulative-profit-chart.tsx` | 79 | 1 | 6 | B | period 필터 + 날짜 계산 분기 |
| `src/components/dashboard/trade-history-table.tsx` | 82 | 1 | 4 | A | 테이블 렌더링 |
| `src/components/dashboard/stock-analysis-table.tsx` | 58 | 1 | 3 | A | 집계 테이블 렌더링 |
| `src/components/stock/stock-detail-client.tsx` | 56 | 1 | 2 | A | 컴포넌트 조합 레이아웃 |
| `src/components/dashboard/dashboard-client.tsx` | 45 | 1 | 1 | A | 컴포넌트 조합 레이아웃 |
| 나머지 UI 컴포넌트 (30개+) | 20~60 | 1~2 | 1~3 | A | 단순 렌더링 |

### 테스트 (1개)

| 파일 | LOC | 함수 수 | 최대 CC | 등급 | 비고 |
|:---|:---:|:---:|:---:|:---:|:---|
| `src/__tests__/indicators.test.ts` | ~80 | 10+ | 2 | A | Vitest describe/it 구조 |

---

## 고복잡도 함수 목록 (CC ≥ 6)

| 함수명 | 파일 | CC (추정) | 등급 | 복잡도 원인 | 리팩토링 방향 |
|:---|:---|:---:|:---:|:---|:---|
| `POST` (refresh 핸들러) | `refresh/route.ts` | 12 | **C** | 7개 IIFE + 각 IIFE 내 조건·매핑, 중첩 `Promise.allSettled` | 각 섹션 IIFE를 `refreshPrice()`, `refreshValuation()` 등 named helper 함수로 추출 |
| `getCached<T>` | `cache.ts` | 9 | B | 2단계 캐시 루프 + 2개 try-catch + TTL 분기 | Sheets 조회 로직을 `findSheetEntry()` 헬퍼로 분리 |
| `buildDartFinancial` | `refresh/route.ts` | 7 | B | `find()` 4회 + optional chaining + `parseAmount` 호출 체인 | 현재 구조 유지 가능, `find()` 호출 결과 변수명 개선으로 가독성 향상 |
| `getKisToken` | `kis.ts` | 7 | B | 3계층 분기(globalThis→파일→신규) + 2개 try-catch + `!res.ok` | 각 계층을 `getTokenFromMemory()`, `getTokenFromFile()`, `fetchNewToken()` 으로 추출 |
| `calculateRSI` | `indicators.ts` | 7 | B | 초기 루프 + Wilder 루프 + `avgLoss === 0` 삼항 반복 | 알고리즘 특성상 불가피; 루프 주석 보강으로 충분 |
| `kisRequest<T>` | `kis.ts` | 6 | B | `rt_cd !== '0'` + `msg_cd === 'EGW00133'` + `msg_cd === 'EGW00201'` + `data.output ?? data` | 오류 코드 체크를 `assertKisResponse(data)` 함수로 분리 |
| `POST` (AI analysis) | `api/ai/analysis/route.ts` | 7 | B | 캐시 미스 시 KIS 직접 요청 분기 + Sheets rows 변환 + filter 체인 | `buildStockInfo()`, `buildRecentTrades()` 헬퍼로 분리 |
| `RsiMacdCard` (useMemo) | `rsi-macd-card.tsx` | 7 | B | `data.length < 26` 조건 + RSI 색상 3단계 삼항 + chart data 매핑 | 색상 결정 로직을 `getRsiColor(rsi)` 순수 함수로 추출 |
| `calculateMACD` | `indicators.ts` | 6 | B | `n < slowPeriod` + `isNaN` 2회 + 최종 map 내 이중 조건 | 알고리즘 특성상 불가피; 현재 구조 유지 |
| `chartData` (useMemo) | `cumulative-profit-chart.tsx` | 6 | B | `period` 3중 분기 + `cutoff > 0` + 날짜 비교 | `filterByPeriod(sells, period)` 순수 함수 추출 |

---

## 리팩토링 권고 사항

### 우선순위 1 — `refresh/route.ts` POST 핸들러 (CC 12, 등급 C)

**현황**: 303 LOC 단일 함수에 7개 IIFE가 인라인으로 중첩되어 있어 가독성과 테스트 용이성이 낮다.

**권고**:
```typescript
// 현재 구조
const results = await Promise.allSettled([
  (async () => { /* price 50줄 */ })(),
  (async () => { /* valuation 30줄 */ })(),
  ...
])

// 개선안: named helper 함수로 추출
async function refreshPrice(code: string): Promise<'price'> { ... }
async function refreshValuation(code: string): Promise<'valuation'> { ... }
async function refreshDart(code: string): Promise<'dart'> { ... }

const results = await Promise.allSettled([
  refreshPrice(code),
  refreshValuation(code),
  ...
])
```
- 각 함수 독립 테스트 가능 → Vitest 단위 테스트 추가 용이
- `route.ts` LOC를 303 → 약 80 LOC로 단축 가능
- IIFE 내 중첩 `getToday()` IIFE 호출 제거 (사전 계산 변수로 대체)

### 우선순위 2 — `cache.ts` `getCached<T>` (CC 9, 등급 B)

**현황**: Sheets 순회 + TTL 판단 + JSON 파싱이 단일 함수에 집중되어 있다.

**권고**:
```typescript
// Sheets 행 탐색 로직 분리
function findSheetEntry(rows: string[][], key: string, ttlSeconds: number) {
  for (const [rowKey, rowValue, rowCachedAt] of rows) {
    if (rowKey !== key) continue
    if (!rowValue || !rowCachedAt) continue
    if (!isWithinTtl(rowCachedAt, ttlSeconds)) break
    return { rowValue, rowCachedAt }
  }
  return null
}
```
- `getCached` CC: 9 → 4 수준으로 감소
- `setAiCached` / `setCached`의 upsert 패턴 중복도 `upsertSheetRow()` 헬퍼로 통합 가능

### 우선순위 3 — `api/ai/analysis/route.ts` POST (CC 7, 등급 B)

**현황**: 캐시 미스 시 KIS 직접 요청 + Sheets rows 변환이 핸들러 함수 내에 혼재한다.

**권고**:
- `buildStockInfo(code, cachedPrice?)` — KIS 캐시 또는 직접 fetch 추상화
- `buildRecentTrades(rows: string[][], code: string)` — Sheets rows → `SheetTransactionRow[]` 변환 순수 함수
- 핸들러는 오케스트레이션만 담당 (CC 3 수준으로 감소 가능)

### 우선순위 4 — KIS 오류 처리 표준화 (`kis.ts` `kisRequest`)

**현황**: `rt_cd !== '0'`와 `msg_cd` 체크가 인라인 if 체인으로 처리된다.

**권고**:
```typescript
function assertKisResponse(data: KisApiResponse): void {
  if (data.rt_cd !== '0' || data.msg_cd === 'EGW00133') throw new Error('KIS_RATE_LIMIT')
  if (data.msg_cd === 'EGW00201') { softExpireKisToken(); throw new Error('KIS_TOKEN_EXPIRED') }
}
```
- 오류 코드 추가 시 한 곳만 수정
- `kisRequest` CC: 6 → 3으로 감소

---

## 긍정적 패턴 (구조적으로 잘 설계된 부분)

### 1. 단일 책임 원칙 (SRP) 준수
- `cache.ts`, `kis.ts`, `dart.ts`, `sheets.ts`가 각각 명확히 분리된 역할을 가진다.
- `api-response.ts`의 `ok()` / `err()` 팩토리 패턴으로 응답 포맷이 일관된다.

### 2. 3계층 캐시 아키텍처의 명확한 문서화
- `cache.ts` / `kis.ts`의 JSDoc 주석이 계층별 동작을 정확히 설명하며, 코드와 일치한다.
- `globalThis → /tmp/ → KIS OAuth` 순서가 코드 구조와 주석에서 동일하게 표현된다.

### 3. `Promise.allSettled` 사용 (부분 실패 허용)
- `refresh/route.ts`에서 7개 병렬 요청 중 일부가 실패해도 성공한 섹션의 결과를 반환한다.
- 외부 API 장애 시 전체 갱신 실패를 방지하는 견고한 설계이다.

### 4. KIS Rate Limit 쓰로틀 구현
- `throttledFetch()`가 `globalThis._kisLastCallTime`을 활용해 최소 간격을 보장한다.
- `env.KIS_THROTTLE_MS` 환경 변수로 간격 조정 가능 — 설정의 외부화(Externalization) 패턴 적용.

### 5. 클라이언트 사이드 기술적 지표 계산
- RSI, MACD를 서버 API 호출 없이 `indicators.ts`에서 클라이언트가 직접 계산한다.
- 서버 부하 절감 + API 비용 0 — 적절한 관심사 분리.

### 6. TypeScript 타입 안전성
- `kisRequest<T>`, `getCached<T>`, `setCached<T>` 제네릭 활용으로 타입 안전성 확보.
- Zod 스키마(`codeSchema`)로 입력 유효성 검증이 Route Handler 레이어에서 일관되게 적용됨.

### 7. TODO/FIXME 0건
- 전체 87개 파일에 미완성 작업 주석이 없다 — 코드 완성도가 높다.

---

## 기술 부채 요약

| 항목 | 현황 | 심각도 |
|:---|:---|:---:|
| `refresh/route.ts` POST 함수 길이 (303 LOC, CC 12) | 단일 함수에 7개 섹션 IIFE 인라인 — 테스트 불가 | 중 |
| `cache.ts` `getCached`/`setCached` 패턴 중복 | Sheets upsert 패턴이 4개 함수에 중복 | 하 |
| `cumulative-profit-chart.tsx` 수익 계산 방식 | 주석 "(간략화: 5% 수익 가정)" — 실제 매수 단가 미반영 | 중 |
| `refresh/route.ts` DART corp_code 처리 | `code.padStart(8, '0')` 단순화 — 실제 DART 코드와 불일치 가능성 | 중 |
| 개별 KIS Route 6개와 `refresh`의 변환 로직 중복 | `kis/valuation/route.ts` 변환 코드 = `refresh/route.ts` valuation IIFE | 하 |
