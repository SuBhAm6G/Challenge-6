# Offline-First Support & Resilience

## What Works Offline

Once the application shell has been loaded and cached by the Workbox service worker (`vite-plugin-pwa` in `vite.config.ts`):

- **App Shell:** Reopens offline from precached HTML/JS/CSS/SVG assets.
- **Household & Indoor Profiles:** Fully editable and saved in IndexedDB (`saansathi-local-db`).
- **Cached Readings:** Previously fetched Open-Meteo readings and forecasts remain visible with their original timestamps and explicit `Delayed` / `Last Known` / `Stale` freshness labels (`src/engines/freshness.ts`).
- **Deterministic Engines:** Daily routine generation, indoor checklists, ventilation guidance, choice impact math, and community planning work 100% offline.
- **Assistant Fallback:** `Ask Saansathi` detects offline/unavailable AI state and presents deterministic local recommendations rather than failing or fabricating responses.

## Honest Limitations

- First-time visitors who have never loaded the app online cannot cache the PWA shell.
- Live air-quality updates and Groq AI natural-language synthesis require network access.
- When no cached reading exists for a newly selected city while offline, Saansathi displays `Data unavailable` rather than substituting hardcoded numbers.
