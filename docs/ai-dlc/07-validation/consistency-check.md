# 설계-코드 일관성 검증 보고서

| 항목 | 내용 |
|:---|:---|
| 검증일 | 2026-06-07 |
| 검증 범위 | API 설계서 (api-design.md) vs Route Handlers (src/app/api/) |
| 검증자 | Claude Code (자동 검증) |
| 설계 문서 버전 | v1.0 (2026-06-07) |

---

## 검증 결과 요약

| 검증 항목 | 설계 건수 | 구현 건수 | 일치 | 불일치 |
|:---|:---:|:---:|:---:|:---:|
| URL 경로 일치 | 14 | 14 | 14 | 0 |
| 응답 포맷 `{ data: T, cachedAt?: string }` | 14 | 14 | 14 | 0 |
| 인증 체크 (`getServerSession`) | 14 | 14 | 14 | 0 |
| 오류 코드 일관성 | — | 14 | 13 | 1 |
| DART corpCode 처리 방식 | 1 (단일 정책 기대) | 2 | 0 | 1 |
| 캐시 키 일관성 | — | 11 | 9 | 2 |
| KIS tradingTrend 파라미터 | 설계 명시 없음 | 2 | 0 | 1 |
| KIS opinion TR ID | — | 2 | 0 | 1 |

**종합 판정**: 조건부통과

> URL 경로·응답 포맷·인증 체크는 14/14 완전 일치. 다만 DART corpCode 처리 불일치(CI-001)는 런타임 장애 가능성이 있는 High 심각도 결함으로, 수정 전까지 refresh 엔드포인트의 DART 섹션은 잘못된 기업코드로 호출될 위험이 있다.

---

## 불일치 목록

| CI-ID | 심각도 | 항목 | 설계 / 기대 | 구현 현황 | 영향 | 수정 방향 |
|:---|:---:|:---|:---|:---|:---|:---|
| CI-001 | **High** | DART corpCode 처리 방식 | `getCorpCode(ticker)` — 종목명으로 DART 검색 API 호출 | `dart/financial/route.ts`: `getCorpCode(ticker)` 정상 ✅<br>`ticker/[code]/refresh/route.ts`: `code.padStart(8,'0')` ❌ | refresh에서 DART 재무·공시 조회 시 잘못된 corp_code 전달 → DART API 오류 또는 엉뚱한 기업 데이터 반환 | `refresh/route.ts`의 dart 섹션에서 `getCorpCode(name)` 사용. `price` 섹션 결과(`hts_kor_isnm`)에서 종목명을 추출하거나, Route 파라미터로 ticker를 추가로 받도록 수정 |
| CI-002 | **Medium** | 캐시 키: `dailyPrice` | 섹션명 `dailyPrice` 기준으로 `${code}_dailyPrice` 예상 | `kis/daily-price/route.ts`: `${code}_daily_price` (언더스코어 구분)<br>`refresh/route.ts`: `${code}_dailyPrice` (camelCase) | 두 Route가 서로 다른 캐시 키를 사용하므로 `daily-price` Route로 갱신된 캐시를 `refresh`가 덮어쓰지 않음. 반대로 `refresh` 갱신 후 `daily-price` Route가 stale 캐시 읽을 수 있음 | 캐시 키 통일: `${code}_dailyPrice` (camelCase) 또는 `${code}_daily_price` 중 하나로 표준화 |
| CI-003 | **Medium** | 캐시 키: `tradingTrend` | 섹션명 `tradingTrend` 기준으로 `${code}_tradingTrend` 예상 | `kis/trading-trend/route.ts`: `${code}_trading_trend` (언더스코어 구분)<br>`refresh/route.ts`: `${code}_tradingTrend` (camelCase) | CI-002와 동일한 캐시 비일관성 문제. `trading-trend` Route와 `refresh`가 각각 다른 키에 쓰고 읽음 | 캐시 키 통일: `${code}_tradingTrend` 또는 `${code}_trading_trend` 중 하나로 표준화 |
| CI-004 | **Low** | KIS tradingTrend 날짜 파라미터 | 설계서에 파라미터 상세 미명시 | `kis/trading-trend/route.ts`: `fid_input_date_1`, `fid_input_date_2` 없이 호출<br>`refresh/route.ts`: 30일 범위(`fid_input_date_1`, `fid_input_date_2`, `fid_period_div_code`) 포함 | 두 Route의 실제 KIS API 호출 파라미터가 다름. `trading-trend/route.ts`가 날짜 파라미터 없이 호출 시 KIS API 기본값에 의존 | `kis/trading-trend/route.ts`에도 명시적 날짜 범위(최근 30일) 파라미터 추가 |
| CI-005 | **Low** | KIS opinion TR ID / 파라미터 | 설계서에 TR ID 미명시 | `kis/opinion/route.ts`: TR ID `FHKST03010600`, 엔드포인트 `/inquire-invest-opinion`<br>`refresh/route.ts`: TR ID `FHKST01011600`, 엔드포인트 `/inquire-invest-opbysec` | 두 Route가 다른 KIS API 엔드포인트를 사용. 응답 필드명도 다름(`invt_firm_nm` vs `mbcr_name`, `tgt_prc` vs `tgpr`) | 동일한 KIS 엔드포인트·TR ID로 통일 후 응답 필드명 일치 확인 |

