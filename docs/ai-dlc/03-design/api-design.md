# API 설계서 (API Design)

| 항목 | 내용 |
|:---|:---|
| 문서명 | API 설계서 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

본 문서는 my-stock의 14개 REST API 엔드포인트를 명세한다. 모든 엔드포인트는 NextAuth JWT 세션으로 보호되며, `middleware.ts`가 전역 인증을 처리한다.

### 공통 규칙

| 항목 | 규칙 |
|:---|:---|
| 기본 URL | `https://{도메인}/api` |
| 인증 | NextAuth JWT 쿠키 (모든 엔드포인트 필수) |
| 응답 형식 | `Content-Type: application/json` |
| 캐시 응답 포함 | `cachedAt?: string` (ISO 8601, 캐시 HIT 시) |
| 오류 형식 | `{ error: string, code: string }` |

### 공통 응답 형식

```typescript
// 성공
{ data: T, cachedAt?: string }

// 실패
{ error: string, code: string }
```

### HTTP 상태 코드

| 코드 | 상황 |
|:---|:---|
| `200` | 성공 (캐시 HIT·MISS 공통) |
| `401` | 미인증 / 세션 만료 → UI 알림 (리다이렉트 없음, SR-005) |
| `429` | KIS Rate Limit 초과 (`EGW00133`) |
| `500` | 서버 오류 (KIS·DART·OpenAI·Google API 실패) |
| `504` | 갱신 타임아웃 (60초 초과) |

---

## 2. Google Sheets API

### 2.1 GET /api/sheets/transactions

**설명**: 매매내역 전체 조회

**연계 UC**: UC-003, UC-004, UC-005, UC-006

**요청**
```
GET /api/sheets/transactions
```

**응답**
```typescript
{
  data: SheetTransactionRow[]
}
```

**캐시**: 없음 (Sheets 직접 조회)

---

### 2.2 GET /api/sheets/ticker-master

**설명**: 종목코드 마스터 조회 (Ticker↔Code 매핑)

**연계 UC**: —

**요청**
```
GET /api/sheets/ticker-master
```

**응답**
```typescript
{
  data: TickerMasterRow[]
}
```

**비고**: `GOOGLE_SHEET_TICKER_MASTER` 환경변수 미설정 시 빈 배열 반환

---

### 2.3 GET /api/sheets/aggregation

**설명**: 종목별 거래 집계 조회

**연계 UC**: UC-003

**요청**
```
GET /api/sheets/aggregation
```

**응답**
```typescript
{
  data: AggregationRow[]
}
```

**비고**: `GOOGLE_SHEET_AGGREGATION` 환경변수 미설정 시 빈 배열 반환

---

## 3. KIS Open API

> 모든 KIS 엔드포인트: `_TICKER_CACHE_` 30분 TTL 적용 (BR-009). KIS 직접 호출 시 400ms 스로틀 (BR-005, KIS_THROTTLE_MS).

### 3.1 GET /api/kis/price

**설명**: 종목 현재 시세 조회

**연계 UC**: UC-007

**요청**
```
GET /api/kis/price?code={stockCode}
```

| 파라미터 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `code` | string | Y | KIS 6자리 종목 코드 |

**응답**
```typescript
{
  data: StockPrice,
  cachedAt?: string
}
```

**오류**
| 코드 | 상황 |
|:---|:---|
| `MISSING_CODE` | code 파라미터 누락 |
| `KIS_RATE_LIMIT` | EGW00133 응답 |

---

### 3.2 GET /api/kis/valuation

**설명**: 가치평가 지표 조회 (PER·PBR·EPS·BPS·ROE·ROA)

**연계 UC**: UC-008

**요청**
```
GET /api/kis/valuation?code={stockCode}
```

**응답**
```typescript
{
  data: Valuation,
  cachedAt?: string
}
```

---

### 3.3 GET /api/kis/financial

**설명**: 재무 요약 조회 (자산·부채·자본·매출·영업익·순이익)

**연계 UC**: UC-009

**요청**
```
GET /api/kis/financial?code={stockCode}
```

**응답**
```typescript
{
  data: FinancialSummary,
  cachedAt?: string
}
```

---

### 3.4 GET /api/kis/daily-price

**설명**: 30일 일봉 데이터 조회 (캔들스틱·보조지표 계산용)

**연계 UC**: UC-010, UC-013

**요청**
```
GET /api/kis/daily-price?code={stockCode}
```

**응답**
```typescript
{
  data: DailyPrice[],   // 최신순 30건
  cachedAt?: string
}
```

---

### 3.5 GET /api/kis/trading-trend

**설명**: 투자자별 매매동향 조회 (개인·외국인·기관)

**연계 UC**: UC-010

**요청**
```
GET /api/kis/trading-trend?code={stockCode}
```

**응답**
```typescript
{
  data: TradingTrend[],
  cachedAt?: string
}
```

---

### 3.6 GET /api/kis/opinion

**설명**: 증권사 투자의견 조회

**연계 UC**: UC-010

**요청**
```
GET /api/kis/opinion?code={stockCode}
```

**응답**
```typescript
{
  data: AnalystOpinion[],
  cachedAt?: string
}
```

---

## 4. DART API

### 4.1 GET /api/dart/financial

**설명**: DART 5개년 재무 추이 + 잠정실적 공시 조회

