# ARCHITECTURE.md — 하네스 아키텍처

> Claude Code 하네스의 구조와 동작 원리 전체 그림.
> 이 문서는 하네스가 어떻게 구성되어 있는지 이해하기 위한 참조 문서다.

---

## 1. 하네스 개요

```
사용자 입력
    ↓
Claude Code CLI (claude.exe)
    ├─ CLAUDE.md 로드 (프로젝트 가이드)
    ├─ settings.json 로드 (전역 → 로컬 → 프로젝트)
    ├─ 스킬 시스템 (C:\...\skills\)
    ├─ MCP 서버 연결 (mcp-server-cloud 등)
    ├─ 메모리 시스템 (projects\...\memory\)
    └─ Agent / Workflow 도구
```

**동작 방식**: 각 대화 턴마다 CLAUDE.md + 시스템 설정을 컨텍스트로 주입하여 Claude 모델이 일관된 행동을 하도록 안내한다.

---

## 2. 설정 계층 구조

설정은 아래 계층 순으로 오버라이드된다 (하위가 상위 덮어씀).

```
전역 설정 (가장 낮은 우선순위)
  C:\Users\kdkim2000\.claude\settings.json
      effortLevel: high
      theme: dark
      skipAutoPermissionPrompt: true
      mcpServers: { mcp-server-cloud: ... }
      enabledPlugins: { github, my-skills }
      ↓
로컬 설정 (현재 미사용)
  C:\Users\kdkim2000\.claude\settings.local.json  ← 파일 없음
      ↓
프로젝트 설정 (현재 미사용)
  E:\apps\mystock\.claude\settings.json  ← 파일 없음
  (가장 높은 우선순위)
```

> 프로젝트별 커스텀 권한·훅·환경변수가 필요하면 `E:\apps\mystock\.claude\settings.json` 생성. `/update-config` 스킬로 관리.

---

## 3. 스킬 시스템

### 구조

```
C:\Users\kdkim2000\.claude\skills\
├── ai-dlc-glossary-create\
│   ├── SKILL.md       ← 스킬 지시사항 (트리거, 절차, 산출물 포맷)
│   └── template.md    ← 산출물 마크다운 템플릿
├── ai-dlc-persona-create\
│   ├── SKILL.md
│   └── template.md
├── ai-dlc-common\
│   └── references\
│       └── output-policy.md  ← 공통 출력 정책 (모든 ai-dlc 스킬이 참조)
├── code-review\
│   └── SKILL.md
└── ... (165+ 스킬)
```

### 호출 흐름

```
사용자: /ai-dlc-glossary-create
    ↓
Skill 도구 실행
    ↓
SKILL.md 로드 → Claude 컨텍스트에 지시사항 주입
    ↓
output-policy.md 참조 (파일명 규칙, 언어 정책)
    ↓
template.md 기반으로 산출물 생성
    ↓
docs/ai-dlc/{phase}/ 에 파일 저장
```

### 플러그인 시스템

```
enabledPlugins:
  github@claude-plugins-official  → GitHub PR/Issue 연동 스킬
  my-skills@my-plugins            → 사용자 커스텀 스킬

커스텀 스킬 위치: E:\apps\claude\my-plugins
```

---

## 4. MCP 아키텍처

```
Claude Code
    ├─ 즉시 로드 MCP 도구
    │   ├─ mcp__mcp-server-cloud__*  (Cloudflare Workers)
    │   ├─ mcp__claude_ai_Vercel__*  (Vercel 연동)
    │   └─ mcp__ide__*               (IDE 연동)
    │
    └─ 지연 로드(Deferred) MCP 도구
        ├─ TaskCreate/Update/List    (태스크 관리)
        ├─ CronCreate/Delete/List    (스케줄링)
        ├─ WebFetch / WebSearch      (웹)
        ├─ Monitor / RemoteTrigger   (프로세스)
        ├─ EnterWorktree/ExitWorktree (격리)
        └─ EnterPlanMode/ExitPlanMode (플랜)

지연 로드 사용: ToolSearch("select:도구이름") → 스키마 로드 → 호출
```

**MCP 서버 등록 위치**:
- 전역: `C:\Users\kdkim2000\.claude\settings.json` → `mcpServers`
- Desktop: `AppData\Roaming\Claude\claude_desktop_config.json`

---

## 5. 에이전트 아키텍처

### Agent 도구

```
메인 컨텍스트
    └─ Agent(subagent_type="Explore", prompt="...")
           ↓
        독립 컨텍스트 생성 (메인과 격리)
           ↓
        작업 수행 (read-only 또는 read-write)
           ↓
        결과 텍스트 반환 → 메인 컨텍스트에서 수신
```

- **동시 실행 제한**: min(16, CPU 코어 수 - 2)
- **타입**: Explore (읽기전용), Plan (설계), general-purpose (범용), claude-code-guide, claude

### Workflow 도구

대규모 팬아웃 오케스트레이션용. 수십~수백 에이전트를 구조화된 스크립트로 제어.

```javascript
// Workflow 스크립트 구조
export const meta = { name: '...', description: '...', phases: [...] }

phase('탐색')
const results = await pipeline(
  ITEMS,
  item => agent(`분석: ${item}`, { schema: SCHEMA }),
  result => agent(`검증: ${result}`, { schema: VERDICT })
)
```

> **사용 조건**: 사용자가 "workflow 사용" / "ultracode" 명시 시에만 호출.

---

## 6. 메모리 시스템

### 저장 구조

