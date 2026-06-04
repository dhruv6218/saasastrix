import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { ArrowRight, CheckCircle2, Zap, Plug, Search } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'CRM', 'Support', 'Analytics', 'Feedback', 'Communication', 'Data'];

const INTEGRATIONS = [
  { name: 'Salesforce', category: 'CRM', icon: '☁️', desc: 'Pull account health, ARR, and renewal data automatically into Astrix.', popular: true, available: true },
  { name: 'HubSpot', category: 'CRM', icon: '🔶', desc: 'Sync contacts, companies and deals to enrich account profiles.', popular: true, available: true },
  { name: 'Intercom', category: 'Support', icon: '💬', desc: 'Ingest support conversations as signals, auto-classified by sentiment.', popular: true, available: true },
  { name: 'Zendesk', category: 'Support', icon: '🎧', desc: 'Pull support tickets into Astrix as structured product signals.', popular: false, available: true },
  { name: 'Gong', category: 'Feedback', icon: '🔔', desc: 'Extract pain points and product feedback from recorded sales calls.', popular: true, available: true },
  { name: 'Slack', category: 'Communication', icon: '📱', desc: 'Monitor channels for customer mentions. Get weekly Astrix digests in Slack.', popular: true, available: true },
  { name: 'Typeform', category: 'Feedback', icon: '📋', desc: 'Automatically ingest survey responses as signals with account context.', popular: false, available: true },
  { name: 'SurveyMonkey', category: 'Feedback', icon: '🐒', desc: 'Pull NPS and CSAT scores into your signal stream.', popular: false, available: true },
  { name: 'Notion', category: 'Data', icon: '📝', desc: 'Push decision memos and PRDs to your Notion workspace automatically.', popular: true, available: true },
  { name: 'Mixpanel', category: 'Analytics', icon: '📊', desc: 'Add quantitative feature usage context to your product signal analysis.', popular: false, available: true },
  { name: 'Amplitude', category: 'Analytics', icon: '📈', desc: 'Enrich problems with retention, activation, and feature adoption data.', popular: false, available: true },
  { name: 'Segment', category: 'Data', icon: '⚡', desc: 'Route customer events from Segment into Astrix as structured signals.', popular: false, available: true },
  { name: 'Freshdesk', category: 'Support', icon: '🌿', desc: 'Import support tickets and CSAT scores as product signals.', popular: false, available: true },
  { name: 'Jira', category: 'Data', icon: '🔵', desc: 'Two-way sync — create tickets from decisions and track implementation.', popular: true, available: false },
  { name: 'Linear', category: 'Data', icon: '🟣', desc: 'Link decisions to Linear projects — from decision to shipped feature.', popular: false, available: false },
  { name: 'GitHub', category: 'Data', icon: '⚫', desc: 'Attach PRs and issues to decisions for a full evidence-to-code trail.', popular: false, available: false },
];

const BENEFITS = [
  { title: 'Zero manual work', desc: 'Signals flow in automatically the moment a ticket, call, or survey lands in your tools.' },
  { title: 'Full account context', desc: 'Every signal is enriched with ARR, plan, health score, and renewal date from your CRM.' },
  { title: 'Auto-classification', desc: 'Astrix AI parses sentiment, severity, and product area from every ingested signal.' },
  { title: 'One place, every source', desc: 'Intercom, Gong, Zendesk, Typeform — all normalised into one evidence stream.' },
];

export const Integrations = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal(0.05);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = activeCategory === 'All' || i.category === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const available = INTEGRATIONS.filter(i => i.available).length;

  return (
    <MainLayout>
      {/* Hero */}
      <div className="bg-gray-50 border-b border-gray-200 pt-24 pb-20" ref={heroRef}>
        <div className={`max-w-[900px] mx-auto px-6 text-center transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> {available}+ Integrations
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-5 leading-none">
            Your signal stream.<br />
            <span className="text-brand-blue">Every source.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-10">
            Connect the tools your team already uses and Astrix will automatically ingest, classify, and route every signal — zero copy-paste, zero context loss.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-blue-700 transition-colors shadow-glow-blue flex items-center justify-center gap-2">
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/pricing" className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-base border border-gray-200 hover:border-brand-blue hover:text-brand-blue transition-colors shadow-sm flex items-center justify-center gap-2">
              View Plans
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-[1100px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BENEFITS.map((b, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-brand-blue/30 transition-colors">
            <CheckCircle2 className="w-6 h-6 text-brand-blue mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="max-w-[1200px] mx-auto px-6 pb-24" ref={gridRef}>
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900 mb-2">Browse integrations</h2>
          <p className="text-gray-500 font-medium">Connect your existing tools in minutes — no code required.</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-brand-blue transition-all">
            <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search integrations..."
              className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-brand-blue text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-blue/40'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all duration-700 ${gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {filtered.map((integration, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-brand-blue/30 hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl">
                  {integration.icon}
                </div>
                <div className="flex gap-1">
                  {integration.popular && (
                    <span className="text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-widest">Popular</span>
                  )}
                  {!integration.available && (
                    <span className="text-[9px] font-black bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded uppercase tracking-widest">Soon</span>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{integration.name}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4 flex-1">{integration.desc}</p>
              <Link
                to="/signup"
                className={`w-full py-2 rounded-lg text-xs font-bold text-center transition-colors ${integration.available ? 'bg-brand-blue text-white hover:bg-blue-700' : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-default pointer-events-none'}`}
              >
                {integration.available ? (
                  <span className="flex items-center justify-center gap-1.5"><Plug className="w-3.5 h-3.5" /> Connect</span>
                ) : 'Coming Soon'}
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <Plug className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-900 mb-1">No integrations found</p>
            <p className="text-sm text-gray-500">Try a different search or category.</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            Don't see your tool?
          </h2>
          <p className="text-gray-400 font-medium mb-8 text-lg">
            We add integrations fast when there's demand. Request yours and we'll build it.
          </p>
          <Link to="/contact" className="bg-astrix-teal text-white px-8 py-4 rounded-2xl font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 max-w-xs mx-auto shadow-md">
            Request Integration <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};
