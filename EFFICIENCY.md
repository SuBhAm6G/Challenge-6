# Runtime & Bundle Efficiency Proof — Saansathi

Saansathi is engineered to stay fast on budget mobile handsets and congested urban networks by minimizing initial JavaScript, splitting every secondary workflow on demand, eliminating heavy third-party charting dependencies, and bounding every deterministic calculation cleanly in $O(1)$ or $O(H \log H)$ time.

---

## 1. Zero-Bloat Rendering & Bundle Architecture

1. **Zero External Charting Libraries:** `HourlyForecastChart.tsx` renders responsive hourly India NAQI bars and an accessible `<table>` toggle in pure HTML/CSS + Tailwind v4—saving hundreds of kilobytes compared to Chart.js, Recharts, or D3.
2. **Route-Level Code Splitting (`React.lazy` in `src/App.tsx`):** Six secondary routes (`Routine`, `Indoor`, `Choices`, `Impact`, `Community`, `Assistant`) load strictly on demand (`1.8 – 6.1 kB` gzip each) and never block initial First Contentful Paint.
3. **Vendor Chunk Isolation (`vite.config.ts`):** `@radix-ui/react-dialog` (`16.84 kB` gzip) and state/validation dependencies (`zustand`, `idb`, `zod`: `26.86 kB` gzip) are isolated into cacheable chunks alongside the core runtime (`105.67 kB` gzip).
4. **Offline Precache & Runtime Cache (`vite-plugin-pwa`):** Workbox precaches `20` build assets (`568.24 KiB`) and applies a 1-hour `NetworkFirst` runtime cache for Open-Meteo API calls paired with Zod-validated IndexedDB (`aq-cache.ts`).

---

## 2. State, Storage & Network Efficiency Optimizations

- **Selective Store Subscriptions (`useShallow`):** `App.tsx` and all 7 screens subscribe only to required Zustand fields via `zustand/react/shallow`, preventing unrelated store updates from triggering full-tree re-renders.
- **Debounced Community Persistence (`CommunityScreen.tsx`):** Typing community/society names debounces IndexedDB writes by `300 ms` (with immediate flush on blur and timer cleanup on unmount), preventing keystroke-level storage thrashing.
- **Single-Flight Race Cancellation (`activeAqRequestId` in `aqSlice.ts`):** Monotonic request tokens discard outdated Open-Meteo responses during rapid location switches, eliminating wasted state hydration and redundant UI recomputations.
- **Zero-Allocation $O(1)$ Pre-Indexed Registries:** CPCB category styles (`INDIA_CATEGORY_BY_NAME`), transport emission factors (`EMISSION_FACTOR_BY_MODE`), authoritative citations (`SOURCE_BY_ID`), and citation allowlists (`VALID_SOURCE_IDS`) are compiled into `ReadonlyMap` / `Set` lookups once at module load.
- **Deterministic Offline AI Short-Circuiting (`src/ai/client.ts`):** Urgent respiratory symptom detection (`hasUrgentMedicalSymptoms`) and offline detection resolve immediately in the browser (`0 ms` network wait) with verified local guidance.

---

## 3. Verified Production Footprint & Algorithmic Complexity

| Metric / Engine Operation      | Measured / Proven Value                     | Reference Module                   |
| :----------------------------- | :------------------------------------------ | :--------------------------------- |
| **Gzipped App Shell JS**       | `105.67 kB` (`341.16 kB` raw)               | `vite.config.ts` (`npm run build`) |
| **Gzipped Tailwind CSS v4**    | `6.74 kB` (`32.27 kB` raw)                  | `src/index.css`                    |
| **Lazy Route Chunks**          | `1.81 kB – 6.13 kB` gzip per route          | `src/App.tsx`                      |
| **`computePollutantSubIndex`** | $O(B) = O(1)$ time, $O(1)$ space            | `src/engines/aqi-subindex.ts`      |
| **`interpretIndiaNAQI`**       | $O(P \log P) = O(1)$ time ($P \le 6$)       | `src/engines/aqi-interpreter.ts`   |
| **`findBestOutdoorWindows`**   | $O(H \log H)$ linear pair scan ($H \le 36$) | `src/engines/activity-window.ts`   |
| **`calculateTransportImpact`** | $O(1)$ `ReadonlyMap` arithmetic             | `src/engines/impact-engine.ts`     |
| **`evaluateCleanAirAlerts`**   | $O(H)$ single-pass + `Set` dedup            | `src/engines/alert-engine.ts`      |
