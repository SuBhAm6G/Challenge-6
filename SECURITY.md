# Security Policy

## Supported Scope & Threat Model

Saansathi is designed as a **local-first, privacy-minimal clean-air planning Progressive Web App (PWA)**. Sensitive household schedules, vulnerability/priority protection toggles, indoor appliance setups, and saved neighborhood locations remain exclusively on the user's device inside browser `IndexedDB` (`saansathi-local-db`) by default.

---

## Core Security Controls

1. **Server-Side Secret Isolation (`GROQ_API_KEY`):**
   - `GROQ_API_KEY` is read strictly on the server inside `api/chat.ts` (and local Vite dev/preview middleware).
   - No AI credential is ever prefixed with `VITE_`, embedded into client bundles, or committed to tracked source control (verified automatically via regex assertions in `tests/quality/hygiene.test.ts` and `.gitignore` exclusions).
2. **City-Only AI Privacy Minimization (`src/ai/context-builder.ts`):**
   - Requests sent to `/api/chat` transmit only coarse city name, CPCB India NAQI summary, generalized household attributes (mode, count, binary protection indicator), and indoor flags.
   - Street-level localities, browser coordinates, household names, and health records are **systematically stripped** prior to network transmission.
   - Browser geolocation requires explicit consent disclosure (`src/components/dashboard/GeoConsentPanel.tsx`) and rounds coordinates to `0.01°` (~1 km grid) locally.
3. **Runtime Schema Validation Gates (`Zod`):**
   - Every external boundary—Open-Meteo JSON (`src/providers/open-meteo-schema.ts`), IndexedDB records (`src/storage/db.ts`, `src/storage/aq-cache.ts`), `/api/chat` request bodies, and Groq structured completions (`src/ai/schemas.ts`, `api/_guardrails.ts`)—undergoes strict runtime `.safeParse()` validation. Corrupted local records are quarantined gracefully without crashing the application.
4. **Medical & Environmental Safety Guardrails (`src/ai/safety.ts`, `api/_guardrails.ts`):**
   - Urgent respiratory symptom phrases (e.g., chest pain, severe breathlessness, blue lips) trigger an immediate local medical emergency redirect (`112 / 108`) with **zero external AI calls**.
   - Client-side `sanitizeAiResponse()` strips prohibited ozone-generator instructions, medication modifications, fuel-burning room sealing, ungrounded citywide AQI claims, and unverified URLs, and blocks vigorous outdoor cycling recommendations during elevated pollution (`> 250` NAQI).
5. **Serverless Abuse Controls & HTTP Security Headers (`api/chat.ts`, `vercel.json`):**
   - `POST /api/chat` enforces method checks (`405`), `8 KB` body limits (`413`), IP-keyed sliding-window rate limiting (`20 req/min` -> `429`), and explicit prompt-injection data delimiters.
   - Production responses configure `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security`.

---

## Reporting a Vulnerability

If you discover a security, privacy, or safety-guardrail issue in Saansathi (for example: credential leakage, unsafe AI output bypass, XSS vector, or unintended transmission of household/location data):

1. **Do not disclose publicly** via GitHub issues or pull requests before triage.
2. Contact the repository maintainers privately with reproduction steps, affected component/endpoint, and impact assessment.
3. Maintainership will confirm receipt, reproduce locally, patch behind unit/integration regression tests, and publish remediation notes promptly.
