# 코드 추적성 매트릭스 (Traceability Matrix)

| 항목 | 내용 |
|:---|:---|
| 작성일 | 2026-06-07 |
| 기준 | FR-001 ~ FR-022 (총 22건) |
| 검사자 | Claude Sonnet 4.6 (AI-DLC Phase 7) |
| 프로젝트 | my-stock — 한국 주식 투자 대시보드 (Next.js 15) |

---

## 1. 요약

| 구분 | 건수 |
|:---|:---:|
| 전체 FR | 22건 |
| 구현 완료 | 21건 |
| 부분 구현 | 1건 |
| 미구현 | 0건 |
| 고아 코드 (FR 연결 없는 파일) | 0건 |

> **종합 구현율: 21/22 = 95.5%** (FR-008 링크 미연결로 부분 구현 처리)

---

## 2. FR → 소스 추적 매트릭스

### Phase A — 인증 (FR-001 ~ FR-002)

| FR-ID | 기능 요구사항 | 구현 파일 | 상태 |
|:---|:---|:---|:---:|
| FR-001 | Google OAuth 로그인 (ALLOWED_EMAIL 이메일 제한) | `src/lib/auth.ts` · `middleware.ts` · `src/app/api/auth/[...nextauth]/route.ts` · `src/app/auth/signin/page.tsx` · `src/components/auth/sign-in-content.tsx` · `src/components/auth/login-card.tsx` | ✅ 구현완료 |
| FR-002 | 로그아웃 (NextAuth signOut) | `src/lib/auth.ts` · `src/app/api/auth/[...nextauth]/route.ts` · `src/components/auth/sign-in-content.tsx` · `src/components/auth/login-card.tsx` | ✅ 구현완료 |

**FR-001 상세**: `src/lib/auth.ts`의 `signIn` 콜백에서 `ALLOWED_EMAIL` 환경변수로 단일 이메일 접근 제한 구현. `middleware.ts`에서 NextAuth 기본 미들웨어로 전역 세션 보호 적용. 로그인 페이지는 `/auth/signin` 커스텀 경로로 분리.

**FR-002 상세**: NextAuth `signOut` 기능은 클라이언트 컴포넌트(`sign-in-content.tsx`, `login-card.tsx`)에서 호출. 세션 관련 라우트는 `/api/auth/[...nextauth]/route.ts`에서 통합 처리.

---

### Phase B — 대시보드 (FR-003 ~ FR-009)

| FR-ID | 기능 요구사항 | 구현 파일 | 상태 |
|:---|:---|:---|:---:|
| FR-003 | 대시보드 KPI 카드 (실현손익, 평가손익, 승률, 총자산) | `src/app/dashboard/page.tsx` · `src/components/dashboard/dashboard-client.tsx` · `src/components/dashboard/kpi-card.tsx` · `src/app/api/sheets/transactions/route.ts` · `src/app/api/sheets/aggregation/route.ts` | ✅ 구현완료 |
| FR-004 | 포지션 집중도 차트 (보유 종목별 비중) | `src/components/dashboard/position-bar-chart.tsx` · `src/app/api/sheets/aggregation/route.ts` | ✅ 구현완료 |
| FR-005 | 손익 기여도 차트 (종목별 실현손익 기여) | `src/components/dashboard/profit-bar-chart.tsx` · `src/app/api/sheets/aggregation/route.ts` | ✅ 구현완료 |
| FR-006 | 누적 실현손익 추이 차트 (1M/6M/1Y) | `src/components/dashboard/cumulative-profit-chart.tsx` · `src/app/api/sheets/transactions/route.ts` | ✅ 구현완료 |
| FR-007 | 종목별 분석 테이블 (현재가, 평균매수가, 수익률 등) | `src/components/dashboard/stock-analysis-table.tsx` · `src/app/api/sheets/aggregation/route.ts` · `src/app/api/sheets/ticker-master/route.ts` | ✅ 구현완료 |
| FR-008 | 종목 상세 페이지 링크 (테이블 → /stock/[code]) | `src/components/dashboard/stock-analysis-table.tsx` · `src/app/stock/[code]/page.tsx` | ⚠️ 부분구현 |
| FR-009 | 매매 내역 테이블 (날짜, 종목, 유형, 수량, 가격, 메모, 태그) | `src/components/dashboard/trade-history-table.tsx` · `src/components/dashboard/strategy-table.tsx` · `src/app/api/sheets/transactions/route.ts` | ✅ 구현완료 |

