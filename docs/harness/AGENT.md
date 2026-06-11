# AGENT.md — 에이전트 활용 가이드

> Claude Code의 Agent 도구를 이 프로젝트에서 효과적으로 사용하기 위한 참조 문서.

---

## 1. Agent 도구란

Agent 도구는 **독립적인 컨텍스트**를 가진 서브에이전트를 생성한다. 메인 대화와 컨텍스트를 공유하지 않으므로, 프롬프트에 필요한 모든 배경을 직접 포함해야 한다.

**주요 특성:**
- 메인 대화의 이전 내용을 알지 못함 → 프롬프트는 자기완결적으로 작성
- 결과는 에이전트의 마지막 텍스트 출력으로 반환됨
- 실패(오류·거절)는 `null` 반환 → 결과 사용 전 `filter(Boolean)` 처리

---

## 2. 에이전트 타입 선택

| 타입 | 설명 | 사용 시점 |
|:---|:---|:---|
| `Explore` | Read-only 코드 탐색·파일 검색 전문 | Plan 모드 Phase 1, 기존 산출물 확인, 특정 심볼 위치 파악 |
| `Plan` | 구현 전략 설계 | Plan 모드 Phase 2, 아키텍처 결정, 복잡한 접근법 비교 |
| `general-purpose` | 복잡한 다단계 태스크 | 광범위 코드베이스 탐색, 연구+실행 복합 작업 |
| `claude-code-guide` | Claude Code CLI/API 질문 | Claude Code 기능, 슬래시 명령, MCP 설정, SDK 사용법 |
| `claude` | 범용 fallback | 위 타입에 해당하지 않는 모든 작업 |

> **Explore vs general-purpose**: 파일 읽기·검색만 필요하면 `Explore`. 파일 쓰기·명령 실행 등이 포함되면 `general-purpose`.

---

## 3. 병렬 vs 순차 실행

### 병렬 실행 (단일 메시지에 복수 Agent 호출)
작업 간 **의존성이 없는** 경우 한 번에 여러 에이전트를 호출한다.

```
# 좋은 예: 독립된 탐색 작업 3개 동시 실행
Agent(Explore, "요구사항 문서 분석")   ← 동시 실행
Agent(Explore, "스킬 템플릿 읽기")     ← 동시 실행
Agent(Explore, "기존 산출물 확인")     ← 동시 실행
```

### 순차 실행 (이전 결과가 다음 입력에 필요)
앞 에이전트 결과를 프롬프트에 포함해야 할 때만 순차로 실행.

```
# 탐색 결과를 바탕으로 Plan 에이전트 실행
result = Agent(Explore, "현재 API 구조 탐색")
Agent(Plan, f"탐색 결과: {result}. 이를 바탕으로 설계...")
```

---

## 4. 포그라운드 vs 백그라운드

| 모드 | run_in_background | 사용 기준 |
|:---|:---:|:---|
| 포그라운드 (기본) | false | 에이전트 결과가 다음 작업에 필요한 경우 |
| 백그라운드 | true | 독립적인 장시간 작업, 완료 시 알림 수신 |

```
# 백그라운드 실행 예시
Agent(
  description="E2E 테스트 생성",
  prompt="...",
  run_in_background=True  # 완료되면 알림
)
# → 메인 컨텍스트에서 다른 작업 계속 진행
```

> 백그라운드 에이전트가 완료되면 자동 알림. `sleep`으로 대기하거나 폴링하지 말 것.

---

## 5. 이 프로젝트의 Agent 활용 패턴

### 패턴 1: ai-dlc 스킬 실행 전 사전 탐색

스킬 실행 전, Explore 에이전트로 기존 산출물과 템플릿을 병렬 확인한다.

```
# 스킬 실행 전 표준 탐색 패턴
Agent(Explore, "docs/ai-dlc/README.md 읽어 산출물 경로 확인")
Agent(Explore, "스킬 템플릿 및 output-policy.md 읽기")
Agent(Explore, "기존 관련 산출물 파일 확인")
```

