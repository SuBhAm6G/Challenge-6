# Accessibility Compliance & Inclusive Design (WCAG 2.1 AA)

Saansathi treats accessibility and inclusive design as first-class engineering requirements so urban households on mobile phones, desktop keyboards, and assistive technologies can navigate pollution plans effortlessly.

---

## WCAG 2.1 AA Controls Implemented

1. **Semantic Landmarks & Keyboard Navigation (`src/components/layout/AppShell.tsx`, `AppNavBar.tsx`):**
   - Visible-on-focus **Skip to main content** link (`#main-content`, `tabIndex={-1}` target) verified via keyboard `Tab` focus tests in Playwright Chromium.
   - Proper `<header>` (`banner`), `<nav aria-label="Primary navigation">`, `<nav aria-label="Mobile navigation">`, `<main>`, and `<footer>` (`contentinfo`) landmarks.
   - Consistent `3px` high-contrast `:focus-visible` indicator (`var(--color-brand)`) in `src/index.css` plus `prefers-reduced-motion: reduce` animation suppression.
2. **Accessible Button Names & Touch Target Sizing (`>= 44×44 px`):**
   - Every interactive control across desktop/mobile navigation, header utilities (`Family Context` with `sr-only sm:not-sr-only`, location picker, refresh, demo toggle), modal close buttons (`h-11 w-11`), routine/indoor action buttons, alerts controls, and AI quick prompts satisfies a **minimum `44 px` touch target**.
   - Repeated card buttons (`Mark Done`, `Accept`, `Complete`, `Alternative`, `Dismiss`, `Check off`) carry unique accessible names referencing the card title (`WCAG 2.5.3` Label-in-Name compliant) and explicit `aria-pressed` state attributes.
3. **No Color-Only Status Encoding (`src/data/aqi-standards.ts`):**
   - Every India NAQI category badge pairs high-contrast color styling with explicit text labels (`Good` through `Severe`) and tabular numeric sub-index values.
   - The highlighted `Ask Saansathi` tab combines an amber fill (`bg-amber-300/25` / `bg-amber-300/45`) with dark primary ink (`#1C1917`) and an explicit high-contrast border, passing real Chromium `axe-core` color-contrast checks.
4. **Accessible Data Visualizations & Tables (`HourlyForecastChart.tsx`, `EmissionFactorsTable.tsx`):**
   - The custom zero-dependency hourly NAQI forecast bar chart provides a one-click **`View accessible data table`** toggle (`aria-expanded`) rendering a semantic HTML `<table>` with `<caption className="sr-only">` and `<th scope="col">` headers.
   - `EmissionFactorsTable.tsx` similarly provides `<caption>` and `<th scope="col">` headers across all columns.
5. **Cross-Viewport Live Regions & Screen-Reader Feedback:**
   - Persistence status (`<output aria-live="polite">` in `AppNavBar.tsx`) remains mounted in the accessible DOM across both mobile and desktop viewports (not hidden via `display: none`).
   - Dynamic user feedback (`GeoConsentPanel.tsx` geolocation messages, `CommunityScreen.tsx` clipboard copy confirmation, `ChoicesScreen.tsx` impact log confirmation, `AssistantScreen.tsx` `aria-busy` loading notice, and `StatusBanner.tsx` connectivity/storage/AI fallback notices) uses semantic `<output aria-live="polite">` regions.
   - External links (`target="_blank"`) include `<span className="sr-only"> (opens in new tab)</span>`.
6. **Accessible Modals & Form Controls (`Primitives.tsx`, `AlertsCard.tsx`):**
   - Modals use Radix Dialog primitives (`@radix-ui/react-dialog`) for focus trapping, `Escape` dismissal, and `aria-labelledby`/`aria-describedby` wiring, with an explicit **`Continue with Current`** button on `LocationModal`.
   - `AlertsCard.tsx` pairs `<label htmlFor="alert-threshold-select">` directly with its `<select>` (eliminating label-in-name mismatches).

---

## Dual Automated Verification Proof

- **Unit/Component `axe-core` Audit (`tests/unit/ui/accessibility.test.tsx`):** Runs `axe.run()` across **all 7 application routes** plus open **`LocationModal`** and **`HouseholdModal`** dialogs with **zero violations at any severity level** (`critical`, `serious`, `moderate`, `minor`).
- **Real-Browser Chromium Contrast Audit (`tests/e2e/saansathi.spec.ts`):** Injects `axe-core` into headless Chromium against rendered Tailwind v4 styles (with CSS `color-contrast` enabled) across Home and Ask Saansathi views, passing with **zero violations**.
