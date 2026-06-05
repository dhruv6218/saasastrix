import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { AppLayout } from '../../layouts/AppLayout';
import {
  TrendingUp,
  ArrowRight,
  UploadCloud,
  Activity,
  Database,
  CheckCircle2,
  Layers,
  Clock,
  AlertCircle,
  Zap,
  Sparkles,
  Plus,
  Rocket,
  FileText,
  ChevronRight,
  Lock,
  GitCompare,
  Signal,
  Target,
  BarChart3,
  Users,
  FlameKindling,
  Timer,
  BadgeCheck,
  TrendingDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  useSignals,
  useOpportunities,
  useDecisions,
  useLaunches,
} from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import { usePlan } from '../../hooks/usePlan';

/* ─── Signal Trend Chart ──────────────────────────────────────────────────── */
const SignalTrendChart: React.FC<{ signalCount: number }> = ({ signalCount }) => {
  const chartData = useMemo(() => {
    const base = Math.max(10, Math.floor(signalCount * 0.05));
    const seeds = [0.45, 0.55, 0.62, 0.70, 0.75, 0.85, 1.0];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const jitter = 1 + (Math.random() * 0.18 - 0.09);
      const value = Math.round(base * seeds[i] * jitter * (signalCount > 0 ? 1 : 0));
      return { label, value };
    });
  }, [signalCount]);

  const option = {
    grid: { top: 12, right: 16, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600 },
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
      formatter: (params: { name: string; value: number }[]) =>
        `<span style="font-size:10px;color:#94a3b8">${params[0].name}</span><br/><b>${params[0].value}</b> signals`,
    },
    series: [
      {
        type: 'line',
        data: chartData.map((d) => d.value),
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#0ea5e9', width: 2.5 },
        itemStyle: { color: '#0ea5e9', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(14,165,233,0.18)' },
              { offset: 1, color: 'rgba(14,165,233,0.01)' },
            ],
          },
        },
      },
    ],
  };

  const totalWeek = chartData.reduce((s, d) => s + d.value, 0);
  const delta = chartData[6].value - chartData[0].value;
  const positive = delta >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6 animate-slide-up stagger-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest">
            Signal Ingest — Last 7 Days
          </h2>
          <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${positive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {positive ? '+' : ''}{delta} vs 7d ago
          </span>
        </div>
        <span className="text-[11px] font-bold text-gray-400">{totalWeek} total this week</span>
      </div>
      <ReactECharts option={option} style={{ height: 140 }} notMerge />
    </div>
  );
};

