import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { AppLayout } from '../../layouts/AppLayout';
import { AlertCircle, TrendingUp, TrendingDown, Radio, ArrowRight, Quote, Loader2, Building2, X, MessageSquare, History, GitMerge, Unlink, BarChart3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useProblem, useProblems, api } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useToast } from '../../contexts/ToastContext';

export const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { activeWorkspace } = useWorkspace();
  const { data, isLoading, refetch } = useProblem(activeWorkspace?.id, id);
  const { data: allProblems } = useProblems(activeWorkspace?.id);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Demo User', text: 'This is blocking our Q3 renewal with CloudScale. High priority.', time: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'c2', author: 'Demo User', text: 'Engineering confirmed 3-sprint estimate. Proceeding with Build decision.', time: new Date(Date.now() - 86400000).toISOString() },
  ]);

  const tabs = ['Overview', 'Evidence', 'Accounts', 'Metrics', 'History', 'Comments'];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };
  const formatDate = (dateString: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
  const formatDateLong = (dateString: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

  const handleUnlinkSignal = async (signalId: string) => {
    if (!id) return;
    await api.problems.unlinkSignal(id, signalId);
    addToast('Signal unlinked from problem.', 'success');
    await refetch();
  };

  const handleMerge = () => {
    if (!mergeTargetId) { addToast('Select a problem to merge into.', 'error'); return; }
    const target = allProblems.find((p: any) => p.id === mergeTargetId);
    addToast(`Problem merged into "${target?.title}".`, 'success');
    setShowMergeModal(false);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments(prev => [...prev, { id: `c${Date.now()}`, author: 'Demo User', text: comment, time: new Date().toISOString() }]);
    setComment('');
    addToast('Comment added.', 'success');
  };

  const MOCK_HISTORY = [
    { action: 'Problem created from signals', actor: 'Demo User', time: new Date(Date.now() - 86400000 * 5).toISOString() },
    { action: 'Severity changed → Critical', actor: 'Demo User', time: new Date(Date.now() - 86400000 * 3).toISOString() },
    { action: 'Linked to opportunity (score 92)', actor: 'System', time: new Date(Date.now() - 86400000 * 2).toISOString() },
    { action: 'Decision committed: Build', actor: 'Demo User', time: new Date(Date.now() - 86400000).toISOString() },
    { action: 'Launch logged: Enterprise SAML SSO', actor: 'Demo User', time: new Date(Date.now() - 86400000 * 14).toISOString() },
  ];

  if (isLoading) {
    return <AppLayout title="Loading Problem..." subtitle="Fetching AI analysis and evidence"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div></AppLayout>;
  }

  if (!data || !data.problem) {
    return <AppLayout title="Problem Not Found" subtitle="Could not load data"><div className="flex items-center justify-center h-64 text-gray-500">Problem does not exist or you don't have access.</div></AppLayout>;
  }

  const { problem: currentProblem, signals: problemSignals, accounts: problemAccounts } = data;
  const totalArrRisk = problemAccounts.reduce((sum: number, acc: any) => sum + Number(acc.arr), 0);

  return (
    <AppLayout
      title={currentProblem.title}
      subtitle={`Canonical Problem • Created ${formatDate(currentProblem.created_at)}`}
      actions={
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button onClick={() => setShowMergeModal(true)} className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
            <GitMerge className="w-4 h-4" /> Merge
          </button>
          <Link to="/app/opportunities" className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 justify-center">
            View Opportunities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      }
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-wrap gap-6 md:gap-16">
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Severity</div>
          <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md text-sm ${currentProblem.severity === 'Critical' ? 'bg-red-50 text-brand-red' : currentProblem.severity === 'High' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-700'}`}>
            {currentProblem.severity === 'Critical' && <AlertCircle className="w-4 h-4" />}
            {currentProblem.severity || 'Medium'}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Signals</div>
          <div className="font-heading font-black text-2xl text-gray-900">{currentProblem.evidence_count}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Affected ARR</div>
          <div className="font-heading font-black text-2xl text-brand-blue">{formatCurrency(currentProblem.affected_arr)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Trend</div>
          <div className="flex items-center gap-1 font-bold text-lg">
            {currentProblem.trend === 'Rising' ? <><TrendingUp className="w-5 h-5 text-brand-red" /><span className="text-brand-red">Rising</span></> :
              currentProblem.trend === 'Declining' ? <><TrendingDown className="w-5 h-5 text-green-500" /><span className="text-green-500">Declining</span></> :
                <><div className="w-4 h-[2px] bg-gray-400"></div><span className="text-gray-500">Stable</span></>}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Status</div>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${currentProblem.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {currentProblem.status || 'Active'}
          </span>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
            className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap focus-visible:outline-none ${activeTab === tab.toLowerCase() ? 'text-brand-blue' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {tab}
            {tab === 'Comments' && comments.length > 0 && <span className="ml-1.5 bg-gray-100 text-gray-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">{comments.length}</span>}
            {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full animate-[fadeIn_0.2s_ease-out]"></div>}
          </button>
        ))}
      </div>

      <div className="animate-[fadeIn_0.3s_ease-out]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-brand-blue/10 text-brand-blue p-1.5 rounded-lg"><Radio className="w-4 h-4" /></span>
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{currentProblem.description || 'No description.'}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-xs font-mono text-gray-400 uppercase font-bold mb-4">Details</h4>
                <div className="space-y-3">
                  <div><div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Product Area</div><span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold">{currentProblem.product_area || 'Uncategorized'}</span></div>
                  <div><div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Evidence</div><span className="text-sm font-bold text-gray-900">{currentProblem.evidence_count} signals</span></div>
                  <div>
                    <Link to={`/app/evidence/${id}`} className="text-xs font-bold text-astrix-teal hover:underline">View full evidence →</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Raw Signals ({problemSignals.length})</h3>
            {problemSignals.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-2xl text-center text-gray-500 font-medium border border-gray-200">No signals linked to this problem yet.</div>
            ) : (
              problemSignals.map((sig: any) => (
                <div key={sig.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${sig.severity_label === 'Critical' ? 'bg-brand-red' : 'bg-brand-yellow'}`}></div>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Quote className="w-12 h-12 text-gray-50 opacity-50" />
                    <button onClick={() => handleUnlinkSignal(sig.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 bg-white border border-red-100 px-2 py-1 rounded-lg z-10">
                      <Unlink className="w-3 h-3" /> Unlink
                    </button>
                  </div>
                  <p className="text-gray-800 font-medium text-base md:text-lg mb-4 relative z-10">"{sig.raw_text}"</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-gray-500">
                    <span className="text-gray-900">{sig.accounts?.name || 'Unknown Account'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="uppercase">{sig.source_type}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{formatDate(sig.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-gray-900">Affected Accounts</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">
                  <span className="font-bold text-gray-900">{problemAccounts.length}</span> accounts — <span className="font-bold text-brand-blue">{formatCurrency(totalArrRisk)}</span> ARR at risk
                </p>
              </div>
            </div>
            {problemAccounts.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-2xl text-center border border-gray-200">
                <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No accounts linked yet.</h4>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 font-mono text-xs text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Account</th><th className="p-4">ARR</th><th className="p-4">Plan</th><th className="p-4">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {problemAccounts.map((acc: any) => (
                        <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">
                            <Link to={`/app/accounts/${acc.id}`} className="hover:text-brand-blue transition-colors">{acc.name}</Link>
                          </td>
                          <td className="p-4 font-mono font-bold text-brand-blue">{formatCurrency(acc.arr)}</td>
                          <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{acc.plan || 'Standard'}</span></td>
                          <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${Number(acc.health_score) < 50 ? 'bg-red-100 text-red-700' : Number(acc.health_score) < 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{acc.health_score}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (() => {
          const signalCount = currentProblem.evidence_count || 0;
          const chartData = (() => {
            const base = Math.max(1, Math.floor(signalCount / 8));
            const seeds = [0.30, 0.40, 0.50, 0.60, 0.65, 0.75, 0.82, 0.88, 0.93, 1.0, 0.97, 1.05];
            const now = new Date();
            return Array.from({ length: 12 }, (_, i) => {
              const d = new Date(now);
              d.setDate(d.getDate() - (11 - i) * 7);
              const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const jitter = 1 + (Math.random() * 0.2 - 0.1);
              const value = Math.max(0, Math.round(base * seeds[i] * jitter));
              return { label, value };
            });
          })();

          const weeklyTotal = chartData.reduce((s, d) => s + d.value, 0);
          const recentAvg = Math.round(chartData.slice(-4).reduce((s, d) => s + d.value, 0) / 4);
          const earlyAvg = Math.round(chartData.slice(0, 4).reduce((s, d) => s + d.value, 0) / 4);
          const growthPct = earlyAvg > 0 ? Math.round(((recentAvg - earlyAvg) / earlyAvg) * 100) : 0;

          const option = {
            grid: { top: 16, right: 20, bottom: 32, left: 48 },
            xAxis: {
              type: 'category',
              data: chartData.map(d => d.label),
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, interval: 2 },
            },
            yAxis: {
              type: 'value',
              axisLine: { show: false },
              axisTick: { show: false },
              splitLine: { lineStyle: { color: '#f3f4f6' } },
              axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600 },
              minInterval: 1,
            },
            tooltip: {
              trigger: 'axis',
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderWidth: 1,
              textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 700 },
              formatter: (params: any) => `<span style="font-size:10px;color:#94a3b8">${params[0].name}</span><br/><b>${params[0].value}</b> signals`,
            },
            series: [{
              type: 'bar',
              data: chartData.map(d => d.value),
              barMaxWidth: 24,
              itemStyle: {
                color: (params: any) => {
                  const pct = params.dataIndex / chartData.length;
                  if (pct > 0.75) return '#ef4444';
                  if (pct > 0.5) return '#f97316';
                  return '#94a3b8';
                },
                borderRadius: [4, 4, 0, 0],
              },
            }, {
              type: 'line',
              data: chartData.map(d => d.value),
              smooth: 0.4,
              symbol: 'none',
              lineStyle: { color: '#0ea5e9', width: 2, type: 'dashed' },
              itemStyle: { color: '#0ea5e9' },
            }],
          };

          return (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-blue" /> Signal Volume Trend
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                  <div className="text-3xl font-black text-gray-900">{signalCount}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Total Signals</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
                  <div className="text-3xl font-black text-brand-blue">{recentAvg}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Avg / Week (recent)</div>
                </div>
                <div className={`rounded-2xl p-5 shadow-sm text-center border ${growthPct > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className={`text-3xl font-black flex items-center justify-center gap-1 ${growthPct > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {growthPct > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    {growthPct > 0 ? '+' : ''}{growthPct}%
                  </div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Trend (12 weeks)</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Weekly Signal Ingest — Last 12 Weeks</span>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Recent surge</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-blue inline-block" /> Trend line</span>
                  </div>
                </div>
                <ReactECharts option={option} style={{ height: 220 }} notMerge />
                <p className="text-xs text-gray-400 font-medium mt-2 text-center">
                  {weeklyTotal} total signals over the tracked period. {currentProblem.trend === 'Rising' ? '⚠️ Problem is actively growing.' : currentProblem.trend === 'Declining' ? '✅ Signal volume is declining.' : '→ Signal volume is stable.'}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest text-[10px] font-mono text-gray-400">Severity Breakdown</h4>
                {[
                  { label: 'Critical', pct: 35, color: 'bg-red-500' },
                  { label: 'High', pct: 40, color: 'bg-orange-400' },
                  { label: 'Medium', pct: 18, color: 'bg-yellow-400' },
                  { label: 'Low', pct: 7, color: 'bg-gray-300' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-3 mb-3">
                    <div className="text-xs font-bold text-gray-600 w-16 shrink-0">{label}</div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs font-black text-gray-700 w-8 text-right">{pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" /> Change History
            </h3>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {MOCK_HISTORY.map((event, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{event.actor === 'System' ? '⚙' : 'D'}</div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{event.action}</div>
                        <div className="text-xs text-gray-500">{event.actor}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{formatDateLong(event.time)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" /> Comments ({comments.length})
            </h3>
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-astrix-teal text-white flex items-center justify-center text-xs font-bold">D</div>
                      <span className="text-sm font-bold text-gray-900">{c.author}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{formatDateLong(c.time)}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal transition-all resize-none mb-3"
              />
              <div className="flex justify-end">
                <button onClick={handleAddComment} disabled={!comment.trim()} className="bg-astrix-teal text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-astrix-darkTeal transition-colors">
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowMergeModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Merge Problem</h2>
              <button onClick={() => setShowMergeModal(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Merge <span className="font-bold text-gray-900">"{currentProblem.title}"</span> into another problem. Its signals will be moved.</p>
              <select value={mergeTargetId} onChange={e => setMergeTargetId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                <option value="">Select target problem...</option>
                {allProblems.filter((p: any) => p.id !== id).map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowMergeModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button onClick={handleMerge} disabled={!mergeTargetId} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  <GitMerge className="w-4 h-4" /> Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
