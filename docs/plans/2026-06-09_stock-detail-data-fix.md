# Plan: 종목 상세 페이지 데이터 공백 수정

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-09 |
| 대상 | `src/lib/kis.ts`, `kis/**/route.ts` 4개, `fundamental/route.ts`, `dart/financial/route.ts`, `portfolio-card.tsx` |
| 목표 | 종목 상세 페이지에서 비어있는 수급추이·일봉·애널의견·재무·DART·보유현황을 정상화 |

## 발견된 버그

### Bug 1 (Critical): kisRequest output key 오류
KIS API는 단건 응답은 `output`, 목록(배열) 응답은 `output2`에 담는다.
`kisRequest`는 `data.output ?? data`를 반환 → `output`이 없으면 전체 응답 객체 반환.

| 라우트 | TR ID | 실제 배열 위치 | 현재 동작 |
|:---|:---|:---|:---|
| `daily-price` | FHKST03010100 | `output2` | `output` 없음 → 전체 obj → map 실패 |
| `trading-trend` | FHKST01010900 | `output2` | `output` 단건 집계 → 배열 아님 |
| `opinion` | FHKST03010600 | `output2` | `output` 없음 → 전체 obj → map 실패 |

### Bug 2: 당기순이익 필드명 불일치
- `financial/route.ts`: `raw.thtr_ntis`
- `fundamental/route.ts`: `raw.thtr_ntin` ← 오타
KIS balance-sheet API 올바른 필드명: `thtr_ntis` (당기순이익)

### Bug 3: DART 당해연도 사업보고서 미제출
- 요청: `bsns_year: '2026'`, `reprt_code: '11011'` (사업보고서)
- 2026년 사업보고서는 2027년 3월경 제출 → 현재 데이터 없음
- 수정: 당해연도 빈 결과 → 전년도(2025) 자동 재시도

### Bug 4: PortfolioCard 종목코드 매칭 실패
- `computeAggregation`에서 Code는 `GOOGLE_SHEET_TICKER_MASTER` 없으면 `''`
- `agg.find(r => r.Code === code)` → undefined → 카드 미표시
- 수정: 종목명(Ticker) fallback 매칭 추가

## 수정 계획

1. `src/lib/kis.ts`: `kisRequest` 4번째 파라미터 `outputKey: 'output' | 'output2'` 추가
2. `src/app/api/kis/daily-price/route.ts`: `outputKey: 'output2'` 전달
3. `src/app/api/kis/trading-trend/route.ts`: `outputKey: 'output2'` 전달
4. `src/app/api/kis/opinion/route.ts`: `outputKey: 'output2'` 전달
5. `src/app/api/kis/financial/route.ts`: `thtr_ntin` → `thtr_ntis`
6. `src/app/api/fundamental/route.ts`: `thtr_ntin` → `thtr_ntis`
7. `src/app/api/dart/financial/route.ts`: 전년도 fallback 추가
8. `src/components/stock/portfolio-card.tsx`: Ticker 이름 fallback 매칭

## 실행 결과
(실행 후 작성)

## Lessons Learned
(실행 후 작성)
