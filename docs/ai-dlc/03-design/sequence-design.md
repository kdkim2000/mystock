# 시퀀스 다이어그램 (Sequence Design)

| 항목 | 내용 |
|:---|:---|
| 문서명 | 시퀀스 다이어그램 |
| 버전 | v1.0 |
| 작성일 | 2026-06-07 |
| 프로젝트 | my-stock |

---

## 1. 개요

본 문서는 my-stock의 6개 핵심 시나리오에 대한 시퀀스 다이어그램을 정의한다. 각 시나리오는 캐시 HIT/MISS 분기, Rate Limit 처리, 인증 흐름을 포함한다.

| SEQ-ID | 시나리오 | 연계 UC |
|:---|:---|:---|
| SEQ-001 | Google 로그인 | UC-001 |
| SEQ-002 | 대시보드 초기 로딩 | UC-003~006 |
| SEQ-003 | 종목 상세 — 캐시 HIT | UC-007~011 |
| SEQ-004 | 종목 상세 — 캐시 MISS (KIS+DART 병렬) | UC-007~011 |
| SEQ-005 | 데이터 갱신 버튼 (60초 통합 갱신) | UC-015 |
| SEQ-006 | AI 분석 조회 및 강제 갱신 | UC-014 |

---

## 2. SEQ-001: Google 로그인

**연계 UC**: UC-001  
**참여자**: Browser, NextAuth, Google OAuth, middleware.ts

```mermaid
sequenceDiagram
    actor Browser
    participant NextAuth
    participant GoogleOAuth as Google OAuth
    participant Middleware as middleware.ts

    Browser->>NextAuth: GET /auth/signin
    NextAuth-->>Browser: 로그인 화면 렌더링

    Browser->>NextAuth: POST /api/auth/signin/google
    NextAuth->>GoogleOAuth: OAuth 인증 요청 (redirect)
    GoogleOAuth-->>Browser: Google 계정 선택 화면

    Browser->>GoogleOAuth: 계정 선택 + 동의
    GoogleOAuth-->>NextAuth: authorization code 전달

    NextAuth->>GoogleOAuth: access_token 교환
    GoogleOAuth-->>NextAuth: 사용자 이메일·프로필 반환

    alt ALLOWED_EMAIL 검증 (환경변수 설정 시)
        NextAuth->>NextAuth: email === ALLOWED_EMAIL?
        alt 불일치
            NextAuth-->>Browser: 403 — 접근 거부
        end
    end

    NextAuth->>NextAuth: JWT 세션 생성 (AUTH_SECRET 서명)
    NextAuth-->>Browser: Set-Cookie: next-auth.session-token
    Browser->>Middleware: GET /dashboard (쿠키 포함)
    Middleware->>Middleware: JWT 검증
    Middleware-->>Browser: 200 → 대시보드 렌더링
```

### 메시지 정의

| 순서 | 발신 | 수신 | 메시지 | 비고 |
|:---:|:---|:---|:---|:---|
| 1 | Browser | NextAuth | GET /auth/signin | 로그인 페이지 요청 |
| 2 | Browser | NextAuth | POST /api/auth/signin/google | 로그인 버튼 클릭 |
| 3 | NextAuth | Google OAuth | OAuth 인증 요청 | redirect_uri 포함 |
| 4 | Browser | Google OAuth | 계정 선택 | 사용자 직접 조작 |
| 5 | Google OAuth | NextAuth | authorization code | callback URL |
| 6 | NextAuth | NextAuth | ALLOWED_EMAIL 검증 | 환경변수 있을 때만 |
| 7 | NextAuth | Browser | JWT 쿠키 발급 | HttpOnly, Secure |

---

## 3. SEQ-002: 대시보드 초기 로딩

**연계 UC**: UC-003, UC-004, UC-005, UC-006  
**참여자**: Browser, Next.js SSR, Google Sheets API

```mermaid
sequenceDiagram
    actor Browser
    participant SSR as Next.js SSR (서버)
    participant SheetsAPI as Google Sheets API
    participant Client as Browser (CSR)

    Browser->>SSR: GET /dashboard (JWT 쿠키)
    SSR->>SSR: getServerSession() — JWT 검증

    alt 세션 없음
        SSR-->>Browser: 401 — SessionExpiredPrompt 렌더링
    end

    SSR->>SheetsAPI: 매매내역 전체 조회
    SheetsAPI-->>SSR: SheetTransactionRow[]

    SSR->>SheetsAPI: 종목별집계 조회
    SheetsAPI-->>SSR: AggregationRow[]

    SSR->>SSR: KPI 계산 (실현손익·승률·총자산)
    SSR->>SSR: 차트 데이터 가공 (TradeStats[], TagStats[])

    SSR-->>Browser: HTML (초기 데이터 hydration 포함)
    Browser->>Client: React hydration 완료
    Client-->>Browser: 인터랙티브 대시보드 표시
```

### 메시지 정의

