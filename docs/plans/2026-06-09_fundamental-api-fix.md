# Plan: /api/fundamental 데이터 로딩 실패 수정

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-09 |
| 대상 | `src/lib/kis.ts`, `src/app/api/fundamental/route.ts`, `src/app/api/kis/valuation/route.ts` |
| 목표 | 밸류에이션·재무현황·레이더·추정실적 섹션 데이터 정상화 |

## 발견된 버그

### Bug 1 (Critical): Promise.all 병렬 KIS 호출 → Rate Limit

`fundamental/route.ts`가 `Promise.all`로 2개 KIS 요청을 동시에 발사한다.

`throttledFetch` 내부:
```typescript
const elapsed = now - (globalThis._kisLastCallTime ?? 0)
// 첫 호출: elapsed = Date.now() - 0 = ~1749xxx ms >> 400ms → 스로틀 건너뜀
```

첫 호출 시 `_kisLastCallTime = undefined` → `elapsed` = 타임스탬프(매우 큰 값) >> 400ms → 두 호출 모두 스로틀 없이 동시 발사 → 두 번째 KIS 요청에서 `EGW00133` (rate limit) → `rt_cd !== '0'` 조건 → throws → Promise.all 전체 실패 → 500 반환 → 클라이언트 `!r.ok` → data = undefined → UI 전체 '-' 표시

### Bug 2: kisRequest 에러 메시지 불투명

```typescript
if (data.rt_cd !== '0' || data.msg_cd === 'EGW00133') {
  throw new Error('KIS_RATE_LIMIT')  // Rate limit이 아닌 에러도 동일 메시지
}
```

모든 KIS 에러를 `KIS_RATE_LIMIT`로 처리 → 실제 원인(잘못된 파라미터, 미구독 API 등) 파악 불가.

### Bug 3: 재무 API output 배열 반환 가능성

KIS `FHKST66430200`(재무비율), `FHKST66430300`(대차대조표)가 `output`을 단일 객체가 아닌 배열로 반환할 경우:
- `valuationRaw.per` = `undefined` (배열에는 .per 없음)
- `Number(undefined)` = `NaN` → 모든 값 NaN

### Bug 4: kis/valuation/route.ts 추정실적 조건 오류

```typescript
estimatedRevenue: raw.stac_yymm ? Number(raw.est_sale_amnt) : undefined
//              ↑ 결산년월로 체크 (잘못됨) → est_sale_amnt로 체크해야 함
```

## 수정 계획

1. `src/lib/kis.ts`:
   - `kisRequest` 에러 처리 개선: `rt_cd !== '0'`이면 실제 `msg_cd`·`msg1` 포함한 에러 던짐
   - Rate limit / Token expired는 기존 명칭 유지

2. `src/app/api/fundamental/route.ts`:
   - `Promise.all` → 순차 호출로 변경 (rate limit 회피)
   - `output` 배열 방어 처리: `Array.isArray(raw) ? raw[0] : raw`

3. `src/app/api/kis/valuation/route.ts`:
   - `estimatedRevenue` 조건 수정: `raw.stac_yymm` → `raw.est_sale_amnt`

## 실행 결과
(실행 후 작성)

## Lessons Learned
(실행 후 작성)
