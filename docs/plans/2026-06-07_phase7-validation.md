# Plan: Phase 7 검증 일괄 실행 (7-1 ~ 7-7)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `src/` 87개 파일 + `docs/ai-dlc/07-validation/` |
| 목표 | 7개 AI-DLC 검증 스킬로 코드 품질 분석 및 결함 수정 |

## 계획 내용

### 스킬 매핑 (7개)

| 순번 | 스킬 | 산출물 | 입력 |
|:---:|:---|:---|:---|
| 7-1 | `/ai-dlc-fe-ts-check` | `ts-check.md` | `npx tsc --noEmit` 결과 + `src/` |
| 7-2 | `/ai-dlc-fe-lint-check` | `lint-check.md` | ESLint 정적 분석 + `src/` |
| 7-3 | `/ai-dlc-nxt-code-review` | `nxt-code-review.md` | `src/app/`, `src/lib/` |
| 7-4 | `/ai-dlc-fe-code-review` | `fe-code-review.md` | `src/components/`, `src/hooks/` |
| 7-5 | `/ai-dlc-consistency-check` | `consistency-check.md` | `03-design/api-design.md` + `src/app/api/` |
| 7-6 | `/ai-dlc-code-traceability` | `traceability.md` | FR-001~022 + `src/` |
| 7-7 | `/ai-dlc-code-complexity` | `code-complexity.md` | `src/lib/cache.ts`, `src/lib/kis.ts`, `refresh/route.ts` |

### 실행 전략

```
Step 1: tsc --noEmit 실행 → 오류 목록 수집
Step 2: Batch A — 5개 스킬 병렬 (ts-check, lint-check, nxt-code-review, consistency-check, code-complexity)
Step 3: Batch B — 2개 스킬 병렬 (fe-code-review, traceability)
Step 4: P1/P2 결함 수정 → tsc 재실행 → 0 errors 확인
Step 5: README.md Phase 7 → ✅ + git commit
```

## 실행 결과

### 발견된 결함 (초기 tsc 오류 7건)

| 우선순위 | 파일 | 이슈 | 수정 |
|:---:|:---|:---|:---|
| P1 | `src/app/api/ticker/[code]/refresh/route.ts:80` | Next.js 15 async params 미적용 | `params: Promise<{code}>` + `await params` |
| P1 | `src/lib/auth.ts:28` | `session.user` possibly undefined (TS18048) | `if (session.user)` 가드 추가 |
| P2 | `src/components/dashboard/cumulative-profit-chart.tsx:67` | Recharts Tooltip formatter 타입 불일치 | `(v) => v != null ? ...` |
| P2 | `src/components/dashboard/position-bar-chart.tsx:34` | 동일 formatter 타입 불일치 | 동일 패턴 수정 |
| P2 | `src/components/dashboard/profit-bar-chart.tsx:34` | 동일 formatter 타입 불일치 | 동일 패턴 수정 |
| P2 | `src/components/stock/rsi-macd-card.tsx:57` | RSI Tooltip formatter 타입 불일치 | `(v) => v != null ? Number(v).toFixed(1) : ''` |
| P2 | `src/components/stock/rsi-macd-card.tsx:68` | MACD Tooltip formatter 타입 불일치 | 동일 패턴 수정 |

### 검증 산출물 (7개) — 전체 완료

| 파일 | 판정 | 주요 발견 |
|:---|:---:|:---|
| `ts-check.md` | ✅ 통과 | 초기 7건 → 수정 후 0건 |
| `lint-check.md` | 조건부통과 | Warning 3건 (권고), Error 0건 |
| `nxt-code-review.md` | 조건부통과 | 9건 이슈 (NI-001 async params 포함) |
| `fe-code-review.md` | 조건부통과 | 11건 이슈 (P1 2건, P2 4건, P3 5건) |
| `consistency-check.md` | 조건부통과 | 5건 불일치 (CI-001 DART corpCode HIGH) |
| `traceability.md` | 조건부통과 | FR 22건 중 21건 구현 완료 (FR-008 부분구현) |
| `code-complexity.md` | 조건부통과 | cache.ts/kis.ts/refresh/route.ts 고복잡도 경고 |

### 최종 상태

- `npx tsc --noEmit` → **0 errors** ✅
- P1/P2 결함 7건 전체 수정 완료
- `@tanstack/react-query-devtools` 패키지 추가 설치 완료

### 커밋 목록

| 커밋 | 내용 |
|:---|:---|
| `c62f6ec` | docs: Phase 7-3 Next.js 코드 품질 검토 보고서 (조건부통과) |
| `2dcafc5` | docs: Phase 7-5 설계-코드 일관성 검증 보고서 |
| `ee2913b` | docs: Phase 7-1 TypeScript 타입 오류 검사 보고서 + code-complexity.md |
| `8ca7fa4` | docs: Phase 7-6 코드 추적성 매트릭스 (FR 구현율 95.5%) + fe-code-review.md |
| (이번) | fix: P1/P2 결함 수정 + lint-check.md + README Phase 7 완료 |

## Lessons Learned

1. **Next.js 15 async params**: `params: Promise<{code: string}>` + `await params` — 동적 라우트 핸들러 전체에 적용 필요. Glob으로 `[code]` 포함 파일 사전 점검 권장.
2. **Recharts 3.x Tooltip formatter**: `ValueType | undefined` 타입이므로 항상 null 체크 필요. 패턴: `(v) => v != null ? String(Number(v)...) : ''`
3. **DART corpCode**: `padStart(8,'0')` 는 틀린 접근 — 실제 DART 법인코드는 8자리 숫자이지만 종목코드와 다름. `getCorpCode(ticker)` API 호출로 조회 필요.
4. **캐시 키 일관성**: `_dailyPrice` vs `_daily_price` 불일치 → api-design.md에 캐시 키 네이밍 컨벤션 명시 필요.
5. **병렬 에이전트 효율**: 5개 스킬 병렬 실행으로 전체 검증 시간 단축. 단 에이전트별 독립 커밋이 발생하므로 최종 상태 확인 필수.
