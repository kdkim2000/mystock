# Plan: Phase 6 구현 일괄 실행 (6-1 ~ 6-4)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `src/` 이하 전체 소스 코드 + `docs/ai-dlc/06-implementation/` |
| 목표 | 4개 AI-DLC 스킬로 my-stock 전체 소스 코드 생성 |

## 계획 내용

의존성 레이어 순서로 4개 배치 실행:

```
Batch 1: types(L0) → lib(L1) → api routes(L2)
  1A: src/types/* (5개 파일)
  1B: src/lib/env.ts · api-response.ts · indicators.ts + test
  1C: src/lib/auth.ts · sheets.ts (병렬)
  1D: src/lib/cache.ts
  1E: src/lib/kis.ts · dart.ts · ai.ts (병렬)
  1F: middleware.ts · /api/auth/route.ts
  1G: /api/sheets/* · /api/kis/* · /api/dart+fundamental+ai+refresh

Batch 2: Server Actions
  2A: src/lib/actions.ts (revalidatePath 기반)

Batch 3: Pages + App Shell
  3A: layout.tsx · page.tsx · providers.tsx
  3B: auth/signin/page.tsx
  3C: dashboard/page.tsx · stock/[code]/page.tsx

Batch 4: Hooks + Components
  4A: src/hooks/* (6개) + global/auth components
  4B: src/components/auth/* (3개)
  4C: src/components/dashboard/* (8개) — 병렬 에이전트
  4D: src/components/stock/* (15개) — 병렬 에이전트
```

## 실행 결과

### Batch 1 — API Route Handlers (커밋: f15097e)

완료된 항목:
- `src/types/`: sheets.ts · kis.ts · dart.ts · ai.ts · business.ts (5개)
- `src/lib/`: env.ts · api-response.ts · indicators.ts · auth.ts · sheets.ts · cache.ts · kis.ts · dart.ts · ai.ts (9개)
- `src/__tests__/indicators.test.ts` (RSI + MACD 9개 테스트)
- `middleware.ts` (프로젝트 루트)
- `src/app/api/`: auth/ · sheets/(3개) · kis/(6개) · dart/ · fundamental/ · ai/ · ticker/[code]/refresh/ (13개)

### Batch 2~3 — Server Actions + Pages (커밋: 6726ee9)

완료된 항목:
- `src/lib/actions.ts`: revalidateDashboard(), revalidateStock(code)
- `src/app/layout.tsx`: ThemeProvider + SessionProvider + Providers + Toaster + SessionExpiredPrompt
- `src/app/page.tsx`: redirect('/dashboard')
- `src/app/providers.tsx`: QueryClient staleTime 5min, retry 401/429 제외
- `src/app/auth/signin/page.tsx`: Suspense + SignInContent
- `src/app/dashboard/page.tsx`: HydrationBoundary + prefetchQuery
- `src/app/stock/[code]/page.tsx`: generateMetadata + StockDetailClient
- `src/components/global/`: session-provider.tsx · session-expired-prompt.tsx
- `src/components/ui/`: theme-toggle.tsx · error-card.tsx · change-badge.tsx
- 12개 shadcn/ui 컴포넌트 (button, card, badge, skeleton, toast, toaster, dialog, table, separator, dropdown-menu, pagination, use-toast)
- `src/hooks/`: use-transactions · use-aggregation · use-stock-price · use-ai-analysis · use-refresh-ai-analysis · use-refresh-all (6개)

### Batch 4C/4D — Dashboard + Stock Detail Components (커밋: 40d4fea)

완료된 항목 (Dashboard 8개):
- `kpi-card.tsx`: KPI 4개 카드
- `position-bar-chart.tsx`: 보유 포지션 수평 막대
- `profit-bar-chart.tsx`: 실현손익 막대 (한국 증시 색상)
- `cumulative-profit-chart.tsx`: 누적 실현손익 영역 + 3탭
- `stock-analysis-table.tsx`: 종목별 분석 테이블
- `trade-history-table.tsx`: 거래 내역 + 페이지네이션
- `strategy-table.tsx`: 전략 태그별 집계
- `dashboard-client.tsx`: 대시보드 오케스트레이터

완료된 항목 (Stock Detail 15개):
- `price-card.tsx` · `valuation-table.tsx` · `financial-table.tsx` (sec 1~3)
- `financial-radar-chart.tsx` · `estimate-table.tsx` · `investor-trend-chart.tsx` (sec 4~6)
- `opinion-table.tsx` · `dart-disclosure-card.tsx` · `portfolio-card.tsx` (sec 7~9)
- `rsi-macd-card.tsx` · `ai-analysis-card.tsx` (sec 10~11)
- `journal-table.tsx` · `refresh-section.tsx` (sec 12~13)
- `anchor-menu.tsx` · `stock-detail-client.tsx` (네비게이션 + 오케스트레이터)

### 최종 생성 파일 통계

| 카테고리 | 파일 수 |
|:---|:---:|
| Type Definitions | 5 |
| Library (lib/) | 9 |
| API Routes | 13 |
| Server Actions | 1 |
| App Shell / Pages | 7 |
| Auth Components | 3 |
| Global Components | 5 |
| Hooks | 6 |
| Dashboard Components | 8 |
| Stock Detail Components | 15 |
| Test | 1 |
| **합계** | **73** |

## Lessons Learned

1. **PowerShell vs Bash**: WSL 경로(E: 드라이브)는 Bash 도구로 접근 불가 → 항상 PowerShell 도구 사용.
2. **PowerShell `&&` 연산자**: PowerShell 5.1은 `&&` 미지원 → `;` 또는 `if ($?) { B }` 사용.
3. **한국 증시 색상 규칙**: 상승=빨강(hsl 0), 하락=파랑(hsl 220) — 글로벌 관례와 반대. CLAUDE.md가 권위 있는 출처.
4. **캐시 행 삭제**: Google Sheets API는 행 삭제가 복잡 → "공백으로 덮어쓰기" 방식으로 해결.
5. **DART CORPCODE.xml**: ZIP 파싱 복잡 → `company.json` 검색 API로 corp_code 직접 조회.
6. **shadcn 설치**: `--yes` 플래그로 비대화식 설치 (`npx shadcn@latest add ... --yes`).
7. **병렬 에이전트 활용**: 의존성 없는 컴포넌트는 병렬 에이전트로 동시 생성 → 속도 대폭 향상.
8. **queryKey 캐시 공유**: valuation·financial·radar·estimate 4개 컴포넌트가 `['fundamental', code]` 동일 queryKey 사용 → 첫 호출 후 나머지 즉시 캐시에서 렌더링.
