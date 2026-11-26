# Security & Privacy Governance

Saansathi enforces privacy-by-design and defense-in-depth across client persistence, location handling, and server-side GenAI synthesis.

---

## Controls Implemented

1. **Server-Side Secret Isolation (`GROQ_API_KEY`):**
   - `GROQ_API_KEY` is accessed exclusively on the server inside `api/chat.ts` (Vercel serverless function and local Vite dev/preview middleware in `vite.config.ts`).
   - Client bundles never receive or embed API secrets. `.gitignore` ignores `.env`, `.env.local`, and `.env.*.local` while explicitly preserving `.env.example`.
2. **Strict Input/Output Validation Gates (`src/ai/schemas.ts`, `api/_guardrails.ts`, `src/ai/client.ts`):**
   - Both client and server validate `/api/chat` requests (`<= 8 KB` body cap, 2–800 char question bounds) and structured Groq JSON responses through a shared Zod contract (`RequestSchema`, `ResponseSchema`).
   - `normalizeLlmJson()` sanitizes minor shape drift before strict `ResponseSchema.safeParse()`.
3. **Rate Limiting & Prompt-Injection Defense (`api/chat.ts`, `api/_guardrails.ts`):**
   - `api/chat.ts` enforces HTTP `POST` (`405`), `MAX_BODY_BYTES = 8192` (`413`), and an IP-keyed sliding-window limiter (`20 requests / 60s` -> `429 RATE_LIMITED`).
   - Untrusted context JSON and user questions are isolated inside delimited `CONTEXT_JSON` / `HOUSEHOLD_QUESTION` sections beneath immutable `SYSTEM_INSTRUCTION` guardrails.
4. **Medical & Environmental Safety Guardrails (`src/ai/safety.ts`):**
   - Urgent respiratory symptoms (`chest pain`, `cannot breathe`, `severe breathlessness`, `blue lips`, `wheezing badly`, `fainting`) trigger an immediate local medical redirect (`112 / 108`) without calling Groq.
   - `sanitizeAiResponse()` removes ozone-generator suggestions, medication edits, gas-stove room sealing, unverified citywide AQI drop claims, invented URLs (`VALID_SOURCE_IDS` allowlist), and active outdoor cycling suggestions during `> 250` NAQI episodes.
5. **Location & Household Privacy Minimization (`src/ai/context-builder.ts`, `LocationModal.tsx`):**
   - Browser geolocation requires explicit consent (`GeoConsentPanel.tsx`) and rounds coordinates locally to `0.01°` (~1 km grid).
   - Household names, street localities, lat/lon coordinates, and priority protection flags never leave local IndexedDB in AI requests.
6. **Production HTTP Security Headers (`vercel.json`):**
   - Configures `Content-Security-Policy` (`connect-src 'self' https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com` — Groq stays strictly server-side behind `'self'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`.
