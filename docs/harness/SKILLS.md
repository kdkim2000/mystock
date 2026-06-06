# SKILLS.md — 스킬 참조 카드

> 165+ 스킬을 목적별로 분류한 빠른 조회 인덱스.
> 스킬 저장 위치: `C:\Users\kdkim2000\.claude\skills\`

---

## 1. 스킬 호출 방법

```
# 채팅창에서 슬래시 명령으로 호출
/skill-name [선택적 인자]

# 예시
/ai-dlc-glossary-create
/code-review --fix
/deep-research "KIS Open API 스로틀 제한 분석"
```

Skill 도구를 통해 Claude Code 내부에서도 호출 가능.  
스킬 검색이 필요하면 `/find-skills <키워드>` 사용.

---

## 2. AI-DLC 스킬 Phase 맵

전체 프로세스: `docs/ai-dlc/README.md` 참조

| Phase | 스킬 | 산출물 |
|:---:|:---|:---|
| **1 기획** | `/ai-dlc-glossary-create` | `01-planning/용어사전_*.md` |
| | `/ai-dlc-persona-create` | `01-planning/페르소나_*.md` |
| | `/ai-dlc-mvp-scope` | `01-planning/mvp-scope.md` |
| | `/ai-dlc-user-story-map` | `01-planning/user-story-map.md` |
| **2 분석** | `/ai-dlc-system-overview` | `02-analysis/system-overview.md` |
| | `/ai-dlc-service-catalog` | `02-analysis/service-catalog.md` |
| | `/ai-dlc-usecase-create` | `02-analysis/usecase.md` |
| | `/ai-dlc-biz-rules-create` | `02-analysis/biz-rules.md` |
| | `/ai-dlc-screen-list` | `02-analysis/screen-list.md` |
| **3 설계** | `/ai-dlc-screen-spec` | `03-design/screen-spec.md` |
| | `/ai-dlc-data-design` | `03-design/data-design.md` |
| | `/ai-dlc-api-design` | `03-design/api-design.md` |
| | `/ai-dlc-class-design` | `03-design/class-design.md` |
| | `/ai-dlc-sequence-design` | `03-design/sequence-design.md` |
| **4 환경** | `/ai-dlc-nxt-project-setup` | `04-setup/nxt-project-setup.md` |
| | `/ai-dlc-nxt-auth-guide` | `04-setup/nxt-auth-guide.md` |
| | `/ai-dlc-nxt-middleware-guide` | `04-setup/nxt-middleware-guide.md` |
| | `/ai-dlc-fe-shadcn-guide` | `04-setup/fe-shadcn-guide.md` |
| | `/ai-dlc-fe-tailwind-guide` | `04-setup/fe-tailwind-guide.md` |
| | `/ai-dlc-fe-axios-guide` | `04-setup/fe-axios-guide.md` |
| | `/ai-dlc-fe-react-query-guide` | `04-setup/fe-react-query-guide.md` |
| | `/ai-dlc-fe-state-guide` | `04-setup/fe-state-guide.md` |
| | `/ai-dlc-fe-zod-guide` | `04-setup/fe-zod-guide.md` |
| | `/ai-dlc-nxt-sc-guide` | `04-setup/nxt-sc-guide.md` |
| **5 구현계획** | `/ai-dlc-dependency-analysis` | `05-impl-plan/dependency-analysis.md` |
| | `/ai-dlc-nxt-impl-plan` | `05-impl-plan/nxt-impl-plan.md` |
| | `/ai-dlc-fe-impl-plan` | `05-impl-plan/fe-impl-plan.md` |
| | `/ai-dlc-dev-guide` | `05-impl-plan/dev-guide.md` |
| **6 구현** | `/ai-dlc-nxt-route-handler-gen` | `06-implementation/routes/` |
| | `/ai-dlc-nxt-server-action-gen` | `06-implementation/actions/` |
| | `/ai-dlc-nxt-page-gen` | `06-implementation/pages/` |
| | `/ai-dlc-fe-component-gen` | `06-implementation/components/` |
| **7 검증** | `/ai-dlc-fe-ts-check` | `07-validation/ts-check.md` |
| | `/ai-dlc-fe-lint-check` | `07-validation/lint-check.md` |
| | `/ai-dlc-nxt-code-review` | `07-validation/nxt-code-review.md` |
| | `/ai-dlc-fe-code-review` | `07-validation/fe-code-review.md` |
| | `/ai-dlc-consistency-check` | `07-validation/consistency-check.md` |
| | `/ai-dlc-code-traceability` | `07-validation/traceability.md` |
| | `/ai-dlc-code-complexity` | `07-validation/code-complexity.md` |
| **8 테스트** | `/ai-dlc-nxt-e2e-test-gen` | `08-testing/e2e-tests.md` |
| | `/ai-dlc-fe-e2e-test-gen` | `08-testing/fe-e2e-tests.md` |
| **9 성능** | `/ai-dlc-nxt-perf-guide` | `09-performance/nxt-perf-guide.md` |
| | `/ai-dlc-fe-perf-guide` | `09-performance/fe-perf-guide.md` |
| **10 배포** | `/ai-dlc-nxt-deploy-guide` | `10-deployment/deploy-guide.md` |
| **11 납품** | `/ai-dlc-delivery-checklist` | `11-delivery/delivery-checklist.md` |
| | `/ai-dlc-user-manual` | `11-delivery/user-manual.md` |
| | `/ai-dlc-delivery-package` | `11-delivery/delivery-package.md` |

---

## 3. 수정/검토 스킬 패턴

산출물 수정이 필요할 때 `*-revise` / `*-validate` 계열 스킬을 사용.

| 패턴 | 스킬 예시 | 용도 |
|:---|:---|:---|
| 수정 | `/ai-dlc-glossary-revise` | 기존 산출물 내용 업데이트 |
| 검증 | `/ai-dlc-glossary-validate` | 일관성·완전성 검증 |
| 적용 | `/ai-dlc-glossary-apply` | 용어집을 다른 산출물에 일괄 반영 |
| 설계 역추출 | `/ai-dlc-design-extract` | 기존 코드에서 설계 문서 역생성 |
| API 역추출 | `/ai-dlc-api-spec-extract` | 기존 코드에서 API 명세 역생성 |
| 변경 관리 | `/ai-dlc-change-register` → `/ai-dlc-change-complete` | 변경 등록 후 완료 처리 |
| 영향 분석 | `/ai-dlc-impact-analysis` | 변경 영향 범위 분석 |

> **파일명 규칙**: 수정 스킬 산출물은 원본 파일 덮어쓰기 또는 `_v0.2.md` 버전 접미사 추가

---

## 4. 시스템 내장 스킬

Claude Code 하네스에 기본 포함된 스킬.

### 코드 품질
| 스킬 | 설명 | 주요 옵션 |
|:---|:---|:---|
| `/code-review` | 현재 diff 코드 리뷰 | `--fix` (자동 수정), `--comment` (PR 코멘트) |
| `/simplify` | 리팩터링 및 단순화 | — |
| `/verify` | 앱 실행하여 변경 사항 동작 확인 | — |
| `/security-review` | 보안 취약점 검토 | — |

### 프로젝트 관리
| 스킬 | 설명 |
|:---|:---|
| `/init` | CLAUDE.md 초기화 (코드베이스 분석) |
| `/run` | 앱 실행 및 동작 확인 |
| `/review` | PR 리뷰 |

### 도구 설정
| 스킬 | 설명 |
|:---|:---|
| `/update-config` | settings.json 설정 변경 (훅, 권한, 환경변수) |
| `/keybindings-help` | 키보드 단축키 커스터마이징 |
| `/fewer-permission-prompts` | 읽기전용 도구 자동 허용 설정 |

### AI / 연구
| 스킬 | 설명 |
|:---|:---|
| `/deep-research <질문>` | 멀티소스 웹 조사 + 팩트 검증 리포트 |
| `/claude-api` | Claude API / Anthropic SDK 참조 |

### 자동화
| 스킬 | 설명 | 예시 |
|:---|:---|:---|
| `/loop [interval] /command` | 반복 실행 | `/loop 5m /verify` |
| `/schedule` | 원격 에이전트 크론 스케줄 등록 | — |

---

## 5. 커스텀 my-skills

`E:\apps\claude\my-plugins`에 등록된 사용자 정의 스킬.

| 스킬 | 설명 |
|:---|:---|
| `my-skills:blank-template` | 빈 스킬 템플릿 |
| `my-skills:crawled-content-cleanup` | 크롤링 콘텐츠 정리 |
| `my-skills:emoji-summarizer` | 이모지 요약 |
| `my-skills:pr-description` | PR 설명 자동 생성 |

---

## 6. 유틸리티 스킬

| 스킬 | 설명 |
|:---|:---|
| `/find-skills <키워드>` | 키워드로 스킬 검색 |
| `/pdf-to-markdown <파일>` | PDF → 마크다운 텍스트 추출 (pdfplumber 사용) |

---

## 7. 산출물 출력 정책 요약

원문: `C:\Users\kdkim2000\.claude\skills\ai-dlc-common\references\output-policy.md`

| 항목 | 규칙 |
|:---|:---|
| 파일명 | `{산출물유형}_{사업명}_{YYYYMMDD}.md` |
| 수정 파일명 | `{유형}_{사업명}_{YYYYMMDD}_v0.2.md` |
| 언어 | 전체 한국어, 기술 고유명사(React, JWT 등)는 영문 유지 |
| 버전 이력 | 모든 산출물 하단에 버전 이력 표 필수 |
| 추측 표시 | `<!-- TODO: 확인 필요 -->` 인라인 주석 |
| 테이블 정렬 | 좌: `:---`, 중앙: `:---:`, 우: `---:` |
| 기존 파일 | 동일 파일명 존재 시 덮어쓰기 전 확인 |
