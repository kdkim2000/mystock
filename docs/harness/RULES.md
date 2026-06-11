# RULES.md — 하네스 행동 규칙

> CLAUDE.md의 필수 규칙을 하네스 관점에서 재정리한 빠른 참조 카드.
> 모든 규칙은 **예외 없이** 적용된다.

---

## 0. 작업 전 계획 강제 규칙 (HIGHEST PRIORITY — MANDATORY)

> **모든 실질적 작업은 Plan 모드 여부와 관계없이, 시작 전 반드시 계획을 수립하고 `docs/plans/`에 기록한 후 실행한다.**
> 이 규칙은 Plan 모드 규칙(Section 1)보다 상위이며, 어떤 상황에서도 생략할 수 없다.

### 적용 범위

다음에 해당하는 모든 작업에 적용한다:

| 작업 유형 | 예시 |
|:---|:---|
| ai-dlc 스킬 실행 | `/ai-dlc-system-overview`, `/ai-dlc-api-design` 등 |
| 파일 2개 이상 생성/수정 | 산출물 작성, 코드 구현, 설정 변경 |
| 새 기능·컴포넌트 구현 | Route Handler, Page, Component 추가 |
| 설계 결정 사항 | 아키텍처 변경, 데이터 스키마 변경 |
| 하네스 규칙 변경 | RULES.md, CLAUDE.md 개정 |

> **제외**: 단순 오타 수정, 단일 파일 1줄 이하 변경, 조회·읽기 전용 작업

### 필수 실행 절차 (Plan → Record → Execute → Commit)

```
Step 1: EXPLORE (Agent 병렬 실행)
  ├─ Explore 에이전트 1: 요구사항·기존 산출물 탐색
  ├─ Explore 에이전트 2: 관련 스킬 템플릿·output-policy 확인
  └─ Explore 에이전트 3: 연관 파일·코드 현황 파악

Step 2: PLAN (Agent 실행)
  └─ Plan 에이전트: 구현 전략 설계 (접근법·단계·검증 방법)

Step 3: RECORD (파일 작성 — MANDATORY)
  └─ docs/plans/YYYY-MM-DD_<kebab-topic>.md 생성

Step 4: EXECUTE (작업 실행)
  └─ Plan 내용에 따라 파일 생성·코드 작성

Step 5: COMMIT (MANDATORY)
  └─ git add → git commit (작업 완료의 마지막 단계)
```

### 계획 파일 최소 구조

```markdown
# Plan: <제목>

| 항목 | 내용 |
|:---|:---|
| 날짜 | YYYY-MM-DD |
| 대상 | 작업 대상 파일/기능 |
| 목표 | 이 계획으로 달성하려는 것 |

## 계획 내용
(단계별 접근 방법)

## 실행 결과
(실행 후 작성)

## Lessons Learned
(실행 후 작성)
```

### ai-dlc 스킬 전용 실행 절차

각 ai-dlc 스킬 실행 전 아래를 수행한다:

1. `docs/ai-dlc/README.md` 읽어 해당 스킬의 산출물 경로·입력 문서 확인
2. Explore 에이전트로 입력 문서(요구사항정의서, 이전 Phase 산출물) 탐색
3. Plan 에이전트로 산출물 내용 설계
4. `docs/plans/YYYY-MM-DD_<skill-name>.md` 기록
5. 산출물 파일 생성 (`docs/ai-dlc/<phase>/`)
6. `docs/ai-dlc/README.md` 진행 상태 업데이트 (✅)
7. git commit

---

## 1. Plan 모드 규칙 (MANDATORY)

Plan 모드(`/plan`) 사용 시 **계획 파일을 반드시 `docs/plans/`에 저장**한다.

### 파일 네이밍
```
docs/plans/YYYY-MM-DD_<kebab-case-topic>.md
```

예시:
```
docs/plans/2026-06-07_harness-docs.md
docs/plans/2026-06-07_nxt-project-setup.md
```

### 필수 섹션 (빠짐없이 작성)