### 패턴 2: Plan 모드 Phase 1 병렬 탐색

Plan 모드 진입 시 최대 3개 Explore 에이전트를 병렬로 투입한다.

```
# Plan 모드 Phase 1 표준 패턴
Agent(Explore, "요구사항 문서 분석 — 도메인 용어 추출")
Agent(Explore, "스킬 템플릿·output-policy 확인")
Agent(Explore, "CLAUDE.md 규칙 섹션 확인")
```

### 패턴 3: 광범위 탐색은 general-purpose 위임

3번 이상의 검색이 필요한 오픈엔드 탐색은 general-purpose에 위임한다.

```
# 복잡한 탐색
Agent(
  subagent_type="general-purpose",
  description="캐시 계층 구현 패턴 탐색",
  prompt="globalThis, /tmp/, Google Sheets 캐시 계층 구현 패턴 전체 탐색..."
)
```

### 패턴 4: Workflow 도구 — 대규모 병렬 오케스트레이션

단순 Agent 도구로 감당하기 어려운 대규모 팬아웃 작업에는 Workflow 도구를 사용한다.
(사용자가 "workflow 사용" 또는 "ultracode" 명시 시에만 호출)

---

## 6. 프롬프트 작성 원칙

에이전트는 이 대화의 맥락을 모른다. 프롬프트에 반드시 포함해야 할 요소:

| 요소 | 예시 |
|:---|:---|
| 배경 설명 | "my-stock은 Next.js 15 기반 개인 주식 투자 대시보드입니다" |
| 읽어야 할 파일 경로 | "E:\apps\mystock\docs\ai-dlc\요구사항정의서_*.md 를 읽어..." |
| 기대 출력 형식 | "결과를 마크다운 테이블로 정리해 주세요" |
| 범위 제한 | "전체 코드베이스가 아닌 src/api/ 폴더만 분석" |

**나쁜 프롬프트**: "요구사항 분석해줘"  
**좋은 프롬프트**: "E:\apps\mystock\docs\ai-dlc\요구사항정의서_my-stock_20260606.md를 읽고, Section 2의 기능 요구사항(FR-001~FR-022)에서 도메인 명사를 추출해 목록으로 정리해 주세요."

---

## 7. 주의사항

- **결과 검증 필수**: 에이전트 요약은 의도를 반영하지만 실제 실행 결과와 다를 수 있음. 파일 변경 후 실제 내용을 확인할 것.
- **중복 작업 금지**: 에이전트에 연구를 위임했으면 메인에서 동일한 검색을 반복하지 말 것.
- **null 처리**: 에이전트가 오류 시 null 반환. 결과 사용 전 항상 확인.
- **최대 3개 병렬**: Explore 에이전트는 한 번에 최대 3개까지 (품질 우선).
- **컨텍스트 보호**: 결과가 매우 길 예상되면 에이전트에 위임해 메인 컨텍스트를 보호.

---

## 8. ai-dlc Phase별 에이전트 위임 전략

> `docs/ai-dlc/README.md`의 각 Phase·스킬을 에이전트에 완전 위임하기 위한 표준 패턴.
> 모든 스킬 실행은 **EXPLORE → PLAN → RECORD → EXECUTE → COMMIT** 5단계를 따른다.

### Phase별 에이전트 구성 요약

| Phase | Explore 에이전트 | Plan 에이전트 | Execute | 난이도 |
|:---:|:---:|:---:|:---|:---:|
| 1 기획 | 3개 병렬 | 1개 | Write 직접 | 낮음 |
| 2 분석 | 3개 병렬 | 1개 | Write 직접 | 낮음 |
| 3 설계 | 3개 병렬 | 1~2개 | Write 직접 | 중간 |
| 4 환경설정 | 2개 병렬 | 1개 | Write 직접 | 낮음 |
| 5 구현계획 | 3개 병렬 | 2개 | Write 직접 | 중간 |
| 6 구현 | 3개 병렬 | 2개 | general-purpose | 높음 |
| 7 검증 | 2개 병렬 | 1개 | general-purpose | 중간 |
| 8 테스트 | 2개 병렬 | 1개 | general-purpose | 중간 |
| 9 성능 | 2개 병렬 | 1개 | Write 직접 | 낮음 |
| 10 배포 | 2개 병렬 | 1개 | Write 직접 | 낮음 |
| 11 납품 | 2개 병렬 | 1개 | general-purpose | 낮음 |

