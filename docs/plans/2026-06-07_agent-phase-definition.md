# Plan: Phase별 에이전트 위임 패턴 정의 (AGENT.md 확장)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `docs/harness/AGENT.md` (Section 8~10 추가) |
| 목표 | ai-dlc README.md의 11개 Phase 전체에 대해 에이전트 위임 전략을 정의하여, 모든 DLC 과정을 에이전트에 완전 위임할 수 있게 한다. |

## 계획 내용

### 접근 방식

1. Explore: README.md(11 Phase·45+ 스킬) + 현재 AGENT.md 구조 파악
2. Plan: Phase별 에이전트 구성 결정 (Explore 개수, Plan 개수, Execute 방식)
3. 기존 AGENT.md에 3개 섹션 추가 (Section 8, 9, 10)

### 추가 섹션 구조

- **Section 8**: Phase별 에이전트 위임 전략 (요약 표 + Phase 1~11 상세)
  - Phase별 Explore/Plan/Execute 에이전트 구성
  - 각 Phase의 특이사항 (의존성, 병렬화 가능 구간 등)
- **Section 9**: 표준 에이전트 프롬프트 템플릿 4종
  - Explore (요구사항/산출물 탐색)
  - Explore (스킬 템플릿 탐색)
  - Plan (산출물 내용 설계)
  - general-purpose (코드 구현)
- **Section 10**: Phase 연속 실행 시 에이전트 체이닝 전략

### 핵심 설계 결정

1. **Explore 에이전트 3개 병렬** — Phase 1~5 (기획~구현계획): 요구사항/이전산출물, 스킬템플릿, 기술제약
2. **Explore 에이전트 2개 병렬** — Phase 6~11 (구현~납품): 복잡도가 낮거나 Execute가 general-purpose로 이미 복잡
3. **Phase 6 구현은 general-purpose EXECUTE** — 실제 코드 작성이 필요하므로 Write-capable 에이전트
4. **Phase 7~8 검증/테스트도 general-purpose EXECUTE** — 빌드 명령 실행·파일 저장 필요

## 실행 결과

| 작업 | 상태 | 내용 |
|:---|:---:|:---|
| Plan 기록 파일 생성 | ✅ | `docs/plans/2026-06-07_agent-phase-definition.md` |
| AGENT.md Section 8 추가 | ✅ | Phase 1~11 요약 표 + 상세 에이전트 구성 |
| AGENT.md Section 9 추가 | ✅ | 표준 프롬프트 템플릿 4종 |
| AGENT.md Section 10 추가 | ✅ | Phase 연속 실행 체이닝 전략 |

## Lessons Learned

1. **Phase별 Execute 방식이 핵심 구분점** — 산출물이 마크다운 문서이면 Write 직접, 실제 소스 코드이면 general-purpose 에이전트가 필요. 이 구분이 에이전트 구성의 복잡도를 결정함.

2. **Explore 에이전트 입력은 구체적 파일 경로까지 명시** — "이전 Phase 산출물 읽기"보다 "E:\apps\mystock\docs\ai-dlc\01-planning\*.md 읽기"처럼 절대 경로를 명시해야 에이전트가 정확히 동작함.

3. **Phase 4 환경설정 가이드는 순서 의존성 존재** — 11개 스킬 중 일부는 이전 스킬 산출물에 의존(예: auth-guide는 project-setup 이후). 병렬화 한계를 명시해야 무작정 병렬 실행 시도를 방지.

4. **general-purpose 에이전트 프롬프트에는 제약사항이 필수** — KIS 400ms 스로틀, Vercel maxDuration=60, API 키 서버사이드 전용 등 my-stock 특유의 제약을 프롬프트에 명시해야 코드 품질이 유지됨.
