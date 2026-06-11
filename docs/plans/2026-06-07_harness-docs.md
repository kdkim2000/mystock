# Plan: docs/harness 하네스 문서 5종 생성

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `docs/harness/AGENT.md`, `RULES.md`, `SKILLS.md`, `MCP.md`, `ARCHITECTURE.md` |
| 목표 | Claude Code 하네스를 적극 활용할 수 있도록 Agent·스킬·MCP·규칙·아키텍처를 프로젝트 맥락으로 문서화 |

## 계획 내용

### 배경

`docs/harness/` 폴더가 빈 상태에서 하네스 기능을 프로젝트 컨텍스트와 연결하는 참조 문서가 없었다. ai-dlc 스킬 실행·Plan 모드·MCP 도구 사용 시 빠르게 조회할 수 있도록 5종의 문서를 생성한다.

### Phase 1: 탐색 (Explore 에이전트 병렬)

사전 탐색을 통해 확인한 핵심 정보:

- **설정**: `C:\Users\kdkim2000\.claude\settings.json` — effortLevel:high, skipAutoPermissionPrompt:true, mcp-server-cloud(Cloudflare Workers), 플러그인: github+my-skills
- **스킬**: 165+ 스킬, ai-dlc-* 147개(11 Phase), 시스템 내장(code-review, verify, init, deep-research 등), 커스텀(pr-description, emoji-summarizer 등)
- **MCP**: mcp-server-cloud 3개 도구(get_my_stats, log_usage, submit_daily_report), Vercel 2개, IDE 2개, 지연 로드 도구 17개

### Phase 2: 파일 설계

| 파일 | 핵심 목적 |
|:---|:---|
| `AGENT.md` | 에이전트 타입 선택, 병렬/순차 패턴, 이 프로젝트의 활용 패턴, 프롬프트 원칙 |
| `RULES.md` | Plan 모드 MANDATORY, AI-DLC MANDATORY, Git 안전, 권한 모델, 코드 규칙, 메모리 규칙 |
| `SKILLS.md` | 11 Phase 스킬 맵, 수정/검토 스킬 패턴, 시스템 내장, 커스텀, 유틸리티, 출력 정책 |
| `MCP.md` | 활성 서버 3종, 지연 로드 17종, ToolSearch 사용법, 이 프로젝트 시나리오 4개 |
| `ARCHITECTURE.md` | 설정 계층, 스킬 구조, MCP 구조, 에이전트 구조, 메모리, Plan 모드 흐름, 디렉터리 |

## 실행 결과

모든 파일 첫 시도에서 오류 없이 생성 완료.

| 파일 | 상태 | 주요 내용 |
|:---|:---:|:---|
| `docs/harness/AGENT.md` | ✅ | 에이전트 타입 5종, 병렬/순차/백그라운드 패턴, 프로젝트 4가지 활용 패턴 |
| `docs/harness/RULES.md` | ✅ | Plan·AI-DLC MANDATORY 규칙, Git 금지 명령, 권한 모델, KIS API 제약, 메모리 규칙 |
| `docs/harness/SKILLS.md` | ✅ | 11 Phase 전체 스킬-산출물 맵, 수정/검토 패턴, 시스템 내장 스킬, 출력 정책 요약 |
| `docs/harness/MCP.md` | ✅ | 활성 서버 3종, 지연 도구 17종, 프로젝트 시나리오 4개, ToolSearch 사용법 |
| `docs/harness/ARCHITECTURE.md` | ✅ | 설정 계층, 스킬 구조, MCP/에이전트/메모리 아키텍처, Plan 모드 흐름, 디렉터리 구조 |

## Lessons Learned

1. **5개 파일 병렬 Write** — 파일 간 의존성이 없어 단일 메시지에서 5개를 동시 생성. 순차 대비 5배 빠름. 파일 수가 많더라도 독립적이면 병렬 처리가 효율적.

2. **계획 파일이 실행 가이드 역할** — 컨텍스트 압축 후에도 `swift-bubbling-taco.md`에 상세 설계가 남아 있어 재개 시 추가 탐색 없이 바로 실행 가능. Plan 모드 기록이 컨텍스트 연속성에 실질적으로 기여.

3. **RULES.md와 AGENT.md 중복 최소화** — RULES.md는 "무엇을 해야/하지 말아야 하는지"(규칙), AGENT.md는 "어떻게 에이전트를 쓰는지"(방법)로 명확히 분리하면 각 파일의 가독성이 높아짐.

4. **하네스 문서는 CLAUDE.md의 보완재** — CLAUDE.md는 프로젝트 아키텍처·제약을 담고, harness/ 문서는 하네스 도구 사용법에 집중. 두 계층 분리로 각 목적에 맞는 조회가 가능.

5. **MCP 지연 도구 개수 확인** — 세션마다 지연 로드 목록이 변할 수 있으므로, MCP.md는 카테고리 구조로 작성하고 `system-reminder`에서 실제 목록을 확인하는 방식이 적합.
