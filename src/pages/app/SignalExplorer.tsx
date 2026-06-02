import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import {
  Search, Hash, MessageCircle, Github, AlertCircle, FileSpreadsheet, Database,
  UploadCloud, Plus, Loader2, ChevronRight, Filter, X, Check, ChevronDown, Layers
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { useSignals, useAccounts, useProblems, api } from '../../lib/api';
import { usePlan } from '../../hooks/usePlan';
import { Signal } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import {
  createColumnHelper, flexRender, getCoreRowModel,
  SortingState, PaginationState, useReactTable,
} from '@tanstack/react-table';

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const SENTIMENTS = ['Negative', 'Neutral', 'Positive'];
const AREAS = ['Authentication', 'Core UI', 'API', 'Billing', 'Dashboard'];

export const SignalExplorer = () => {
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { limits } = usePlan();

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [filterSeverity, filterSentiment, filterArea, filterAccount].filter(Boolean).length;

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateProblemModal, setShowCreateProblemModal] = useState(false);
  const [newProblemTitle, setNewProblemTitle] = useState('');
  const [isCreatingProblem, setIsCreatingProblem] = useState(false);

  const opts = useMemo(() => ({
    page: pageIndex + 1, limit: pageSize, globalFilter, sorting,
    severity: filterSeverity, sentiment: filterSentiment, product_area: filterArea, account_id: filterAccount
  }), [pageIndex, pageSize, globalFilter, JSON.stringify(sorting), filterSeverity, filterSentiment, filterArea, filterAccount]);

  const { data, isLoading } = useSignals(activeWorkspace?.id, opts);
  const { data: accountsData } = useAccounts(activeWorkspace?.id);
  const { data: problems } = useProblems(activeWorkspace?.id);
  const accounts = accountsData?.rows || [];

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const clearFilters = () => { setFilterSeverity(''); setFilterSentiment(''); setFilterArea(''); setFilterAccount(''); };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === data.rows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(data.rows.map(r => r.id)));
  };

  const handleCreateProblemFromSelected = async () => {
    if (!newProblemTitle.trim() || !activeWorkspace) return;
    setIsCreatingProblem(true);
    try {
      const prob = await api.problems.create({
        workspace_id: activeWorkspace.id,
        title: newProblemTitle,
        description: `Problem created from ${selectedIds.size} selected signal(s).`,
        product_area: filterArea || 'Unassigned',
        severity: filterSeverity || 'Medium',
        status: 'Active',
        evidence_count: selectedIds.size,
        affected_arr: 0,
      } as any);
      addToast(`Problem "${newProblemTitle}" created with ${selectedIds.size} signal(s).`, 'success');
      setShowCreateProblemModal(false);
      setSelectedIds(new Set());
      setNewProblemTitle('');
      navigate(`/app/problems/${prob.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to create problem.', 'error');
    } finally {
      setIsCreatingProblem(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'slack': return <Hash className="w-4 h-4 text-pink-600" />;
      case 'discord': return <MessageCircle className="w-4 h-4 text-indigo-500" />;
      case 'github': return <Github className="w-4 h-4 text-gray-900" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-gray-700" />;
    }
  };

  const columnHelper = createColumnHelper<Signal>();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: () => (
        <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === data.rows.length}
          onChange={toggleSelectAll} className="rounded border-gray-300" />
      ),
      cell: info => (
        <input type="checkbox" checked={selectedIds.has(info.row.original.id)}
          onChange={e => { e.stopPropagation(); toggleSelect(info.row.original.id); }}
          onClick={e => e.stopPropagation()}
          className="rounded border-gray-300" />
      ),
    }),
    columnHelper.accessor('source_type', {
      header: 'Source',
      cell: info => <div className="flex items-center gap-2">{getSourceIcon(info.getValue())} <span className="font-bold text-xs text-gray-500 uppercase">{info.getValue()}</span></div>,
    }),
    columnHelper.accessor('raw_text', {
      header: 'Signal',
      cell: info => <div className="truncate max-w-[360px] text-gray-900 font-medium">"{info.getValue()}"</div>,
    }),
    columnHelper.accessor('severity_label', {
      header: 'Severity',
      cell: info => {
        const val = info.getValue();
        const colors: Record<string, string> = { Critical: 'bg-red-50 text-red-700 border-red-100', High: 'bg-orange-50 text-orange-700 border-orange-100', Medium: 'bg-yellow-50 text-yellow-700 border-yellow-100', Low: 'bg-gray-50 text-gray-600 border-gray-100' };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[val] || colors.Low}`}>{val || 'Unrated'}</span>;
      }
    }),
    columnHelper.accessor('sentiment_label', {
      header: 'Sentiment',
      cell: info => {
        const val = info.getValue();
        const colors: Record<string, string> = { Negative: 'text-red-600', Positive: 'text-green-600', Neutral: 'text-gray-500' };
        return <span className={`text-xs font-bold ${colors[val] || 'text-gray-500'}`}>{val || 'Neutral'}</span>;
      }
    }),
    columnHelper.accessor(row => row.accounts?.name, {
      id: 'account', header: 'Account',
      cell: info => <span className="text-gray-900 font-bold">{info.getValue() || <span className="text-gray-400 italic">Unlinked</span>}</span>,
    }),
  ], [selectedIds, data.rows]);

  const table = useReactTable({
    data: data.rows,
    columns,
    pageCount: Math.ceil(data.total / pageSize),
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <AppLayout
      title="Signal Explorer"
      subtitle="Triage customer feedback into evidence."
      actions={
        <div className="flex gap-2">
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => navigate('/app/signals/new')} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal flex items-center gap-2 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Signal
          </button>
        </div>
      }
    >
      {/* Free plan signal usage banner */}
      {!isLoading && (() => {
        const total = data.total;
        const limit = limits.signals;
        const pct = Math.min(100, Math.round((total / limit) * 100));
        const nearLimit = pct >= 75;
        const atLimit = pct >= 100;
        return (
          <div className={`mb-5 rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${atLimit ? 'bg-red-50 border-red-200' : nearLimit ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex-1">
              <div className={`text-xs font-black uppercase tracking-widest mb-1 ${atLimit ? 'text-red-600' : nearLimit ? 'text-amber-700' : 'text-blue-600'}`}>
                {atLimit ? 'Signal Limit Reached' : nearLimit ? 'Approaching Signal Limit' : 'Free Plan · Signal Usage'}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-black/5">
                  <div className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-red-500' : nearLimit ? 'bg-amber-400' : 'bg-brand-blue'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-sm font-black shrink-0 ${atLimit ? 'text-red-700' : nearLimit ? 'text-amber-800' : 'text-blue-700'}`}>
                  {total.toLocaleString()} / {limit.toLocaleString()}
                </span>
              </div>
            </div>
            <a href="/pricing" className={`shrink-0 text-sm font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${atLimit ? 'bg-red-600 text-white hover:bg-red-700' : nearLimit ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-brand-blue text-white hover:bg-blue-700'}`}>
              Upgrade →
            </a>
          </div>
        );
      })()}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 bg-astrix-teal/10 border border-astrix-teal/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4 animate-[fadeIn_0.2s_ease-out]">
          <span className="text-sm font-bold text-astrix-teal">{selectedIds.size} signal{selectedIds.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateProblemModal(true)} className="bg-astrix-teal text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-astrix-darkTeal transition-colors">
              <Layers className="w-3.5 h-3.5" /> Create Problem from Selected
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-astrix-teal transition-all flex-1">
          <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search signals..."
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 py-1"
          />
          {globalFilter && <button onClick={() => setGlobalFilter('')} className="text-gray-400 hover:text-gray-700 mr-1"><X className="w-4 h-4" /></button>}
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm ${showFilters || activeFilterCount > 0 ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 p-4 space-y-4 animate-[fadeIn_0.15s_ease-out]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Filter Signals</span>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Severity</label>
                <div className="flex flex-wrap gap-1.5">
                  {SEVERITIES.map(s => (
                    <button key={s} onClick={() => setFilterSeverity(filterSeverity === s ? '' : s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${filterSeverity === s ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-astrix-teal'}`}>
                      {filterSeverity === s && <Check className="inline w-3 h-3 mr-1" />}{s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Sentiment</label>
                <div className="flex flex-wrap gap-1.5">
                  {SENTIMENTS.map(s => (
                    <button key={s} onClick={() => setFilterSentiment(filterSentiment === s ? '' : s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${filterSentiment === s ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-astrix-teal'}`}>
                      {filterSentiment === s && <Check className="inline w-3 h-3 mr-1" />}{s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Product Area</label>
                <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="">All areas</option>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Account</label>
                <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="">All accounts</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : data.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No signals found</h3>
            <p className="text-sm mb-4">Upload a CSV or add a signal manually.</p>
            <div className="flex gap-2">
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50">Import CSV</button>
              <button onClick={() => navigate('/app/signals/new')} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal">Add Signal</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-4 font-black cursor-pointer hover:bg-gray-100" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} onClick={() => navigate(`/app/signals/${row.original.id}`)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedIds.has(row.original.id) ? 'bg-teal-50/40' : ''}`}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col divide-y divide-gray-100">
              {table.getRowModel().rows.map(row => {
                const sig = row.original;
                return (
                  <div key={row.id} onClick={() => navigate(`/app/signals/${sig.id}`)} className={`p-4 active:bg-gray-50 transition-colors flex flex-col gap-3 ${selectedIds.has(sig.id) ? 'bg-teal-50/40' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedIds.has(sig.id)} onChange={e => { e.stopPropagation(); toggleSelect(sig.id); }} onClick={e => e.stopPropagation()} className="rounded border-gray-300" />
                        {getSourceIcon(sig.source_type)}
                        <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest">{sig.source_type}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sig.severity_label === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {sig.severity_label || 'Unrated'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2 font-medium leading-relaxed">"{sig.raw_text}"</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-bold text-gray-900">{sig.accounts?.name || 'Unlinked Account'}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 mt-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {data.total} Signal{data.total !== 1 ? 's' : ''}{activeFilterCount > 0 ? ' (filtered)' : ''}
              </span>
              <div className="flex gap-2">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-50">Prev</button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Problem from Selection Modal */}
      {showCreateProblemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateProblemModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Create Problem</h2>
              <button onClick={() => setShowCreateProblemModal(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Group <span className="font-bold text-gray-900">{selectedIds.size} selected signal{selectedIds.size !== 1 ? 's' : ''}</span> into a new problem.</p>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Problem Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newProblemTitle}
                  onChange={e => setNewProblemTitle(e.target.value)}
                  placeholder="e.g. SAML SSO Integration Missing"
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateProblemModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button onClick={handleCreateProblemFromSelected} disabled={!newProblemTitle.trim() || isCreatingProblem} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isCreatingProblem && <Loader2 className="w-4 h-4 animate-spin" />} Create Problem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
