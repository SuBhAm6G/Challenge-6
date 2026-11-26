# Offline-First Support, IndexedDB Persistence & Fault Containment

Saansathi is engineered to remain genuinely useful during intermittent mobile connectivity, commuter dead zones, and AI backend outages—without ever falling back silently to synthetic numbers.

---

## 1. Multi-Layer Offline Architecture

| Layer                             | Technology & Module                                         | Offline Capability & Failure Handling                                                                                                                    |
| :-------------------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PWA Precaching**                | `vite-plugin-pwa` / Workbox (`vite.config.ts`)              | Precaches all 20 app-shell bundles (HTML, CSS, JS chunks, `favicon.svg`, `manifest.webmanifest`); excludes `/api/*` from navigation fallback             |
| **Runtime AQ Cache**              | Workbox `NetworkFirst` + `src/storage/aq-cache.ts`          | Caches Open-Meteo JSON for 1h in Workbox and persists Zod-validated readings/forecasts per location key inside IndexedDB (`aqCache`)                     |
| **Local State Persistence**       | `idb` + Zod (`src/storage/db.ts`, `repositories.ts`)        | Persists household profiles, indoor setups, alert preferences, routine actions, impact history, and community plans in `saansathi-local-db` (`appState`) |
| **Timestamp & Freshness Honesty** | `src/engines/freshness.ts`                                  | Preserves original observation timestamps when offline and classifies readings as `Delayed`, `Last Known`, or `Stale`                                    |
| **Pure Deterministic Core**       | `src/engines/*` (10 modules, `< 180` lines each)            | Runs 100% locally in pure TypeScript with zero network or LLM dependencies                                                                               |
| **Lazy Chunk Fault Containment**  | `src/components/ui/ErrorBoundary.tsx` in `src/App.tsx`      | Catches lazy-route load or runtime errors and provides one-click recovery back to the Home dashboard                                                     |
| **AI Assistant Offline Fallback** | `buildDeterministicFallbackResponse()` (`src/ai/client.ts`) | Automatically activates verified local household recommendations when offline, rate-limited, or missing `GROQ_API_KEY`                                   |

---

## 2. Explicit Data-Provenance State Machine

1. **Online Live Fetch Ready:** `OpenMeteoAirQualityProvider` fetches fresh forecast JSON, validates via `OpenMeteoResponseSchema`, updates `aqSlice`, and writes `aqCache`.
2. **Offline / Upstream Failure with Cache:** `aqSlice.ts` detects provider timeout/`network`/`rate_limit`, loads last Zod-validated `aqCache` entry for the active location, preserves its original timestamp, and surfaces `aqErrorMessage` in `StatusBanner.tsx`.
3. **Offline with Empty Cache:** Displays explicit `Data unavailable` (`value: null`) alongside deterministic guidance for unverified air conditions (`buildMorningRecommendation` unavailable branch) — **never substitutes fake readings**.
4. **Opt-In Sample Demo Mode:** Synthetic Delhi winter-smog data (`src/providers/sample-data.ts`) is reachable **only** via the explicit **Load Sample Demo** button and triggers a high-visibility amber `SAMPLE DEMO DATA ACTIVE` banner.

---

## 3. Corrupted Storage Quarantine & Error Surface

- All IndexedDB reads (`readValidatedRecord`, `readCachedAirQuality`) validate stored envelopes and payloads via `Zod.safeParse()`. Corrupted entries return `errorCode: 'corrupted'` instead of crashing hydration.
- Quota errors (`QuotaExceededError`) and failed location/profile writes surface immediately through `storageWarning` in `StatusBanner.tsx`.
