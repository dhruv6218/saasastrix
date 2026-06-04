---
name: Frontend completion state
description: What was built and key decisions for the Astrix AI frontend — use before starting any frontend work
---

## Status
Frontend is 100% complete and production-build verified (0 errors, 0 TypeScript issues).
Build size: 2,170 KB (chunk size warning is cosmetic only — no functional issue).

## Plan tier naming (everywhere consistent)
- **Correct names**: Free / Pro / Business / Enterprise
- `usePlan.ts`: `type Plan = 'free' | 'pro' | 'business' | 'enterprise'`
- `UpgradeModal.tsx`: `requiredPlan?: 'Pro' | 'Business' | 'Enterprise'`

## All 7 New Features (Jun 2026)
1. **Weekly Email Digest** — Settings.tsx "Email Digest" tab with live preview + toggles. Prefs in localStorage key `astrix_digest_prefs`.
2. **CSV Export** — `src/utils/csvExport.ts` + Export buttons in SignalExplorer, AccountsList, OpportunitiesList, DecisionDetail.
3. **Onboarding Checklist** — `src/components/ui/OnboardingChecklist.tsx` fixed bottom-right widget. 7 steps. localStorage `astrix_checklist_dismissed`. Added to AppLayout.tsx.
4. **Decision Win Rate** — Dashboard.tsx right column widget (win rate %, total decisions, Build/Fix/Experiment breakdown, progress bar).
5. **Notification Preferences** — Settings.tsx "Notifications" tab with Email + In-App toggles. Prefs in localStorage `astrix_notification_prefs`.
6. **Jira/Linear Integration** — `src/components/modals/JiraLinearModal.tsx`. Push button in DecisionDetail right column. IntegrationsHub: Jira+Linear status changed from `coming_soon` → `available`.
7. **Saved Filter Presets** — Signal Explorer + Opportunities List. localStorage keys `astrix_signal_presets` + `astrix_opp_presets`. Bookmark chip UI.

## PRD File
`ASTRIX_AI_COMPLETE_PRD.md` in project root — comprehensive PRD covering all 25 sections, ready for backend developers.

## All 38 Routes in App.tsx
Public: /, /pricing, /contact, /changelog, /integrations, /privacy, /terms
Auth: /login, /signup, /forgot-password, /reset-password, /accept-invitation
Onboarding: /onboarding/step-1, /onboarding/step-2, /onboarding/step-3
App (all ProtectedRoute): /app, /app/signals, /app/signals/new, /app/signals/:id,
  /app/accounts, /app/accounts/:id, /app/problems, /app/problems/:id,
  /app/opportunities, /app/opportunities/:id, /app/evidence/:problemId,
  /app/decisions, /app/decisions/:id, /app/artifacts, /app/artifacts/:id,
  /app/launches, /app/launches/:id, /app/ask, /app/integrations, /app/settings, *

## Settings Tabs (now 8 total)
workspace → areas → segments → team → billing → **notifications** → **digest** → activity

## Key New Files
- `src/utils/csvExport.ts` — generic exportToCsv<T>() function
- `src/components/ui/OnboardingChecklist.tsx` — floating 7-step widget
- `src/components/modals/JiraLinearModal.tsx` — Jira + Linear push modal with tabs

## All data flows through mockDb in src/lib/api.ts
- No real backend — everything is in-memory mock
- When connecting Supabase backend, only replace implementations in `api.*` methods
- All hooks (useSignals, useAccounts, etc.) remain unchanged
- Filter presets + notification/digest prefs currently in localStorage only → move to DB when backend ready

**How to apply:** When adding new features, add mock data to mockDb, add CRUD methods to api.api.*, add useXxx hooks. For backend wiring, replace api.ts mock functions with Supabase calls — no component changes needed.
