# Testing Strategy & Verification Report

## Verification Architecture Overview

Saansathi pairs strict static analysis with four automated testing layers covering deterministic math, external schemas, IndexedDB persistence, Zustand concurrency, serverless Groq AI endpoints, UI workflows, and real-browser accessibility.

| Verification Gate               | Tooling & Scope                                                                                                         | Result                                                         |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **Type Safety**                 | `tsc -b --noEmit` (`tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`) across `src/`, `api/`, and `tests/` | **0 errors**                                                   |
| **Static Linting**              | `oxlint` (`react`, `typescript`, `oxc`, `jsx-a11y`) across **105 files** (zero test exclusions)                         | **0 warnings, 0 errors**                                       |
| **Code Formatting**             | `prettier --check .` + `prettier-plugin-tailwindcss`                                                                    | **100% compliant**                                             |
| **Unit, Integration & Hygiene** | **147 Vitest tests across 20 test files** (`jsdom` + `fake-indexeddb`)                                                  | **147 / 147 passing**                                          |
| **Coverage Enforcement**        | `@vitest/coverage-v8` across `src/` **and** `api/` with enforced CI thresholds (`90/82/88/90`)                          | **93.38% stmts · 82.87% branch · 93.47% funcs · 95.46% lines** |
| **Browser E2E & Real Contrast** | **4 Playwright Chromium workflows** + injected `axe-core` CSS `color-contrast` verification                             | **4 / 4 passing**                                              |

---

## Automated Test Suite Breakdown (`147` Vitest Tests)

1. **Deterministic Engine Unit Tests (`tests/unit/engines/` — 58 tests):**
   - `aqi-interpreter.test.ts` (13 tests): CPCB India NAQI breakpoints across PM2.5, PM10, NO₂, SO₂, CO, and O₃; CO `µg/m³ -> mg/m³` conversion; minimum 3-pollutant coverage check; averaging-period mismatch disclosure; extreme `> 500` scaling; explicit rejection of foreign-scale substitution.
   - `activity-window.test.ts` (8 tests): Daytime 06:00–21:00 window filtering, ascending average NAQI ranking, elevated `> 200` caveats, null skipping, 12h formatting.
   - `routine-engine.test.ts` (9 tests): Morning indoor swap, priority-protection tightening at Moderate AQI, `outdoor_work` PPE caveats, hybrid/remote vs. metro vs. carpool shifts, Severe-AQI cycling exclusion, unavailable-reading safety.
   - `indoor-engine.test.ts` (10 tests): Gas/biomass combustion ventilation interlock vs. induction kitchens, ozone generator exclusion, CADR room-area math, budget filtering, door-sealing rules.
   - `impact-engine.test.ts` (9 tests): Documented Indian transport emission factors, null tailpipe PM2.5/NOₓ preservation, zero/invalid trip fallback, Severe-AQI cycling exposure warnings.
   - `alert-and-freshness.test.ts` (11 tests): All freshness categories, category worsening alerts, forecast spikes, 14-day purifier maintenance checks, `dedupKey` uniqueness.
2. **Domain Schemas & Data Registries (`tests/unit/domain/`, `tests/unit/data/` — 14 tests):**
   - `schemas.test.ts` (9 tests): Positive and negative boundary validation across all 7 domain schemas and AI contracts.
   - `registries.test.ts` (5 tests): Monotonic CPCB breakpoint consistency, India coordinate bounds for all 15 cities, emission factor completeness, HTTPS source URLs.
3. **Providers, IndexedDB & Zustand Store (`tests/unit/providers/`, `tests/unit/storage/`, `tests/unit/store/` — 17 tests):**
   - `open-meteo.test.ts` (4 tests): Valid response mapping, CO conversion, invalid coordinate rejection, `429`/5xx/malformed JSON/schema failure/timeout/caller `AbortSignal` handling, sample scenario checks.
   - `indexeddb.test.ts` (6 tests): Full IndexedDB round-trips, corrupted record quarantine, invalid write rejection, complete reset.
   - `app-store.test.ts` (7 tests): Hydration, demo toggle, location CRUD + last-preset guard, storage write failure propagation, `saansathi_location_prompted` reset cleanup, single-flight `activeAqRequestId` race-condition protection, offline cache fallback.
