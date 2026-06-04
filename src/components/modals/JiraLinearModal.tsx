import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  decisionId?: string;
}

type Platform = 'jira' | 'linear';

const JIRA_PROJECTS = ['PROD', 'ENG', 'GROWTH', 'PLATFORM'];
const JIRA_TYPES = ['Story', 'Task', 'Bug', 'Epic'];
const JIRA_PRIORITIES = ['Highest', 'High', 'Medium', 'Low'];
const LINEAR_TEAMS = ['Product', 'Engineering', 'Growth', 'Platform'];
const LINEAR_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low', 'No Priority'];

export const JiraLinearModal: React.FC<Props> = ({ isOpen, onClose, title, description = '', decisionId }) => {
  const { addToast } = useToast();
  const [platform, setPlatform] = useState<Platform>('jira');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushed, setPushed] = useState<{ platform: Platform; url: string } | null>(null);

  const [jiraForm, setJiraForm] = useState({ project: 'PROD', type: 'Story', priority: 'High', title, description, sprint: 'Current Sprint' });
  const [linearForm, setLinearForm] = useState({ team: 'Product', priority: 'High', title, description, cycle: 'Current Cycle', estimate: '3' });

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    const mockKey = platform === 'jira'
      ? `${jiraForm.project}-${Math.floor(Math.random() * 900 + 100)}`
      : `PRO-${Math.floor(Math.random() * 900 + 100)}`;
    const mockUrl = platform === 'jira'
      ? `https://yourcompany.atlassian.net/browse/${mockKey}`
      : `https://linear.app/yourcompany/issue/${mockKey}`;
    setPushed({ platform, url: mockUrl });
    setIsSubmitting(false);
    addToast(`Issue created in ${platform === 'jira' ? 'Jira' : 'Linear'}: ${mockKey}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-heading text-lg font-bold text-gray-900">Push to Project Manager</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Create an issue from this decision</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {pushed ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Issue Created!</h3>
            <p className="text-sm text-gray-500 font-medium mb-4">
              Your {pushed.platform === 'jira' ? 'Jira' : 'Linear'} issue is ready.
            </p>
            <a href={pushed.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-astrix-teal transition-colors">
              Open Issue <ExternalLink className="w-4 h-4" />
            </a>
            <div className="mt-3">
              <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-900 font-medium">Close</button>
            </div>
          </div>
        ) : (
          <>
            {/* Platform tabs */}
            <div className="flex border-b border-gray-100">
              {(['jira', 'linear'] as Platform[]).map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${platform === p ? 'border-b-2 border-astrix-teal text-astrix-teal' : 'text-gray-400 hover:text-gray-700'}`}>
                  {p === 'jira' ? '🔵 Jira' : '🟣 Linear'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {platform === 'jira' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Project</label>
                      <select value={jiraForm.project} onChange={e => setJiraForm(f => ({ ...f, project: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        {JIRA_PROJECTS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Issue Type</label>
                      <select value={jiraForm.type} onChange={e => setJiraForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        {JIRA_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Priority</label>
                      <select value={jiraForm.priority} onChange={e => setJiraForm(f => ({ ...f, priority: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        {JIRA_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Sprint</label>
                      <select value={jiraForm.sprint} onChange={e => setJiraForm(f => ({ ...f, sprint: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        <option>Current Sprint</option><option>Next Sprint</option><option>Backlog</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Issue Title</label>
                    <input value={jiraForm.title} onChange={e => setJiraForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                    <textarea rows={3} value={jiraForm.description} onChange={e => setJiraForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal resize-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Team</label>
                      <select value={linearForm.team} onChange={e => setLinearForm(f => ({ ...f, team: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        {LINEAR_TEAMS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Priority</label>
                      <select value={linearForm.priority} onChange={e => setLinearForm(f => ({ ...f, priority: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        {LINEAR_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Cycle</label>
                      <select value={linearForm.cycle} onChange={e => setLinearForm(f => ({ ...f, cycle: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        <option>Current Cycle</option><option>Next Cycle</option><option>Backlog</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Estimate (pts)</label>
                      <select value={linearForm.estimate} onChange={e => setLinearForm(f => ({ ...f, estimate: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal">
                        {['1','2','3','5','8','13'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Issue Title</label>
                    <input value={linearForm.title} onChange={e => setLinearForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                    <textarea rows={3} value={linearForm.description} onChange={e => setLinearForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-astrix-teal resize-none" />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
              <button onClick={handlePush} disabled={isSubmitting}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-astrix-teal transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : `Push to ${platform === 'jira' ? 'Jira' : 'Linear'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
