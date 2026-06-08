# Plan: 집계 데이터 트랜잭션 직접 계산

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-08 |
| 대상 | `src/lib/compute-aggregation.ts` (신규) · `src/app/api/sheets/aggregation/route.ts` · `src/app/dashboard/page.tsx` |
| 목표 | 평균단가·실현손익을 별도 시트 의존 없이 매매내역에서 직접 계산 |

## 문제 원인

```
/api/sheets/aggregation
  → GOOGLE_SHEET_AGGREGATION 미설정 → ok([]) 즉시 반환
  → 설정해도 수동 관리 탭 → 값 없음 / 0
  → KPI카드, 종목분석테이블, 포지션차트, 실현손익차트 전부 공백
```

## 계획 내용

### Step 1: `src/lib/compute-aggregation.ts` 신규 생성
- 매매내역 전체 읽기 → 종목별로 날짜 오름차순 정렬
- 이동평균법으로 계산:
  - 매수: qty += Quantity, cost += Price*Quantity + Fee
  - 매도(qty>0): soldQty = min(Quantity, qty), avgCost = cost/qty
    - pnl = Price*soldQty - (Fee+Tax)*비율 - avgCost*soldQty
    - tradeCount++, winCount++ if pnl>0
- 결과: Holdings, AvgPrice, TotalBuy, RealizedPnL, TradeCount, WinCount
- Code 조회: GOOGLE_SHEET_TICKER_MASTER에서 Ticker→Code 맵핑

### Step 2: `/api/sheets/aggregation/route.ts` 재작성
- GOOGLE_SHEET_AGGREGATION 의존 제거
- computeAggregation() 호출로 대체

### Step 3: `src/app/dashboard/page.tsx` SSR 프리페치 수정
- if (GOOGLE_SHEET_AGGREGATION) 조건 제거
- 항상 computeAggregation() 프리페치

## 검증

```bash
npx tsc --noEmit
# → 오류 없음
# → /dashboard 에서 평균단가·실현손익 표시 확인
```

## 실행 결과

- `src/lib/compute-aggregation.ts` 신규 생성: 이동평균법 per-ticker 집계 함수
- `src/app/api/sheets/aggregation/route.ts`: GOOGLE_SHEET_AGGREGATION 의존 제거, computeAggregation() 호출로 대체
- `src/app/dashboard/page.tsx`: SSR 프리페치 if(GOOGLE_SHEET_AGGREGATION) 조건 제거, 항상 실행
- TypeScript 오류: 0건
- 샘플 데이터 검증: 포스코DX 평균단가 35,401원, 현대약품 실현손익 −853,381원 정확

## Lessons Learned

- 별도 집계 시트(종목별집계)에 의존하는 구조는 데이터 관리 부담이 크고 오류 발생 용이
- 트랜잭션에서 직접 계산하는 방식이 단일 진실 공급원(single source of truth)으로 더 안정적
- 이동평균법 핵심: 매수이력 없는 매도 건은 손익 계산에서 제외해야 함 (avgCost=0으로 전액 이익 처리하는 버그 방지)