```markdown
# Plan: <제목>

| 항목 | 내용 |
|:---|:---|
| 날짜 | YYYY-MM-DD |
| 대상 | 작업 대상 파일/기능 |
| 목표 | 이 계획으로 달성하려는 것 |

## 계획 내용
(단계별 계획 전문)

## 실행 결과
(실행 후 작성 — 완료 항목, 변경 내용, 문제점)

## Lessons Learned
(다음에 참고할 교훈, 예상과 달랐던 점)
```

### 저장 시점
1. **Plan 모드 진입 시**: `docs/plans/` 폴더 없으면 먼저 생성
2. **계획 확정 후 즉시**: 계획 내용 저장
3. **실행 완료 후**: 동일 파일에 결과·교훈 추가

> Plan 파일을 생성하지 않은 채 Plan 모드를 종료하지 않는다.

---

## 2. AI-DLC 산출물 규칙 (MANDATORY)

모든 `/ai-dlc-*` 스킬 산출물은 **반드시 `docs/ai-dlc/` 이하에 저장**한다.

### Phase별 저장 경로

| Phase | 폴더 | 주요 산출물 |
|:---:|:---|:---|
| 1 기획 | `docs/ai-dlc/01-planning/` | glossary, persona, mvp-scope, user-story-map |
| 2 분석 | `docs/ai-dlc/02-analysis/` | system-overview, usecase, biz-rules, screen-list |
| 3 설계 | `docs/ai-dlc/03-design/` | screen-spec, data-design, api-design, class-design |
| 4 환경설정 | `docs/ai-dlc/04-setup/` | nxt-project-setup, auth-guide, shadcn-guide 등 |
| 5 구현계획 | `docs/ai-dlc/05-impl-plan/` | nxt-impl-plan, fe-impl-plan, dev-guide |
| 6 구현 | `docs/ai-dlc/06-implementation/` | routes/, pages/, components/ |
| 7 검증 | `docs/ai-dlc/07-validation/` | code-review, ts-check, traceability |
| 8 테스트 | `docs/ai-dlc/08-testing/` | e2e-tests |
| 9 성능 | `docs/ai-dlc/09-performance/` | perf-guide |
| 10 배포 | `docs/ai-dlc/10-deployment/` | deploy-guide |
| 11 납품 | `docs/ai-dlc/11-delivery/` | delivery-checklist, user-manual |

### 스킬 실행 체크리스트
1. `docs/ai-dlc/README.md` 읽어 해당 스킬의 산출물 경로 확인
2. Phase 폴더 없으면 먼저 생성
3. 파일명: `{산출물유형}_{사업명}_{YYYYMMDD}.md`
4. 완료 후 `docs/ai-dlc/README.md` 진행 상태 업데이트 (✅)
5. 수정 스킬(`*-revise`) 결과는 원본 덮어쓰기 또는 `-v2.md` 접미사

---

## 3. Git 커밋 규칙 (MANDATORY)

### 작업 완료 시 자동 커밋 (MANDATORY)

**작업이 완료되면 반드시 git commit을 수행한다.** 사용자가 별도로 요청하지 않아도 작업 완료의 마지막 단계는 항상 커밋이다.

#### 커밋 절차

1. **변경 파일 확인**: `git status` (unstaged 파일 목록 확인)
2. **diff 검토**: `git diff` (staged·unstaged 변경 내용 확인)
3. **파일 스테이징**: 작업 관련 파일만 선택적으로 `git add` (민감 파일·바이너리 제외)
4. **커밋 메시지 작성**: 아래 규칙에 따라 HEREDOC으로 작성
5. **커밋 실행**: 훅 검사 통과 후 완료 확인

#### 커밋 메시지 규칙

