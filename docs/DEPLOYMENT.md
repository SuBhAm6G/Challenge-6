# Deployment Guide (Vercel)

## Prerequisites

- Node.js `>=20.0.0`
- A Google Gemini API key (`GOOGLE_API_KEY`) for the `/api/chat` serverless endpoint

## Steps

1. Connect the repository to Vercel (Framework Preset: **Vite**).
2. Build Command: `npm run build` | Output Directory: `dist`.
3. Add Environment Variables in Vercel Project Settings:
   - `GOOGLE_API_KEY` = your Google Gemini API key (keep secret, server-side only)
   - `GEMINI_MODEL` = `gemini-3.1-flash-lite`
4. `vercel.json` automatically configures SPA rewrites (excluding `/api/*` and PWA assets) and production security headers (`CSP`, `HSTS`, `X-Frame-Options`, `Permissions-Policy`).
