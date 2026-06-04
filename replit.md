# Astrix AI

## Overview
A React + Vite + TypeScript frontend application for the Astrix AI platform — an intelligence engine for B2B SaaS that turns raw signals into evidence-backed product decisions.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite 6
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **State Management**: Zustand
- **Charts**: ECharts (echarts-for-react)
- **Tables**: TanStack React Table
- **HTTP**: Axios
- **Animations**: Lenis (smooth scroll)
- **Icons**: Lucide React

## Project Structure
```
src/
  App.tsx          - Root app component with routing
  main.tsx         - Entry point
  index.css        - Global styles
  components/      - Reusable UI components (auth, ui sections)
  pages/
    app/           - Protected app pages (Dashboard, Signals, Problems, Opportunities,
                     OpportunityDetail, EvidenceView, Decisions, DecisionDetail,
                     ArtifactStudio, PostLaunchTracker, LaunchDetail,
                     AskAssistant, IntegrationsHub, Settings)
    onboarding/    - 3-step onboarding flow
    marketing/     - Marketing pages
    legal/         - Privacy, Terms
  layouts/         - AppLayout (dark sidebar), AuthLayout, MainLayout, OnboardingLayout
  contexts/        - AuthContext, WorkspaceContext, ToastContext
  hooks/           - Custom hooks
  store/           - Zustand stores (signals, problems, opportunities, decisions,
                     artifacts, launches, accounts, teams, audit)
public/            - Static assets
```

## Completed Pages
### Public / Marketing
- `/` Home landing page
- `/pricing` Pricing page (Free / Pro $39/mo / Business $69/mo / Enterprise custom)
- `/contact` Contact page
- `/changelog` Public changelog (v1.0–v1.4 timeline with New/Improved/Fixed tags + Coming Next section)
- `/integrations` Integrations marketing page (16 integrations, category filter, search, connect CTA)
- `/privacy` `/terms` Legal pages

### Auth
- `/login` `/signup` `/forgot-password` `/reset-password`
- `/accept-invitation` Invite acceptance flow

### Onboarding
- `/onboarding/step-1` Create workspace
- `/onboarding/step-2` Upload first data
- `/onboarding/step-3` First results

### App (all protected)
- `/app` Home Dashboard
- `/app/signals` Signal Explorer
- `/app/problems` Problems List
- `/app/problems/:id` Problem Detail (tabs: Overview, Evidence, Accounts, History, Comments)
- `/app/opportunities` Opportunities Ranked List + Compare Mode
- `/app/opportunities/:id` Opportunity Detail (tabs: Overview, Evidence, Accounts, Score Breakdown + What-if)
- `/app/evidence/:problemId` Full Evidence View with timeline charts, sentiment, flagging
- `/app/decisions` Decisions History
- `/app/decisions/:id` Decision Detail + Artifact Studio + Post-Launch log
- `/app/artifacts` Artifact Studio (PRD + Decision Memo viewer/editor with version history)
- `/app/launches` Post-Launch Tracker (all launches + measurement windows)
- `/app/launches/:id` Launch Detail (before/after charts + outcome entry forms)
- `/app/ask` Ask AI Assistant
- `/app/integrations` Integrations Hub (18 integrations, category filter, connect/disconnect, plan-gated)
- `/app/settings` Settings (Profile, Team, Product Areas, Segments, Billing, Audit Log tabs)

## Filters & Search (fully wired)
- Signal Explorer: keyword search + date range filter
- Accounts List: Plan Tier, ARR Range, Health Status filters
- Opportunities List: AI Recommendation + Score Range filters
- Decisions History: keyword search + Action filter
- Integrations Hub: category filter + text search (both public and app pages)

## Plan Tiers (everywhere consistent)
- Free / Pro ($39/mo) / Business ($69/mo) / Enterprise (custom)
- usePlan hook: type Plan = 'free' | 'pro' | 'business' | 'enterprise'
- UpgradeModal: requiredPlan?: 'Pro' | 'Business' | 'Enterprise'

## Navigation
- MainLayout header: Pricing, Integrations, Changelog, Sign In, Start Free
- AppLayout sidebar: Dashboard, Signals, Accounts, Problems, Opportunities, Decisions, Launches + Ask AI, Integrations, Artifacts, Settings
- Footer (EmpireSection): Features, Pricing, Integrations, Changelog, Contact, Privacy, Terms

## Development
- Run: `npm run dev` (starts on port 5000)
- Build: `npm run build`
- Preview: `npm run preview`

## Replit Configuration
- Workflow: "Start application" → `npm run dev` on port 5000
- Deployment: Static site, builds with `npm run build`, serves from `dist/`
- Vite configured with `host: '0.0.0.0'`, `port: 5000`, `allowedHosts: true`
