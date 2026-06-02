import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Clock, Plus, ChevronRight, X, Loader2, BadgeCheck, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { useLaunches, useDecisions, api } from '../../lib/api';
import { usePlan } from '../../hooks/usePlan';
import { UpgradeModal } from '../../components/modals/UpgradeModal';

export const PostLaunchTracker = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { data: launches, isLoading, refetch } = useLaunches(activeWorkspace?.id);
  const { data: decisions } = useDecisions(activeWorkspace?.id);
  const { limits } = usePlan();
  const navigate = useNavigate();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [logForm, setLogForm] = useState({
    title: '',
    decision_id: '',
    launched_at: '',
    expected_outcome: '',
    target_metrics: '',
  });

  const set = (k: string, v: string) => setLogForm(f => ({ ...f, [k]: v }));

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const getDaysAgo = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

  const handleOpenLog = () => {
    const activeLaunchCount = launches.filter((l: any) => l.status === 'active').length;
    if (activeLaunchCount >= limits.activeLaunches) {
      setShowUpgradeModal(true);
    } else {
      setShowLogModal(true);
    }
  };

  const handleSaveLaunch = async () => {
    if (!logForm.title || !logForm.launched_at || !activeWorkspace || !user) return;
    setIsSaving(true);
    try {
      const launch = await api.launches.create({
        workspace_id: activeWorkspace.id,
        decision_id: logForm.decision_id || undefined,
        title: logForm.title,
        launched_at: new Date(logForm.launched_at).toISOString(),
        created_by: user.id,
        expected_outcome: logForm.expected_outcome,
        target_metrics: logForm.target_metrics,
        action: 'Build',
        status: 'active',
      } as any);
      await refetch();
      setShowLogModal(false);
      setLogForm({ title: '', decision_id: '', launched_at: '', expected_outcome: '', target_metrics: '' });
      navigate(`/app/launches/${launch.id}`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    if (!verdict) return null;
    const colors: Record<string, string> = {
      'Solved': 'bg-green-50 text-green-700 border-green-200',
      'Partially Solved': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Not Solved': 'bg-red-50 text-red-700 border-red-200',
      'Regressed': 'bg-red-100 text-red-800 border-red-300',
    };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1 ${colors[verdict] || 'bg-gray-100 text-gray-600 border-gray-200'}`}><BadgeCheck className="w-3 h-3" />{verdict}</span>;
  };

  return (
    <AppLayout
      title="Post-Launch Tracker"
      subtitle="Close the loop between decision and outcome"
      actions={
        <button onClick={handleOpenLog} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log New Launch
        </button>
      }
    >
      {isLoading ? (
        <div className="space-y-4"><Skeleton className="w-full h-24" /><Skeleton className="w-full h-24" /></div>
      ) : launches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl shadow-sm text-center p-8">
          <Rocket className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">No launches yet</h3>
          <p className="text-sm text-gray-500 font-medium max-w-sm mb-4">Log a launch from a committed decision to start tracking its outcome.</p>
          <div className="flex gap-2">
            <Link to="/app/decisions" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50">View Decisions</Link>
            <button onClick={() => setShowLogModal(true)} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal">Log Launch</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {launches.map((launch: any) => {
            const daysAgo = getDaysAgo(launch.launched_at);
            const reviewDue = daysAgo >= 7 && !launch.pm_verdict;
            return (
              <div key={launch.id} className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${reviewDue ? 'border-amber-200' : 'border-gray-200'}`}>
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-heading text-xl font-bold text-gray-900">{launch.title}</h3>
                    {launch.pm_verdict ? getVerdictBadge(launch.pm_verdict) : (
                      reviewDue ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Review Due
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-blue-50 text-brand-blue border-blue-200">Active</span>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Launched {formatDate(launch.launched_at)}</span>
                    {daysAgo > 0 && <span className="text-gray-400">· Day {daysAgo}</span>}
                    {launch.expected_outcome && <span className="text-gray-400 truncate max-w-[200px]">· {launch.expected_outcome}</span>}
                  </div>
                </div>
                <Link to={`/app/launches/${launch.id}`} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 shrink-0">
                  {launch.pm_verdict ? 'View Verdict' : 'Record Outcome'} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Run Multiple Launches in Parallel"
        description="Free plan allows 1 active launch at a time. Upgrade to Starter to track up to 5 bets simultaneously."
        requiredPlan="Starter"
        bullets={[
          "Up to 5 active launches running in parallel",
          "Unlimited completed launches over time",
          "Full Day 7 / 30 outcome reviews and verdicts",
          "Launch & verdict dashboard widgets",
        ]}
      />

      {/* Log New Launch Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowLogModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">Log New Launch</h2>
                <p className="text-sm text-gray-400 mt-0.5">Track a shipped feature's outcome.</p>
              </div>
              <button onClick={() => !isSaving && setShowLogModal(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Launch Title <span className="text-red-500">*</span></label>
                <input type="text" value={logForm.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Enterprise SAML SSO" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Link to Decision</label>
                <select value={logForm.decision_id} onChange={e => set('decision_id', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="">No linked decision</option>
                  {decisions.map((d: any) => <option key={d.id} value={d.id}>{d.action}: {d.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Launch Date <span className="text-red-500">*</span></label>
                <input type="date" value={logForm.launched_at} onChange={e => set('launched_at', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Expected Outcome</label>
                <input type="text" value={logForm.expected_outcome} onChange={e => set('expected_outcome', e.target.value)} placeholder="e.g. Reduce churn by 30%" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Target Metrics</label>
                <input type="text" value={logForm.target_metrics} onChange={e => set('target_metrics', e.target.value)} placeholder="e.g. SSO signals drop 80% by Day 30" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button onClick={() => setShowLogModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button onClick={handleSaveLaunch} disabled={!logForm.title || !logForm.launched_at || isSaving} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-astrix-darkTeal">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Log Launch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