**FR-008 부분구현 근거**: `/stock/[code]` 페이지(`src/app/stock/[code]/page.tsx`)는 정상 구현되어 있으나, `src/components/dashboard/stock-analysis-table.tsx`의 테이블 행(TableRow)에 `/stock/[code]`로 이동하는 `Link` 또는 `href` 속성이 없다. 현재 테이블은 클릭 이벤트 없이 정보 표시만 수행하며, 종목 상세 페이지로의 네비게이션이 UI 수준에서 연결되지 않은 상태다.

---

### Phase C — 종목 상세 (FR-010 ~ FR-022)

| FR-ID | 기능 요구사항 | 구현 파일 | 상태 |
|:---|:---|:---|:---:|
| FR-010 | 종목 시세 조회 (현재가, 전일비, 52주 고/저, 거래량) | `src/components/stock/price-card.tsx` · `src/app/api/kis/price/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-011 | 가치평가 지표 (PER, PBR, EPS, BPS, ROE, ROA, 부채비율) | `src/components/stock/valuation-table.tsx` · `src/app/api/kis/valuation/route.ts` · `src/app/api/fundamental/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-012 | 재무제표 (자산, 부채, 자본, 매출, 영업이익, 순이익) | `src/components/stock/financial-table.tsx` · `src/app/api/kis/financial/route.ts` · `src/app/api/fundamental/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-013 | 재무 레이더 차트 (수익성, 성장성, 안정성, 현금흐름, 효율성) | `src/components/stock/financial-radar-chart.tsx` · `src/app/api/fundamental/route.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-014 | 추정 실적 (예상 매출액, 영업이익, 순이익) | `src/components/stock/estimate-table.tsx` · `src/components/stock/valuation-table.tsx` · `src/app/api/fundamental/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-015 | 매매동향 (개인/외국인/기관 순매수) | `src/components/stock/investor-trend-chart.tsx` · `src/app/api/kis/trading-trend/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-016 | 애널리스트 투자의견 (증권사, 의견, 목표주가, 날짜) | `src/components/stock/opinion-table.tsx` · `src/app/api/kis/opinion/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-017 | DART 공시 및 DART 재무제표 (전년/당해 손익계산서) | `src/components/stock/dart-disclosure-card.tsx` · `src/app/api/dart/financial/route.ts` · `src/lib/dart.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-018 | 내 포트폴리오 현황 (보유 수량, 평단가, 현재가, 손익률) | `src/components/stock/portfolio-card.tsx` · `src/app/api/sheets/aggregation/route.ts` · `src/lib/sheets.ts` | ✅ 구현완료 |
| FR-019 | 보조지표 RSI·MACD (클라이언트 사이드 계산, 일봉 30일) | `src/components/stock/rsi-macd-card.tsx` · `src/lib/indicators.ts` · `src/app/api/kis/daily-price/route.ts` · `src/lib/kis.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-020 | AI 종목 분석 (gpt-4o-mini, 7일 캐시, 강제 갱신 지원) | `src/components/stock/ai-analysis-card.tsx` · `src/app/api/ai/analysis/route.ts` · `src/lib/ai.ts` · `src/lib/cache.ts` | ✅ 구현완료 |
| FR-021 | 매매 일지 (종목별 메모·태그 표시) | `src/components/stock/journal-table.tsx` · `src/lib/sheets.ts` · `src/app/api/sheets/transactions/route.ts` | ✅ 구현완료 |
| FR-022 | 데이터 통합 갱신 (KIS 6개 섹션 + DART 병렬, maxDuration=60) | `src/components/stock/refresh-section.tsx` · `src/app/api/ticker/[code]/refresh/route.ts` · `src/lib/kis.ts` · `src/lib/dart.ts` · `src/lib/cache.ts` | ✅ 구현완료 |

---

## 3. 소스 → FR 역추적 (고아 코드 탐지)

### 3.1 인증 계층

| 구현 파일 | 연관 FR | 고아 여부 |
|:---|:---|:---:|
| `src/lib/auth.ts` | FR-001, FR-002 | — |
| `middleware.ts` | FR-001 | — |
| `src/app/api/auth/[...nextauth]/route.ts` | FR-001, FR-002 | — |
| `src/app/auth/signin/page.tsx` | FR-001 | — |
| `src/components/auth/sign-in-content.tsx` | FR-001, FR-002 | — |
| `src/components/auth/login-card.tsx` | FR-001, FR-002 | — |
| `src/components/auth/auth-error-message.tsx` | FR-001 (에러 메시지 표시) | — |

### 3.2 대시보드 계층

| 구현 파일 | 연관 FR | 고아 여부 |
|:---|:---|:---:|
| `src/app/dashboard/page.tsx` | FR-003 ~ FR-009 | — |
| `src/components/dashboard/dashboard-client.tsx` | FR-003 ~ FR-009 | — |
| `src/components/dashboard/kpi-card.tsx` | FR-003 | — |
| `src/components/dashboard/position-bar-chart.tsx` | FR-004 | — |
| `src/components/dashboard/profit-bar-chart.tsx` | FR-005 | — |
| `src/components/dashboard/cumulative-profit-chart.tsx` | FR-006 | — |
| `src/components/dashboard/stock-analysis-table.tsx` | FR-007, FR-008 (부분) | — |
| `src/components/dashboard/trade-history-table.tsx` | FR-009 | — |
| `src/components/dashboard/strategy-table.tsx` | FR-009 | — |
| `src/app/api/sheets/transactions/route.ts` | FR-003, FR-009 | — |
| `src/app/api/sheets/aggregation/route.ts` | FR-003, FR-007 | — |
| `src/app/api/sheets/ticker-master/route.ts` | FR-007 | — |

### 3.3 종목 상세 계층

| 구현 파일 | 연관 FR | 고아 여부 |
|:---|:---|:---:|
| `src/app/stock/[code]/page.tsx` | FR-010 ~ FR-022 | — |
| `src/components/stock/stock-detail-client.tsx` | FR-010 ~ FR-022 | — |
| `src/components/stock/anchor-menu.tsx` | FR-010 ~ FR-022 (섹션 네비게이션) | — |
| `src/components/stock/price-card.tsx` | FR-010 | — |
| `src/components/stock/valuation-table.tsx` | FR-011, FR-014 | — |
| `src/components/stock/financial-table.tsx` | FR-012 | — |
| `src/components/stock/financial-radar-chart.tsx` | FR-013 | — |
| `src/components/stock/estimate-table.tsx` | FR-014 | — |
| `src/components/stock/investor-trend-chart.tsx` | FR-015 | — |
| `src/components/stock/opinion-table.tsx` | FR-016 | — |
| `src/components/stock/dart-disclosure-card.tsx` | FR-017 | — |
| `src/components/stock/portfolio-card.tsx` | FR-018 | — |
| `src/components/stock/rsi-macd-card.tsx` | FR-019 | — |
| `src/components/stock/ai-analysis-card.tsx` | FR-020 | — |
| `src/components/stock/journal-table.tsx` | FR-021 | — |
| `src/components/stock/refresh-section.tsx` | FR-022 | — |

### 3.4 API 라우트 계층

| 구현 파일 | 연관 FR | 고아 여부 |
|:---|:---|:---:|
| `src/app/api/kis/price/route.ts` | FR-010 | — |
| `src/app/api/kis/valuation/route.ts` | FR-011 | — |
| `src/app/api/kis/financial/route.ts` | FR-012 | — |
| `src/app/api/kis/trading-trend/route.ts` | FR-015 | — |
| `src/app/api/kis/opinion/route.ts` | FR-016 | — |
| `src/app/api/kis/daily-price/route.ts` | FR-019 | — |
| `src/app/api/fundamental/route.ts` | FR-011 ~ FR-014 | — |
| `src/app/api/dart/financial/route.ts` | FR-017 | — |
| `src/app/api/ai/analysis/route.ts` | FR-020 | — |
| `src/app/api/ticker/[code]/refresh/route.ts` | FR-022 | — |

### 3.5 공통 라이브러리 계층

| 구현 파일 | 연관 FR | 고아 여부 |
|:---|:---|:---:|
| `src/lib/kis.ts` | FR-010 ~ FR-016, FR-019, FR-022 | — |
| `src/lib/dart.ts` | FR-017, FR-022 | — |
| `src/lib/sheets.ts` | FR-003, FR-009, FR-021 | — |
| `src/lib/cache.ts` | FR-010 ~ FR-022 (캐시 계층 전반) | — |
| `src/lib/ai.ts` | FR-020 | — |
| `src/lib/indicators.ts` | FR-019 | — |
| `src/lib/auth.ts` | FR-001, FR-002 | — |
| `src/lib/env.ts` | FR-001 (ALLOWED_EMAIL 등 환경변수 관리) | — |
| `src/lib/api-response.ts` | FR-010 ~ FR-022 (API 응답 표준화) | — |
| `src/lib/utils.ts` | 공통 유틸리티 (shadcn/ui cn 함수 등) | — |

### 3.6 Hooks 계층

| 구현 파일 | 연관 FR | 고아 여부 |
|:---|:---|:---:|
| `src/hooks/use-aggregation.ts` | FR-003 ~ FR-008, FR-018 | — |
| `src/hooks/use-transactions.ts` | FR-009, FR-021 | — |
| `src/hooks/use-stock-price.ts` | FR-010 | — |
| `src/hooks/use-ai-analysis.ts` | FR-020 | — |
| `src/hooks/use-refresh-ai-analysis.ts` | FR-020 | — |
| `src/hooks/use-refresh-all.ts` | FR-022 | — |
| `src/hooks/use-toast.ts` | FR-020, FR-022 (알림 UX) | — |

> **고아 코드 없음**: 전체 소스 파일이 하나 이상의 FR에 매핑되어 있거나, 공통 인프라(표준화·유틸리티) 역할로 명확히 분류된다.

---

## 4. 부분 구현 FR 상세 분석

### FR-008 — 종목 상세 페이지 링크 (부분구현)

| 항목 | 내용 |
|:---|:---|
| 요구사항 | 대시보드 종목별 분석 테이블에서 각 행 클릭 시 `/stock/[code]`로 이동 |
| 목적 파일 | `src/components/dashboard/stock-analysis-table.tsx` |
| 현재 상태 | 테이블 행(`TableRow`)에 클릭 이벤트·`Link` 없음 |
| 착지 페이지 | `src/app/stock/[code]/page.tsx` 구현 완료 |
| 미구현 범위 | 대시보드 테이블 → 종목 상세 페이지 네비게이션 연결 |

**현재 코드 상태**: `stock-analysis-table.tsx`의 각 `TableRow`는 종목명·보유수량·평균단가·실현손익·승률·거래횟수를 표시하나, `href`, `onClick`, `useRouter().push` 등의 이동 수단이 전혀 없다. `/stock/[code]` 페이지 자체는 완성되어 있으며, 역방향(`stock-detail-client.tsx`의 "← 대시보드" 링크)만 구현된 상태.

**보완 필요 사항**:
```tsx
// stock-analysis-table.tsx 수정 방향 (예시)
import Link from 'next/link'
// ...
<TableRow key={row.Ticker} className="cursor-pointer hover:bg-muted/50">
  <TableCell className="font-medium">
    <Link href={`/stock/${row.Code}`}>{row.Ticker}</Link>
  </TableCell>
  {/* ... */}
