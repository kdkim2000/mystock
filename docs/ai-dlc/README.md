# my-stock — AI-DLC 전체 개발 프로세스

> 이 문서는 `docs/ai-dlc/` 폴더의 인덱스이자 전체 개발 프로세스 로드맵입니다.
> 모든 ai-dlc 스킬의 산출물은 아래 폴더 구조에 따라 이 폴더 안에 저장됩니다.

---

## 폴더 구조

```
docs/ai-dlc/
├── README.md                          ← 이 파일 (전체 프로세스 가이드)
├── 요구사항정의서_my-stock_20260606.md  ← 기준 문서 (v0.1)
│
├── 01-planning/                       ← Phase 1: 기획
├── 02-analysis/                       ← Phase 2: 분석
├── 03-design/                         ← Phase 3: 설계
├── 04-setup/                          ← Phase 4: 환경 설정
├── 05-impl-plan/                      ← Phase 5: 구현 계획
├── 06-implementation/                 ← Phase 6: 구현 (코드 명세)
├── 07-validation/                     ← Phase 7: 검증
├── 08-testing/                        ← Phase 8: 테스트
├── 09-performance/                    ← Phase 9: 성능 최적화
├── 10-deployment/                     ← Phase 10: 배포
└── 11-delivery/                       ← Phase 11: 납품
```

---

## Phase 1 — 기획 (Planning)

> 목표: 프로젝트 공통 언어, 사용자 페르소나, MVP 범위 확정

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 1-1 | `/ai-dlc-glossary-create` | 프로젝트 도메인 용어 정의 (매매 내역, KIS, DART, 실현손익 등) | 요구사항정의서 | `01-planning/glossary.md` |
| 1-2 | `/ai-dlc-persona-create` | 단일 사용자(개인 투자자) 페르소나 정의 | 요구사항정의서 | `01-planning/persona.md` |
| 1-3 | `/ai-dlc-mvp-scope` | 우선순위 상(Priority 1) 기능 중심 MVP 범위 확정 | 요구사항정의서 + persona.md | `01-planning/mvp-scope.md` |
| 1-4 | `/ai-dlc-user-story-map` | 대시보드·종목상세·데이터갱신 흐름의 사용자 스토리 맵 | mvp-scope.md + 요구사항정의서 | `01-planning/user-story-map.md` |

---

## Phase 2 — 분석 (Analysis)

