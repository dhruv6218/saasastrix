import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Search, Plug, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Settings, Zap, Lock } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { usePlan } from '../../hooks/usePlan';

const CATEGORIES = ['All', 'CRM', 'Support', 'Analytics', 'Feedback', 'Communication', 'Data'];

const INTEGRATIONS = [
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', desc: 'Pull account health, ARR, renewal dates and opportunity data from Salesforce into Astrix automatically.', status: 'available', pro: false, icon: '☁️', popular: true },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', desc: 'Sync HubSpot contacts, companies and deal pipeline data to enrich your account profiles.', status: 'available', pro: false, icon: '🔶', popular: true },
  { id: 'intercom', name: 'Intercom', category: 'Support', desc: 'Ingest support conversations and user feedback as signals automatically classified by sentiment and severity.', status: 'connected', pro: false, icon: '💬', popular: true },
  { id: 'zendesk', name: 'Zendesk', category: 'Support', desc: 'Pull support tickets into Astrix as structured signals with account context attached.', status: 'available', pro: false, icon: '🎧', popular: false },
  { id: 'freshdesk', name: 'Freshdesk', category: 'Support', desc: 'Import customer support tickets and CSAT scores as product signals.', status: 'available', pro: true, icon: '🌿', popular: false },
  { id: 'slack', name: 'Slack', category: 'Communication', desc: 'Monitor designated Slack channels for customer mentions and route them as signals. Get weekly Astrix digests in Slack.', status: 'available', pro: false, icon: '📱', popular: true },
  { id: 'teams', name: 'Microsoft Teams', category: 'Communication', desc: 'Receive Astrix notifications and digest reports directly in Teams channels.', status: 'available', pro: true, icon: '🔷', popular: false },
  { id: 'mixpanel', name: 'Mixpanel', category: 'Analytics', desc: 'Pull feature usage and funnel data to add quantitative context to your product signal analysis.', status: 'available', pro: true, icon: '📊', popular: false },
  { id: 'amplitude', name: 'Amplitude', category: 'Analytics', desc: 'Enrich problems with behavioral data — retention, activation, and feature adoption metrics.', status: 'available', pro: true, icon: '📈', popular: false },
  { id: 'segment', name: 'Segment', category: 'Data', desc: 'Route customer events from Segment into Astrix as structured signals with full account context.', status: 'available', pro: true, icon: '⚡', popular: false },
  { id: 'typeform', name: 'Typeform', category: 'Feedback', desc: 'Automatically ingest survey responses as signals. Map form questions to severity and product areas.', status: 'available', pro: false, icon: '📋', popular: false },
  { id: 'surveymonkey', name: 'SurveyMonkey', category: 'Feedback', desc: 'Pull NPS and CSAT survey responses into your signal stream and auto-classify by sentiment.', status: 'available', pro: false, icon: '🐒', popular: false },
  { id: 'gong', name: 'Gong', category: 'Feedback', desc: 'Extract customer pain points and product feedback from recorded sales calls automatically.', status: 'available', pro: true, icon: '🔔', popular: true },
  { id: 'chorus', name: 'Chorus.ai', category: 'Feedback', desc: 'Import conversation intelligence from sales and CS calls as structured product signals.', status: 'available', pro: true, icon: '🎵', popular: false },
  { id: 'notion', name: 'Notion', category: 'Data', desc: 'Push decision memos and PRDs to your Notion workspace. Keep your docs in sync with Astrix artifacts.', status: 'available', pro: false, icon: '📝', popular: true },
  { id: 'jira', name: 'Jira', category: 'Data', desc: 'Two-way sync with Jira — create tickets from Astrix decisions and track implementation progress.', status: 'coming_soon', pro: true, icon: '🔵', popular: true },
  { id: 'linear', name: 'Linear', category: 'Data', desc: 'Link Astrix decisions directly to Linear projects and track from decision to shipped feature.', status: 'coming_soon', pro: true, icon: '🟣', popular: false },
  { id: 'github', name: 'GitHub', category: 'Data', desc: 'Attach pull requests and issues to Astrix decisions for a full evidence-to-code trail.', status: 'coming_soon', pro: false, icon: '⚫', popular: false },
];

