# Plan: 프론트엔드 코드 리뷰 보고서 작성

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `src/components/`, `src/hooks/` (32개 파일) |
| 목표 | AI-DLC Phase 7-4 프론트엔드 코드 리뷰 보고서 작성 및 `docs/ai-dlc/07-validation/fe-code-review.md` 생성 |

## 계획 내용

1. 핵심 파일 7개 우선 Read (오케스트레이터, 훅, 주요 UI)
2. 추가 컴포넌트 파일 순차 Read (Hooks 6개, Dashboard 8개, Stock 15개, Auth/UI 4개)
3. 기존 lint-check.md 참조하여 이미 발견된 이슈 연계
4. 이슈 카테고리별 분류: 로직오류, 접근성, 컴포넌트구조, 타입안전성, 성능
5. 심각도 P1/P2/P3 분류 후 보고서 작성
6. README.md Phase 7 상태 업데이트

## 실행 결과

- `docs/ai-dlc/07-validation/fe-code-review.md` 생성 완료
- 총 이슈 11건 발견 (P1: 2건, P2: 4건, P3: 5건)
- 우수 사례 8건 도출
- 종합 판정: 조건부통과
- `docs/ai-dlc/README.md` Phase 7 상태에 7-4 FE코드리뷰 ✅ 추가

### 주요 발견 이슈

| 순위 | 이슈 | 심각도 |
|:---|:---|:---:|
| 1 | `cumulative-profit-chart.tsx` 손익 계산 하드코딩(`*0.05`) | P1 |
| 2 | `session-expired-prompt.tsx` window.fetch 이중 패치 위험 | P1 |
| 3 | `stock-detail-client.tsx` ticker 폴백 처리 불명확 | P2 |
| 4 | `rsi-macd-card.tsx` useQuery 컴포넌트 내부 인라인 선언 | P2 |
| 5 | `trade-history-table.tsx`, `journal-table.tsx` 인덱스 key 사용 | P2 |

## Lessons Learned

- 누적 손익 계산처럼 주석에 "간략화"로 명시된 코드가 실제 UI에 노출되는 경우, P1 이슈로 분류해야 한다.
- `window.fetch` monkey-patching은 React StrictMode 이중 실행과의 충돌을 반드시 검토해야 한다.
- TanStack Query staleTime이 서버 캐시 TTL과 일치하는 패턴은 설계 일관성의 우수 사례로 주목할 만하다.
- `src/hooks/`에 훅을 분리하는 패턴이 전체적으로 일관되게 적용되어 있으나, `rsi-macd-card.tsx`의 인라인 useQuery가 유일한 예외다.
