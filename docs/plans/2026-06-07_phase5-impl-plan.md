# Plan: Phase 5 구현계획 4개 스킬 일괄 실행 (5-1 ~ 5-4)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `docs/ai-dlc/05-impl-plan/` 이하 4개 파일 |
| 목표 | 컴포넌트·API Route 의존성 분석 + Next.js/프론트엔드 구현 계획 + 개발 가이드 생성 |

## 계획 내용

### Context

Phase 4 환경설정 가이드 11개 완료. `src/` 폴더 없음 (소스 코드 미생성 상태).
Phase 5는 실제 코딩 시작 전 구현 순서·의존성·컨벤션을 정의하는 단계.
Phase 3 설계 (14 API·18 타입·6 시퀀스) + Phase 4 환경설정 가이드가 입력 문서.

### 의존성 분석 및 실행 전략

4개 산출물은 모두 독립적 문서 → 단일 배치, 4개 병렬 실행.
README.md 충돌 방지: 각 에이전트는 자신의 행(5-1/5-2/5-3/5-4)만 수정.

## 실행 결과

| 작업 | 상태 | 커밋 해시 |
|:---|:---:|:---|
| dependency-analysis.md 생성 | ✅ | `24a1d0f` |
| nxt-impl-plan.md 생성 | ✅ | `1199fe7` |
| fe-impl-plan.md 생성 | ✅ | `cfb8407` |
| dev-guide.md 생성 | ✅ | `8715e16` |
| README Phase 5 ✅ 완료 | ✅ | `8715e16` |

### 생성된 파일

| 파일 | 경로 | 내용 요약 |
|:---|:---|:---|
| dependency-analysis.md | `docs/ai-dlc/05-impl-plan/dependency-analysis.md` | 외부 패키지 16개 위험도 분석, 4계층 내부 의존성 그래프, 20단계 빌드 순서 (≈10일) |
| nxt-impl-plan.md | `docs/ai-dlc/05-impl-plan/nxt-impl-plan.md` | Phase 1~5 구현 계획, 14개 Route Handler, Route Handler 공통 패턴, maxDuration=60 |
| fe-impl-plan.md | `docs/ai-dlc/05-impl-plan/fe-impl-plan.md` | P0~P3 우선순위 37개 컴포넌트, 4 Phase 구현 순서, 한국 증시 색상 컨벤션, Recharts 다크모드 |
| dev-guide.md | `docs/ai-dlc/05-impl-plan/dev-guide.md` | 환경 설정, 파일 네이밍, TypeScript 컨벤션, Git 전략, 테스트, 보안 체크리스트 |

## Lessons Learned

1. **단일 배치 4개 병렬 성공** — Phase 4 3배치와 달리 Phase 5는 4개 모두 독립적이어서 단일 배치로 처리. 각 에이전트가 README.md 다른 행만 수정하여 충돌 없이 완료.

2. **계획적 의존성 분석** — src/ 폴더가 없는 상태에서 설계 문서 기반 의존성 분석. 실제 코드 없이도 4계층 의존성 그래프와 빌드 순서를 도출할 수 있음. madge 도구 활용 권장 언급.

3. **Plan 에이전트 출력 62KB 초과 문제** — Plan 에이전트가 4개 파일 전체 콘텐츠를 생성하여 62KB를 초과. 출력이 외부 파일에 저장되었으나 context 제약으로 읽기 실패. 이후 plan 파일에 직접 섹션별 내용을 기술하는 방식으로 전환하여 해결.

4. **Route Handler 공통 패턴 문서화** — 인증 → 입력 검증 → 캐시 조회 → 외부 API → 캐시 저장 → 응답의 5단계 패턴이 nxt-impl-plan에 코드 템플릿으로 명시됨. Phase 6 구현 시 패턴 일관성 보장.

5. **한국 증시 색상 컨벤션 fe-impl-plan 반영** — 상승=빨강(red), 하락=파랑(blue)이 ChangeBadge 컴포넌트 예시 코드로 명시됨. CSS 변수 `--color-price-up`, `--color-price-down` 사용.

6. **SR-005 구현 위치 명확화** — `session-expired-prompt.tsx`가 `window.fetch` 인터셉터로 전역 401 감지 → Dialog 표시 → signIn('google') 패턴임을 dev-guide에 명시.
