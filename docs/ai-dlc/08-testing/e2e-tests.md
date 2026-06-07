# E2E 테스트 명세 — Next.js App Router

| 항목 | 내용 |
|:---|:---|
| 생성일 | 2026-06-07 |
| 스킬 | `/ai-dlc-nxt-e2e-test-gen` |
| 테스트 도구 | Playwright 1.60.0 |
| 대상 | 인증·리다이렉트, 종목 상세, 데이터 갱신 |

---

## 1. 테스트 환경

### 1.1 프로젝트 구성 (`playwright.config.ts`)

| 프로젝트 | 대상 파일 | storageState | 목적 |
|:---|:---|:---|:---|
| `setup` | `tests/auth.setup.ts` | — | JWT 쿠키 주입 후 storageState 파일 생성 |
| `chromium` | `tests/e2e/**` (`auth.spec.ts` 제외) | `tests/.auth/user.json` | 인증된 사용자 시나리오 |
| `no-auth` | `tests/e2e/auth.spec.ts` | — | 미인증 접근 보호 시나리오 |

### 1.2 인증 전략

Google OAuth 자동화 불가 → **JWT storageState 쿠키 주입** 방식 사용:
- `next-auth/jwt`의 `encode()` 함수로 `AUTH_SECRET`을 사용해 JWT 생성
- `context.addCookies()` 로 `next-auth.session-token` 쿠키 주입
- 프로덕션 코드(`middleware.ts`, `auth.ts`) 무변경

### 1.3 API 모킹 전략

`page.route()` 패턴으로 외부 API 격리:
- `mockSheetsApi(page)` — `/api/sheets/*` → 더미 집계·거래 데이터 반환
- `mockKisApi(page)` — `/api/kis/*`, `/api/fundamental` → 더미 가격·재무 데이터 반환
- `mockRefreshApi(page, { fail })` — `/api/ticker/*/refresh` → 성공/실패 시뮬레이션
- `mockSheetsApiError(page)` — `/api/sheets/**` → HTTP 500 반환

---

## 2. 테스트 시나리오

### 2.1 인증·리다이렉트 (`tests/e2e/auth.spec.ts`)

**관련 유즈케이스**: UC-001 (시스템 로그인)  
**실행 프로젝트**: `no-auth` (storageState 없음)

| ID | 시나리오 | 전제 조건 | 기대 결과 |
|:---:|:---|:---|:---|
| T001 | 미인증 `/dashboard` 접근 | 미인증 | `/auth/signin` 리다이렉트 |
| T002 | 미인증 `/stock/005930` 접근 | 미인증 | `/auth/signin` 리다이렉트 |
| T003 | `/auth/signin` 페이지 렌더링 | 미인증 | `google-signin-button` 표시 |
| T004 | 잘못된 종목 코드 접근 | 인증 | `/dashboard` 리다이렉트 |
| T005 | 인증 상태에서 `/` 접근 | 인증 | `/dashboard` 리다이렉트 |

**코드 근거** (`src/app/stock/[code]/page.tsx`):
```typescript
if (!session) redirect('/auth/signin')            // T001, T002
if (!/^\d{6}$/.test(params.code)) redirect('/dashboard')  // T004
```

---

### 2.2 종목 상세 (`tests/e2e/stock-detail.spec.ts`)

**관련 유즈케이스**: UC-007~015 (종목 상세, 데이터 조회, 갱신)  
**실행 프로젝트**: `chromium` (storageState 사용)

| ID | 시나리오 | 전제 조건 | 기대 결과 |
|:---:|:---|:---|:---|
| T040 | `/stock/005930` 접근 | 인증 + KIS API 모킹 | `#sec-price` 렌더링, 종목명·현재가 표시 |
| T060 | `refresh-button` 클릭 성공 | 인증 + 갱신 API 모킹 | "갱신 중..." → "데이터 갱신 완료" Toast |
| T062 | `refresh-button` 클릭 실패 | 인증 + 갱신 실패 모킹 | "갱신 실패" destructive Toast |

**갱신 버튼 동작** (`src/components/stock/refresh-section.tsx`):
- `data-testid="refresh-button"` 속성으로 선택
- 클릭 시 `isPending=true` → 버튼 텍스트 "갱신 중..."
- 성공: `toast({ title: '데이터 갱신 완료', ... })`
- 실패: `toast({ title: '갱신 실패', variant: 'destructive' })`

---

## 3. 테스트 파일 목록

| 파일 | 테스트 수 | 실행 프로젝트 |
|:---|:---:|:---|
| `tests/auth.setup.ts` | 1 (setup) | `setup` |
| `tests/e2e/auth.spec.ts` | 5 (T001~T005) | `no-auth` |
| `tests/e2e/stock-detail.spec.ts` | 3 (T040, T060, T062) | `chromium` |
| `tests/fixtures/auth.ts` | — (픽스처) | — |
| `tests/fixtures/api-mocks.ts` | — (픽스처) | — |
| `tests/fixtures/mock-data.ts` | — (픽스처) | — |

---

## 4. 실행 방법

```bash
# 전체 E2E 테스트 실행 (dev 서버 자동 시작)
npm run test:e2e

# UI 모드 (대화형)
npm run test:e2e:ui

# 특정 파일만 실행
npx playwright test tests/e2e/auth.spec.ts

# 보고서 보기
npx playwright show-report
```

### 환경 변수 (`.env.test` 또는 CI 환경)

```
AUTH_SECRET=<실제 AUTH_SECRET 값>
TEST_USER_EMAIL=<ALLOWED_EMAIL과 동일>
```

---

## 5. 선택자 전략

`data-testid` 속성만 사용 (CSS 클래스·XPath 금지):

| 컴포넌트 | `data-testid` 값 |
|:---|:---|
| `login-card.tsx` Button | `google-signin-button` |
| `dashboard-client.tsx` root div | `dashboard-container` |
| `kpi-card.tsx` 4개 Card | `kpi-card-investment`, `kpi-card-pnl`, `kpi-card-trades`, `kpi-card-winrate` |
| `stock-analysis-table.tsx` div | `stock-analysis-table` |
| `stock-analysis-table.tsx` TableRow | `stock-row-{Ticker}` |
| `trade-history-table.tsx` div | `trade-history-table` |
| `trade-history-table.tsx` buttons | `pagination-prev`, `pagination-next` |
| `refresh-section.tsx` Button | `refresh-button` |
| `ai-analysis-card.tsx` Button | `ai-analysis-refresh-button` |
| `ai-analysis-card.tsx` content div | `ai-analysis-content` |
