import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import ReactECharts from 'echarts-for-react';
import { DollarSign, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight, CreditCard, AlertCircle } from 'lucide-react';

const MRR_TREND = [
  { month: 'Jan', mrr: 8200  },
  { month: 'Feb', mrr: 9100  },
  { month: 'Mar', mrr: 9850  },
  { month: 'Apr', mrr: 10600 },
  { month: 'May', mrr: 11900 },
  { month: 'Jun', mrr: 12700 },
  { month: 'Jul', mrr: 14230 },
];

const PLAN_REVENUE = [
  { plan: 'Starter', count: 35, mrr: 35 * 59,   color: '#60a5fa' },
  { plan: 'Growth',  count: 22, mrr: 22 * 179,  color: '#2dd4bf' },
  { plan: 'Scale',   count: 11, mrr: 11 * 299,  color: '#a855f7' },
];

const RECENT_SUBS = [
  { type: 'new',      name: 'LoopMetrics',   plan: 'Growth',  amount: '$179/mo',  date: '2h ago',   icon: TrendingUp,    color: 'text-green-600 bg-green-50 border-green-200' },
  { type: 'upgrade',  name: 'NextSaaS',      plan: 'Scale',   amount: '$299/mo',  date: '1d ago',   icon: ArrowUpRight,  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { type: 'downgrade',name: 'DataCore',      plan: 'Growth',  amount: '$179/mo',  date: '2d ago',   icon: ArrowDownRight,color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { type: 'new',      name: 'BuildFast',     plan: 'Starter', amount: '$59/mo',   date: '3d ago',   icon: TrendingUp,    color: 'text-green-600 bg-green-50 border-green-200' },
  { type: 'churn',    name: 'SprintPM',      plan: 'Starter', amount: '-$59/mo',  date: '4d ago',   icon: TrendingDown,  color: 'text-red-600 bg-red-50 border-red-200' },
  { type: 'new',      name: 'VerdictIQ',     plan: 'Scale',   amount: '$299/mo',  date: '5d ago',   icon: TrendingUp,    color: 'text-green-600 bg-green-50 border-green-200' },
];

const planBadge: Record<string, string> = {
  Starter: 'bg-blue-50 text-blue-700 border-blue-200',
  Growth:  'bg-teal-50 text-teal-700 border-teal-200',
  Scale:   'bg-purple-50 text-purple-700 border-purple-200',
};

const totalMRR = PLAN_REVENUE.reduce((s, p) => s + p.mrr, 0);

export const AdminRevenue = () => {
  const mrrChartOption = {
    grid: { top: 16, right: 16, bottom: 32, left: 56 },
    xAxis: {
      type: 'category',
      data: MRR_TREND.map(d => d.month),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 700 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#9ca3af', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600,
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}k`,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 700 },
      formatter: (p: any[]) => `<b>$${p[0].value.toLocaleString()}</b> MRR`,
    },
    series: [{
      type: 'line',
      data: MRR_TREND.map(d => d.mrr),
      smooth: 0.4,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { color: '#2dd4bf', width: 3 },
      itemStyle: { color: '#2dd4bf', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(45,212,191,0.20)' },
            { offset: 1, color: 'rgba(45,212,191,0.01)' },
          ],
        },
      },
    }],
  };

  const planPieOption = {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `<b>${p.name}</b><br/>$${p.value.toLocaleString()}/mo · ${p.percent.toFixed(0)}%`,
    },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      data: PLAN_REVENUE.map(p => ({ value: p.mrr, name: p.plan, itemStyle: { color: p.color } })),
      label: { show: false },
      emphasis: { scale: true, scaleSize: 5 },
    }],
  };

  const mrrGrowth = ((MRR_TREND[6].mrr - MRR_TREND[5].mrr) / MRR_TREND[5].mrr * 100).toFixed(1);

  return (
    <AdminLayout
      title="Revenue"
      subtitle={`MRR: $${totalMRR.toLocaleString()} · ARR: $${(totalMRR * 12).toLocaleString()}`}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign,  label: 'MRR',           value: `$${totalMRR.toLocaleString()}`,   sub: `↑ ${mrrGrowth}% vs last month`,  iconBg: 'bg-green-50 border-green-100', iconColor: 'text-green-600' },
          { icon: TrendingUp,  label: 'ARR (Run Rate)', value: `$${(totalMRR * 12).toLocaleString()}`, sub: 'Based on current MRR', iconBg: 'bg-blue-50 border-blue-100', iconColor: 'text-brand-blue' },
          { icon: Users,       label: 'Paying Users',   value: '68',                              sub: '27.5% of total users',           iconBg: 'bg-purple-50 border-purple-100', iconColor: 'text-purple-600' },
          { icon: AlertCircle, label: 'Churn Rate',     value: '2.1%',                            sub: '-0.3% vs last month',            iconBg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-600' },
        ].map(({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`p-2 rounded-lg border ${iconBg} w-fit mb-3`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
            <div className="text-3xl font-heading font-black text-gray-900 leading-none mb-1">{value}</div>
            <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
            <div className="text-[10px] font-bold text-gray-400">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* MRR Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-astrix-teal" /> MRR Growth — Last 7 Months
          </h2>
          <ReactECharts option={mrrChartOption} style={{ height: 200 }} notMerge />
        </div>

        {/* Revenue by Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-500" /> Revenue by Plan
          </h2>
          <ReactECharts option={planPieOption} style={{ height: 140 }} notMerge />
          <div className="mt-4 space-y-2">
            {PLAN_REVENUE.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${planBadge[p.plan]}`}>{p.plan}</span>
                  <span className="text-xs text-gray-500 font-medium">{p.count} users</span>
                </div>
                <span className="text-sm font-black text-gray-800">${p.mrr.toLocaleString()}/mo</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent subscription events */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-blue" /> Recent Subscription Events
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {RECENT_SUBS.map(({ icon: Icon, color, name, plan, amount, date, type }, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
              <div className={`p-2 rounded-lg border shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{name}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${planBadge[plan] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{plan}</span>
                </div>
                <span className="text-xs font-medium text-gray-500 capitalize">{type === 'new' ? 'New subscription' : type === 'churn' ? 'Cancelled' : type === 'upgrade' ? 'Upgraded' : 'Downgraded'}</span>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-black ${type === 'churn' ? 'text-red-500' : 'text-gray-900'}`}>{amount}</div>
                <div className="text-[10px] text-gray-400 font-medium">{date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