export const Dashboard = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const wsId = activeWorkspace?.id;

  const { data: oppData, isLoading: oppLoading } = useOpportunities(wsId);
  const { data: sigData } = useSignals(wsId);
  const { data: decData } = useDecisions(wsId);
  const { data: launchData } = useLaunches(wsId);

  const { plan, limits } = usePlan();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const opportunities = oppData || [];
  const signalsCount = sigData?.total || 0;
  const decisions = decData || [];
  const launches = launchData || [];

  const topOpp = opportunities[0];
  const topOpportunities = opportunities.slice(0, 5);
  const recentDecisions = decisions.slice(0, 4);

  const activeLaunches = launches.filter(
    (l) => l.status === 'active' || l.status === 'pending_review'
  );
  const reviewsDue = activeLaunches.filter((l) => {
    const daysSince =
      (Date.now() - new Date(l.launched_at).getTime()) / (1000 * 3600 * 24);
    return daysSince >= 7;
  });

  const unmatchedSignals = Math.max(0, Math.floor(signalsCount * 0.15));
  const solvedLaunches = launches.filter((l) => l.pm_verdict === 'Solved').length;
  const verdictRate =
    launches.length > 0 ? Math.round((solvedLaunches / launches.length) * 100) : 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const signalPct = Math.min(100, Math.round((signalsCount / limits.signals) * 100));

  const getContextActions = () => {
    if (signalsCount === 0)
      return [
        { icon: UploadCloud, label: 'Import Signals CSV', primary: true, onClick: () => window.dispatchEvent(new CustomEvent('open-upload-modal')) },
        { icon: Plus, label: 'Add Signal', primary: false, onClick: () => navigate('/app/signals') },
        { icon: Layers, label: 'View Problems', primary: false, onClick: () => navigate('/app/problems') },
      ];
    if (unmatchedSignals > 0)
      return [
        { icon: AlertCircle, label: `Review ${unmatchedSignals} Unmatched`, primary: true, onClick: () => navigate('/app/signals') },
        { icon: Layers, label: 'New Problem', primary: false, onClick: () => navigate('/app/problems') },
        { icon: UploadCloud, label: 'Import CSV', primary: false, onClick: () => window.dispatchEvent(new CustomEvent('open-upload-modal')) },
        { icon: Rocket, label: 'Log Launch', primary: false, onClick: () => navigate('/app/launches') },
      ];
    if (opportunities.length > 0 && decisions.length === 0)
      return [
        { icon: BadgeCheck, label: 'Create Decision', primary: true, onClick: () => navigate('/app/decisions') },
        { icon: TrendingUp, label: 'View Opportunities', primary: false, onClick: () => navigate('/app/opportunities') },
        { icon: UploadCloud, label: 'Import CSV', primary: false, onClick: () => window.dispatchEvent(new CustomEvent('open-upload-modal')) },
      ];
    if (decisions.length > 0 && activeLaunches.length === 0)
      return [
        { icon: Rocket, label: 'Log a Launch', primary: true, onClick: () => navigate('/app/launches') },
        { icon: Layers, label: 'New Problem', primary: false, onClick: () => navigate('/app/problems') },
        { icon: UploadCloud, label: 'Import CSV', primary: false, onClick: () => window.dispatchEvent(new CustomEvent('open-upload-modal')) },
      ];
    return [
      { icon: Plus, label: 'Add Signal', primary: false, onClick: () => navigate('/app/signals') },
      { icon: Layers, label: 'New Problem', primary: false, onClick: () => navigate('/app/problems') },
      { icon: Rocket, label: 'Log Launch', primary: false, onClick: () => navigate('/app/launches') },
      { icon: UploadCloud, label: 'Import CSV', primary: true, onClick: () => window.dispatchEvent(new CustomEvent('open-upload-modal')) },
    ];
  };

  const contextActions = getContextActions();


  return (
    <AppLayout
      title={`${getGreeting()}, ${firstName}.`}

      subtitle={`${currentDate} · Here is what needs your attention today.`}
    >
      {/* ── Free Plan Upgrade Card ─────────────────────────────────── */}
      {plan === 'free' && (
        <div className="mb-6 relative overflow-hidden rounded-2xl border border-brand-blue/20 bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] shadow-lg animate-slide-up">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-astrix-teal/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/15 border border-brand-blue/30 px-2.5 py-1 rounded-full">Free Plan</span>
                <span className="text-[10px] font-medium text-slate-400">· Upgrade anytime, cancel anytime</span>
              </div>
              <h3 className="font-heading text-lg md:text-xl font-black text-white leading-tight mb-3">
                Unlock your full product loop —{' '}
                <span className="text-astrix-teal">starting at $59/mo</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: GitCompare, label: 'Compare Mode' },
                  { icon: Rocket, label: 'Multiple Launches' },
                  { icon: Sparkles, label: '1,500 AI calls/mo' },
                  { icon: Lock, label: 'Saved Views' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                    <Icon className="w-3 h-3 text-astrix-teal shrink-0" /> {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-3 md:gap-2.5 md:min-w-[200px]">
              {[
                { label: 'Signals', used: signalsCount, max: limits.signals },
                { label: 'Active Launches', used: activeLaunches.length, max: limits.activeLaunches },
                { label: 'Opportunities shown', used: Math.min(opportunities.length, limits.visibleOpps), max: limits.visibleOpps },
              ].map(({ label, used, max }) => {
                const pct = Math.min(100, Math.round((used / max) * 100));
                const hot = pct >= 75;
                return (
                  <div key={label} className="flex-1 md:flex-none">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                      <span className={`text-[10px] font-black ${hot ? 'text-amber-400' : 'text-slate-300'}`}>{used}/{max}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${hot ? 'bg-amber-400' : 'bg-astrix-teal'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <Link to="/pricing" className="flex-1 md:flex-none text-center bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2 whitespace-nowrap">
                See all plans <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="flex-1 md:flex-none text-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Launch Reviews Due Banner (stronger) ──────────────────── */}
      {reviewsDue.length > 0 && (
        <div className="mb-6 relative overflow-hidden rounded-2xl animate-slide-up">
          <div className="absolute inset-y-0 left-0 w-1 bg-orange-500 rounded-l-2xl" />
          <div className="bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200 rounded-2xl p-5 md:p-6 pl-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-orange-500 rounded-xl shrink-0 shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-base font-black text-orange-900 tracking-tight">Launch Reviews Due</h3>
                    <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {reviewsDue.length} pending
                    </span>
                  </div>
                  <p className="text-sm font-medium text-orange-800/80">Outcome measurement overdue — your verdict loop is incomplete.</p>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {reviewsDue.slice(0, 3).map((l) => {
                      const days = Math.floor((Date.now() - new Date(l.launched_at).getTime()) / (1000 * 3600 * 24));
                      return (
                        <Link key={l.id} to={`/app/launches/${l.id}`} className="flex items-center gap-1.5 bg-white border border-orange-200 px-2.5 py-1 rounded-lg text-xs font-bold text-orange-800 hover:border-orange-400 transition-colors">
                          <Timer className="w-3 h-3 text-orange-500" />
                          {l.title} · <span className="text-orange-500">Day {days}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Link to="/app/launches" className="shrink-0 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-orange-200 flex items-center justify-center gap-2 transition-colors group">
                Review Outcomes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up stagger-1">

        {/* Signals used */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-brand-blue"><Signal className="w-4 h-4" /></div>
            <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">Free · {limits.signals} cap</span>
          </div>
          <div className="flex items-end gap-1 mb-0.5">
            <span className="text-3xl font-heading font-black text-gray-900 leading-none">{signalsCount}</span>
            <span className="text-sm font-bold text-gray-400 mb-0.5">/ {limits.signals}</span>
          </div>
          <div className="text-xs font-medium text-gray-500 mb-3">Signals used</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${signalPct >= 100 ? 'bg-red-500' : signalPct >= 75 ? 'bg-amber-400' : 'bg-brand-blue'}`}
              style={{ width: `${signalPct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-medium mt-1.5">{limits.signals - signalsCount} remaining on Free plan</p>
        </div>

        {/* Unmatched signals */}
        <Link to="/app/signals" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 hover:border-amber-200 transition-all duration-300 block">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-600"><AlertCircle className="w-4 h-4" /></div>
            {unmatchedSignals > 0 && (
              <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-widest">Action needed</span>
            )}
          </div>
          <div className="text-3xl font-heading font-black text-gray-900 leading-none mb-0.5">{unmatchedSignals}</div>
          <div className="text-xs font-medium text-gray-500 mb-3">Unmatched signals</div>
          {unmatchedSignals > 0 ? (
            <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              <ArrowRight className="w-3 h-3" /> No account match · Review triage
            </div>
          ) : (
            <div className="text-[10px] font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All signals matched
            </div>
          )}
        </Link>

        {/* Active launches */}
        <Link to="/app/launches" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition-all duration-300 block">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600"><Rocket className="w-4 h-4" /></div>
            {reviewsDue.length > 0 && (
              <span className="text-[9px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded uppercase tracking-widest">{reviewsDue.length} overdue</span>
            )}
          </div>
          <div className="text-3xl font-heading font-black text-gray-900 leading-none mb-0.5">{activeLaunches.length}</div>
          <div className="text-xs font-medium text-gray-500 mb-3">Active launches</div>
          <div className={`text-[10px] font-bold flex items-center gap-1 ${activeLaunches.length >= limits.activeLaunches ? 'text-amber-600' : 'text-gray-400'}`}>
            {activeLaunches.length >= limits.activeLaunches
              ? <><Lock className="w-3 h-3" /> Limit reached · Upgrade to add more</>
              : <><Activity className="w-3 h-3" /> {limits.activeLaunches - activeLaunches.length} slot{limits.activeLaunches - activeLaunches.length !== 1 ? 's' : ''} remaining</>}
          </div>
        </Link>

        {/* Verdict completion rate */}
        <Link to="/app/launches" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 hover:border-green-200 transition-all duration-300 block">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 rounded-lg border border-green-100 text-green-600"><BarChart3 className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-heading font-black text-gray-900 leading-none mb-0.5">
            {launches.length === 0 ? '—' : `${verdictRate}%`}
          </div>
          <div className="text-xs font-medium text-gray-500 mb-3">Verdict completion</div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
            <TrendingUp className="w-3 h-3" />
            {launches.length === 0 ? 'No launches yet' : `${solvedLaunches} of ${launches.length} solved`}
          </div>
        </Link>
      </div>

      {/* ── Context-Sensitive Quick Actions ───────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-6 shadow-sm flex flex-wrap gap-2 items-center animate-slide-up stagger-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 hidden sm:block">Next action</span>
        {contextActions.map(({ icon: Icon, label, primary, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-sm ${
              primary
                ? 'bg-astrix-teal text-white hover:bg-astrix-darkTeal shadow-sm'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Signal Trend Chart ────────────────────────────────────── */}
      <SignalTrendChart signalCount={signalsCount} />

      {/* ── Main Content Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12">

        {/* Left col — top opp hero + ranked list */}
        <div className="xl:col-span-2 flex flex-col gap-5 animate-slide-up stagger-3">

          {/* Hero: #1 Opportunity snapshot */}
          {!oppLoading && topOpp && (
            <div className="relative overflow-hidden rounded-2xl border border-astrix-teal/20 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-astrix-teal/8 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-astrix-teal bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <FlameKindling className="w-2.5 h-2.5" /> #1 Priority
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${topOpp.recommended_action === 'Build' ? 'bg-blue-50 text-blue-700 border-blue-200' : topOpp.recommended_action === 'Fix' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {topOpp.recommended_action}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-black text-gray-900 mb-2 leading-tight">{topOpp.problems?.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
                    <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-red-400" />{formatCurrency(topOpp.problems?.affected_arr || 0)} ARR at risk</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" />{topOpp.problems?.evidence_count || 0} signals</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-5xl font-heading font-black text-astrix-teal leading-none">{topOpp.opportunity_score}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">opp. score</div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden ml-auto">
                    <div className="h-full bg-astrix-teal rounded-full" style={{ width: `${topOpp.opportunity_score}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-teal-100 flex items-center justify-between relative z-10">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-gray-500">Pain <strong className="text-gray-800">{topOpp.pain_score}</strong></span>
                  <span className="text-gray-300">·</span>
                  <span className="text-[10px] font-bold text-gray-500">Demand <strong className="text-gray-800">{topOpp.demand_score}</strong></span>
                  <span className="text-gray-300">·</span>
                  <span className="text-[10px] font-bold text-gray-500">ARR <strong className="text-gray-800">{topOpp.arr_score}</strong></span>
                </div>
                <Link to={`/app/opportunities/${topOpp.id}`} className="flex items-center gap-1.5 text-xs font-black text-astrix-teal hover:text-astrix-darkTeal transition-colors">
                  View opportunity <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Ranked opportunity list */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-astrix-teal" /> All Opportunities
              </h2>
              <Link to="/app/opportunities" className="text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal transition-colors flex items-center gap-1 uppercase tracking-widest">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {oppLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="w-full h-14 rounded-xl" />
                  <Skeleton className="w-full h-14 rounded-xl" />
                  <Skeleton className="w-full h-14 rounded-xl" />
                </div>
              ) : topOpportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8 bg-gray-50/50">
                  <Database className="w-10 h-10 text-gray-300 mb-3" />
                  <h3 className="text-sm font-bold text-gray-900 mb-1">No opportunities yet</h3>
                  <p className="text-xs text-gray-500 font-medium max-w-xs">Import signals and run AI clustering to surface ranked opportunities.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topOpportunities.map((opp, index) => (
                    <Link key={opp.id} to={`/app/opportunities/${opp.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading font-black text-sm shrink-0 ${index === 0 ? 'bg-astrix-teal text-white' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate group-hover:text-astrix-teal transition-colors">{opp.problems?.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${opp.recommended_action === 'Build' ? 'bg-blue-50 text-blue-700 border-blue-100' : opp.recommended_action === 'Fix' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {opp.recommended_action}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{formatCurrency(opp.problems?.affected_arr || 0)} ARR</span>
                        </div>
                        {(opp as any).top_accounts && (opp as any).top_accounts.length > 0 && (
                          <div className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">{(opp as any).top_accounts.slice(0, 2).map((a: any) => a.name).join(' · ')}</div>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="font-heading font-black text-xl text-gray-900">{opp.opportunity_score}</span>
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${opp.opportunity_score >= 80 ? 'bg-astrix-teal' : 'bg-astrix-gold'}`} style={{ width: `${opp.opportunity_score}%` }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right col — active launches + recent decisions */}
        <div className="xl:col-span-1 flex flex-col gap-5 animate-slide-up stagger-4">

          {/* Active Launches */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-blue" /> Active Launches
              </h2>
              <Link to="/app/launches" className="text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors">View all</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {activeLaunches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50/50">
                  <Rocket className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No active launches yet.</p>
                  <button onClick={() => navigate('/app/launches')} className="mt-3 text-xs font-bold text-brand-blue hover:underline">+ Log a launch</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeLaunches.slice(0, 3).map((launch) => {
                    const days = Math.floor((Date.now() - new Date(launch.launched_at).getTime()) / (1000 * 3600 * 24));
                    const overdue = days >= 7;
                    return (
                      <Link key={launch.id} to={`/app/launches/${launch.id}`} className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${overdue ? 'bg-orange-500' : 'bg-brand-blue'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-brand-blue transition-colors">{launch.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Rocket className="w-2.5 h-2.5" /> Day {days}</span>
                            {overdue && <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded uppercase tracking-widest">Review due</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Decisions */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Recent Decisions
              </h2>
              <Link to="/app/decisions" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">History</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {recentDecisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50/50">
                  <FileText className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No decisions logged yet.</p>
                  <button onClick={() => navigate('/app/decisions')} className="mt-3 text-xs font-bold text-astrix-teal hover:underline">+ Make a decision</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentDecisions.map((dec) => (
                    <Link key={dec.id} to={`/app/decisions/${dec.id}`} className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dec.action === 'Build' ? 'bg-blue-500' : dec.action === 'Fix' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-astrix-teal transition-colors">{dec.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${dec.action === 'Build' ? 'bg-blue-50 text-blue-700' : dec.action === 'Fix' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {dec.action}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Decision Win Rate */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-astrix-teal" /> Decision Win Rate
              </h2>
              <Link to="/app/decisions" className="text-xs font-bold text-gray-400 hover:text-astrix-teal transition-colors">All decisions</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4">
              {decisions.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400 font-medium">
                  <BadgeCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  Log decisions to track your win rate.
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-4 mb-4">
                    <div>
                      <div className="text-4xl font-heading font-black text-gray-900 leading-none">{verdictRate}%</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Win Rate</div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-2xl font-heading font-black text-gray-700 leading-none">{decisions.length}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Decisions</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div className="bg-astrix-teal h-2 rounded-full transition-all duration-500" style={{ width: `${verdictRate}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Build','Fix','Experiment'] as const).map(action => {
                      const count = decisions.filter((d: any) => d.action === action).length;
                      return (
                        <div key={action} className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                          <div className="text-lg font-heading font-black text-gray-900">{count}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{action}</div>
                        </div>
                      );
                    })}
                  </div>
                  {solvedLaunches > 0 && (
                    <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-2.5">
                      <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-xs font-bold text-green-700">{solvedLaunches} launch{solvedLaunches !== 1 ? 'es' : ''} marked Solved</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Problems summary */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> Open Problems
              </h2>
              <Link to="/app/problems" className="text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors">View all</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {oppLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="w-full h-10 rounded-lg" />
                  <Skeleton className="w-full h-10 rounded-lg" />
                </div>
              ) : opportunities.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">No problems yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {opportunities.slice(0, 3).map((opp) => (
                    <Link key={opp.id} to={`/app/problems/${opp.problem_id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-purple-600 transition-colors">{opp.problems?.title}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{opp.problems?.severity} · {opp.problems?.evidence_count} signals</div>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${opp.problems?.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : opp.problems?.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {opp.problems?.severity}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
