import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Building2, Users, CreditCard, Loader2, Trash2, Plus, X, Box, Target, ShieldCheck, Eye, Activity, Check, Bell, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Link } from 'react-router-dom';
import { useTeam, useActivities, useProductAreas, useSegments, api } from '../../lib/api';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('workspace');
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();

  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useTeam(activeWorkspace?.id);
  const { data: activities, isLoading: activitiesLoading } = useActivities(activeWorkspace?.id);
  const { data: productAreas, refetch: refetchAreas } = useProductAreas();
  const { data: segments, refetch: refetchSegments } = useSegments();

  const members = teamData?.members || [];

  const [wsName, setWsName] = useState('');
  const [wsTimezone, setWsTimezone] = useState('');
  const [subscription] = useState({ plan_type: 'Free', member_limit: 2, viewer_limit: 5 });

  // Invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Product Areas
  const [newArea, setNewArea] = useState('');
  const [isAddingArea, setIsAddingArea] = useState(false);

  // Segments
  const [newSegment, setNewSegment] = useState('');
  const [isAddingSegment, setIsAddingSegment] = useState(false);

  const tabs = [
    { id: 'workspace', name: 'Workspace', icon: Building2 },
    { id: 'areas', name: 'Product Areas', icon: Box },
    { id: 'segments', name: 'Segments', icon: Target },
    { id: 'team', name: 'Team Members', icon: Users },
    { id: 'billing', name: 'Billing & Quotas', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'digest', name: 'Email Digest', icon: Mail },
    { id: 'activity', name: 'Audit Log', icon: Activity },
  ];

  const NOTIF_STORAGE_KEY = 'astrix_notification_prefs';
  const DIGEST_STORAGE_KEY = 'astrix_digest_prefs';

  const defaultNotifPrefs = {
    email_weekly_digest: true,
    email_day7_reminder: true,
    email_day30_reminder: true,
    email_high_priority_signal: true,
    email_new_decision: false,
    inapp_score_change: true,
    inapp_team_decisions: true,
    inapp_daily_triage: false,
    inapp_verdict_due: true,
  };

  const defaultDigestPrefs = {
    enabled: true,
    day: 'Monday',
    include_signals: true,
    include_opportunities: true,
    include_reviews_due: true,
    include_decisions: true,
    frequency: 'weekly',
  };

  const [notifPrefs, setNotifPrefs] = React.useState(() => {
    try { return { ...defaultNotifPrefs, ...JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || '{}') }; }
    catch { return defaultNotifPrefs; }
  });
  const [digestPrefs, setDigestPrefs] = React.useState(() => {
    try { return { ...defaultDigestPrefs, ...JSON.parse(localStorage.getItem(DIGEST_STORAGE_KEY) || '{}') }; }
    catch { return defaultDigestPrefs; }
  });

  const updateNotif = (key: string, val: boolean) => {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
    addToast('Notification preference saved', 'success');
  };

  const updateDigest = (key: string, val: any) => {
    const updated = { ...digestPrefs, [key]: val };
    setDigestPrefs(updated);
    localStorage.setItem(DIGEST_STORAGE_KEY, JSON.stringify(updated));
    addToast('Digest preference saved', 'success');
  };

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setWsTimezone(activeWorkspace.timezone);
    }
  }, [activeWorkspace]);

  const handleUpdateWorkspace = async () => {
    addToast('Workspace settings saved', 'success');
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail) return;
    setIsSendingInvite(true);
    try {
      const editors = members.filter(m => m.role !== 'viewer').length;
      if (inviteRole !== 'viewer' && editors >= subscription.member_limit) {
        throw new Error(`Member limit reached (${subscription.member_limit}). Upgrade to invite more editors.`);
      }
      await api.team.invite(activeWorkspace.id, inviteEmail, inviteRole);
      addToast('Invitation sent successfully', 'success');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      refetchTeam();
    } catch (error: any) {
      addToast(error.message || 'Failed to send invitation', 'error');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const removeMember = async (id: string) => {
    await api.team.removeMember(id);
    addToast('Member removed', 'success');
    refetchTeam();
  };

  const handleAddArea = async () => {
    if (!newArea.trim() || productAreas.includes(newArea)) return;
    setIsAddingArea(true);
    try {
      await api.workspace.updateAreas([...productAreas, newArea.trim()]);
      await refetchAreas();
      setNewArea('');
      addToast('Product area added', 'success');
    } finally {
      setIsAddingArea(false);
    }
  };

  const handleRemoveArea = async (area: string) => {
    await api.workspace.updateAreas(productAreas.filter(a => a !== area));
    await refetchAreas();
    addToast('Product area removed', 'success');
  };

  const handleAddSegment = async () => {
    if (!newSegment.trim() || segments.includes(newSegment)) return;
    setIsAddingSegment(true);
    try {
      await api.workspace.updateSegments([...segments, newSegment.trim()]);
      await refetchSegments();
      setNewSegment('');
      addToast('Segment added', 'success');
    } finally {
      setIsAddingSegment(false);
    }
  };

  const handleRemoveSegment = async (seg: string) => {
    await api.workspace.updateSegments(segments.filter(s => s !== seg));
    await refetchSegments();
    addToast('Segment removed', 'success');
  };

  const activeEditors = members.filter(m => m.role !== 'viewer').length;
  const activeViewers = members.filter(m => m.role === 'viewer').length;

  const formatTime = (iso: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  return (
    <AppLayout title="Settings">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1 flex md:flex-col overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal ${activeTab === tab.id ? 'bg-white text-astrix-teal shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100 border border-transparent'}`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 min-h-[600px]">
          {/* WORKSPACE */}
          {activeTab === 'workspace' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Workspace Details</h3>
              <div className="space-y-6 max-w-md mb-12">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Workspace Name</label>
                  <input type="text" value={wsName} onChange={e => setWsName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Timezone</label>
                  <select value={wsTimezone} onChange={e => setWsTimezone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>
                <button onClick={handleUpdateWorkspace} className="bg-astrix-teal text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700 transition-colors">Save Changes</button>
              </div>
            </div>
          )}

          {/* PRODUCT AREAS */}
          {activeTab === 'areas' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Product Areas</h3>
              <div className="max-w-2xl">
                <p className="text-sm text-gray-500 mb-6">Categorize signals and problems by product component. These drive area-specific impact scoring.</p>
                <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                  {productAreas.map(area => (
                    <span key={area} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold border border-gray-200 hover:border-red-200 group transition-colors">
                      {area}
                      <button onClick={() => handleRemoveArea(area)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {productAreas.length === 0 && <span className="text-sm text-gray-400 italic">No product areas defined.</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddArea()}
                    placeholder="Add new area (e.g. Onboarding)..."
                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-astrix-teal shadow-inner"
                  />
                  <button onClick={handleAddArea} disabled={!newArea.trim() || isAddingArea} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {isAddingArea ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEGMENTS */}
          {activeTab === 'segments' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Customer Segments</h3>
              <div className="max-w-2xl">
                <p className="text-sm text-gray-500 mb-6">Group your accounts by business value or type. Segments power ARR-at-risk scoring and opportunity filtering.</p>
                <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                  {segments.map(seg => (
                    <span key={seg} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold border border-blue-100 group hover:border-red-200 transition-colors">
                      {seg}
                      <button onClick={() => handleRemoveSegment(seg)} className="text-blue-300 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {segments.length === 0 && <span className="text-sm text-gray-400 italic">No segments defined.</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSegment}
                    onChange={e => setNewSegment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSegment()}
                    placeholder="Add new segment (e.g. Enterprise)..."
                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-astrix-teal shadow-inner"
                  />
                  <button onClick={handleAddSegment} disabled={!newSegment.trim() || isAddingSegment} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {isAddingSegment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEAM */}
          {activeTab === 'team' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              {teamLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-heading text-xl font-bold text-gray-900">Team Members</h3>
                    <button onClick={() => setIsInviteModalOpen(true)} className="text-sm font-bold text-white bg-astrix-teal px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Invite Member
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Editors</span>
                        <span className="text-sm font-bold text-gray-900">{activeEditors} / {subscription.member_limit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-astrix-teal h-1.5 rounded-full" style={{ width: `${Math.min(100, (activeEditors / subscription.member_limit) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Eye className="w-4 h-4" /> Viewers</span>
                        <span className="text-sm font-bold text-gray-900">{activeViewers} / {subscription.viewer_limit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: `${Math.min(100, (activeViewers / subscription.viewer_limit) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Active Members ({members.length})</h4>
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {members.map(member => (
                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-astrix-teal/10 flex items-center justify-center text-xs font-bold text-astrix-teal">
                              {member.users?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{member.users?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{member.users?.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-xs font-mono font-bold uppercase px-2 py-1 rounded ${member.role === 'viewer' ? 'bg-blue-50 text-brand-blue' : member.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                              {member.role}
                            </span>
                            <button onClick={() => removeMember(member.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* BILLING */}
          {activeTab === 'billing' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Billing & Quotas</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 flex justify-between items-center">
                <div>
                  <div className="text-xs font-mono text-gray-500 uppercase font-bold mb-1">Current Plan</div>
                  <div className="text-2xl font-heading font-black text-gray-900 flex items-center gap-2 capitalize">
                    Free <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full uppercase tracking-widest font-bold">Active</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Limited to 200 signals, 1 active launch, 2 editor seats.</p>
                </div>
                <Link to="/pricing" className="bg-astrix-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700">Upgrade Plan</Link>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Signals', used: 3, limit: 200, color: 'bg-astrix-teal' },
                  { label: 'Active Launches', used: 1, limit: 1, color: 'bg-amber-500' },
                  { label: 'Editor Seats', used: 1, limit: 2, color: 'bg-brand-blue' },
                  { label: 'AI Calls / month', used: 12, limit: 100, color: 'bg-purple-500' },
                ].map(quota => {
                  const pct = Math.min(100, Math.round((quota.used / quota.limit) * 100));
                  const nearLimit = pct >= 75;
                  return (
                    <div key={quota.label} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-700">{quota.label}</span>
                        <span className={`text-sm font-bold ${nearLimit ? 'text-amber-700' : 'text-gray-900'}`}>{quota.used} / {quota.limit}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${quota.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      {nearLimit && <p className="text-xs text-amber-600 mt-1.5 font-medium">Approaching limit — consider upgrading.</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-4">Notification Preferences</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">Control which emails and in-app alerts you receive from Astrix.</p>

              {/* Email notifications */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <Mail className="w-4 h-4 text-astrix-teal" />
                  <span className="font-bold text-sm text-gray-900">Email Notifications</span>
                </div>
                {[
                  { key: 'email_weekly_digest', label: 'Weekly Digest', desc: 'Top signals, opportunities, and reviews due every Monday.' },
                  { key: 'email_day7_reminder', label: 'Day 7 Launch Reminder', desc: 'Reminder to complete your 7-day outcome review.' },
                  { key: 'email_day30_reminder', label: 'Day 30 Launch Reminder', desc: 'Reminder to submit your final verdict at Day 30.' },
                  { key: 'email_high_priority_signal', label: 'High-Priority Signal Alert', desc: 'Instant email when a Critical signal is ingested.' },
                  { key: 'email_new_decision', label: 'New Team Decision', desc: 'Notify you when a teammate logs a new decision.' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between px-5 py-4 border-b last:border-0 border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</div>
                    </div>
                    <button onClick={() => updateNotif(item.key, !(notifPrefs as any)[item.key])} className="shrink-0 ml-4">
                      {(notifPrefs as any)[item.key]
                        ? <ToggleRight className="w-8 h-8 text-astrix-teal" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />
                      }
                    </button>
                  </div>
                ))}
              </div>

              {/* In-app notifications */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <Bell className="w-4 h-4 text-brand-blue" />
                  <span className="font-bold text-sm text-gray-900">In-App Notifications</span>
                </div>
                {[
                  { key: 'inapp_score_change', label: 'Opportunity Score Change', desc: 'Alert when an opportunity score shifts by 10+ points.' },
                  { key: 'inapp_team_decisions', label: 'Team Activity', desc: 'Show when teammates log decisions or submit verdicts.' },
                  { key: 'inapp_verdict_due', label: 'Verdict Due Reminder', desc: 'In-app banner when a launch verdict is overdue.' },
                  { key: 'inapp_daily_triage', label: 'Daily Triage Prompt', desc: 'Remind you to review unmatched signals each day.' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between px-5 py-4 border-b last:border-0 border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</div>
                    </div>
                    <button onClick={() => updateNotif(item.key, !(notifPrefs as any)[item.key])} className="shrink-0 ml-4">
                      {(notifPrefs as any)[item.key]
                        ? <ToggleRight className="w-8 h-8 text-astrix-teal" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMAIL DIGEST */}
          {activeTab === 'digest' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-4">Weekly Email Digest</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">A curated summary of your product intelligence — delivered to your inbox every week.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Settings panel */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">Digest Settings</span>
                      <button onClick={() => updateDigest('enabled', !digestPrefs.enabled)}>
                        {digestPrefs.enabled
                          ? <ToggleRight className="w-8 h-8 text-astrix-teal" />
                          : <ToggleLeft className="w-8 h-8 text-gray-300" />
                        }
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">Send on</label>
                        <div className="flex flex-wrap gap-2">
                          {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => (
                            <button key={day} onClick={() => updateDigest('day', day)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${digestPrefs.day === day ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-astrix-teal'}`}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">Include in digest</label>
                        {[
                          { key: 'include_signals', label: 'New signals summary' },
                          { key: 'include_opportunities', label: 'Top opportunities' },
                          { key: 'include_reviews_due', label: 'Reviews due' },
                          { key: 'include_decisions', label: 'Recent decisions' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50">
                            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                            <button onClick={() => updateDigest(item.key, !(digestPrefs as any)[item.key])}>
                              {(digestPrefs as any)[item.key]
                                ? <ToggleRight className="w-7 h-7 text-astrix-teal" />
                                : <ToggleLeft className="w-7 h-7 text-gray-300" />
                              }
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email preview */}
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Preview</div>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-sm">
                    <div className="bg-gray-900 text-white px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-astrix-teal flex items-center justify-center text-[10px] font-black">A</div>
                        <span className="font-bold text-sm">Astrix AI</span>
                      </div>
                      <div className="text-xs text-gray-400">Your weekly product intelligence digest</div>
                    </div>
                    <div className="p-5 space-y-4 bg-gray-50">
                      <div className="text-base font-bold text-gray-900">Good {digestPrefs.day} — here's your week in product intelligence</div>
                      {digestPrefs.include_signals && (
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">📡 New Signals</div>
                          <div className="text-sm font-bold text-gray-900">12 new signals this week</div>
                          <div className="text-xs text-gray-500 mt-1">3 Critical · 5 High · 4 Medium</div>
                        </div>
                      )}
                      {digestPrefs.include_opportunities && (
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">🎯 Top Opportunity</div>
                          <div className="text-sm font-bold text-gray-900">Mobile Export Flow — Score 87</div>
                          <div className="text-xs text-gray-500 mt-1">$142K ARR at risk · Recommended: Build</div>
                        </div>
                      )}
                      {digestPrefs.include_reviews_due && (
                        <div className="bg-white rounded-xl p-3 border border-orange-200 border-l-4 border-l-orange-500">
                          <div className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">⏰ Reviews Due</div>
                          <div className="text-sm font-bold text-gray-900">2 launches need your review</div>
                          <div className="text-xs text-gray-500 mt-1">Dashboard Redesign · API Rate Limiting</div>
                        </div>
                      )}
                      {digestPrefs.include_decisions && (
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">✅ Recent Decisions</div>
                          <div className="text-sm font-bold text-gray-900">3 decisions logged this week</div>
                          <div className="text-xs text-gray-500 mt-1">Build · Experiment · Defer</div>
                        </div>
                      )}
                      <div className="text-center pt-2">
                        <div className="inline-block bg-astrix-teal text-white text-xs font-bold px-4 py-2 rounded-lg">Open Astrix Dashboard →</div>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-gray-100 text-center text-[10px] text-gray-400 font-medium">
                      Astrix AI · Unsubscribe · Manage preferences
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG */}
          {activeTab === 'activity' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h3 className="font-heading text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Audit Log</h3>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {activitiesLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : activities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium">No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {activities.map((act: any) => (
                      <div key={act.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {act.actor?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{act.action}</div>
                            <div className="text-xs text-gray-500">{act.object_type}{act.metadata ? ` · ${act.metadata}` : ''} · {act.actor}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono shrink-0 ml-4">{formatTime(act.time)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSendingInvite && setIsInviteModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => !isSendingInvite && setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email Address *</label>
                <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="viewer">Viewer — Read-only (free, unlimited)</option>
                  <option value="member">Member — Create decisions & artifacts</option>
                  <option value="admin">Admin — Manage settings & billing</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isSendingInvite || !inviteEmail} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isSendingInvite && <Loader2 className="w-4 h-4 animate-spin" />} Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
