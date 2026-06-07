# TypeScript 타입 오류 검사 보고서

| 항목 | 내용 |
|:---|:---|
| 검사일 | 2026-06-07 |
| 검사 범위 | `src/` 전체 (87개 TS/TSX 파일) |
| 검사 도구 | `tsc --noEmit` (TypeScript 5.6) |
| 검사자 | Claude Sonnet 4.6 (AI-DLC Phase 7) |

---

## 1. 검사 결과 요약

| 구분 | 건수 |
|:---|:---:|
| 초기 오류 (P1 — 즉시수정 필수) | 3건 |
| 초기 오류 (P2 — 즉시수정 권고) | 4건 |
| **초기 오류 합계** | **7건** |
| 수정 후 잔존 오류 | **0건 ✅** |

> 모든 오류가 수정 완료되어 `npx tsc --noEmit` 실행 시 오류 없이 종료됩니다.

---

## 2. 오류 목록 (수정 전)

### 오류 #1 — P1 (즉시수정 필수)

| 항목 | 내용 |
|:---|:---|
| 파일 | `.next/types/validator.ts(207,31)` |
| 관련 소스 | `src/app/api/ticker/[code]/refresh/route.ts` (lines 80–88) |
| 오류 코드 | `TS2344` |
| 오류 메시지 | Type `'{ params: { code: string }; }'` does not satisfy the constraint ... |
| 원인 | Next.js 14 방식의 `params` 타입 `{ params: { code: string } }` 사용 — Next.js 15에서는 `params`가 `Promise`로 변경됨 |
| 분류 | **P1** — Next.js 15 breaking change, 런타임에서 `params` 미해결로 오류 발생 가능 |

**수정 방법:**
- `params` 타입을 `{ params: Promise<{ code: string }> }`로 변경
- `const { code } = await params` 방식으로 비동기 언래핑

---

### 오류 #2 — P2 (즉시수정 권고)

| 항목 | 내용 |
|:---|:---|
| 파일 | `src/components/dashboard/cumulative-profit-chart.tsx(67,22)` |
| 오류 코드 | `TS2322` |
| 오류 메시지 | Type `'(v: number) => string'` is not assignable to type `'(value: ValueType \| undefined, ...) => ...'` |
| 원인 | Recharts `Tooltip` `formatter` prop의 `value` 파라미터 타입은 `ValueType \| undefined`인데 `number`로 명시 |
| 분류 | **P2** — 타입 불안전, 컴파일 오류 |

**수정 방법:**
- `(v) => v != null ? \`${(Number(v) / 1e4).toFixed(1)}만원\` : ''`

---

### 오류 #3 — P2 (즉시수정 권고)

| 항목 | 내용 |
|:---|:---|
| 파일 | `src/components/dashboard/position-bar-chart.tsx(34,22)` |
| 오류 코드 | `TS2322` |
| 오류 메시지 | Type `'(v: number) => string'` is not assignable to type `'(value: ValueType \| undefined, ...) => ...'` |
| 원인 | 오류 #2와 동일 — Recharts formatter 파라미터 타입 불일치 |
| 분류 | **P2** — 타입 불안전, 컴파일 오류 |

**수정 방법:**
- `(v) => v != null ? \`${(Number(v) / 1e4).toFixed(0)}만원\` : ''`

---

### 오류 #4 — P2 (즉시수정 권고)

| 항목 | 내용 |
|:---|:---|
| 파일 | `src/components/dashboard/profit-bar-chart.tsx(34,22)` |
| 오류 코드 | `TS2322` |
| 오류 메시지 | Type `'(v: number) => string'` is not assignable to type `'(value: ValueType \| undefined, ...) => ...'` |
| 원인 | 오류 #2와 동일 — Recharts formatter 파라미터 타입 불일치 |
| 분류 | **P2** — 타입 불안전, 컴파일 오류 |

**수정 방법:**
- `(v) => v != null ? \`${(Number(v) / 1e4).toFixed(1)}만원\` : ''`

---

### 오류 #5 — P2 (즉시수정 권고)

| 항목 | 내용 |
|:---|:---|
| 파일 | `src/components/stock/rsi-macd-card.tsx(57,24)` |
| 오류 코드 | `TS2322` |
| 오류 메시지 | Type `'(v: number) => string'` is not assignable to type `'(value: ValueType \| undefined, ...) => ...'` |
| 원인 | RSI Tooltip formatter 파라미터 타입 불일치 |
| 분류 | **P2** — 타입 불안전, 컴파일 오류 |

**수정 방법:**
- `(v) => v != null ? Number(v).toFixed(1) : ''`

---

### 오류 #6 — P2 (즉시수정 권고)

| 항목 | 내용 |
|:---|:---|
| 파일 | `src/components/stock/rsi-macd-card.tsx(68,24)` |
| 오류 코드 | `TS2322` |
| 오류 메시지 | Type `'(v: number) => string'` is not assignable to type `'(value: ValueType \| undefined, ...) => ...'` |
| 원인 | MACD Tooltip formatter 파라미터 타입 불일치 |
| 분류 | **P2** — 타입 불안전, 컴파일 오류 |

**수정 방법:**
- `(v) => v != null ? Number(v).toFixed(2) : ''`

