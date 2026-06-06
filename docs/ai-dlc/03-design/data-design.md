# 데이터 설계서 (Data Design)

| 항목 | 내용 |
|:---|:---|
| 문서명 | 데이터 설계서 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

my-stock은 전통적인 RDBMS 대신 **Google Sheets**를 데이터 스토어로 사용한다. 총 5개 탭이 각기 다른 역할을 담당하며, 3계층 캐싱 전략의 영구 캐시 레이어를 담당한다.

### 데이터 스토어 구성

| 탭명 | 환경변수 | 역할 | TTL |
|:---|:---|:---|:---|
| 매매내역 | `GOOGLE_SHEET_NAME` (기본: `매매내역`) | 거래 원장 | 영구 |
| `_TICKER_CACHE_` | (고정) | KIS·DART API 응답 캐시 | 30분 |
| `_AI_CACHE_` | (고정) | OpenAI 분석 결과 캐시 | 7일 |
| 종목코드 | `GOOGLE_SHEET_TICKER_MASTER` | 종목명↔코드 매핑 | 영구 |
| 종목별집계 | `GOOGLE_SHEET_AGGREGATION` | 종목별 거래 집계 | 영구 |

---

## 2. 탭 1: 매매내역

### 2.1 컬럼 정의

| 컬럼명 | 타입 | 필수 | 제약 조건 | 설명 |
|:---|:---|:---:|:---|:---|
| `Date` | string | Y | `YYYY-MM-DD` 형식 | 거래 날짜 |
| `Ticker` | string | Y | 비어 있으면 안 됨 | 한국어 종목명 |
| `Type` | string | Y | `매수` 또는 `매도` (BR-013) | 거래 유형 |
| `Quantity` | number | Y | 양의 정수 | 거래 수량 |
| `Price` | number | Y | 양의 실수 | 거래 단가 (원) |
| `Journal` | string | N | — | 매매 메모 |
| `Tags` | string | N | 콤마(`,`) 구분 | 전략 태그 목록 |

### 2.2 TypeScript 타입

```typescript
// src/types/sheets.ts
export interface SheetTransactionRow {
  Date: string;         // 'YYYY-MM-DD'
  Ticker: string;       // 한국어 종목명
  Type: '매수' | '매도';
  Quantity: number;
  Price: number;
  Journal: string;
  Tags: string;         // 콤마 구분 문자열
}
```

### 2.3 샘플 데이터

| Date | Ticker | Type | Quantity | Price | Journal | Tags |
|:---|:---|:---|:---|:---|:---|:---|
| 2024-01-15 | 삼성전자 | 매수 | 10 | 72000 | 반도체 회복 기대 | 성장주,반도체 |
| 2024-03-20 | 삼성전자 | 매도 | 5 | 78000 | 목표가 달성 | 성장주,반도체 |

---

## 3. 탭 2: _TICKER_CACHE_

### 3.1 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `key` | string | Y | `{code}_{section}` 형식 (BR-011) |
| `value` | string | Y | `JSON.stringify(API 응답)` |
| `cachedAt` | string | Y | ISO 8601 datetime |

### 3.2 section 값 목록

| section | 연계 API | 설명 |
|:---|:---|:---|
| `price` | `/api/kis/price` | 현재 시세 |
| `valuation` | `/api/kis/valuation` | 가치평가 지표 |
| `financial` | `/api/kis/financial` | 재무 요약 |
| `dailyPrice` | `/api/kis/daily-price` | 30일 일봉 |
| `tradingTrend` | `/api/kis/trading-trend` | 투자자별 매매동향 |
| `opinion` | `/api/kis/opinion` | 투자의견 |
| `dart` | `/api/dart/financial` | DART 재무 데이터 |
| `fundamental` | `/api/fundamental` | 통합 가치·재무 |

### 3.3 TTL 규칙 (BR-009)
- 캐시 만료: `cachedAt` + 30분 초과 시 무효
- 만료된 항목: 조회 시 삭제 후 API 재호출 → 새 행 삽입
- 동일 key 존재 시: 기존 행 업데이트 (value + cachedAt 갱신)

### 3.4 TypeScript 타입

```typescript
// src/types/sheets.ts
export interface TickerCacheEntry {
  key: string;       // '{code}_{section}'
  value: string;     // JSON.stringify()
  cachedAt: string;  // ISO 8601
}
```

---

## 4. 탭 3: _AI_CACHE_

### 4.1 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `code` | string | Y | 종목 코드 (키) |
| `content` | string | Y | gpt-4o-mini 분석 결과 전문 |
| `cachedAt` | string | Y | ISO 8601 datetime |