```
git commit -m "$(cat <<'EOF'
<type>: <한 줄 요약> (50자 이내)

<변경 이유·배경> (선택, 필요시)

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

#### 커밋 완료 기준

- 훅 실패 시: 원인 파악 → 수정 → 재커밋 (`--no-verify` 절대 사용 금지)
- `git status`로 working tree clean 확인 후 완료 보고

### 금지 명령 (명시적 요청 없이 절대 실행 금지)

| 금지 명령 | 이유 |
|:---|:---|
| `git push --force` | 원격 이력 파괴 위험 |
| `git reset --hard` | 로컬 변경 사항 소실 위험 |
| `git commit --amend` | 이미 완료된 커밋 변경 위험 |
| `git commit --no-verify` | 훅 우회 — 품질 검사 건너뜀 |
| `git checkout -- .` / `git restore .` | 미저장 변경 소실 위험 |
| `rm -rf` | 파일 영구 삭제 |
| `git push` | 원격 반영 — 명시적 승인 필요 |

> **push는 별도 승인**: 커밋은 자동이나 push는 사용자 확인 후 실행한다.

---

## 4. 권한 모델

**현재 설정**: `skipAutoPermissionPrompt: true` (전역 설정)
→ 대부분의 도구 호출이 자동 승인됨

**그럼에도 확인이 필요한 작업**:
- 파일/폴더 **삭제** 작업
- **Vercel 배포** (외부 환경 영향)
- 환경변수 파일(`.env.local`) **수정**
- 기존 파일 **덮어쓰기** (예상치 못한 내용 포함 가능성)
- 외부 서비스 **API 호출** (비용 발생 가능)

---

## 5. 코드 작성 규칙

이 프로젝트(my-stock)에 코드 작성 시 따르는 규칙:

### 주석
- **기본: 주석 없음**
- WHY가 비자명한 경우(숨겨진 제약, 특정 버그 우회, 놀라운 동작)에만 한 줄 주석
- 코드가 무엇을 하는지(WHAT) 설명하는 주석 금지

### 구조
- 요청된 기능 범위만 구현 (불필요한 추상화·확장성 금지)
- 발생 불가능한 시나리오에 대한 에러 처리 금지
- 사용자 입력·외부 API 경계에서만 유효성 검사

### 보안
- **API 키 클라이언트 노출 절대 금지**
- KIS·DART·OpenAI·Google 자격증명은 서버사이드 전용
- 환경변수(`process.env.*`)로만 접근

### KIS API 필수 준수
- 호출 간격: **최소 400ms** (KIS_THROTTLE_MS 기본값)
- 토큰 발급: **1일 1회** 초과 금지 (`softExpireKisToken()` 사용)
- Vercel 갱신 엔드포인트: `export const maxDuration = 60` 필수

---

## 6. 메모리 시스템 규칙

### 저장 경로
```
C:\Users\kdkim2000\.claude\projects\E--apps-mystock\memory\
```

### 메모리 타입

| 타입 | 저장 대상 | 저장 시점 |
|:---|:---|:---|
| `user` | 사용자 역할·선호·지식 수준 | 사용자 특성 파악 시 |
| `feedback` | 교정·확인된 접근법 규칙 | 수정 또는 확인 받은 즉시 |
| `project` | 진행 중 작업·의사결정·마감 | 프로젝트 맥락 파악 시 |
| `reference` | 외부 시스템 위치 정보 | 외부 리소스 경로 파악 시 |

### 저장 제외 대상
- 코드 패턴·아키텍처 (코드에서 직접 확인)
- Git 이력·최근 변경 내용 (`git log`로 확인)
- 디버깅 해결책·수정 레시피 (코드에 반영됨)
- CLAUDE.md에 이미 문서화된 내용

### 파일 구조
```markdown
---
name: <short-kebab-slug>
description: <한 줄 요약 — 미래 대화에서 관련성 판단에 사용>
metadata:
  type: user | feedback | project | reference
---

<내용>
**Why:** <이유>
**How to apply:** <적용 시점>
```

---

## 7. UI/UX 품질 규칙 (QR 요구사항)

| 규칙 | 내용 |
|:---|:---|
| QR-001 다크/라이트 모드 | next-themes + CSS 변수, 100% 지원 |
| QR-002 반응형 | PC 우선, Tailwind responsive 클래스로 모바일 가독성 보장 |
| QR-003 스켈레톤 UI | 모든 주요 섹션에 로딩 중 Skeleton 컴포넌트 표시 |
| QR-004 에러 상태 | 모든 섹션에 API 실패/데이터 없음 fallback UI |
