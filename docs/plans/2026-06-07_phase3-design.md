# Plan: Phase 3 설계 5개 스킬 일괄 실행 (3-1 ~ 3-5)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-07 |
| 대상 | `docs/ai-dlc/03-design/` 이하 5개 파일 |
| 목표 | 화면정의·데이터·API·클래스·시퀀스 설계 문서를 에이전트로 단계적 생성 |

## 계획 내용

### 의존성 구조 및 실행 전략

| 순서 | 파일 | 의존 | 실행 방식 |
|:---:|:---|:---|:---:|
| 1a | `screen-spec.md` | screen-list.md (완료) | 병렬 |
| 1b | `data-design.md` | CLAUDE.md Sheets 스키마 | 병렬 |
| 1c | `api-design.md` | service-catalog, usecase (완료) | 병렬 |
| 2 | `class-design.md` | api-design 완료 후 | 순차 |
| 3 | `sequence-design.md` | class-design 완료 후 | 순차 |

### 산출물 설계 요약

- **screen-spec**: 16개 SCR (페이지3 + 섹션13), 공통 컴포넌트 10개
- **data-design**: 5개 Google Sheets 탭, TypeScript 타입 5개 (데이터 레이어)
- **api-design**: 14개 REST 엔드포인트, UC 15건 100% 커버
- **class-design**: TypeScript 타입 18개, 4개 레이어 아키텍처
- **sequence-design**: 6개 시나리오 (mermaid), 캐시 HIT/MISS 분기 포함

## 실행 결과

| 작업 | 상태 | 커밋 해시 |
|:---|:---:|:---|
| screen-spec.md 생성 | ✅ | `b2fe4dc` |
| data-design.md 생성 | ✅ | `2bb48e2` |
| api-design.md 생성 | ✅ | `858f2e2` |
| class-design.md 생성 | ✅ | `a8e2493` |
| sequence-design.md 생성 | ✅ | `a491178` |
| README Phase 3 ✅ 완료 | ✅ | `a491178` |

### 생성된 파일

| 파일 | 경로 | 내용 요약 |
|:---|:---|:---|
| screen-spec.md | `docs/ai-dlc/03-design/screen-spec.md` | SCR-001~003-13, 16개 화면, 공통 컴포넌트 10개 |
| data-design.md | `docs/ai-dlc/03-design/data-design.md` | Sheets 5탭 스키마, TypeScript 5개 타입 |
| api-design.md | `docs/ai-dlc/03-design/api-design.md` | 14개 엔드포인트, UC 100% 커버 |
| class-design.md | `docs/ai-dlc/03-design/class-design.md` | TypeScript 18개 타입, 패키지 구조 |
| sequence-design.md | `docs/ai-dlc/03-design/sequence-design.md` | SEQ-001~006, mermaid 다이어그램 6개 |

## Lessons Learned

1. **병렬 3개 에이전트 실행 성공** — screen-spec·data-design·api-design을 동시 실행. 각 에이전트가 README.md의 다른 행만 수정하므로 충돌 없이 누적 처리됨.

2. **전체 내용 인라인 제공 전략 유효** — Phase 2와 동일하게 설계 내용 전체를 프롬프트에 직접 포함하여 품질 균일성 확보. 에이전트가 탐색·재설계하는 시간 없이 즉시 파일 작성 가능.

3. **순차 의존성 관리** — class-design은 api-design 완료 후, sequence-design은 class-design 완료 후 실행하여 설계 일관성 보장.

4. **mermaid sequenceDiagram 활용** — 캐시 HIT/MISS 분기, KIS Rate Limit, 세션 만료(SR-005) 처리를 시각적으로 명확히 표현. 코드 리뷰 없이도 흐름 파악 가능.

5. **Phase 3 완료 기준** — 3-1(화면정의서) + 3-2(데이터설계서) + 3-3(API설계서) + 3-4(클래스설계서) + 3-5(시퀀스다이어그램) 5개 산출물 커밋 + README Phase 3 ✅.