> 목표: 시스템 구조, 유스케이스, 비즈니스 규칙, 화면 목록 확정

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 2-1 | `/ai-dlc-system-overview` | 전체 시스템 구성도 (Browser → Vercel → KIS/DART/Sheets/OpenAI) | 요구사항정의서 | `02-analysis/system-overview.md` |
| 2-2 | `/ai-dlc-service-catalog` | API Route별 서비스 목록 정의 (/api/kis/*, /api/dart/*, /api/ai/* 등) | 요구사항정의서 | `02-analysis/service-catalog.md` |
| 2-3 | `/ai-dlc-usecase-create` | FR-001~FR-022 기반 유스케이스 정의 | 요구사항정의서 + service-catalog.md | `02-analysis/usecase.md` |
| 2-4 | `/ai-dlc-biz-rules-create` | KIS 스로틀(400ms), 토큰 1일 1회, 캐시 TTL 정책 등 비즈니스 규칙 | 요구사항정의서 | `02-analysis/biz-rules.md` |
| 2-5 | `/ai-dlc-screen-list` | 대시보드·종목상세·로그인 화면 목록 및 네비게이션 구조 | usecase.md + 요구사항정의서 | `02-analysis/screen-list.md` |

---

## Phase 3 — 설계 (Design)

> 목표: 화면 명세, 데이터 스키마, API 명세, 클래스·타입 설계, 시퀀스 다이어그램

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 3-1 | `/ai-dlc-screen-spec` | 각 화면의 컴포넌트·레이아웃·UX 명세 (13개 섹션 포함) | screen-list.md + 요구사항정의서 | `03-design/screen-spec.md` |
| 3-2 | `/ai-dlc-data-design` | Google Sheets 스키마 (매매내역·_TICKER_CACHE_·_AI_CACHE_·종목코드·종목별집계) | 요구사항정의서 | `03-design/data-design.md` |
| 3-3 | `/ai-dlc-api-design` | REST API 명세 (Route Handlers: /api/sheets, /api/kis, /api/dart, /api/ai, /api/ticker/[code]/refresh) | service-catalog.md + data-design.md | `03-design/api-design.md` |
| 3-4 | `/ai-dlc-class-design` | TypeScript 타입·인터페이스 설계 (SheetTransactionRow, CacheEntry, KisToken 등) | data-design.md + api-design.md | `03-design/class-design.md` |
| 3-5 | `/ai-dlc-sequence-design` | 핵심 시나리오 시퀀스 다이어그램 (로그인, 대시보드 로딩, 종목 상세 캐시HIT/MISS, 갱신 버튼, AI 분석) | usecase.md + api-design.md | `03-design/sequence-design.md` |

---

## Phase 4 — 환경 설정 가이드 (Setup)

> 목표: 프로젝트 초기 설정 및 핵심 라이브러리 사용 기준 수립

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 4-1 | `/ai-dlc-nxt-project-setup` | Next.js 15 프로젝트 초기화 (App Router, TypeScript, Tailwind, shadcn/ui) | 요구사항정의서 | `04-setup/nxt-project-setup.md` |
| 4-2 | `/ai-dlc-fe-node-setup` | package.json 의존성 정의 (Recharts, next-themes, Vitest 등) | nxt-project-setup.md | `04-setup/fe-node-setup.md` |
| 4-3 | `/ai-dlc-nxt-auth-guide` | NextAuth v4 Google OAuth 설정 (ALLOWED_EMAIL, JWT 세션, middleware.ts) | 요구사항정의서 SR-001~SR-005 | `04-setup/nxt-auth-guide.md` |
| 4-4 | `/ai-dlc-nxt-middleware-guide` | middleware.ts 전역 인증 보호 구현 가이드 | nxt-auth-guide.md | `04-setup/nxt-middleware-guide.md` |
| 4-5 | `/ai-dlc-fe-shadcn-guide` | shadcn/ui 컴포넌트 사용 기준 및 테마(다크/라이트) 설정 | QR-001·QR-002 | `04-setup/fe-shadcn-guide.md` |
| 4-6 | `/ai-dlc-fe-tailwind-guide` | Tailwind CSS 반응형 레이아웃 구성 기준 | QR-002 | `04-setup/fe-tailwind-guide.md` |
| 4-7 | `/ai-dlc-fe-axios-guide` | KIS·DART·OpenAI·Sheets API 호출 패턴 (서버사이드 fetch, 스로틀 구현) | api-design.md + biz-rules.md | `04-setup/fe-axios-guide.md` |
| 4-8 | `/ai-dlc-fe-react-query-guide` | 클라이언트 데이터 패칭·캐싱 전략 (staleTime, refetch 정책) | api-design.md | `04-setup/fe-react-query-guide.md` |
| 4-9 | `/ai-dlc-fe-state-guide` | 전역 상태 관리 전략 (테마, 로그인 상태 등) | nxt-project-setup.md | `04-setup/fe-state-guide.md` |
| 4-10 | `/ai-dlc-fe-zod-guide` | API 응답 및 환경변수 유효성 검사 스키마 정의 | class-design.md | `04-setup/fe-zod-guide.md` |
| 4-11 | `/ai-dlc-nxt-sc-guide` | Next.js Server Component 사용 기준 (서버/클라이언트 컴포넌트 분리) | nxt-project-setup.md | `04-setup/nxt-sc-guide.md` |

---

## Phase 5 — 구현 계획 (Implementation Plan)

> 목표: 구현 순서·파일 구조·의존성 정의

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 5-1 | `/ai-dlc-dependency-analysis` | 컴포넌트·API Route 간 의존성 분석 | class-design.md + api-design.md | `05-impl-plan/dependency-analysis.md` |
| 5-2 | `/ai-dlc-nxt-impl-plan` | Next.js App Router 기반 구현 계획 (페이지·Route Handler·Server Action 구현 순서) | 전체 설계 산출물 | `05-impl-plan/nxt-impl-plan.md` |
| 5-3 | `/ai-dlc-fe-impl-plan` | 프론트엔드 컴포넌트 구현 계획 (대시보드·종목상세 섹션별 순서) | screen-spec.md + nxt-impl-plan.md | `05-impl-plan/fe-impl-plan.md` |
| 5-4 | `/ai-dlc-dev-guide` | 팀(본인) 개발 가이드 (코딩 컨벤션, 파일 네이밍, Git 전략) | 전체 설계 산출물 | `05-impl-plan/dev-guide.md` |

---

## Phase 6 — 구현 (Implementation)

> 목표: 실제 코드 생성 (명세 → 코드)

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 6-1 | `/ai-dlc-nxt-route-handler-gen` | API Route Handler 생성 (/api/sheets, /api/kis, /api/dart, /api/ai, /api/ticker/[code]/refresh) | api-design.md + class-design.md | `06-implementation/routes/` |
| 6-2 | `/ai-dlc-nxt-server-action-gen` | Server Action 생성 (데이터 갱신·캐시 무효화 등) | nxt-impl-plan.md | `06-implementation/actions/` |
| 6-3 | `/ai-dlc-nxt-page-gen` | 페이지 생성 (dashboard/page.tsx, stock/[code]/page.tsx, auth/signin/page.tsx) | screen-spec.md + nxt-impl-plan.md | `06-implementation/pages/` |
| 6-4 | `/ai-dlc-fe-component-gen` | 공통·도메인 컴포넌트 생성 (SummaryCard, StockTable, CandlestickChart, AiAnalysis 등) | screen-spec.md + fe-impl-plan.md | `06-implementation/components/` |

---

## Phase 7 — 검증 (Validation)

> 목표: 코드 품질·요구사항 일치성·일관성 검증

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 7-1 | `/ai-dlc-fe-ts-check` | TypeScript 타입 오류 검사 | 구현 코드 | `07-validation/ts-check.md` |
| 7-2 | `/ai-dlc-fe-lint-check` | ESLint 검사 및 수정 가이드 | 구현 코드 | `07-validation/lint-check.md` |
| 7-3 | `/ai-dlc-nxt-code-review` | Next.js 코드 리뷰 (App Router 패턴, 서버/클라이언트 분리, 보안) | 구현 코드 | `07-validation/nxt-code-review.md` |
| 7-4 | `/ai-dlc-fe-code-review` | 프론트엔드 코드 리뷰 (컴포넌트 구조, 접근성, 반응형) | 구현 코드 | `07-validation/fe-code-review.md` |
| 7-5 | `/ai-dlc-consistency-check` | 설계-코드 간 일관성 검사 (API 명세 vs 실제 Route Handler) | api-design.md + 구현 코드 | `07-validation/consistency-check.md` |
| 7-6 | `/ai-dlc-code-traceability` | FR-001~FR-022 → 코드 추적 매트릭스 | 요구사항정의서 + 구현 코드 | `07-validation/traceability.md` |
| 7-7 | `/ai-dlc-code-complexity` | 복잡도 분석 (캐시 계층·갱신 로직 집중 점검) | 구현 코드 | `07-validation/code-complexity.md` |

---

## Phase 8 — 테스트 (Testing)

> 목표: E2E 테스트 시나리오 생성 및 검증

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 8-1 | `/ai-dlc-nxt-e2e-test-gen` | Next.js E2E 테스트 생성 (로그인·대시보드·종목상세·갱신 버튼 시나리오) | usecase.md + 구현 코드 | `08-testing/e2e-tests.md` |
| 8-2 | `/ai-dlc-fe-e2e-test-gen` | 프론트엔드 E2E 테스트 생성 (차트·테이블·스켈레톤·에러 UI 검증) | screen-spec.md + 구현 코드 | `08-testing/fe-e2e-tests.md` |
| 8-3 | `/ai-dlc-fe-e2e-test-validate` | E2E 테스트 시나리오 검증 (커버리지 확인) | e2e-tests.md + fe-e2e-tests.md | `08-testing/e2e-validate.md` |

---

## Phase 9 — 성능 최적화 (Performance)

> 목표: Vercel 배포 환경 성능 목표(PR-001~PR-004) 달성

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 9-1 | `/ai-dlc-nxt-perf-guide` | Next.js 성능 최적화 (번들 크기 250MB 제한, maxDuration 설정, 캐시 전략) | 요구사항정의서 PR-001~PR-004, CR-001~CR-005 | `09-performance/nxt-perf-guide.md` |
| 9-2 | `/ai-dlc-fe-perf-guide` | 프론트엔드 성능 최적화 (Recharts 레이지 로딩, 스켈레톤 UI, 이미지 최적화) | QR-003 + 구현 코드 | `09-performance/fe-perf-guide.md` |

---

## Phase 10 — 배포 (Deployment)

> 목표: Vercel Pro 배포 설정 및 환경변수 관리

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 10-1 | `/ai-dlc-nxt-deploy-guide` | Vercel 배포 가이드 (환경변수, maxDuration, outputFileTracingExcludes, HTTPS) | 요구사항정의서 CR-001~CR-005 | `10-deployment/deploy-guide.md` |

---

## Phase 11 — 납품 (Delivery)

> 목표: 최종 산출물 정리 및 사용자 매뉴얼 작성

| 순서 | Skill | 목적 | 입력 | 산출물 경로 |
|:---:|:---|:---|:---|:---|
| 11-1 | `/ai-dlc-delivery-checklist` | 납품 체크리스트 (FR 전체 충족 여부, 성능·보안·품질 요구사항 달성 확인) | 요구사항정의서 + traceability.md | `11-delivery/delivery-checklist.md` |
| 11-2 | `/ai-dlc-user-manual` | 사용자 매뉴얼 (로그인, 대시보드 읽기, 종목 상세 보기, 갱신 버튼 사용법) | screen-spec.md + 구현 결과 | `11-delivery/user-manual.md` |
| 11-3 | `/ai-dlc-delivery-package` | 최종 납품 패키지 (산출물 목록 + 코드 + 배포 URL 정리) | 전체 산출물 | `11-delivery/delivery-package.md` |

---

## 전체 스킬 실행 순서 요약

```
Phase 1 (기획)
  1-1 /ai-dlc-glossary-create
  1-2 /ai-dlc-persona-create
  1-3 /ai-dlc-mvp-scope
  1-4 /ai-dlc-user-story-map

Phase 2 (분석)
  2-1 /ai-dlc-system-overview
  2-2 /ai-dlc-service-catalog
  2-3 /ai-dlc-usecase-create
  2-4 /ai-dlc-biz-rules-create
  2-5 /ai-dlc-screen-list

Phase 3 (설계)
  3-1 /ai-dlc-screen-spec
  3-2 /ai-dlc-data-design
  3-3 /ai-dlc-api-design
  3-4 /ai-dlc-class-design
  3-5 /ai-dlc-sequence-design

Phase 4 (환경 설정)
  4-1  /ai-dlc-nxt-project-setup
  4-2  /ai-dlc-fe-node-setup
  4-3  /ai-dlc-nxt-auth-guide
  4-4  /ai-dlc-nxt-middleware-guide
  4-5  /ai-dlc-fe-shadcn-guide
  4-6  /ai-dlc-fe-tailwind-guide
  4-7  /ai-dlc-fe-axios-guide
  4-8  /ai-dlc-fe-react-query-guide
  4-9  /ai-dlc-fe-state-guide
  4-10 /ai-dlc-fe-zod-guide
  4-11 /ai-dlc-nxt-sc-guide

Phase 5 (구현 계획)
  5-1 /ai-dlc-dependency-analysis
  5-2 /ai-dlc-nxt-impl-plan
  5-3 /ai-dlc-fe-impl-plan
  5-4 /ai-dlc-dev-guide

Phase 6 (구현)
  6-1 /ai-dlc-nxt-route-handler-gen
  6-2 /ai-dlc-nxt-server-action-gen
  6-3 /ai-dlc-nxt-page-gen
  6-4 /ai-dlc-fe-component-gen

Phase 7 (검증)
  7-1 /ai-dlc-fe-ts-check
  7-2 /ai-dlc-fe-lint-check
  7-3 /ai-dlc-nxt-code-review
  7-4 /ai-dlc-fe-code-review
  7-5 /ai-dlc-consistency-check
  7-6 /ai-dlc-code-traceability
  7-7 /ai-dlc-code-complexity

Phase 8 (테스트)
  8-1 /ai-dlc-nxt-e2e-test-gen
  8-2 /ai-dlc-fe-e2e-test-gen
  8-3 /ai-dlc-fe-e2e-test-validate

Phase 9 (성능 최적화)
  9-1 /ai-dlc-nxt-perf-guide
  9-2 /ai-dlc-fe-perf-guide

Phase 10 (배포)
  10-1 /ai-dlc-nxt-deploy-guide

Phase 11 (납품)
  11-1 /ai-dlc-delivery-checklist
  11-2 /ai-dlc-user-manual
  11-3 /ai-dlc-delivery-package
```

---

## 수정/검토 스킬 (필요 시 사용)

| Skill | 용도 |
|:---|:---|
| `/ai-dlc-glossary-revise` | 용어집 수정 |
| `/ai-dlc-glossary-validate` | 용어 일관성 검증 |
| `/ai-dlc-glossary-apply` | 산출물 전체에 용어 적용 |
| `/ai-dlc-usecase-revise` | 유스케이스 수정 |
| `/ai-dlc-usecase-validate` | 유스케이스 검증 |
| `/ai-dlc-biz-rules-revise` | 비즈니스 규칙 수정 |
| `/ai-dlc-biz-rules-validate` | 비즈니스 규칙 검증 |
| `/ai-dlc-screen-revise` | 화면 명세 수정 |
| `/ai-dlc-screen-validate` | 화면 명세 검증 |
| `/ai-dlc-api-revise` | API 명세 수정 |
| `/ai-dlc-api-validate` | API 명세 검증 |
| `/ai-dlc-api-spec-extract` | 기존 코드에서 API 명세 역추출 |
| `/ai-dlc-data-revise` | 데이터 설계 수정 |
| `/ai-dlc-data-validate` | 데이터 설계 검증 |
| `/ai-dlc-data-model-analysis` | 데이터 모델 분석 |
| `/ai-dlc-class-revise` | 클래스 설계 수정 |
| `/ai-dlc-class-validate` | 클래스 설계 검증 |
| `/ai-dlc-design-extract` | 기존 코드에서 설계 역추출 |
| `/ai-dlc-nxt-code-revise` | Next.js 코드 개선 |
| `/ai-dlc-fe-code-revise` | 프론트엔드 코드 개선 |
| `/ai-dlc-fe-e2e-test-revise` | E2E 테스트 수정 |
| `/ai-dlc-impact-analysis` | 변경 영향 분석 |
| `/ai-dlc-doc-impact` | 문서 영향 분석 |
| `/ai-dlc-change-register` | 변경 사항 등록 |
| `/ai-dlc-change-complete` | 변경 완료 처리 |
| `/ai-dlc-program-spec` | 프로그램 명세 작성 |
| `/ai-dlc-md-to-word` | 마크다운 → Word 변환 |

---

## 현재 진행 상태

| Phase | 상태 | 비고 |
|:---|:---:|:---|
| Phase 0 — 요구사항정의 | ✅ 완료 | 요구사항정의서_my-stock_20260606.md |
| Phase 1 — 기획 | ✅ 완료 | 1-1 용어사전 ✅ · 1-2 페르소나 ✅ · 1-3 MVP범위 ✅ · 1-4 사용자스토리맵 ✅ (`01-planning/`) |
| Phase 2 — 분석 | ✅ 완료 | 2-1 시스템개요서 ✅ · 2-2 서비스카탈로그 ✅ · 2-3 유즈케이스 ✅ · 2-4 비즈니스규칙 ✅ · 2-5 화면목록 ✅ (`02-analysis/`) |
| Phase 3 — 설계 | ✅ 완료 | 3-1 화면정의서 ✅ · 3-2 데이터설계서 ✅ · 3-3 API설계서 ✅ · 3-4 클래스설계서 ✅ · 3-5 시퀀스다이어그램 ✅ (`03-design/screen-spec.md`, `03-design/data-design.md`, `03-design/api-design.md`, `03-design/class-design.md`, `03-design/sequence-design.md`) |
| Phase 4 — 환경 설정 | ✅ 완료 | 4-1 Next.js프로젝트초기화 ✅ · 4-2 Node의존성정의 ✅ · 4-3 NextAuth가이드 ✅ · 4-4 middleware인증가이드 ✅ · 4-5 shadcn/ui테마가이드 ✅ · 4-6 Tailwind반응형가이드 ✅ · 4-7 API호출패턴가이드 ✅ · 4-8 ReactQuery패칭가이드 ✅ · 4-9 전역상태관리가이드 ✅ · 4-10 Zod유효성검사가이드 ✅ · 4-11 ServerComponent분리가이드 ✅ (`04-setup/nxt-project-setup.md`, `04-setup/fe-node-setup.md`, `04-setup/nxt-auth-guide.md`, `04-setup/nxt-middleware-guide.md`, `04-setup/fe-shadcn-guide.md`, `04-setup/fe-tailwind-guide.md`, `04-setup/fe-axios-guide.md`, `04-setup/fe-react-query-guide.md`, `04-setup/fe-state-guide.md`, `04-setup/fe-zod-guide.md`, `04-setup/nxt-sc-guide.md`) |
| Phase 5 — 구현 계획 | ✅ 완료 | 5-1 의존성분석서 ✅ · 5-2 Next.js구현계획 ✅ · 5-3 프론트엔드구현계획 ✅ · 5-4 개발가이드 ✅ (`05-impl-plan/dependency-analysis.md`, `05-impl-plan/nxt-impl-plan.md`, `05-impl-plan/fe-impl-plan.md`, `05-impl-plan/dev-guide.md`) |
| Phase 6 — 구현 | ✅ 완료 | 6-1 Route Handlers ✅ · 6-2 Server Actions ✅ · 6-3 Pages ✅ · 6-4 Components ✅ (`06-implementation/routes/`, `06-implementation/actions/`, `06-implementation/pages/`, `06-implementation/components/`) |
| Phase 7 — 검증 | 🔄 진행중 | 7-1 TypeScript검사 ✅ (`07-validation/ts-check.md`) · 7-2 ESLint검사 ✅ (`07-validation/lint-check.md`) · 7-3 Next.js코드리뷰 ✅ (`07-validation/nxt-code-review.md`) · 7-5 설계-코드일관성검증 ✅ (`07-validation/consistency-check.md`) · 7-7 코드복잡도분석 ✅ (`07-validation/code-complexity.md`) |
| Phase 8 — 테스트 | ⬜ 대기 | |
| Phase 9 — 성능 최적화 | ⬜ 대기 | |
| Phase 10 — 배포 | ⬜ 대기 | |
| Phase 11 — 납품 | ⬜ 대기 | |