---

### Phase 1 — 기획 (Planning)

**스킬**: `/ai-dlc-glossary-create`, `/ai-dlc-persona-create`, `/ai-dlc-mvp-scope`, `/ai-dlc-user-story-map`

```
[EXPLORE — 병렬 3개]
Agent(Explore, "요구사항정의서_my-stock_20260606.md 전체 내용 추출
  경로: E:\apps\mystock\docs\ai-dlc\요구사항정의서_my-stock_20260606.md
  추출 대상: FR-001~022 목록, 비기능요구사항, 도메인 명사")

Agent(Explore, "스킬 템플릿·output-policy 읽기
  경로1: C:\Users\kdkim2000\.claude\skills\ai-dlc-<skillname>\template.md
  경로2: C:\Users\kdkim2000\.claude\skills\ai-dlc-common\references\output-policy.md")

Agent(Explore, "기존 01-planning 산출물 확인
  경로: E:\apps\mystock\docs\ai-dlc\01-planning\
  목적: 이미 완성된 파일 파악 (덮어쓰기 방지)")

[PLAN — 순차 1개]
Agent(Plan, "탐색 결과를 바탕으로 <산출물명> 내용 설계
  입력: [Explore 결과 요약]
  요구사항: output-policy.md 파일명 규칙 준수
  출력: 산출물 전체 마크다운 초안")
```

---

### Phase 2 — 분석 (Analysis)

**스킬**: `/ai-dlc-system-overview`, `/ai-dlc-service-catalog`, `/ai-dlc-usecase-create`, `/ai-dlc-biz-rules-create`, `/ai-dlc-screen-list`

```
[EXPLORE — 병렬 3개]
Agent(Explore, "요구사항정의서 + Phase 1 전체 산출물 읽기
  경로: E:\apps\mystock\docs\ai-dlc\01-planning\*.md
  추출: FR 목록, 페르소나 목표, MVP 16건")

Agent(Explore, "스킬 템플릿 읽기
  경로: C:\Users\kdkim2000\.claude\skills\ai-dlc-<skillname>\template.md")

Agent(Explore, "CLAUDE.md 아키텍처 섹션 읽기
  경로: E:\apps\mystock\CLAUDE.md
  추출: API Route 구조, 캐싱 전략, KIS/DART 제약사항")

[PLAN — 순차 1개]
Agent(Plan, "my-stock 아키텍처 맥락에서 <산출물명> 설계
  시스템: Next.js 15 App Router + Google Sheets + KIS API + DART API + OpenAI
  입력: [Explore 결과]
  출력: 산출물 전체 마크다운")
```

---

### Phase 3 — 설계 (Design)

**스킬**: `/ai-dlc-screen-spec`, `/ai-dlc-data-design`, `/ai-dlc-api-design`, `/ai-dlc-class-design`, `/ai-dlc-sequence-design`

```
[EXPLORE — 병렬 3개]
Agent(Explore, "Phase 1~2 전체 산출물 읽기
  경로: E:\apps\mystock\docs\ai-dlc\01-planning\*.md
       E:\apps\mystock\docs\ai-dlc\02-analysis\*.md
  추출: MVP 구성, 유스케이스, 화면 목록, 서비스 카탈로그")

Agent(Explore, "스킬 템플릿 + 관련 설계 산출물 읽기
  경로: C:\Users\kdkim2000\.claude\skills\ai-dlc-<skillname>\template.md
       E:\apps\mystock\docs\ai-dlc\03-design\*.md (기존 설계 확인)")

Agent(Explore, "기술 스택 제약사항 확인
  경로: E:\apps\mystock\CLAUDE.md
  추출: Google Sheets 스키마, KIS Rate Limit, Vercel 제약, 3계층 캐시 구조")

[PLAN — 순차 1~2개]
# 복잡한 설계(api-design, sequence-design)는 2개 관점으로
Agent(Plan, "기능 완전성 관점: <설계 산출물> 초안 설계")
Agent(Plan, "기술 제약 관점: KIS/DART/Vercel 제약 반영 검증")
```

