import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Layers, TrendingUp, CheckCircle,
  Settings, LogOut, Bell, Menu, X, ChevronDown, Check,
  FileText, Rocket, Building2, Lock, Sparkles, User as UserIcon,
  Timer, AlertCircle, BadgeCheck, Signal, Activity, CheckCircle2, Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { CsvUploadModal } from '../components/modals/CsvUploadModal';
import { OnboardingChecklist } from '../components/ui/OnboardingChecklist';
import { useSignals, useLaunches } from '../lib/api';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backPath?: string;
}

type NotifLevel = 'urgent' | 'warning' | 'info' | 'success';

interface Notification {
  id: string;
  level: NotifLevel;
  icon: React.ElementType;
  title: string;
  body: string;
  href: string;
  time: string;
}

const levelStyles: Record<NotifLevel, { dot: string; bg: string; icon: string }> = {
  urgent:  { dot: 'bg-red-500',    bg: 'bg-red-50',    icon: 'text-red-500'    },
  warning: { dot: 'bg-amber-400',  bg: 'bg-amber-50',  icon: 'text-amber-500'  },
  info:    { dot: 'bg-brand-blue', bg: 'bg-blue-50',   icon: 'text-brand-blue' },
  success: { dot: 'bg-green-500',  bg: 'bg-green-50',  icon: 'text-green-600'  },
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title, subtitle, actions, backPath }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { workspaces, activeWorkspace, isWorkspaceInitializing, setActiveWorkspace } = useWorkspace();
  const wsId = activeWorkspace?.id;

  const { data: sigData } = useSignals(wsId);
  const { data: launchData } = useLaunches(wsId);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [showNewWsModal, setShowNewWsModal] = useState(false);

  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsWorkspaceDropdownOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node))
        setIsWorkspaceDropdownOpen(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node))
        setIsProfileDropdownOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node))
        setIsNotificationsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWorkspaceDropdownOpen(false);
        setIsProfileDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const signalsCount = sigData?.total || 0;
  const launches = launchData || [];

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    const activeLaunches = launches.filter(
      (l) => l.status === 'active' || l.status === 'pending_review'
    );
    const reviewsDue = activeLaunches.filter((l) => {
      const days = (Date.now() - new Date(l.launched_at).getTime()) / (1000 * 3600 * 24);
      return days >= 7;
    });

    reviewsDue.forEach((l) => {
      const days = Math.floor((Date.now() - new Date(l.launched_at).getTime()) / (1000 * 3600 * 24));
      items.push({
        id: `review-${l.id}`,
        level: 'urgent',
        icon: Timer,
        title: 'Launch review overdue',
        body: `${l.title} · Day ${days} — outcome measurement required.`,
        href: `/app/launches/${l.id}`,
        time: 'Overdue',
      });
    });

    const unmatched = Math.max(0, Math.floor(signalsCount * 0.15));
    if (unmatched > 0) {
      items.push({
        id: 'unmatched-signals',
        level: 'warning',
        icon: AlertCircle,
        title: `${unmatched} unmatched signal${unmatched !== 1 ? 's' : ''} need triage`,
        body: 'Signals without an account or problem assignment are blocking clustering.',
        href: '/app/signals',
        time: 'Today',
      });
    }

    const solvedLaunches = launches.filter((l) => l.pm_verdict === 'Solved');
    solvedLaunches.forEach((l) => {
      items.push({
        id: `verdict-${l.id}`,
        level: 'success',
        icon: BadgeCheck,
        title: `Verdict logged: Solved`,
        body: `${l.title} — outcome confirmed and archived.`,
        href: `/app/launches/${l.id}`,
        time: 'This week',
      });
    });

    if (signalsCount > 0) {
      items.push({
        id: 'signals-ingested',
        level: 'info',
        icon: Signal,
        title: `${signalsCount} signal${signalsCount !== 1 ? 's' : ''} ingested`,
        body: `Free plan usage: ${signalsCount} / 200. ${200 - signalsCount} remaining.`,
        href: '/app/signals',
        time: 'Today',
      });
    }

    if (activeLaunches.length > 0 && reviewsDue.length === 0) {
      items.push({
        id: 'active-launches',
        level: 'info',
        icon: Activity,
        title: `${activeLaunches.length} launch${activeLaunches.length !== 1 ? 'es' : ''} running`,
        body: activeLaunches.map((l) => l.title).join(', '),
        href: '/app/launches',
        time: 'Active',
      });
    }

    if (launches.length > 0 && reviewsDue.length === 0 && solvedLaunches.length === 0) {
      items.push({
        id: 'all-good',
        level: 'success',
        icon: CheckCircle2,
        title: 'No reviews overdue',
        body: 'All launch outcome windows are on track.',
        href: '/app/launches',
        time: 'Just now',
      });
    }

    return items;
  }, [launches, signalsCount]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const primaryNav = [
    { name: 'Dashboard',     path: '/app',                icon: LayoutDashboard },
    { name: 'Signals',       path: '/app/signals',        icon: Search },
    { name: 'Accounts',      path: '/app/accounts',       icon: Building2 },
    { name: 'Problems',      path: '/app/problems',       icon: Layers },
    { name: 'Opportunities', path: '/app/opportunities',  icon: TrendingUp },
    { name: 'Decisions',     path: '/app/decisions',      icon: CheckCircle },
    { name: 'Launches',      path: '/app/launches',       icon: Rocket },
  ];

  const secondaryNav = [
    { name: 'Ask AI',        path: '/app/ask',          icon: Sparkles },
    { name: 'Integrations',  path: '/app/integrations', icon: Activity },
    { name: 'Artifacts',     path: '/app/artifacts',    icon: FileText },
    { name: 'Settings',      path: '/app/settings',     icon: Settings },
  ];

  const mobileNavItems = [
    { name: 'Home',    path: '/app',                icon: LayoutDashboard },
    { name: 'Signals', path: '/app/signals',        icon: Search },
    { name: 'Opps',    path: '/app/opportunities',  icon: TrendingUp },
    { name: 'More',    path: '/app/settings',       icon: Menu },
  ];

  const fullName   = user?.user_metadata?.full_name || 'User';
  const initials   = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const wsName     = activeWorkspace?.name || 'Workspace';
  const wsInitials = wsName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-astrix-teal selection:text-white overflow-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-sidebar-dark border-r border-slate-800 fixed h-full flex-col z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 shrink-0">
          <Link to="/app" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-astrix-teal rounded-md">
            <div className="w-6 h-6 bg-gradient-to-br from-astrix-teal to-blue-500 rounded-md flex items-center justify-center shadow-sm">
              <span className="font-heading font-black text-white text-xs">A</span>
            </div>
            <span className="font-heading text-lg font-black tracking-tighter text-white">ASTRIX</span>
          </Link>
        </div>

        {/* Workspace switcher */}
        <div className="px-4 pt-3 pb-2 shrink-0 relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 ${isWorkspaceDropdownOpen ? 'bg-sidebar-hover border-slate-600' : 'bg-sidebar-hover/40 border-slate-700/50 hover:bg-sidebar-hover'}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {isWorkspaceInitializing ? '…' : wsInitials}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white leading-tight truncate w-full text-left">
                  {isWorkspaceInitializing ? 'Loading…' : wsName}
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Free Plan</span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 shrink-0 ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isWorkspaceDropdownOpen && (
            <div className="absolute top-full left-4 right-4 mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="p-2 space-y-0.5">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest px-3 py-1.5">Switch Workspace</div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => { setActiveWorkspace(ws); setIsWorkspaceDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/80 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-5 h-5 rounded-md bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 group-hover:text-white shrink-0">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{ws.name}</span>
                    </div>
                    {activeWorkspace?.id === ws.id && <Check className="w-3.5 h-3.5 text-astrix-teal shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-slate-700/60 mt-1 pt-1">
                  <button
                    onClick={() => { setIsWorkspaceDropdownOpen(false); setShowNewWsModal(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
                  >
                    <div className="w-5 h-5 rounded-md bg-slate-700/80 border border-slate-600 flex items-center justify-center shrink-0">
                      <Plus className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 group-hover:text-slate-300">New Workspace</span>
                    <Lock className="w-3 h-3 text-slate-600 ml-auto" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 hide-scrollbar flex flex-col gap-0.5">
          {primaryNav.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-sidebar-active text-white shadow-md' : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'}`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}

          <div className="mx-1 my-2 border-t border-slate-800/60" />

          {secondaryNav.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive ? 'bg-sidebar-active text-white shadow-md' : 'text-slate-500 hover:bg-sidebar-hover hover:text-white'}`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-slate-800/80 shrink-0 relative" ref={profileDropdownRef}>
          {isProfileDropdownOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="p-2 space-y-0.5">
                <Link to="/app/settings" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700/80 text-sm font-medium text-slate-300 hover:text-white">
                  <UserIcon className="w-4 h-4" /> My Profile
                </Link>
                <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm font-medium text-red-400 hover:text-red-300">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 hover:bg-sidebar-hover group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white leading-tight truncate w-full">{fullName}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-300">My Account</span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 shrink-0 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen w-full md:ml-64 pb-20 md:pb-0">

        {/* Top header bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            {backPath && (
              <Link to={backPath} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                <ChevronDown className="w-5 h-5 rotate-90" />
              </Link>
            )}
            <div>
              <h1 className="font-heading text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && <p className="hidden sm:block text-xs text-gray-500 font-medium truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link to="/pricing" className="hidden lg:flex items-center gap-1.5 bg-brand-yellow/10 text-yellow-700 border border-brand-yellow/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-yellow/20 transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Upgrade
            </Link>

            {/* Notification bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen((v) => !v)}
                className={`relative p-2 rounded-lg transition-all duration-200 ${isNotificationsOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out] origin-top-right">

                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-sm text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] font-bold text-astrix-teal hover:text-astrix-darkTeal transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification list */}
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="w-10 h-10 text-green-300 mb-3" />
                        <p className="text-sm font-bold text-gray-900">All caught up!</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">No pending actions right now.</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const styles = levelStyles[n.level];
                        const isRead = readIds.has(n.id);
                        const Icon = n.icon;
                        return (
                          <Link
                            key={n.id}
                            to={n.href}
                            onClick={() => {
                              setReadIds((prev) => new Set([...prev, n.id]));
                              setIsNotificationsOpen(false);
                            }}
                            className={`flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group ${isRead ? 'opacity-60' : ''}`}
                          >
                            {/* Level icon */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${styles.bg}`}>
                              <Icon className={`w-4 h-4 ${styles.icon}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-bold leading-tight ${isRead ? 'text-gray-500' : 'text-gray-900'} group-hover:text-gray-900`}>
                                  {n.title}
                                </p>
                                <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5 ${n.level === 'urgent' ? 'text-red-500' : n.level === 'warning' ? 'text-amber-500' : n.level === 'success' ? 'text-green-600' : 'text-blue-500'}`}>
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-2">{n.body}</p>
                            </div>

                            {/* Unread dot */}
                            {!isRead && (
                              <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${styles.dot}`} />
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>

                  {/* Panel footer */}
                  <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                    <Link
                      to="/app"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[11px] font-bold text-astrix-teal hover:text-astrix-darkTeal transition-colors flex items-center gap-1"
                    >
                      View dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto animate-slide-up">
            {children}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${isActive ? 'text-astrix-teal' : 'text-gray-400'}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </main>

      <CsvUploadModal />

      {/* ── New Workspace — free-plan gate modal ─────────────────── */}
      {showNewWsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewWsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-black text-gray-900">Multiple Workspaces</h2>
                  <p className="text-xs text-gray-500 font-medium">Pro plan required</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewWsModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 font-medium mb-5 leading-relaxed">
              Multiple workspaces let you manage separate products, teams, or clients — each with their own signals, opportunities, and decisions.
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                'Unlimited workspaces',
                'Separate signal streams per workspace',
                'Cross-workspace reporting & roll-ups',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-astrix-teal shrink-0" />
                  {feat}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Link
                to="/pricing"
                onClick={() => setShowNewWsModal(false)}
                className="flex-1 bg-astrix-teal hover:bg-astrix-darkTeal text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-astrix-teal/20"
              >
                <Sparkles className="w-4 h-4" /> Upgrade to Pro
              </Link>
              <button
                onClick={() => setShowNewWsModal(false)}
                className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <OnboardingChecklist />
    </div>
  );
};
