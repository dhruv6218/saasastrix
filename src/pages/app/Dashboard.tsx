import React from 'react';
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
  PieChart,
  Plus,
  Rocket,
  FileText,
  ChevronRight,
  Lock,
  GitCompare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useSignals, 
  useOpportunities, 
  useDecisions, 
  useLaunches 
} from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import { usePlan } from '../../hooks/usePlan';

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

  const topOpportunities = opportunities.slice(0, 5);
  const recentDecisions = decisions.slice(0, 4);
  
  const activeLaunches = launches.filter(l => l.status === 'active' || l.status === 'pending_review');
  const reviewsDue = activeLaunches.filter(l => {
    const launchDate = new Date(l.launched_at);
    const daysSinceLaunch = (Date.now() - launchDate.getTime()) / (1000 * 3600 * 24);
    return daysSinceLaunch >= 7; 
  });
  
  const unmatchedSignals = Math.max(0, Math.floor(signalsCount * 0.15));
  const solvedLaunches = launches.filter(l => l.pm_verdict === 'Solved').length;
  const decisionAlpha = launches.length > 0 ? Math.round((solvedLaunches / launches.length) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppLayout 
      title={`${getGreeting()}, ${firstName}.`} 
      subtitle={`${currentDate} • Here is what needs your attention today.`}
    >
      {/* Free Plan Upgrade Card */}
      {plan === 'free' && (
        <div className="mb-6 relative overflow-hidden rounded-2xl border border-brand-blue/20 bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] shadow-lg animate-slide-up">
          {/* Decorative blobs */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-astrix-teal/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            {/* Left — label + title + locked features */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/15 border border-brand-blue/30 px-2.5 py-1 rounded-full">Free Plan</span>
                <span className="text-[10px] font-medium text-slate-400">· Upgrade anytime, cancel anytime</span>
              </div>
              <h3 className="font-heading text-lg md:text-xl font-black text-white leading-tight mb-3">
                Unlock your full product loop — <span className="text-astrix-teal">starting at $59/mo</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: GitCompare, label: 'Compare Mode' },
                  { icon: Rocket,     label: 'Multiple Launches' },
                  { icon: Sparkles,   label: '1,500 AI calls/mo' },
                  { icon: Lock,       label: 'Saved Views' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                    <Icon className="w-3 h-3 text-astrix-teal shrink-0" /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Center — usage meters */}
            <div className="flex flex-row md:flex-col gap-3 md:gap-2.5 md:min-w-[200px]">
              {[
                { label: 'Signals', used: signalsCount, max: limits.signals },
                { label: 'Active Launches', used: launches.filter((l: any) => l.status === 'active').length, max: limits.activeLaunches },
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
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${hot ? 'bg-amber-400' : 'bg-astrix-teal'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right — CTA */}
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <Link
                to="/pricing"
                className="flex-1 md:flex-none text-center bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                See all plans <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pricing"
                className="flex-1 md:flex-none text-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {reviewsDue.length > 0 && (
        <div className="mb-8 relative overflow-hidden rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-amber-200/60 bg-gradient-to-br from-amber-50/90 to-orange-50/50 backdrop-blur-md animate-slide-up">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-start sm:items-center gap-4 text-amber-900 relative z-10">
            <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl shrink-0 shadow-sm border border-amber-100/50">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse-slow" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold tracking-tight">Launch Reviews Due</h3>
              <p className="text-sm font-medium text-amber-700/80 mt-0.5">
                You have {reviewsDue.length} launch{reviewsDue.length > 1 ? 'es' : ''} pending outcome measurement.
              </p>
            </div>
          </div>
          <Link to="/app/launches" className="relative z-10 bg-white text-amber-700 border border-amber-200/50 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:bg-amber-50/50 hover:border-amber-300 transition-all duration-300 shrink-0 w-full sm:w-auto text-center flex items-center justify-center gap-2 group">
            Review Outcomes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up stagger-1">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-brand-blue"><PieChart className="w-4 h-4" /></div>
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Free Plan</span>
          </div>
          <div className="text-3xl font-heading font-black text-gray-900">{signalsCount}</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Signals Processed</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
            <div className="bg-brand-blue h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (signalsCount / 200) * 100)}%` }}></div>
          </div>
        </div>

        <Link to="/app/signals" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-amber-200 transition-all duration-300 block">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-600"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-heading font-black text-gray-900">{unmatchedSignals}</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Unmatched Signals</div>
          <div className="text-[10px] font-bold text-amber-600 mt-4 flex items-center gap-1 group-hover:underline"><ArrowRight className="w-3 h-3" /> Needs Triage</div>
        </Link>

        <Link to="/app/opportunities" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-astrix-teal/30 transition-all duration-300 block">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-astrix-teal/5 rounded-full blur-2xl group-hover:bg-astrix-teal/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-teal-50 rounded-lg border border-teal-100 text-astrix-teal"><Zap className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-heading font-black text-astrix-teal relative z-10">{opportunities[0]?.opportunity_score || 0}</div>
          <div className="text-xs font-medium text-gray-500 mt-1 relative z-10">Max Opportunity Score</div>
          <div className="text-[10px] font-bold text-gray-400 mt-4 relative z-10">Highest priority index</div>
        </Link>

        <Link to="/app/launches" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-green-200 transition-all duration-300 block">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg border border-green-100 text-green-600"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="text-3xl font-heading font-black text-gray-900">{decisionAlpha}%</div>
          <div className="text-xs font-medium text-gray-500 mt-1">Decision Alpha</div>
          <div className="text-[10px] font-bold text-green-600 mt-4 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Proof Accuracy</div>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 mb-8 shadow-sm flex flex-wrap sm:flex-nowrap gap-2 items-center justify-between animate-slide-up stagger-2">
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <button onClick={() => navigate('/app/signals/new')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 transition-all hover:shadow-sm">
            <Plus className="w-4 h-4" /> Add Signal
          </button>
          <button onClick={() => navigate('/app/problems')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 transition-all hover:shadow-sm">
            <Layers className="w-4 h-4" /> New Problem
          </button>
          <button onClick={() => navigate('/app/decisions')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 transition-all hover:shadow-sm">
            <Rocket className="w-4 h-4" /> Log Launch
          </button>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-astrix-teal hover:bg-astrix-darkTeal text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md">
          <UploadCloud className="w-4 h-4" /> Import CSV
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="xl:col-span-2 flex flex-col animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-astrix-teal" /> Ranked Opportunities
            </h2>
            <Link to="/app/opportunities" className="text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal transition-colors uppercase tracking-widest flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            {oppLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-16 rounded-xl" />
              </div>
            ) : topOpportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-gray-50/50">
                <Database className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-2">No opportunities found</h3>
                <p className="text-sm text-gray-500 font-medium max-w-sm">Upload customer signals and run AI clustering to generate your first ranked opportunities.</p>
                <button onClick={() => navigate('/app/problems')} className="mt-6 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">Go to Problems</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 flex-1">
                {topOpportunities.map((opp, index) => (
                  <div key={opp.id} className={`relative p-5 hover:bg-gray-50 transition-all duration-200 group flex items-center justify-between gap-4 ${index === 0 ? 'bg-teal-50/10' : ''}`}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading font-black text-lg shrink-0 shadow-sm transition-transform group-hover:scale-105 ${index === 0 ? 'bg-astrix-teal text-white' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <Link to={`/app/opportunities/${opp.id}`} className="font-bold text-gray-900 text-base mb-1 truncate block group-hover:text-astrix-teal transition-colors">
                          {opp.problems?.title || 'Unknown Problem'}
                        </Link>
                        <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                          <span className={`px-2 py-0.5 rounded uppercase tracking-wider font-bold ${opp.recommended_action === 'Build' ? 'bg-blue-50 text-blue-700' : opp.recommended_action === 'Fix' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {opp.recommended_action || 'Review'}
                          </span>
                          <span className="truncate">{formatCurrency(opp.problems?.affected_arr || 0)} ARR at risk</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <Link to={`/app/opportunities/${opp.id}`} className="hidden md:flex opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:border-astrix-teal hover:text-astrix-teal items-center gap-1">
                        Decide <ArrowRight className="w-3 h-3" />
                      </Link>
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-heading font-black text-gray-900">{opp.opportunity_score}</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${opp.opportunity_score >= 80 ? 'bg-astrix-teal' : 'bg-astrix-gold'}`} style={{ width: `${opp.opportunity_score}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-1 flex flex-col gap-8 animate-slide-up stagger-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-blue" /> Active Launches
              </h2>
              <Link to="/app/launches" className="text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors">View all</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
              {activeLaunches.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-gray-100 border-dashed">
                  <p className="text-sm text-gray-500 font-medium">No active launches.</p>
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                  {activeLaunches.slice(0, 3).map((launch) => (
                    <div key={launch.id} className="relative group">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-white border-2 border-brand-blue rounded-full group-hover:scale-125 group-hover:bg-brand-blue transition-all"></div>
                      <Link to={`/app/launches/${launch.id}`} className="block pl-2">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-brand-blue transition-colors">{launch.title}</div>
                        <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                          <Rocket className="w-3 h-3" /> Launched {new Date(launch.launched_at).toLocaleDateString()}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Recent Decisions
              </h2>
              <Link to="/app/decisions" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">History</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
              {recentDecisions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-gray-100 border-dashed">
                  <p className="text-sm text-gray-500 font-medium">No decisions logged.</p>
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                  {recentDecisions.map((dec) => (
                    <div key={dec.id} className="relative group">
                      <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 bg-white border-2 rounded-full group-hover:scale-125 transition-all ${dec.action === 'Build' ? 'border-blue-500 group-hover:bg-blue-500' : dec.action === 'Fix' ? 'border-yellow-500 group-hover:bg-yellow-500' : 'border-gray-400 group-hover:bg-gray-400'}`}></div>
                      <Link to={`/app/decisions/${dec.id}`} className="block pl-2">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-astrix-teal transition-colors">{dec.title}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${dec.action === 'Build' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {dec.action}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    </div>
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
