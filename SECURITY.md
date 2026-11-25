# Security Policy

## Reporting a Vulnerability

If you discover a security or privacy issue in Saansathi (for example, accidental exposure of credentials, unsafe AI output handling, XSS vectors, or unintended transmission of household data), please report it privately to the repository maintainers before disclosing it publicly.

## Security Principles

- **Server-side AI secrets:** `GOOGLE_API_KEY` is read exclusively inside `api/chat.ts` and is never exposed via client bundles or `VITE_` environment variables.
- **Local-first household privacy:** Household profiles, indoor setups, and priority protection preferences remain in browser `IndexedDB` (`saansathi-local-db`) by default.
- **Data minimization for AI:** `src/ai/context-builder.ts` transmits only coarse city-level context and validated air-quality summaries—never street coordinates, household names, or medical records.
- **Schema validation everywhere:** All external API responses, local IndexedDB records, and AI outputs are parsed through strict `zod` schemas.
