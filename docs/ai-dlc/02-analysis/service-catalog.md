# 서비스 카탈로그

| 항목 | 내용 |
|:---|:---|
| 사업명 | my-stock |
| 작성일 | 2026-06-07 |
| 버전 | v0.1 |
| 기준 문서 | 요구사항정의서_my-stock_20260606.md · 시스템개요서_my-stock_20260607.md |
| 분류 기준 | 도메인 주도 (Domain-Driven) |

---

## 1. 서비스 카탈로그 요약

| 카테고리 | 서비스 수 | 연관 FR 수 |
|:---|:---:|---:|
| 인증 | 1 | 2 |
| 조회 | 1 | 7 |
| 분석 | 4 | 10 |
| 관리 | 1 | 3 |
| **합계** | **7** | **22** |

---

## 2. 서비스 카탈로그

| SC-ID | 서비스명 | 카테고리 | 연관 요구사항 ID | 설명 | 우선순위 |
|:---|:---|:---|:---|:---|:---:|
| SC-001 | 인증·세션 서비스 | 인증 | FR-001, FR-002 | Google OAuth 로그인·로그아웃, JWT 세션 관리, 단일 이메일 접근 제어 | Must |
| SC-002 | 대시보드 서비스 | 조회 | FR-003~009 | 포트폴리오 요약 카드, 차트, 종목별 분석 테이블, 매매 내역 조회 | Must |
| SC-003 | 종목 시세·가치평가 서비스 | 분석 | FR-010, FR-011, FR-013, FR-014 | KIS API 기반 현재가·등락률·PER·PBR·EPS 등 가치평가 지표 제공 | Must |
| SC-004 | 재무·공시 서비스 | 분석 | FR-012, FR-017 | KIS·DART 통합 재무제표, 5개년 추이, 현금흐름, 잠정실적 링크 | Must |
| SC-005 | 매매동향·투자의견 서비스 | 분석 | FR-015, FR-016 | 캔들스틱 차트, 투자자별 순매수 추이, 증권사 투자의견·목표가 | Must |
| SC-006 | AI·보조지표 서비스 | 분석 | FR-019, FR-020 | RSI/MACD 클라이언트 계산, gpt-4o-mini AI 종목 분석·매매 가이드 | Should |
| SC-007 | 내 투자·데이터 갱신 서비스 | 관리 | FR-018, FR-021, FR-022 | 보유 포트폴리오 현황, 매매 일지, KIS+DART 통합 캐시 갱신 | Must |

---

## 3. 서비스별 상세 카드

### SC-001 · 인증·세션 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | Google OAuth 2.0 기반 단일 사용자 인증 및 JWT 세션 관리 서비스 |
| **API Route** | NextAuth 내장 (`/api/auth/*`) |
| **외부 의존** | Google OAuth 2.0 (Client ID/Secret) |
| **캐시 정책** | Google OAuth 토큰: globalThis 인메모리, 5분 여유 전 갱신 |
| **연관 FR** | FR-001 Google OAuth 로그인, FR-002 로그아웃 |
| **주요 비기능** | SR-001 JWT 전역 보호, SR-002 ALLOWED_EMAIL 단일 이메일 제한, SR-005 만료 UI |
| **우선순위** | Must Have |

### SC-002 · 대시보드 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | Google Sheets 매매내역·집계 데이터 기반 포트폴리오 현황 및 차트 제공 서비스 |
| **API Route** | `/api/sheets/*` |
| **외부 의존** | Google Sheets API v4 (Service Account JWT) |
| **캐시 정책** | 별도 캐시 없음 (Sheets가 원본 데이터, 클라이언트 React Query 활용) |
| **연관 FR** | FR-003 요약카드, FR-004 포지션차트, FR-005 손익차트, FR-006 누적추이, FR-007 분석테이블, FR-008 전략별성과, FR-009 매매내역 |
| **주요 비기능** | PR-003 대시보드 5초 이내 로딩 |
| **우선순위** | Must Have (FR-003·007·009), Should Have (FR-004·005), Nice to Have (FR-006·008) |

### SC-003 · 종목 시세·가치평가 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | KIS Open API에서 실시간 시세, 가치평가(PER/PBR/EPS 등), 추정실적·레이더차트 데이터를 수집·캐싱하는 서비스 |
| **API Route** | `/api/kis/price`, `/api/kis/valuation`, `/api/fundamental/*` |
| **외부 의존** | KIS Open API (Bearer 토큰, 1일 1회 발급) |
| **캐시 정책** | `_TICKER_CACHE_` 탭: `{code}_price`, `{code}_valuation` 키, TTL 30분 |
| **연관 FR** | FR-010 시세요약, FR-011 가치평가, FR-013 레이더차트, FR-014 추정실적 |
| **주요 비기능** | PR-001 캐시 HIT 3초 이내, PR-004 KIS 400ms 스로틀, CR-003 초당 2.5건 제한 |
| **우선순위** | Must Have (FR-010·011), Nice to Have (FR-013·014) |