```
C:\Users\kdkim2000\.claude\projects\E--apps-mystock\memory\
├── MEMORY.md              ← 인덱스 파일 (200줄 이내 유지)
├── user_role.md           ← 사용자 역할·선호 메모리
├── feedback_*.md          ← 피드백 메모리
├── project_*.md           ← 프로젝트 맥락 메모리
└── reference_*.md         ← 외부 리소스 참조 메모리
```

### 메모리 파일 구조

```markdown
---
name: <short-kebab-slug>
description: <한 줄 요약 — 미래 대화에서 관련성 판단>
metadata:
  type: user | feedback | project | reference
---

<내용>
**Why:** <이유>
**How to apply:** <적용 시점>
```

### 동작 원리

1. 세션 시작 시 `MEMORY.md` 인덱스가 컨텍스트에 주입됨
2. 관련 메모리가 있으면 개별 파일을 Read로 로드
3. 새로운 사용자 특성·피드백·프로젝트 맥락 발견 시 파일로 저장
4. MEMORY.md에 인덱스 항목 추가

---

## 7. 작업 실행 흐름 (Plan 모드 여부 무관)

> RULES.md Section 0: 모든 실질적 작업은 반드시 Plan → Record → Execute → Commit 순서로 진행.

### 표준 흐름 (Plan 모드 없이 직접 실행 시)

```
사용자 요청
    ↓
Step 1: EXPLORE — Explore 에이전트 병렬 (최대 3개)
  ├─ 에이전트 1: 요구사항·기존 산출물 탐색
  ├─ 에이전트 2: 스킬 템플릿·output-policy 확인
  └─ 에이전트 3: 연관 파일·코드 현황 파악
    ↓
Step 2: PLAN — Plan 에이전트 실행
  - 구현 전략 설계, 단계별 접근법, 검증 방법
    ↓
Step 3: RECORD — 계획 파일 저장 (MANDATORY)
  docs/plans/YYYY-MM-DD_<topic>.md
    ↓
Step 4: EXECUTE — 작업 실행
  - 파일 생성·코드 작성·산출물 생성
    ↓
Step 5: COMMIT — git commit (MANDATORY)
  - 작업 완료의 마지막 단계
  - 계획 파일에 실행 결과·Lessons Learned 추가 후 커밋
```

### Plan 모드 (`/plan`) 진입 시 흐름

```
사용자: /plan
    ↓
Plan 모드 활성화 (read-only 강제)
    ↓
Step 1~2: Explore + Plan 에이전트 (read-only)
    ↓
Step 3: 계획 파일 작성
  C:\Users\kdkim2000\.claude\plans\swift-bubbling-taco.md
    ↓
ExitPlanMode → 사용자 승인 요청
    ↓
[승인 시] Step 4~5: Execute + Commit
```

### ai-dlc 스킬 전용 흐름

```
/ai-dlc-<skill-name> 호출
    ↓
docs/ai-dlc/README.md → 산출물 경로·입력 문서 확인
    ↓
Explore 에이전트: 입력 문서 탐색 (요구사항정의서 + 이전 Phase 산출물)
    ↓
Plan 에이전트: 산출물 내용 설계
    ↓
docs/plans/YYYY-MM-DD_<skill-name>.md 기록
    ↓
docs/ai-dlc/<phase>/ 산출물 파일 생성
    ↓
docs/ai-dlc/README.md 진행 상태 ✅ 업데이트
    ↓
git commit
```

---

## 8. 이 프로젝트 디렉터리 구조

```
E:\apps\mystock\
├── CLAUDE.md                    ← 하네스 메인 가이드 (프로젝트 컨텍스트)
├── env.example                  ← 환경변수 템플릿
├── .env.local                   ← 실제 환경변수 (git 제외)
└── docs\
    ├── ai-dlc\                  ← AI-DLC 산출물 (11 Phase)
    │   ├── README.md            ← DLC 프로세스 인덱스 + 진행 상태
    │   ├── 요구사항정의서_*.md   ← 기준 문서
    │   ├── 01-planning\         ← 용어사전, 페르소나, MVP, 스토리맵
    │   ├── 02-analysis\
    │   ├── 03-design\
    │   ├── 04-setup\
    │   ├── 05-impl-plan\
    │   ├── 06-implementation\
    │   ├── 07-validation\
    │   ├── 08-testing\
    │   ├── 09-performance\
    │   ├── 10-deployment\
    │   └── 11-delivery\
    ├── harness\                 ← 하네스 참조 문서 (이 폴더)
    │   ├── AGENT.md             ← 에이전트 활용 가이드
    │   ├── RULES.md             ← 행동 규칙
    │   ├── SKILLS.md            ← 스킬 참조 카드
    │   ├── MCP.md               ← MCP 도구 참조
    │   └── ARCHITECTURE.md     ← 하네스 아키텍처 (이 파일)
    └── plans\                   ← Plan 모드 기록
        ├── 2026-06-06_glossary-create.md
        ├── 2026-06-06_persona-create.md
        └── 2026-06-07_harness-docs.md

전역 하네스:
C:\Users\kdkim2000\.claude\
├── settings.json                ← 전역 설정
├── skills\                      ← 165+ 스킬
├── memory\ (via projects\)      ← 메모리 시스템
└── plans\                       ← Plan 임시 파일
```

---

## 9. 현재 환경 설정 스냅샷

| 항목 | 값 |
|:---|:---|
| effortLevel | high |
| theme | dark |
| skipAutoPermissionPrompt | true |
| 활성 플러그인 | github (official), my-skills (custom) |
| MCP 서버 | mcp-server-cloud (Cloudflare Workers) |
| 스킬 수 | 165+ |
| 프로젝트 레벨 설정 | 미사용 (전역 설정 상속) |
| 메모리 파일 | `C:\Users\kdkim2000\.claude\projects\E--apps-mystock\memory\` |
