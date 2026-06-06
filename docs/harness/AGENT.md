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
