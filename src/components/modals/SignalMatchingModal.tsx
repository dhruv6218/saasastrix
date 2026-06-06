import React, { useState, useEffect, useMemo } from 'react';
import {
  X, GitMerge, CheckCircle2, SkipForward, AlertCircle, Building2,
  ChevronRight, Search, ArrowRight, Sparkles, TrendingUp, Zap,
  Check, ThumbsDown, Info, RotateCcw,
} from 'lucide-react';
import FocusLock from 'react-focus-lock';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSignals, useAccounts } from '../../lib/api';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface AccountSuggestion {
  accountId: string;
  accountName: string;
  domain: string;
  arr: number;
  plan: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidencePct: number;
  reason: string;
}

interface UnmatchedSignal {
  id: string;
  text: string;
  source: string;
  severity: string;
  sentiment: string;
  productArea: string;
  createdAt: string;
  suggestions: AccountSuggestion[];
}

type SignalDecision = { type: 'linked'; accountId: string; accountName: string } | { type: 'skipped' } | { type: 'rejected' };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const CONFIDENCE_STYLES = {
  High:   { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  Medium: { dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  Low:    { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200'   },
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High:     'bg-orange-100 text-orange-700 border-orange-200',
  Medium:   'bg-amber-100 text-amber-700 border-amber-200',
  Low:      'bg-gray-100 text-gray-600 border-gray-200',
};

const SENTIMENT_STYLES: Record<string, string> = {
  Negative: 'text-red-600',
  Neutral:  'text-gray-500',
  Positive: 'text-green-600',
};

const SOURCE_ICONS: Record<string, string> = {
  Slack: '💬', Intercom: '🟦', Zendesk: '🎫', Discord: '🟣',
  Jira: '🔵', Salesforce: '☁️', HubSpot: '🟠', Email: '✉️',
  Notion: '📝', Survey: '📋', Default: '📡',
};

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

/* ─── Mock unmatched signal generator ──────────────────────────────────────── */
function generateUnmatchedSignals(accounts: any[]): UnmatchedSignal[] {
  const raw: Omit<UnmatchedSignal, 'suggestions'>[] = [
    { id: 'um-1', text: "We're from DataBridge Corp and our auth flow keeps breaking after your latest update. Login loops every time.", source: 'Intercom', severity: 'Critical', sentiment: 'Negative', productArea: 'Authentication', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'um-2', text: "Hi, nexacloud.io here. Would love a dark mode option — our designers work late and it strains the eyes.", source: 'Slack', severity: 'Low', sentiment: 'Neutral', productArea: 'Core UI', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'um-3', text: "API response times are really degraded for us at peakflow. We're getting 8-10s latency on /v2/sync.", source: 'Zendesk', severity: 'High', sentiment: 'Negative', productArea: 'API', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'um-4', text: "When will you support SCIM provisioning? cloudscale needs it for our enterprise IT compliance audit.", source: 'Email', severity: 'High', sentiment: 'Negative', productArea: 'Authentication', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 'um-5', text: "Billing page keeps throwing a 500 error for techflow account. Can't generate invoices for our finance team.", source: 'Intercom', severity: 'Critical', sentiment: 'Negative', productArea: 'Billing', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'um-6', text: "Just wanted to say the new dashboard layout is really clean! — from the Loomis team. Keep it up 🎉", source: 'Slack', severity: 'Low', sentiment: 'Positive', productArea: 'Dashboard', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
    { id: 'um-7', text: "The CSV export from datasync is cutting off at 500 rows. We have 12K records and need the full dataset.", source: 'Discord', severity: 'Medium', sentiment: 'Negative', productArea: 'API', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  ];

  const accountMap: Record<string, AccountSuggestion[]> = {
    'um-1': accounts.slice(0, 2).map((a, i) => ({
      accountId: a.id, accountName: i === 0 ? 'DataBridge Corp' : a.name,
      domain: i === 0 ? 'databridge.com' : a.domain,
      arr: i === 0 ? 320000 : a.arr, plan: i === 0 ? 'Growth' : a.plan,
      confidence: i === 0 ? 'High' : 'Low',
      confidencePct: i === 0 ? 91 : 38,
      reason: i === 0 ? '"DataBridge Corp" found in signal text' : 'Similar product area (Authentication)',
    })),
    'um-2': accounts.slice(1, 3).map((a, i) => ({
      accountId: a.id, accountName: i === 0 ? 'NexaCloud' : a.name,
      domain: i === 0 ? 'nexacloud.io' : a.domain,
      arr: i === 0 ? 180000 : a.arr, plan: i === 0 ? 'Standard' : a.plan,
      confidence: i === 0 ? 'High' : 'Medium',
      confidencePct: i === 0 ? 87 : 54,
      reason: i === 0 ? '"nexacloud.io" domain match in signal text' : 'Similar segment (Core UI feedback)',
    })),
    'um-3': accounts.slice(0, 3).map((a, i) => ({
      accountId: a.id, accountName: i === 2 ? 'PeakFlow Inc' : a.name,
      domain: i === 2 ? 'peakflow.io' : a.domain,
      arr: i === 2 ? 95000 : a.arr, plan: i === 2 ? 'Standard' : a.plan,
      confidence: i === 2 ? 'High' : i === 0 ? 'Medium' : 'Low',
      confidencePct: i === 2 ? 84 : i === 0 ? 51 : 29,
      reason: i === 2 ? '"peakflow" domain keyword in signal text' : 'API-related signal cluster match',
    })),
    'um-4': accounts.slice(0, 1).map(a => ({
      accountId: a.id, accountName: a.name,
      domain: a.domain, arr: a.arr, plan: a.plan,
      confidence: 'High' as const, confidencePct: 96,
      reason: '"cloudscale" exact domain match in signal text',
    })),
    'um-5': accounts.slice(1, 2).map(a => ({
      accountId: a.id, accountName: a.name,
      domain: a.domain, arr: a.arr, plan: a.plan,
      confidence: 'High' as const, confidencePct: 92,
      reason: '"techflow" account name found in signal text',
    })),
    'um-6': accounts.slice(3, 4).map(a => ({
      accountId: a.id, accountName: a.name,
      domain: a.domain, arr: a.arr, plan: a.plan,
      confidence: 'High' as const, confidencePct: 88,
      reason: '"Loomis team" name matches account record',
    })),
    'um-7': accounts.slice(2, 3).map(a => ({
      accountId: a.id, accountName: a.name,
      domain: a.domain, arr: a.arr, plan: a.plan,
      confidence: 'High' as const, confidencePct: 83,
      reason: '"datasync" exact account name in signal text',
    })),
  };

  return raw.map(s => ({ ...s, suggestions: accountMap[s.id] || [] }));
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export const SignalMatchingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { data: accountData } = useAccounts(activeWorkspace?.id);

  const accounts = accountData || [];

  const signals = useMemo(() => generateUnmatchedSignals(accounts), [accounts]);

  const [search, setSearch] = useState('');
  const [decisions, setDecisions] = useState<Record<string, SignalDecision>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const open = () => { setIsOpen(true); setDone(false); setDecisions({}); setSearch(''); setExpandedId(null); };
    const close = () => setIsOpen(false);
    window.addEventListener('open-signal-matching', open);
    window.addEventListener('close-modals', close);
    return () => {
      window.removeEventListener('open-signal-matching', open);
      window.removeEventListener('close-modals', close);
    };
  }, []);

  if (!isOpen) return null;

  const filtered = signals.filter(s =>
    !search || s.text.toLowerCase().includes(search.toLowerCase()) ||
    s.source.toLowerCase().includes(search.toLowerCase()) ||
    s.productArea.toLowerCase().includes(search.toLowerCase())
  );

  const reviewed = Object.keys(decisions).length;
  const linked = Object.values(decisions).filter(d => d.type === 'linked').length;
  const skipped = Object.values(decisions).filter(d => d.type === 'skipped' || d.type === 'rejected').length;
  const remaining = signals.filter(s => !decisions[s.id]).length;

  const handleLink = (signal: UnmatchedSignal, suggestion: AccountSuggestion) => {
    setDecisions(prev => ({ ...prev, [signal.id]: { type: 'linked', accountId: suggestion.accountId, accountName: suggestion.accountName } }));
    setExpandedId(null);
    addToast(`Linked to ${suggestion.accountName}`, 'success');
  };

  const handleSkip = (signalId: string) => {
    setDecisions(prev => ({ ...prev, [signalId]: { type: 'skipped' } }));
    setExpandedId(null);
  };

  const handleReject = (signalId: string) => {
    setDecisions(prev => ({ ...prev, [signalId]: { type: 'rejected' } }));
    setExpandedId(null);
  };

  const handleUndo = (signalId: string) => {
    setDecisions(prev => {
      const next = { ...prev };
      delete next[signalId];
      return next;
    });
  };

  const handleFinish = () => {
    if (remaining > 0 && reviewed < signals.length) {
      setDone(true);
    } else {
      setDone(true);
    }
  };

  const close = () => setIsOpen(false);

  return (
    <FocusLock>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={close} />

        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <GitMerge className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-gray-900 leading-tight">Signal-to-Account Matching</h2>
                  <p className="text-xs text-gray-400 font-medium">{signals.length} unmatched signals · AI-suggested pairings</p>
                </div>
              </div>
              <button onClick={close} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            {!done && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  <span>{reviewed} of {signals.length} reviewed</span>
                  <span className="text-amber-600">{remaining} remaining</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-blue to-astrix-teal rounded-full transition-all duration-500" style={{ width: `${signals.length > 0 ? (reviewed / signals.length) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>

          {done ? (
            /* ── Done summary ── */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-heading text-2xl font-black text-gray-900 mb-2">Matching complete</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">Your signal-to-account links have been saved.</p>
              <div className="flex gap-4 justify-center mb-8">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center w-28">
                  <div className="text-3xl font-black text-green-700">{linked}</div>
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Linked</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center w-28">
                  <div className="text-3xl font-black text-gray-500">{skipped}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Skipped</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center w-28">
                  <div className="text-3xl font-black text-amber-600">{remaining}</div>
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Unreviewed</div>
                </div>
              </div>
              {linked > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium mb-4 text-left w-full">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  {linked} signal{linked !== 1 ? 's are' : ' is'} now matched. They will be included in account ARR calculations, problem evidence, and opportunity scoring on next refresh.
                </div>
              )}
              <button onClick={close} className="bg-gray-900 hover:bg-brand-blue text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors">
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="px-6 py-3 border-b border-gray-100 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search signals by text, source, or area…"
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* How it works tip */}
              <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                <p className="text-xs text-blue-700 font-medium">AI scanned signal text for company names, domains, and keywords to suggest account pairings. Review each suggestion and approve or skip.</p>
              </div>

              {/* Signal list */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <div className="py-16 text-center">
                    <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-400">No signals match your search.</p>
                  </div>
                )}

                {filtered.map(signal => {
                  const decision = decisions[signal.id];
                  const isExpanded = expandedId === signal.id;
                  const srcIcon = SOURCE_ICONS[signal.source] || SOURCE_ICONS.Default;
                  const bestSuggestion = signal.suggestions[0];

                  return (
                    <div
                      key={signal.id}
                      className={`transition-colors ${decision ? 'opacity-60' : 'hover:bg-gray-50'}`}
                    >
                      <div className="px-6 py-4">
                        {/* Signal header */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-lg shrink-0 mt-0.5">{srcIcon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-relaxed ${decision ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              "{signal.text.length > 130 ? signal.text.slice(0, 130) + '…' : signal.text}"
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold text-gray-400">{signal.source}</span>
                              <span className="text-gray-200">·</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[signal.severity] || SEVERITY_STYLES.Low}`}>{signal.severity}</span>
                              <span className={`text-[10px] font-bold ${SENTIMENT_STYLES[signal.sentiment] || ''}`}>{signal.sentiment}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{signal.productArea}</span>
                            </div>
                          </div>

                          {/* Decision state */}
                          {decision ? (
                            <div className="shrink-0 flex items-center gap-2">
                              {decision.type === 'linked' && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> {(decision as any).accountName}
                                </span>
                              )}
                              {decision.type === 'skipped' && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded-full">Skipped</span>
                              )}
                              {decision.type === 'rejected' && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded-full">No match</span>
                              )}
                              <button onClick={() => handleUndo(signal.id)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Undo">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isExpanded ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                              {isExpanded ? 'Close' : `Review${signal.suggestions.length > 0 ? ` (${signal.suggestions.length})` : ''}`}
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Best suggestion preview (collapsed) */}
                        {!isExpanded && !decision && bestSuggestion && (
                          <div className="ml-8 flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${CONFIDENCE_STYLES[bestSuggestion.confidence].bg} ${CONFIDENCE_STYLES[bestSuggestion.confidence].text}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${CONFIDENCE_STYLES[bestSuggestion.confidence].dot}`} />
                              Best match: {bestSuggestion.accountName} ({bestSuggestion.confidencePct}%)
                            </div>
                            <button
                              onClick={() => handleLink(signal, bestSuggestion)}
                              className="text-[11px] font-black text-brand-blue hover:text-blue-700 flex items-center gap-1 transition-colors"
                            >
                              <Zap className="w-3 h-3" /> Quick link
                            </button>
                          </div>
                        )}

                        {/* Expanded suggestion panel */}
                        {isExpanded && !decision && (
                          <div className="ml-8 mt-3 space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Suggested account matches</p>

                            {signal.suggestions.length === 0 ? (
                              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                No domain or keyword matches found. You can skip this signal or manually link it from Signal Detail.
                              </div>
                            ) : (
                              signal.suggestions.map((sugg, sIdx) => (
                                <div key={sugg.accountId} className={`flex items-center gap-3 p-3 rounded-xl border ${sIdx === 0 ? 'border-brand-blue/30 bg-blue-50/40' : 'border-gray-200 bg-white'}`}>
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                                    {sugg.accountName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-bold text-gray-900">{sugg.accountName}</span>
                                      <span className="text-[10px] text-gray-400">{sugg.domain}</span>
                                      <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${CONFIDENCE_STYLES[sugg.confidence].bg} ${CONFIDENCE_STYLES[sugg.confidence].text}`}>
                                        {sugg.confidence} {sugg.confidencePct}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[11px] text-gray-500 font-medium">{sugg.plan} · {fmtCurrency(sugg.arr)} ARR</span>
                                      <span className="text-[11px] text-gray-400 italic">{sugg.reason}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleLink(signal, sugg)}
                                    className="shrink-0 flex items-center gap-1.5 bg-brand-blue hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                  >
                                    <Check className="w-3 h-3" /> Link
                                  </button>
                                </div>
                              ))
                            )}

                            {/* Skip / No match actions */}
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => handleSkip(signal.id)} className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                <SkipForward className="w-3 h-3" /> Skip for now
                              </button>
                              <button onClick={() => handleReject(signal.id)} className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                <ThumbsDown className="w-3 h-3" /> No match
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
                <div className="text-xs font-medium text-gray-500">
                  <span className="font-black text-green-700">{linked} linked</span>
                  {skipped > 0 && <span className="ml-2 font-black text-gray-500">{skipped} skipped</span>}
                  {remaining > 0 && <span className="ml-2 text-amber-600">{remaining} left</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={close} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={reviewed === 0}
                    className="bg-gray-900 hover:bg-brand-blue disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    Save {linked > 0 ? `${linked} link${linked !== 1 ? 's' : ''}` : 'changes'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </FocusLock>
  );
};
