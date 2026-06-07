# ESLint 검사 결과

| 항목 | 내용 |
|:---|:---|
| 검사일 | 2026-06-07 |
| 검사 범위 | `src/` 전체 (TypeScript .ts / .tsx, 83개 파일) |
| ESLint 설정 | `.eslintrc.json` 미설치 (`next lint` deprecated) — Grep·Read 정적 분석으로 대체 |
| 검사자 | Claude Sonnet 4.6 (AI-DLC Phase 7) |

---

## 검사 결과 요약

| 코드 | 항목 | 건수 | 심각도 |
|:---|:---|:---:|:---:|
| LN-001 | react-hooks/exhaustive-deps (useEffect 의존성) | 1 | Warning |
| LN-002 | 미사용 변수·Import | 0 | — |
| LN-003 | @typescript-eslint/no-explicit-any | 1 | Warning |
| LN-004 | Import 순서 위반 (외부→내부) | 0 | — |
| LN-005 | 파일명 컨벤션 위반 (kebab-case) | 0 | — |
| LN-006 | no-console (console.log 잔존) | 0 | — |
| LN-007 | Prettier 포맷팅 불일치 | 2 | Info |
| LN-008 | react-refresh/only-export-components | 1 | Warning |

**종합 판정**: 조건부통과

> 총 5건 발견 (Error 0건, Warning 3건, Info 2건). 필수 수정 항목은 없으나 LN-001·LN-003·LN-008을 개선 권고.

---

## 이슈 목록

| LI-ID | 코드 | 파일 | 라인 | 설명 | 수정방향 |
|:---|:---|:---|:---:|:---|:---|
| LI-001 | LN-001 | `src/components/global/session-expired-prompt.tsx` | 17 | `useEffect` 의존성 배열이 빈 배열 `[]` — `window.fetch` 패치를 마운트 시 1회만 실행하는 의도지만 `eslint-disable` 주석 없음 | 의도적 패턴임을 명시: `// eslint-disable-next-line react-hooks/exhaustive-deps` 주석 추가 |
| LI-002 | LN-003 | `src/lib/sheets.ts` | 21 | `auth: client as never` — googleapis `google.auth.OAuth2Client` 타입과 `auth` 매개변수 타입 불일치를 `never`로 강제 캐스팅 | `as Parameters<typeof google.sheets>[0]['auth']` 또는 googleapis 타입 import로 정확한 캐스팅으로 교체 |
| LI-003 | LN-007 | `src/components/ui/toast.tsx` | 전체 | shadcn 자동생성 파일: 따옴표가 double-quote(`"`)로 작성 — 프로젝트 나머지 파일은 single-quote(`'`) 일관 사용 | shadcn 파일은 재생성 기준 유지 허용, 혹은 Prettier 설정에서 shadcn 파일을 예외 처리 |
| LI-004 | LN-007 | `src/components/ui/dialog.tsx` 외 shadcn UI 파일 | 전체 | 위 동일 — shadcn 자동생성 파일 double-quote 패턴 | 동일 |
| LI-005 | LN-008 | `src/app/providers.tsx` | 35 | `ReactQueryDevtools`가 환경 분기 없이 항상 렌더링 — 프로덕션 빌드에 devtools 포함 (번들 크기 증가) | `process.env.NODE_ENV !== 'production'` 조건부 렌더링으로 변경 |

---

## 상세 분석

### LN-001: react-hooks/exhaustive-deps

**검사 파일**: `src/hooks/use-toast.ts`, `src/components/stock/anchor-menu.tsx`, `src/components/global/session-expired-prompt.tsx`

| 파일 | 라인 | 의존성 배열 | 판정 |
|:---|:---:|:---|:---:|
| `use-toast.ts` | 177 | `[state]` | 정상 |
| `anchor-menu.tsx` | 24 | `[]` | 정상 (SECTIONS는 컴포넌트 외부 상수) |
| `session-expired-prompt.tsx` | 17 | `[]` | Warning (의도적이나 주석 미비) |

`session-expired-prompt.tsx`의 `useEffect`는 `window.fetch`를 마운트 시 1회 패치하는 의도적 설계이므로 동작 자체는 올바르다. 다만 ESLint가 경고를 발생시킬 수 있으므로 의도 명시 주석이 필요하다.

### LN-002: 미사용 변수·Import

전체 83개 파일 분석 결과 미사용 변수 및 미사용 import 없음. 모든 import가 파일 내에서 실제로 사용된다.

### LN-003: no-explicit-any

