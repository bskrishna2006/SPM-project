import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, className, variant = 'default', size = 'sm', ...props }) {
  const base = 'inline-flex items-center font-mono font-medium rounded-md select-none tracking-tight';

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variants = {
    default:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    primary:
      'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
    success:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    info:
      'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60',
    purple:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority, className }) {
  const priorityConfig = {
    Low: { variant: 'default', dotColor: 'bg-slate-400 dark:bg-slate-500', label: 'Low' },
    Medium: { variant: 'info', dotColor: 'bg-sky-500', label: 'Medium' },
    High: { variant: 'warning', dotColor: 'bg-amber-500', label: 'High' },
    Urgent: { variant: 'danger', dotColor: 'bg-rose-500 animate-pulse', label: 'Urgent' },
  };

  const config = priorityConfig[priority] || { variant: 'default', dotColor: 'bg-slate-400', label: priority };
  return (
    <Badge variant={config.variant} className={className}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      {config.label}
    </Badge>
  );
}

export function StatusBadge({ status, className }) {
  const statusConfig = {
    'To Do': { variant: 'default', dotColor: 'bg-slate-400' },
    'In Progress': { variant: 'primary', dotColor: 'bg-indigo-500' },
    'In Review': { variant: 'purple', dotColor: 'bg-purple-500' },
    'Completed': { variant: 'success', dotColor: 'bg-emerald-500' },
  };

  const config = statusConfig[status] || { variant: 'default', dotColor: 'bg-slate-400' };
  return (
    <Badge variant={config.variant} className={className}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      {status}
    </Badge>
  );
}

export function RoleBadge({ role, className }) {
  const roleConfig = {
    admin: { variant: 'purple', label: 'Faculty / Admin' },
    team_leader: { variant: 'primary', label: 'Team Lead' },
    student: { variant: 'default', label: 'Student' },
  };

  const config = roleConfig[role] || { variant: 'default', label: role };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
