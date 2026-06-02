import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Sparkles, Check } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccounts, api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { AIBadge } from '../../components/ui/AIBadge';

const SOURCES = ['Slack', 'Intercom', 'Discord', 'GitHub', 'Support Ticket', 'Email', 'Sales Call', 'Survey', 'Other'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const SENTIMENTS = ['Negative', 'Neutral', 'Positive'];

export const SignalNew = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { data: accountsData } = useAccounts(activeWorkspace?.id);
  const accounts = accountsData?.rows || [];

  const [isSaving, setIsSaving] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  const [form, setForm] = useState({
    raw_text: '',
    source_type: 'Slack',
    account_id: '',
    severity_label: '',
    sentiment_label: '',
    product_area: '',
    category: 'Feature Request',
  });

  const productAreas = activeWorkspace?.product_areas || ['Authentication', 'Core UI', 'API', 'Billing', 'Dashboard'];

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAiSuggest = async () => {
    if (!form.raw_text.trim()) {
      addToast('Add some raw feedback text first.', 'warning');
      return;
    }
    setIsAiSuggesting(true);
    await new Promise(r => setTimeout(r, 1200));

    const text = form.raw_text.toLowerCase();
    let sev = 'Medium';
    let sent = 'Neutral';
    let area = 'Core UI';

    if (text.includes('cannot') || text.includes('blocking') || text.includes('churn') || text.includes('cancel')) sev = 'Critical';
    else if (text.includes('failing') || text.includes('error') || text.includes('broken')) sev = 'High';
    else if (text.includes('would love') || text.includes('any update') || text.includes('nice to have')) sev = 'Low';

    if (text.includes('cannot') || text.includes('failing') || text.includes('broken') || text.includes('bad')) sent = 'Negative';
    else if (text.includes('love') || text.includes('great') || text.includes('thank')) sent = 'Positive';

    if (text.includes('sso') || text.includes('auth') || text.includes('login') || text.includes('okta')) area = 'Authentication';
    else if (text.includes('api') || text.includes('rate limit') || text.includes('endpoint')) area = 'API';
    else if (text.includes('billing') || text.includes('invoice') || text.includes('payment')) area = 'Billing';
    else if (text.includes('dashboard') || text.includes('chart') || text.includes('report')) area = 'Dashboard';

    setForm(f => ({ ...f, severity_label: sev, sentiment_label: sent, product_area: area }));
    setAiSuggested(true);
    setIsAiSuggesting(false);
    addToast('AI classification applied — review and save.', 'success');
  };

  const handleSave = async () => {
    if (!form.raw_text.trim()) {
      addToast('Raw feedback text is required.', 'error');
      return;
    }
    if (!activeWorkspace) return;
    setIsSaving(true);
    try {
      const signal = await api.signals.create({
        workspace_id: activeWorkspace.id,
        raw_text: form.raw_text,
        source_type: form.source_type,
        account_id: form.account_id || undefined,
        severity_label: form.severity_label || 'Medium',
        sentiment_label: form.sentiment_label || 'Neutral',
        product_area: form.product_area || undefined,
        category: form.category,
        normalized_text: form.raw_text,
      } as any);
      addToast('Signal added successfully.', 'success');
      navigate(`/app/signals/${signal.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to save signal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout
      title="Add Signal"
      subtitle="Manually record a piece of customer feedback"
      backPath="/app/signals"
      actions={
        <button onClick={() => navigate('/app/signals')} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }
    >
      <div className="max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">

          {/* Raw Text */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Raw Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.raw_text}
              onChange={e => set('raw_text', e.target.value)}
              placeholder="Paste the exact customer message, support ticket, or call note..."
              rows={5}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal transition-all resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">{form.raw_text.length} characters</p>
              <button
                onClick={handleAiSuggest}
                disabled={isAiSuggesting || !form.raw_text.trim()}
                className="flex items-center gap-1.5 text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal disabled:opacity-50 transition-colors"
              >
                {isAiSuggesting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Classifying...</>
                ) : aiSuggested ? (
                  <><Check className="w-3.5 h-3.5" /> AI Applied</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> AI Classify</>
                )}
              </button>
            </div>
          </div>

          {aiSuggested && (
            <div className="bg-teal-50/40 border border-teal-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <AIBadge />
              <p className="text-xs text-teal-700 font-medium">AI has suggested severity, sentiment, and product area below. Review and adjust before saving.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Source */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Source</label>
              <select value={form.source_type} onChange={e => set('source_type', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Linked Account */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Linked Account</label>
              <select value={form.account_id} onChange={e => set('account_id', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                <option value="">Unlinked</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                Severity {aiSuggested && form.severity_label && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-black">AI</span>}
              </label>
              <select value={form.severity_label} onChange={e => set('severity_label', e.target.value)} className={`w-full bg-gray-50 border text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal transition-all ${aiSuggested && form.severity_label ? 'border-teal-300' : 'border-gray-200'}`}>
                <option value="">Unrated</option>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Sentiment */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                Sentiment {aiSuggested && form.sentiment_label && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-black">AI</span>}
              </label>
              <select value={form.sentiment_label} onChange={e => set('sentiment_label', e.target.value)} className={`w-full bg-gray-50 border text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal transition-all ${aiSuggested && form.sentiment_label ? 'border-teal-300' : 'border-gray-200'}`}>
                <option value="">Neutral</option>
                {SENTIMENTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Product Area */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                Product Area {aiSuggested && form.product_area && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-black">AI</span>}
              </label>
              <select value={form.product_area} onChange={e => set('product_area', e.target.value)} className={`w-full bg-gray-50 border text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal transition-all ${aiSuggested && form.product_area ? 'border-teal-300' : 'border-gray-200'}`}>
                <option value="">Unassigned</option>
                {productAreas.map((a: string) => <option key={a}>{a}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                <option>Feature Request</option>
                <option>Bug</option>
                <option>Churn Risk</option>
                <option>Compliment</option>
                <option>Question</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button onClick={() => navigate('/app/signals')} className="text-sm font-bold text-gray-500 hover:text-gray-900">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.raw_text.trim()}
              className="bg-astrix-teal text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-astrix-darkTeal disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Signal
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