---

## 일치 항목 (검증 통과)

### 1. URL 경로 — 14/14 일치

| 설계서 엔드포인트 | 구현 파일 경로 | 결과 |
|:---|:---|:---:|
| GET /api/sheets/transactions | `src/app/api/sheets/transactions/route.ts` | ✅ |
| GET /api/sheets/ticker-master | `src/app/api/sheets/ticker-master/route.ts` | ✅ |
| GET /api/sheets/aggregation | `src/app/api/sheets/aggregation/route.ts` | ✅ |
| GET /api/kis/price | `src/app/api/kis/price/route.ts` | ✅ |
| GET /api/kis/valuation | `src/app/api/kis/valuation/route.ts` | ✅ |
| GET /api/kis/financial | `src/app/api/kis/financial/route.ts` | ✅ |
| GET /api/kis/daily-price | `src/app/api/kis/daily-price/route.ts` | ✅ |
| GET /api/kis/trading-trend | `src/app/api/kis/trading-trend/route.ts` | ✅ |
| GET /api/kis/opinion | `src/app/api/kis/opinion/route.ts` | ✅ |
| GET /api/dart/financial | `src/app/api/dart/financial/route.ts` | ✅ |
| GET /api/fundamental | `src/app/api/fundamental/route.ts` | ✅ |
| GET /api/ai/analysis | `src/app/api/ai/analysis/route.ts` | ✅ |
| POST /api/ai/analysis | `src/app/api/ai/analysis/route.ts` | ✅ |
| POST /api/ticker/[code]/refresh | `src/app/api/ticker/[code]/refresh/route.ts` | ✅ |

### 2. 응답 포맷 — 14/14 일치

모든 Route Handler가 `src/lib/api-response.ts`의 `ok(data, cachedAt?)` / `err(message, code, status)` 헬퍼를 통해 응답한다.

```typescript
// src/lib/api-response.ts
export function ok<T>(data: T, cachedAt?: string) {
  return NextResponse.json({ data, ...(cachedAt && { cachedAt }) })
}
export function err(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}
```

- 성공 응답: `{ data: T, cachedAt?: string }` — 설계서와 완전 일치
- 오류 응답: `{ error: string, code: string }` + HTTP 상태 코드 — 설계서와 완전 일치

### 3. 인증 체크 — 14/14 일치

모든 Route Handler 함수의 첫 번째 블록에 아래 패턴이 존재한다:

```typescript
const session = await getServerSession(authOptions)
if (!session) return err('Unauthorized', 'AUTH_ERROR', 401)
```

- `AUTH_ERROR` 코드 사용 일관성: 14/14 ✅
- 401 상태 코드 반환: 14/14 ✅
- 리다이렉트 없음 (SR-005 준수): 14/14 ✅

### 4. 입력 유효성 검사 (Zod) — 11/11 파라미터 있는 Route 일치

`code` 파라미터를 받는 11개 Route 모두 동일한 Zod 스키마를 사용한다:

```typescript
const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '종목코드는 6자리 숫자여야 합니다'),
})
```

유효성 실패 시 `VALIDATION_ERROR` 코드와 400 반환 — 설계서 일치.

### 5. Vercel maxDuration — 1/1 일치

`refresh/route.ts` 최상단에 `export const maxDuration = 60` 선언 확인. 설계서 및 CLAUDE.md 요구사항 준수.

### 6. KIS 병렬 호출 (refresh) — 일치

`refresh/route.ts`에서 `Promise.allSettled([...])` 패턴으로 KIS 6개 + DART 1개 총 7개 섹션 병렬 호출. 설계서 "KIS 엔드포인트 6개 + DART 1개 병렬 호출" 명세와 일치.

### 7. 캐시 TTL — 일치

| 섹션 | 설계 TTL | 구현 TTL |
|:---|:---:|:---:|
| KIS 전체 (price, valuation, financial, dailyPrice, tradingTrend, opinion) | 30분 | 1800초 (30분) ✅ |
| DART financial | 1시간 | 3600초 (1시간) ✅ |
| AI analysis | 7일 | `getAiCached` / `setAiCached` (별도 `_AI_CACHE_` 탭) ✅ |
| fundamental | 30분 | 1800초 (30분) ✅ |

### 8. DART 쿼리 파라미터 (`dart/financial`) — 일치

