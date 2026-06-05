---
name: Frontend completion state
description: Current state of the Astrix AI pure-frontend prototype — routes, removed features, admin dashboard
---

## Stack
Pure Vite + React 19 + TypeScript + Tailwind CSS + React Router DOM v7. No backend. Pure mock auth (any email/password works).

## Auth
- `AuthContext` uses hardcoded `MOCK_USER` from `mockData.ts`
- `ProtectedRoute` + `AdminRoute` components in `src/components/auth/`
- `AdminRoute` checks `isInitializing` + `user` — redirects to `/login` if unauthenticated

## Pricing Plans (Jun 2026)
- Free / Starter $59/mo / Growth $179/mo / Scale $299/mo ($249/mo annual, $2,989/yr)
- `usePlan.ts`: `type Plan = 'free' | 'starter' | 'growth' | 'scale'`

## Features REMOVED (keep out permanently)
- Ask AI / AI Assistant — removed from sidebar secondaryNav, route deleted, Assistant.tsx deleted
- "What changed since last visit" panel — removed from Dashboard
- "Signals re-clustered" entry — removed from Dashboard
- Integrations hub page (app + marketing) — removed
- Changelog page — removed
- Backend / server folder — removed
- instrument.ts (Sentry+PostHog hardcoded keys) — removed

## Admin Dashboard (added Jun 2026)
- Routes: `/admin`, `/admin/users`, `/admin/workspaces`, `/admin/revenue`
- Layout: `src/layouts/AdminLayout.tsx` — dark sidebar, same theme as AppLayout, red accent
- All pages use hardcoded mock data (frontend-only)
- Protected by `AdminRoute`

## App Routes (all ProtectedRoute)
/app, /app/signals, /app/signals/new, /app/signals/:id,
/app/accounts, /app/accounts/:id,
/app/problems, /app/problems/:id,
/app/opportunities, /app/opportunities/:id, /app/evidence/:problemId,
/app/decisions, /app/decisions/:id,
/app/artifacts, /app/artifacts/:id,
/app/launches, /app/launches/:id,
/app/settings

**Why:** Keeping this to avoid re-adding removed features or duplicating admin work.
**How to apply:** Check this file before building new features.
