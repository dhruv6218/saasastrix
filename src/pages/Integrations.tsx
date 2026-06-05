import React, { useState, useMemo } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Search, ArrowRight, CheckCircle2, Zap, Lock, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  status: 'available' | 'coming_soon' | 'popular';
  plan: 'free' | 'pro' | 'business' | 'enterprise';
}

const INTEGRATIONS: Integration[] = [
  { id: 'intercom', name: 'Intercom', description: 'Sync support conversations and customer feedback directly into your signal stream.', category: 'Support', logo: '💬', status: 'coming_soon', plan: 'pro' },
  { id: 'zendesk', name: 'Zendesk', description: 'Pull ticket data and customer pain signals from your support queue automatically.', category: 'Support', logo: '🎫', status: 'coming_soon', plan: 'pro' },
  { id: 'freshdesk', name: 'Freshdesk', description: 'Ingest support tickets and CSAT feedback as structured product signals.', category: 'Support', logo: '🟢', status: 'coming_soon', plan: 'pro' },
  { id: 'salesforce', name: 'Salesforce', description: 'Bring deal notes, opportunity fields, and CS activity into your evidence loop.', category: 'CRM', logo: '☁️', status: 'coming_soon', plan: 'business' },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contact notes, deal stages, and NPS scores as tagged product signals.', category: 'CRM', logo: '🟠', status: 'coming_soon', plan: 'business' },
  { id: 'attio', name: 'Attio', description: 'Import customer attributes and activity timelines to enrich account matching.', category: 'CRM', logo: '⚡', status: 'coming_soon', plan: 'pro' },
  { id: 'slack', name: 'Slack', description: 'Monitor specific channels and threads for product feedback with AI triage.', category: 'Collaboration', logo: '💼', status: 'coming_soon', plan: 'pro' },
  { id: 'notion', name: 'Notion', description: 'Import existing feedback databases and research notes as classified signals.', category: 'Collaboration', logo: '📝', status: 'coming_soon', plan: 'pro' },
  { id: 'linear', name: 'Linear', description: 'Link signals to Linear issues and create issues from decisions automatically.', category: 'Engineering', logo: '🔷', status: 'coming_soon', plan: 'business' },
  { id: 'jira', name: 'Jira', description: 'Connect decisions to Jira epics and track delivery against product commitments.', category: 'Engineering', logo: '🔵', status: 'coming_soon', plan: 'business' },
  { id: 'github', name: 'GitHub', description: 'Map PRs and releases to launches for automatic baseline detection.', category: 'Engineering', logo: '⚫', status: 'coming_soon', plan: 'enterprise' },
  { id: 'posthog', name: 'PostHog', description: 'Pull usage data and event metrics to verify outcome claims in verdicts.', category: 'Analytics', logo: '🦔', status: 'coming_soon', plan: 'business' },
  { id: 'mixpanel', name: 'Mixpanel', description: 'Pull event and retention metrics into Day 7 and Day 30 outcome reviews.', category: 'Analytics', logo: '📊', status: 'coming_soon', plan: 'business' },
  { id: 'amplitude', name: 'Amplitude', description: 'Connect behavioral analytics to signal scoring and outcome measurement.', category: 'Analytics', logo: '📈', status: 'coming_soon', plan: 'business' },
  { id: 'csv', name: 'CSV Import', description: 'Upload signals and accounts via CSV with column mapping and import preview.', category: 'Data', logo: '📋', status: 'available', plan: 'free' },
  { id: 'zapier', name: 'Zapier', description: 'Connect any tool to ASTRIX via Zapier automation workflows.', category: 'Automation', logo: '⚡', status: 'coming_soon', plan: 'pro' },
];

const CATEGORIES = ['All', 'Support', 'CRM', 'Collaboration', 'Engineering', 'Analytics', 'Data', 'Automation'];

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-50 text-blue-700',
  business: 'bg-purple-50 text-purple-700',
  enterprise: 'bg-amber-50 text-amber-700',
};

export const Integrations = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter(i => {
      const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'All' || i.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, activeCategory]);

  const available = filtered.filter(i => i.status === 'available');
  const comingSoon = filtered.filter(i => i.status !== 'available');

  return (
    <MainLayout>
      <div className="pt-32 pb-24 min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">

          {/* Hero */}
          <div ref={heroRef} className={`text-center mb-16 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-brand-blue bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3 h-3" /> Connect Everything
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-black tracking-tighter text-gray-900 mb-4 leading-tight">
              Integrations
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto mb-8">
              ASTRIX connects to your existing tools to pull customer signals automatically — support tickets, CRM notes, analytics events, and more. One loop. All the evidence.
            </p>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-blue transition-colors shadow-apple">
              Start connecting <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-12 max-w-xl mx-auto">
            {[
              { value: `${INTEGRATIONS.length}+`, label: 'Integrations' },
              { value: '1', label: 'Available now' },
              { value: 'Soon', label: 'More coming' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                <div className="font-heading text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search integrations..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Available now */}
          {available.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h2 className="font-heading text-lg font-black text-gray-900">Available Now</h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{available.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {available.map(integration => (
                  <div key={integration.id} className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{integration.logo}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{integration.name}</h3>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{integration.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Live
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded capitalize ${PLAN_BADGE[integration.plan]}`}>
                          {integration.plan}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{integration.description}</p>
                    <Link to="/signup" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-blue-700 transition-colors group-hover:gap-2">
                      Connect <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon */}
          {comingSoon.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-gray-400" />
                <h2 className="font-heading text-lg font-black text-gray-900">Coming Soon</h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">{comingSoon.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {comingSoon.map(integration => (
                  <div key={integration.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all group opacity-80 hover:opacity-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl grayscale">{integration.logo}</span>
                        <div>
                          <h3 className="font-bold text-gray-700 text-sm">{integration.name}</h3>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{integration.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Soon</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded capitalize ${PLAN_BADGE[integration.plan]}`}>
                          {integration.plan}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{integration.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 font-medium">No integrations match your search.</p>
            </div>
          )}

          {/* CTA Block */}
          <div className="mt-20 relative overflow-hidden bg-gradient-to-br from-gray-900 to-[#0f172a] rounded-3xl p-8 md:p-12 text-center">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-astrix-teal/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-astrix-teal bg-astrix-teal/10 border border-astrix-teal/30 px-3 py-1.5 rounded-full mb-6">
                <Star className="w-3 h-3" /> Start with CSV Today
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                Can't find your tool? <br className="hidden sm:block" />
                <span className="text-astrix-teal">CSV import always works.</span>
              </h2>
              <p className="text-gray-400 font-medium mb-8 max-w-xl mx-auto">
                Export any tool to CSV. ASTRIX will guide you through column mapping, preview, and validation — your signals are in within minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-brand-blue text-white px-8 py-3.5 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg">
                  Start Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/20 transition-colors">
                  Request integration
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};
