import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link, useParams } from 'react-router-dom';
import { Rocket, CheckCircle2, Clock, ArrowLeft, Save, Loader2, Sparkles, TrendingUp, TrendingDown, Lock, BadgeCheck, Target } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useLaunches, api } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { AIBadge } from '../../components/ui/AIBadge';

type ReviewPoint = 'baseline' | 'd7' | 'd30';

export const LaunchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { data: launches, refetch } = useLaunches(activeWorkspace?.id);

  const [isSaving, setIsSaving] = useState(false);
  const [savingPoint, setSavingPoint] = useState<ReviewPoint | null>(null);
  const [verdictSaved, setVerdictSaved] = useState(false);

  const [formData, setFormData] = useState({
    expected_outcome: '',
    target_metrics: '',
    baseline_signal_count: '',
    baseline_arr_at_risk: '',
    d7_signal_count: '',
    d7_arr_at_risk: '',
    d7_notes: '',
    d30_signal_count: '',
    d30_arr_at_risk: '',
    d30_notes: '',
    pm_verdict: '',
    notes: '',
  });

  const [proofSummary, setProofSummary] = useState('');

  const launch = launches.find(l => l.id === id);

  useEffect(() => {
    if (launch) {
      const l = launch as any;
      setFormData({
        expected_outcome: l.expected_outcome || '',
        target_metrics: l.target_metrics || '',
        baseline_signal_count: l.baseline_signal_count?.toString() || l.before_count?.toString() || '',
        baseline_arr_at_risk: l.baseline_arr_at_risk?.toString() || '',
        d7_signal_count: l.d7_signal_count?.toString() || '',
        d7_arr_at_risk: l.d7_arr_at_risk?.toString() || '',
        d7_notes: l.d7_notes || '',
        d30_signal_count: l.d30_signal_count?.toString() || l.after_count?.toString() || '',
        d30_arr_at_risk: l.d30_arr_at_risk?.toString() || '',
        d30_notes: l.d30_notes || '',
        pm_verdict: l.pm_verdict || '',
        notes: l.notes || '',
      });
      if (l.pm_verdict) {
        setVerdictSaved(true);
        generateProofSummary(l);
      }
    }
  }, [launch]);

  const generateProofSummary = (l: any) => {
    const baseline = l.baseline_signal_count || l.before_count || 0;
    const d30 = l.d30_signal_count || l.after_count || 0;
    const reduction = baseline > 0 ? Math.round(((baseline - d30) / baseline) * 100) : 0;
    setProofSummary(`✅ **${l.title}** was marked **${l.pm_verdict}**.\n\n**Signal reduction:** ${baseline} → ${d30} (${reduction}% improvement over 30 days).\n\n**Outcome:** ${l.expected_outcome || 'Outcome achieved.'}\n\n**PM Notes:** ${l.notes || 'No additional notes.'}`);
  };

  const handleSaveReview = async (point: ReviewPoint) => {
    if (!id || !activeWorkspace) return;
    setSavingPoint(point);
    try {
      const updates: any = {};
      if (point === 'baseline') {
        updates.baseline_signal_count = parseInt(formData.baseline_signal_count) || 0;
        updates.baseline_arr_at_risk = parseInt(formData.baseline_arr_at_risk) || 0;
        updates.before_count = parseInt(formData.baseline_signal_count) || 0;
      } else if (point === 'd7') {
        updates.d7_signal_count = parseInt(formData.d7_signal_count) || 0;
        updates.d7_arr_at_risk = parseInt(formData.d7_arr_at_risk) || 0;
        updates.d7_notes = formData.d7_notes;
      } else {
        updates.d30_signal_count = parseInt(formData.d30_signal_count) || 0;
        updates.d30_arr_at_risk = parseInt(formData.d30_arr_at_risk) || 0;
        updates.d30_notes = formData.d30_notes;
        updates.after_count = parseInt(formData.d30_signal_count) || 0;
      }
      await api.launches.update(id, updates);
      await refetch();
      addToast(`${point === 'baseline' ? 'Baseline' : point === 'd7' ? 'Day 7' : 'Day 30'} review saved.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save.', 'error');
    } finally {
      setSavingPoint(null);
    }
  };

  const handleSubmitVerdict = async () => {
    if (!id || !activeWorkspace || !formData.pm_verdict) return;
    setIsSaving(true);
    try {
      await api.launches.update(id, {
        pm_verdict: formData.pm_verdict,
        notes: formData.notes,
        expected_outcome: formData.expected_outcome,
        target_metrics: formData.target_metrics,
      } as any);
      await refetch();
      setVerdictSaved(true);
      generateProofSummary({ ...launch, ...formData, pm_verdict: formData.pm_verdict });
      addToast('Final verdict submitted. Proof summary generated.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!launch) {
    return <AppLayout title="Loading..."><div className="p-8 text-center text-gray-500">Launch not found or loading...</div></AppLayout>;
  }

  const launchDate = new Date(launch.launched_at);
  const d7Date = new Date(launchDate.getTime() + 7 * 86400000);
  const d30Date = new Date(launchDate.getTime() + 30 * 86400000);
  const now = new Date();
  const d7Due = now >= d7Date;
  const d30Due = now >= d30Date;

  const baselineSig = parseInt(formData.baseline_signal_count) || 0;
  const d30Sig = parseInt(formData.d30_signal_count) || 0;
  const reduction = baselineSig > 0 ? Math.round(((baselineSig - d30Sig) / baselineSig) * 100) : 0;

  const reviewPoints = [
    {
      id: 'baseline' as ReviewPoint,
      label: 'Baseline',
      sublabel: 'Pre-launch measurement',
      date: launchDate,
      due: true,
      sigField: 'baseline_signal_count',
      arrField: 'baseline_arr_at_risk',
      notesField: null,
    },
    {
      id: 'd7' as ReviewPoint,
      label: 'Day 7',
      sublabel: d7Date.toLocaleDateString(),
      date: d7Date,
      due: d7Due,
      sigField: 'd7_signal_count',
      arrField: 'd7_arr_at_risk',
      notesField: 'd7_notes',
    },
    {
      id: 'd30' as ReviewPoint,
      label: 'Day 30',
      sublabel: d30Date.toLocaleDateString(),
      date: d30Date,
      due: d30Due,
      sigField: 'd30_signal_count',
      arrField: 'd30_arr_at_risk',
      notesField: 'd30_notes',
    },
  ];

  return (
    <AppLayout
      title="Launch Details"
      subtitle="Post-Launch Tracking"
      actions={
        <Link to="/app/launches" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> All Launches
        </Link>
      }
    >
      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${launch.pm_verdict ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-brand-blue border-blue-200'}`}>
                {launch.action || 'Build'}
              </span>
              {launch.pm_verdict && (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> {launch.pm_verdict}
                </span>
              )}
            </div>
            <h2 className="font-heading text-3xl font-black text-gray-900 mb-3 tracking-tight">{launch.title}</h2>
            <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><Rocket className="w-4 h-4 text-brand-blue" /> Launched {launchDate.toLocaleDateString()}</span>
              <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> 30-Day Tracking Window</span>
            </div>
          </div>
          {/* Timeline dots */}
          <div className="flex items-center gap-2 mt-2">
            {['Baseline', 'D7', 'D30', 'Verdict'].map((label, i) => {
              const filled = i === 0 ? !!formData.baseline_signal_count : i === 1 ? !!formData.d7_signal_count : i === 2 ? !!formData.d30_signal_count : !!formData.pm_verdict;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] font-bold mb-1 ${filled ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${filled ? 'bg-astrix-teal shadow-glow-blue' : 'bg-gray-200'}`} />
                  </div>
                  {i < 3 && <div className="w-6 h-[2px] bg-gray-100 mb-1" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        <div className="lg:col-span-2 space-y-6">

          {/* Expected Outcome + Target Metrics */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-astrix-teal" /> Hypothesis & Metrics</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Expected Outcome</label>
                <textarea value={formData.expected_outcome} onChange={e => setFormData(f => ({ ...f, expected_outcome: e.target.value }))} rows={2} placeholder="What outcome do you expect this launch to produce?" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Target Metrics</label>
                <input value={formData.target_metrics} onChange={e => setFormData(f => ({ ...f, target_metrics: e.target.value }))} placeholder="e.g. SSO signals drop 80% by Day 30" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
            </div>
          </div>

          {/* Outcome Review Rows */}
          {reviewPoints.map((rp) => (
            <div key={rp.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${rp.due ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-70'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-heading text-base font-bold text-gray-900">{rp.label} Measurement</h4>
                  <p className="text-xs text-gray-400 font-mono">{rp.sublabel}</p>
                </div>
                {rp.due ? (
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg uppercase tracking-widest">Ready</span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Unlocks {rp.date.toLocaleDateString()}</span>
                )}
              </div>

              {rp.due && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Signal Count</label>
                      <input
                        type="number"
                        value={(formData as any)[rp.sigField]}
                        onChange={e => setFormData(f => ({ ...f, [rp.sigField]: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">ARR at Risk ($)</label>
                      <input
                        type="number"
                        value={(formData as any)[rp.arrField]}
                        onChange={e => setFormData(f => ({ ...f, [rp.arrField]: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal font-mono"
                      />
                    </div>
                  </div>
                  {rp.notesField && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">PM Notes</label>
                      <textarea
                        value={(formData as any)[rp.notesField]}
                        onChange={e => setFormData(f => ({ ...f, [rp.notesField as string]: e.target.value }))}
                        rows={2}
                        placeholder="What did you observe at this checkpoint?"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal resize-none"
                      />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveReview(rp.id)}
                      disabled={savingPoint === rp.id}
                      className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingPoint === rp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save {rp.label}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Delta Summary */}
          {baselineSig > 0 && d30Sig > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center gap-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center">
                <div className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Before</div>
                <div className="text-2xl font-black text-gray-900">{baselineSig}</div>
              </div>
              <div className="text-gray-300 font-black text-2xl">→</div>
              <div className="text-center">
                <div className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">After</div>
                <div className="text-2xl font-black text-gray-900">{d30Sig}</div>
              </div>
              <div className="flex-1 text-right">
                <div className={`flex items-center justify-end gap-2 ${reduction > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {reduction > 0 ? <TrendingDown className="w-5 h-5 rotate-0" /> : <TrendingUp className="w-5 h-5" />}
                  <span className="text-xl font-black">{reduction > 0 ? '-' : '+'}{Math.abs(reduction)}%</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{reduction > 0 ? 'reduction in signals' : 'increase in signals'}</div>
              </div>
            </div>
          )}

          {/* Final Verdict */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-astrix-teal" /> Final Verdict
              </h3>
              <button
                onClick={() => addToast('Advanced AI Review requires Business or Enterprise plan.', 'warning')}
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-astrix-teal to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Review <Lock className="w-3 h-3 opacity-70 ml-1" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Verdict <span className="text-red-500">*</span></label>
                <select
                  value={formData.pm_verdict}
                  onChange={e => setFormData(f => ({ ...f, pm_verdict: e.target.value }))}
                  disabled={verdictSaved}
                  className={`w-full bg-white border rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-astrix-teal/20 transition-all ${formData.pm_verdict ? 'border-astrix-teal text-astrix-teal' : 'border-gray-200 text-gray-900 font-medium'} disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  <option value="" disabled>Select a verdict...</option>
                  <option value="Solved">✓ Solved</option>
                  <option value="Partially Solved">~ Partially Solved</option>
                  <option value="Not Solved">✗ Not Solved</option>
                  <option value="Regressed">! Regressed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Closing PM Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  disabled={verdictSaved}
                  placeholder="Summarize why this verdict was chosen..."
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-astrix-teal/20 transition-all resize-none min-h-[100px] disabled:opacity-70"
                />
              </div>
              {!verdictSaved && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitVerdict}
                    disabled={isSaving || !formData.pm_verdict}
                    className="bg-gray-900 text-white px-8 py-3 rounded-full text-base font-bold hover:bg-brand-blue disabled:opacity-50 transition-all shadow-apple flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Submit Final Verdict
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Proof Summary */}
          {verdictSaved && proofSummary && (
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-6 shadow-sm animate-[fadeIn_0.4s_ease-out]">
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="w-5 h-5 text-astrix-teal" />
                <h3 className="font-heading text-base font-bold text-gray-900">Proof Summary</h3>
                <AIBadge />
              </div>
              <div className="bg-white border border-teal-100 rounded-xl p-5">
                <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{proofSummary}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-heading text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Linked Decision Memo</h3>
            <p className="text-white font-bold text-base mb-4 leading-tight">{launch.title}</p>
            <Link to="/app/artifacts" className="text-brand-blue text-xs font-bold flex items-center gap-2 hover:underline">View Memo <ArrowLeft className="w-3 h-3 rotate-180" /></Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Launch Checklist</h3>
            <div className="space-y-4">
              {[
                { label: 'Baseline captured', done: !!formData.baseline_signal_count },
                { label: 'Day 7 review entered', done: !!formData.d7_signal_count },
                { label: 'Day 30 review entered', done: !!formData.d30_signal_count },
                { label: 'Final verdict submitted', done: !!formData.pm_verdict },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${item.done ? (item.label.includes('verdict') ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-green-50 text-green-600 border-green-100') : 'bg-gray-50 text-gray-300 border-gray-200'}`}>
                    {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1 h-1 rounded-full bg-gray-300" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${item.done ? (item.label.includes('verdict') ? 'text-astrix-teal font-bold' : 'text-gray-700') : 'text-gray-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
