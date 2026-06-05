import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Search, CheckCircle2, Zap, Lock, ExternalLink, RefreshCw, Unlink, AlertCircle, UploadCloud } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { usePlan } from '../../hooks/usePlan';
import { Link } from 'react-router-dom';

type IntegrationStatus = 'connected' | 'available' | 'coming_soon';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  status: IntegrationStatus;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  lastSync?: string;
  syncCount?: number;
}

const ALL_INTEGRATIONS: Integration[] = [
  { id: 'csv', name: 'CSV Import', description: 'Upload signals and accounts via CSV with column mapping and row-level validation.', category: 'Data', logo: '📋', status: 'connected', plan: 'free', lastSync: '2 hours ago', syncCount: 156 },
  { id: 'intercom', name: 'Intercom', description: 'Sync support conversations and customer feedback as product signals.', category: 'Support', logo: '💬', status: 'coming_soon', plan: 'pro' },
  { id: 'zendesk', name: 'Zendesk', description: 'Pull ticket data and customer pain signals from your support queue.', category: 'Support', logo: '🎫', status: 'coming_soon', plan: 'pro' },
  { id: 'freshdesk', name: 'Freshdesk', description: 'Ingest support tickets and CSAT feedback as structured product signals.', category: 'Support', logo: '🟢', status: 'coming_soon', plan: 'pro' },
  { id: 'salesforce', name: 'Salesforce', description: 'Bring deal notes, opportunity fields, and CS activity into your evidence loop.', category: 'CRM', logo: '☁️', status: 'coming_soon', plan: 'business' },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contact notes, deal stages, and NPS scores as tagged product signals.', category: 'CRM', logo: '🟠', status: 'coming_soon', plan: 'business' },
  { id: 'attio', name: 'Attio', description: 'Import customer attributes to enrich account matching logic.', category: 'CRM', logo: '⚡', status: 'coming_soon', plan: 'pro' },
  { id: 'slack', name: 'Slack', description: 'Monitor channels for product feedback with AI triage.', category: 'Collaboration', logo: '💼', status: 'coming_soon', plan: 'pro' },
  { id: 'notion', name: 'Notion', description: 'Import feedback databases and research notes as classified signals.', category: 'Collaboration', logo: '📝', status: 'coming_soon', plan: 'pro' },
  { id: 'linear', name: 'Linear', description: 'Link signals to Linear issues and create issues from decisions.', category: 'Engineering', logo: '🔷', status: 'coming_soon', plan: 'business' },
  { id: 'jira', name: 'Jira', description: 'Connect decisions to Jira epics and track delivery.', category: 'Engineering', logo: '🔵', status: 'coming_soon', plan: 'business' },
  { id: 'github', name: 'GitHub', description: 'Map PRs and releases to launches for automatic baseline detection.', category: 'Engineering', logo: '⚫', status: 'coming_soon', plan: 'enterprise' },
  { id: 'posthog', name: 'PostHog', description: 'Pull usage data and event metrics to verify outcome claims.', category: 'Analytics', logo: '🦔', status: 'coming_soon', plan: 'business' },
  { id: 'mixpanel', name: 'Mixpanel', description: 'Pull event and retention metrics into Day 7 and Day 30 outcome reviews.', category: 'Analytics', logo: '📊', status: 'coming_soon', plan: 'business' },
  { id: 'amplitude', name: 'Amplitude', description: 'Connect behavioral analytics to signal scoring and outcome measurement.', category: 'Analytics', logo: '📈', status: 'coming_soon', plan: 'business' },
  { id: 'zapier', name: 'Zapier', description: 'Connect any tool to ASTRIX via Zapier automation workflows.', category: 'Automation', logo: '⚡', status: 'coming_soon', plan: 'pro' },
  { id: 'segment', name: 'Segment', description: 'Route customer event streams to ASTRIX signal ingestion.', category: 'Analytics', logo: '🔴', status: 'coming_soon', plan: 'enterprise' },
  { id: 'pendo', name: 'Pendo', description: 'Pull in-app feedback and NPS responses as product signals.', category: 'Analytics', logo: '🟣', status: 'coming_soon', plan: 'business' },
];

const CATEGORIES = ['All', 'Data', 'Support', 'CRM', 'Collaboration', 'Engineering', 'Analytics', 'Automation'];

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-50 text-blue-700',
  business: 'bg-purple-50 text-purple-700',
  enterprise: 'bg-amber-50 text-amber-700',
};