### SC-004 · 재무·공시 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | KIS 재무요약 + DART API 기반 5개년 재무추이, 현금흐름, 잠정실적 링크를 통합 제공하는 서비스 |
| **API Route** | `/api/kis/financial`, `/api/dart/*`, `/api/fundamental/*` |
| **외부 의존** | KIS Open API + DART API (API Key), CORPCODE.xml 캐시 |
| **캐시 정책** | `_TICKER_CACHE_` 탭: `{code}_financial`, `{code}_dart` 키, TTL 30분 (DART 재무: 1시간) |
| **연관 FR** | FR-012 재무요약, FR-017 DART공시정보 |
| **주요 비기능** | PR-004 KIS 스로틀, DART CORPCODE.xml 캐시 필수 |
| **우선순위** | Must Have |

### SC-005 · 매매동향·투자의견 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | KIS API에서 30일 일봉 캔들스틱, 투자자별 누적 순매수, 증권사 투자의견·목표가 데이터를 제공하는 서비스 |
| **API Route** | `/api/kis/daily-price`, `/api/kis/trading-trend`, `/api/kis/opinion` |
| **외부 의존** | KIS Open API |
| **캐시 정책** | `_TICKER_CACHE_` 탭: `{code}_dailyPrice`, `{code}_tradingTrend`, `{code}_opinion` 키, TTL 30분 |
| **연관 FR** | FR-015 매매동향, FR-016 투자의견 |
| **주요 비기능** | PR-004 KIS 스로틀 |
| **우선순위** | Must Have (FR-015), Nice to Have (FR-016) |

### SC-006 · AI·보조지표 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | dailyPrice 기반 RSI/MACD 클라이언트 계산과 gpt-4o-mini AI 종목 분석·매매 가이드 생성·캐싱 서비스 |
| **API Route** | `/api/ai/*` (AI 분석), RSI·MACD는 클라이언트 사이드 계산 (API 없음) |
| **외부 의존** | OpenAI API (gpt-4o-mini), KIS dailyPrice (RSI·MACD 입력) |
| **캐시 정책** | `_AI_CACHE_` 탭: `{code}` 키, TTL 7일. 강제 갱신 지원 |
| **연관 FR** | FR-019 보조지표(RSI·MACD), FR-020 AI분석·매매가이드 |
| **주요 비기능** | OpenAI API 비용 절감을 위한 7일 캐시, 강제 갱신 시 즉시 재호출 |
| **우선순위** | Should Have (FR-020), Nice to Have (FR-019) |

### SC-007 · 내 투자·데이터 갱신 서비스

| 항목 | 내용 |
|:---|:---|
| **설명** | Sheets 기반 보유 포트폴리오 현황·매매일지 제공 및 KIS+DART 전체 캐시 통합 갱신 서비스 |
| **API Route** | `/api/sheets/*` (포트폴리오·일지), `/api/ticker/[code]/refresh` (통합 갱신) |
| **외부 의존** | Google Sheets API v4, KIS Open API, DART API |
| **캐시 정책** | 갱신 버튼: `_TICKER_CACHE_` 전 섹션 강제 무효화 후 재수집 |
| **연관 FR** | FR-018 내포트폴리오, FR-021 매매일지, FR-022 데이터갱신버튼 |
| **주요 비기능** | PR-002 갱신 60초 이내, CR-005 maxDuration=60 (Vercel Pro 필수) |
| **우선순위** | Must Have (FR-018·022), Should Have (FR-021) |

---

## 4. 서비스 간 연계도 (텍스트)

```
[사용자 브라우저]
      │ HTTPS
      ▼
[SC-001 인증·세션] ──JWT 세션 검증──▶ [모든 서비스]
      │
      ▼
[SC-002 대시보드] ─────────────────▶ Google Sheets API
      │ 종목 상세 진입
      ▼
┌─────────────────────────────────────────────┐
│           종목 상세 서비스 그룹               │
│                                             │
│  [SC-003 시세·가치평가] ──▶ KIS API          │
│  [SC-004 재무·공시]  ──▶ KIS API + DART API  │
│  [SC-005 매매동향·투자의견] ──▶ KIS API      │
│  [SC-006 AI·보조지표] ──▶ OpenAI API         │
└─────────────────────────────────────────────┘
      │
      ▼
[SC-007 내 투자·갱신] ──▶ Google Sheets + KIS + DART (병렬)

공통 캐시: Google Sheets (_TICKER_CACHE_ 30분 / _AI_CACHE_ 7일)
```

---

## 5. 미분류 요구사항

미분류 요구사항 없음. FR-001~022 전체가 SC-001~007에 배정 완료.

---

## 문서 버전 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v0.1 | 2026-06-07 | Claude Sonnet 4.6 | 최초 생성 (7개 서비스, FR 22건 배정) |
