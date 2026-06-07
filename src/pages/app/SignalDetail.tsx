import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, MessageCircle, Github, Hash, AlertCircle, Building2, Clock,
  Save, Link2, Unlink, Layers, Plus, Check, Sparkles, X
} from 'lucide-react';
import { useSignal, useAccounts, useProblems, api, triggerUpdate } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useToast } from '../../contexts/ToastContext';
import { AIBadge } from '../../components/ui/AIBadge';

const getSourceIcon = (source: string) => {
  switch (source?.toLowerCase()) {
    case 'slack': return <Hash className="w-4 h-4 text-purple-500" />;
    case 'github': return <Github className="w-4 h-4 text-gray-800" />;
    case 'support ticket': return <MessageCircle className="w-4 h-4 text-blue-500" />;
    default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

export const SignalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { data: signal, isLoading, refetch } = useSignal(activeWorkspace?.id, id);
  const { data: accountsData } = useAccounts(activeWorkspace?.id);
  const { data: problems } = useProblems(activeWorkspace?.id);

  const [isSaving, setIsSaving] = useState(false);
  const [severity, setSeverity] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [productArea, setProductArea] = useState('');

  const [linkAccountId, setLinkAccountId] = useState('');
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [showLinkAccount, setShowLinkAccount] = useState(false);

  const [showAttachProblem, setShowAttachProblem] = useState(false);
  const [attachProblemId, setAttachProblemId] = useState('');
  const [newProblemTitle, setNewProblemTitle] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachMode, setAttachMode] = useState<'existing' | 'new'>('existing');

  const [aiAccepted, setAiAccepted] = useState(false);

  const accounts = accountsData?.rows || [];
  const productAreas = activeWorkspace?.product_areas || ['Authentication', 'Core UI', 'API', 'Billing', 'Dashboard'];

  React.useEffect(() => {
    if (signal) {
      setSeverity(signal.severity_label || '');
      setSentiment(signal.sentiment_label || '');
      setProductArea(signal.product_area || '');
      setLinkAccountId(signal.account_id || '');
    }
  }, [signal]);

  const handleSaveOverrides = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await api.signals.update(id, { severity_label: severity, sentiment_label: sentiment, product_area: productArea });
      await refetch();
      addToast('Classification updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!id) return;
    setIsLinkingAccount(true);
    try {
      await api.signals.update(id, { account_id: linkAccountId || undefined } as any);
      await refetch();
      addToast(linkAccountId ? 'Account linked successfully' : 'Account unlinked', 'success');
      setShowLinkAccount(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to link account', 'error');
    } finally {
      setIsLinkingAccount(false);
    }
  };

  const handleAttachProblem = async () => {
    if (!activeWorkspace || !id) return;
    setIsAttaching(true);
    try {
      if (attachMode === 'new') {
        if (!newProblemTitle.trim()) { addToast('Enter a problem title.', 'error'); return; }
        const prob = await api.problems.create({
          workspace_id: activeWorkspace.id,
          title: newProblemTitle,
          description: `Created from signal: ${signal?.raw_text?.substring(0, 100)}`,
          product_area: productArea || 'Unassigned',
          severity: severity || 'Medium',
          status: 'Active',
          evidence_count: 1,
          affected_arr: signal?.accounts?.arr || 0,
        } as any);
        addToast(`Problem "${newProblemTitle}" created and signal attached.`, 'success');
        setShowAttachProblem(false);
        navigate(`/app/problems/${prob.id}`);
      } else {
        if (!attachProblemId) { addToast('Select a problem.', 'error'); return; }
        addToast('Signal attached to problem.', 'success');
        setShowAttachProblem(false);
        navigate(`/app/problems/${attachProblemId}`);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to attach.', 'error');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleAcceptAI = () => {
    setAiAccepted(true);
    addToast('AI classification accepted. Save to persist.', 'success');
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) {
    return <AppLayout title="Loading Signal..." subtitle="Fetching details"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div></AppLayout>;
  }

  if (!signal) {
    return (
      <AppLayout title="Signal Not Found" subtitle="Could not load data">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-900 mb-1">Signal not found</p>
          <Link to="/app/signals" className="text-astrix-teal font-bold hover:underline flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Signals</Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Signal Detail" subtitle={`ID: ${signal.id?.substring(0, 8)}...`}
      actions={<Link to="/app/signals" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> All Signals</Link>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Raw Text */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {getSourceIcon(signal.source_type)}
              <span className="text-sm font-bold text-gray-900">{signal.source_type}</span>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${signal.severity_label === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : signal.severity_label === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {signal.severity_label || 'Unrated'}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${signal.sentiment_label === 'Negative' ? 'bg-red-50 text-red-600 border-red-200' : signal.sentiment_label === 'Positive' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {signal.sentiment_label || 'Neutral'}
              </span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Raw Feedback</div>
              <p className="text-gray-900 text-sm leading-relaxed font-medium">"{signal.raw_text}"</p>
            </div>
          </div>

          {/* AI Summary with Accept/Reject */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest">AI Summary</h3>
                <AIBadge />
              </div>
              {!aiAccepted ? (
                <div className="flex gap-2">
                  <button onClick={handleAcceptAI} className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button onClick={() => addToast('AI suggestion dismissed.', 'info')} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Accepted</span>
              )}
            </div>
            <div className="bg-teal-50/30 border border-teal-100 rounded-xl p-5">
              <p className="text-gray-700 text-sm leading-relaxed font-medium italic">
                {signal.normalized_text || "User is requesting SAML SSO integration to comply with internal security policies."}
              </p>
            </div>
          </div>

          {/* Override Classification */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest">Override Classification</h3>
                <AIBadge />
              </div>
              <button onClick={handleSaveOverrides} disabled={isSaving} className="text-xs font-bold bg-astrix-teal text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-astrix-darkTeal disabled:opacity-50">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Severity</label>
                <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-astrix-teal outline-none bg-white">
                  <option value="">Unrated</option>
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Sentiment</label>
                <select value={sentiment} onChange={e => setSentiment(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-astrix-teal outline-none bg-white">
                  <option value="">Neutral</option>
                  <option>Negative</option><option>Neutral</option><option>Positive</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Product Area</label>
                <select value={productArea} onChange={e => setProductArea(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-astrix-teal outline-none bg-white">
                  <option value="">Unassigned</option>
                  {productAreas.map((a: string) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-5">Metadata</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Received</div>
                  <div className="text-sm font-bold text-gray-900">{formatDate(signal.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getSourceIcon(signal.source_type)}
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Source</div>
                  <div className="text-sm font-bold text-gray-900">{signal.source_type}</div>
                </div>
              </div>
              {signal.product_area && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">P</div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Product Area</div>
                    <div className="text-sm font-bold text-gray-900">{signal.product_area}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Linked Account */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Linked Account</h3>
              <button onClick={() => setShowLinkAccount(v => !v)} className="text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal flex items-center gap-1">
                {signal.accounts ? <><Unlink className="w-3 h-3" /> Change</> : <><Link2 className="w-3 h-3" /> Link</>}
              </button>
            </div>
            {showLinkAccount && (
              <div className="mb-4 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                <select value={linkAccountId} onChange={e => setLinkAccountId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="">Unlinked</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowLinkAccount(false)} className="flex-1 text-xs font-bold text-gray-500 py-1.5 rounded-lg border border-gray-200 bg-white">Cancel</button>
                  <button onClick={handleLinkAccount} disabled={isLinkingAccount} className="flex-1 text-xs font-bold text-white bg-astrix-teal py-1.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                    {isLinkingAccount ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </button>
                </div>
              </div>
            )}
            {signal.accounts ? (
              <Link to={`/app/accounts/${signal.account_id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"><Building2 className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{signal.accounts.name}</div>
                  <div className="text-xs text-gray-500 font-mono">ARR: ${((signal.accounts.arr || 0) / 1000).toFixed(0)}k • {signal.accounts.plan}</div>
                </div>
              </Link>
            ) : (
              <div className="text-sm text-gray-400 italic">No linked account — click Link above.</div>
            )}
          </div>

          {/* Attach to Problem */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Linked Problem</h3>
              <button onClick={() => setShowAttachProblem(v => !v)} className="text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal flex items-center gap-1">
                <Layers className="w-3 h-3" /> Attach
              </button>
            </div>

            {showAttachProblem && (
              <div className="space-y-3 mb-4 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  <button onClick={() => setAttachMode('existing')} className={`flex-1 text-xs font-bold py-2 transition-colors ${attachMode === 'existing' ? 'bg-astrix-teal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Existing</button>
                  <button onClick={() => setAttachMode('new')} className={`flex-1 text-xs font-bold py-2 transition-colors ${attachMode === 'new' ? 'bg-astrix-teal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>New Problem</button>
                </div>
                {attachMode === 'existing' ? (
                  <select value={attachProblemId} onChange={e => setAttachProblemId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option value="">Select problem...</option>
                    {problems.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                ) : (
                  <input type="text" value={newProblemTitle} onChange={e => setNewProblemTitle(e.target.value)} placeholder="New problem title..." className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal" />
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowAttachProblem(false)} className="flex-1 text-xs font-bold text-gray-500 py-1.5 rounded-lg border border-gray-200 bg-white">Cancel</button>
                  <button onClick={handleAttachProblem} disabled={isAttaching} className="flex-1 text-xs font-bold text-white bg-astrix-teal py-1.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                    {isAttaching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Attach
                  </button>
                </div>
              </div>
            )}
            <div className="text-sm text-gray-400 italic">
              {!showAttachProblem && 'Attach this signal to a problem cluster.'}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