| 순서 | 발신 | 수신 | 메시지 | 비고 |
|:---:|:---|:---|:---|:---|
| 1 | Browser | SSR | GET /dashboard | 쿠키 포함 |
| 2 | SSR | Sheets | 매매내역 조회 | 전체 데이터 |
| 3 | SSR | Sheets | 종목별집계 조회 | optional 탭 |
| 4 | SSR | SSR | KPI·차트 데이터 계산 | 서버 사이드 |
| 5 | SSR | Browser | HTML + JSON | 초기 상태 포함 |

---

## 4. SEQ-003: 종목 상세 — 캐시 HIT

**연계 UC**: UC-007, UC-008, UC-009, UC-010, UC-011  
**참여자**: Browser, API Route, _TICKER_CACHE_ (Sheets)

```mermaid
sequenceDiagram
    actor Browser
    participant API as Next.js API Route
    participant Cache as _TICKER_CACHE_ (Sheets)

    Browser->>API: GET /api/kis/price?code=005930

    API->>Cache: key='005930_price' 조회
    Cache-->>API: { value, cachedAt }

    API->>API: TTL 검증 (cachedAt + 30분 > now?)

    alt 캐시 유효 (HIT)
        API-->>Browser: 200 { data: StockPrice, cachedAt }
    end
```

### 메시지 정의

| 순서 | 발신 | 수신 | 메시지 | 비고 |
|:---:|:---|:---|:---|:---|
| 1 | Browser | API | GET /api/kis/price?code= | JWT 쿠키 |
| 2 | API | Cache | key 조회 | Sheets API |
| 3 | API | API | TTL 30분 검증 | |
| 4 | API | Browser | 200 + cachedAt | 캐시 HIT |

---

## 5. SEQ-004: 종목 상세 — 캐시 MISS (KIS+DART 병렬 호출)

**연계 UC**: UC-007, UC-008, UC-009, UC-010, UC-011  
**참여자**: Browser, API Route, _TICKER_CACHE_, KIS API, DART API

```mermaid
sequenceDiagram
    actor Browser
    participant API as Next.js API Route
    participant Cache as _TICKER_CACHE_
    participant KIS as KIS Open API
    participant DART as DART API

    Browser->>API: GET /api/kis/price?code=005930
    API->>Cache: key='005930_price' 조회
    Cache-->>API: 없음 또는 TTL 만료 (MISS)

    API->>API: KIS 액세스 토큰 확인
    alt 토큰 없음 / 만료
        API->>KIS: POST /oauth2/tokenP (1일 1회 제한)
        KIS-->>API: accessToken
        API->>API: globalThis + /tmp/ 저장 (softExpireKisToken)
    end

    par KIS 병렬 호출 (400ms 스로틀)
        API->>KIS: 시세 조회 (FHKST01010100)
        KIS-->>API: 시세 응답
    and
        Note over API,KIS: 각 호출 사이 400ms 대기 (BR-005)
    end

    alt KIS Rate Limit 초과
        KIS-->>API: EGW00133
        API-->>Browser: 429 { error: 'KIS_RATE_LIMIT' }
    end

    API->>Cache: key='005930_price' 저장 (cachedAt = now)
    Cache-->>API: 저장 완료

    API-->>Browser: 200 { data: StockPrice }
```

### 메시지 정의

| 순서 | 발신 | 수신 | 메시지 | 비고 |
|:---:|:---|:---|:---|:---|
| 1 | Browser | API | GET /api/kis/price?code= | |
| 2 | API | Cache | key 조회 | MISS 또는 만료 |
| 3 | API | KIS | 토큰 발급 (조건부) | 1일 1회 |
| 4 | API | KIS | 시세 조회 | 400ms 스로틀 |
| 5 | API | Cache | 결과 저장 | cachedAt = now |
| 6 | API | Browser | 200 | 최신 데이터 |

---

## 6. SEQ-005: 데이터 갱신 버튼 (60초 통합 갱신)

**연계 UC**: UC-015  
**참여자**: Browser, /refresh API, KIS API (×6), DART API, _TICKER_CACHE_

