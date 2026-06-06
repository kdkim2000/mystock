# Plan: 사용자 스토리 맵 생성 (ai-dlc-user-story-map)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `docs/ai-dlc/01-planning/사용자스토리맵_my-stock_20260607.md` |
| 목표 | FR-001~022 전체를 7개 Activity·22개 US-NNN으로 변환하여 사용자 스토리 맵 생성 |

## 계획 내용

### Activity 구성 (7개)

| # | Activity | US 수 | 포함 US |
|:---:|:---|:---:|:---|
| 1 | 인증 | 2 | US-001(Must), US-002(Should) |
| 2 | 대시보드 조회 | 7 | US-003,007,009(Must), US-004,005(Should), US-006,008(Nice) |
| 3 | 시세·가치·재무 분석 | 5 | US-010,011,012(Must), US-013,014(Nice) |
| 4 | 매매동향·공시 | 3 | US-015,017(Must), US-016(Nice) |
| 5 | AI·보조지표 분석 | 2 | US-020(Should), US-019(Nice) |
| 6 | 내 투자 관리 | 2 | US-018(Must), US-021(Should) |
| 7 | 데이터 갱신 | 1 | US-022(Must) |

### 우선순위 집계

- Must Have 11건: US-001,003,007,009,010,011,012,015,017,018,022
- Should Have 5건: US-002,004,005,020,021
- Nice to Have 6건: US-006,008,013,014,016,019

### 접근 방식

1. Explore 에이전트 3개 병렬: 요구사항정의서 FR 목록, 페르소나, MVP범위정의서, 스킬 템플릿
2. Plan 에이전트: 7개 Activity·22개 US 전체 설계 + Given/When/Then 수락 기준
3. 산출물 파일 작성 및 README 업데이트

## 실행 결과

| 작업 | 상태 | 내용 |
|:---|:---:|:---|
| Plan 기록 파일 생성 | ✅ | `docs/plans/2026-06-07_user-story-map.md` |
| 사용자 스토리 맵 생성 | ✅ | `docs/ai-dlc/01-planning/사용자스토리맵_my-stock_20260607.md` (22건) |
| README 진행 상태 업데이트 | ✅ | Phase 1: `1-4 사용자스토리맵 ✅` 추가 |

## Lessons Learned

1. **FR 1:1 매핑이 가장 일관된 접근법** — FR 22건이 US 22건과 정확히 1:1 대응되어 추적성(traceability)이 명확해진다. US 건수가 FR 건수와 일치하면 Phase 7 검증에서 traceability.md 작성이 용이.

2. **Activity는 서비스 화면 구조를 따르는 것이 직관적** — "인증 → 대시보드 → 종목 상세(시세/재무/AI) → 갱신" 흐름이 실제 사용자 여정과 Next.js 페이지 구조(`/`, `/stock/[code]`)에 직접 매핑됨. 화면 설계(Phase 3)에서 이 구조를 그대로 활용 가능.

3. **Nice to Have = v1.1 대상** — MVP범위정의서의 v1.1 6건(FR-006,008,013,014,016,019)이 모두 Nice to Have로 매핑됨. US 우선순위가 릴리즈 로드맵과 일치하므로 Phase 5 구현 계획에서 스프린트 분리 기준으로 직접 사용 가능.

4. **수락 기준의 캐시 상태 명시** — my-stock의 3계층 캐시(globalThis→/tmp→Sheets) 특성상 Given 조건에 "캐시 HIT 상태"를 명시해야 테스트 시나리오가 명확해짐. 향후 Phase 8 E2E 테스트에서 캐시 HIT/MISS 시나리오를 구분하는 근거가 됨.
