import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { GitCompare, Sparkles, Loader2, CheckCircle2, X, Zap, SlidersHorizontal, Info } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useOpportunity, useOpportunities, api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { AIBadge } from '../../components/ui/AIBadge';

export const OpportunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: currentOpportunity, isLoading } = useOpportunity(id);
  const { data: allOpps } = useOpportunities('ws-1');
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState('Build');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  // What-if state
  const [effortScore, setEffortScore] = useState(50);
  const [alignmentScore, setAlignmentScore] = useState(70);
  const [confidenceScore, setConfidenceScore] = useState(80);
  const [manualAdjust, setManualAdjust] = useState(0);

  const formatCurrency = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v}`;
  };

  const handleSaveDecision = async () => {
    if (decisionRationale.length < 20 || !activeWorkspace || !currentOpportunity || !user) return;
    setIsSavingDecision(true);
    try {
      await api.decisions.create({
        workspace_id: activeWorkspace.id,
        opportunity_id: id,
        problem_id: currentOpportunity.problem_id,
        title: currentOpportunity.problems?.title || 'Decision',
        action: decisionAction,
        rationale: decisionRationale,
        author_id: user.id,
      } as any);
      addToast('Decision committed successfully.', 'success');
      setIsDecisionModalOpen(false);
      navigate('/app/decisions');
    } catch (err: any) {
      addToast(err.message || 'Failed to save.', 'error');
    } finally {
      setIsSavingDecision(false);
    }
  };

  if (isLoading) {
    return <AppLayout title="Loading Opportunity..." subtitle="Calculating scores"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div></AppLayout>;
  }

  if (!currentOpportunity) {
    return (
      <AppLayout title="Opportunity Not Found" subtitle="Could not load data">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>Opportunity does not exist or you don't have access.</p>
          <Link to="/app/opportunities" className="mt-4 text-astrix-teal font-bold hover:underline">← Back to Opportunities</Link>
        </div>
      </AppLayout>
    );
  }

  const baseScore = currentOpportunity.opportunity_score;
  const title = currentOpportunity.problems?.title || 'Opportunity';
  const evidenceCount = currentOpportunity.problems?.evidence_count || 0;
  const affectedArr = currentOpportunity.problems?.affected_arr || 0;
  const recommended = currentOpportunity.recommended_action || 'Build';

  // What-if adjusted score
  const effortPenalty = Math.round(((effortScore - 50) / 50) * 15);
  const alignmentBonus = Math.round(((alignmentScore - 50) / 50) * 10);
  const confidenceBonus = Math.round(((confidenceScore - 50) / 50) * 5);
  const adjustedScore = Math.min(100, Math.max(0, baseScore - effortPenalty + alignmentBonus + confidenceBonus + manualAdjust));

  const tabs = ['Overview', 'Score Breakdown', 'What-if'];

  const otherOpps = allOpps.filter((o: any) => o.id !== id).slice(0, 3);

  return (
    <AppLayout
      title={title}
      subtitle="Opportunity Detail · AI-Scored"
      actions={
        <div className="flex items-center gap-3">
          <Link to="/app/opportunities" className="text-sm font-bold text-gray-500 hover:text-gray-900">← Opportunities</Link>
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="bg-astrix-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-astrix-darkTeal transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Commit Decision
          </button>
        </div>
      }
    >
      {/* Hero Score Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center font-heading font-black text-4xl shrink-0 shadow-lg ${baseScore >= 80 ? 'bg-astrix-teal text-white' : baseScore >= 60 ? 'bg-astrix-gold text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
              {baseScore}
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Opportunity Score</div>
              <h2 className="font-heading text-2xl font-black text-gray-900 mb-2">{title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <AIBadge />
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${recommended === 'Build' ? 'bg-teal-50 text-astrix-teal border border-teal-200' : recommended === 'Fix' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-gray-100 text-gray-700'}`}>
                  <Zap className="w-3 h-3" /> Recommended: {recommended}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 min-w-[280px]">
            {[
              { label: 'Signals', value: evidenceCount },
              { label: 'ARR at Risk', value: formatCurrency(affectedArr), highlight: true },
              { label: 'Trend', value: '↑ Rising', red: true },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">{stat.label}</div>
                <div className={`font-heading font-black text-xl ${stat.highlight ? 'text-astrix-gold' : stat.red ? 'text-brand-red' : 'text-gray-900'}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const key = tab.toLowerCase().replace(/\s+/g, '-');
          return (
            <button key={tab} onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap focus-visible:outline-none ${activeTab === key ? 'text-astrix-teal' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {tab}
              {activeTab === key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-astrix-teal rounded-t-full animate-[fadeIn_0.2s_ease-out]" />}
            </button>
          );
        })}
      </div>

      <div className="animate-[fadeIn_0.3s_ease-out]">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-astrix-teal/10 text-astrix-teal p-1.5 rounded-lg"><Sparkles className="w-4 h-4" /></span>
                  AI Analysis
                </h3>
                <AIBadge className="mb-4" />
                <p className="text-gray-700 leading-relaxed font-medium mt-3">
                  This opportunity scores <strong>{baseScore}/100</strong> based on signal volume ({evidenceCount} signals), pain severity (score {currentOpportunity.pain_score}), and concentrated ARR risk ({formatCurrency(affectedArr)} at risk).
                  The recommended action is <strong>{recommended}</strong> — addressing this prevents churn risk from crystallising among Enterprise accounts.
                  The signal trend is rising, increasing urgency.
                </p>
              </div>

              {/* Compare vs others */}
              {otherOpps.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><GitCompare className="w-4 h-4 text-gray-400" /> Compare Against</h3>
                  <div className="space-y-3">
                    {otherOpps.map((opp: any) => (
                      <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{opp.problems?.title}</div>
                          <div className="text-xs text-gray-400 font-mono">{opp.recommended_action}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${opp.opportunity_score >= 80 ? 'bg-astrix-teal text-white' : opp.opportunity_score >= 60 ? 'bg-astrix-gold text-gray-900' : 'bg-gray-200 text-gray-600'}`}>
                            {opp.opportunity_score}
                          </div>
                          <Link to={`/app/opportunities/${opp.id}`} className="text-xs font-bold text-astrix-teal hover:underline">View →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => setIsDecisionModalOpen(true)} className="w-full bg-astrix-teal text-white py-3 rounded-xl font-bold text-sm hover:bg-astrix-darkTeal transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Commit Decision
                  </button>
                  <Link to={`/app/problems/${currentOpportunity.problem_id}`} className="w-full block text-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                    View Linked Problem
                  </Link>
                  <button onClick={() => setActiveTab('what-if')} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> What-if Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCORE BREAKDOWN TAB */}
        {activeTab === 'score-breakdown' && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-6">Opportunity Profile</h3>
              <div className="space-y-5 font-mono text-sm">
                {[
                  { label: 'Demand (Signal Count)', val: currentOpportunity.demand_score, color: 'bg-astrix-teal', text: `${evidenceCount} signals`, weight: '30%' },
                  { label: 'Pain Severity', val: currentOpportunity.pain_score, color: 'bg-astrix-terra', text: `${currentOpportunity.pain_score}/100`, weight: '25%' },
                  { label: 'Affected ARR', val: currentOpportunity.arr_score, color: 'bg-astrix-gold', text: formatCurrency(affectedArr), weight: '30%' },
                  { label: 'Trend Direction', val: currentOpportunity.trend_score, color: 'bg-brand-blue', text: `${currentOpportunity.trend_score}/100`, weight: '15%' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-gray-600 font-bold mb-1.5">
                      <span className="flex items-center gap-2">{stat.label} <span className="text-gray-300 text-[10px]">weight {stat.weight}</span></span>
                      <span className="text-gray-900">{stat.text}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${stat.color} transition-all duration-700`} style={{ width: `${stat.val ?? 70}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="font-heading text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Score Formula</h3>
              <p className="text-sm text-gray-600 font-mono">
                Final Score = (Demand × 0.30) + (Pain × 0.25) + (ARR Risk × 0.30) + (Trend × 0.15)
              </p>
              <p className="text-xs text-gray-400 mt-2">= ({currentOpportunity.demand_score} × 0.30) + ({currentOpportunity.pain_score} × 0.25) + ({currentOpportunity.arr_score} × 0.30) + ({currentOpportunity.trend_score} × 0.15) = <strong>{baseScore}</strong></p>
            </div>
          </div>
        )}

        {/* WHAT-IF TAB */}
        {activeTab === 'what-if' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading text-lg font-bold text-gray-900">Score Adjusters</h3>
                  <AIBadge />
                </div>
                <p className="text-sm text-gray-400 mb-6">Adjust inputs to model how the score changes with different effort, alignment, and confidence estimates.</p>
                <div className="space-y-6">
                  {[
                    { label: 'Effort Estimate', sublabel: 'High effort reduces priority', value: effortScore, setter: setEffortScore, inverted: true, low: 'Low effort', high: 'High effort' },
                    { label: 'Strategic Alignment', sublabel: 'OKR or roadmap alignment', value: alignmentScore, setter: setAlignmentScore, inverted: false, low: 'Off-strategy', high: 'Core OKR' },
                    { label: 'Confidence', sublabel: 'How confident are you in the data?', value: confidenceScore, setter: setConfidenceScore, inverted: false, low: 'Low confidence', high: 'High confidence' },
                  ].map(slider => (
                    <div key={slider.label}>
                      <div className="flex justify-between items-baseline mb-2">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{slider.label}</div>
                          <div className="text-xs text-gray-400">{slider.sublabel}</div>
                        </div>
                        <span className="font-mono font-black text-gray-900">{slider.value}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={slider.value}
                        onChange={e => slider.setter(Number(e.target.value))}
                        className="w-full accent-astrix-teal"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                        <span>{slider.low}</span>
                        <span>{slider.high}</span>
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <div>
                        <div className="text-sm font-bold text-gray-900">Manual Adjustment</div>
                        <div className="text-xs text-gray-400">Override bias correction (±20)</div>
                      </div>
                      <span className={`font-mono font-black ${manualAdjust > 0 ? 'text-green-600' : manualAdjust < 0 ? 'text-red-500' : 'text-gray-900'}`}>{manualAdjust > 0 ? '+' : ''}{manualAdjust}</span>
                    </div>
                    <input type="range" min={-20} max={20} step={1} value={manualAdjust} onChange={e => setManualAdjust(Number(e.target.value))} className="w-full accent-astrix-teal" />
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                      <span>-20</span>
                      <span>0</span>
                      <span>+20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-6">Adjusted Score</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center font-heading font-black text-5xl shrink-0 shadow-lg transition-all ${adjustedScore >= 80 ? 'bg-astrix-teal text-white' : adjustedScore >= 60 ? 'bg-astrix-gold text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                    {adjustedScore}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-mono uppercase mb-1">vs. baseline</div>
                    <div className={`text-2xl font-black ${adjustedScore > baseScore ? 'text-green-600' : adjustedScore < baseScore ? 'text-red-500' : 'text-gray-400'}`}>
                      {adjustedScore > baseScore ? '+' : ''}{adjustedScore - baseScore} pts
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Original: {baseScore}</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500">Base score</span>
                    <span className="font-bold text-gray-900">{baseScore}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500">Effort penalty</span>
                    <span className={`font-bold ${effortPenalty > 0 ? 'text-red-500' : 'text-green-600'}`}>{effortPenalty > 0 ? '-' : '+'}{Math.abs(effortPenalty)}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500">Alignment bonus</span>
                    <span className={`font-bold ${alignmentBonus >= 0 ? 'text-green-600' : 'text-red-500'}`}>{alignmentBonus >= 0 ? '+' : ''}{alignmentBonus}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500">Confidence bonus</span>
                    <span className={`font-bold ${confidenceBonus >= 0 ? 'text-green-600' : 'text-red-500'}`}>{confidenceBonus >= 0 ? '+' : ''}{confidenceBonus}</span>
                  </div>
                  <div className="flex justify-between font-mono border-t border-gray-200 pt-3">
                    <span className="text-gray-500">Manual adjust</span>
                    <span className={`font-bold ${manualAdjust > 0 ? 'text-green-600' : manualAdjust < 0 ? 'text-red-500' : 'text-gray-400'}`}>{manualAdjust >= 0 ? '+' : ''}{manualAdjust}</span>
                  </div>
                  <div className="flex justify-between font-mono border-t border-gray-200 pt-3">
                    <span className="font-black text-gray-900">Adjusted score</span>
                    <span className="font-black text-astrix-teal">{adjustedScore}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 font-medium">These adjustments are local — they don't modify the stored score. Use them to model priority before committing a decision.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSavingDecision && setIsDecisionModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Commit Decision</h2>
              <button onClick={() => !isSavingDecision && setIsDecisionModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs font-mono text-gray-500 uppercase font-bold mb-1">Opportunity</div>
                <div className="font-bold text-gray-900">{title}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Action</label>
                <select value={decisionAction} onChange={e => setDecisionAction(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="Build">Build</option>
                  <option value="Fix">Fix (Bug / Tech Debt)</option>
                  <option value="Experiment">Experiment (Research / A-B Test)</option>
                  <option value="Defer">Defer (Not right now)</option>
                  <option value="Reject">Reject (Will not do)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Rationale <span className="text-brand-red">*</span></label>
                <textarea value={decisionRationale} onChange={e => setDecisionRationale(e.target.value)} placeholder="Explain why this decision was made. Creates a permanent evidence trail..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal min-h-[120px] resize-none" />
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {decisionRationale.length < 20 ? `${20 - decisionRationale.length} more characters required` : '✓ Looks good'}
                </div>
              </div>
              <button onClick={handleSaveDecision} disabled={isSavingDecision || decisionRationale.length < 20} className="w-full bg-astrix-teal text-white font-bold py-4 rounded-xl hover:bg-astrix-darkTeal disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {isSavingDecision ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
