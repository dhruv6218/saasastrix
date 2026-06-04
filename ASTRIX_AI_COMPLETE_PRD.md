# ASTRIX AI — Complete Product Requirements Document
### Version 3.0 | Frontend: 100% Complete | Ready for Backend Development
---

## TABLE OF CONTENTS
1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Core Loop](#3-core-loop)
4. [Plan Tiers](#4-plan-tiers)
5. [Authentication & Workspaces](#5-authentication--workspaces)
6. [Onboarding Flow](#6-onboarding-flow)
7. [Dashboard](#7-dashboard)
8. [Signal Explorer](#8-signal-explorer)
9. [Accounts](#9-accounts)
10. [Problems](#10-problems)
11. [Opportunities](#11-opportunities)
12. [Decisions](#12-decisions)
13. [Artifacts (AI Studio)](#13-artifacts-ai-studio)
14. [Launches & Post-Launch Tracker](#14-launches--post-launch-tracker)
15. [Ask AI Assistant](#15-ask-ai-assistant)
16. [Integrations Hub](#16-integrations-hub)
17. [Settings](#17-settings)
18. [Public / Marketing Pages](#18-public--marketing-pages)
19. [Navigation & Layout](#19-navigation--layout)
20. [Data Models](#20-data-models)
21. [API Endpoints](#21-api-endpoints)
22. [Notifications & Email](#22-notifications--email)
23. [Retention Mechanisms](#23-retention-mechanisms)
24. [Security & Permissions](#24-security--permissions)
25. [Feature Flag Matrix](#25-feature-flag-matrix)

---

## 1. PRODUCT OVERVIEW

**Product Name:** Astrix AI  
**Product Type:** B2B SaaS — Product Decision & Outcome Intelligence Platform  
**Stage:** MVP → Foundation for Enterprise SaaS  

### What Astrix Does
Astrix AI is an intelligence engine for product teams at B2B SaaS companies. It collects raw customer signals from any source, connects them to accounts and revenue context, clusters them into problems, scores those problems as opportunities, and tracks every decision from rationale through launch to measured outcome.

### The Core Promise
> "Know what to build next — and whether it worked — with proof."

### Why It Exists (Problem Statement)
Product teams in SaaS companies collect feedback everywhere: support tickets, Slack, emails, calls, spreadsheets. It's messy and biased:
- Loud customers win, even if they represent small ARR
- Teams ship features and move on without checking if problems were actually solved
- Priorities cannot be defended with evidence

### The Astrix Solution Loop
```
Signals → Problems → Opportunities → Decisions → Launches → Verdicts
```
This loop is **sacred**. Every feature in the product exists to strengthen one step of this loop.

### Target Customer
- **ICP:** B2B SaaS companies, 10–200 employees
- **Primary user:** Head of Product, Founder, Senior PM
- **Buying trigger:** Growing evidence pile, no system for prioritization
- **Geography:** US / EU first, India via design partners

---

## 2. TECH STACK

### Frontend (COMPLETED)
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS + custom design tokens |
| Routing | React Router DOM v7 |
| State | Zustand stores + React Query pattern (custom hooks) |
| Tables | TanStack React Table v8 |
| Charts | ECharts (echarts-for-react) |
| Animations | Lenis (smooth scroll) |
| Icons | Lucide React |
| HTTP | Axios (for real API calls) |

### Backend (TO BE BUILT)
| Layer | Technology |
|-------|-----------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (CSV uploads, avatars) |
| Edge Functions | Supabase Edge Functions (AI tasks, webhooks) |
| Email | Resend (transactional + digest emails) |
| Payments | Stripe or Dodo Payments |
| AI Models | Gemini (free tier), Groq (paid tier) |
| Deployment | Vercel / Railway / Supabase hosting |

### Frontend ↔ Backend Integration
- All mock data currently lives in `src/lib/api.ts` → `mockDb` object
- Every API call goes through `api.{entity}.{method}()` in that file
- **To connect backend:** Replace mock implementations in `src/lib/api.ts` with real Supabase/REST calls
- Auth currently uses mock `AuthContext` → Replace with Supabase Auth client
- All hooks (`useSignals`, `useAccounts`, etc.) remain unchanged — only the underlying `api.*` calls change

---

## 3. CORE LOOP

```
SIGNALS ──────► PROBLEMS ──────► OPPORTUNITIES ──────► DECISIONS ──────► LAUNCHES ──────► VERDICTS
  │                  │                  │                    │                 │                │
Customer          Clustered         Scored 0-100         Build/Fix/         Day 7 &          Solved /
feedback in       feedback          based on ARR +       Experiment/        Day 30           Partial /
one place         grouped by        pain + demand        Defer/Reject       reviews           Not Solved /
                  theme             + trend                                                   Regressed
```

**Each entity links to the next:**
- `Signal.problem_id` → links to Problem
- `Problem.opportunity_id` → links to Opportunity  
- `Opportunity.decision_id` → links to Decision
- `Decision.launch_id` → links to Launch
- `Launch.pm_verdict` → final verdict

---

## 4. PLAN TIERS

| Plan | Price | Signal Limit | Account Limit | Members | Integrations |
|------|-------|-------------|---------------|---------|--------------|
| Free | $0/mo | 100 signals | 25 accounts | 2 members | 0 (manual only) |
| Pro | $39/mo | 2,000 signals | 500 accounts | 5 members | 3 integrations |
| Business | $69/mo | 10,000 signals | Unlimited | Unlimited | 10 integrations |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | All + SSO |

### Plan Feature Flags (frontend: `usePlan.ts`)
```typescript
type Plan = 'free' | 'pro' | 'business' | 'enterprise'

// Limits object shape
{
  maxSignals: number          // 100 / 2000 / 10000 / Infinity
  maxAccounts: number         // 25 / 500 / Infinity / Infinity
  maxMembers: number          // 2 / 5 / Infinity / Infinity
  maxIntegrations: number     // 0 / 3 / 10 / Infinity
  compareMode: boolean        // false / true / true / true
  aiAssist: boolean           // false / true / true / true
  artifactStudio: boolean     // false / true / true / true
  exportCsv: boolean          // false / true / true / true
  savedPresets: boolean       // false / true / true / true
  advancedFilters: boolean    // false / true / true / true
}
```

### UpgradeModal Component
- File: `src/components/modals/UpgradeModal.tsx`
- Props: `requiredPlan?: 'Pro' | 'Business' | 'Enterprise'`
- Shows when a free-tier user tries to access a gated feature
- Contains plan comparison + upgrade CTA

---

## 5. AUTHENTICATION & WORKSPACES

### Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `Login.tsx` | Email/password form + Google OAuth button |
| `/signup` | `Signup.tsx` | Register + create workspace name in one step |
| `/forgot-password` | `ForgotPassword.tsx` | Send reset link |
| `/reset-password` | `ResetPassword.tsx` | Set new password from link |
| `/accept-invitation` | `AcceptInvitation.tsx` | Join workspace via email invite |

### Auth Flow
1. User signs up with email + password (or Google OAuth)
2. On first signup, workspace is auto-created
3. JWT token stored in `localStorage` (Supabase handles this)
4. `AuthContext` provides `user`, `session`, `signIn()`, `signOut()`, `signUp()`
5. `ProtectedRoute` component wraps all `/app/*` routes — redirects to `/login` if no session

### Workspace Model
```
Workspace {
  id: uuid
  name: string
  slug: string           // URL-safe identifier
  timezone: string       // e.g., "America/New_York"
  owner_id: uuid         // references users.id
  plan_type: Plan        // 'free' | 'pro' | 'business' | 'enterprise'
  created_at: timestamp
}
```

### Multi-Workspace (Future)
- Backend schema supports multiple workspaces per user
- Frontend currently shows one active workspace at a time
- `WorkspaceContext` provides `activeWorkspace`, `setActiveWorkspace()`
- Future: workspace picker dropdown in sidebar

### Roles & Permissions
| Role | Permissions |
|------|------------|
| Owner | All actions + billing + workspace deletion |
| Admin | All actions + member management (no billing) |
| Member | Create/edit signals, problems, decisions, launches |
| Viewer | Read-only (no create/edit) |

---

## 6. ONBOARDING FLOW

### 3-Step Onboarding
| Step | Route | Purpose |
|------|-------|---------|
| Step 1 | `/onboarding/step-1` | Create workspace (name + timezone) |
| Step 2 | `/onboarding/step-2` | Upload first data (CSV signals or sample workspace) |
| Step 3 | `/onboarding/step-3` | See first results (first 3 signals clustered into a problem) |

### Onboarding Checklist Widget (NEW)
- File: `src/components/ui/OnboardingChecklist.tsx`
- **Type:** Floating widget, fixed bottom-right of screen, appears in all app pages
- **Trigger:** Visible until all 7 steps complete OR user dismisses
- **Persistence:** `localStorage` key `astrix_checklist_dismissed`
- **Auto-detection:** Checks live data counts to mark steps as complete

**7 Steps:**
1. ✅ Create your workspace (always done)
2. Add your first signals (done when `signals.total > 0`)
3. Import account data (done when `accounts.length > 0`)
4. Cluster problems from signals (done when `problems.length > 0`)
5. Review scored opportunities (done when `opportunities.length > 0`)
6. Log your first decision (done when `decisions.length > 0`)
7. Track your first launch (done when `launches.length > 0`)

**UI Details:**
- Dark header bar with progress count badge
- Collapsible with chevron toggle
- Progress bar (teal fill, percentage-based)
- Each step shows: checkbox icon, label, description, action link
- Completed steps are strikethrough + reduced opacity
- Dismiss button removes widget permanently (localStorage)

### Sample Workspace
- On Step 2, user can click "Load Sample Workspace" 
- This pre-populates 50 signals, 12 accounts, 6 problems, 4 opportunities, 3 decisions, 2 launches
- Helps users see value before uploading their own data

---

## 7. DASHBOARD

**Route:** `/app`  
**Component:** `src/pages/app/Dashboard.tsx`  
**Purpose:** "What matters right now?" — the PM's daily starting point

### Layout
Two-column grid (1:2 left-right on desktop, stacked on mobile):
- **Left column (xl:col-span-2):** Top opportunities + ranked opportunity list
- **Right column (xl:col-span-1):** Active launches + recent decisions + Decision Win Rate + Open problems

### Widgets (top to bottom)

#### Welcome Banner
- Personalized greeting: "Good morning, {firstName}"
- Shows workspace-level stats: signal count, accounts, problems, launches
- Activity feed row: quick recent actions
- Empty state: guided CTAs when workspace is empty

#### Context-Sensitive Quick Actions Bar
- "Next action" button bar that changes based on current workspace state:
  - Empty → "Upload signals", "Load sample workspace"
  - Has signals, no problems → "Cluster problems"
  - Has problems, no decisions → "Score opportunities"
  - Has decisions, no launches → "Log a launch"
  - Has active launches → "Enter Day 7 results"

#### Signal Trend Chart
- 7-day line chart using ECharts
- Shows signal ingestion volume over time
- Responds to actual signal count (scales proportionally)

#### Top Opportunities Widget (Hero card)
- Shows #1 ranked opportunity as a hero card
- Fields: problem title, opportunity score (large), ARR at risk, signal count
- AI recommendation badge (Build/Fix/Experiment/Defer)
- "View opportunity" CTA

#### Top 5 Opportunities List
- Ranked cards with score, problem title, ARR, action badge
- "Make decision" quick action on each

#### Reviews Due Widget
- List of active launches with Day 7/30 reviews overdue
- Overdue = orange indicator
- "Start review" links to launch detail

#### Active Launches
- Currently active/pending review launches
- Launch name, days since launch, overdue indicator

#### Recent Decisions (4 latest)
- Decision title, action badge (Build/Fix/etc), date
- Links to decision detail

#### Decision Win Rate Widget (NEW)
- **Large number:** Win rate percentage (solved launches / total launches with verdict × 100)
- **Second stat:** Total decisions logged
- **Progress bar:** Teal fill = win rate %
- **Mini breakdown:** Build / Fix / Experiment decision counts (3-column grid)
- **Green callout:** "X launches marked Solved" (if any)
- Empty state: "Log decisions to track your win rate"

#### Open Problems Summary
- Top 3 problems by severity
- Problem title, severity badge, signal count

---

## 8. SIGNAL EXPLORER

**Route:** `/app/signals`  
**Component:** `src/pages/app/SignalExplorer.tsx`  
**Purpose:** The "inbox" — triage, tag, and link raw customer feedback

### What is a Signal?
A Signal is a single piece of customer feedback or evidence — one support ticket, one NPS comment, one sales call excerpt, one feature request. Signals are the atomic unit that everything else is built from.

### Core Features

#### Signal Table
- TanStack React Table with server-side pagination + sorting
- Columns: Source icon, Severity, Sentiment, Content (truncated), Product Area, Account, Date, Status
- Clickable rows → signal detail / edit modal
- Bulk select checkboxes → "Cluster into Problem" action
- 15 signals per page (configurable)

#### Search
- Full-text search across signal content + source
- Debounced (300ms) → triggers refetch

#### Filters (all stackable)
| Filter | Options |
|--------|---------|
| Severity | Critical / High / Medium / Low |
| Sentiment | Negative / Neutral / Positive |
| Product Area | Authentication / Core UI / API / Billing / Dashboard |
| Account | Dropdown of linked accounts |
| Date From | Date picker |
| Date To | Date picker |

- Active filter count badge on Filter button
- "Clear all" resets all filters
- Filter panel is a floating dropdown (click outside to close)

#### CSV Export (NEW)
- **Button:** "Export CSV" next to Filters
- **Action:** Fetches ALL matching signals (ignores pagination, uses current filters)
- **File:** `astrix_signals_YYYY-MM-DD.csv`
- **Columns:** ID, Source, Severity, Sentiment, Product Area, Date, Content
- **Utility:** `src/utils/csvExport.ts` → `exportToCsv()` function

#### Saved Filter Presets (NEW)
- **Appears when:** Filters are active OR saved presets exist
- **"Save preset" button:** Appears when filters are active → shows inline name input
- **Preset chips:** Show above the search bar — click to apply, ✕ to delete
- **Persistence:** `localStorage` key `astrix_signal_presets`
- **Format stored:** `[{ name: string, filters: { filterSeverity, filterSentiment, filterArea, filterAccount, filterDateFrom, filterDateTo } }]`

#### Add Signal (Manual)
- "+ New Signal" button → full-page form at `/app/signals/new`
- Fields: source, content (textarea), severity, sentiment, product area, linked account, date
- AI assist badge → auto-suggests severity, sentiment, product area from content

#### Signal Detail / Edit
- Route: `/app/signals/:id`
- Shows full content, metadata, linked account, linked problem
- Edit mode: update all fields

#### Bulk Actions
- Select multiple signals (checkboxes)
- "Cluster into Problem" → opens modal to create/assign problem
- "Clear selection" resets

### Signal Data Model
```
Signal {
  id: uuid
  workspace_id: uuid
  source: enum('support_ticket' | 'intercom' | 'slack' | 'email' | 'gong' | 'manual' | 'csv_upload' | 'survey' | 'github' | 'zapier')
  content: text
  severity: enum('Critical' | 'High' | 'Medium' | 'Low')
  sentiment: enum('Negative' | 'Neutral' | 'Positive')
  product_area: string
  account_id: uuid (nullable, FK → accounts.id)
  problem_id: uuid (nullable, FK → problems.id)
  status: enum('new' | 'triaged' | 'linked' | 'archived')
  ai_suggested: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 9. ACCOUNTS

**Route:** `/app/accounts`  
**Component:** `src/pages/app/AccountsList.tsx`  
**Purpose:** Account context enriches signals with ARR and plan tier data

### Why Accounts Matter
Without accounts, every customer complaint looks equal. With accounts, you know that 3 complaints from a $200k ARR enterprise customer outweigh 20 complaints from free users. Accounts make the scoring algorithm meaningful.

### Account List Features

#### Table
- TanStack React Table with server-side pagination + sorting
- Columns: Logo/initial, Account Name, Domain, Plan, ARR ($), Health Score, Signal Count, Last Signal date
- Clickable row → Account Detail page

#### Search
- Real-time search across name + domain

#### Filters
| Filter | Options |
|--------|---------|
| Plan | Enterprise / Business / Pro / Free / SMB |
| ARR Range | Under $100k / $100k–$500k / $500k+ |
| Health Status | Healthy (75+) / Warning (50–74) / At Risk (<50) |

#### CSV Export (NEW)
- **Button:** "Export CSV" in filter toolbar
- **Columns:** Account Name, Domain, ARR, Plan, Health Score, Signal Count
- **File:** `astrix_accounts_YYYY-MM-DD.csv`

#### Add Account (Manual)
- "+ Add Account" button → modal
- Fields: name, domain (for auto-matching), ARR, plan type

#### CSV Upload
- "Upload CSV" button → `CsvUploadModal` (existing component)
- Maps: name, domain, arr, plan_type, health_score columns

### Account Detail
**Route:** `/app/accounts/:id`  
- Overview: name, domain, ARR, plan, health score, signal count
- Signals tab: all signals from this account
- Decisions tab: decisions that mention this account
- Risk indicator: health score badge (green/yellow/red)
- "Edit account" inline

### Account Data Model
```
Account {
  id: uuid
  workspace_id: uuid
  name: string
  domain: string              // used for auto-matching signals by sender email domain
  arr: number                 // Annual Recurring Revenue in USD
  plan_type: string           // 'Enterprise' | 'Business' | 'Pro' | 'Free' | 'SMB'
  health_score: number        // 0–100, computed from churn signals
  signal_count: number        // cached count
  last_signal_at: timestamp
  created_at: timestamp
}
```

---

## 10. PROBLEMS

**Route:** `/app/problems`  
**Component:** `src/pages/app/ProblemsListPage.tsx`  
**Purpose:** Cluster related signals into named problems with evidence counts

### What is a Problem?
A Problem is a cluster of related signals that point to the same underlying user pain. Example: 12 signals about "slow CSV export", 3 signals about "export fails for large files" → all cluster into Problem: "Data export is slow and unreliable".

### Problem List Features
- Cards layout (not table): problem title, severity, signal count, affected ARR, product area, date
- Create problem manually (+ New Problem button)
- "AI Suggest Clusters" button → AI groups unclustered signals into suggested problems

### Problem Detail
**Route:** `/app/problems/:id`  
**Tabs:**
1. **Overview** — problem title, description, severity, affected ARR, product area
2. **Evidence** — table of all linked signals (filterable)
3. **Accounts** — which accounts' signals are in this problem
4. **History** — when signals were added/removed
5. **Comments** — team discussion thread

### Problem → Opportunity Link
- Each Problem has at most one linked Opportunity (auto-created when problem is saved)
- "Score as Opportunity" button → creates/refreshes opportunity scoring

### Problem Data Model
```
Problem {
  id: uuid
  workspace_id: uuid
  title: string
  description: text
  severity: enum('Critical' | 'High' | 'Medium' | 'Low')
  product_area: string
  evidence_count: number        // count of linked signals
  affected_arr: number          // sum of ARR from linked accounts
  affected_accounts: number     // count of distinct accounts
  status: enum('open' | 'in_progress' | 'resolved' | 'wont_fix')
  ai_suggested: boolean
  opportunity_id: uuid (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 11. OPPORTUNITIES

**Route:** `/app/opportunities`  
**Component:** `src/pages/app/OpportunitiesList.tsx`  
**Purpose:** Ranked, evidence-backed list of "bets" — scored 0–100

### Opportunity Scoring Algorithm
Each Opportunity is scored 0–100 based on 4 components:

| Component | Weight | Source |
|-----------|--------|--------|
| ARR Impact | 30% | Sum of ARR from accounts with signals in this problem |
| Pain Score | 35% | Mix of: severity distribution, sentiment score, signal count |
| Demand Score | 20% | Raw signal count normalized against workspace average |
| Trend Score | 15% | Signal velocity (are new signals arriving?) |

**Score = (ARR × 0.30) + (Pain × 0.35) + (Demand × 0.20) + (Trend × 0.15)**

All individual components are also exposed in the detail view so PMs can inspect and understand the score.

### Opportunity List Features

#### List View
- Ranked cards (rank number, score badge, problem title, ARR, signal count)
- AI recommendation badge (Build/Fix/Experiment/Defer)
- "Make Decision" button on each card
- Active filter count
- Pagination

#### Filters (NEW — already implemented)
| Filter | Options |
|--------|---------|
| AI Recommendation | Build / Fix / Experiment / Defer |
| Score Range | High (71–100) / Medium (41–70) / Low (≤40) |

#### CSV Export (NEW)
- **Button:** "Export CSV" in filter toolbar
- **Columns:** Problem, Score, Recommended Action, Affected ARR, Signal Count, Severity
- **File:** `astrix_opportunities_YYYY-MM-DD.csv`

#### Saved Filter Presets (NEW)
- Save named combinations of Action + Score Range filters
- Stored in `localStorage` key `astrix_opp_presets`
- Same chip UI as Signal Explorer

#### Compare Mode (Pro+)
- Toggle "Compare Mode" → select 2–4 opportunities
- Side-by-side comparison modal: score breakdown, ARR, signals, accounts, AI rec
- Gate: shown locked icon on Free plan

### Opportunity Detail
**Route:** `/app/opportunities/:id`  
**Tabs:**
1. **Overview** — score breakdown, recommendation, linked problem summary
2. **Evidence** — linked signals table
3. **Accounts** — affected accounts and their ARR
4. **Score Breakdown** — visual bar chart of 4 scoring components
5. **What-If** — (locked on Free) slider tool to see how changing variables affects score

### Opportunity Data Model
```
Opportunity {
  id: uuid
  workspace_id: uuid
  problem_id: uuid (FK → problems.id)
  opportunity_score: number     // 0–100
  pain_score: number
  demand_score: number
  trend_score: number
  arr_impact_score: number
  recommended_action: enum('Build' | 'Fix' | 'Experiment' | 'Defer')
  ai_recommendation_reason: text
  decision_id: uuid (nullable)
  top_accounts: jsonb           // [{ name, arr }] cached
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 12. DECISIONS

**Route:** `/app/decisions`  
**Component:** `src/pages/app/DecisionsHistory.tsx`  
**Purpose:** Permanent evidence-backed record of every product decision

### What is a Decision?
When a PM reviews an opportunity and makes a call — Build it / Fix it / Run an experiment / Defer it / Reject it — that choice becomes a Decision. The Decision captures: what was decided, why, what assumptions were made, what risks exist, and what alternatives were rejected.

### Decision History List Features

#### Table
- Columns: Title, Action badge, Problem linked, Date, Author
- Sort by date or action
- Click row → Decision Detail

#### Search + Filter
- Keyword search across title + rationale
- Filter by Action: Build / Fix / Experiment / Defer / Reject / all

### Decision Detail
**Route:** `/app/decisions/:id`  
**Component:** `src/pages/app/DecisionDetail.tsx`

#### Left Column (2/3 width)
1. **Action + Rationale card** — action badge + rationale text (blockquote style)
2. **Decision Context** — collapsible sections for:
   - Assumptions (editable inline)
   - Risks (editable inline)
   - Alternatives Considered (editable inline)
3. **Artifact Studio** — generate / view / edit Decision Memo or PRD skeleton
4. **Launch Tracking** — log launch date + expected outcome; shows Day 7 / Day 30 timeline

#### Right Column (1/3 width)
1. **Push to Jira / Linear (NEW)** — card with "Push to Jira / Linear" button
2. **Metadata** — Author, Date, Action type
3. **Linked Evidence** — links to Problem + Opportunity

### Jira / Linear Integration (NEW)
- **Component:** `src/components/modals/JiraLinearModal.tsx`
- **Trigger:** "Push to Jira / Linear" button in right column of Decision Detail
- **Tabs:** Jira | Linear
- **Jira fields:** Project (PROD/ENG/GROWTH/PLATFORM), Issue Type (Story/Task/Bug/Epic), Priority (Highest/High/Medium/Low), Sprint (Current/Next/Backlog), Title (pre-filled from decision), Description (pre-filled from rationale)
- **Linear fields:** Team, Priority, Cycle (Current/Next/Backlog), Estimate (story points), Title, Description
- **Success state:** Shows "Issue Created!" with mock URL + "Open Issue" link
- **Backend requirement:** When backend is built, this should call Jira/Linear APIs using stored OAuth tokens

### Decision Data Model
```
Decision {
  id: uuid
  workspace_id: uuid
  problem_id: uuid (nullable, FK → problems.id)
  opportunity_id: uuid (nullable, FK → opportunities.id)
  title: string
  action: enum('Build' | 'Fix' | 'Experiment' | 'Defer' | 'Reject')
  rationale: text
  assumptions: text
  risks: text
  alternatives: text
  actor: string               // user display name
  user_id: uuid
  jira_ticket_id: string (nullable)    // stored after Jira push
  linear_issue_id: string (nullable)   // stored after Linear push
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 13. ARTIFACTS (AI STUDIO)

**Route:** `/app/artifacts`  
**Component:** `src/pages/app/ArtifactStudio.tsx`  
**Purpose:** AI-generated Product Requirements Documents and Decision Memos

### What are Artifacts?
Artifacts are structured documents that AI drafts based on the decision context — decision rationale, linked signals, account data. A PM can generate a PRD skeleton or Decision Memo in one click, then edit it.

### Artifact Types
1. **Decision Memo** — structured rationale document (Context, Decision, Expected Outcome, Risks, Sign-off)
2. **PRD Skeleton** — Product Requirements Document (Problem Statement, Goals, Success Metrics, Out of Scope)

### Artifact List Features
- List of all artifacts with: title, type badge, linked decision, author, date, version number
- "New Artifact" button → choose type → pick linked decision

### Artifact Detail
**Route:** `/app/artifacts/:id`  
- Full document viewer in split pane
- **Left:** Document content (rendered markdown)
- **Right:** Edit mode (markdown textarea) with live preview toggle
- "Generate" button → AI generates fresh content
- "Save" button → saves with version increment
- Version history: dropdown showing v1, v2, v3... → can restore any version
- Copy to clipboard button

### Artifact Data Model
```
Artifact {
  id: uuid
  workspace_id: uuid
  decision_id: uuid (FK → decisions.id)
  title: string
  type: enum('prd' | 'decision_memo')
  content: text               // markdown
  version: number             // auto-increments on each save
  author_id: uuid
  ai_generated: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 14. LAUNCHES & POST-LAUNCH TRACKER

### Launches List
**Route:** `/app/launches`  
**Component:** `src/pages/app/PostLaunchTracker.tsx`  

- Table of all launches: Title, Status badge, Owner, Launch Date, Day 7 status, Day 30 status, Verdict
- Status badges: Active / Pending Review / Verdict Submitted / Closed
- "Log Launch" → `/app/decisions/:id` → launch form (launches are created from decisions)

### Launch Detail
**Route:** `/app/launches/:id`  
**Component:** `src/pages/app/LaunchDetail.tsx`

#### Measurement Timeline
Three review windows, unlocking progressively:
- **Baseline** — captured at launch (pre-launch signal count, ARR at risk)
- **Day 7 Review** — unlocks 7 days post-launch
- **Day 30 Review** — unlocks 30 days post-launch

Each review captures:
- Signal count change (before vs after)
- ARR at risk change
- Severity mix change
- PM Notes (free text)

#### Before/After Charts
- Side-by-side bar charts: signal count, ARR at risk, severity distribution
- ECharts components

#### Outcome Entry Form
- At Day 7 and Day 30, PM can:
  - Update signal count, ARR at risk numbers
  - Add qualitative PM notes
  - Mark as "Solved" / "Partially Solved" / "Not Solved" / "Regressed"

#### Final Verdict
- PM submits final verdict with rationale text
- Verdict options: `Solved` | `Partially Solved` | `Not Solved` | `Regressed`
- Once submitted, system generates a "Proof Summary Card"

#### Proof Summary Card
- Auto-generated after verdict submission
- Shows: Problem → Decision → Launch → Verdict as a timeline
- Key stats: % signal reduction, ARR saved/at-risk
- Shareable (export to PDF planned for v2)

### Launch Data Model
```
Launch {
  id: uuid
  workspace_id: uuid
  decision_id: uuid (FK → decisions.id)
  title: string
  owner: string
  launched_at: timestamp
  expected_outcome: text
  target_metrics: text
  status: enum('active' | 'pending_review' | 'verdict_submitted' | 'closed')

  -- Baseline
  baseline_signal_count: number
  baseline_arr_at_risk: number

  -- Day 7
  day7_signal_count: number (nullable)
  day7_arr_at_risk: number (nullable)
  day7_pm_notes: text (nullable)
  day7_reviewed_at: timestamp (nullable)

  -- Day 30
  day30_signal_count: number (nullable)
  day30_arr_at_risk: number (nullable)
  day30_pm_notes: text (nullable)
  day30_reviewed_at: timestamp (nullable)

  -- Verdict
  pm_verdict: enum('Solved' | 'Partially Solved' | 'Not Solved' | 'Regressed') (nullable)
  verdict_rationale: text (nullable)
  verdict_submitted_at: timestamp (nullable)

  created_at: timestamp
}
```

---

## 15. ASK AI ASSISTANT

**Route:** `/app/ask`  
**Component:** `src/pages/app/AskAssistant.tsx`  
**Purpose:** Chat interface to query workspace data in natural language

### Features
- Chat-style UI with message bubbles
- User types a question → AI responds with context from their workspace data
- Suggested prompts shown on empty state:
  - "What should we build next?"
  - "Which accounts are most at risk?"
  - "Summarize our biggest problems this quarter"
  - "What decisions have we made this month?"
- AI responses cite sources (signals, accounts, problems)
- "Copy response" button on each AI message

### Backend Requirement
- Fetch user's workspace data (signals, problems, opportunities, decisions, accounts)
- Send as context to AI model (Gemini / Groq)
- System prompt: "You are Astrix AI, a product intelligence assistant for {workspace_name}. Answer based only on the provided workspace data. Always cite sources."
- Token limit management: summarize/truncate large datasets before sending

---

## 16. INTEGRATIONS HUB

### App Integrations Page
**Route:** `/app/integrations`  
**Component:** `src/pages/app/IntegrationsHub.tsx`

#### Features
- Search integrations by name/description
- Filter by category: All / CRM / Support / Analytics / Feedback / Communication / Data
- Cards show: icon, name, description, status badge, plan requirement
- Expand card to see connection details + "Connect" / "Disconnect" button
- Plan gate: if integration requires Pro+ and user is on Free → show UpgradeModal

#### Status Types
| Status | Display |
|--------|---------|
| `connected` | Green "Connected" badge |
| `available` | "Connect" button |
| `coming_soon` | Gray "Coming Soon" label |

#### All 18 Integrations

| ID | Name | Category | Plan Required | Status |
|----|------|----------|--------------|--------|
| salesforce | Salesforce | CRM | Free | Available |
| hubspot | HubSpot | CRM | Free | Available |
| intercom | Intercom | Support | Free | Connected (demo) |
| zendesk | Zendesk | Support | Free | Available |
| freshdesk | Freshdesk | Support | Pro | Available |
| slack | Slack | Communication | Free | Available |
| teams | Microsoft Teams | Communication | Pro | Available |
| mixpanel | Mixpanel | Analytics | Pro | Available |
| amplitude | Amplitude | Analytics | Pro | Available |
| segment | Segment | Data | Pro | Available |
| typeform | Typeform | Feedback | Free | Available |
| surveymonkey | SurveyMonkey | Feedback | Free | Available |
| gong | Gong | Feedback | Pro | Available |
| chorus | Chorus.ai | Feedback | Pro | Available |
| notion | Notion | Data | Free | Available |
| **jira** | **Jira** | **Data** | **Pro** | **Available (NEW)** |
| **linear** | **Linear** | **Data** | **Pro** | **Available (NEW)** |
| github | GitHub | Data | Free | Coming Soon |

### Jira Integration (NEW — functional)
- Now shows "Connect" button (was "Coming Soon")
- Connecting stores OAuth token in workspace settings
- Used by: JiraLinearModal in Decision Detail

### Linear Integration (NEW — functional)
- Now shows "Connect" button (was "Coming Soon")
- Connecting stores OAuth token in workspace settings
- Used by: JiraLinearModal in Decision Detail

### Public Integrations Marketing Page
**Route:** `/integrations`  
**Purpose:** Marketing page showing all integrations to unconverted visitors  
- Same integration grid with category filter + search
- "Connect →" CTAs require login/signup
- Featured section for most popular integrations

---

## 17. SETTINGS

**Route:** `/app/settings`  
**Component:** `src/pages/app/Settings.tsx`  

### 8 Tabs

#### 1. Workspace
- Edit workspace name, timezone
- Danger zone: "Delete Workspace" (requires confirmation, owner only)

#### 2. Product Areas
- Create/delete product area tags (used to categorize signals)
- Default areas: Authentication, Core UI, API, Billing, Dashboard
- "Add area" → inline text input

#### 3. Segments
- Create/delete customer segments (e.g., "Enterprise", "SMB", "Trial")
- Used for filtering in opportunities + accounts

#### 4. Team Members
- List of all members with role badge
- "Invite Member" button → opens modal
- Invite form: email + role dropdown (Viewer/Member/Admin)
- Remove member button (owner/admin only)
- Plan gate: member limit shown with "X/Y members used"

#### 5. Billing & Quotas
- Current plan display (Free/Pro/Business/Enterprise)
- Usage stats: signals used / limit, accounts used / limit, members used / limit
- "Upgrade Plan" CTA → links to pricing page
- Plan tier comparison table
- Payment history placeholder (backend to provide invoice list)

#### 6. Notifications (NEW)
- **Email Notifications section:**
  - Weekly Digest Email (toggle) — Top signals, opportunities, reviews due every Monday
  - Day 7 Launch Reminder (toggle) — Reminder to complete 7-day outcome review
  - Day 30 Launch Reminder (toggle) — Reminder to submit final verdict at Day 30
  - High-Priority Signal Alert (toggle) — Instant email when Critical signal is ingested
  - New Team Decision (toggle) — Notify when teammate logs a decision
- **In-App Notifications section:**
  - Opportunity Score Change (toggle) — Alert when score shifts by 10+ points
  - Team Activity (toggle) — When teammates log decisions or submit verdicts
  - Verdict Due Reminder (toggle) — In-app banner when launch verdict is overdue
  - Daily Triage Prompt (toggle) — Remind to review unmatched signals daily
- **Persistence:** `localStorage` key `astrix_notification_prefs` (frontend)
- **Backend requirement:** Sync these preferences to a `notification_preferences` table, use when sending emails via Resend

#### 7. Email Digest (NEW)
- **Master toggle:** Enable/disable weekly digest
- **Day picker:** Monday / Tuesday / Wednesday / Thursday / Friday
- **Content toggles:** 
  - New signals summary
  - Top opportunities
  - Reviews due
  - Recent decisions
- **Live email preview panel** — shows what the weekly email will look like with current settings
- **Preview content:** 
  - Header with Astrix branding
  - "Good {day} — here's your week in product intelligence"
  - Conditional sections based on content toggles (signals card, opportunities card, reviews card, decisions card)
  - "Open Astrix Dashboard" CTA button
  - Unsubscribe footer
- **Persistence:** `localStorage` key `astrix_digest_prefs` (frontend)
- **Backend requirement:** Cron job (Supabase Edge Function) runs every morning, checks each workspace's `digest_day` preference, sends via Resend for workspaces whose day matches

#### 8. Audit Log
- Chronological list of all workspace actions
- Each entry: actor avatar, action description, object type, metadata, timestamp
- Actions tracked: signal created/updated, problem created, decision logged, verdict submitted, member invited, artifact generated, etc.

### Audit Log Data Model
```
ActivityLog {
  id: uuid
  workspace_id: uuid
  actor: string               // user display name
  user_id: uuid
  action: string              // human-readable e.g. "Logged decision: Build mobile export"
  object_type: enum('Signal' | 'Problem' | 'Opportunity' | 'Decision' | 'Launch' | 'Artifact' | 'Member' | 'Workspace')
  object_id: uuid
  metadata: string (nullable) // extra context e.g. verdict value
  time: timestamp
}
```

---

## 18. PUBLIC / MARKETING PAGES

### Routes & Components
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Home.tsx` | Landing page |
| `/pricing` | `Pricing.tsx` | Plan comparison + CTAs |
| `/contact` | `Contact.tsx` | Contact form |
| `/changelog` | `Changelog.tsx` | Public product changelog |
| `/integrations` | `IntegrationsPage.tsx` | Integration marketing page |
| `/privacy` | `Privacy.tsx` | Privacy policy |
| `/terms` | `Terms.tsx` | Terms of service |

### Home (`/`)
- Hero section with headline, subheadline, "Start Free" CTA
- Product loop explanation (Signals → Problems → Opportunities → Decisions → Launches → Verdicts)
- Feature highlights with screenshots
- Social proof (logos, testimonials)
- Pricing CTA section
- Footer

### Pricing (`/pricing`)
- 4-column plan comparison (Free / Pro $39/mo / Business $69/mo / Enterprise custom)
- Feature checklist per plan
- Billing toggle: Monthly / Annual (20% discount on annual)
- "Start Free" → `/signup`
- "Contact Sales" → `/contact`

### Changelog (`/changelog`)
- Timeline of releases: v1.0 through v1.4+
- Tags: `New` (teal) / `Improved` (blue) / `Fixed` (yellow)
- "Coming Next" section for upcoming features
- Subscribe to updates form

### Integrations Marketing (`/integrations`)
- Full grid of all integrations (same as app page but without connect functionality)
- Category filter + search
- "Connect via Astrix" CTA (requires login)
- Shows 16 integrations

---

## 19. NAVIGATION & LAYOUT

### Three Layouts

#### 1. MainLayout (`src/layouts/MainLayout.tsx`)
Used by: public pages, auth pages
- Header: Logo, Pricing, Integrations, Changelog, Sign In, Start Free CTA
- Footer: Logo, tagline, links (Features, Pricing, Integrations, Changelog, Contact, Privacy, Terms)

#### 2. AuthLayout (`src/layouts/AuthLayout.tsx`)
Used by: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Centered card layout
- Logo at top
- Back to home link

#### 3. AppLayout (`src/layouts/AppLayout.tsx`)
Used by: all `/app/*` routes
- **Left sidebar** (dark gray, `bg-gray-900`): 220px wide, collapses on mobile
- **Main content area** (white): padding, max-width container
- **Sidebar contents:**
  - Workspace name + switcher
  - Primary nav: Dashboard, Signals, Accounts, Problems, Opportunities, Decisions, Launches
  - Secondary nav: Ask AI, Integrations, Artifacts
  - Bottom: Settings, User avatar + name + sign out
- **Top bar** (within AppLayout children): title + subtitle + optional action buttons area
- **OnboardingChecklist widget** — fixed bottom-right, overlaid on all app pages

### 4. OnboardingLayout (`src/layouts/OnboardingLayout.tsx`)
Used by: `/onboarding/*` routes
- Centered layout with step progress bar (3 steps)
- Astrix logo + "Setup your workspace" heading

### App Sidebar Navigation
```
PRIMARY
├── 🏠 Dashboard           /app
├── 📡 Signals             /app/signals
├── 🏢 Accounts            /app/accounts
├── 🔍 Problems            /app/problems
├── 🎯 Opportunities       /app/opportunities
├── ✅ Decisions           /app/decisions
└── 🚀 Launches            /app/launches

SECONDARY
├── 💬 Ask AI              /app/ask
├── 🔌 Integrations        /app/integrations
└── 📄 Artifacts           /app/artifacts

BOTTOM
└── ⚙️ Settings            /app/settings
```

---

## 20. DATA MODELS

### Summary of All Tables (for Supabase/PostgreSQL)

```sql
-- Core tables
workspaces
users (Supabase auth.users + profiles table)
workspace_members (workspace_id, user_id, role)
signals
accounts
problems
opportunities
decisions
artifacts
launches
activity_logs

-- Settings tables
notification_preferences (workspace_id, user_id, prefs jsonb)
digest_preferences (workspace_id, user_id, prefs jsonb)
saved_filter_presets (workspace_id, user_id, entity_type, name, filters jsonb)

-- Integration tables
integrations (workspace_id, integration_id, status, oauth_token_encrypted, config jsonb)
jira_issues (decision_id, workspace_id, jira_key, jira_url, created_at)
linear_issues (decision_id, workspace_id, linear_id, linear_url, created_at)

-- Billing
subscriptions (workspace_id, plan_type, stripe_subscription_id, status, current_period_end)
```

### Foreign Key Relationships
```
workspaces
  ↓ (workspace_id)
  ├── signals → problems → opportunities → decisions → artifacts
  │                                              ↓
  │                                           launches
  ├── accounts ← signals (account_id)
  ├── workspace_members → users
  ├── activity_logs
  ├── notification_preferences
  ├── digest_preferences
  ├── saved_filter_presets
  └── integrations
```

---

## 21. API ENDPOINTS

### Authentication
```
POST /auth/signup           { email, password, workspace_name }
POST /auth/signin           { email, password }
POST /auth/signout          {}
POST /auth/forgot-password  { email }
POST /auth/reset-password   { token, new_password }
GET  /auth/session          → session object
POST /auth/google           → OAuth redirect
```

### Workspaces
```
GET    /workspaces                  → [workspace]
POST   /workspaces                  { name, timezone }
GET    /workspaces/:id              → workspace
PUT    /workspaces/:id              { name, timezone }
DELETE /workspaces/:id              (owner only)
GET    /workspaces/:id/members      → [member]
POST   /workspaces/:id/invite       { email, role }
DELETE /workspaces/:id/members/:uid
```

### Signals
```
GET    /workspaces/:wsId/signals              ?page&limit&sort&severity&sentiment&product_area&account_id&date_from&date_to&q
POST   /workspaces/:wsId/signals             { source, content, severity, sentiment, product_area, account_id }
GET    /workspaces/:wsId/signals/:id
PUT    /workspaces/:wsId/signals/:id
DELETE /workspaces/:wsId/signals/:id
POST   /workspaces/:wsId/signals/bulk-cluster { signal_ids, problem_id }
POST   /workspaces/:wsId/signals/csv-upload   multipart/form-data
```

### Accounts
```
GET    /workspaces/:wsId/accounts             ?page&limit&sort&plan&arr_min&arr_max&health_min&health_max&q
POST   /workspaces/:wsId/accounts            { name, domain, arr, plan_type }
GET    /workspaces/:wsId/accounts/:id
PUT    /workspaces/:wsId/accounts/:id
DELETE /workspaces/:wsId/accounts/:id
POST   /workspaces/:wsId/accounts/csv-upload  multipart/form-data
```

### Problems
```
GET    /workspaces/:wsId/problems
POST   /workspaces/:wsId/problems            { title, description, severity, product_area }
GET    /workspaces/:wsId/problems/:id
PUT    /workspaces/:wsId/problems/:id
DELETE /workspaces/:wsId/problems/:id
POST   /workspaces/:wsId/problems/ai-suggest  {} → suggested clusters
POST   /workspaces/:wsId/problems/:id/signals { signal_ids }   (attach signals)
```

### Opportunities
```
GET    /workspaces/:wsId/opportunities        ?action&score_min&score_max
POST   /workspaces/:wsId/opportunities        { problem_id }  (triggers scoring)
GET    /workspaces/:wsId/opportunities/:id
PUT    /workspaces/:wsId/opportunities/:id    (manual override)
POST   /workspaces/:wsId/opportunities/:id/rescore  {} (re-run scoring algorithm)
```

### Decisions
```
GET    /workspaces/:wsId/decisions            ?action&q
POST   /workspaces/:wsId/decisions            { title, action, rationale, problem_id, opportunity_id }
GET    /workspaces/:wsId/decisions/:id
PUT    /workspaces/:wsId/decisions/:id        (update rationale, assumptions, risks, alternatives)
DELETE /workspaces/:wsId/decisions/:id
POST   /workspaces/:wsId/decisions/:id/jira   { project, type, priority, sprint, title, description } → { jira_key, jira_url }
POST   /workspaces/:wsId/decisions/:id/linear { team, priority, cycle, estimate, title, description } → { linear_id, linear_url }
```

### Artifacts
```
GET    /workspaces/:wsId/artifacts            ?decision_id
POST   /workspaces/:wsId/artifacts            { decision_id, type }  (triggers AI generation)
GET    /workspaces/:wsId/artifacts/:id
PUT    /workspaces/:wsId/artifacts/:id        { content }  (save edit, bumps version)
GET    /workspaces/:wsId/artifacts/:id/versions  → [version]
POST   /workspaces/:wsId/artifacts/:id/restore  { version }
```

### Launches
```
GET    /workspaces/:wsId/launches
POST   /workspaces/:wsId/launches             { decision_id, title, owner, launched_at, expected_outcome, target_metrics, baseline_signal_count, baseline_arr_at_risk }
GET    /workspaces/:wsId/launches/:id
PUT    /workspaces/:wsId/launches/:id         (update day7/day30 data, verdict)
POST   /workspaces/:wsId/launches/:id/verdict { pm_verdict, verdict_rationale }
```

### Settings
```
GET    /workspaces/:wsId/product-areas
POST   /workspaces/:wsId/product-areas        { name }
DELETE /workspaces/:wsId/product-areas/:id

GET    /workspaces/:wsId/segments
POST   /workspaces/:wsId/segments             { name }
DELETE /workspaces/:wsId/segments/:id

GET    /workspaces/:wsId/activity-log         ?page&limit
GET    /workspaces/:wsId/notification-prefs
PUT    /workspaces/:wsId/notification-prefs   { prefs object }
GET    /workspaces/:wsId/digest-prefs
PUT    /workspaces/:wsId/digest-prefs         { prefs object }

GET    /workspaces/:wsId/saved-presets        ?entity=signals|opportunities|accounts
POST   /workspaces/:wsId/saved-presets        { entity, name, filters }
DELETE /workspaces/:wsId/saved-presets/:id
```

### AI Endpoints (Edge Functions)
```
POST /ai/classify-signal    { content } → { severity, sentiment, product_area }
POST /ai/suggest-clusters   { workspace_id } → [{ cluster_name, signal_ids }]
POST /ai/generate-artifact  { decision_id, type } → { content }
POST /ai/ask                { workspace_id, question, context } → { answer, sources }
POST /ai/score-opportunity  { problem_id } → { opportunity_score, component_scores }
```

---

## 22. NOTIFICATIONS & EMAIL

### Email Types (via Resend)

#### 1. Weekly Digest Email
- **Trigger:** Cron job, every weekday morning (workspace's chosen digest day)
- **Subject:** "Your Astrix Weekly Digest — {workspace_name}"
- **Content:** Configurable sections (signals summary, top opportunity, reviews due, recent decisions)
- **Condition:** Only send if `digest_prefs.enabled = true` AND `digest_prefs.day = today`

#### 2. Day 7 Launch Reminder
- **Trigger:** 7 days after `launch.launched_at`
- **Subject:** "⏰ Day 7 review due: {launch.title}"
- **Content:** Link to launch detail + brief summary of what to measure

#### 3. Day 30 Launch Reminder  
- **Trigger:** 30 days after `launch.launched_at`
- **Subject:** "📊 Day 30 verdict due: {launch.title}"
- **Content:** Link to verdict form + summary of Day 7 results

#### 4. High-Priority Signal Alert
- **Trigger:** When a new signal is ingested with `severity = 'Critical'`
- **Subject:** "🚨 Critical signal ingested: {signal.product_area}"
- **Condition:** Only if `notification_prefs.email_high_priority_signal = true`

#### 5. Invite Email
- **Trigger:** When workspace owner invites a member
- **Subject:** "{inviter_name} invited you to {workspace_name} on Astrix"
- **Content:** Accept invitation link + workspace description

#### 6. Password Reset Email
- **Trigger:** `/forgot-password` form submission
- **Subject:** "Reset your Astrix password"
- **Content:** Reset link (expires 1 hour)

#### 7. Welcome Email
- **Trigger:** New user signup
- **Subject:** "Welcome to Astrix AI 👋"
- **Content:** Onboarding checklist link, 3-step guide, resource links

### Notification Preferences Schema
```json
{
  "email_weekly_digest": true,
  "email_day7_reminder": true,
  "email_day30_reminder": true,
  "email_high_priority_signal": true,
  "email_new_decision": false,
  "inapp_score_change": true,
  "inapp_team_decisions": true,
  "inapp_daily_triage": false,
  "inapp_verdict_due": true
}
```

### Digest Preferences Schema
```json
{
  "enabled": true,
  "day": "Monday",
  "include_signals": true,
  "include_opportunities": true,
  "include_reviews_due": true,
  "include_decisions": true,
  "frequency": "weekly"
}
```

---

## 23. RETENTION MECHANISMS

These are the features specifically designed to bring users back week after week:

### 1. Weekly Email Digest (Pull-back mechanism)
Every Monday (configurable), each active user receives a curated summary. Even if they haven't visited in a week, they see:
- "12 new signals came in — 3 are Critical"
- "2 launches need your Day 30 review"
- "Top opportunity score is 87 — still unaddressed"

**Why it works:** Each item is a reason to open the app.

### 2. Reviews Due Dashboard Widget (Daily reminder)
The "Reviews Due" widget on the dashboard shows pending Day 7/30 reviews. As launches accumulate, there are always reviews due.

**Why it works:** Creates a recurring obligation tied to the user's own work.

### 3. Onboarding Checklist (Activation driver)
First 7 steps guide new users to their "aha moment" — seeing their first scored opportunity. Completion is tracked and displayed.

**Why it works:** Users who complete all 7 steps are significantly more likely to retain because they've invested in the system.

### 4. Decision Win Rate (Personal investment)
The dashboard shows the user's own win rate over time: "You've correctly called 8/10 decisions (80% win rate)". This creates personal investment in the platform.

**Why it works:** PM identity is tied to being a good decision-maker. Seeing their track record makes leaving feel like losing data.

### 5. Saved Filter Presets (Workflow integration)
When a PM saves their favorite filter combination ("Critical signals, last 30 days"), they've personalized the tool. Their workflow now depends on it.

**Why it works:** Personalization creates switching cost.

### 6. Integrations (Data gravity)
Once Intercom/Zendesk/Slack is connected, signals flow in automatically. The database grows even when the user isn't active — pulling them back to review new data.

**Why it works:** Auto-growing data creates FOMO and regular return triggers.

### 7. Launch Accountability Cadence
The Day 7 → Day 30 → Verdict cycle creates a structured 30-day commitment per launch. Users must return to complete their own work.

**Why it works:** The user has publicly committed (to their team) to completing these reviews.

### 8. Audit Log (Team accountability)
All actions are logged. Team members see what their colleagues have done. Social visibility creates accountability.

---

## 24. SECURITY & PERMISSIONS

### Row-Level Security (Supabase RLS)
Every database table must have RLS policies:
```sql
-- Example: users can only see signals in their workspace
CREATE POLICY "Users see own workspace signals" ON signals
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );
```

Apply same policy pattern to: accounts, problems, opportunities, decisions, artifacts, launches, activity_logs.

### Role-Based Access Control
| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View all data | ✅ | ✅ | ✅ | ✅ |
| Create signals/problems/decisions | ✅ | ✅ | ✅ | ❌ |
| Edit/delete own records | ✅ | ✅ | ✅ | ❌ |
| Edit/delete others' records | ✅ | ✅ | ❌ | ❌ |
| Manage team members | ✅ | ✅ | ❌ | ❌ |
| Manage workspace settings | ✅ | ✅ | ❌ | ❌ |
| Billing management | ✅ | ❌ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |

### API Security
- All API endpoints require valid JWT (Supabase session token)
- JWT verified server-side on every request
- Plan tier enforcement: check workspace subscription before plan-gated features
- Rate limiting: 100 req/min per workspace (stricter on AI endpoints: 20/min)

### Data Privacy
- All workspace data is isolated by `workspace_id`
- Signals/accounts are never shared between workspaces
- AI model calls: data is sent per-request, not stored by AI provider
- CSV uploads: processed in memory, stored result only
- OAuth tokens for integrations: encrypted at rest

---

## 25. FEATURE FLAG MATRIX

Complete list of every feature in the app and which plan it requires:

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|---------|------------|
| Signals (up to 100) | ✅ | ✅ | ✅ | ✅ |
| Signals (up to 2,000) | ❌ | ✅ | ✅ | ✅ |
| Signals (up to 10,000) | ❌ | ❌ | ✅ | ✅ |
| Manual signal entry | ✅ | ✅ | ✅ | ✅ |
| CSV upload (signals) | ✅ | ✅ | ✅ | ✅ |
| AI signal classification | ❌ | ✅ | ✅ | ✅ |
| Accounts (up to 25) | ✅ | ✅ | ✅ | ✅ |
| Accounts (up to 500) | ❌ | ✅ | ✅ | ✅ |
| Unlimited accounts | ❌ | ❌ | ✅ | ✅ |
| Problems (up to 10) | ✅ | ✅ | ✅ | ✅ |
| Unlimited problems | ❌ | ✅ | ✅ | ✅ |
| AI problem clustering | ❌ | ✅ | ✅ | ✅ |
| Opportunities | ✅ | ✅ | ✅ | ✅ |
| Opportunity Compare Mode | ❌ | ✅ | ✅ | ✅ |
| What-If Score Simulator | ❌ | ✅ | ✅ | ✅ |
| Decisions (up to 5) | ✅ | ✅ | ✅ | ✅ |
| Unlimited decisions | ❌ | ✅ | ✅ | ✅ |
| Artifact Studio (AI) | ❌ | ✅ | ✅ | ✅ |
| Version history on artifacts | ❌ | ✅ | ✅ | ✅ |
| Launch tracking | ✅ | ✅ | ✅ | ✅ |
| Post-launch reviews | ✅ | ✅ | ✅ | ✅ |
| Proof summary card | ❌ | ✅ | ✅ | ✅ |
| Ask AI Assistant | ❌ | ✅ | ✅ | ✅ |
| Integrations (0) | ✅ | ❌ | ❌ | ❌ |
| Integrations (up to 3) | ❌ | ✅ | ❌ | ❌ |
| Integrations (up to 10) | ❌ | ❌ | ✅ | ❌ |
| Unlimited integrations | ❌ | ❌ | ❌ | ✅ |
| Jira / Linear integration | ❌ | ✅ | ✅ | ✅ |
| CSV export | ❌ | ✅ | ✅ | ✅ |
| Saved filter presets | ❌ | ✅ | ✅ | ✅ |
| Weekly email digest | ✅ | ✅ | ✅ | ✅ |
| Custom notification prefs | ❌ | ✅ | ✅ | ✅ |
| Team members (up to 2) | ✅ | ❌ | ❌ | ❌ |
| Team members (up to 5) | ❌ | ✅ | ❌ | ❌ |
| Unlimited team members | ❌ | ❌ | ✅ | ✅ |
| Audit log (30 days) | ✅ | ✅ | ❌ | ❌ |
| Audit log (unlimited) | ❌ | ❌ | ✅ | ✅ |
| SSO (SAML) | ❌ | ❌ | ❌ | ✅ |
| Dedicated customer success | ❌ | ❌ | ❌ | ✅ |
| Custom contracts / SLA | ❌ | ❌ | ❌ | ✅ |

---

## APPENDIX: Frontend File Structure

```
src/
├── App.tsx                          # Root + React Router (38 routes)
├── main.tsx                         # Entry point
├── index.css                        # Global styles + Tailwind imports
├── types.ts                         # TypeScript interfaces for all entities
├── lib/
│   ├── api.ts                       # ALL mock data + API functions (replace for backend)
│   └── utils.ts                     # formatCurrency, cn(), etc.
├── utils/
│   └── csvExport.ts                 # CSV export utility (new)
├── hooks/
│   └── usePlan.ts                   # Plan tier detection + feature flags
├── contexts/
│   ├── AuthContext.tsx              # Authentication state
│   ├── WorkspaceContext.tsx         # Active workspace state
│   └── ToastContext.tsx             # Toast notification system
├── layouts/
│   ├── AppLayout.tsx                # Dark sidebar layout for app
│   ├── AuthLayout.tsx               # Centered card for auth pages
│   ├── MainLayout.tsx               # Public header + footer
│   └── OnboardingLayout.tsx         # Onboarding step progress
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx       # Redirect to /login if no session
│   ├── modals/
│   │   ├── UpgradeModal.tsx         # Plan upgrade prompt
│   │   ├── CsvUploadModal.tsx       # CSV file upload UI
│   │   └── JiraLinearModal.tsx      # Push to Jira/Linear (new)
│   └── ui/
│       ├── AIBadge.tsx              # "AI Suggested" badge component
│       ├── Skeleton.tsx             # Loading skeleton components
│       └── OnboardingChecklist.tsx  # Floating checklist widget (new)
├── pages/
│   ├── marketing/
│   │   ├── Home.tsx
│   │   ├── Pricing.tsx
│   │   ├── Contact.tsx
│   │   ├── Changelog.tsx
│   │   └── IntegrationsPage.tsx
│   ├── legal/
│   │   ├── Privacy.tsx
│   │   └── Terms.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── AcceptInvitation.tsx
│   ├── onboarding/
│   │   ├── OnboardingStep1.tsx
│   │   ├── OnboardingStep2.tsx
│   │   └── OnboardingStep3.tsx
│   └── app/
│       ├── Dashboard.tsx            # Decision Win Rate widget (new)
│       ├── SignalExplorer.tsx       # CSV export + filter presets (new)
│       ├── SignalNew.tsx
│       ├── SignalDetail.tsx
│       ├── AccountsList.tsx         # CSV export (new)
│       ├── AccountDetail.tsx
│       ├── ProblemsListPage.tsx
│       ├── ProblemDetail.tsx
│       ├── OpportunitiesList.tsx    # CSV export + filter presets (new)
│       ├── OpportunityDetail.tsx
│       ├── EvidenceView.tsx
│       ├── DecisionsHistory.tsx
│       ├── DecisionDetail.tsx       # Jira/Linear push (new)
│       ├── ArtifactStudio.tsx
│       ├── ArtifactDetail.tsx
│       ├── PostLaunchTracker.tsx
│       ├── LaunchDetail.tsx
│       ├── AskAssistant.tsx
│       ├── IntegrationsHub.tsx      # Jira/Linear now available (updated)
│       └── Settings.tsx             # Notifications + Email Digest tabs (new)
```

---

## APPENDIX: Key Design Tokens

```css
--astrix-teal: #00C49A        /* Primary brand color — CTAs, active states */
--brand-blue: #2563EB         /* Secondary — launches, links */
--astrix-gold: #F59E0B         /* ARR values, premium highlights */
--astrix-darkTeal: #009B7A    /* Hover states for teal */

/* Typography */
font-heading: 'Syne', sans-serif    /* Large headings, stats */
font-body: 'Inter', sans-serif      /* All body text */

/* Radii */
rounded-2xl = 16px   /* Card containers */
rounded-xl  = 12px   /* Inputs, buttons */
rounded-lg  = 8px    /* Small chips, badges */

/* Shadows */
shadow-sm = 0 1px 2px rgba(0,0,0,0.05)    /* Cards */
```

---

*Document version: 3.0 | Frontend completed June 2026 | Ready for Supabase backend implementation*
*All 7 new features built and production-verified (0 TypeScript errors, 0 build errors)*
