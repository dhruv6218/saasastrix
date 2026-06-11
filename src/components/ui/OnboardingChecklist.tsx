import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSignals, useAccounts, useProblems, useOpportunities, useDecisions, useLaunches } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const STORAGE_KEY = 'astrix_checklist_dismissed';

interface Step {
  id: string;
  label: string;
  desc: string;
  href: string;
  linkLabel: string;
}

const STEPS: Step[] = [
  { id: 'workspace', label: 'Create your workspace', desc: 'You\'ve already done this!', href: '/app/settings', linkLabel: 'Settings' },
  { id: 'signals', label: 'Add your first signals', desc: 'Upload a CSV or add signals manually', href: '/app/signals/new', linkLabel: 'Add signals' },
  { id: 'accounts', label: 'Import account data', desc: 'Connect ARR and plan context to signals', href: '/app/accounts', linkLabel: 'Import accounts' },
  { id: 'problems', label: 'Cluster problems from signals', desc: 'Let AI group related signals into problems', href: '/app/problems', linkLabel: 'Go to Problems' },
  { id: 'opportunities', label: 'Review scored opportunities', desc: 'See what to build based on evidence', href: '/app/opportunities', linkLabel: 'View Opportunities' },
  { id: 'decisions', label: 'Log your first decision', desc: 'Build / Fix / Experiment — with rationale', href: '/app/opportunities', linkLabel: 'Make Decision' },
  { id: 'launches', label: 'Track your first launch', desc: 'Set a Day 7 and Day 30 review', href: '/app/launches', linkLabel: 'Track Launch' },
];

export const OnboardingChecklist: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const wsId = activeWorkspace?.id;

  const { data: signals } = useSignals(wsId);
  const { data: accounts } = useAccounts(wsId);
  const { data: problems } = useProblems(wsId);
  const { data: opportunities } = useOpportunities(wsId);
  const { data: decisions } = useDecisions(wsId);
  const { data: launches } = useLaunches(wsId);

  const [isOpen, setIsOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') setIsDismissed(true);
  }, []);

  const completedMap: Record<string, boolean> = {
    workspace: true,
    signals: (signals?.total ?? 0) > 0,
    accounts: (accounts?.total ?? 0) > 0,
    problems: (problems?.length ?? 0) > 0,
    opportunities: (opportunities?.length ?? 0) > 0,
    decisions: (decisions?.length ?? 0) > 0,
    launches: (launches?.length ?? 0) > 0,
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const total = STEPS.length;
  const allDone = completedCount === total;
  const progress = Math.round((completedCount / total) * 100);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed || allDone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-astrix-teal" />
          <span className="text-sm font-bold">Getting Started</span>
          <span className="bg-astrix-teal text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{completedCount}/{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white p-0.5 rounded transition-colors">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-white p-0.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 w-full">
        <div className="h-full bg-astrix-teal transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {isOpen && (
        <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
          {STEPS.map((step) => {
            const done = completedMap[step.id];
            return (
              <div key={step.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${done ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                <div className="mt-0.5 shrink-0">
                  {done
                    ? <CheckCircle2 className="w-4.5 h-4.5 text-astrix-teal" />
                    : <Circle className="w-4.5 h-4.5 text-gray-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{step.label}</div>
                  <div className="text-xs text-gray-400 font-medium mt-0.5">{step.desc}</div>
                  {!done && (
                    <Link to={step.href} className="inline-flex items-center gap-1 text-xs font-bold text-astrix-teal hover:underline mt-1">
                      {step.linkLabel} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