---

### Phase 4 — 환경설정 가이드 (Setup)

**스킬**: `/ai-dlc-nxt-project-setup`, `/ai-dlc-fe-node-setup`, `/ai-dlc-nxt-auth-guide`, `/ai-dlc-nxt-middleware-guide`, `/ai-dlc-fe-shadcn-guide`, `/ai-dlc-fe-tailwind-guide`, `/ai-dlc-fe-axios-guide`, `/ai-dlc-fe-react-query-guide`, `/ai-dlc-fe-state-guide`, `/ai-dlc-fe-zod-guide`, `/ai-dlc-nxt-sc-guide`

```
[EXPLORE — 병렬 2개]
Agent(Explore, "요구사항정의서 + class-design.md + api-design.md 읽기
  경로: E:\apps\mystock\docs\ai-dlc\요구사항정의서_my-stock_20260606.md
       E:\apps\mystock\docs\ai-dlc\03-design\*.md
  추출: 기술 스택 버전, 보안 요구사항, 성능 목표")

Agent(Explore, "스킬 템플릿 읽기
  경로: C:\Users\kdkim2000\.claude\skills\ai-dlc-<skillname>\template.md")

[PLAN — 순차 1개]
Agent(Plan, "Next.js 15.5 + NextAuth v4 + Tailwind CSS + shadcn/ui 환경 기준으로
  <가이드명> 작성 계획 수립
  입력: [Explore 결과]
  출력: 설정 가이드 전체 마크다운")

# 스킬 11개는 순서대로 실행 (각 스킬 산출물이 다음 스킬의 입력)
# 4-1 → 4-2 → 4-3 → 4-4 → 4-5~4-11 (일부 병렬 가능)
```

---

### Phase 5 — 구현 계획 (Implementation Plan)

**스킬**: `/ai-dlc-dependency-analysis`, `/ai-dlc-nxt-impl-plan`, `/ai-dlc-fe-impl-plan`, `/ai-dlc-dev-guide`

```
[EXPLORE — 병렬 3개]
Agent(Explore, "Phase 3 설계 전체 산출물 읽기
  경로: E:\apps\mystock\docs\ai-dlc\03-design\*.md
  추출: API 엔드포인트, TypeScript 타입, 화면-컴포넌트 매핑")

Agent(Explore, "Phase 4 환경설정 산출물 읽기
  경로: E:\apps\mystock\docs\ai-dlc\04-setup\*.md
  추출: 프로젝트 구조, 의존성, 설정 기준")

Agent(Explore, "MVP범위정의서 + 유스케이스 읽기
  경로: E:\apps\mystock\docs\ai-dlc\01-planning\MVP범위정의서_*.md
       E:\apps\mystock\docs\ai-dlc\02-analysis\usecase.md
  추출: v1.0 16건, 구현 우선순위")

[PLAN — 순차 2개]
Agent(Plan, "Next.js App Router 구현 순서 설계
  (Route Handler → Page → Server Component → Client Component 순)")
Agent(Plan, "컴포넌트 의존성 그래프 + 구현 병렬화 가능 구간 식별")
```

---

### Phase 6 — 구현 (Implementation) ★ 가장 복잡

**스킬**: `/ai-dlc-nxt-route-handler-gen`, `/ai-dlc-nxt-server-action-gen`, `/ai-dlc-nxt-page-gen`, `/ai-dlc-fe-component-gen`