4. **AI Privacy, Safety Sanitization & `/api/chat` Endpoint (`tests/unit/ai/` — 17 tests):**
   - `ai-safety-and-context.test.ts` (7 tests): Locality/coordinate/household stripping, urgent symptom medical redirects, prohibited ozone/medication/kitchen-sealing/cycling filtering, caller `AbortSignal`, deterministic offline fallback.
   - `server-endpoint.test.ts` (10 tests): `stripJsonFences`, `normalizeLlmJson` edge cases, `405` method guard, `413` 8 KB cap, `400` JSON/Zod errors, `503` missing key resilience, mocked Groq `200 OK`, multi-model fallback cascade (`503 -> 200`), `502` malformed LLM output, upstream `429 AI_RATE_LIMIT`, and 20-req/min IP `429 RATE_LIMITED`.
5. **UI Screens, Modals, Primitives, Onboarding & Accessibility (`tests/unit/ui/` — 33 tests):**
   - `screens.test.tsx` (19 tests): Interactive controls across all 7 routes, mocked `groq_ai` completion + safety warnings, clipboard summary export, debounced community name persistence, `aria-pressed` toggles.
   - `modals.test.tsx` (5 tests): City/place presets, `Continue with Current`, browser geolocation grant (`0.01°` rounding)/denial/unavailable/error paths, stale-draft refresh on profile prop update.
   - `primitives.test.tsx` (4 tests): Accessible buttons, badges, Radix modal close, `StatusBanner` storage/provider/AI fallback notices, and `ErrorBoundary` route crash recovery.
   - `app-shell.test.tsx` (2 tests): First-launch `LocationModal` localStorage gate, `online`/`offline` listeners, header controls, and all 7 lazy routes.
   - `accessibility.test.tsx` (3 tests): All 7 screens + both modals audited with `axe-core` for **zero violations at any severity level**, plus semantic landmarks, `scope="col"`, `<caption>`, and unique toggle names.
6. **End-to-End Integration & Automated Hygiene (`tests/integration/`, `tests/quality/` — 6 tests):**
   - `end-to-end-pipeline.test.ts` (1 test): Full dataflow from raw Open-Meteo JSON through NAQI, engines, minimal AI context, and IndexedDB.
   - `hygiene.test.ts` (5 tests): Mandatory docs/manifests, `.gitignore` `.env.example` check, `package.json` scripts & `node >= 20`, zero `any`/`@ts-ignore`/lint-disable/client `console.*`, **strict `<= 200`-line limit** across all `src/` and `api/` files, zero Gemini leftovers, and no leaked API keys.

---

## Playwright Chromium E2E Workflows (`tests/e2e/saansathi.spec.ts` — 4 Workflows)

1. **Onboarding & Offline Persistence:** First-launch location popup, Sample Demo toggle, custom locality addition, Household profile persistence, offline reload recovery, and reconnection refresh.
2. **Core Household & Community Workflows:** Chart-to-table toggle, Routine completion, Indoor toolkit checklist, Severe-smog cycling trade-off alert, Choices -> Impact logging, and Community checklist additions.
3. **Mobile Navigation, Live AI, Urgent Redirect & Offline Fallback:** `390×844` mobile bottom navigation, mocked `/api/chat` `200 OK` response, urgent symptom `112 / 108` redirect, and unrouted offline deterministic fallback.
4. **Real-Browser `axe-core` Contrast & Keyboard Navigation:** Tab-to-Skip-Link focus test plus live Chromium `axe-core` WCAG 2.1 AA + CSS `color-contrast` verification on Home and the amber-highlighted Ask Saansathi route (**0 violations**).

---

## Verification Commands

```bash
npm run typecheck      # Strict TypeScript check across src/, api/, and tests/
npm run lint           # Oxlint across all 105 TS/TSX files
npm run format:check   # Prettier code style & Tailwind sorting verification
npm run test           # 147 Vitest unit, integration, accessibility & hygiene tests
npm run coverage       # V8 coverage report with enforced thresholds (src/ + api/)
npm run build          # Production tsc -b + Vite + Workbox PWA build
npm run e2e            # Build preview & run all 4 Playwright Chromium E2E workflows
npm run check          # Full CI gate: typecheck && lint && format:check && test && build
```
