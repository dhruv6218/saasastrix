---
name: Full-stack migration
description: Express + PostgreSQL backend added to what was a pure React/Vite frontend. JWT auth, all API routes, Dodo Payments, Gemini AI.
---

## What was done
Migrated from 100% mocked frontend to real full-stack:
- `server/` — Express backend (port 3000), concurrently with Vite (port 5000)
- Vite proxies `/api/*` → `http://localhost:3000`
- `server/schema.sql` — 14-table PostgreSQL schema (run `npx tsx server/scripts/migrate.ts`)
- JWT stored in localStorage (`astrix_token`) + httpOnly cookie as fallback
- All hooks in `src/lib/api.ts` call real `/api/*` routes

## Key conventions
- `AuthContext` uses `user.full_name` / `user.email` — NOT `user.user_metadata.full_name` (that was Supabase)
- All workspace-scoped routes are `/api/workspaces/:wsId/<resource>`
- `useDecisions()` returns an array (normalized inside the hook from `{rows,total}` or `[]`)
- `api.*` methods are backward-compatible: 2-arg calls like `api.signals.update(id, data)` resolve `wsId` from `localStorage.getItem('astrix_active_ws')`

**Why:** Previous code used Supabase user shape; JWT shape is flat (`user.full_name` directly).

## Secrets needed in production
- `DODO_PAYMENTS_API_KEY` — Dodo Payments billing
- `DODO_WEBHOOK_SECRET` — webhook signature verification
- `GEMINI_API_KEY` — Google Gemini AI (free tier, 1.5-flash model)
- `JWT_SECRET` — falls back to `SESSION_SECRET` if not set

## DB migration
Run once: `npx tsx server/scripts/migrate.ts`
Uses `fileURLToPath(import.meta.url)` for `__dirname` (ESM environment).