```
[EXPLORE — 병렬 3개]
Agent(Explore, "nxt-impl-plan.md + fe-impl-plan.md 읽기
  경로: E:\apps\mystock\docs\ai-dlc\05-impl-plan\*.md
  추출: 구현 파일 목록, 컴포넌트 트리, Route 구조")

Agent(Explore, "api-design.md + class-design.md 읽기
  경로: E:\apps\mystock\docs\ai-dlc\03-design\api-design.md
       E:\apps\mystock\docs\ai-dlc\03-design\class-design.md
  추출: TypeScript 타입, API 스펙, 함수 시그니처")

Agent(Explore, "screen-spec.md 읽기
  경로: E:\apps\mystock\docs\ai-dlc\03-design\screen-spec.md
  추출: 화면별 컴포넌트 목록, Props, 레이아웃 구조")

[PLAN — 순차 2개]
Agent(Plan, "6-1 Route Handler 구현 계획: /api/sheets, /api/kis, /api/dart, /api/ai, /api/ticker/[code]/refresh")
Agent(Plan, "6-3/6-4 페이지·컴포넌트 구현 계획: dashboard, stock/[code], auth/signin")

[EXECUTE — general-purpose (코드 작성)]
# Route Handler별로 general-purpose 에이전트 할당
Agent(general-purpose, "아래 명세에 따라 /api/kis/* Route Handler 구현
  입력: api-design.md의 KIS 섹션, class-design.md의 KisToken/StockPrice 타입
  출력: 실제 TypeScript 파일 (E:\apps\mystock\src\app\api\kis\*.ts)
  제약: KIS_THROTTLE_MS=400ms 준수, globalThis 토큰 캐시 사용")

# 컴포넌트별로 general-purpose 에이전트 할당
Agent(general-purpose, "아래 명세에 따라 SummaryCard 컴포넌트 구현
  입력: screen-spec.md의 대시보드 요약 카드 섹션
  출력: E:\apps\mystock\src\components\dashboard\SummaryCard.tsx
  제약: shadcn/ui Card 사용, 다크모드 CSS 변수, 스켈레톤 UI 포함")
```

---

### Phase 7 — 검증 (Validation)

**스킬**: `/ai-dlc-fe-ts-check`, `/ai-dlc-fe-lint-check`, `/ai-dlc-nxt-code-review`, `/ai-dlc-fe-code-review`, `/ai-dlc-consistency-check`, `/ai-dlc-code-traceability`, `/ai-dlc-code-complexity`

```
[EXPLORE — 병렬 2개]
Agent(Explore, "구현된 소스 코드 탐색
  경로: E:\apps\mystock\src\
  추출: Route Handler 목록, 컴포넌트 트리, 타입 정의 현황")

Agent(Explore, "설계 산출물 읽기 (검증 기준)
  경로: E:\apps\mystock\docs\ai-dlc\03-design\*.md
  추출: API 명세, TypeScript 타입, 화면 명세")

[EXECUTE — general-purpose]
Agent(general-purpose, "TypeScript 타입 오류·ESLint 위반 검사 실행
  명령: npm run build && npm run lint
  출력: 오류 목록 + 수정 가이드 마크다운
  저장: E:\apps\mystock\docs\ai-dlc\07-validation\ts-check.md")

Agent(general-purpose, "FR-001~022 → 구현 코드 추적 매트릭스 생성
  입력: 요구사항정의서 FR 목록 + src/ 코드 탐색
  출력: traceability.md (FR별 구현 파일·함수 매핑)")
```

---

### Phase 8 — 테스트 (Testing)

**스킬**: `/ai-dlc-nxt-e2e-test-gen`, `/ai-dlc-fe-e2e-test-gen`, `/ai-dlc-fe-e2e-test-validate`

