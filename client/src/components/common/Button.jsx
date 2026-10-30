import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]';

  const variants = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 border border-transparent shadow-sm focus-visible:ring-slate-900',
    secondary:
      'bg-slate-100 hover:bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 focus-visible:ring-slate-400',
    outline:
      'border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:text-slate-200 focus-visible:ring-slate-400 shadow-sm',
    ghost:
      'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 focus-visible:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs md:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm md:text-base px-5 py-2.5 gap-2.5',
    icon: 'p-1.5 w-8 h-8',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
