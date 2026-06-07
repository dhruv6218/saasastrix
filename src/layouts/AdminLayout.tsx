import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, TrendingUp,
  LogOut, Menu, X, ChevronRight, Shield, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, actions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fullName = user?.full_name || user?.email || 'Admin';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const nav = [
    { name: 'Overview',    path: '/admin',             icon: LayoutDashboard },
    { name: 'Users',       path: '/admin/users',        icon: Users },
    { name: 'Workspaces',  path: '/admin/workspaces',   icon: Building2 },
    { name: 'Revenue',     path: '/admin/revenue',      icon: TrendingUp },
  ];

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 shrink-0">
        <Link to="/admin" className="flex items-center gap-2 group">
          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-md flex items-center justify-center shadow-sm">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading text-lg font-black tracking-tighter text-white">ADMIN</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded ml-1">Panel</span>
        </Link>
      </div>

      {/* Back to App */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <Link
          to="/app"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Back to App
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                active
                  ? 'bg-red-500/15 text-white border border-red-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-red-400' : ''}`} />
              {item.name}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-red-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-slate-700/50 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-white truncate">{fullName}</div>
            <div className="text-[9px] font-mono text-red-400 uppercase tracking-widest">Super Admin</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-red-500 selection:text-white overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-sidebar-dark border-r border-slate-800 fixed h-full flex-col z-50">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar-dark flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 gap-4 shrink-0 sticky top-0 z-30">
          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-black text-gray-900 tracking-tight truncate">{title}</h1>
              <span className="hidden sm:flex text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Admin</span>
            </div>
            {subtitle && <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