```mermaid
sequenceDiagram
    actor Browser
    participant RefreshAPI as POST /api/ticker/[code]/refresh
    participant KIS as KIS Open API
    participant DART as DART API
    participant Cache as _TICKER_CACHE_

    Browser->>RefreshAPI: POST /api/ticker/005930/refresh
    Note over RefreshAPI: maxDuration=60 (Vercel Pro)

    RefreshAPI->>RefreshAPI: ProgressIndicator 초기화

    par 병렬 갱신 (KIS 6개 + DART 1개)
        RefreshAPI->>KIS: 시세 (price)
        KIS-->>RefreshAPI: StockPrice
        RefreshAPI->>Cache: '005930_price' 저장
    and
        RefreshAPI->>KIS: 가치평가 (valuation)
        KIS-->>RefreshAPI: Valuation
        RefreshAPI->>Cache: '005930_valuation' 저장
    and
        RefreshAPI->>KIS: 재무 (financial)
        KIS-->>RefreshAPI: FinancialSummary
        RefreshAPI->>Cache: '005930_financial' 저장
    and
        RefreshAPI->>KIS: 일봉 (dailyPrice)
        KIS-->>RefreshAPI: DailyPrice[]
        RefreshAPI->>Cache: '005930_dailyPrice' 저장
    and
        RefreshAPI->>KIS: 매매동향 (tradingTrend)
        KIS-->>RefreshAPI: TradingTrend[]
        RefreshAPI->>Cache: '005930_tradingTrend' 저장
    and
        RefreshAPI->>KIS: 투자의견 (opinion)
        KIS-->>RefreshAPI: AnalystOpinion[]
        RefreshAPI->>Cache: '005930_opinion' 저장
    and
        RefreshAPI->>DART: 재무·공시 (dart)
        DART-->>RefreshAPI: DartFinancial
        RefreshAPI->>Cache: '005930_dart' 저장
    end

    alt 60초 초과
        RefreshAPI-->>Browser: 504 타임아웃
    else 정상 완료
        RefreshAPI-->>Browser: 200 { refreshedSections, elapsedMs }
    end

    Browser->>Browser: Toast 알림 + 마지막 갱신 시각 업데이트
```

### 메시지 정의

| 순서 | 발신 | 수신 | 메시지 | 비고 |
|:---:|:---|:---|:---|:---|
| 1 | Browser | RefreshAPI | POST /api/ticker/[code]/refresh | |
| 2~8 | RefreshAPI | KIS/DART | 7개 섹션 병렬 조회 | 400ms 스로틀 내 |
| 9 | RefreshAPI | Cache | 각 섹션 결과 저장 | cachedAt 갱신 |
| 10 | RefreshAPI | Browser | 200 완료 / 504 타임아웃 | |

---

## 7. SEQ-006: AI 분석 조회 및 강제 갱신

**연계 UC**: UC-014  
**참여자**: Browser, AI API Route, _AI_CACHE_, OpenAI API, Google Sheets (매매내역)

```mermaid
sequenceDiagram
    actor Browser
    participant AIAPI as GET /api/ai/analysis
    participant AICache as _AI_CACHE_
    participant Sheets as Google Sheets (매매내역)
    participant OpenAI as OpenAI API (gpt-4o-mini)
    participant ForceAPI as POST /api/ai/analysis

    %% 일반 조회 (캐시 HIT)
    Browser->>AIAPI: GET /api/ai/analysis?code=005930
    AIAPI->>AICache: code='005930' 조회
    AICache-->>AIAPI: { content, cachedAt }

    AIAPI->>AIAPI: TTL 검증 (cachedAt + 7일 > now?)

    alt 캐시 유효 (HIT)
        AIAPI-->>Browser: 200 { data: AiAnalysisResult, cachedAt }
    else 캐시 만료 또는 없음 (MISS)
        AIAPI->>Sheets: 해당 종목 매매 일지 조회
        Sheets-->>AIAPI: SheetTransactionRow[] (해당 종목)
        AIAPI->>OpenAI: gpt-4o-mini 호출 (종목정보 + 매매일지 컨텍스트)
        OpenAI-->>AIAPI: 분석 텍스트
        AIAPI->>AICache: code='005930' 저장 (cachedAt = now)
        AIAPI-->>Browser: 200 { data: AiAnalysisResult }
    end

    %% 강제 갱신
    Browser->>ForceAPI: POST /api/ai/analysis { code: '005930' }
    ForceAPI->>Sheets: 매매 일지 조회 (캐시 무시)
    Sheets-->>ForceAPI: SheetTransactionRow[]
    ForceAPI->>OpenAI: gpt-4o-mini 재호출
    OpenAI-->>ForceAPI: 새 분석 텍스트
    ForceAPI->>AICache: content + cachedAt 갱신
    ForceAPI-->>Browser: 200 { data: AiAnalysisResult }
```

### 메시지 정의

| 순서 | 발신 | 수신 | 메시지 | 비고 |
|:---:|:---|:---|:---|:---|
| 1 | Browser | AIAPI | GET /api/ai/analysis?code= | |
| 2 | AIAPI | AICache | code 조회 | |
| 3a | AIAPI | Browser | 200 + cachedAt | 캐시 HIT |
| 3b | AIAPI | Sheets | 매매 일지 조회 | 캐시 MISS |
| 4 | AIAPI | OpenAI | gpt-4o-mini 호출 | FR-020 |
| 5 | AIAPI | AICache | 결과 저장 | 7일 TTL |
| 6 | Browser | ForceAPI | POST (강제 갱신) | RefreshButton |

---

## 8. 공통 오류 처리 시퀀스

```mermaid
sequenceDiagram
    actor Browser
    participant API as API Route
    participant Middleware as middleware.ts

    Browser->>Middleware: 요청 (만료된 쿠키)
    Middleware->>Middleware: JWT 검증 실패
    Middleware-->>Browser: 401

    Browser->>Browser: SessionExpiredPrompt 렌더링
    Note over Browser: 리다이렉트 없음 (SR-005)
    Browser->>Browser: "다시 로그인" 버튼 표시
```
