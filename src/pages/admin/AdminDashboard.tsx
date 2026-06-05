import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Link } from 'react-router-dom';
import {
  Users, Building2, DollarSign, TrendingUp, TrendingDown,
  ArrowRight, CheckCircle2, AlertTriangle, Activity,
  Zap, UserCheck, BarChart3, Clock,
} from 'lucide-react';

const PLATFORM_STATS = {
  totalUsers: 247,
  totalWorkspaces: 189,
  mrr: 14230,
  arr: 170760,
  payingUsers: 68,
  freeUsers: 179,
  mrrGrowth: 12.4,
  churnRate: 2.1,
  avgSignalsPerWs: 834,
  verdictCompletionRate: 71,
};

const PLAN_DIST = [
  { plan: 'Free',    count: 179, color: 'bg-gray-300',     textColor: 'text-gray-600',    pct: 72.5 },
  { plan: 'Starter', count: 35,  color: 'bg-blue-400',     textColor: 'text-blue-700',    pct: 14.2 },
  { plan: 'Growth',  count: 22,  color: 'bg-astrix-teal',  textColor: 'text-teal-700',    pct: 8.9  },
  { plan: 'Scale',   count: 11,  color: 'bg-purple-500',   textColor: 'text-purple-700',  pct: 4.4  },
];

const RECENT_USERS = [
  { id: '1', name: 'Sarah Chen',       email: 'sarah@loopmetrics.io',  plan: 'Growth',  workspace: 'LoopMetrics',    signedUp: '2h ago',   status: 'active' },
  { id: '2', name: 'Marcus Reid',      email: 'marcus@buildfast.com',  plan: 'Starter', workspace: 'BuildFast',      signedUp: '5h ago',   status: 'active' },
  { id: '3', name: 'Priya Nair',       email: 'priya@trackwise.ai',    plan: 'Free',    workspace: 'TrackWise',      signedUp: '9h ago',   status: 'active' },
  { id: '4', name: 'Jordan Williams',  email: 'jordan@nextsaas.com',   plan: 'Scale',   workspace: 'NextSaaS',       signedUp: '1d ago',   status: 'active' },
  { id: '5', name: 'Amara Osei',       email: 'amara@insightloop.co',  plan: 'Free',    workspace: 'InsightLoop',    signedUp: '1d ago',   status: 'pending' },
];

const RECENT_EVENTS = [
  { type: 'upgrade',    icon: TrendingUp,    color: 'text-green-600 bg-green-50 border-green-200',  text: 'LoopMetrics upgraded Free → Growth',         time: '2h ago' },
  { type: 'signup',     icon: UserCheck,     color: 'text-blue-600 bg-blue-50 border-blue-200',     text: 'New signup: BuildFast (Starter plan)',        time: '5h ago' },
  { type: 'downgrade',  icon: TrendingDown,  color: 'text-orange-600 bg-orange-50 border-orange-200', text: 'DataCore downgraded Scale → Growth',       time: '8h ago' },
  { type: 'churn',      icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200',        text: 'SprintPM cancelled Starter plan',            time: '1d ago' },
  { type: 'upgrade',    icon: TrendingUp,    color: 'text-green-600 bg-green-50 border-green-200',  text: 'TrackFlow upgraded Starter → Growth',        time: '1d ago' },
];

const planBadge: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-600 border-gray-200',
  Starter: 'bg-blue-50 text-blue-700 border-blue-200',
  Growth: 'bg-teal-50 text-teal-700 border-teal-200',
  Scale: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const AdminDashboard = () => {
  const mrrFormatted = `$${(PLATFORM_STATS.mrr / 1000).toFixed(1)}k`;
  const arrFormatted = `$${(PLATFORM_STATS.arr / 1000).toFixed(0)}k`;

  return (
    <AdminLayout
      title="Platform Overview"
      subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Real-time admin view`}
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Users, label: 'Total Users', value: PLATFORM_STATS.totalUsers.toString(),
            sub: `${PLATFORM_STATS.payingUsers} paying (${Math.round(PLATFORM_STATS.payingUsers / PLATFORM_STATS.totalUsers * 100)}%)`,
            iconBg: 'bg-blue-50 border-blue-100', iconColor: 'text-brand-blue',
            to: '/admin/users',
          },
          {
            icon: Building2, label: 'Workspaces', value: PLATFORM_STATS.totalWorkspaces.toString(),
            sub: `${PLATFORM_STATS.avgSignalsPerWs.toLocaleString()} avg signals/ws`,
            iconBg: 'bg-teal-50 border-teal-100', iconColor: 'text-astrix-teal',
            to: '/admin/workspaces',
          },
          {
            icon: DollarSign, label: 'MRR', value: mrrFormatted,
            sub: `↑ ${PLATFORM_STATS.mrrGrowth}% vs last month`,
            iconBg: 'bg-green-50 border-green-100', iconColor: 'text-green-600',
            to: '/admin/revenue',
          },
          {
            icon: BarChart3, label: 'ARR', value: arrFormatted,
            sub: `${PLATFORM_STATS.churnRate}% monthly churn`,
            iconBg: 'bg-purple-50 border-purple-100', iconColor: 'text-purple-600',
            to: '/admin/revenue',
          },
        ].map(({ icon: Icon, label, value, sub, iconBg, iconColor, to }) => (
          <Link
            key={label}
            to={to}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg border ${iconBg}`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <div className="text-3xl font-heading font-black text-gray-900 leading-none mb-1">{value}</div>
            <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
            <div className="text-[10px] font-bold text-gray-400">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* Plan Distribution */}
        <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-astrix-teal" /> Plan Distribution
          </h2>
          <div className="space-y-4">
            {PLAN_DIST.map(({ plan, count, color, textColor, pct }) => (
              <div key={plan}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-gray-700">{plan}</span>
                  <span className={`text-xs font-black ${textColor}`}>{count} users · {pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Free-to-paid conversion</span>
              <span className="font-black text-green-600">{Math.round(PLATFORM_STATS.payingUsers / PLATFORM_STATS.totalUsers * 100)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mt-2">
              <span>Verdict completion rate</span>
              <span className="font-black text-astrix-teal">{PLATFORM_STATS.verdictCompletionRate}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-blue" /> Platform Events
          </h2>
          <div className="space-y-3">
            {RECENT_EVENTS.map(({ icon: Icon, color, text, time }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${color} shrink-0`}>
                  <Icon className={`w-3.5 h-3.5`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{text}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-500" /> Recent Signups
          </h2>
          <Link to="/admin/users" className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Workspace</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Signed Up</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RECENT_USERS.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-gray-900">{u.name}</div>
                    <div className="text-[11px] text-gray-400 font-medium">{u.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-gray-700">{u.workspace}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${planBadge[u.plan]}`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-gray-500">{u.signedUp}</td>
                  <td className="px-4 py-3.5">
                    <span className={`flex items-center gap-1 text-[10px] font-black ${u.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {u.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
