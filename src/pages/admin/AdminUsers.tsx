import React, { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Search, Filter, ChevronDown, MoreHorizontal,
  UserX, ArrowUpDown, Mail, Shield, Ban, CheckCircle2,
} from 'lucide-react';

const ALL_USERS = [
  { id: '1',  name: 'Sarah Chen',       email: 'sarah@loopmetrics.io',     plan: 'Growth',  workspace: 'LoopMetrics',    signals: 4821, lastActive: '2h ago',    status: 'active',    role: 'Owner' },
  { id: '2',  name: 'Marcus Reid',      email: 'marcus@buildfast.com',     plan: 'Starter', workspace: 'BuildFast',      signals: 2134, lastActive: '5h ago',    status: 'active',    role: 'Owner' },
  { id: '3',  name: 'Jordan Williams',  email: 'jordan@nextsaas.com',      plan: 'Scale',   workspace: 'NextSaaS',       signals: 18432, lastActive: '1h ago',   status: 'active',    role: 'Owner' },
  { id: '4',  name: 'Priya Nair',       email: 'priya@trackwise.ai',       plan: 'Free',    workspace: 'TrackWise',      signals: 87,   lastActive: '9h ago',    status: 'active',    role: 'Owner' },
  { id: '5',  name: 'Amara Osei',       email: 'amara@insightloop.co',     plan: 'Free',    workspace: 'InsightLoop',    signals: 23,   lastActive: '1d ago',    status: 'pending',   role: 'Owner' },
  { id: '6',  name: 'Dev Patel',        email: 'dev@sprintpm.io',          plan: 'Starter', workspace: 'SprintPM',       signals: 1204, lastActive: '2d ago',    status: 'active',    role: 'Member' },
  { id: '7',  name: 'Elena Popov',      email: 'elena@datacore.ai',        plan: 'Growth',  workspace: 'DataCore',       signals: 9320, lastActive: '3h ago',    status: 'active',    role: 'Owner' },
  { id: '8',  name: 'Jake Tanner',      email: 'jake@launchlab.co',        plan: 'Free',    workspace: 'LaunchLab',      signals: 54,   lastActive: '5d ago',    status: 'active',    role: 'Owner' },
  { id: '9',  name: 'Mia Zhou',         email: 'mia@trackflow.com',        plan: 'Growth',  workspace: 'TrackFlow',      signals: 6711, lastActive: '30m ago',   status: 'active',    role: 'Owner' },
  { id: '10', name: 'Carlos Mendez',    email: 'carlos@pmvault.co',        plan: 'Starter', workspace: 'PMVault',        signals: 892,  lastActive: '4h ago',    status: 'active',    role: 'Owner' },
  { id: '11', name: 'Lena Fischer',     email: 'lena@verdictiq.com',       plan: 'Scale',   workspace: 'VerdictIQ',     signals: 22104, lastActive: '1h ago',   status: 'active',    role: 'Owner' },
  { id: '12', name: 'Tom Nguyen',       email: 'tom@signalhub.io',         plan: 'Free',    workspace: 'SignalHub',      signals: 199,  lastActive: '2d ago',    status: 'suspended', role: 'Owner' },
];

const planBadge: Record<string, string> = {
  Free:    'bg-gray-100 text-gray-600 border-gray-200',
  Starter: 'bg-blue-50 text-blue-700 border-blue-200',
  Growth:  'bg-teal-50 text-teal-700 border-teal-200',
  Scale:   'bg-purple-50 text-purple-700 border-purple-200',
};

const statusBadge: Record<string, string> = {
  active:    'text-green-600',
  pending:   'text-amber-600',
  suspended: 'text-red-500',
};

export const AdminUsers = () => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = ALL_USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.workspace.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'All' || u.plan === planFilter;
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <AdminLayout
      title="Users"
      subtitle={`${ALL_USERS.length} total users · ${ALL_USERS.filter(u => u.status === 'active').length} active`}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users, workspaces..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
          />
        </div>
        <div className="flex gap-2">
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
        <div className="flex gap-2">
          {(['All','active','pending','suspended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {s}
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
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-600">User <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Workspace</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Signals</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Last Active</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${u.status === 'suspended' ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-black text-xs shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{u.workspace}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${planBadge[u.plan]}`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold text-gray-500 flex items-center gap-1`}>
                      {u.role === 'Owner' ? <Shield className="w-3 h-3 text-gray-400" /> : null}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-black text-gray-800">{u.signals.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-gray-500">{u.lastActive}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-black flex items-center gap-1 ${statusBadge[u.status]}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenu === u.id && (
                      <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                          <Mail className="w-3.5 h-3.5" /> Email User
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                          <ChevronDown className="w-3.5 h-3.5" /> Change Plan
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                          <Ban className="w-3.5 h-3.5" /> {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                          <UserX className="w-3.5 h-3.5" /> Delete Account
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Showing {filtered.length} of {ALL_USERS.length} users</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-white bg-white/80 disabled:opacity-40 transition-colors" disabled>← Prev</button>
            <button className="px-3 py-1.5 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-brand-blue transition-colors">1</button>
            <button className="px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-white bg-white/80 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
