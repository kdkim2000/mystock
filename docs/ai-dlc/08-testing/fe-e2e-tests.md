# E2E 테스트 명세 — 프론트엔드 컴포넌트

| 항목 | 내용 |
|:---|:---|
| 생성일 | 2026-06-07 |
| 스킬 | `/ai-dlc-fe-e2e-test-gen` |
| 테스트 도구 | Playwright 1.60.0 |
| 대상 | 대시보드 UI, 종목 분석 테이블, 에러 상태 |

---

## 1. 커버리지 범위

| 유즈케이스 | 시나리오 수 | 파일 |
|:---|:---:|:---|
| UC-003 포트폴리오 대시보드 조회 | 5 | `dashboard.spec.ts` |
| UC-005 거래 내역 조회 | 1 | `dashboard.spec.ts` |
| UC-006 차트 조회 | 1 | `dashboard.spec.ts` |
| UC-008 종목 상세 페이지 이동 (FR-008) | 1 | `dashboard.spec.ts` |
| API 오류 상태 | 3 | `error-states.spec.ts` |

---

## 2. 테스트 시나리오

### 2.1 대시보드 (`tests/e2e/dashboard.spec.ts`)

**실행 프로젝트**: `chromium` (storageState 사용)

#### T010~T011: 대시보드 레이아웃

| ID | 시나리오 | 기대 결과 |
|:---:|:---|:---|
| T010 | `/dashboard` 접근 | `dashboard-container` 렌더링 |
| T011 | KPI 카드 4개 렌더링 | `kpi-card-investment`, `kpi-card-pnl`, `kpi-card-trades`, `kpi-card-winrate` 표시 |

**KPI 카드 데이터** (mockAggregation 기준):
- 총 투자금액: 삼성전자(700,000) + SK하이닉스(900,000) = 1.6M원
- 실현손익: 50,000 - 20,000 = 30,000원
- 거래횟수: 5 + 3 = 8회
- 승률: (3+1)/(5+3) = 50.0%

#### T020~T021: 종목별 분석 테이블

| ID | 시나리오 | 기대 결과 |
|:---:|:---|:---|
| T020 | `stock-analysis-table` 렌더링 | 테이블 표시, `stock-row-삼성전자` 표시 |
| T021 | 종목명 링크 클릭 | `/stock/005930` 이동 (FR-008 검증) |

**FR-008 구현 확인** (`src/components/dashboard/stock-analysis-table.tsx`):
```tsx
{row.Code
  ? <Link href={`/stock/${row.Code}`} className="hover:underline">{row.Ticker}</Link>
  : row.Ticker}
```
`AggregationRow.Code` 필드가 있으면 Link 렌더링, 없으면 텍스트만 표시.

#### T025: 거래 내역 테이블

| ID | 시나리오 | 기대 결과 |
|:---:|:---|:---|
| T025 | `trade-history-table` 렌더링 | 테이블 표시, 삼성전자 거래 내역 포함 |

#### T030: 스켈레톤 → 데이터 전환

| ID | 시나리오 | 기대 결과 |
|:---:|:---|:---|
| T030 | API 응답 지연 중 로딩 상태 | Skeleton 표시 후 데이터 렌더링 |

#### T035: Sheets API 오류

| ID | 시나리오 | 기대 결과 |
|:---:|:---|:---|
| T035 | Sheets API 500 오류 | 빈 테이블 + "거래 데이터가 없습니다." 표시 |

---

### 2.2 에러 상태 (`tests/e2e/error-states.spec.ts`)

**실행 프로젝트**: `chromium` (storageState 사용)

| ID | 시나리오 | 기대 결과 |
|:---:|:---|:---|
| T050 | KIS API 500 오류 | 종목 상세 기본 렌더링 (크래시 없음), refresh 버튼 표시 |
| T051 | Sheets API 500 오류 | 대시보드 렌더링, "거래 데이터가 없습니다." 표시 |
| T055 | 401 응답 (SR-005) | `/auth/signin` 리다이렉트 없음, UI 프롬프트만 표시 |

**SR-005 요구사항**: `middleware.ts` 세션 확인은 초기 페이지 로드에서만 동작. 클라이언트 측 API 401은 강제 리다이렉트하지 않고 UI 프롬프트만 표시.

---

## 3. 더미 데이터 (픽스처)

### `mockAggregation` (`tests/fixtures/mock-data.ts`)

```typescript
[
  { Ticker: '삼성전자', Code: '005930', Holdings: 10, AvgPrice: 70000,
    TotalBuy: 700000, RealizedPnL: 50000, TradeCount: 5, WinCount: 3 },
  { Ticker: 'SK하이닉스', Code: '000660', Holdings: 5, AvgPrice: 180000,
    TotalBuy: 900000, RealizedPnL: -20000, TradeCount: 3, WinCount: 1 },
]
```

### `mockTransactions`

```typescript
[
  { Date: '2026-06-01', Ticker: '삼성전자', Type: '매수', Quantity: 10,
    Price: 70000, Journal: '저점 매수', Tags: '가치투자' },
  { Date: '2026-06-05', Ticker: 'SK하이닉스', Type: '매도', Quantity: 5,
    Price: 185000, Journal: '목표가 도달', Tags: '단기매매' },
]
```

---

## 4. 미커버 시나리오

현재 E2E 테스트에서 제외된 항목 (복잡도 또는 서버 의존성):

| 항목 | 제외 이유 | 대안 |
|:---|:---|:---|
| 차트 SVG 렌더링 검증 | Recharts SVG 좌표 검증 복잡 | 시각적 회귀 테스트로 대체 가능 |
| 페이지네이션 (20개 이상 데이터) | 테스트 데이터 2건으로 페이지네이션 미발생 | 모킹 데이터 확장으로 가능 |
| AI 분석 결과 표시 | OpenAI API 응답 구조 변동 가능 | `ai-analysis-content` testid로 유닛 테스트 권장 |
| 다크/라이트 모드 전환 | CSS 변수 기반으로 E2E 불필요 | 스크린샷 비교로 검증 가능 |

---

## 5. 실행 명령

```bash
# 전체 프론트엔드 E2E 테스트
npx playwright test tests/e2e/dashboard.spec.ts tests/e2e/error-states.spec.ts

# 단일 테스트 (--grep 패턴)
npx playwright test --grep "T021"

# 디버그 모드
npx playwright test --debug tests/e2e/dashboard.spec.ts
```
