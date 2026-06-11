# Plan: 매매내역 컬럼 스키마 수정 (Fee/Tax/Amount 반영)

| 항목 | 내용 |
|:---|:---|
| 날짜 | 2026-06-08 |
| 대상 | `src/types/sheets.ts` · `src/app/api/sheets/transactions/route.ts` · `src/components/dashboard/trade-history-table.tsx` · `src/components/dashboard/cumulative-profit-chart.tsx` · `CLAUDE.md` · `docs/ai-dlc/` |
| 목표 | 실제 Google Sheets 10개 컬럼 구조에 맞는 올바른 데이터 파싱 + 정확한 손익 계산 |

## 문제 진단

실제 Google Sheets `매매내역` 탭의 컬럼은 10개이지만, 기존 코드는 7개(A:G)만 읽어 다음과 같은 치명적 버그가 있었다:

| 열 | 실제 컬럼 | 기존 코드 매핑 |
|:---:|:---|:---|
| F (r[5]) | Fee (수수료) | ❌ Journal로 오독 |
| G (r[6]) | Tax (세금) | ❌ Tags로 오독 |
| H (r[7]) | Journal | ❌ 읽지 않음 |
| I (r[8]) | Tags | ❌ 읽지 않음 |
| J (r[9]) | Amount (금액) | ❌ 읽지 않음 |

이로 인해: Journal/Tags 데이터가 깨짐, 수수료·세금이 손익에 미반영, 누적손익 차트가 5% 고정값으로 표시됨.

## 실행 결과

### 코드 수정 (4개 파일)

1. **`src/types/sheets.ts`** — `SheetTransactionRow`에 Fee, Tax, Amount 필드 추가
2. **`src/app/api/sheets/transactions/route.ts`** — 읽기 범위 A:G → A:J, 인덱스 재매핑
3. **`src/components/dashboard/trade-history-table.tsx`** — 금액·수수료+세금 컬럼 추가
4. **`src/components/dashboard/cumulative-profit-chart.tsx`** — 이동평균법 기반 실현손익 계산 구현

### 누적손익 계산 알고리즘

```
매수 시: totalCost += Price × Quantity + Fee; qty += Quantity
매도 시: avgCost = totalCost / qty
         realized = Price × Quantity - Fee - Tax - avgCost × Quantity
         cumulative += realized
```

### 문서 수정 (3개 파일)

- `CLAUDE.md` — Google Sheets Data Schema에 Fee, Tax, Amount 추가
- `docs/ai-dlc/03-design/data-design.md` — 컬럼 정의 표 및 샘플 데이터 업데이트
- `docs/ai-dlc/02-analysis/biz-rules.md` — BR-017~019 (실현손익 계산 규칙) 추가

## Lessons Learned

- Google Sheets에서 새 컬럼이 삽입되면 기존 인덱스 매핑이 전부 틀어진다. 컬럼명 기반 조회가 인덱스보다 견고하지만, Sheets API v4는 헤더 기반 조회를 지원하지 않으므로 명시적 범위(A:J)와 주석으로 인덱스 의도를 명확히 해야 한다.
- 누적손익 차트의 "임시 5% 가정" 주석은 즉시 수정 대상으로 처리되어야 했다.
