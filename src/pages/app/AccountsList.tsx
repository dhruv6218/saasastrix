import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Building2, Plus, UploadCloud, X, Loader2, Search, HeartPulse, Filter, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAccounts, api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  SortingState,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';

const ARR_RANGES = [
  { label: 'All ARR', value: '' },
  { label: 'Under $100k', value: 'under100k' },
  { label: '$100k – $500k', value: '100k-500k' },
  { label: '$500k+', value: 'over500k' },
];

const PLAN_OPTIONS = ['', 'Enterprise', 'Business', 'Pro', 'Free', 'SMB'];
const HEALTH_OPTIONS = [
  { label: 'All Health', value: '' },
  { label: '🟢 Healthy (75+)', value: 'healthy' },
  { label: '🟡 Warning (50–74)', value: 'warning' },
  { label: '🔴 At Risk (<50)', value: 'at_risk' },
];

export const AccountsList = () => {
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accArr, setAccArr] = useState('');
  const [accPlan, setAccPlan] = useState('Standard');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  const [globalFilter, setGlobalFilter] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterArrRange, setFilterArrRange] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filterPlan, filterArrRange, filterHealth].filter(Boolean).length;

  const arrOpts = useMemo(() => {
    const r = filterArrRange;
    return {
      arr_min: r === '100k-500k' ? 100000 : r === 'over500k' ? 500000 : undefined,
      arr_max: r === 'under100k' ? 99999 : r === '100k-500k' ? 499999 : undefined,
    };
  }, [filterArrRange]);

  const { data, isLoading } = useAccounts(activeWorkspace?.id, {
    page: pageIndex + 1,
    limit: pageSize,
    globalFilter,
    sorting,
    plan: filterPlan || undefined,
    health: filterHealth || undefined,
    ...arrOpts,
  });

  const clearFilters = () => {
    setFilterPlan('');
    setFilterArrRange('');
    setFilterHealth('');
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !accName) return;
    setIsSavingAccount(true);
    
    try {
      await api.accounts.create({
        workspace_id: activeWorkspace.id,
        name: accName,
        arr: parseFloat(accArr) || 0,
        plan: accPlan
      });
      addToast(`Account added successfully`, "success");
      setIsAccountModalOpen(false);
      setAccName('');
      setAccArr('');
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const columnHelper = createColumnHelper<any>();
  const accountColumns = useMemo(() => [
    columnHelper.accessor('name', { 
      header: 'Account Name', 
      cell: info => <Link to={`/app/accounts/${info.row.original.id}`} className="font-bold text-gray-900 hover:text-brand-blue transition-colors underline decoration-gray-200 underline-offset-4">{info.getValue()}</Link> 
    }),
    columnHelper.accessor('arr', { 
      header: 'ARR', 
      cell: info => <span className="font-mono font-bold text-astrix-teal">{formatCurrency(info.getValue() || 0)}</span> 
    }),
    columnHelper.accessor('plan', {
      header: 'Plan',
      cell: info => {
        const p = info.getValue() || 'Standard';
        const cls = p === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' : p === 'Pro' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200';
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>{p}</span>;
      }
    }),
    columnHelper.accessor('domain', { 
      header: 'Domain', 
      cell: info => <span className="text-gray-500 font-medium">{info.getValue() || '--'}</span> 
    }),
    columnHelper.accessor('health_score', { 
      header: 'Health', 
      cell: info => {
        const score = parseInt(info.getValue() || '0');
        let color = 'text-gray-400';
        if (score >= 75) color = 'text-green-500';
        else if (score >= 50) color = 'text-yellow-500';
        else if (score > 0) color = 'text-red-500';
        return (
          <div className="flex items-center gap-1.5 font-bold">
            <HeartPulse className={`w-3.5 h-3.5 ${color}`} />
            <span className={color}>{score || '--'}</span>
          </div>
        );
      }
    }),
    columnHelper.accessor('signal_count', { 
      header: 'Signals', 
      cell: info => <span className="font-bold text-gray-700">{info.getValue() || 0}</span> 
    }),
  ], []);

  const accountTable = useReactTable({
    data: data.rows, 
    columns: accountColumns, 
    pageCount: Math.ceil(data.total / pageSize),
    state: { sorting, pagination },
    onSortingChange: setSorting, 
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), 
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <AppLayout 
      title="Accounts" 
      subtitle="CRM context layer for opportunity scoring."
      actions={
        <div className="flex gap-2">
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))} className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setIsAccountModalOpen(true)} className="text-sm font-bold text-white bg-astrix-teal px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4"/> Add Account
          </button>
        </div>
      }
    >
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-astrix-teal transition-all">
          <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
          <input 
            type="text" 
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search accounts by name or domain..." 
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 py-1"
          />
          {globalFilter && (
            <button onClick={() => setGlobalFilter('')} className="mr-2 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center ${showFilters ? 'bg-white text-astrix-teal' : 'bg-astrix-teal text-white'}`}>{activeFilterCount}</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl animate-[fadeIn_0.2s_ease-out]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plan Tier</span>
            <select
              value={filterPlan}
              onChange={e => setFilterPlan(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal cursor-pointer min-w-[140px]"
            >
              <option value="">All Plans</option>
              {PLAN_OPTIONS.filter(Boolean).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">ARR Range</span>
            <select
              value={filterArrRange}
              onChange={e => setFilterArrRange(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal cursor-pointer min-w-[160px]"
            >
              {ARR_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Health Status</span>
            <select
              value={filterHealth}
              onChange={e => setFilterHealth(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal cursor-pointer min-w-[180px]"
            >
              {HEALTH_OPTIONS.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex flex-col gap-1 justify-end">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-bold text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div>
        ) : data.rows.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <Building2 className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No accounts found</h3>
            <p className="text-sm mb-4">{activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Upload a CSV or add an account manually to inject ARR context.'}</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm font-bold text-astrix-teal hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 font-mono text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  {accountTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accountTable.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {accountTable.getRowModel().rows.map(row => {
                const acc = row.original;
                const healthScore = parseInt(acc.health_score || '0');
                const healthColor = healthScore >= 75 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : healthScore > 0 ? 'text-red-500' : 'text-gray-400';
                return (
                  <div key={row.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <Link to={`/app/accounts/${acc.id}`} className="font-bold text-gray-900 hover:text-brand-blue underline decoration-gray-200">{acc.name}</Link>
                      <span className="font-mono font-bold text-astrix-teal">{formatCurrency(acc.arr)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{acc.plan || 'Standard'}</span>
                      <div className="flex items-center gap-1.5">
                        <HeartPulse className={`w-3.5 h-3.5 ${healthColor}`} />
                        <span className={`font-bold ${healthColor}`}>{healthScore || '--'}</span>
                        <span className="text-gray-400 ml-2">·</span>
                        <span className="text-gray-500 font-bold">{acc.signal_count || 0} Signals</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 mt-auto">
              <span className="text-sm text-gray-500 font-medium">
                Showing {accountTable.getRowModel().rows.length} of {data.total} accounts
                {activeFilterCount > 0 && <span className="ml-2 text-astrix-teal font-bold">({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)</span>}
              </span>
              <div className="flex gap-2">
                <button onClick={() => accountTable.previousPage()} disabled={!accountTable.getCanPreviousPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50">Prev</button>
                <button onClick={() => accountTable.nextPage()} disabled={!accountTable.getCanNextPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Account Add Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSavingAccount && setIsAccountModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Add Account</h2>
              <button onClick={() => !isSavingAccount && setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Account Name *</label>
                <input type="text" required value={accName} onChange={e => setAccName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">ARR ($)</label>
                  <input type="number" min="0" value={accArr} onChange={e => setAccArr(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Plan Tier</label>
                  <select value={accPlan} onChange={e => setAccPlan(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option>Free</option>
                    <option>Pro</option>
                    <option>Business</option>
                    <option>Enterprise</option>
                    <option>SMB</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isSavingAccount || !accName} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isSavingAccount && <Loader2 className="w-4 h-4 animate-spin"/>} Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