export const IntegrationsHub = () => {
  const { addToast } = useToast();
  const { isAtLeast } = usePlan();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = activeCategory === 'All' || i.category === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const connected = INTEGRATIONS.filter(i => i.status === 'connected');

  const handleConnect = async (integration: typeof INTEGRATIONS[0]) => {
    if (integration.pro && !isAtLeast('pro')) {
      addToast(`${integration.name} requires the Pro plan or above.`, 'warning');
      return;
    }
    if (integration.status === 'coming_soon') {
      addToast(`${integration.name} integration is coming soon!`, 'info');
      return;
    }
    setConnecting(integration.id);
    await new Promise(r => setTimeout(r, 1500));
    setConnecting(null);
    addToast(`${integration.name} connected successfully! Signals will start ingesting within a few minutes.`, 'success');
  };

  const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    connected: { label: 'Connected', cls: 'bg-green-50 text-green-700 border-green-200' },
    available: { label: 'Available', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    coming_soon: { label: 'Coming Soon', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  };

  return (
    <AppLayout
      title="Integrations"
      subtitle="Connect your data sources to automatically ingest signals into Astrix."
    >
      {/* Connected integrations summary */}
      {connected.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-bold text-green-900">{connected.length} integration{connected.length !== 1 ? 's' : ''} connected</span>
            <span className="text-sm text-green-700 font-medium ml-2">— {connected.map(i => i.name).join(', ')}</span>
          </div>
          <a href="/app/settings" className="text-xs font-bold text-green-700 hover:underline flex items-center gap-1">
            Manage <Settings className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Search + Category filter */}
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

      {/* Integration cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Plug className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-bold text-gray-900 mb-1">No integrations found</p>
          <p className="text-sm text-gray-500">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(integration => {
            const sc = STATUS_CONFIG[integration.status];
            const isExpanded = expandedId === integration.id;
            const isConnecting = connecting === integration.id;
            const requiresUpgrade = integration.pro && !isAtLeast('pro');

            return (
              <div
                key={integration.id}
                className={`bg-white border rounded-2xl shadow-sm transition-all duration-200 overflow-hidden ${integration.status === 'connected' ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl">
                        {integration.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm">{integration.name}</h3>
                          {integration.popular && (
                            <span className="text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-widest">Popular</span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{integration.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {requiresUpgrade && <Lock className="w-3.5 h-3.5 text-gray-300" />}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2 mb-4">{integration.desc}</p>

                  <div className="flex items-center gap-2">
                    {integration.status === 'connected' ? (
                      <>
                        <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                        </button>
                        <button className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : integration.status === 'coming_soon' ? (
                      <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 border border-purple-200 cursor-not-allowed flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Coming Soon
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        disabled={isConnecting}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${requiresUpgrade ? 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100' : 'bg-brand-blue text-white hover:bg-blue-700 shadow-sm'}`}
                      >
                        {isConnecting ? (
                          <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</>
                        ) : requiresUpgrade ? (
                          <><Lock className="w-3.5 h-3.5" /> Pro Required</>
                        ) : (
                          <><Plug className="w-3.5 h-3.5" /> Connect</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-gray-400 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50/50 animate-[fadeIn_0.2s_ease-out]">
                    <p className="text-xs text-gray-600 font-medium leading-relaxed mt-4 mb-3">{integration.desc}</p>
                    <a href="#" className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
                      View documentation <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Request integration CTA */}
      <div className="mt-8 bg-gray-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg mb-1">Don't see your tool?</h3>
          <p className="text-sm text-gray-400 font-medium">Request an integration and we'll build it if there's enough demand.</p>
        </div>
        <button
          onClick={() => addToast("Integration request received! We'll be in touch.", "success")}
          className="shrink-0 bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
        >
          Request Integration
        </button>
      </div>
    </AppLayout>
  );
};