```
[EXPLORE — 병렬 2개]
Agent(Explore, "유스케이스 + 화면 명세 읽기
  경로: E:\apps\mystock\docs\ai-dlc\02-analysis\usecase.md
       E:\apps\mystock\docs\ai-dlc\03-design\screen-spec.md
  추출: 주요 사용자 시나리오, 화면 전환, 에러 케이스")

Agent(Explore, "구현된 페이지·API Route 목록 탐색
  경로: E:\apps\mystock\src\app\
  추출: 라우트 구조, 주요 UI 상태, API 엔드포인트")

[EXECUTE — general-purpose]
Agent(general-purpose, "Vitest 기반 E2E 테스트 시나리오 생성
  대상 시나리오: 로그인, 대시보드 로딩, 종목 상세 캐시HIT/MISS, 갱신 버튼 60초, AI 분석
  출력: E:\apps\mystock\docs\ai-dlc\08-testing\e2e-tests.md")
```

---

### Phase 9 — 성능 최적화 (Performance)

**스킬**: `/ai-dlc-nxt-perf-guide`, `/ai-dlc-fe-perf-guide`

```
[EXPLORE — 병렬 2개]
Agent(Explore, "성능 요구사항 + 제약사항 읽기
  경로: E:\apps\mystock\docs\ai-dlc\요구사항정의서_my-stock_20260606.md
  추출: PR-001~004 (성능 목표), CR-001~005 (제약사항)")

Agent(Explore, "구현 코드에서 성능 위험 요소 탐색
  경로: E:\apps\mystock\src\
  추출: 번들 크기, 불필요한 클라이언트 컴포넌트, Recharts 임포트 패턴")

[PLAN — 순차 1개]
Agent(Plan, "Vercel 배포 환경 최적화 가이드 설계
  목표: PR-001(3초) + PR-002(60초) + CR-001(250MB) 달성
  항목: outputFileTracingExcludes, dynamic import, 캐시 TTL 조정")
```

---

### Phase 10 — 배포 (Deployment)

**스킬**: `/ai-dlc-nxt-deploy-guide`

```
[EXPLORE — 병렬 2개]
Agent(Explore, "환경변수 목록 + Vercel 제약 읽기
  경로: E:\apps\mystock\env.example
       E:\apps\mystock\CLAUDE.md (Vercel 섹션)
  추출: 필수 환경변수 목록, maxDuration 설정, 서비스 계정 JSON 포맷")

Agent(Explore, "next.config.mjs 현재 설정 읽기
  경로: E:\apps\mystock\next.config.mjs (존재 시)")

[PLAN — 순차 1개]
Agent(Plan, "Vercel Pro 배포 가이드 작성
  항목: 환경변수 설정 순서, maxDuration=60 설정, outputFileTracingExcludes,
        GOOGLE_SERVICE_ACCOUNT_JSON 단일라인 변환, HTTPS 자동 설정")
```

---

### Phase 11 — 납품 (Delivery)

**스킬**: `/ai-dlc-delivery-checklist`, `/ai-dlc-user-manual`, `/ai-dlc-delivery-package`

```
[EXPLORE — 병렬 2개]
Agent(Explore, "전체 산출물 목록 확인
  경로: E:\apps\mystock\docs\ai-dlc\
  추출: Phase별 생성된 파일 목록, 진행 상태")

Agent(Explore, "traceability.md + 요구사항정의서 읽기
  경로: E:\apps\mystock\docs\ai-dlc\07-validation\traceability.md
       E:\apps\mystock\docs\ai-dlc\요구사항정의서_my-stock_20260606.md
  추출: FR 충족 여부, 미구현 항목")

[EXECUTE — general-purpose]
Agent(general-purpose, "납품 체크리스트 생성
  기준: FR-001~022 충족 여부 + SR/PR/QR/DR/CR 달성 여부
  출력: E:\apps\mystock\docs\ai-dlc\11-delivery\delivery-checklist.md")
```

---

## 9. 표준 에이전트 프롬프트 템플릿

### Explore 에이전트 — 요구사항·산출물 탐색

