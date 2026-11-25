# Security & Privacy Governance

## Controls Implemented

1. **Server-Side Secret Isolation:** `GROQ_API_KEY` is accessed only in `api/chat.ts` (Vercel serverless function and local Vite dev middleware). Client code never receives or bundles any API key.
2. **Input & Output Validation:** Both `api/chat.ts` and `src/ai/client.ts` validate request payloads (<= 8 KB server limit, 800-char user question cap) and AI structured responses with Zod.
3. **Rate Limiting & Prompt-Injection Defense:** `api/chat.ts` enforces an IP-keyed sliding-window limit (20 requests/minute) and isolates untrusted user context inside explicit boundaries beneath a fixed system instruction.
4. **Medical & Environmental Safety Guardrails:** `src/ai/safety.ts` blocks ozone-generator suggestions, medication modifications, sealing rooms with active fuel combustion, cycling during Severe/Very Poor AQI, invented URLs, and urgent symptom queries (redirected to emergency medical care).
5. **Location & Household Privacy:** Browser geolocation requires explicit consent and rounds coordinates to ~1 km (`0.01°`). Household names, localities, coordinates, and protection flags are never sent to AI prompts (`src/ai/context-builder.ts`).
6. **HTTP Security Headers:** `vercel.json` configures `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`.
