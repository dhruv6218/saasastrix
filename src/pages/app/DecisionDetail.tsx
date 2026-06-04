import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { CheckCircle2, FileText, Activity, Clock, Loader2, Copy, Edit2, Save, ChevronDown, ChevronRight, AlertTriangle, ListChecks, GitBranch, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { JiraLinearModal } from '../../components/modals/JiraLinearModal';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDecision, useArtifacts, useLaunches, api } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { AIBadge } from '../../components/ui/AIBadge';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';

interface CollapsibleSection {
  title: string;
  icon: React.ElementType;
  field: 'assumptions' | 'risks' | 'alternatives';
  placeholder: string;
  color: string;
}

const SECTIONS: CollapsibleSection[] = [
  { title: 'Assumptions', icon: ListChecks, field: 'assumptions', placeholder: 'List the key assumptions this decision rests on...', color: 'text-blue-600' },
  { title: 'Risks', icon: AlertTriangle, field: 'risks', placeholder: 'What could go wrong? List known risks...', color: 'text-amber-600' },
  { title: 'Alternatives Considered', icon: GitBranch, field: 'alternatives', placeholder: 'What other options were evaluated and why were they rejected?...', color: 'text-purple-600' },
];

export const DecisionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();

  const { data: currentDecision, isLoading, refetch } = useDecision(id);
  const { data: artifacts, refetch: fetchArtifacts } = useArtifacts(activeWorkspace?.id);
  const { data: launches } = useLaunches(activeWorkspace?.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showJiraLinearModal, setShowJiraLinearModal] = useState(false);

  const [showLaunchForm, setShowLaunchForm] = useState(false);
  const [launchDate, setLaunchDate] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [targetMetrics, setTargetMetrics] = useState('');
  const [isSavingLaunch, setIsSavingLaunch] = useState(false);

  // Editable decision fields
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionValues, setSectionValues] = useState<Record<string, string>>({});
  const [isSavingSection, setIsSavingSection] = useState(false);

  React.useEffect(() => {
    if (currentDecision) {
      setSectionValues({
        assumptions: (currentDecision as any).assumptions || '',
        risks: (currentDecision as any).risks || '',
        alternatives: (currentDecision as any).alternatives || '',
      });
    }
  }, [currentDecision]);

  const decisionArtifacts = artifacts.filter(a => a.decision_id === id);
  const decisionLaunches = launches.filter(l => l.decision_id === id);
  const activeArtifact = decisionArtifacts[0];

  const handleGenerateArtifact = async (type: string) => {
    if (!activeWorkspace || !id || !user) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 2500));
      const content = type === 'prd'
        ? `# Product Requirements Document\n\n## Problem Statement\n${currentDecision?.rationale || ''}\n\n## Goals\n- Solve the core problem affecting accounts\n- Ship within 3 sprints\n\n## Success Metrics\n- Signal count drops by 80% at Day 30\n- 0 related churns next quarter\n\n## Out of Scope\n- Advanced analytics (v2)\n- PDF export (v2)`
        : `# Decision Memo\n\n## Context\n${currentDecision?.rationale || ''}\n\n## Decision\nAction: ${currentDecision?.action}\n\n## Expected Outcome\nReduce churn signals and unblock Enterprise renewals.\n\n## Risks\n${sectionValues.risks || 'See decision detail.'}\n\n## Sign-off\nAuthor: ${user?.user_metadata?.full_name || 'PM'}`;

      await api.artifacts.create({
        workspace_id: activeWorkspace.id,
        decision_id: id,
        title: type === 'prd' ? 'Generated PRD' : 'Decision Memo',
        type,
        content,
        author_id: user.id
      });
      await fetchArtifacts();
      addToast("Artifact generated successfully via AI", "success");
    } catch {
      addToast("Failed to generate artifact.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeArtifact) return;
    await api.artifacts.update(activeArtifact.id, { content: editContent });
    addToast("Changes saved successfully", "success");
    setIsEditing(false);
  };

  const handleSaveSection = async (field: string) => {
    if (!id) return;
    setIsSavingSection(true);
    try {
      await api.decisions.update(id, { [field]: sectionValues[field] } as any);
      await refetch();
      addToast(`${field.charAt(0).toUpperCase() + field.slice(1)} saved.`, 'success');
      setEditingSection(null);
    } catch {
      addToast('Failed to save.', 'error');
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleLogLaunch = async () => {
    if (!activeWorkspace || !id || !user || !launchDate || !currentDecision) return;
    setIsSavingLaunch(true);
    try {
      const launch = await api.launches.create({
        workspace_id: activeWorkspace.id,
        decision_id: id,
        title: currentDecision.title,
        action: currentDecision.action,
        launched_at: new Date(launchDate).toISOString(),
        created_by: user.id,
        expected_outcome: expectedOutcome,
        target_metrics: targetMetrics,
        baseline_signal_count: 0,
        baseline_arr_at_risk: 0,
      } as any);
      addToast("Launch logged successfully", "success");
      setShowLaunchForm(false);
      navigate(`/app/launches/${launch.id}`);
    } catch (err: any) {
      addToast(err.message || "Failed to log launch", "error");
    } finally {
      setIsSavingLaunch(false);
    }
  };

  const copyToClipboard = () => {
    if (activeArtifact) {
      navigator.clipboard.writeText(activeArtifact.content);
      addToast("Copied to clipboard", "success");
    }
  };

  if (isLoading) return <AppLayout title="Loading..."><Skeleton className="w-full h-64" /></AppLayout>;
  if (!currentDecision) return <AppLayout title="Not Found"><div className="p-8 text-center">Decision not found.</div></AppLayout>;

  const hasLaunch = decisionLaunches.length > 0;
  const launch = decisionLaunches[0];

  return (
    <AppLayout title={`Decision: ${currentDecision.title}`} subtitle="Permanent paper trail">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Action + Rationale */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <span className={`px-3 py-1 rounded-md uppercase tracking-wider font-bold text-sm inline-flex items-center gap-2 mb-6 ${currentDecision.action === 'Build' ? 'bg-blue-100 text-blue-700' : currentDecision.action === 'Fix' ? 'bg-yellow-100 text-yellow-700' : currentDecision.action === 'Reject' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              <CheckCircle2 className="w-4 h-4" /> Action: {currentDecision.action}
            </span>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-3">Rationale</h3>
            <div className="bg-gray-50 border-l-4 border-astrix-teal p-5 rounded-r-xl text-gray-700 font-medium whitespace-pre-wrap">
              "{currentDecision.rationale}"
            </div>
          </div>

          {/* Assumptions / Risks / Alternatives */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-heading text-lg font-bold text-gray-900">Decision Context</h3>
              <p className="text-xs text-gray-400 mt-1">Assumptions, risks, and alternatives considered.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {SECTIONS.map(section => {
                const isOpen = expandedSection === section.field;
                const isEditMode = editingSection === section.field;
                const value = sectionValues[section.field] || '';
                const Icon = section.icon;

                return (
                  <div key={section.field}>
                    <button
                      onClick={() => { setExpandedSection(isOpen ? null : section.field); setEditingSection(null); }}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${section.color}`} />
                        <span className="font-bold text-sm text-gray-900">{section.title}</span>
                        {value && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase">Filled</span>}
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 animate-[fadeIn_0.2s_ease-out]">
                        {isEditMode ? (
                          <div className="space-y-3">
                            <textarea
                              value={sectionValues[section.field]}
                              onChange={e => setSectionValues(prev => ({ ...prev, [section.field]: e.target.value }))}
                              placeholder={section.placeholder}
                              rows={5}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-astrix-teal transition-all resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingSection(null)} className="text-xs font-bold text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">Cancel</button>
                              <button onClick={() => handleSaveSection(section.field)} disabled={isSavingSection} className="text-xs font-bold text-white bg-astrix-teal px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                                {isSavingSection ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {value ? (
                              <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">{value}</p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">{section.placeholder}</p>
                            )}
                            <button onClick={() => setEditingSection(section.field)} className="mt-3 text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal flex items-center gap-1">
                              <Edit2 className="w-3 h-3" /> {value ? 'Edit' : 'Add'} {section.title}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Artifacts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-astrix-teal" /> Artifacts
              </h3>
              {decisionArtifacts.length === 0 && !isGenerating && (
                <div className="flex gap-2">
                  <button onClick={() => handleGenerateArtifact('prd')} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700">Generate PRD</button>
                  <button onClick={() => handleGenerateArtifact('decision_memo')} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">Memo</button>
                </div>
              )}
              {decisionArtifacts.length > 0 && (
                <Link to="/app/artifacts" className="text-xs font-bold text-astrix-teal hover:text-astrix-darkTeal">View in Artifact Studio →</Link>
              )}
            </div>

            {isGenerating ? (
              <div className="space-y-3"><Skeleton className="w-full h-4" /><Skeleton className="w-3/4 h-4" /><Skeleton className="w-1/2 h-4" /></div>
            ) : decisionArtifacts.length > 0 && activeArtifact ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">
                    <AIBadge /> {activeArtifact.title}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2">Cancel</button>
                        <button onClick={handleSaveEdit} className="text-xs font-bold bg-astrix-teal text-white px-3 py-1.5 rounded-md flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                      </>
                    ) : (
                      <>
                        <button onClick={copyToClipboard} className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-md shadow-sm" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditContent(activeArtifact.content); setIsEditing(true); }} className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-md shadow-sm" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6 font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white max-h-[400px] overflow-y-auto">
                  {isEditing ? (
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full min-h-[300px] outline-none resize-y bg-transparent" />
                  ) : activeArtifact.content}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No artifacts generated yet. Generate a PRD or Decision Memo to create a sharable spec.</p>
            )}
          </div>

          {/* Post-Launch Tracking */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-astrix-terra" /> Post-Launch Tracking
              </h3>
              {!hasLaunch && !showLaunchForm && (
                <button onClick={() => setShowLaunchForm(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">
                  Log Launch
                </button>
              )}
            </div>

            {showLaunchForm ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 animate-[fadeIn_0.3s_ease-out] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Launch Date <span className="text-red-500">*</span></label>
                    <input type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-astrix-teal" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Expected Outcome</label>
                    <input type="text" value={expectedOutcome} onChange={e => setExpectedOutcome(e.target.value)} placeholder="e.g. Reduce churn by 30%" className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-astrix-teal" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Metrics</label>
                  <input type="text" value={targetMetrics} onChange={e => setTargetMetrics(e.target.value)} placeholder="e.g. SSO signals drop 80% at Day 30" className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-astrix-teal" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowLaunchForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                  <button onClick={handleLogLaunch} disabled={!launchDate || isSavingLaunch} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                    {isSavingLaunch && <Loader2 className="w-4 h-4 animate-spin" />} Save Launch
                  </button>
                </div>
              </div>
            ) : hasLaunch ? (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span className="font-bold text-gray-900">Launched on:</span> {new Date(launch.launched_at).toLocaleDateString()}
                </div>
                {[
                  { label: 'Baseline', days: 0, isDue: true },
                  { label: 'Day 7 Review', days: 7 },
                  { label: 'Day 30 Review', days: 30 },
                ].map(({ label, days }) => {
                  const dueDate = new Date(launch.launched_at);
                  dueDate.setDate(dueDate.getDate() + days);
                  const isDue = new Date() >= dueDate;
                  return (
                    <div key={label} className={`border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDue ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <div className={`font-bold mb-1 ${isDue ? 'text-amber-900' : 'text-gray-700'}`}>{label}</div>
                        <div className={`text-xs font-medium flex items-center gap-1 ${isDue ? 'text-amber-700' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3" /> {isDue ? 'Ready for review' : `Unlocks ${dueDate.toLocaleDateString()}`}
                        </div>
                      </div>
                      <Link
                        to={`/app/launches/${launch.id}`}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${isDue ? 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 shadow-sm' : 'bg-gray-100 text-gray-400 pointer-events-none'}`}
                      >
                        {isDue ? 'Enter Results →' : 'Locked'}
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Log a launch date to open tracking windows.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">

          {/* Push to Jira / Linear */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-heading text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest">Push to Project Manager</h3>
            <p className="text-xs text-gray-400 font-medium mb-4">Create a Jira or Linear issue from this decision in one click.</p>
            <button onClick={() => setShowJiraLinearModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-astrix-teal transition-colors shadow-sm">
              <ExternalLink className="w-4 h-4" /> Push to Jira / Linear
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Metadata</h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Author</span>
                <span className="font-bold text-gray-900">{currentDecision.users?.full_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Date</span>
                <span className="font-bold text-gray-900">{new Date(currentDecision.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Action</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${currentDecision.action === 'Build' ? 'bg-blue-50 text-blue-700' : currentDecision.action === 'Fix' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{currentDecision.action}</span>
              </div>
            </div>
          </div>

          {currentDecision.problem_id && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">Linked Evidence</h3>
              <div className="space-y-3">
                <Link to={`/app/problems/${currentDecision.problem_id}`} className="flex items-center gap-2 text-sm font-bold text-astrix-teal hover:underline">
                  <LinkIcon className="w-4 h-4" /> View Problem
                </Link>
                {currentDecision.opportunity_id && (
                  <Link to={`/app/opportunities/${currentDecision.opportunity_id}`} className="flex items-center gap-2 text-sm font-bold text-astrix-teal hover:underline">
                    <LinkIcon className="w-4 h-4" /> View Opportunity
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <JiraLinearModal
        isOpen={showJiraLinearModal}
        onClose={() => setShowJiraLinearModal(false)}
        title={currentDecision.title}
        description={currentDecision.rationale || ''}
        decisionId={id}
      />
    </AppLayout>
  );
};
