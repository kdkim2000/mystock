# Plan: Phase 4 환경설정 11개 스킬 일괄 실행 (4-1 ~ 4-11)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `docs/ai-dlc/04-setup/` 이하 11개 파일 |
| 목표 | Next.js 15 프로젝트 환경설정 가이드 문서를 에이전트로 일괄 생성 |

## 계획 내용

### Context

Phase 3 설계 완료 (screen-spec, data-design, api-design, class-design, sequence-design 5개 ✅).
소스 코드 미생성 상태 (`src/` 폴더 없음, package.json·next.config.mjs 없음).
Phase 4는 실제 개발 시작 전 환경설정 레퍼런스 가이드 11개를 생성하는 단계.
모든 가이드는 Phase 3 설계 문서(API 14개·TypeScript 타입 18개·Sheets 5탭·3계층 캐시)를 기반으로 my-stock 특화 내용을 담는다.

### 의존성 분석 및 실행 전략

11개 산출물은 모두 독립적인 가이드 문서로 서로 의존하지 않는다.
README.md 동시 수정 충돌을 방지하기 위해 3개 배치(Batch)로 나누어 병렬 실행.

| 배치 | 파일 | 실행 방식 |
|:---:|:---|:---:|
| Batch A | nxt-project-setup + fe-node-setup + nxt-auth-guide + nxt-middleware-guide | 4개 병렬 |
| Batch B | fe-shadcn-guide + fe-tailwind-guide + fe-axios-guide + fe-react-query-guide | 4개 병렬 |
| Batch C | fe-state-guide + fe-zod-guide + nxt-sc-guide | 3개 병렬 |

출력 폴더: `docs/ai-dlc/04-setup/`

## 실행 결과

| 작업 | 상태 | 커밋 해시 |
|:---|:---:|:---|
| nxt-project-setup.md 생성 | ✅ | `74f98c1` |
| fe-node-setup.md 생성 | ✅ | `53c13ec` |
| nxt-auth-guide.md 생성 | ✅ | `d82b758` |
| nxt-middleware-guide.md 생성 | ✅ | `50fec28` |
| fe-shadcn-guide.md 생성 | ✅ | `0134019` |
| fe-tailwind-guide.md 생성 | ✅ | `24b7cbf` |
| fe-axios-guide.md 생성 | ✅ | `f2271b4` |
| fe-react-query-guide.md 생성 | ✅ | `0d10d29` |
| fe-state-guide.md 생성 | ✅ | `8a85fb5` |
| fe-zod-guide.md 생성 | ✅ | `8da608e` |
| nxt-sc-guide.md 생성 | ✅ | `6001c3a` |
| README Phase 4 ✅ 완료 | ✅ | `6001c3a` |

### 생성된 파일

| 파일 | 경로 | 핵심 내용 |
|:---|:---|:---|
| nxt-project-setup.md | `docs/ai-dlc/04-setup/nxt-project-setup.md` | CLI init, tsconfig, next.config.mjs, 폴더구조, vercel.json |
| fe-node-setup.md | `docs/ai-dlc/04-setup/fe-node-setup.md` | package.json 전체, shadcn init, npm scripts, Node 20+ |
| nxt-auth-guide.md | `docs/ai-dlc/04-setup/nxt-auth-guide.md` | NextAuth v4, Google OAuth, ALLOWED_EMAIL, JWT 전략 |
| nxt-middleware-guide.md | `docs/ai-dlc/04-setup/nxt-middleware-guide.md` | middleware.ts, matcher, SR-005 세션만료 UI |
| fe-shadcn-guide.md | `docs/ai-dlc/04-setup/fe-shadcn-guide.md` | shadcn init, ThemeProvider, 한국 증시 CSS 변수 |
| fe-tailwind-guide.md | `docs/ai-dlc/04-setup/fe-tailwind-guide.md` | tailwind.config.ts, 반응형 브레이크포인트, 레이아웃 패턴 |
| fe-axios-guide.md | `docs/ai-dlc/04-setup/fe-axios-guide.md` | KIS 스로틀, 토큰 관리, Sheets/DART/OpenAI 패턴 |
| fe-react-query-guide.md | `docs/ai-dlc/04-setup/fe-react-query-guide.md` | QueryClient, staleTime 정책, custom hooks, HydrationBoundary |
| fe-state-guide.md | `docs/ai-dlc/04-setup/fe-state-guide.md` | next-themes, useSession, URL 파라미터, IntersectionObserver |
| fe-zod-guide.md | `docs/ai-dlc/04-setup/fe-zod-guide.md` | env.ts 검증 스키마, API 바디 검증, Sheets 스키마, KIS 스키마 |
| nxt-sc-guide.md | `docs/ai-dlc/04-setup/nxt-sc-guide.md` | Server/Client 분리 기준표, 컴포넌트 분류, 안티패턴 4종 |

## Lessons Learned

1. **3 Batch 병렬 전략 성공** — 11개 가이드를 Batch A(4) + B(4) + C(3)로 분리하여 총 3라운드 병렬 실행. README.md 충돌 없이 완료. Phase 2·3에서 검증된 패턴이 Phase 4에서도 유효함을 재확인.

2. **전체 내용 인라인 제공이 품질의 핵심** — 각 에이전트 프롬프트에 파일 전체 내용을 직접 기술. 에이전트가 탐색·재설계 없이 즉시 고품질 파일 작성 가능. 특히 KIS 스로틀, softExpireKisToken(), 한국 증시 색상 컨벤션 등 my-stock 특화 내용이 누락 없이 반영됨.

3. **Phase 4는 실제 코드 대신 가이드 문서** — Phase 4 산출물은 `.ts/.tsx` 코드가 아닌 `.md` 가이드 파일. Phase 6 구현 단계에서 이 가이드를 참조하여 실제 코드를 생성하는 구조. 관심사 분리가 명확함.

4. **KIS 토큰 레이스 컨디션 문서화** — `softExpireKisToken()` 패턴 (만료 1시간 전 갱신)이 fe-axios-guide에 명시됨. Vercel 멀티 인스턴스 환경에서 하루 1회 발급 제한 위반을 방지하는 핵심 패턴.

5. **SR-005 구현 패턴 문서화** — API 401 응답 시 강제 리다이렉트 대신 `SessionExpiredPrompt` UI 알림을 표시하는 패턴이 nxt-middleware-guide에 명시됨. fetch 인터셉터 + Dialog 조합.

6. **staleTime = Sheets TTL 정합** — fe-react-query-guide에서 TanStack Query staleTime을 Sheets 캐시 TTL과 일치시킴 (30분 KIS, 7일 AI). 불필요한 재요청 없이 캐시 일관성 보장.

7. **컨텍스트 압축(summary) 후 재개** — 세션 컨텍스트가 요약 처리된 후 Batch C를 재개했으나, summary에 모든 필요 정보(파일 내용·커밋 해시·다음 단계)가 포함되어 있어 무중단 진행 가능. 장기 세션에서의 컨텍스트 요약 전략이 유효함을 확인.
