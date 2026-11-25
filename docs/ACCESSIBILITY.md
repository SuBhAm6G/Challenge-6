# Accessibility Approach

Saansathi treats inclusive design as a core requirement:

- **Semantic Landmarks & Navigation:** Skip-to-main-content link, `<header>`, `<nav>`, `<main>`, `<footer>`, and `<output>` live status banners (`src/components/layout/AppShell.tsx`).
- **No Color-Only Status Encoding:** Every India NAQI category badge pairs high-contrast color combinations with explicit text category names and numeric sub-index values (`src/data/aqi-standards.ts`).
- **Accessible Charts:** `src/components/dashboard/HourlyForecastChart.tsx` includes a one-click toggle to an accessible HTML `<table>` with `<caption>` and column headers.
- **Accessible Modals & Controls:** Built with Radix Dialog (`src/components/ui/Primitives.tsx`), visible `focus-visible` outlines, >= 40–44px touch targets, and `prefers-reduced-motion` support in `src/index.css`.
- **Automated Checks:** `tests/unit/ui/accessibility.test.tsx` runs `axe-core` against the rendered application shell in jsdom. Note: automated checks do not replace manual screen-reader or full-browser contrast audits.