설계서 비고 "CORPCODE.xml 내부 캐시 활용"에 대응하여, `getCorpCode(ticker)`는 `globalThis._dartCorpCodes` Map으로 인메모리 캐싱을 구현. 반복 API 호출 방지 원칙(BR-016) 준수.

### 9. sheets/transactions 응답 타입 — 일치

설계서 `SheetTransactionRow[]` 반환. 구현에서 `type SheetTransactionRow` 임포트 후 매핑.

---

## 상세 분석 메모

### CI-001 상세: DART corpCode 처리 불일치

**문제 원인**: `refresh/route.ts`는 동적 경로 `[code]`로부터 6자리 KIS 종목코드를 받으며, ticker(종목명) 정보를 별도로 전달받지 않는다. 따라서 개발 시 임시 방편으로 `code.padStart(8, '0')`를 사용했으나, 이는 DART의 실제 8자리 법인등록코드와 전혀 다른 값이다.

예시:
- KIS 종목코드: `005930` (삼성전자)
- `padStart(8,'0')` 결과: `00005930` (잘못된 DART 코드)
- 실제 DART corp_code: `00126380` (삼성전자 실제 DART 코드)

**올바른 처리 흐름**:
1. `refresh/route.ts`에서 KIS price 호출로 `hts_kor_isnm`(종목명) 획득
2. 획득한 종목명으로 `getCorpCode(name)` 호출
3. 반환된 정확한 DART corp_code로 재무/공시 API 호출

또는, `POST /api/ticker/[code]/refresh` 요청 body에 `ticker`(종목명) 필드를 추가하는 방안도 고려 가능.

### CI-002 / CI-003 상세: 캐시 키 불일치

`lib/cache.ts`의 캐시 키는 문자열 리터럴이므로, 서로 다른 Route에서 동일 데이터에 대해 다른 키를 쓰면 캐시가 공유되지 않는다.

| 섹션 | `daily-price/route.ts` | `refresh/route.ts` |
|:---|:---|:---|
| 일봉 데이터 | `${code}_daily_price` | `${code}_dailyPrice` |
| 매매동향 | `${code}_trading_trend` | `${code}_tradingTrend` |

이로 인해 `daily-price` 또는 `trading-trend` Route로 데이터를 조회한 뒤 `refresh`를 실행해도, refresh가 다른 키에 써서 기존 캐시를 무효화하지 않는다. 반대로, refresh 후 개별 Route 조회 시 refresh가 쓴 캐시를 읽지 못해 외부 API를 다시 호출하게 된다.

---

## 권고 사항

### 즉시 수정 필요 (High)

1. **[CI-001]** `src/app/api/ticker/[code]/refresh/route.ts` dart 섹션 수정
   - `price` IIFE 완료 후 얻은 `name`(종목명)을 `getCorpCode(name)`에 전달하도록 로직 재구성
   - `Promise.allSettled` 내 dart 섹션을 price 결과 의존적으로 순서화하거나, price를 먼저 처리 후 dart 처리

### 단기 수정 필요 (Medium)

2. **[CI-002, CI-003]** 캐시 키 표준화
   - `lib/cache.ts` 또는 별도 상수 파일에 캐시 키 상수 정의
   - 예: `const CACHE_KEYS = { dailyPrice: (code: string) => `${code}_dailyPrice` }`
   - 모든 Route에서 상수를 import하여 사용

### 선택적 개선 (Low)

3. **[CI-004]** `kis/trading-trend/route.ts`에 날짜 범위 파라미터 추가 (refresh와 동일하게 최근 30일)
4. **[CI-005]** `kis/opinion/route.ts`와 `refresh/route.ts`의 KIS 엔드포인트 및 TR ID 통일
   - 두 구현 중 KIS 공식 문서 기준으로 올바른 엔드포인트 확인 후 통일

---

## 검증 커버리지

| 파일 | 검증 완료 |
|:---|:---:|
| `src/app/api/sheets/transactions/route.ts` | ✅ |
| `src/app/api/sheets/ticker-master/route.ts` | ✅ |
| `src/app/api/sheets/aggregation/route.ts` | ✅ |
| `src/app/api/kis/price/route.ts` | ✅ |
| `src/app/api/kis/valuation/route.ts` | ✅ |
| `src/app/api/kis/financial/route.ts` | ✅ |
| `src/app/api/kis/daily-price/route.ts` | ✅ |
| `src/app/api/kis/trading-trend/route.ts` | ✅ |
| `src/app/api/kis/opinion/route.ts` | ✅ |
| `src/app/api/dart/financial/route.ts` | ✅ |
| `src/app/api/fundamental/route.ts` | ✅ |
| `src/app/api/ai/analysis/route.ts` | ✅ |
| `src/app/api/ticker/[code]/refresh/route.ts` | ✅ |
| `src/lib/api-response.ts` | ✅ |
| `src/lib/dart.ts` | ✅ |
