# Deployment & CI/CD Guide (Vercel + GitHub Actions)

## 1. Prerequisites

- **Node.js `>= 20.0.0`** (`engines.node` enforced in `package.json` and `tests/quality/hygiene.test.ts`; CI runs Node `22`)
- **Groq API Key (`GROQ_API_KEY`)** for live server-side natural-language synthesis on `/api/chat` _(optional—all deterministic planning works without a key)_

---

## 2. Vercel Production Deployment

1. Import the repository into Vercel using Framework Preset: **Vite**.
2. Build configuration:
   - **Install Command:** `npm ci` (clean dependency resolution with zero `--legacy-peer-deps` flags)
   - **Build Command:** `npm run build` (`tsc -b && vite build`)
   - **Output Directory:** `dist`
3. Configure **Server-Side Environment Variables** in Vercel Project Settings (Production & Preview):
   - `GROQ_API_KEY` — your Groq API key (never prefixed with `VITE_`; kept strictly server-side)
   - `GROQ_MODEL` — `openai/gpt-oss-120b` _(automatically falls back to `openai/gpt-oss-20b` and `qwen/qwen3.8-27b` on `503`/`429`/`404`)_
4. **Routing & Security Headers (`vercel.json`):**
   - Rewrites SPA routes to `/index.html` while explicitly excluding `/api/*`, `/assets/*`, `/manifest.webmanifest`, `/sw.js`, `/workbox-*`, and `/favicon.svg`.
   - Applies `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 3. Automated GitHub Actions Pipeline (`.github/workflows/ci.yml`)

Every push and pull request targeting `main` runs two sequential CI jobs:

1. **`quality` job:**
   - `npm ci`
   - `npm run typecheck` (`tsc -b --noEmit` across `src/`, `api/`, and `tests/`)
   - `npm run lint` (`oxlint` across 105+ files)
   - `npm run format:check` (`prettier --check .`)
   - `npm run coverage` (147 Vitest tests + V8 coverage thresholds across `src/` and `api/`)
   - `npm run build` (Production TypeScript + Vite + Workbox PWA build)
2. **`e2e` job (depends on `quality`):**
   - Installs Chromium (`npx playwright install --with-deps chromium`)
   - Runs `npm run e2e` (4 Playwright workflows including real-browser `axe-core` contrast audits)
