import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Sparkles, Zap, Wrench, ArrowRight, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

type TagType = 'New' | 'Improved' | 'Fixed' | 'Coming';

const TAG_STYLES: Record<TagType, string> = {
  New: 'bg-blue-50 text-blue-700 border border-blue-200',
  Improved: 'bg-purple-50 text-purple-700 border border-purple-200',
  Fixed: 'bg-green-50 text-green-700 border border-green-200',
  Coming: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const TAG_ICONS: Record<TagType, React.ElementType> = {
  New: Sparkles,
  Improved: Zap,
  Fixed: Wrench,
  Coming: Clock,
};

interface ChangeItem {
  tag: TagType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  headline: string;
  description: string;
  changes: ChangeItem[];
  highlight?: boolean;
}

const RELEASES: Release[] = [
  {
    version: 'v1.4',
    date: 'June 2026',
    headline: 'Post-Launch Accountability — Proof Summaries',
    description: 'The biggest update yet: every launch now closes with a structured Proof Summary — auto-generated evidence that your decision worked (or didn\'t), tied to before/after metrics, verdict, and PM rationale.',
    highlight: true,
    changes: [
      { tag: 'New', text: 'Proof Summary auto-generation after Final Verdict submission' },
      { tag: 'New', text: 'Baseline, Day 7, Day 30 outcome measurement forms on Launch Detail' },
      { tag: 'New', text: 'Verdict values: Solved, Partially Solved, Not Solved, Regressed' },
      { tag: 'New', text: 'Launch checklist with checkpoint progress tracker' },
      { tag: 'New', text: 'Delta summary card showing before/after signal count and ARR reduction' },
      { tag: 'Improved', text: 'Dashboard Reviews Due banner now surfaces overdue launches above the fold' },
      { tag: 'Improved', text: 'Notification center updated with launch review reminders' },
      { tag: 'Fixed', text: 'Launch status not updating after Day 30 review was submitted' },
    ],
  },
  {
    version: 'v1.3',
    date: 'May 2026',
    headline: 'Decision Studio + AI Artifact Generation',
    description: 'Decision records now ship with structured Assumptions, Risks, and Alternatives panels. AI-generated Decision Memos and PRD Skeletons are available from any Decision Detail page.',
    changes: [
      { tag: 'New', text: 'Decision Memo artifact type with structured sections (Context, Problem, Evidence, Alternatives, Risks)' },
      { tag: 'New', text: 'PRD Skeleton artifact type (Problem statement, Goals, Scope, Success Metrics)' },
      { tag: 'New', text: 'User Stories artifact with As a / I want / So that format' },
      { tag: 'New', text: 'Version history (last 3 versions) on all artifact types' },
      { tag: 'New', text: 'Copy to clipboard on all artifact content panels' },
      { tag: 'Improved', text: 'Decision Detail now shows full evidence panel linking to signals and accounts' },
      { tag: 'Improved', text: 'Decision action types expanded: Build, Fix, Experiment, Defer, Reject' },
      { tag: 'Fixed', text: 'AI badge not appearing consistently on AI-generated content' },
      { tag: 'Fixed', text: 'Artifact editor losing content on browser back navigation' },
    ],
  },
  {
    version: 'v1.2',
    date: 'April 2026',
    headline: 'Opportunity Scoring + Compare Mode',
    description: 'Opportunities now expose a fully transparent score breakdown with 5 components. Compare mode lets teams evaluate 2–3 opportunities side-by-side before committing to a decision.',
    changes: [
      { tag: 'New', text: 'Transparent 100-point scoring breakdown (Signal Count, Affected Accounts, ARR at Risk, Severity, Recency)' },
      { tag: 'New', text: 'Compare mode for 2–3 opportunities side-by-side' },
      { tag: 'New', text: 'What-if score simulator on Opportunity Detail' },
      { tag: 'New', text: 'Recommended action label (Build / Fix / Experiment / Defer)' },
      { tag: 'New', text: 'Manual score adjustment with required audit note' },
      { tag: 'Improved', text: 'Opportunities list now sortable by score, ARR, affected accounts' },
      { tag: 'Improved', text: 'Score component bars are interactive with hover tooltips' },
      { tag: 'Fixed', text: 'Opportunity score not recalculating after new signals were linked to a problem' },
    ],
  },
  {
    version: 'v1.1',
    date: 'March 2026',
    headline: 'Problems — Merge, Split, and Trend Charts',
    description: 'Problems now support merge and split workflows, an AI clustering suggestions panel, and a signal trend chart showing volume over time. Account impact view now shows ARR at risk per problem.',
    changes: [
      { tag: 'New', text: 'Problem merge flow — combines two problems, retaining all signal links' },
      { tag: 'New', text: 'Problem split workflow — separates signals into two distinct problems' },
      { tag: 'New', text: 'AI clustering suggestions panel — proposes groupings for recent uncategorized signals' },
      { tag: 'New', text: 'Signal trend chart on Problem Detail (30-day rolling volume)' },
      { tag: 'New', text: 'ARR at risk estimate on Problems List and Account Detail' },
      { tag: 'Improved', text: 'Problem Detail tabs redesigned: Overview, Evidence, Accounts, Metrics, History, Comments' },
      { tag: 'Improved', text: 'Signal-to-problem linking now supports bulk selection from Signal Explorer' },
      { tag: 'Fixed', text: 'Unlinked signal count mismatch on dashboard after bulk operations' },
    ],
  },
  {
    version: 'v1.0',
    date: 'February 2026',
    headline: 'Core Loop Launch — Signals to Decisions',
    description: 'The first public release of ASTRIX AI. Covers the complete core loop: import signals from CSV or manual entry, link to accounts, group into problems, score opportunities, and commit a decision.',
    changes: [
      { tag: 'New', text: 'Signal Explorer with CSV import, manual creation, search, and filters' },
      { tag: 'New', text: 'Accounts import via CSV with domain-based signal matching suggestions' },
      { tag: 'New', text: 'Problems list with signal linking, severity, and status tracking' },
      { tag: 'New', text: 'Opportunities ranked list with auto-generated scores' },
      { tag: 'New', text: 'Decision records: action type, rationale, assumptions, risks, alternatives' },
      { tag: 'New', text: 'Dashboard with KPI row, signal trend chart, and context-sensitive quick actions' },
      { tag: 'New', text: 'Workspace creation with timezone selection and sample workspace seeding' },
      { tag: 'New', text: 'In-app notification center with launch review reminders' },
    ],
  },
];

const COMING_NEXT: ChangeItem[] = [
  { tag: 'Coming', text: 'Integrations: Intercom, Zendesk, Salesforce, Linear signal ingestion pipelines' },
  { tag: 'Coming', text: 'Semantic signal search with embedding-based similarity' },
  { tag: 'Coming', text: 'PDF export for proof summaries and decision memos' },
  { tag: 'Coming', text: 'Collaborative comments and @mentions on Problems and Decisions' },
  { tag: 'Coming', text: 'SSO / SAML for Enterprise workspaces' },
  { tag: 'Coming', text: 'Advanced analytics dashboard: cohort analysis and portfolio view' },
  { tag: 'Coming', text: 'Mobile app (iOS + Android)' },
];

const Tag: React.FC<{ type: TagType }> = ({ type }) => {
  const Icon = TAG_ICONS[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${TAG_STYLES[type]}`}>
      <Icon className="w-2.5 h-2.5" />
      {type}
    </span>
  );
};

export const Changelog = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const [activeFilter, setActiveFilter] = useState<TagType | 'All'>('All');

  const filters: (TagType | 'All')[] = ['All', 'New', 'Improved', 'Fixed'];

  return (
    <MainLayout>
      <div className="pt-32 pb-20 min-h-screen bg-white">
        <div className="max-w-[900px] mx-auto px-6 md:px-8">

          {/* Hero */}
          <div ref={heroRef} className={`mb-16 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3 h-3" /> Product Updates
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-black tracking-tighter text-gray-900 mb-4 leading-tight">
              Changelog
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-xl">
              Every release makes the product accountability loop tighter. Track what's new, what's improved, and what's coming next.
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-12 flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">Filter:</span>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === f ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Release timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-blue via-gray-200 to-transparent hidden md:block" />

            <div className="space-y-16">
              {RELEASES.map((release, idx) => {
                const filteredChanges = activeFilter === 'All'
                  ? release.changes
                  : release.changes.filter(c => c.tag === activeFilter);
                if (filteredChanges.length === 0) return null;

                return (
                  <div key={release.version} className="relative md:pl-10">
                    {/* Dot */}
                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 hidden md:block ${release.highlight ? 'bg-brand-blue border-brand-blue shadow-glow-blue' : 'bg-white border-gray-300'}`} />

                    {/* Release card */}
                    <div className={`${release.highlight ? 'border-brand-blue/20 bg-gradient-to-br from-blue-50/60 to-white' : 'border-gray-200 bg-white'} border rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow`}
                      style={{ animationDelay: `${idx * 100}ms` }}>

                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`font-heading text-2xl font-black ${release.highlight ? 'text-brand-blue' : 'text-gray-900'}`}>
                              {release.version}
                            </span>
                            {release.highlight && (
                              <span className="text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white px-2 py-0.5 rounded-full">Latest</span>
                            )}
                            <span className="text-xs font-bold text-gray-400">{release.date}</span>
                          </div>
                          <h2 className="font-heading text-xl md:text-2xl font-black text-gray-900 leading-tight">{release.headline}</h2>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">{release.description}</p>

                      <ul className="space-y-2.5">
                        {filteredChanges.map((change, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-3">
                            <Tag type={change.tag} />
                            <span className="text-sm text-gray-700 font-medium leading-relaxed">{change.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coming Next */}
          {(activeFilter === 'All' || activeFilter === 'Coming') && (
            <div className="mt-16 border border-dashed border-amber-300 rounded-2xl p-6 md:p-8 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading text-xl font-black text-gray-900">Coming Next</h3>
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Roadmap</span>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6">These features are scoped and in the queue — not committed dates, but active intent.</p>
              <ul className="space-y-2.5">
                {COMING_NEXT.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Tag type="Coming" />
                    <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center bg-gray-900 rounded-2xl p-8 md:p-12">
            <h3 className="font-heading text-2xl md:text-3xl font-black text-white mb-3">Ready to close the loop?</h3>
            <p className="text-gray-400 font-medium mb-6">Import your first signals and get a ranked opportunity list in under 10 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-white/20 transition-colors">
                See pricing <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};
