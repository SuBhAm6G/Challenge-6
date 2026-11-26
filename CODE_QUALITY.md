# Code Quality Proof — Saansathi

Saansathi enforces strict modularity, type safety, static linting, clean error handling, and automated repository hygiene across **100% of client (`src/`), serverless (`api/`), and verification (`tests/`) codebases**.

---

## 1. Compiler, Lint & Formatting Invariants

| Quality Control                         | Configuration File                                              | Enforced Guarantees                                                                                                                                 | Observed Result                                  |
| :-------------------------------------- | :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| **Strict TypeScript**                   | `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json` | `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`     | **0 errors** across `src/`, `api/`, and `tests/` |
| **Zero Type Escapes**                   | `tests/quality/hygiene.test.ts`, `src/domain/select-guards.ts`  | Zero `: any`, zero `as any`, zero `<any>`, zero `@ts-ignore`/`@ts-nocheck`; all `<select>` handlers parsed cleanly via Zod `parseEnumValue()`       | **100% compliant**                               |
| **Oxlint + `jsx-a11y`**                 | `.oxlintrc.json`                                                | Scans **105 TS/TSX files** (`src/`, `api/`, and `tests/`) enforcing React hook rules, `no-explicit-any`, semantic JSX rules, and zero `console.log` | **0 warnings, 0 errors**                         |
| **Automated Formatting**                | `.prettierrc`, `.editorconfig`                                  | Consistent 2-space indentation, LF line endings, and sorted Tailwind CSS v4 utility ordering via `prettier-plugin-tailwindcss`                      | **100% compliant**                               |
| **Strict Module Size (`<= 200` Lines)** | `tests/quality/hygiene.test.ts`                                 | Programmatically asserts every `.ts`/`.tsx` file in `src/` and `api/` is `<= 200` lines (and all 10 engines `< 180` lines)                          | **0 violations**                                 |

---

## 2. Clean Architecture & Bug-Prevention Patterns

1. **Functional Core / Imperative Shell (`docs/ARCHITECTURE.md`):**
   - Pure environmental engines (`src/engines/*`) are completely isolated from React components, browser APIs, and IndexedDB persistence (`src/storage/db.ts`, `aq-cache.ts`, `repositories.ts`).
2. **Modular Zustand Store Slices + `useShallow` Selectors:**
   - `src/store/useAppStore.ts` composes `aqSlice.ts` and `planningSlice.ts` with atomic `useShallow` selectors across `App.tsx` and all 7 routes, eliminating monolithic mega-hooks and unnecessary re-renders.
   - `upsertLocationPreset` and `deleteLocationPreset` inspect both persistence results and surface `storageWarning` on failures; `resetAllLocalData()` clears local IndexedDB stores and onboarding `localStorage` flags cleanly.
3. **Single-Source Contracts (Zero Schema Duplication):**
   - `src/ai/schemas.ts` and `src/data/evidence-ids.ts` are imported directly by both client safety layers and serverless `api/_guardrails.ts`.
4. **React Fault Containment & Stale-State Prevention:**
   - `src/components/ui/ErrorBoundary.tsx` wraps all lazy-loaded routes inside `<Suspense>` to prevent chunk-load white screens.
   - `HouseholdModal.tsx` uses a keyed inner form (`HouseholdFormFields.tsx`, `HouseholdScheduleSelects.tsx`) so newly hydrated or reset profiles never display stale form drafts.
5. **Centralized Tailwind v4 `@theme` Palette (`src/index.css`):**
   - Design tokens (`--color-canvas`, `--color-surface`, `--color-brand`, `--color-ink`, `--color-amber-ink`, etc.) unify styling cleanly across components.
6. **Clean Dependency Hygiene (`package.json`):**
   - Production `dependencies` contain strictly runtime libraries (`react`, `react-dom`, `zustand`, `zod`, `idb`, `@radix-ui/react-dialog`, `lucide-react`); build/test tools live strictly in `devDependencies` with zero unused packages and zero `--legacy-peer-deps` workarounds.

> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/TESTING.md](docs/TESTING.md) for full module breakdowns and verification logs.
