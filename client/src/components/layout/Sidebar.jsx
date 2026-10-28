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
  const { user, logout, isStudent, isLeader, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/tasks?view=my', icon: CheckSquare },
    { name: 'All Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Students', path: '/students', icon: GraduationCap },
    { name: 'Documents', path: '/documents', icon: FolderOpen },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'User Management', path: '/admin/users', icon: ShieldCheck },
    { name: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 border border-indigo-500/30">
            <FolderKanban className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                STMS Portal
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
                Academic Task Engine
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!isCollapsed && (
            <h4 className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Main Menu
            </h4>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  )
                }
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin Navigation Section */}
        {isAdmin && (
          <div>
            {!isCollapsed && (
              <h4 className="px-3 mb-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 tracking-wider uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Administration
              </h4>
            )}
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    )
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Account Snippet */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800',
            isCollapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
              <div className="mt-0.5">
                <RoleBadge role={user?.role} size="sm" className="text-[10px] px-1.5 py-0" />
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 sticky top-0 h-[100dvh] z-30 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
