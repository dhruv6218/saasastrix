import React, { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Search, MoreHorizontal, Building2, Users, Signal, CheckCircle2, AlertTriangle, Ban } from 'lucide-react';

const WORKSPACES = [
  { id: '1',  name: 'NextSaaS',     owner: 'Jordan Williams',  plan: 'Scale',   members: 12, signals: 18432, launches: 8,  lastActivity: '1h ago',   status: 'healthy' },
  { id: '2',  name: 'VerdictIQ',    owner: 'Lena Fischer',     plan: 'Scale',   members: 9,  signals: 22104, launches: 11, lastActivity: '30m ago',  status: 'healthy' },
  { id: '3',  name: 'DataCore',     owner: 'Elena Popov',      plan: 'Growth',  members: 6,  signals: 9320,  launches: 5,  lastActivity: '3h ago',   status: 'healthy' },
  { id: '4',  name: 'LoopMetrics',  owner: 'Sarah Chen',       plan: 'Growth',  members: 4,  signals: 4821,  launches: 3,  lastActivity: '2h ago',   status: 'healthy' },
  { id: '5',  name: 'TrackFlow',    owner: 'Mia Zhou',         plan: 'Growth',  members: 5,  signals: 6711,  launches: 4,  lastActivity: '30m ago',  status: 'healthy' },
  { id: '6',  name: 'BuildFast',    owner: 'Marcus Reid',      plan: 'Starter', members: 3,  signals: 2134,  launches: 2,  lastActivity: '5h ago',   status: 'healthy' },
  { id: '7',  name: 'PMVault',      owner: 'Carlos Mendez',    plan: 'Starter', members: 2,  signals: 892,   launches: 1,  lastActivity: '4h ago',   status: 'healthy' },
  { id: '8',  name: 'SprintPM',     owner: 'Dev Patel',        plan: 'Starter', members: 2,  signals: 1204,  launches: 0,  lastActivity: '2d ago',   status: 'at-risk' },
  { id: '9',  name: 'TrackWise',    owner: 'Priya Nair',       plan: 'Free',    members: 1,  signals: 87,    launches: 0,  lastActivity: '9h ago',   status: 'healthy' },
  { id: '10', name: 'InsightLoop',  owner: 'Amara Osei',       plan: 'Free',    members: 1,  signals: 23,    launches: 0,  lastActivity: '1d ago',   status: 'at-risk' },
  { id: '11', name: 'LaunchLab',    owner: 'Jake Tanner',      plan: 'Free',    members: 1,  signals: 54,    launches: 0,  lastActivity: '5d ago',   status: 'at-risk' },
  { id: '12', name: 'SignalHub',    owner: 'Tom Nguyen',       plan: 'Free',    members: 1,  signals: 199,   launches: 0,  lastActivity: '2d ago',   status: 'suspended' },
];

const planBadge: Record<string, string> = {
  Free:    'bg-gray-100 text-gray-600 border-gray-200',
  Starter: 'bg-blue-50 text-blue-700 border-blue-200',
  Growth:  'bg-teal-50 text-teal-700 border-teal-200',
  Scale:   'bg-purple-50 text-purple-700 border-purple-200',
};

export const AdminWorkspaces = () => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = WORKSPACES.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.owner.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'All' || w.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    healthy:   { icon: CheckCircle2, color: 'text-green-600',  label: 'Healthy'   },
    'at-risk': { icon: AlertTriangle, color: 'text-amber-600', label: 'At Risk'   },
    suspended: { icon: Ban,          color: 'text-red-500',    label: 'Suspended' },
  };

  return (
    <AdminLayout
      title="Workspaces"
      subtitle={`${WORKSPACES.length} total workspaces · ${WORKSPACES.filter(w => w.plan !== 'Free').length} on paid plans`}
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: WORKSPACES.length,                           color: 'text-gray-900' },
          { label: 'Paid',     value: WORKSPACES.filter(w => w.plan !== 'Free').length,  color: 'text-green-600' },
          { label: 'At Risk',  value: WORKSPACES.filter(w => w.status === 'at-risk').length, color: 'text-amber-600' },
          { label: 'Suspended',value: WORKSPACES.filter(w => w.status === 'suspended').length, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className={`text-2xl font-heading font-black ${color}`}>{value}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">{label} workspaces</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces or owners..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All','Free','Starter','Growth','Scale'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${planFilter === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Workspace</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Members</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Signals</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Launches</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Last Active</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Health</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((w) => {
                const sc = statusConfig[w.status];
                return (
                  <tr key={w.id} className={`hover:bg-gray-50/50 transition-colors ${w.status === 'suspended' ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                          {w.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 font-medium">{w.owner}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${planBadge[w.plan]}`}>{w.plan}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-700 flex items-center justify-end gap-1">
                        <Users className="w-3 h-3 text-gray-400" /> {w.members}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-700 flex items-center justify-end gap-1">
                        <Signal className="w-3 h-3 text-gray-400" /> {w.signals.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-700">{w.launches}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-500">{w.lastActivity}</td>
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1 text-[10px] font-black ${sc.color}`}>
                        <sc.icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === w.id ? null : w.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === w.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                            <Building2 className="w-3.5 h-3.5" /> View Details
                          </button>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                            Change Plan
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs font-medium text-gray-500">Showing {filtered.length} of {WORKSPACES.length} workspaces</span>
        </div>
      </div>
    </AdminLayout>
  );
};