export const IntegrationsHub = () => {
  const { addToast } = useToast();
  const { plan } = usePlan();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set(['csv']));

  const canConnect = (reqPlan: string): boolean => {
    const order = ['free', 'pro', 'business', 'enterprise'];
    return order.indexOf(plan) >= order.indexOf(reqPlan);
  };

  const filtered = useMemo(() => {
    return ALL_INTEGRATIONS.filter(i => {
      const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'All' || i.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, activeCategory]);

  const connected = filtered.filter(i => connectedIds.has(i.id));
  const available = filtered.filter(i => i.status !== 'coming_soon' && !connectedIds.has(i.id));
  const comingSoon = filtered.filter(i => i.status === 'coming_soon');

  const handleSync = async (id: string) => {
    setSyncing(id);
    await new Promise(r => setTimeout(r, 1500));
    setSyncing(null);
    addToast('Sync complete. Signals updated.', 'success');
  };

  const handleConnect = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      addToast(`${integration.name} integration is coming soon. We'll notify you when it's ready.`, 'info');
      return;
    }
    if (!canConnect(integration.plan)) {
      addToast(`${integration.name} requires a ${integration.plan.charAt(0).toUpperCase() + integration.plan.slice(1)} plan or higher.`, 'warning');
      return;
    }
    if (integration.id === 'csv') {
      window.dispatchEvent(new CustomEvent('open-upload-modal'));
      return;
    }
    setConnectedIds(prev => new Set([...prev, integration.id]));
    addToast(`${integration.name} connected successfully.`, 'success');
  };

  const handleDisconnect = (integration: Integration) => {
    if (integration.id === 'csv') {
      addToast('CSV import cannot be disconnected — it is always available.', 'info');
      return;
    }
    setConnectedIds(prev => {
      const next = new Set(prev);
      next.delete(integration.id);
      return next;
    });
    addToast(`${integration.name} disconnected.`, 'success');
  };

  const IntegrationCard: React.FC<{ integration: Integration; isConnected: boolean }> = ({ integration, isConnected }) => {
    const isSyncing = syncing === integration.id;
    const locked = !canConnect(integration.plan);
    const coming = integration.status === 'coming_soon';

    return (
      <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${isConnected ? 'border-green-200 ring-1 ring-green-100' : coming ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${coming ? 'grayscale' : ''}`}>{integration.logo}</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{integration.name}</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{integration.category}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            {isConnected && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Connected
              </span>
            )}
            {coming && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Soon</span>
            )}
            {locked && !coming && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Upgrade
              </span>
            )}
            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded capitalize ${PLAN_STYLES[integration.plan]}`}>
              {integration.plan}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{integration.description}</p>

        {isConnected && integration.lastSync && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-bold text-gray-600">{integration.syncCount} signals synced</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Last: {integration.lastSync}</span>
          </div>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button
                onClick={() => handleSync(integration.id)}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                onClick={() => handleDisconnect(integration)}
                className="flex items-center gap-1 border border-red-100 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <Unlink className="w-3 h-3" /> Disconnect
              </button>
            </>
          ) : coming ? (
            <button
              onClick={() => handleConnect(integration)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-xs font-bold cursor-default"
            >
              Coming soon
            </button>
          ) : locked ? (
            <Link
              to="/pricing"
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold hover:border-purple-200 transition-colors"
            >
              <Lock className="w-3 h-3" /> Upgrade to {integration.plan}
            </Link>
          ) : (
            <button
              onClick={() => handleConnect(integration)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-blue text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Zap className="w-3 h-3" /> Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      title="Integrations Hub"
      subtitle="Connect your tools and pull signals automatically"
    >
      {/* Out of scope notice */}
      <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Most integrations are coming in a future release</p>
          <p className="text-xs font-medium text-amber-700 mt-0.5">CSV import is fully available now. All other connectors are scheduled for post-MVP release. You'll be notified when they go live.</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

      {/* Connected */}
      {connected.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest">Connected ({connected.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connected.map(i => <IntegrationCard key={i.id} integration={i} isConnected={true} />)}
          </div>
        </div>
      )}

      {/* Available */}
      {available.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-brand-blue" />
            <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest">Available on Your Plan ({available.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map(i => <IntegrationCard key={i.id} integration={i} isConnected={false} />)}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-400" />
            <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest">Coming Soon ({comingSoon.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoon.map(i => <IntegrationCard key={i.id} integration={i} isConnected={false} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-900 mb-1">No integrations found</p>
          <p className="text-sm text-gray-500">Try a different search term or category.</p>
        </div>
      )}

      {/* Import CTA */}
      <div className="mt-6 bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-blue/20 rounded-xl">
            <UploadCloud className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Start with CSV Import</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Import signals and accounts via CSV — available right now, no upgrade needed.</p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
          className="shrink-0 bg-brand-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          <UploadCloud className="w-4 h-4" /> Import CSV
        </button>
      </div>
    </AppLayout>
  );
};
