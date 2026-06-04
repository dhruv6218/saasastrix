import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Sparkles, Bug, Zap, ArrowRight, Bell, CheckCircle2, Lock } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useToast } from '../contexts/ToastContext';

const releases = [
  {
    version: 'v1.4',
    date: 'June 2026',
    badge: 'Latest',
    badgeCls: 'bg-astrix-teal text-white',
    items: [
      { type: 'new', text: 'Integrations Hub — connect Intercom, Slack, Gong, Salesforce, and 14 more data sources directly to your signal stream.' },
      { type: 'new', text: 'Ask Assistant — natural language interface to query opportunities, affected accounts, and decisions from your workspace.' },
      { type: 'new', text: 'Account filters — filter accounts by plan tier, ARR range, and health status for faster segmentation.' },
      { type: 'new', text: 'Opportunity filters — filter ranked opportunities by score range and recommended action (Build / Fix / Experiment).' },
      { type: 'improved', text: 'Dashboard opportunity cards now show key account names directly in the ranked list.' },
      { type: 'improved', text: 'Pricing updated to Free / Pro / Business / Enterprise tiers with clearer limits and lower entry price.' },
      { type: 'improved', text: 'Signal Explorer now supports date-range filtering (From / To) for temporal analysis.' },
      { type: 'fixed', text: 'UpgradeModal plan names aligned across all gated features (Pro / Business / Enterprise).' },
    ],
  },
  {
    version: 'v1.3',
    date: 'May 2026',
    badge: null,
    badgeCls: '',
    items: [
      { type: 'new', text: 'Account Detail page — 4-tab layout: Overview, Signals, Problems & Opportunities, Launches.' },
      { type: 'new', text: 'Problem Detail Metrics tab — signal trend chart with ECharts and YoY growth stats.' },
      { type: 'new', text: 'Signal Explorer date-range filter — narrow signals by From/To dates for time-boxed analysis.' },
      { type: 'improved', text: 'Opportunity scoring now surfaces top accounts from problem signal clusters.' },
      { type: 'improved', text: 'Vite config: Babel plugin limited to dev environment only (security hardening).' },
      { type: 'fixed', text: 'ARR rollup display bug in Evidence View timeline resolved.' },
    ],
  },
  {
    version: 'v1.2',
    date: 'April 2026',
    badge: null,
    badgeCls: '',
    items: [
      { type: 'new', text: 'Post-Launch Tracker with Day 7 / Day 30 measurement windows and PM verdict entry.' },
      { type: 'new', text: 'Launch Detail page — before/after signal charts, outcome entry forms, and AI Review.' },
      { type: 'new', text: 'Evidence View — full timeline chart, sentiment bar, signal flagging, and account context.' },
      { type: 'new', text: 'Artifact Studio — PRD and Decision Memo viewer with version history and export.' },
      { type: 'improved', text: 'Decision Detail now links directly to Artifact Studio and Post-Launch Tracker.' },
      { type: 'fixed', text: 'Workspace context initialisation race condition on fast page loads resolved.' },
    ],
  },
  {
    version: 'v1.1',
    date: 'March 2026',
    badge: null,
    badgeCls: '',
    items: [
      { type: 'new', text: 'Compare Mode in Opportunities — side-by-side analysis of up to 3 opportunities.' },
      { type: 'new', text: 'Decision modal inline in Opportunities list — commit Build / Fix / Experiment / Defer / Reject with rationale.' },
      { type: 'new', text: 'Decisions History page with full audit trail and action tagging.' },
      { type: 'improved', text: 'Opportunity scoring algorithm tuned: ARR weight increased from 20% to 30%.' },
      { type: 'improved', text: 'Signal Explorer: multi-column sort, pagination, and CSV export added.' },
      { type: 'fixed', text: 'Free plan opportunity lock overlay z-index conflict with comparison table fixed.' },
    ],
  },
  {
    version: 'v1.0',
    date: 'February 2026',
    badge: 'Initial Launch',
    badgeCls: 'bg-gray-900 text-white',
    items: [
      { type: 'new', text: 'Signal Explorer — ingest, classify, and explore product feedback from any source.' },
      { type: 'new', text: 'Problems List — AI-clustered problems from raw signals with severity, trend, and ARR impact.' },
      { type: 'new', text: 'Opportunities Ranked List — scored by Pain × Demand × ARR with recommended action.' },
      { type: 'new', text: 'Accounts List — CRM context layer with ARR, plan, and health score.' },
      { type: 'new', text: 'Dashboard with top opportunity hero, ranked list, and active launches summary.' },
      { type: 'new', text: 'Onboarding flow — 3-step setup for workspace creation and first data import.' },
      { type: 'new', text: 'Auth flows — signup, login, password reset, team invitation acceptance.' },
    ],
  },
];

