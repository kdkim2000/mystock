# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**my-stock** is a personal Korean stock investment dashboard — a single-user Next.js 15 web app that reads trading history from Google Sheets and enriches it with KIS Open API (real-time prices/financials), DART API (disclosures), and OpenAI (AI analysis). There is no traditional database; Google Sheets serves as both the data store and the persistent cache.

Deployed on Vercel (Pro plan required for 60-second function timeout on the refresh endpoint).

## Commands

```bash
npm run dev       # start dev server on http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm test          # Vitest (unit tests)
npm test -- --run src/path/to/file.test.ts  # run a single test file
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router), React 18.3 |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS, shadcn/ui |
| Charts | Recharts 3.7 |
| Auth | NextAuth v4 (Google OAuth 2.0) |
| Data store | Google Sheets API v4 (service account JWT) |
| External APIs | KIS Open API, DART (opendart.fss.or.kr), OpenAI gpt-4o-mini |
| Testing | Vitest |
| Hosting | Vercel (Serverless + Edge) |

## Architecture

```
Browser → Vercel Edge
  ├─ Next.js App Router (SSR + CSR)
  └─ API Route Handlers (serverless)
       ├─ /api/sheets/*               → Google Sheets API v4
       ├─ /api/kis/*                  → KIS Open API
       ├─ /api/dart/*                 → DART API
       ├─ /api/fundamental/*          → KIS + DART combined
       ├─ /api/ai/*                   → OpenAI API
       └─ /api/ticker/[code]/refresh  → unified refresh, maxDuration=60
```

### Pages

- `/` or `/dashboard` — portfolio summary cards, charts, stock analysis table, trade history
- `/stock/[code]` — stock detail page (13 sections: price, valuation, financials, radar chart, estimates, trading trends, analyst opinions, DART disclosures, portfolio holdings, technical indicators, AI analysis, trade journal, data refresh)
- `/auth/signin` — Google OAuth login

### Authentication

`middleware.ts` applies NextAuth JWT session protection globally. `ALLOWED_EMAIL` env var restricts access to a single email (if unset, any Google account is allowed). API 401 responses show a UI prompt rather than a forced redirect (SR-005).

### Caching Strategy (three layers)

1. **`globalThis`** — in-memory per serverless function instance; used for KIS access tokens and Google OAuth tokens
2. **`/tmp/`** (Vercel) / `.next/cache/` (local) — KIS token file cache (24h TTL)
3. **Google Sheets** — persistent cache shared across all instances:
   - `_TICKER_CACHE_` tab: KIS/DART API responses keyed by `{code, section}`, TTL 30 min
   - `_AI_CACHE_` tab: OpenAI analysis results keyed by `code`, TTL 7 days

Cache lookup order: `globalThis` → Sheets → external API call → write back to Sheets.

### Google Sheets Data Schema

**Main trading sheet** (`GOOGLE_SHEET_NAME`, default `매매내역`):

| Column | Type | Notes |
|--------|------|-------|
| Date | string | trade date |
| Ticker | string | Korean stock name |
| Type | string | 매수 / 매도 |
| Quantity | number | shares |
| Price | number | unit price |
| Journal | string | trade memo |
| Tags | string | strategy tags, comma-separated |

TypeScript type: `SheetTransactionRow`

## Critical Constraints

### KIS API
- **Rate limit**: minimum 400ms between calls (env `KIS_THROTTLE_MS`, default 400). Exceeding triggers `EGW00133`.
- **Token limit**: 1 issuance per day. Use `softExpireKisToken()` to prevent race conditions. Token stored in `/tmp/` + `globalThis`.
- Switch between live and mock trading via `KIS_APP_SVR=vps` or `KIS_APP_URL`.

### Vercel
- Serverless function bundle: ≤250MB. Use `outputFileTracingExcludes` in `next.config.mjs` to exclude heavy deps.
- Default function timeout: 10s. The unified refresh endpoint (`/api/ticker/[code]/refresh`) must set `export const maxDuration = 60` (requires Vercel Pro).
- Set `VERCEL_ANALYZE_BUILD_OUTPUT=1` to diagnose bundle size issues.

### DART API
- Cache `CORPCODE.xml` (corporate code list) — avoid repeated downloads.
- Financial data: 1-hour cache TTL in `_TICKER_CACHE_`.

## Environment Variables

See `env.example` for the full annotated list. Key variables:

```
AUTH_SECRET                    # NextAuth secret (openssl rand -base64 32)
GOOGLE_CLIENT_ID / SECRET      # OAuth 2.0 web client
ALLOWED_EMAIL                  # optional single-email allowlist
GOOGLE_SPREADSHEET_ID          # target spreadsheet
GOOGLE_SHEET_NAME              # default: 매매내역
GOOGLE_SHEET_TICKER_MASTER     # optional: 종목코드 (columns: Ticker, Code)
GOOGLE_SHEET_AGGREGATION       # optional: 종목별집계
GOOGLE_APPLICATION_CREDENTIALS # local: path to service account JSON
GOOGLE_SERVICE_ACCOUNT_JSON    # Vercel: service account JSON as single-line string
DART_API_KEY
KIS_APP_KEY / KIS_APP_SECRET
KIS_THROTTLE_MS                # default 400
OPENAI_API_KEY
```

## Performance Targets

| Scenario | Target |
|----------|--------|
| Stock detail page (cache HIT) | ≤ 3 seconds |
| Dashboard load (cache HIT) | ≤ 5 seconds |
| Data refresh (full KIS + DART) | ≤ 60 seconds |
| KIS API call interval | ≥ 400ms |

## Key Implementation Notes

- **RSI and MACD** (FR-019) are computed client-side from KIS daily price (`dailyPrice`) data — not fetched from an external indicator API.
- **AI analysis** (FR-020) passes stock info + recent trade journal as context to `gpt-4o-mini`. Result is cached 7 days in `_AI_CACHE_`. Forced refresh is supported.
- **`/api/ticker/[code]/refresh`** calls KIS and DART endpoints in parallel, writes results to `_TICKER_CACHE_`, and returns when all sections are updated.
- Dark/light mode via `next-themes` with CSS variables (QR-001).
- All API keys are server-side only — never import them in client components.
- Session expiry: show UI prompt on 401, do not force-redirect (SR-005).

---

## Plan 모드 기록 규칙 (MANDATORY)

> **Plan 모드(`/plan`)를 사용할 때마다 계획 내용을 반드시 `docs/plans/`에 파일로 저장한다.**
> 이는 의사결정 근거와 lessons learned를 남기기 위한 필수 절차이며, 생략할 수 없다.

### 저장 시점 및 절차

1. **Plan 모드 진입 시**: `docs/plans/` 폴더가 없으면 먼저 생성한다.
2. **계획 확정 후 즉시**: Plan 내용을 아래 형식에 따라 파일로 저장한다.
3. **실행 완료 후**: 동일 파일에 실행 결과(성공·실패·변경 사항)와 교훈을 추가한다.

### 파일 네이밍 규칙

```
docs/plans/YYYY-MM-DD_<kebab-case-topic>.md
```

예시:
```
docs/plans/2026-06-06_kis-token-management.md
docs/plans/2026-06-06_dashboard-layout.md
docs/plans/2026-06-07_cache-refactor.md
```

### 파일 구조 (필수 섹션)

```markdown
# Plan: <제목>

| 항목 | 내용 |
|:---|:---|
| 날짜 | YYYY-MM-DD |
| 대상 | 작업 대상 파일/기능 |
| 목표 | 이 계획으로 달성하려는 것 |

## 계획 내용
(Plan 모드에서 작성한 단계별 계획 전문)

## 실행 결과
(실행 후 작성 — 완료된 항목, 변경된 내용, 발생한 문제)

## Lessons Learned
(다음에 참고할 교훈, 예상과 달랐던 점, 더 나은 접근법)
```

### 주의사항

- Plan 파일은 계획 수립 직후 생성하고, 실행 후 반드시 결과를 추가한다.
- 계획이 변경된 경우 변경 이유를 파일에 기록한다.
- 파일을 생성하지 않은 채 Plan 모드를 종료하지 않는다.

---

## AI-DLC 산출물 관리 규칙 (MANDATORY)

> **모든 ai-dlc 스킬(`/ai-dlc-*`)의 산출물은 반드시 `docs/ai-dlc/` 이하에 저장한다.**
> 이 규칙은 예외 없이 적용된다. 다른 위치에 저장하거나 프로젝트 루트에 직접 생성하지 않는다.

### 산출물 저장 경로 규칙

```
docs/ai-dlc/
├── README.md                            ← DLC 전체 프로세스 인덱스 (수정 금지)
├── 요구사항정의서_my-stock_20260606.md   ← 기준 문서
├── 01-planning/      glossary.md · persona.md · mvp-scope.md · user-story-map.md
├── 02-analysis/      system-overview.md · service-catalog.md · usecase.md · biz-rules.md · screen-list.md
├── 03-design/        screen-spec.md · data-design.md · api-design.md · class-design.md · sequence-design.md
├── 04-setup/         nxt-project-setup.md · fe-node-setup.md · nxt-auth-guide.md · nxt-middleware-guide.md
│                     fe-shadcn-guide.md · fe-tailwind-guide.md · fe-axios-guide.md
│                     fe-react-query-guide.md · fe-state-guide.md · fe-zod-guide.md · nxt-sc-guide.md
├── 05-impl-plan/     dependency-analysis.md · nxt-impl-plan.md · fe-impl-plan.md · dev-guide.md
├── 06-implementation/ routes/ · actions/ · pages/ · components/
├── 07-validation/    ts-check.md · lint-check.md · nxt-code-review.md · fe-code-review.md
│                     consistency-check.md · traceability.md · code-complexity.md
├── 08-testing/       e2e-tests.md · fe-e2e-tests.md · e2e-validate.md
├── 09-performance/   nxt-perf-guide.md · fe-perf-guide.md
├── 10-deployment/    deploy-guide.md
└── 11-delivery/      delivery-checklist.md · user-manual.md · delivery-package.md
```

### Phase별 스킬 → 저장 경로 매핑

| Phase | 스킬 예시 | 저장 폴더 |
|:---:|:---|:---|
| 1 기획 | `/ai-dlc-glossary-create`, `/ai-dlc-persona-create`, `/ai-dlc-mvp-scope`, `/ai-dlc-user-story-map` | `docs/ai-dlc/01-planning/` |
| 2 분석 | `/ai-dlc-system-overview`, `/ai-dlc-usecase-create`, `/ai-dlc-biz-rules-create`, `/ai-dlc-screen-list`, `/ai-dlc-service-catalog` | `docs/ai-dlc/02-analysis/` |
| 3 설계 | `/ai-dlc-screen-spec`, `/ai-dlc-data-design`, `/ai-dlc-api-design`, `/ai-dlc-class-design`, `/ai-dlc-sequence-design` | `docs/ai-dlc/03-design/` |
| 4 환경설정 | `/ai-dlc-nxt-project-setup`, `/ai-dlc-nxt-auth-guide`, `/ai-dlc-fe-*-guide` | `docs/ai-dlc/04-setup/` |
| 5 구현계획 | `/ai-dlc-nxt-impl-plan`, `/ai-dlc-fe-impl-plan`, `/ai-dlc-dependency-analysis`, `/ai-dlc-dev-guide` | `docs/ai-dlc/05-impl-plan/` |
| 6 구현 | `/ai-dlc-nxt-route-handler-gen`, `/ai-dlc-nxt-page-gen`, `/ai-dlc-fe-component-gen` | `docs/ai-dlc/06-implementation/` |
| 7 검증 | `/ai-dlc-*-code-review`, `/ai-dlc-consistency-check`, `/ai-dlc-code-traceability` | `docs/ai-dlc/07-validation/` |
| 8 테스트 | `/ai-dlc-nxt-e2e-test-gen`, `/ai-dlc-fe-e2e-test-gen` | `docs/ai-dlc/08-testing/` |
| 9 성능 | `/ai-dlc-nxt-perf-guide`, `/ai-dlc-fe-perf-guide` | `docs/ai-dlc/09-performance/` |
| 10 배포 | `/ai-dlc-nxt-deploy-guide` | `docs/ai-dlc/10-deployment/` |
| 11 납품 | `/ai-dlc-delivery-checklist`, `/ai-dlc-user-manual`, `/ai-dlc-delivery-package` | `docs/ai-dlc/11-delivery/` |

### 스킬 실행 전 확인 사항

1. `docs/ai-dlc/README.md`를 읽어 해당 스킬의 **산출물 경로**를 확인한다.
2. 해당 Phase 폴더가 없으면 먼저 생성한다 (예: `docs/ai-dlc/01-planning/`).
3. 산출물 파일명은 README.md의 "산출물 경로" 컬럼을 그대로 따른다.
4. 스킬 완료 후 `docs/ai-dlc/README.md`의 "현재 진행 상태" 표를 ✅로 업데이트한다.
5. 수정 스킬(`*-revise`, `*-validate`) 결과도 동일 폴더의 원본 파일을 덮어쓰거나 `-v2.md` 접미사를 붙여 저장한다.

---

## 하네스 문서 관리 규칙 (MANDATORY)

> **`docs/harness/` 이하의 파일은 이 프로젝트에서 Claude Code를 사용하는 방식을 정의하는 최우선 참조 문서다.**
> 하네스 문서는 적극적으로 활용하고, 변경이 필요하면 반드시 하네스를 먼저 갱신한다.

### 하네스 파일 구성

| 파일 | 역할 |
|:---|:---|
| `docs/harness/AGENT.md` | 에이전트 타입 선택, 병렬/순차 패턴, 프롬프트 작성 원칙 |
| `docs/harness/RULES.md` | Plan·AI-DLC 규칙, Git 안전 규칙, 코드·메모리 규칙 빠른 참조 |
| `docs/harness/SKILLS.md` | 165+ 스킬 Phase 맵, 수정/검토 패턴, 출력 정책 |
| `docs/harness/MCP.md` | MCP 서버·지연 도구 목록, ToolSearch 사용법 |
| `docs/harness/ARCHITECTURE.md` | 설정 계층, 스킬·MCP·에이전트·메모리·Plan 모드 전체 구조 |

### 하네스 적극 활용 원칙

1. **세션 시작 시**: 관련 하네스 파일을 참조하여 작업 방식을 결정한다.
   - Agent 사용 → `AGENT.md` 확인
   - 스킬 실행 → `SKILLS.md` 확인
   - MCP 도구 사용 → `MCP.md` 확인
   - 규칙 확인 → `RULES.md` 확인

2. **작업 전 하네스 조회**: 아래 상황에서는 반드시 해당 하네스 파일을 Read한 후 진행한다.
   - Plan 모드 진입 전 → `RULES.md` Section 1 (Plan 모드 규칙)
   - ai-dlc 스킬 실행 전 → `SKILLS.md` Section 2 (Phase 맵)
   - MCP 도구 사용 전 → `MCP.md` Section 3 (지연 도구 목록)
   - Agent 호출 전 → `AGENT.md` Section 2-3 (타입·병렬 패턴)

### 하네스 우선 변경 원칙 (변경 시 MANDATORY)

하네스에 영향을 주는 변경이 발생하면 **코드·산출물보다 하네스를 먼저 갱신**한다.

| 변경 유형 | 갱신해야 할 하네스 파일 |
|:---|:---|
| 새 에이전트 패턴 도입 | `AGENT.md` |
| 새 규칙 추가·기존 규칙 변경 | `RULES.md` (+ 이 파일 CLAUDE.md) |
| 새 스킬 추가·스킬 목적 변경 | `SKILLS.md` |
| MCP 서버·도구 추가/삭제 | `MCP.md` |
| 설정 계층·폴더 구조 변경 | `ARCHITECTURE.md` |
| 메모리 시스템 정책 변경 | `RULES.md` Section 6 |

### 하네스 변경 절차

1. **변경 전**: 대상 하네스 파일을 Read하여 현재 내용 확인
2. **변경**: 하네스 파일을 먼저 Edit/Write로 갱신
3. **연동 변경**: 하네스 변경 후 CLAUDE.md, 코드, 산출물 순으로 반영
4. **확인**: 변경된 하네스 내용이 실제 환경과 일치하는지 검증

> 하네스를 갱신하지 않은 채로 관련 작업을 완료했다고 보고하지 않는다.

---

## Git 커밋 규칙 (MANDATORY)

> **작업이 완료되면 반드시 git commit을 수행한다.** 사용자가 별도로 요청하지 않아도 작업 완료의 마지막 단계는 항상 커밋이다.

### 커밋 절차

1. `git status` — 변경 파일 목록 확인
2. `git diff` — staged·unstaged 변경 내용 검토
3. `git add <파일>` — 작업 관련 파일만 선택적으로 스테이징 (`.env*`, 바이너리 제외)
4. 커밋 메시지 작성 (HEREDOC 사용)
5. `git status` — working tree clean 확인 후 완료 보고

### 커밋 메시지 형식

```
git commit -m "$(cat <<'EOF'
<type>: <한 줄 요약> (50자 이내)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

| type | 사용 기준 |
|:---|:---|
| `docs` | 문서·산출물 생성/수정 (ai-dlc, harness, plans 등) |
| `feat` | 새 기능 구현 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `chore` | 설정 파일·환경 변수·빌드 관련 |
| `test` | 테스트 코드 추가/수정 |

### 금지 사항

- `--no-verify` 절대 사용 금지 (훅 우회)
- `--amend` 명시적 요청 없이 금지
- `git push` 는 사용자 확인 후 실행 (커밋은 자동, push는 승인 필요)
- 훅 실패 시 원인 수정 후 재커밋 (우회 금지)

> 상세 규칙: `docs/harness/RULES.md` Section 3
