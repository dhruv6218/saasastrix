import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { useAccount, useLaunches } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  Building2, Signal, AlertCircle, ArrowLeft, Calendar,
  BadgeDollarSign, HeartPulse, Rocket, TrendingUp, ExternalLink
} from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const VERDICT_STYLES: Record<string, string> = {
  Solved: 'bg-green-50 text-green-700 border-green-200',
  'Partially Solved': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Not Solved': 'bg-red-50 text-red-700 border-red-200',
  Regressed: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

type Tab = 'overview' | 'signals' | 'problems' | 'launches';

export const AccountDetail = () => {
  const { id } = useParams();
  const { activeWorkspace } = useWorkspace();
  const { data, isLoading } = useAccount(activeWorkspace?.id, id);
  const { data: allLaunches } = useLaunches(activeWorkspace?.id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (isLoading) {
    return (
      <AppLayout title="Loading Account...">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-astrix-teal border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!data || !data.account) {
    return (
      <AppLayout title="Account Not Found">
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Not Found</h2>
          <Link to="/app/accounts" className="text-brand-blue font-bold flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Accounts
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { account, signals, problems } = data;

  const accountLaunches = (allLaunches || []).filter((l: any) =>
    problems.some((p: any) => l.problem_id === p.id || l.title?.toLowerCase().includes(p.title?.toLowerCase()?.split(' ')[0] || ''))
  );

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'signals', label: 'Signals', count: signals.length },
    { key: 'problems', label: 'Problems & Opportunities', count: problems.length },
    { key: 'launches', label: 'Launches', count: accountLaunches.length },
  ];

  return (
    <AppLayout
      title={account.name}
      subtitle={account.domain || 'No domain set'}
      backPath="/app/accounts"
    >
      {/* Account Vitals Header */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-8 md:gap-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ARR</div>
              <div className="text-xl font-black text-gray-900">{formatCurrency(account.arr)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-brand-blue">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Health</div>
              <div className={`text-xl font-black ${Number(account.health_score) < 50 ? 'text-red-600' : Number(account.health_score) < 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                {account.health_score ?? 'N/A'}
                {account.health_score ? '%' : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Renewal</div>
              <div className="text-xl font-black text-gray-900">
                {account.renewal_date
                  ? new Date(account.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not set'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Segment</div>
              <div className="text-xl font-black text-gray-900">{account.plan || 'Standard'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <Signal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Signals</div>
              <div className="text-xl font-black text-gray-900">{signals.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap focus-visible:outline-none ${
              activeTab === tab.key ? 'text-brand-blue' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 bg-gray-100 text-gray-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">{tab.count}</span>
            )}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full animate-[fadeIn_0.2s_ease-out]" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Open Problems', value: problems.length, color: 'text-red-600' },
                { label: 'Total Signals', value: signals.length, color: 'text-brand-blue' },
                { label: 'Linked Launches', value: accountLaunches.length, color: 'text-green-600' },
                { label: 'ARR at Risk', value: formatCurrency(problems.reduce((s: number, p: any) => s + (Number(p.affected_arr) || 0), 0)), color: 'text-orange-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 font-bold mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Top problems */}
            {problems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" /> Active Problems
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {problems.slice(0, 4).map((prob: any) => (
                    <Link
                      key={prob.id}
                      to={`/app/problems/${prob.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors truncate">{prob.title}</div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">{prob.evidence_count} signals</div>
                      </div>
                      <span className={`ml-3 px-2 py-0.5 rounded text-[10px] font-bold border ${prob.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                        {prob.severity}
                      </span>
                    </Link>
                  ))}
                </div>
                {problems.length > 4 && (
                  <button onClick={() => setActiveTab('problems')} className="w-full p-4 text-sm font-bold text-brand-blue hover:bg-gray-50 transition-colors">
                    View all {problems.length} problems →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">Account Segment</h3>
              <div className="text-xl font-bold mb-2">{account.plan || 'Standard'}</div>
              <p className="text-sm text-gray-400">Part of the '{account.plan || 'Standard'}' customer segment defined in workspace settings.</p>
            </div>
            {account.domain && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-mono text-gray-400 uppercase font-bold mb-3">Domain</h4>
                <a href={`https://${account.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-blue font-bold hover:underline">
                  {account.domain} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Signal className="w-4 h-4 text-brand-blue" /> Signals ({signals.length})
              </h3>
            </div>
            {signals.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Signal className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="font-bold text-gray-900 mb-1">No signals recorded</p>
                <p className="text-sm">No feedback has been linked to this account yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {signals.map((sig: any) => (
                  <Link key={sig.id} to={`/app/signals/${sig.id}`} className="block p-5 hover:bg-gray-50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sig.source_type}</span>
                      <div className="flex items-center gap-2">
                        {sig.severity_label && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sig.severity_label === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : sig.severity_label === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                            {sig.severity_label}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">{new Date(sig.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-2 italic group-hover:text-gray-900 transition-colors">"{sig.raw_text}"</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Problems & Opportunities Tab */}
      {activeTab === 'problems' && (
        <div className="animate-[fadeIn_0.3s_ease-out] space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Problems & Opportunities</h3>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                <span className="font-bold text-gray-900">{problems.length}</span> problems · estimated{' '}
                <span className="font-bold text-brand-blue">
                  {formatCurrency(problems.reduce((s: number, p: any) => s + (Number(p.affected_arr) || 0), 0))}
                </span>{' '}
                ARR at risk
              </p>
            </div>
            <Link to="/app/opportunities" className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-1">
              View Opportunities <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {problems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center text-gray-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-900 mb-1">No problems linked</p>
              <p className="text-sm">No problems have been linked to signals from this account yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Problem</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Signals</th>
                    <th className="p-4">ARR at Risk</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {problems.map((prob: any) => (
                    <tr key={prob.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <Link to={`/app/problems/${prob.id}`} className="font-bold text-gray-900 hover:text-brand-blue transition-colors">
                          {prob.title}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${prob.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : prob.severity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                          {prob.severity}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">{prob.evidence_count}</td>
                      <td className="p-4 font-bold text-brand-blue">{formatCurrency(prob.affected_arr || 0)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${prob.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {prob.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Launches Tab */}
      {activeTab === 'launches' && (
        <div className="animate-[fadeIn_0.3s_ease-out] space-y-4">
          {accountLaunches.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center text-gray-500">
              <Rocket className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-900 mb-1">No launches yet</p>
              <p className="text-sm">Launches addressing this account's problems will appear here.</p>
              <Link to="/app/launches" className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-brand-blue hover:underline">
                View all launches <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-brand-blue" /> Related Launches ({accountLaunches.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {accountLaunches.map((launch: any) => (
                  <Link
                    key={launch.id}
                    to={`/app/launches/${launch.id}`}
                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors truncate">{launch.title}</div>
                      <div className="text-xs text-gray-400 font-medium mt-1">
                        Launched {launch.launched_at ? new Date(launch.launched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        {launch.owner && ` · ${launch.owner}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {launch.pm_verdict ? (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${VERDICT_STYLES[launch.pm_verdict] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {launch.pm_verdict}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${STATUS_STYLES[launch.status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {launch.status === 'active' ? 'Active' : launch.status === 'pending_review' ? 'Review Due' : 'Completed'}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </AppLayout>
  );
};
