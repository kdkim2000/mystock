# MCP.md — MCP 도구 참조

> Model Context Protocol(MCP) 서버와 도구 목록 및 사용 방법.
> MCP 도구는 하네스가 외부 시스템과 연동하는 확장 메커니즘이다.

---

## 1. MCP 개요

MCP(Model Context Protocol)는 Claude Code가 외부 시스템·도구와 연동하기 위한 표준 프로토콜이다.

- **즉시 로드 도구**: 세션 시작 시 스키마가 자동 로드됨 → 바로 호출 가능
- **지연 로드(Deferred) 도구**: 이름만 알려짐 → `ToolSearch`로 스키마 로드 후 호출

```
# 지연 도구 사용 절차
ToolSearch(query="select:TaskCreate,TaskUpdate")  # 스키마 로드
TaskCreate(...)  # 이후 호출 가능
```

---

## 2. 활성 MCP 서버

### mcp-server-cloud (Cloudflare Workers)

**설정 위치**: `C:\Users\kdkim2000\.claude\settings.json` → `mcpServers`  
**엔드포인트**: `https://mcp-server.kdkim2000.workers.dev`  
**인증**: Bearer 토큰 (헤더 포함)

| 도구 | 설명 |
|:---|:---|
| `mcp__mcp-server-cloud__get_my_stats` | 사용 통계 조회 |
| `mcp__mcp-server-cloud__log_usage` | 사용량 기록 |
| `mcp__mcp-server-cloud__submit_daily_report` | 일일 리포트 제출 |

### mcp__claude_ai_Vercel__*

Vercel 플랫폼 연동. 배포 및 인증 작업에 사용.

| 도구 | 설명 |
|:---|:---|
| `mcp__claude_ai_Vercel__authenticate` | Vercel 계정 인증 시작 |
| `mcp__claude_ai_Vercel__complete_authentication` | Vercel 인증 완료 |

> **이 프로젝트 활용**: Vercel 배포 전 `mcp__claude_ai_Vercel__authenticate` 실행

### mcp__ide__*

IDE(VS Code 등) 통합 도구. 코드 실행 및 진단에 사용.

| 도구 | 설명 | 활용 |
|:---|:---|:---|
| `mcp__ide__executeCode` | IDE에서 코드 실행 | 스크립트 즉시 실행 |
| `mcp__ide__getDiagnostics` | TypeScript/ESLint 진단 결과 조회 | `ai-dlc-fe-ts-check` 실행 후 확인 |

---

## 3. 지연 로드(Deferred) 도구 목록

세션 시작 시 이름만 알려지는 도구. **사용 전 ToolSearch로 스키마를 반드시 로드**해야 한다.

### 태스크 관리

| 도구 | 설명 |
|:---|:---|
| `TaskCreate` | 새 태스크 생성 (진행 추적용) |
| `TaskGet` | 특정 태스크 정보 조회 |
| `TaskList` | 전체 태스크 목록 조회 |
| `TaskUpdate` | 태스크 상태 업데이트 (`in_progress` / `completed`) |
| `TaskStop` | 실행 중 태스크 중단 |
| `TaskOutput` | 태스크 출력 결과 조회 |

```
# 태스크 관리 패턴
ToolSearch("select:TaskCreate,TaskUpdate")
TaskCreate(title="Phase 2 분석", description="유스케이스 작성")
TaskUpdate(id="...", status="in_progress")
# 작업 완료 후
TaskUpdate(id="...", status="completed")
```

### 스케줄링

| 도구 | 설명 |
|:---|:---|
| `CronCreate` | 크론 스케줄 생성 (반복 자동화) |
| `CronDelete` | 크론 스케줄 삭제 |
| `CronList` | 등록된 크론 목록 조회 |

### 웹 도구

| 도구 | 설명 | 주요 용도 |
|:---|:---|:---|
| `WebSearch` | 웹 검색 | KIS/DART API 문서 조회, 에러 코드 검색 |
| `WebFetch` | URL 콘텐츠 가져오기 | API 공식 문서 크롤링 |

```
# 웹 조사 예시
ToolSearch("select:WebSearch,WebFetch")
WebSearch(query="KIS Open API EGW00133 에러 원인")
WebFetch(url="https://apiportal.koreainvestment.com/...")
```

### 프로세스 제어

| 도구 | 설명 |
|:---|:---|
| `Monitor` | 백그라운드 프로세스 스트리밍 모니터링 |
| `RemoteTrigger` | 원격 작업 트리거 |
| `PushNotification` | 알림 전송 |

### 워크트리 / 격리

| 도구 | 설명 |
|:---|:---|
| `EnterWorktree` | 격리된 git 워크트리 진입 (병렬 파일 수정 시 충돌 방지) |
| `ExitWorktree` | 워크트리 종료 |

### Plan 모드 제어

| 도구 | 설명 |
|:---|:---|
| `EnterPlanMode` | Plan 모드 진입 (read-only 탐색 + 계획 작성) |
| `ExitPlanMode` | Plan 모드 종료 + 사용자 승인 요청 |

### 노트북

| 도구 | 설명 |
|:---|:---|
| `NotebookEdit` | Jupyter 노트북 셀 편집 |

---

## 4. 이 프로젝트에서의 MCP 활용 시나리오

### 시나리오 A: Vercel 배포

```
1. mcp__claude_ai_Vercel__authenticate    # 인증 시작
2. mcp__claude_ai_Vercel__complete_authentication  # 인증 완료
3. Bash("vercel --prod")                  # 배포 실행
```

### 시나리오 B: TypeScript 오류 진단 (Phase 7 검증)

```
1. Bash("npm run build")                  # 빌드 실행
2. mcp__ide__getDiagnostics               # IDE 진단 결과 조회
3. /ai-dlc-fe-ts-check                    # TypeScript 체크 스킬 실행
```

### 시나리오 C: KIS API 스로틀 문제 조사

```
ToolSearch("select:WebSearch")
WebSearch("KIS Open API EGW00133 EGW00201 스로틀 해결")
# → 결과를 api-design.md 업데이트에 반영
```

### 시나리오 D: 진행 상태 추적 (ai-dlc Phase 진행 시)

```
ToolSearch("select:TaskCreate,TaskUpdate,TaskList")
TaskCreate(title="Phase 2 분석", ...)
# Phase 2 스킬 실행
TaskUpdate(id="...", status="completed")
```

---

## 5. MCP 설정 파일 위치

| 파일 | 용도 |
|:---|:---|
| `C:\Users\kdkim2000\.claude\settings.json` | 전역 MCP 서버 등록 (`mcpServers` 키) |
| `C:\Users\kdkim2000\AppData\Roaming\Claude\claude_desktop_config.json` | Claude Desktop 앱 MCP 설정 |
| `E:\apps\mystock\.claude\settings.json` | 프로젝트별 MCP 오버라이드 (현재 미사용) |

설정 변경이 필요하면 `/update-config` 스킬 사용.

---

## 6. ToolSearch 사용법

지연 도구를 사용하기 전 스키마를 로드한다.

```
# 이름으로 직접 선택 (권장)
ToolSearch(query="select:TaskCreate,TaskUpdate")

# 키워드로 검색
ToolSearch(query="notebook jupyter")

# 이름+키워드 조합
ToolSearch(query="+slack send message")
```

> 스키마가 로드된 후에는 일반 도구처럼 직접 호출 가능.
