import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Search, Hash, MessageCircle, Github, AlertCircle, FileSpreadsheet, Database, UploadCloud, Plus, Loader2, ChevronRight, Filter } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { useSignals, useAccounts, api } from '../../lib/api';
import { Signal } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  SortingState,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';

export const SignalExplorer = () => {
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  const { data, isLoading } = useSignals(activeWorkspace?.id, {
    page: pageIndex + 1,
    limit: pageSize,
    globalFilter,
    sorting
  });
  
  const { data: accountsData } = useAccounts(activeWorkspace?.id);
  const accounts = accountsData?.rows || [];

  const getSourceIcon = (source: string) => {
    switch(source?.toLowerCase()) {
      case 'slack': return <Hash className="w-4 h-4 text-pink-600" />;
      case 'discord': return <MessageCircle className="w-4 h-4 text-indigo-500" />;
      case 'github': return <Github className="w-4 h-4 text-gray-900" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-gray-700" />;
    }
  };

  const columnHelper = createColumnHelper<Signal>();
  const columns = useMemo(() => [
    columnHelper.accessor('source_type', {
      header: 'Source',
      cell: info => <div className="flex items-center gap-2">{getSourceIcon(info.getValue())} <span className="font-bold text-xs text-gray-500 uppercase">{info.getValue()}</span></div>,
    }),
    columnHelper.accessor('raw_text', {
      header: 'Signal',
      cell: info => <div className="truncate max-w-[400px] text-gray-900 font-medium">"{info.getValue()}"</div>,
    }),
    columnHelper.accessor('severity_label', {
      header: 'Severity',
      cell: info => {
        const val = info.getValue();
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${val === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
            {val || 'Unrated'}
          </span>
        );
      }
    }),
    columnHelper.accessor(row => row.accounts?.name, {
      id: 'account',
      header: 'Account',
      cell: info => <span className="text-gray-900 font-bold">{info.getValue() || 'Unlinked'}</span>,
    }),
  ], []);

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
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> Import
          </button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-astrix-teal transition-all flex-1">
          <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
          <input 
            type="text" 
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search signals..." 
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 py-1"
          />
        </div>
        <button className="md:hidden bg-white border border-gray-200 p-3 rounded-xl text-gray-600">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : data.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No signals found</h3>
            <p className="text-sm mb-4">Upload a CSV to inject customer evidence.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Desktop Table */}
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
                    <tr key={row.id} onClick={() => navigate(`/app/signals/${row.original.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Optimized for thumb-reach */}
            <div className="md:hidden flex flex-col divide-y divide-gray-100">
              {table.getRowModel().rows.map(row => {
                const sig = row.original;
                return (
                  <div key={row.id} onClick={() => navigate(`/app/signals/${sig.id}`)} className="p-4 active:bg-gray-50 transition-colors flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
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
                {table.getRowModel().rows.length} / {data.total} Signals
              </span>
              <div className="flex gap-2">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-50">Prev</button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