**연계 UC**: UC-009, UC-011

**요청**
```
GET /api/dart/financial?code={stockCode}
```

**응답**
```typescript
{
  data: DartFinancial,
  cachedAt?: string
}
```

**캐시**: `_TICKER_CACHE_` 1시간 TTL (DART는 30분보다 긴 TTL 적용)

**비고**: `CORPCODE.xml` 내부 캐시 활용 (반복 다운로드 방지, BR-016)

---

## 5. 통합 API

### 5.1 GET /api/fundamental

**설명**: KIS 가치평가 + 재무 데이터 통합 조회 (단일 엔드포인트)

**연계 UC**: UC-008, UC-009

**요청**
```
GET /api/fundamental?code={stockCode}
```

**응답**
```typescript
{
  data: {
    valuation: Valuation,
    financial: FinancialSummary
  },
  cachedAt?: string
}
```

**내부 처리**: `/api/kis/valuation` + `/api/kis/financial` 병렬 호출

---

## 6. AI 분석 API

### 6.1 GET /api/ai/analysis

**설명**: AI 분석 결과 조회 (7일 캐시)

**연계 UC**: UC-014

**요청**
```
GET /api/ai/analysis?code={stockCode}
```

**응답**
```typescript
{
  data: AiAnalysisResult,
  cachedAt?: string
}
```

**캐시**: `_AI_CACHE_` 7일 TTL (BR-010)

---

### 6.2 POST /api/ai/analysis

**설명**: AI 분석 강제 갱신 (캐시 무시)

**연계 UC**: UC-014

**요청**
```
POST /api/ai/analysis
Content-Type: application/json

{ "code": "{stockCode}" }
```

**응답**
```typescript
{
  data: AiAnalysisResult
}
```

**내부 처리**:
1. 해당 종목 매매 일지 (`SheetTransactionRow[]`) 조회
2. 종목 시세·재무 컨텍스트 수집
3. `gpt-4o-mini` 호출 (FR-020)
4. `_AI_CACHE_` 갱신

---

## 7. 통합 갱신 API

### 7.1 POST /api/ticker/[code]/refresh

**설명**: KIS + DART 전체 섹션 병렬 갱신 (maxDuration=60)

**연계 UC**: UC-015

**요청**
```
POST /api/ticker/{stockCode}/refresh
```

**응답**
```typescript
{
  data: {
    refreshedSections: string[],   // 갱신된 섹션 목록
    elapsedMs: number              // 총 소요 시간
  }
}
```

**갱신 섹션**: `price`, `valuation`, `financial`, `dailyPrice`, `tradingTrend`, `opinion`, `dart`, `fundamental` (총 8개)

**제약**:
- `export const maxDuration = 60` (Vercel Pro 필수, CLAUDE.md)
- KIS 엔드포인트 6개 + DART 1개 병렬 호출 (BR-005 스로틀 내)
- 60초 초과 시 504 반환

---

## 8. UC 커버리지 매핑

| UC | 연계 API | 커버 여부 |
|:---|:---|:---:|
| UC-001 Google 로그인 | NextAuth (middleware) | ✅ |
| UC-002 로그아웃 | NextAuth `/api/auth/signout` | ✅ |
| UC-003 포트폴리오 조회 | `/api/sheets/aggregation`, `/api/sheets/transactions` | ✅ |
| UC-004 수익률 분석 | `/api/sheets/transactions` | ✅ |
| UC-005 차트 조회 | `/api/sheets/transactions` | ✅ |
| UC-006 매매 내역 조회 | `/api/sheets/transactions` | ✅ |
| UC-007 시세 조회 | `/api/kis/price` | ✅ |
| UC-008 가치평가 조회 | `/api/kis/valuation`, `/api/fundamental` | ✅ |
| UC-009 재무 조회 | `/api/kis/financial`, `/api/dart/financial`, `/api/fundamental` | ✅ |
| UC-010 매매동향 조회 | `/api/kis/daily-price`, `/api/kis/trading-trend`, `/api/kis/opinion` | ✅ |
| UC-011 공시 조회 | `/api/dart/financial` | ✅ |
| UC-012 포트폴리오 상세 | `/api/sheets/aggregation`, `/api/kis/price` | ✅ |
| UC-013 보조지표 | `/api/kis/daily-price` (클라이언트 계산) | ✅ |
| UC-014 AI 분석 | `GET/POST /api/ai/analysis` | ✅ |
| UC-015 데이터 갱신 | `POST /api/ticker/[code]/refresh` | ✅ |

**UC 커버율**: 15/15 = **100%**

---

## 9. 인증 플로우

```
클라이언트 요청
    │
    ▼
middleware.ts (전역 JWT 검증)
    │
    ├─ 세션 유효 → API Route Handler 진행
    │
    └─ 세션 무효 → 401 응답
                    │
                    ▼
              SessionExpiredPrompt UI (리다이렉트 없음, SR-005)
```

---

## 10. 보안 원칙

- API 키 (`KIS_APP_KEY`, `DART_API_KEY`, `OPENAI_API_KEY`) — 서버 환경변수 전용, 클라이언트 노출 금지 (BR-004)
- 모든 API Route는 `getServerSession()` 또는 `middleware.ts`로 인증 확인
- CORS: 동일 도메인 전용 (Vercel 배포 환경 기본값)