### 4.2 TTL 규칙 (BR-010)
- 캐시 만료: `cachedAt` + 7일 초과 시 무효
- 강제 갱신: `POST /api/ai/analysis` 호출 시 무조건 재생성
- 동일 code 존재 시: content + cachedAt 갱신

### 4.3 TypeScript 타입

```typescript
// src/types/sheets.ts
export interface AiCacheEntry {
  code: string;      // 종목 코드
  content: string;   // AI 분석 텍스트
  cachedAt: string;  // ISO 8601
}
```

---

## 5. 탭 4: 종목코드 마스터

### 5.1 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `Ticker` | string | Y | 한국어 종목명 |
| `Code` | string | Y | KIS API 6자리 종목 코드 |

### 5.2 사용 목적
- 매매내역의 `Ticker`(한국어명)를 KIS API용 `code`(숫자)로 변환
- `GOOGLE_SHEET_TICKER_MASTER` 환경변수 미설정 시 해당 탭 사용 안 함 (optional)

### 5.3 TypeScript 타입

```typescript
// src/types/sheets.ts
export interface TickerMasterRow {
  Ticker: string;  // 한국어 종목명
  Code: string;    // KIS 6자리 코드 (예: '005930')
}
```

---

## 6. 탭 5: 종목별집계

### 6.1 컬럼 정의

| 컬럼명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `Ticker` | string | Y | 종목명 |
| `Code` | string | Y | 종목 코드 |
| `Holdings` | number | Y | 현재 보유 수량 |
| `AvgPrice` | number | Y | 평균 매수 단가 |
| `TotalBuy` | number | Y | 총 매수 금액 |
| `RealizedPnL` | number | Y | 실현 손익 (매도 차익 합계) |
| `TradeCount` | number | Y | 총 거래 횟수 |
| `WinCount` | number | Y | 수익 거래 횟수 (매도가 > 매수단가) |

### 6.2 집계 규칙 (BR-013~016)
- `Holdings`: Σ매수수량 - Σ매도수량
- `AvgPrice`: 이동평균법 (매수 시점 기준 가중평균)
- `RealizedPnL`: 매도 시 (매도가 - 매수단가) × 수량
- `WinCount`: 매도 시 RealizedPnL > 0인 건수

### 6.3 TypeScript 타입

```typescript
// src/types/sheets.ts
export interface AggregationRow {
  Ticker: string;
  Code: string;
  Holdings: number;
  AvgPrice: number;
  TotalBuy: number;
  RealizedPnL: number;
  TradeCount: number;
  WinCount: number;
}
```

---

## 7. 엔터티 관계 (논리 모델)

```
매매내역
  │ Ticker ──────────────────▶ 종목코드마스터
  │                                │
  │ 집계 연산                       │ Code
  ▼                                ▼
종목별집계 ◀──────────────── Code ─── _TICKER_CACHE_ (key 접두어)
                                      _AI_CACHE_ (code)
```

---

## 8. 접근 패턴 및 API 매핑

| 작업 | Sheets 탭 | API 엔드포인트 |
|:---|:---|:---|
| 전체 매매내역 조회 | 매매내역 | `GET /api/sheets/transactions` |
| 종목코드 변환 | 종목코드마스터 | `GET /api/sheets/ticker-master` |
| 포트폴리오 조회 | 종목별집계 | `GET /api/sheets/aggregation` |
| KIS 시세 캐시 R/W | _TICKER_CACHE_ | (내부, API Route Handler) |
| AI 분석 캐시 R/W | _AI_CACHE_ | (내부, API Route Handler) |

---

## 9. 캐시 저장소 계층 구조

```
1. globalThis (인메모리, 서버리스 인스턴스 로컬)
   └─ KIS 액세스 토큰 (KisToken)
   └─ Google OAuth 토큰

2. /tmp/ 또는 .next/cache/ (파일 시스템)
   └─ KIS 토큰 파일 (24시간 TTL)

3. Google Sheets (영구, 인스턴스 공유)
   └─ _TICKER_CACHE_ (30분 TTL)
   └─ _AI_CACHE_ (7일 TTL)
```

---

## 10. 보안 고려사항

- Google Sheets 접근은 서비스 계정(Service Account) JWT로만 허용
- `GOOGLE_APPLICATION_CREDENTIALS` (로컬) 또는 `GOOGLE_SERVICE_ACCOUNT_JSON` (Vercel) 환경변수 사용
- 클라이언트 컴포넌트에서 Sheets API 직접 호출 금지 — 반드시 서버 API Route 경유
- 스프레드시트 자체에 별도 접근 제어 권한 설정 권장 (개인 계정 소유)
