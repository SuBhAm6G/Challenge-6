# Deployment Guide (Vercel)

## Prerequisites

- Node.js `>=20.0.0`
- A Groq API key (`GROQ_API_KEY`) for the `/api/chat` serverless endpoint

## Steps

1. Connect the repository to Vercel (Framework Preset: **Vite**).
2. Build Command: `npm run build` | Output Directory: `dist`.
3. Add Environment Variables in Vercel Project Settings:
   - `GROQ_API_KEY` = your Groq API key (keep secret, server-side only)
   - `GROQ_MODEL` = `openai/gpt-oss-120b` (with automatic `openai/gpt-oss-20b` / `qwen/qwen3.8-27b` fallback)
4. `vercel.json` automatically configures SPA rewrites (excluding `/api/*` and PWA assets) and production security headers (`CSP`, `HSTS`, `X-Frame-Options`, `Permissions-Policy`).
