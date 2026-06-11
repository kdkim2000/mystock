# Plan: ESLint 검사 보고서 생성

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | src/ 전체 (TypeScript/TSX 파일) |
| 목표 | LN-001~LN-008 항목별 정적 분석으로 ESLint 검사 보고서 생성 |

## 계획 내용

1. EXPLORE: 주요 파일들을 Read 도구로 읽어 소스코드 파악
   - session-expired-prompt.tsx (LN-001 useEffect 의존성)
   - providers.tsx (LN-008 react-refresh)
   - hooks/ 전체 (LN-001 exhaustive-deps)
   - dashboard/, stock/ 컴포넌트 전체

2. GREP 분석:
   - console.* → LN-006
   - \bany\b → LN-003
   - useEffect → LN-001
   - import 순서 → LN-004
   - 파일명 패턴 → LN-005
   - export default + named export 혼용 → LN-008

3. 보고서 작성: docs/ai-dlc/07-validation/lint-check.md

4. README.md 업데이트

5. git commit

## 실행 결과

- LN-001: session-expired-prompt.tsx useEffect에 빈 배열 [] — 의도적 패턴(마운트 시 1회 fetch 패치)으로 실질적 위반 아님. use-toast.ts의 useEffect([state]) — state가 의존성에 포함되어 있어 정상.
- LN-002: 미사용 변수/import 없음 (전수 확인)
- LN-003: explicit any 없음. [key: string]: unknown 패턴은 정상, as never는 googleapis 타입 우회용으로 1건 존재.
- LN-004: import 순서 위반 없음 (Next.js → 외부 라이브러리 → 내부 @/ 순서 일관)
- LN-005: 파일명 컨벤션 위반 없음 (전체 kebab-case)
- LN-006: console.* 없음 (src/ 전체)
- LN-007: 따옴표/세미콜론 불일치 — 일부 shadcn UI 파일에서 double-quote 사용 (toast.tsx 등). 기타 파일은 single-quote 일관.
- LN-008: 혼합 export 없음 — 페이지 컴포넌트만 default export, 나머지는 named export만 사용

## Lessons Learned

- src/ 파일을 Grep 도구로 검색할 때 Windows 경로의 특수문자로 인해 일부 패턴이 매칭되지 않을 수 있어 Bash grep을 병행 활용함.
- as never 사용(sheets.ts)은 googleapis 타입 불일치 우회용으로, 실제 코드 품질 문제는 아님.
- ReactQueryDevtools가 프로덕션 빌드에 포함되는 것은 환경 분기가 없으므로 권고사항으로 기록.
