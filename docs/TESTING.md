# Testing Strategy & Verification Report

## Automated Test Layers

Saansathi ships **130 Vitest tests across 19 test files** plus **3 Playwright Chromium end-to-end workflows** and an automated repository hygiene suite.

1. **Deterministic Engine Unit Tests (`tests/unit/engines/` — 61 tests):**
   - `aqi-interpreter.test.ts` (13 tests): CPCB India NAQI breakpoints across PM2.5, PM10, NO₂, SO₂, CO, and O₃; CO `µg/m³` → `mg/m³` conversion; minimum 3-pollutant coverage rule; averaging-period mismatch disclosure; extreme >500 handling; non-substitution of foreign scales.
   - `activity-window.test.ts` (8 tests): Daytime 06:00–19:00 window filtering, ascending average NAQI ranking, elevated >200 caveats, null interpolation skipping, 12h formatting.
   - `routine-engine.test.ts` (9 tests): Morning swap, vulnerability-flag sensitivity tightening, `outdoor_work` PPE caveats, hybrid remote vs. short carpool vs. metro recommendations, Severe-AQI cycling exclusion, unavailable data handling.
   - `indoor-engine.test.ts` (10 tests): Gas/biomass combustion warnings vs. induction kitchens, ozone generator exclusion, CADR room-area sizing math, budget gating, door sealing thresholds.
   - `impact-engine.test.ts` (9 tests): Documented Indian transport factors, null tailpipe PM2.5/NOₓ preservation, zero/invalid trip qualitative fallback, Severe-AQI cycling conflict warnings.
   - `alert-and-freshness.test.ts` (11 tests): All freshness categories across observed/forecast/sample readings; threshold transition alerts, forecast spikes, purifier 14-day checks, and `dedupKey` uniqueness.
2. **Domain Schemas & Data Registry Integrity (`tests/unit/domain/`, `tests/unit/data/` — 14 tests):**
   - `schemas.test.ts` (9 tests): Positive and negative boundary validation across all 7 domain schemas plus AI schemas.
   - `registries.test.ts` (5 tests): Monotonic CPCB breakpoint consistency, India coordinate bounds for all 15 cities, emission factor completeness, HTTPS source URL checks.
3. **Providers, Storage & Modular Zustand Store (`tests/unit/providers/`, `tests/unit/storage/`, `tests/unit/store/` — 15 tests):**
   - `open-meteo.test.ts` (4 tests): Valid mapping, null omission, coordinate rejection, rate limits, timeouts, malformed JSON, and sample scenario validation.
   - `indexeddb.test.ts` (6 tests): Full IndexedDB round-trips, corrupted record quarantine, invalid write rejection, complete wipe.
   - `app-store.test.ts` (5 tests): Hydration, demo toggle, location CRUD (with last-location delete guard), offline IndexedDB cache fallback, full local reset.
4. **AI Privacy, Safety Guardrails & Server API (`tests/unit/ai/` — 12 tests):**
   - `ai-safety-and-context.test.ts` (7 tests): Locality/coordinate/household stripping, urgent symptom medical redirects, ozone/medication/kitchen-sealing/cycling filtering, deterministic fallback across HTTP/schema/network errors.
   - `server-endpoint.test.ts` (5 tests): Method enforcement (405), 8 KB size cap (413), JSON/Zod validation (400), missing API key resilience (503).
5. **UI Screens, Modals, Primitives & Accessibility (`tests/unit/ui/` — 20 tests):**
   - `screens.test.tsx` (15 tests): Renders and exercises interactive controls across all 7 screens plus SVG-to-table chart toggle.
   - `modals.test.tsx` (4 tests): Location preset addition/selection/deletion, geolocation consent disclosure, household updates, local reset.
   - `primitives.test.tsx` (3 tests): Accessible buttons, badges, Radix modal close flow, conditional `StatusBanner`.
   - `accessibility.test.tsx` (1 test): Semantic landmark roles (`banner`, `main`, `contentinfo`), skip link, and `axe-core` critical/serious violation scan.
6. **End-to-End Integration Pipeline (`tests/integration/end-to-end-pipeline.test.ts` — 1 test):**
   - Exercises the complete flow from raw Open-Meteo JSON → CPCB NAQI → freshness → routine → indoor → impact → alerts → minimal AI context → IndexedDB persistence.
7. **Automated Repository Hygiene (`tests/quality/hygiene.test.ts` — 5 tests):**
   - Verifies required manifests/docs, `.gitignore` rules, `package.json` scripts & `node >= 20`, zero `any`/`@ts-ignore`/`eslint-disable`, zero client `console.*`, `<= 250` lines per source module, and no leaked API keys.
8. **Playwright E2E Workflows (`tests/e2e/saansathi.spec.ts` — 3 browser flows):**
   - Full workflow across demo toggle, location/household persistence, routine/indoor/impact/community mutations, offline fallback + reload persistence, SVG/table toggle, cycling warning, mobile viewport nav, and keyboard skip-link focus.

## Coverage Summary (Vitest V8)

- **All `src/` files:** `86.68%` statements, `88.93%` lines
- **`src/engines/`:** `93.72%` statements, `96.24%` lines, `100%` functions
- **`src/ai/`:** `93.65%` statements, `98.30%` lines
- **`src/providers/`:** `94.79%` statements, `97.80%` lines
- **`src/data/`, `src/domain/`, `src/components/ui/`:** `100%` coverage

## Commands

- `npm run test` — Run all 130 Vitest unit, integration, UI, and hygiene tests.
- `npm run coverage` — Run Vitest with V8 coverage output.
- `npm run e2e` — Build preview bundle and run all 3 Playwright browser tests.
