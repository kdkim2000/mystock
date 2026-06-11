# Plan: Phase 9 성능 최적화 (9-1 ~ 9-2)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `next.config.mjs` · `src/app/providers.tsx` · `src/components/dashboard/` · `src/components/stock/` · `docs/ai-dlc/09-performance/` |
| 목표 | Vercel 번들 250MB 이하 유지 + 초기 JS 로드 감소 + 불필요한 재계산 제거 |

## 계획 내용

### 성능 목표
| 시나리오 | 목표 |
|:---|:---:|
| Dashboard load (cache HIT) | ≤ 5초 |
| Stock detail page (cache HIT) | ≤ 3초 |
| Data refresh (KIS+DART) | ≤ 60초 |
| Vercel serverless 번들 | ≤ 250MB |

### 탐색에서 확인된 최적화 포인트
- `serverExternalPackages` 미설정 → googleapis(~3MB) · openai(~500KB) 번들 위험
- Recharts 6개 차트 모두 정적 import → 초기 JS 번들 크기 증가
- `kpi-card.tsx`: useMemo 없이 매 렌더마다 reduce 5회 실행
- `financial-radar-chart.tsx`: radarData · gridColor · normalize 매 렌더 재생성
- `providers.tsx`: gcTime 미설정 (기본 5분)

### 이미 잘 구현된 것 (변경 불필요)
- 3계층 캐시 (globalThis → Sheets → API): `src/lib/cache.ts`
- KIS 스로틀 400ms: `src/lib/kis.ts`
- `maxDuration = 60`: refresh route
- SSR prefetch HydrationBoundary: dashboard page
- `useMemo` 이미 적용: `cumulative-profit-chart.tsx`, `rsi-macd-card.tsx`
- Skeleton 로딩 패턴: 모든 차트/테이블 컴포넌트

### 코드 변경 계획

**Step 1: Next.js 서버 최적화**
1. `next.config.mjs` → `serverExternalPackages: ['googleapis', 'openai']` 추가
2. `src/app/providers.tsx` → `gcTime: 10 * 60 * 1000` 추가

**Step 2: 프론트엔드 최적화**
3. `src/components/dashboard/dashboard-client.tsx` → 차트 3개 dynamic import
4. `src/components/dashboard/kpi-card.tsx` → `totals` useMemo + reduce 5회→3회
5. `src/components/stock/financial-radar-chart.tsx` → normalize 외부 이동 + useMemo 2개

**Step 3: AI-DLC 문서 생성**
- `docs/ai-dlc/09-performance/nxt-perf-guide.md`
- `docs/ai-dlc/09-performance/fe-perf-guide.md`

## 실행 결과

- ✅ `next.config.mjs` — `serverExternalPackages: ['googleapis', 'openai']` 추가
- ✅ `src/app/providers.tsx` — `gcTime: 10 * 60 * 1000` 추가
- ✅ `src/components/dashboard/dashboard-client.tsx` — 차트 3개 dynamic import 교체
- ✅ `src/components/dashboard/kpi-card.tsx` — `totals` useMemo + reduce 5회→3회
- ✅ `src/components/stock/financial-radar-chart.tsx` — `normalize` 외부 이동, `gridColor`/`radarData` useMemo
- ✅ `docs/ai-dlc/09-performance/nxt-perf-guide.md` 생성
- ✅ `docs/ai-dlc/09-performance/fe-perf-guide.md` 생성
- ✅ `docs/ai-dlc/README.md` Phase 9 → ✅
- ✅ `npx tsc --noEmit` 0 오류

## Lessons Learned

1. **serverExternalPackages 위치**: Next.js 15에서 `experimental.serverComponentsExternalPackages`가 최상위 `serverExternalPackages`로 이동됨. CLAUDE.md에는 `experimental` 안에 기록되어 있었으나 실제 Next.js 15 API는 최상위 키.

2. **dynamic import named export 패턴**: Next.js `dynamic()`은 default export만 처리. named export는 `.then(m => ({ default: m.Name }))` 래핑 필요.

3. **useMemo 의존성 배열**: `financial-radar-chart.tsx`에서 `v = data?.valuation`, `f = data?.financial`를 useMemo 밖에서 추출한 후 의존성 배열에 사용. `data` 객체 전체를 넣으면 참조 동일성 문제가 발생할 수 있으므로 구조분해 후 사용이 적절.

4. **이미 최적화된 코드 존중**: `cumulative-profit-chart.tsx`와 `rsi-macd-card.tsx`에 useMemo가 이미 적용되어 있었음. 탐색 단계에서 확인 후 중복 변경을 피함.
