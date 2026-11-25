# Contributing to Saansathi

## Setup

1. Ensure Node.js `>=20.0.0` is installed.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `GOOGLE_API_KEY` and `GEMINI_MODEL=gemini-3.1-flash-lite` (for local AI testing; the app runs deterministically without a key).
4. Start the development server with `npm run dev`.

## Code & Quality Standards

- Strict TypeScript (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`)—zero `any`, `as any`, `@ts-ignore`, or `@ts-nocheck`.
- Keep deterministic environmental logic pure and decoupled from React UI and storage.
- Never fabricate AQI values, emission factors, or health guarantees.
- Run `npm run check` (`typecheck`, `lint`, `format:check`, `test`, `build`) before opening a pull request.
