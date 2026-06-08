# Plan: 밸류에이션 렌더링·캐시 키 정합 수정

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-09 |
| 대상 | `src/components/stock/valuation-table.tsx`, `src/app/api/fundamental/route.ts`, `src/app/api/ticker/[code]/refresh/route.ts` |
| 목표 | 'undefined원/undefined%' 렌더링 버그 제거 + 캐시 키 정합으로 갱신 버튼 효과 확보 |

## 발견된 버그

### Bug 1: valuation-table.tsx 렌더링 버그
```typescript
['EPS', v?.eps?.toLocaleString('ko-KR')+'원'],  // undefined+'원' = 'undefined원' → ?? '-' 통과!
['ROE', v?.roe?.toFixed(2)+'%'],                 // undefined+'%' = 'undefined%'
```
`v?.eps = null` (JSON NaN→null) → `null?.toLocaleString()` = `undefined` → `undefined + '원'` = `'undefined원'` (truthy) → `?? '-'` 미동작

### Bug 2: 캐시 키 불일치
- `fundamental/route.ts`: `${code}_fundamental` 로 저장
- `refresh/route.ts`: `${code}_valuation`, `${code}_financial` 로 저장
- 갱신 버튼 → 캐시 초기화 후 `_valuation`, `_financial` 저장
- 다음 페이지 로드 → `_fundamental` 없음 → KIS 재호출
- `fundamental/route.ts`가 `_valuation`/`_financial` 캐시를 활용 못 함

### Bug 3: refresh/route.ts 잔존 오류
- `netProfit: Number(raw.thtr_ntin)` → `thtr_ntis`로 수정 필요
- `toRecord` 없음 → output 배열 시 필드 undefined

## 수정 계획

1. `valuation-table.tsx`: suffix 포함 항목을 null-safe 조건식으로 변경
2. `fundamental/route.ts`: 캐시 키를 `_valuation`+`_financial`로 변경, 두 캐시 모두 hit 시 바로 반환
3. `refresh/route.ts`: `thtr_ntin`→`thtr_ntis` + `toRecord` 헬퍼 추가

## 실행 결과

- ✅ `valuation-table.tsx`: `pct/krw/num` null-safe 헬퍼 추가, suffix 문자열 연산 제거, `!v` 오류 상태 표시
- ✅ `fundamental/route.ts`: 캐시 키 `_fundamental` → `_valuation`+`_financial` (refresh/route.ts와 통일), `setCached` 분리 저장
- ✅ `refresh/route.ts`: valuation/financial 섹션에 `toRecord` 배열 방어 추가, `thtr_ntin` → `thtr_ntis` 수정
- ✅ TypeScript 오류 없음

## Lessons Learned

- 캐시 키를 여러 모듈에 걸쳐 설계할 때는 처음부터 단일 상수로 정의해야 한다. 모듈별로 다른 키를 사용하면 refresh 효과가 없어지고 디버깅이 매우 어렵다.
- `NaN + '원'` = `'NaN원'` (truthy) → suffix 연산을 항상 null-safe 조건 안에서 수행해야 한다. `?? '-'` 는 null/undefined만 막고 'NaN원' 같은 truthy 문자열은 통과시킨다.
- `kisRequest`의 `outputKey` 기본값은 `'output'`이지만 반환값이 배열인 경우가 있다. `toRecord`로 첫 원소 추출하는 패턴을 표준화할 것.