---

### 오류 #7 — P1 (즉시수정 필수)

| 항목 | 내용 |
|:---|:---|
| 파일 | `src/lib/auth.ts(28,7)` |
| 오류 코드 | `TS18048` |
| 오류 메시지 | `'session.user'` is possibly `'undefined'` |
| 원인 | NextAuth의 `session.user`는 `User \| undefined` 타입이므로 직접 프로퍼티에 접근할 수 없음 |
| 분류 | **P1** — 런타임 `TypeError` 발생 가능 |

**수정 방법:**
- `if (session.user) { session.user.email = token.email as string }` 가드 추가

---

## 3. 수정 내역

### 3-1. `src/app/api/ticker/[code]/refresh/route.ts`

**수정 전 (lines 80–88):**
```typescript
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params
  // ...
}
```

**수정 후:**
```typescript
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  // ...
}
```

---

### 3-2. `src/components/dashboard/cumulative-profit-chart.tsx`

**수정 전 (line 67):**
```typescript
formatter={(v: number) => `${(v / 1e4).toFixed(1)}만원`}
```

**수정 후:**
```typescript
formatter={(v) => v != null ? `${(Number(v) / 1e4).toFixed(1)}만원` : ''}
```

---

### 3-3. `src/components/dashboard/position-bar-chart.tsx`

**수정 전 (line 34):**
```typescript
formatter={(v: number) => `${(v / 1e4).toFixed(0)}만원`}
```

**수정 후:**
```typescript
formatter={(v) => v != null ? `${(Number(v) / 1e4).toFixed(0)}만원` : ''}
```

---

### 3-4. `src/components/dashboard/profit-bar-chart.tsx`

**수정 전 (line 34):**
```typescript
formatter={(v: number) => `${(v / 1e4).toFixed(1)}만원`}
```

**수정 후:**
```typescript
formatter={(v) => v != null ? `${(Number(v) / 1e4).toFixed(1)}만원` : ''}
```

---

### 3-5. `src/components/stock/rsi-macd-card.tsx`

**수정 전 (line 57 — RSI):**
```typescript
formatter={(v: number) => v.toFixed(1)}
```

**수정 후:**
```typescript
formatter={(v) => v != null ? Number(v).toFixed(1) : ''}
```

**수정 전 (line 68 — MACD):**
```typescript
formatter={(v: number) => v.toFixed(2)}
```

**수정 후:**
```typescript
formatter={(v) => v != null ? Number(v).toFixed(2) : ''}
```

---

### 3-6. `src/lib/auth.ts`

**수정 전 (line 28):**
```typescript
session.user.email = token.email as string
```

**수정 후:**
```typescript
if (session.user) {
  session.user.email = token.email as string
}
```

---

## 4. 정적 분석

> `src/` 전체에 대해 Grep 기반 패턴 분석을 수행하였습니다.

| 패턴 | 건수 | 평가 |
|:---|:---:|:---|
| `any` 명시적 어노테이션 | **0건** | 양호 — `any` 타입 미사용 |
| `as never` 캐스팅 | **1건** | 허용 — `src/lib/sheets.ts:21` (googleapis 타입 불일치 우회, 런타임 영향 없음) |
| `as string` 단언 | **4건** | 허용 — NextAuth `token.email` 처리 및 KIS API raw 응답 처리 (합당한 수준) |
| `!` 비-null 단언 | **0건** | 양호 |
| `@ts-ignore` | **0건** | 양호 |
| `@ts-expect-error` | **0건** | 양호 |

### 4-1. `as never` 상세

| 파일 | 라인 | 내용 | 판단 |
|:---|:---:|:---|:---|
| `src/lib/sheets.ts` | 21 | googleapis JWT 인증 객체를 `as never`로 캐스팅 | 허용 — googleapis 라이브러리 타입 정의 한계로 인한 우회이며 런타임 동작에 영향 없음 |

### 4-2. `as string` 상세

| 파일 | 용도 | 판단 |
|:---|:---|:---|
| `src/lib/auth.ts` | `token.email as string` — NextAuth 콜백 내 이메일 확정 | 허용 — 이미 `if (session.user)` 가드 적용 |
| `src/lib/auth.ts` | `token.sub as string` — JWT 서브젝트 확정 | 허용 — Google OAuth 진입 이후 항상 존재 |
| `src/lib/kis.ts` | KIS API raw 응답 필드 추출 | 허용 — 외부 API 응답 스키마가 고정되어 있음 |
| `src/lib/kis.ts` | KIS API raw 응답 필드 추출 (추가) | 허용 — 동일 사유 |

---

## 5. 최종 확인

```
$ npx tsc --noEmit

(오류 없음 — 정상 종료)
```

| 항목 | 결과 |
|:---|:---:|
| 최종 TypeScript 오류 수 | **0건 ✅** |
| 검사 범위 | `src/` 전체 87개 파일 |
| Next.js 15 타입 호환성 | 확인 완료 ✅ |
| Recharts 3.x 타입 호환성 | 확인 완료 ✅ |
| NextAuth v4 타입 안전성 | 확인 완료 ✅ |

> **판정: PASS** — TypeScript 컴파일 오류 0건. 모든 발견 오류 수정 완료.
