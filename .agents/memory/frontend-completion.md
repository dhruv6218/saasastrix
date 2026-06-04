---
name: Frontend completion state
description: What was built and key decisions for the Astrix AI frontend — use before starting any frontend work
---

## Status
Frontend is 100% complete and production-build verified (0 errors, 0 TypeScript issues).

## Plan tier naming (everywhere consistent)
- **Correct names**: Free / Pro / Business / Enterprise
- `usePlan.ts`: `type Plan = 'free' | 'pro' | 'business' | 'enterprise'`
- `UpgradeModal.tsx`: `requiredPlan?: 'Pro' | 'Business' | 'Enterprise'`
- Old names (Starter → Pro, Growth → Business, Scale → Enterprise) are GONE

**Why:** User wanted PRD-aligned plan names across the whole product.

## All 38 routes in App.tsx
Public: /, /pricing, /contact, /changelog, /integrations, /privacy, /terms
Auth: /login, /signup, /forgot-password, /reset-password, /accept-invitation
Onboarding: /onboarding/step-1, /onboarding/step-2, /onboarding/step-3
App (all ProtectedRoute): /app, /app/signals, /app/signals/new, /app/signals/:id,
  /app/accounts, /app/accounts/:id, /app/problems, /app/problems/:id,
  /app/opportunities, /app/opportunities/:id, /app/evidence/:problemId,
  /app/decisions, /app/decisions/:id, /app/artifacts, /app/artifacts/:id,
  /app/launches, /app/launches/:id, /app/ask, /app/integrations, /app/settings, *

## Sidebar nav items (AppLayout.tsx)
Primary: Dashboard, Signals, Accounts, Problems, Opportunities, Decisions, Launches
Secondary: Ask AI (/app/ask), Integrations (/app/integrations), Artifacts, Settings

## Filters (all wired with state + useMemo)
- Signal Explorer: keyword search + date range
- Accounts List: Plan Tier, ARR Range, Health Status
- Opportunities List: AI Recommendation (Build/Fix/Experiment/Defer) + Score Range (high/medium/low)
- Decisions History: keyword search + Action filter
- Integrations Hub: category filter + text search (both /integrations and /app/integrations)

## All data flows through mockDb in src/lib/api.ts
- No real backend — everything is in-memory mock
- All hooks follow useQuery pattern: { data, isLoading, refetch }
- Audit log populated on every mutating action automatically

**How to apply:** When adding new features, add mock data to mockDb, add CRUD methods to api.api.*, add useXxx hooks.
