import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Search, Filter, ArrowRight, Loader2, GitCompare, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDecisions } from '../../lib/api';

const ACTION_COLORS: Record<string, string> = {
  Build: 'bg-blue-100 text-blue-700',
  Fix: 'bg-yellow-100 text-yellow-700',
  Experiment: 'bg-purple-100 text-purple-700',
  Reject: 'bg-red-100 text-red-700',
  Defer: 'bg-gray-100 text-gray-600',
};
const DOT_COLORS: Record<string, string> = {
  Build: 'bg-brand-blue',
  Fix: 'bg-brand-yellow',
  Experiment: 'bg-purple-500',
  Reject: 'bg-brand-red',
  Defer: 'bg-gray-400',
};

export const DecisionsHistory = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: decisions, isLoading } = useDecisions(activeWorkspace?.id);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return decisions.filter(d => {
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.rationale.toLowerCase().includes(search.toLowerCase());
      const matchAction = !filterAction || d.action === filterAction;
      return matchSearch && matchAction;
    });
  }, [decisions, search, filterAction]);

  const activeFilterCount = [filterAction].filter(Boolean).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <AppLayout 
      title="Decision History" 
      subtitle="The permanent paper trail of your product strategy."
      actions={
        <Link to="/app/opportunities" className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          New Decision
        </Link>
      }
    >
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-brand-blue transition-all">
          <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search past decisions..." 
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 py-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="mr-2 text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`bg-white border px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 ${showFilters || activeFilterCount > 0 ? 'border-brand-blue text-brand-blue' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <Filter className="w-4 h-4" /> Filter
          {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-brand-blue text-white text-xs flex items-center justify-center font-black">{activeFilterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Action</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
            >
              <option value="">All Actions</option>
              {['Build','Fix','Experiment','Defer','Reject'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-end">
              <button onClick={() => setFilterAction('')} className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 bg-red-50">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mb-4" />
          <p className="font-medium text-sm">Loading decisions...</p>
        </div>
      ) : decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <GitCompare className="w-12 h-12 mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No decisions logged</h3>
          <p className="font-medium text-sm mb-4">Go to Opportunities to compare and log your first decision.</p>
          <Link to="/app/opportunities" className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
            View Opportunities
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Search className="w-10 h-10 mb-3 opacity-20" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No matches</h3>
          <p className="text-sm font-medium mb-3">Try a different search term or clear filters.</p>
          <button onClick={() => { setSearch(''); setFilterAction(''); }} className="text-sm font-bold text-brand-blue hover:underline">Clear all</button>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {filtered.map((dec, i) => (
            <div key={dec.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active animate-[fadeIn_0.5s_ease-out]">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-100 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className={`w-3 h-3 rounded-full ${DOT_COLORS[dec.action] || 'bg-gray-400'}`}></div>
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded uppercase tracking-wider font-bold text-[10px] font-mono ${ACTION_COLORS[dec.action] || 'bg-gray-100 text-gray-700'}`}>
                    {dec.action}
                  </span>
                  <span className="text-xs font-mono text-gray-400 font-bold">{formatDate(dec.created_at)}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{dec.title}</h3>
                <p className="text-sm text-gray-600 font-medium mb-4 line-clamp-2">"{dec.rationale}"</p>
                
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-700">
                      {dec.users?.full_name ? dec.users.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {dec.users?.full_name || 'Unknown User'}
                  </div>
                  <Link to={`/app/decisions/${dec.id}`} className="text-brand-blue text-xs font-bold flex items-center gap-1 hover:underline">
                    View Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};
