import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Calendar,
  Users,
  GraduationCap,
  FolderOpen,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { RoleBadge } from '../common/Badge';

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { user, logout, isAdmin } = useAuth();

  const workspaceNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { name: 'All Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
  ];

  const collabNav = [
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Students', path: '/students', icon: GraduationCap },
    { name: 'Documents', path: '/documents', icon: FolderOpen },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const adminNav = [
    { name: 'User Management', path: '/admin/users', icon: ShieldCheck },
    { name: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const settingsNav = [
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const renderNavGroup = (title, items) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <p className="px-2.5 mb-1.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={() => setIsMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            )
          }
          title={isCollapsed ? item.name : undefined}
        >
          <item.icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          {!isCollapsed && <span className="truncate">{item.name}</span>}
        </NavLink>
      ))}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-100 dark:border-slate-800/90">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-sm">
            <FolderKanban className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-slate-100">
                STMS
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                v1.0
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {renderNavGroup('Workspace', workspaceNav)}
        {renderNavGroup('Collaboration', collabNav)}
        {isAdmin && renderNavGroup('Administration', adminNav)}
        {renderNavGroup('Preferences', settingsNav)}
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-950/30">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] font-mono text-slate-500 truncate capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={logout}
              className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200 ease-in-out h-screen sticky top-0',
          isCollapsed ? 'w-16' : 'w-56'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 h-full z-10">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