</TableRow>
```
- `AggregationRow`에 `Code` 필드가 이미 존재하므로 (`row.Code`) 링크 생성 가능
- 구현 난이도: 낮음 (약 5줄 수정)

---

## 5. 종합 판정

### 5.1 구현율 통계

| 구분 | 건수 | 비율 |
|:---|:---:|:---:|
| 구현 완료 (✅) | 21 | 95.5% |
| 부분 구현 (⚠️) | 1 | 4.5% |
| 미구현 | 0 | 0% |
| **전체** | **22** | **100%** |

### 5.2 계층별 구현 현황

| 계층 | FR 범위 | 상태 |
|:---|:---|:---:|
| 인증 계층 | FR-001, FR-002 | ✅ 전체 완료 |
| 대시보드 계층 | FR-003 ~ FR-009 | ⚠️ FR-008 부분구현 |
| 종목 상세 계층 | FR-010 ~ FR-022 | ✅ 전체 완료 |
| 캐시/인프라 계층 | FR-010 ~ FR-022 지원 | ✅ 3계층 캐시 완료 |

### 5.3 특이사항

| 항목 | 내용 |
|:---|:---|
| 캐시 아키텍처 | `src/lib/cache.ts`가 `globalThis` → Google Sheets 2계층 캐시를 구현, FR-010~FR-022 전체를 지원 |
| DART 통합 갱신 | `src/app/api/ticker/[code]/refresh/route.ts`의 `maxDuration=60` 선언 확인 (Vercel Pro 필수 조건 충족) |
| 클라이언트 사이드 지표 | FR-019 RSI·MACD는 `src/lib/indicators.ts`에서 서버 의존 없이 클라이언트 계산, 설계 일치 |
| AI 캐시 정책 | FR-020 AI 분석은 `_AI_CACHE_` 탭에 7일 TTL로 분리 저장, 강제 갱신 버튼 포함 |
| 세션 보호 전략 | `middleware.ts`가 NextAuth 기본 미들웨어를 사용하여 `/api/auth`, `/auth/signin`, `_next/*` 경로 제외 전역 적용 |

### 5.4 최종 판정

> **조건부 통과** — FR 22건 중 21건 구현 완료(95.5%), 1건(FR-008) 부분 구현.
> FR-008은 `/stock/[code]` 페이지 자체는 완성되어 있고 단순 링크 연결만 누락된 낮은 위험도 항목이다.
> 핵심 비즈니스 기능(인증, 대시보드 분석, 종목 상세, AI 분석, 데이터 갱신)은 모두 완료 상태이므로 Phase 7 검증을 통과한다.
>
> **권고 조치**: `stock-analysis-table.tsx`에서 각 행에 `/stock/[row.Code]` 링크 추가 (약 5줄 수정, 우선순위: 중간)