`any` 타입 어노테이션 없음. `src/lib/sheets.ts:21`의 `as never`는 `googleapis` SDK의 타입 시스템 불일치를 우회하는 코드다. 이는 엄밀히 `any`는 아니지만 타입 안전성을 훼손하므로 개선 권고.

```typescript
// 현재 (sheets.ts:21)
return google.sheets({ version: 'v4', auth: client as never })

// 개선 제안
import type { Auth } from 'googleapis'
return google.sheets({ version: 'v4', auth: client as Auth.OAuth2Client })
```

### LN-004: Import 순서 위반

검사 기준: Next.js 내장 → 외부 npm 패키지 → 내부 `@/` 경로 → 상대 경로

전체 파일에서 import 순서가 일관되게 지켜지고 있다. 예시:

```typescript
// stock-detail-client.tsx (정상 패턴)
'use client'
import { useAggregation } from '@/hooks/use-aggregation'   // 내부 hook
import { PriceCard } from './price-card'                    // 상대 경로 (로컬 컴포넌트)
```

### LN-005: 파일명 컨벤션 위반

전체 파일명이 kebab-case를 따르고 있다. Next.js App Router 규칙(`page.tsx`, `layout.tsx`, `route.ts`)도 정상적으로 사용 중.

### LN-006: console.log 잔존

`src/` 전체 파일에서 `console.log`, `console.warn`, `console.error` 등 console 사용 없음. API 레이어에서도 디버그 로그가 제거된 상태.

### LN-007: Prettier 포맷팅 불일치

| 규칙 | 프로젝트 파일 | shadcn UI 파일 |
|:---|:---|:---|
| 따옴표 | single-quote (`'`) | double-quote (`"`) |
| 세미콜론 | 없음 (ASI) | 있음 (`;`) |
| trailing comma | 있음 | 있음 |

`src/components/ui/` 하위 shadcn 자동생성 파일(`toast.tsx`, `dialog.tsx`, `button.tsx` 등)이 double-quote 스타일을 사용한다. 이는 shadcn CLI 기본값으로, 프로젝트 Prettier 설정이 없어 자동 정렬이 되지 않은 상태다.

### LN-008: react-refresh/only-export-components

`src/app/providers.tsx`에서 `ReactQueryDevtools`가 `NODE_ENV` 분기 없이 항상 포함된다.

```typescript
// 현재 (providers.tsx:35)
<ReactQueryDevtools initialIsOpen={false} />

// 개선 제안
{process.env.NODE_ENV !== 'production' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

Next.js는 `process.env.NODE_ENV` 기반으로 프로덕션 빌드 시 dead-code elimination을 수행하므로, 조건부 렌더링을 추가하면 프로덕션 번들에서 devtools 코드가 제거된다.

---

## 권고 사항

### 즉시 적용 권고 (Warning)

1. **LI-005** — `providers.tsx` ReactQueryDevtools 환경 분기 추가
   - 우선순위: Medium
   - 이유: 불필요한 번들 크기 증가 방지

2. **LI-001** — `session-expired-prompt.tsx` useEffect 의도 주석 추가
   - 우선순위: Low
   - 이유: ESLint 경고 방지 및 코드 가독성 향상

3. **LI-002** — `sheets.ts` `as never` 캐스팅 개선
   - 우선순위: Low
   - 이유: 타입 안전성 강화

### 중장기 개선 사항 (Info)

4. **LI-003/LI-004** — shadcn UI 파일 Prettier 정렬
   - Prettier 설정 파일(`.prettierrc`) 추가 후 `npm run format` 일괄 적용
   - shadcn 파일 재생성 시 CLI 옵션으로 single-quote 지정 가능 여부 확인

---

## ESLint 설정 가이드

현재 `.eslintrc.json`이 미설치된 상태로, Next.js 15.5부터는 `eslint.config.mjs` (flat config) 방식이 권장된다.

### 권장 설정: `eslint.config.mjs`

```javascript
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // react-hooks
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // console
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // react-refresh (Next.js에서는 주로 비활성화)
      // 'react-refresh/only-export-components': 'warn',
    },
  },
]

export default eslintConfig
```

### 설치 명령

```bash
npm install --save-dev eslint @eslint/eslintrc eslint-config-next
```

### `.prettierrc` 추가 권고

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

설치:
```bash
npm install --save-dev prettier eslint-config-prettier
```

`package.json` scripts에 추가:
```json
{
  "scripts": {
    "lint": "next lint",
    "format": "prettier --write src/**/*.{ts,tsx}"
  }
}
```
