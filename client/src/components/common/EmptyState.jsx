import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md', className)}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">{description}</p>}
      {actionText && onAction && (
        <div className="mt-4">
          <Button onClick={onAction} size="sm">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