```
my-stock 프로젝트(Next.js 15 개인 주식 투자 대시보드)의 <대상> 파일을 읽어주세요.

읽을 파일:
- E:\apps\mystock\docs\ai-dlc\요구사항정의서_my-stock_20260606.md
- E:\apps\mystock\docs\ai-dlc\<phase>\<file>.md

추출해야 할 정보:
1. <항목 1>
2. <항목 2>
3. <항목 3>

결과를 마크다운 테이블 또는 항목 목록 형식으로 정리해 주세요.
```

### Explore 에이전트 — 스킬 템플릿 탐색

```
다음 파일들을 읽어 원문 그대로 반환해 주세요 (요약 없이):

1. C:\Users\kdkim2000\.claude\skills\ai-dlc-<skillname>\template.md
2. C:\Users\kdkim2000\.claude\skills\ai-dlc-common\references\output-policy.md

파일이 없으면 "파일 없음"으로 표시해 주세요.
```

### Plan 에이전트 — 산출물 내용 설계

```
my-stock 프로젝트의 <산출물명>을 설계해 주세요.

## 프로젝트 컨텍스트
- 서비스: 개인 주식 투자 대시보드 (단일 사용자)
- 기술: Next.js 15 App Router + Google Sheets API + KIS Open API + DART API + OpenAI gpt-4o-mini
- 배포: Vercel Pro (maxDuration=60, 번들 250MB 제한)
- 캐시: globalThis → /tmp/ → Google Sheets(_TICKER_CACHE_ 30분, _AI_CACHE_ 7일)

## Explore 에이전트 탐색 결과
<Explore 에이전트 출력 삽입>

## 요구사항
- 파일명: <파일명> (output-policy.md 규칙 준수)
- 저장 경로: E:\apps\mystock\docs\ai-dlc\<phase>\
- 언어: 전체 한국어, 기술 고유명사 영문 유지
- 버전 이력 표 하단 필수 포함

산출물 전체 마크다운 내용을 설계해 주세요.
```

### general-purpose 에이전트 — 코드 구현

```
my-stock 프로젝트에서 <컴포넌트/Route 명> 구현 코드를 작성해 주세요.

## 프로젝트 구조
- 경로: E:\apps\mystock\src\
- 프레임워크: Next.js 15 App Router, TypeScript 5.6
- UI: Tailwind CSS + shadcn/ui 컴포넌트
- 차트: Recharts 3.7

## 구현 명세
<api-design.md 또는 screen-spec.md 해당 섹션 내용>

## TypeScript 타입
<class-design.md 해당 타입 정의>

## 제약사항
- API 키는 서버사이드 전용 (process.env.* 사용)
- KIS API 호출 간격 최소 400ms (KIS_THROTTLE_MS 환경변수)
- 다크/라이트 모드: CSS 변수 기반 (next-themes)
- 로딩 상태: shadcn/ui Skeleton 컴포넌트
- 에러 상태: fallback UI 필수

파일을 직접 E:\apps\mystock\<경로>에 저장해 주세요.
```

---

## 10. Phase 연속 실행 시 에이전트 체이닝 전략

여러 Phase를 연속으로 실행할 때는 이전 Phase 산출물을 다음 Phase Explore 에이전트의 입력으로 사용한다.

```
Phase 2 완료
    ↓ (02-analysis/*.md 생성됨)
Phase 3 Explore 에이전트: "E:\apps\mystock\docs\ai-dlc\02-analysis\*.md 읽기"
    ↓ (Explore 결과 → Plan 에이전트 입력)
Phase 3 Plan 에이전트: 설계 산출물 생성
    ↓ (03-design/*.md 생성됨)
Phase 4 Explore 에이전트: "E:\apps\mystock\docs\ai-dlc\03-design\*.md 읽기"
    ↓ ...
```

**각 Phase 완료 체크포인트:**
1. `docs/ai-dlc/<phase>/` 파일 생성 확인
2. `docs/ai-dlc/README.md` 진행 상태 ✅ 업데이트
3. `docs/plans/YYYY-MM-DD_<skill>.md` Plan 기록 완성
4. `git commit` 실행