const UPCOMING = [
  'Jira two-way sync — link Astrix decisions directly to Jira tickets',
  'Linear integration — track implementation from decision to shipped',
  'GitHub connector — attach PRs and issues to decisions for full evidence-to-code trail',
  'Slack digest — weekly AI summary of new signals, overdue reviews, and win/loss stats',
  'API access — query your workspace data programmatically via REST',
  'Role-based access control — granular Owner / Admin / Maker / Viewer permissions',
];

const typeConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  new: { label: 'New', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Sparkles },
  improved: { label: 'Improved', cls: 'bg-teal-50 text-teal-700 border-teal-200', icon: Zap },
  fixed: { label: 'Fixed', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Bug },
};

export const Changelog = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    addToast('Subscribed! You\'ll get notified on every release.', 'success');
    setEmail('');
  };

  return (
    <MainLayout>
      {/* Hero */}
      <div className="bg-gray-50 border-b border-gray-200 pt-24 pb-16" ref={heroRef}>
        <div className={`max-w-[800px] mx-auto px-6 text-center transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-astrix-teal/10 text-astrix-teal px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Product Changelog
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-4 leading-none">
            What's new in<br /><span className="text-astrix-teal">Astrix AI</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto mb-8">
            Every improvement, fix, and new feature we ship — in one place. We build in public.
          </p>

          {/* Subscribe */}
          <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-astrix-teal shadow-sm"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-astrix-teal transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Bell className="w-4 h-4" /> Notify Me
            </button>
          </form>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />

          <div className="space-y-16">
            {releases.map((release, ri) => (
              <div key={ri} className="relative md:pl-16">
                {/* Dot */}
                <div className={`absolute left-3 top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 hidden md:block ${ri === 0 ? 'ring-astrix-teal bg-astrix-teal' : 'ring-gray-300 bg-white'}`} />

                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <h2 className="font-heading text-2xl font-black text-gray-900">{release.version}</h2>
                  {release.badge && (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${release.badgeCls}`}>{release.badge}</span>
                  )}
                  <span className="text-sm font-medium text-gray-400">{release.date}</span>
                </div>

                <div className="space-y-3">
                  {release.items.map((item, ii) => {
                    const tc = typeConfig[item.type];
                    const Icon = tc.icon;
                    return (
                      <div key={ii} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-colors">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 mt-0.5 ${tc.cls}`}>
                          <Icon className="w-2.5 h-2.5" /> {tc.label}
                        </span>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">{item.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="mt-20 bg-gray-900 text-white rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-astrix-teal/20 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-astrix-teal" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold">Coming next</h3>
              <p className="text-gray-400 text-sm font-medium">On the roadmap — no ETAs, we ship when it's ready.</p>
            </div>
          </div>
          <div className="space-y-3">
            {UPCOMING.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-300">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400 font-medium">Have a feature request?</p>
            <a href="/contact" className="flex items-center gap-1.5 text-sm font-bold text-astrix-teal hover:underline">
              Tell us <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
