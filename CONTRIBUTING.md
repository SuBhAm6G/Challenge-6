# Contributing to Saansathi

Thank you for contributing to **Saansathi**—a local-first, privacy-preserving urban air-quality planning Progressive Web App (PWA) engineered for Indian households and communities.

---

## 1. Local Development Setup

### Prerequisites

- **Node.js `>= 20.0.0`** (verified in CI on Node 22 LTS)
- **npm** (clean standard lockfile install—zero `--legacy-peer-deps` required)

### Installation & Local Run

```bash
# 1. Clone and install dependencies cleanly
npm install

# 2. Configure optional server-side Groq AI credentials
cp .env.example .env.local
# Edit .env.local:
#   GROQ_API_KEY=your_groq_api_key_here
#   GROQ_MODEL=openai/gpt-oss-120b

# 3. Start Vite dev server (mounts local /api/chat middleware automatically)
npm run dev

# 4. Install Playwright Chromium (only required for first-time E2E execution)
npx playwright install chromium
```

> **Note:** Saansathi runs **100% deterministically without `GROQ_API_KEY` or internet connectivity**. When no key is configured, `Ask Saansathi` seamlessly serves `buildDeterministicFallbackResponse()` grounded in local CPCB NAQI rules.

---

## 2. Architectural Invariants & Code Standards

Every pull request must preserve the following engineering guarantees (enforced automatically by `npm run check` and `tests/quality/hygiene.test.ts`):

1. **Functional Core / Imperative Shell:**
   - Pure environmental engines (`src/engines/*`) must remain side-effect-free (`f(inputs) -> outputs`) with zero React imports, browser globals, or network calls.
   - Keep IndexedDB persistence (`src/storage/db.ts`, `src/storage/aq-cache.ts`, `src/storage/repositories.ts`) cleanly decoupled from domain engines.
2. **Strict TypeScript Across `src/`, `api/`, and `tests/`:**
   - Enforced via `tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.test.json` (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
   - **Zero `any`**, **zero `@ts-ignore` / `@ts-nocheck`**, **zero `eslint-disable` / `oxlint-disable`**, and **zero unvalidated `<select>` type casts** (use `parseEnumValue` from `src/domain/select-guards.ts`).
3. **Strict Modularity (`<= 200` Lines Ceiling):**
   - Every `.ts` and `.tsx` file in `src/` and `api/` is programmatically verified to stay **at or below 200 lines** (`tests/quality/hygiene.test.ts`), with deterministic engines kept concise (`< 180` lines) and static registries separated (`src/data/`).
4. **Zero Client Console Noise:**
   - Browser source modules (`src/`) must contain zero `console.log`, `console.warn`, or `console.error` calls.
5. **Scientific Honesty & Guardrails:**
   - Always calculate **CPCB India NAQI** locally (`src/engines/aqi-interpreter.ts`)—never silently substitute US EPA or European AQI numbers.
   - Preserve `null` for missing pollutants or unreliable tailpipe PM2.5/NOx emission factors (`src/data/emission-factors.ts`)—never invent or coerce missing metrics to `0`.
   - Maintain strict separation between **Personal Exposure Management** and **Illustrative Avoided Emissions**, and keep hard bans on ozone generators and gas-stove room sealing.
6. **Inclusive Design & WCAG 2.1 AA Compliance:**
   - Use Tailwind v4 `@theme` semantic design tokens (`src/index.css`), `>= 44×44 px` touch targets, `scope="col"` + `<caption>` tables, `aria-pressed` stateful toggles, cross-viewport `<output aria-live="polite">` live regions, and zero `axe-core` violations.

---

## 3. Verification Gate Before Opening a PR

Run the complete local verification pipeline—all gates run identically in `.github/workflows/ci.yml`:

```bash
npm run typecheck      # Strict tsc -b --noEmit across src/, api/, and tests/
npm run lint           # Oxlint across 105+ TypeScript/TSX files (0 warnings, 0 errors)
npm run format:check   # Prettier + Tailwind CSS class sorting check
npm run coverage       # 147 Vitest tests + V8 coverage thresholds (src/ + api/)
npm run build          # Production tsc -b + Vite + Workbox PWA bundle
npm run e2e            # 4 Playwright Chromium E2E + real-browser axe-core contrast audits
```
